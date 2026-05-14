<script>
  import { onMount, onDestroy, tick } from "svelte";

  const WINE_STATS_URL = "/api/v1/wine-stats?limit=200";
  const RANKINGS_URL = "https://sos2526-26.onrender.com/api/v2/national-team-rankings-per-years";

  let loading = true;
  let error = "";

  let wines = [];
  let rankings = [];

  let totalWines = 0;
  let totalRankings = 0;
  let mergedRows = [];
  let matchedCountries = 0;

  let chartContainer;
  let chartInstance;

  const fmtDec = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 2 });
  const fmtInt = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 0 });

  // Normaliza texto basico para comparar valores aunque cambien mayusculas o acentos.
  function norm(str) {
    return String(str ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  }

  // Convierte nombres de pais a una clave comun para cruzar ranking y wine-stats.
  function normCountry(str) {
    const cleaned = String(str ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .toLowerCase().replace(/[.,]/g, "").replace(/\s+/g, " ").trim();
    const aliases = {
      espana: "spain", alemania: "germany", francia: "france",
      italia: "italy", "estados unidos": "united states",
      "paises bajos": "netherlands", holanda: "netherlands",
      "reino unido": "united kingdom", "gran bretana": "united kingdom",
      sudafrica: "south africa", "nueva zelanda": "new zealand",
      portugal: "portugal", usa: "united states", uk: "united kingdom",
      england: "united kingdom", argentina: "argentina", chile: "chile",
      australia: "australia", austria: "austria", grecia: "greece",
      greece: "greece", rumania: "romania", hungria: "hungary",
      hungary: "hungary", "republica checa": "czech republic",
    };
    return aliases[cleaned] || cleaned;
  }

  // Convierte claves normalizadas a texto legible para tarjetas y tooltips.
  function titleCase(str) {
    return String(str ?? "").split(/[-\s]+/).filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  }

  // Lee el pais aunque la API externa use nombres de campo distintos.
  function readCountry(row) {
    return row.country ?? row.team ?? row.national_team ?? row.selection ?? row.name ?? "";
  }
  // Extrae el anio del ranking desde cualquiera de los campos esperados.
  function readYear(row) {
    const n = Number(row.year ?? row.ranking_year ?? row.date_year ?? row.season ?? null);
    return Number.isFinite(n) ? n : null;
  }
  // Extrae la posicion FIFA y la convierte a numero.
  function readRank(row) {
    const n = Number(row.rank ?? row.ranking ?? row.position ?? row.team_rank ?? null);
    return Number.isFinite(n) ? n : null;
  }
  // Extrae los puntos del ranking si la API los devuelve.
  function readPoints(row) {
    const n = Number(row.points ?? row.score ?? row.total_points ?? null);
    return Number.isFinite(n) ? n : null;
  }
  // Devuelve una clase visual segun si el ranking es top, medio o normal.
  function severityClass(rank) {
    if (rank == null) return "";
    if (rank <= 10) return "rank-top";
    if (rank <= 30) return "rank-mid";
    return "";
  }

  // ── Render Multi-Gauge ───────────────────────────────────────────────────
  // Muestra un gauge por cada país con ranking FIFA,
  // ordenados por nº de vinos (top 6 más representativos)
  async function renderChart() {
    if (!chartContainer || !mergedRows.length) return;

    const echarts = await import("echarts");
    chartInstance?.dispose();
    chartInstance = echarts.init(chartContainer, null, { renderer: "svg" });

    // Top 6 países con ranking FIFA, ordenados por nº de vinos
    const withRanking = mergedRows
      .filter(r => r.latestRank != null)
      .slice(0, 6);

    // Si hay menos de 2 con ranking, mostrar todos los que haya
    const rows = withRanking.length >= 2 ? withRanking : mergedRows.slice(0, 6);

    const maxRank = 210; // Ranking FIFA máximo ~210 selecciones

    // Posiciones en grid 3×2
    const positions = [
      ["17%", "30%"], ["50%", "30%"], ["83%", "30%"],
      ["17%", "75%"], ["50%", "75%"], ["83%", "75%"],
    ];

    // Color según ranking
    function gaugeColor(rank) {
      if (rank == null) return [
        [1, "#bbb"]
      ];
      const pct = rank / maxRank;
      if (pct <= 0.05) return [[pct, "#4caf50"], [1, "#e8e6e2"]];
      if (pct <= 0.15) return [[pct, "#8bc34a"], [1, "#e8e6e2"]];
      if (pct <= 0.30) return [[pct, "#ff9800"], [1, "#e8e6e2"]];
      return [[pct, "#f44336"], [1, "#e8e6e2"]];
    }

    const series = rows.map((row, i) => {
      const pos = positions[i] || ["50%", "50%"];
      const rank = row.latestRank ?? 0;
      const pct  = Math.round((rank / maxRank) * 100) / 100;

      return {
        type: "gauge",
        center: pos,
        radius: "28%",
        startAngle: 200,
        endAngle: -20,
        min: 0,
        max: maxRank,

        axisLine: {
          lineStyle: {
            width: 14,
            color: gaugeColor(row.latestRank)
          }
        },

        pointer: {
          itemStyle: { color: "auto" },
          length: "60%",
          width: 5
        },

        axisTick:    { show: false },
        splitLine:   { show: false },
        axisLabel:   { show: false },

        title: {
          show: true,
          offsetCenter: [0, "75%"],
          fontSize: 11,
          fontWeight: 700,
          color: "#1a1a1a",
          formatter: titleCase(row.country)
        },

        detail: {
          show: true,
          offsetCenter: [0, "42%"],
          fontSize: 18,
          fontWeight: 700,
          color: "auto",
          formatter: row.latestRank != null
            ? `#${row.latestRank}`
            : "—"
        },

        data: [{
          value: rank,
          name: titleCase(row.country)
        }],

        // Tooltip personalizado por gauge
        tooltip: { show: true }
      };
    });

    chartInstance.setOption({
      backgroundColor: "transparent",

      title: {
        text: "Ranking FIFA de los principales países vinícolas",
        subtext: `Top ${rows.length} países por nº de vinos · Aguja = posición FIFA · Menor número = mejor ranking`,
        left: "center",
        top: 8,
        textStyle:    { fontSize: 14, color: "#1a1a1a", fontWeight: 700 },
        subtextStyle: { fontSize: 11, color: "#888" }
      },

      tooltip: {
        formatter: (params) => {
          const row = rows[params.seriesIndex];
          if (!row) return "";
          return [
            `<b>${titleCase(row.country)}</b>`,
            `Vinos: <b>${fmtInt.format(row.wineCount)}</b>`,
            `Precio medio: £${fmtDec.format(row.avgPrice)}`,
            `ABV medio: ${fmtDec.format(row.avgAbv)} %`,
            row.latestRank   != null ? `Último ranking FIFA: <b>#${row.latestRank}</b>` : "Sin ranking FIFA",
            row.bestRank     != null ? `Mejor ranking FIFA: #${row.bestRank}` : null,
            row.latestRankingYear != null ? `Año del ranking: ${row.latestRankingYear}` : null,
          ].filter(Boolean).join("<br/>");
        }
      },

      series,
      animation: true,
      animationDuration: 1200,
      animationEasing: "elasticOut"
    });

    const onResize = () => chartInstance?.resize();
    window.addEventListener("resize", onResize);
    chartInstance._onResize = onResize;
  }

  // ── Carga de datos ────────────────────────────────────────────────────────
  // Carga ambos datasets, los cruza por pais y prepara la tabla y el gauge.
  async function load() {
    loading = true;
    error = "";

    try {
      const [wRes, rRes] = await Promise.all([
        fetch(WINE_STATS_URL),
        fetch(RANKINGS_URL)
      ]);

      if (!wRes.ok) throw new Error(`wine-stats: ${wRes.status}`);
      if (!rRes.ok) throw new Error(`national-team-rankings: ${rRes.status}`);

      wines    = await wRes.json();
      rankings = await rRes.json();

      const winesArr    = Array.isArray(wines)    ? wines    : [];
      const rankingsArr = Array.isArray(rankings) ? rankings : [];

      totalWines    = winesArr.length;
      totalRankings = rankingsArr.length;

      const wineByCountry = {};
      for (const w of winesArr) {
        const key = normCountry(w.country);
        if (!key) continue;
        if (!wineByCountry[key]) {
          wineByCountry[key] = { rawName: w.country, count: 0, priceSum: 0, abvSum: 0, years: {}, types: {} };
        }
        wineByCountry[key].count++;
        wineByCountry[key].priceSum += Number(w.price) || 0;
        wineByCountry[key].abvSum   += Number(w.abv)   || 0;
        const y = Number(w.year);
        if (Number.isFinite(y)) wineByCountry[key].years[y] = (wineByCountry[key].years[y] || 0) + 1;
        const t = String(w.type ?? "").trim() || "—";
        wineByCountry[key].types[t] = (wineByCountry[key].types[t] || 0) + 1;
      }

      // Debug cruce de países
      console.log("Keys wines:", Object.keys(wineByCountry).sort());

      const rankingByCountry = {};
      for (const r of rankingsArr) {
        const country = readCountry(r);
        const key     = normCountry(country);
        if (!key) continue;
        const year   = readYear(r);
        const rank   = readRank(r);
        const points = readPoints(r);
        if (!rankingByCountry[key]) {
          rankingByCountry[key] = { rawName: country, count: 0, bestRank: null, latestYear: null, latestRank: null, latestPoints: null, byYear: {} };
        }
        const entry = rankingByCountry[key];
        entry.count++;
        if (rank != null && (entry.bestRank == null || rank < entry.bestRank)) entry.bestRank = rank;
        if (year != null) {
          entry.byYear[year] = { rank, points };
          if (entry.latestYear == null || year > entry.latestYear) {
            entry.latestYear   = year;
            entry.latestRank   = rank;
            entry.latestPoints = points;
          }
        }
      }

      // Debug cruce de países
      console.log("Keys rankings:", Object.keys(rankingByCountry).sort());

      mergedRows = Object.entries(wineByCountry)
        .map(([key, w]) => {
          const r = rankingByCountry[key] ?? null;
          const dominantType       = Object.entries(w.types).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
          const mostCommonWineYear = Object.entries(w.years).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
          const sameYearRank       = mostCommonWineYear && r?.byYear?.[mostCommonWineYear] ? r.byYear[mostCommonWineYear].rank : null;
          return {
            country: w.rawName,
            wineCount: w.count,
            avgPrice:  w.priceSum / w.count,
            avgAbv:    w.abvSum   / w.count,
            dominantType,
            mostCommonWineYear,
            latestRankingYear: r?.latestYear   ?? null,
            latestRank:        r?.latestRank   ?? null,
            latestPoints:      r?.latestPoints ?? null,
            bestRank:          r?.bestRank     ?? null,
            sameYearRank
          };
        })
        .sort((a, b) => b.wineCount - a.wineCount);

      matchedCountries = mergedRows.filter(r => r.latestRank !== null || r.bestRank !== null).length;

      loading = false;
      await tick();
      await renderChart();

    } catch (e) {
      error   = e.message || "No se pudo cargar la integración.";
      loading = false;
    }
  }

  onMount(load);
  onDestroy(() => {
    if (chartInstance?._onResize) window.removeEventListener("resize", chartInstance._onResize);
    chartInstance?.dispose();
  });
</script>

<svelte:head>
  <title>National Team Rankings – RMP</title>
</svelte:head>

<div class="page">
  <div class="hero">
    <a href="/integrations/rmp" class="back-link">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M19 12H5M12 5l-7 7 7 7" />
      </svg>
      Integraciones RMP
    </a>
    <div class="hero-badge">USO 03 · Integración externa</div>
    <h1>National Team Rankings <span class="accent">(per years)</span></h1>
    <p class="hero-desc">
      Cruce entre los países presentes en vinos y los rankings históricos
      de selecciones nacionales de fútbol por año.
    </p>
  </div>

  <section class="source-grid">
    <a class="source-card" href="/api/v1/wine-stats" target="_blank" rel="noopener">
      <span>API propia</span>
      <strong>SOS2526-29 · wine-stats</strong>
    </a>
    <a class="source-card" href={RANKINGS_URL} target="_blank" rel="noopener">
      <span>API externa / proxy</span>
      <strong>National team rankings per years</strong>
    </a>
  </section>

  <div class="toolbar">
    <button on:click={load}>↺ Actualizar</button>
  </div>

  {#if loading}
    <div class="status-box">Cargando integración…</div>
  {:else if error}
    <div class="status-box error">{error}</div>
  {:else}
    <div class="summary-row">
      <div class="summary-card">
        <span class="summary-num">{fmtInt.format(totalWines)}</span>
        <span class="summary-label">vinos en wine-stats</span>
      </div>
      <div class="summary-card">
        <span class="summary-num">{fmtInt.format(totalRankings)}</span>
        <span class="summary-label">registros de ranking</span>
      </div>
      <div class="summary-card">
        <span class="summary-num">{fmtInt.format(mergedRows.length)}</span>
        <span class="summary-label">países productores de vino</span>
      </div>
      <div class="summary-card">
        <span class="summary-num">{fmtInt.format(matchedCountries)}</span>
        <span class="summary-label">con datos futbolísticos</span>
      </div>
    </div>

    <section class="chart-panel">
      <h2 class="section-title">Velocímetros de ranking FIFA por país vinícola</h2>
      <p class="chart-note">
        Cada velocímetro muestra el último ranking FIFA de un país productor de vino.
        <span style="color:#4caf50;font-weight:600">Verde</span> = top 10 ·
        <span style="color:#8bc34a;font-weight:600">Lima</span> = top 30 ·
        <span style="color:#ff9800;font-weight:600">Naranja</span> = top 60 ·
        <span style="color:#f44336;font-weight:600">Rojo</span> = resto.
        Hover para ver detalles.
      </p>
      <div bind:this={chartContainer} style="width: 100%; height: 560px;"></div>
    </section>

  {/if}
</div>

<style>
  .page { max-width: 1060px; margin: 0 auto; padding: 2.5rem 1.5rem 4rem; }
  .back-link {
    display: inline-flex; align-items: center; gap: 0.4rem;
    font-size: 0.8125rem; color: #6b6b6b; text-decoration: none;
    margin-bottom: 1.75rem; transition: color 160ms ease;
  }
  .back-link:hover { color: #01696f; }
  .hero { margin-bottom: 2rem; }
  .hero-badge {
    display: inline-block; font-size: 0.7rem; font-weight: 700;
    letter-spacing: 0.1em; text-transform: uppercase; color: #01696f;
    background: color-mix(in oklch, #01696f 12%, transparent);
    border: 1px solid color-mix(in oklch, #01696f 25%, transparent);
    border-radius: 9999px; padding: 0.2rem 0.65rem; margin-bottom: 0.75rem;
  }
  h1 { font-size: clamp(1.5rem, 3.5vw, 2.25rem); font-weight: 700; line-height: 1.2; color: #1a1a1a; margin-bottom: 0.6rem; }
  .accent { color: #01696f; }
  .hero-desc { font-size: 0.9375rem; color: #6b6b6b; max-width: 56ch; line-height: 1.6; }
  .status-box { padding: 1.5rem; border-radius: 8px; background: #f9f8f5; color: #777; font-size: 0.9rem; text-align: center; }
  .status-box.error { color: #a12c7b; }
  .source-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin: 1rem 0 1.5rem; }
  .source-card {
    display: grid; gap: 4px; padding: 14px; border: 1px solid #e8e6e2;
    border-radius: 10px; background: #fff; text-decoration: none; color: inherit;
    box-shadow: 0 4px 12px rgba(0,0,0,0.03); transition: box-shadow 160ms ease;
  }
  .source-card:hover { box-shadow: 0 8px 20px rgba(0,0,0,0.08); }
  .source-card span { color: #777; font-size: 0.82rem; }
  .source-card strong { color: #1a1a1a; font-size: 0.95rem; word-break: break-all; }
  .toolbar { margin-bottom: 1.5rem; }
  button {
    min-height: 40px; border: 0; border-radius: 9999px; background: #01696f;
    color: #fff; padding: 0 18px; font: inherit; font-weight: 700;
    font-size: 0.875rem; cursor: pointer; transition: background 160ms ease;
  }
  button:hover { background: #005a5f; }
  .summary-row { display: flex; gap: 1rem; margin-bottom: 2.5rem; flex-wrap: wrap; }
  .summary-card {
    flex: 1; min-width: 140px; background: #fff; border: 1px solid #e8e6e2;
    border-radius: 10px; padding: 1.25rem 1.5rem; display: flex; flex-direction: column; gap: 0.25rem;
  }
  .summary-num { font-size: 2rem; font-weight: 700; color: #01696f; font-variant-numeric: tabular-nums; line-height: 1; }
  .summary-label { font-size: 0.8rem; color: #777; }
  .chart-panel { background: #fff; border: 1px solid #e8e6e2; border-radius: 10px; padding: 1.5rem; margin-bottom: 3rem; overflow: hidden; }
  .section-title { font-size: 1.1rem; font-weight: 600; color: #1a1a1a; margin-bottom: 0.75rem; }
  .chart-note { font-size: 0.8rem; color: #888; margin-bottom: 1rem; }
  section { margin-bottom: 3rem; }
  .table-note { font-size: 0.8rem; color: #888; margin-bottom: 1rem; }
  .table-note code { background: #f3f0ec; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 0.78rem; }
  .table-wrap { overflow-x: auto; border: 1px solid #e8e6e2; border-radius: 10px; }
  table { width: 100%; border-collapse: collapse; font-size: 0.8375rem; }
  thead tr { background: #f3f0ec; }
  th {
    text-align: left; padding: 0.65rem 1rem; font-weight: 600; font-size: 0.75rem;
    text-transform: uppercase; letter-spacing: 0.05em; color: #777;
    white-space: nowrap; border-bottom: 1px solid #e8e6e2;
  }
  td { padding: 0.6rem 1rem; border-bottom: 1px solid #ebebeb; color: #1a1a1a; vertical-align: middle; }
  tbody tr:last-child td { border-bottom: none; }
  tbody tr:hover { background: #f9f8f5; }
  tbody tr.rank-top { background: #eef7ea; }
  tbody tr.rank-mid { background: #fffbeb; }
  .td-country { font-weight: 500; white-space: nowrap; }
  .td-num { font-variant-numeric: tabular-nums; text-align: right; white-space: nowrap; }
  @media (max-width: 480px) {
    .page { padding: 1.5rem 1rem 3rem; }
    .summary-row { flex-direction: column; }
  }
</style>
