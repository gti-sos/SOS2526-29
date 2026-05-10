<script>
  import { onMount } from "svelte";

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

  const fmtDec = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 2 });
  const fmtInt = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 0 });

  // Normalización básica de texto (acentos, mayúsculas)
  function norm(str) {
    return String(str ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  // Normalización de país: convierte español → inglés para cruzar datasets
  function normCountry(str) {
    const cleaned = String(str ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[.,]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    const aliases = {
      spain:    "spain",
      espana:   "spain",
      germany:  "germany",
      alemania: "germany"
    };

    return aliases[cleaned] || cleaned;
  }

  function titleCase(str) {
    return String(str ?? "")
      .split(/[-\s]+/)
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }

  function readCountry(row) {
    return row.country ?? row.team ?? row.national_team ?? row.selection ?? row.name ?? "";
  }

  function readYear(row) {
    const value = row.year ?? row.ranking_year ?? row.date_year ?? row.season ?? null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }

  function readRank(row) {
    const value = row.rank ?? row.ranking ?? row.position ?? row.team_rank ?? null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }

  function readPoints(row) {
    const value = row.points ?? row.score ?? row.total_points ?? null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }

  function severityClass(rank) {
    if (rank == null) return "";
    if (rank <= 10) return "rank-top";
    if (rank <= 30) return "rank-mid";
    return "";
  }

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

      wines = await wRes.json();
      rankings = await rRes.json();

      const winesArr = Array.isArray(wines) ? wines : [];
      const rankingsArr = Array.isArray(rankings) ? rankings : [];

      totalWines = winesArr.length;
      totalRankings = rankingsArr.length;

      // ---- Agrupar vinos por país (clave normalizada con traducción) ----
      const wineByCountry = {};
      for (const w of winesArr) {
        const key = normCountry(w.country);  // <-- CAMBIADO
        if (!key) continue;

        if (!wineByCountry[key]) {
          wineByCountry[key] = {
            rawName: w.country,
            count: 0,
            priceSum: 0,
            abvSum: 0,
            years: {},
            types: {}
          };
        }

        wineByCountry[key].count++;
        wineByCountry[key].priceSum += Number(w.price) || 0;
        wineByCountry[key].abvSum += Number(w.abv) || 0;

        const y = Number(w.year);
        if (Number.isFinite(y)) {
          wineByCountry[key].years[y] = (wineByCountry[key].years[y] || 0) + 1;
        }

        const t = String(w.type ?? "").trim() || "—";
        wineByCountry[key].types[t] = (wineByCountry[key].types[t] || 0) + 1;
      }

      // ---- Agrupar rankings por país (clave normalizada con traducción) ----
      const rankingByCountry = {};
      for (const r of rankingsArr) {
        const country = readCountry(r);
        const key = normCountry(country);  // <-- CAMBIADO
        if (!key) continue;

        const year = readYear(r);
        const rank = readRank(r);
        const points = readPoints(r);

        if (!rankingByCountry[key]) {
          rankingByCountry[key] = {
            rawName: country,
            count: 0,
            bestRank: null,
            latestYear: null,
            latestRank: null,
            latestPoints: null,
            byYear: {}
          };
        }

        const entry = rankingByCountry[key];
        entry.count++;

        if (rank != null && (entry.bestRank == null || rank < entry.bestRank)) {
          entry.bestRank = rank;
        }

        if (year != null) {
          entry.byYear[year] = { rank, points };
          if (entry.latestYear == null || year > entry.latestYear) {
            entry.latestYear = year;
            entry.latestRank = rank;
            entry.latestPoints = points;
          }
        }
      }

      // ---- Cruzar ambos datasets ----
      mergedRows = Object.entries(wineByCountry)
        .map(([key, w]) => {
          const r = rankingByCountry[key] ?? null;

          const dominantType =
            Object.entries(w.types).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

          const mostCommonWineYear =
            Object.entries(w.years)
              .sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

          const sameYearRank =
            mostCommonWineYear && r?.byYear?.[mostCommonWineYear]
              ? r.byYear[mostCommonWineYear].rank
              : null;

          return {
            country: w.rawName,
            wineCount: w.count,
            avgPrice: w.priceSum / w.count,
            avgAbv: w.abvSum / w.count,
            dominantType,
            mostCommonWineYear,
            latestRankingYear: r?.latestYear ?? null,
            latestRank: r?.latestRank ?? null,
            latestPoints: r?.latestPoints ?? null,
            bestRank: r?.bestRank ?? null,
            sameYearRank
          };
        })
        .sort((a, b) => b.wineCount - a.wineCount);

      matchedCountries = mergedRows.filter(
        (row) => row.latestRank !== null || row.bestRank !== null
      ).length;

    } catch (e) {
      error = e.message || "No se pudo cargar la integración.";
    } finally {
      loading = false;
    }
  }

  onMount(load);
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
    <h1>
      National Team Rankings <span class="accent">(per years)</span>
    </h1>
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

    <section>
      <h2 class="section-title">Cruce por país</h2>
      <p class="table-note">
        Se calcula el promedio de precio y graduación de los vinos y se
        enlaza con el mejor y último ranking disponible de la selección nacional.
      </p>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>País</th>
              <th>Nº vinos</th>
              <th>Precio medio (£)</th>
              <th>ABV medio (%)</th>
              <th>Tipo dominante</th>
              <th>Año vino más común</th>
              <th>Rank mismo año</th>
              <th>Último año ranking</th>
              <th>Último rank</th>
              <th>Mejor rank</th>
              <th>Puntos</th>
            </tr>
          </thead>
          <tbody>
            {#each mergedRows as row}
              <tr class={severityClass(row.latestRank)}>
                <td class="td-country">{titleCase(row.country)}</td>
                <td class="td-num">{row.wineCount}</td>
                <td class="td-num">{fmtDec.format(row.avgPrice)}</td>
                <td class="td-num">{fmtDec.format(row.avgAbv)}</td>
                <td>{row.dominantType}</td>
                <td class="td-num">{row.mostCommonWineYear ?? "—"}</td>
                <td class="td-num">{row.sameYearRank ?? "—"}</td>
                <td class="td-num">{row.latestRankingYear ?? "—"}</td>
                <td class="td-num">{row.latestRank ?? "—"}</td>
                <td class="td-num">{row.bestRank ?? "—"}</td>
                <td class="td-num">
                  {row.latestPoints != null ? fmtDec.format(row.latestPoints) : "—"}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </section>
  {/if}
</div>

<style>
  .page {
    max-width: 1060px;
    margin: 0 auto;
    padding: 2.5rem 1.5rem 4rem;
  }

  .back-link {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.8125rem;
    color: #6b6b6b;
    text-decoration: none;
    margin-bottom: 1.75rem;
    transition: color 160ms ease;
  }
  .back-link:hover { color: #01696f; }

  .hero { margin-bottom: 2rem; }
  .hero-desc {
    font-size: 0.9375rem;
    color: #6b6b6b;
    max-width: 56ch;
    line-height: 1.6;
    margin: 0 auto;
    text-align: center;
    }

  .hero-badge {
    display: inline-block;
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #01696f;
    background: color-mix(in oklch, #01696f 12%, transparent);
    border: 1px solid color-mix(in oklch, #01696f 25%, transparent);
    border-radius: 9999px;
    padding: 0.2rem 0.65rem;
    margin-bottom: 0.75rem;
  }

  h1 {
    font-size: clamp(1.5rem, 3.5vw, 2.25rem);
    font-weight: 700;
    line-height: 1.2;
    color: #1a1a1a;
    margin-bottom: 0.6rem;
  }

  .accent { color: #01696f; }

  .hero-desc {
    font-size: 0.9375rem;
    color: #6b6b6b;
    max-width: 56ch;
    line-height: 1.6;
  }

  .status-box {
    padding: 1.5rem;
    border-radius: 8px;
    background: #f9f8f5;
    color: #777;
    font-size: 0.9rem;
    text-align: center;
  }
  .status-box.error { color: #a12c7b; }

  .source-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 12px;
    margin: 1rem 0 1.5rem;
  }
  .source-card {
    display: grid;
    gap: 4px;
    padding: 14px;
    border: 1px solid #e8e6e2;
    border-radius: 10px;
    background: #fff;
    text-decoration: none;
    color: inherit;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
    transition: box-shadow 160ms ease;
  }
  .source-card:hover { box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08); }
  .source-card span { color: #777; font-size: 0.82rem; }
  .source-card strong { color: #1a1a1a; font-size: 0.95rem; word-break: break-all; }

  .toolbar { margin-bottom: 1.5rem; }

  button {
    min-height: 40px;
    border: 0;
    border-radius: 9999px;
    background: #01696f;
    color: #fff;
    padding: 0 18px;
    font: inherit;
    font-weight: 700;
    font-size: 0.875rem;
    cursor: pointer;
    transition: background 160ms ease;
  }
  button:hover { background: #005a5f; }

  .summary-row {
    display: flex;
    gap: 1rem;
    margin-bottom: 2.5rem;
    flex-wrap: wrap;
  }
  .summary-card {
    flex: 1;
    min-width: 140px;
    background: #fff;
    border: 1px solid #e8e6e2;
    border-radius: 10px;
    padding: 1.25rem 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  .summary-num {
    font-size: 2rem;
    font-weight: 700;
    color: #01696f;
    font-variant-numeric: tabular-nums;
    line-height: 1;
  }
  .summary-label {
    font-size: 0.8rem;
    color: #777;
  }

  section { margin-bottom: 3rem; }

  .section-title {
    font-size: 1.1rem;
    font-weight: 600;
    color: #1a1a1a;
    margin-bottom: 0.75rem;
  }

  .table-note {
    font-size: 0.8rem;
    color: #888;
    margin-bottom: 1rem;
  }
  .table-note code {
    background: #f3f0ec;
    padding: 2px 6px;
    border-radius: 4px;
    font-family: monospace;
    font-size: 0.78rem;
  }

  .table-wrap {
    overflow-x: auto;
    border: 1px solid #e8e6e2;
    border-radius: 10px;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.8375rem;
  }
  thead tr { background: #f3f0ec; }

  th {
    text-align: left;
    padding: 0.65rem 1rem;
    font-weight: 600;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #777;
    white-space: nowrap;
    border-bottom: 1px solid #e8e6e2;
  }

  td {
    padding: 0.6rem 1rem;
    border-bottom: 1px solid #ebebeb;
    color: #1a1a1a;
    vertical-align: middle;
  }

  tbody tr:last-child td { border-bottom: none; }
  tbody tr:hover { background: #f9f8f5; }
  tbody tr.rank-top { background: #eef7ea; }
  tbody tr.rank-mid { background: #fffbeb; }

  .td-country { font-weight: 500; white-space: nowrap; }
  .td-num {
    font-variant-numeric: tabular-nums;
    text-align: right;
    white-space: nowrap;
  }

  @media (max-width: 480px) {
    .page { padding: 1.5rem 1rem 3rem; }
    .summary-row { flex-direction: column; }
  }
</style>