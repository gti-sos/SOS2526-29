<script>
  import { onDestroy, onMount, tick } from "svelte";

  const WINE_STATS_URL = "/api/v1/wine-stats?limit=200";
  const HYDRO_URL = "https://sos2526-27.onrender.com/api/v1/world-hydroelectric-plants";
  const HYDRO_LOAD_URL = "https://sos2526-27.onrender.com/api/v1/world-hydroelectric-plants/loadInitialData";

  let Highcharts;
  let chartContainer;
  let stockChart;

  let loading = true;
  let error = "";

  let totalWines = 0;
  let totalPlants = 0;
  let crossRows = [];
  let matchedCountries = 0;
  let chartSeries = [];
  let chartWidth = null;

  const fmtDec = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 2 });
  const fmtInt = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 0 });

  // Convierte texto normalizado a formato titulo.
  function titleCase(str) {
    return String(str ?? "")
      .split(/[-\s]+/)
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }

  // Normaliza paises para poder cruzar datos hidroelectricos con vinos.
  function normCountry(str) {
    const cleaned = String(str ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[.,]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    if (cleaned === "spain" || cleaned === "espana") return "spain";
    if (cleaned === "germany" || cleaned === "alemania") return "germany";

    return cleaned;
  }

  // Carga Highcharts y modulos necesarios para el grafico dumbbell.
  async function loadHighcharts() {
    if (Highcharts) return;
    const mod = await import("highcharts/highstock");
    Highcharts = mod.default;
    window._Highcharts = Highcharts;
    await import("highcharts/modules/accessibility");
    await import("highcharts/themes/adaptive");
  }

  // Obtiene datos hidroelectricos y carga inicial si la API externa esta vacia.
  async function fetchHydroData() {
    let res = await fetch(HYDRO_URL);
    if (!res.ok) throw new Error(`world-hydroelectric-plants: ${res.status}`);

    let data = await res.json();

    if (Array.isArray(data) && data.length === 0) {
      const loadRes = await fetch(HYDRO_LOAD_URL);
      if (!loadRes.ok) throw new Error(`loadInitialData: ${loadRes.status}`);

      res = await fetch(HYDRO_URL);
      if (!res.ok) throw new Error(`world-hydroelectric-plants: ${res.status}`);

      data = await res.json();
    }

    return Array.isArray(data) ? data : [];
  }

  // Construye las series del grafico agrupadas por pais/anio.
  function buildChartSeries(hydroByCountryYear) {
    const palette = {
      spain: "#01696f",
      germany: "#437a22"
    };

    return Object.entries(hydroByCountryYear).map(([country, years]) => {
      const points = Object.entries(years)
        .map(([year, capacity]) => [Date.UTC(Number(year), 0, 1), Math.round(capacity * 100) / 100])
        .sort((a, b) => a[0] - b[0]);

      return {
        name: titleCase(country),
        type: "area",
        threshold: null,
        color: palette[country] || undefined,
        tooltip: { valueDecimals: 2, valueSuffix: " MW" },
        data: points
      };
    });
  }

  // Renderiza el grafico comparando unidades de vino y capacidad hidroelectrica.
  function renderChart() {
    if (!chartContainer || !Highcharts || !chartSeries.length) return;

    stockChart?.destroy();

    stockChart = Highcharts.stockChart(chartContainer, {
      chart: {
        height: 400,
        backgroundColor: "transparent"
      },

      title: {
        text: "Capacidad hidroeléctrica por año en países con vinos"
      },

      subtitle: {
        text: "Serie temporal agregada desde world-hydroelectric-plants"
      },

      rangeSelector: {
        selected: 1
      },

      navigator: {
        enabled: true
      },

      legend: {
        enabled: true
      },

      accessibility: {
        enabled: true,
        description:
          "Gráfico temporal con la capacidad hidroeléctrica agregada por año para los países presentes en wine-stats."
      },

      yAxis: {
        title: {
          text: "Capacidad (MW)"
        }
      },

      tooltip: {
        shared: true
      },

      responsive: {
        rules: [
          {
            condition: { maxWidth: 500 },
            chartOptions: {
              chart: { height: 300 },
              subtitle: { text: null },
              navigator: { enabled: false }
            }
          }
        ]
      },

      series: chartSeries,

      credits: { enabled: false }
    });
  }

  // Cambia la altura del grafico segun el modo elegido por el usuario.
  function setChartSize(mode) {
    if (!stockChart) return;
    if (mode === "small") {
      chartWidth = 400;
      stockChart.setSize(400);
    } else if (mode === "large") {
      chartWidth = 800;
      stockChart.setSize(800);
    } else {
      chartWidth = null;
      stockChart.setSize(null);
    }
  }

  // Carga vinos + hidroelectricas, cruza datos y pinta la visualizacion.
  async function load() {
    loading = true;
    error = "";

    try {
      const [wineRes, hydroData] = await Promise.all([
        fetch(WINE_STATS_URL),
        fetchHydroData()
      ]);

      if (!wineRes.ok) throw new Error(`wine-stats: ${wineRes.status}`);

      const wines = await wineRes.json();
      const winesArr = Array.isArray(wines) ? wines : [];
      const hydroArr = Array.isArray(hydroData) ? hydroData : [];

      totalWines = winesArr.length;
      totalPlants = hydroArr.length;

      const wineByCountry = {};
      for (const w of winesArr) {
        const key = normCountry(w.country);
        if (!key) continue;

        if (!wineByCountry[key]) {
          wineByCountry[key] = {
            rawName: w.country,
            count: 0,
            priceSum: 0,
            abvSum: 0,
            types: {}
          };
        }

        wineByCountry[key].count++;
        wineByCountry[key].priceSum += Number(w.price) || 0;
        wineByCountry[key].abvSum += Number(w.abv) || 0;
        wineByCountry[key].types[w.type] = (wineByCountry[key].types[w.type] || 0) + 1;
      }

      const hydroByCountry = {};
      const hydroByCountryYear = {};

      for (const h of hydroArr) {
        const key = normCountry(h.country);
        const year = Number(h.year);
        const capacity = Number(h.capacity_mw) || 0;
        const head = Number(h.head_m) || 0;
        const reservoir = Number(h.res_vol_km3) || 0;
        const type = h.plant_type ?? "—";

        if (!key) continue;

        if (!hydroByCountry[key]) {
          hydroByCountry[key] = {
            plantCount: 0,
            totalCapacity: 0,
            totalHead: 0,
            totalReservoir: 0,
            types: {}
          };
        }

        hydroByCountry[key].plantCount++;
        hydroByCountry[key].totalCapacity += capacity;
        hydroByCountry[key].totalHead += head;
        hydroByCountry[key].totalReservoir += reservoir;
        hydroByCountry[key].types[type] = (hydroByCountry[key].types[type] || 0) + 1;

        if (Number.isFinite(year)) {
          if (!hydroByCountryYear[key]) hydroByCountryYear[key] = {};
          hydroByCountryYear[key][year] = (hydroByCountryYear[key][year] || 0) + capacity;
        }
      }

      crossRows = Object.entries(wineByCountry)
        .map(([key, w]) => {
          const h = hydroByCountry[key] ?? null;
          const dominantWineType =
            Object.entries(w.types).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
          const dominantPlantType = h
            ? Object.entries(h.types).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—"
            : null;

          return {
            country: w.rawName,
            wineCount: w.count,
            avgPrice: w.priceSum / w.count,
            avgAbv: w.abvSum / w.count,
            dominantWineType,
            plantCount: h?.plantCount ?? 0,
            totalCapacity: h?.totalCapacity ?? null,
            avgHead: h ? h.totalHead / h.plantCount : null,
            totalReservoir: h?.totalReservoir ?? null,
            dominantPlantType
          };
        })
        .sort((a, b) => b.wineCount - a.wineCount);

      matchedCountries = crossRows.filter((r) => r.totalCapacity !== null).length;
      chartSeries = buildChartSeries(hydroByCountryYear);

      loading = false;
      await tick();
      await loadHighcharts();
      renderChart();
    } catch (e) {
      error = e.message || "No se pudo cargar la integración.";
      loading = false;
    }
  }

  // Arranca la integracion al montar la pantalla.
  onMount(load);
  onDestroy(() => stockChart?.destroy());
</script>

<svelte:head>
  <title>World Hydroelectric Plant – RMP</title>
</svelte:head>

<div class="page">
  <div class="hero">
    <a href="/integrations/rmp" class="back-link">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M19 12H5M12 5l-7 7 7 7" />
      </svg>
      Integraciones RMP
    </a>

    <div class="hero-badge">USO 05 · Integración externa</div>
    <h1>
      World Hydroelectric Plant <span class="accent">(SOS2526-27)</span>
    </h1>
    <p class="hero-desc">
      Cruce entre los países de <code>wine-stats</code> y plantas hidroeléctricas mundiales,
      con análisis por país y serie temporal de capacidad instalada.
    </p>
  </div>

  <section class="source-grid">
    <a
      class="source-card"
      href="https://sos2526-27.onrender.com/api/v1/world-hydroelectric-plants"
      target="_blank"
      rel="noopener"
    >
      <span>API alumno SOS (distinto grupo)</span>
      <strong>SOS2526-27 · world-hydroelectric-plants</strong>
    </a>

    <a
      class="source-card"
      href="https://sos2526-27.onrender.com/api/v1/world-hydroelectric-plants/loadInitialData"
      target="_blank"
      rel="noopener"
    >
      <span>Carga inicial</span>
      <strong>loadInitialData</strong>
    </a>

    <a class="source-card" href="/api/v1/wine-stats" target="_blank" rel="noopener">
      <span>API propia</span>
      <strong>SOS2526-29 · wine-stats</strong>
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
        <span class="summary-num">{fmtInt.format(totalPlants)}</span>
        <span class="summary-label">plantas hidroeléctricas</span>
      </div>
      <div class="summary-card">
        <span class="summary-num">{fmtInt.format(crossRows.length)}</span>
        <span class="summary-label">países productores de vino</span>
      </div>
      <div class="summary-card">
        <span class="summary-num">{fmtInt.format(matchedCountries)}</span>
        <span class="summary-label">con datos hidroeléctricos</span>
      </div>
    </div>

    <section class="chart-panel">
      <h2 class="section-title">Capacidad hidroeléctrica por año</h2>
      <p class="chart-note">
        Serie temporal agregada en MW para los países presentes en tus datos de vino.
      </p>

      <div bind:this={chartContainer} id="container" class="chart-frame"></div>

      <div class="button-row">
        <button class="highcharts-demo-button" on:click={() => setChartSize("large")}>Large</button>
        <button class="highcharts-demo-button" on:click={() => setChartSize("small")}>Small</button>
        <button class="highcharts-demo-button" on:click={() => setChartSize("auto")}>Auto</button>
      </div>
    </section>

    <section>
      <h2 class="section-title">
        Cruce: países productores de vino vs. plantas hidroeléctricas
      </h2>
      <p class="table-note">
        Se cruzan los países de <strong>wine-stats</strong> con la API
        <code>world-hydroelectric-plants</code> usando normalización mínima de nombres.
      </p>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>País</th>
              <th>Nº vinos</th>
              <th>Precio medio (£)</th>
              <th>ABV medio (%)</th>
              <th>Tipo vino dominante</th>
              <th>Plantas</th>
              <th>Capacidad total (MW)</th>
              <th>Altura media (m)</th>
              <th>Reservorio total (km³)</th>
              <th>Tipo planta dominante</th>
            </tr>
          </thead>
          <tbody>
            {#each crossRows as row}
              <tr>
                <td class="td-country">{titleCase(row.country)}</td>
                <td class="td-num">{row.wineCount}</td>
                <td class="td-num">{fmtDec.format(row.avgPrice)}</td>
                <td class="td-num">{fmtDec.format(row.avgAbv)}</td>
                <td>{row.dominantWineType}</td>
                <td class="td-num">{row.plantCount || "—"}</td>
                <td class="td-num">
                  {row.totalCapacity !== null ? fmtDec.format(row.totalCapacity) : "—"}
                </td>
                <td class="td-num">
                  {row.avgHead !== null ? fmtDec.format(row.avgHead) : "—"}
                </td>
                <td class="td-num">
                  {row.totalReservoir !== null ? fmtDec.format(row.totalReservoir) : "—"}
                </td>
                <td>{row.dominantPlantType ?? "—"}</td>
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

  .chart-panel {
    background: #fff;
    border: 1px solid #e8e6e2;
    border-radius: 10px;
    padding: 1.5rem;
    margin-bottom: 3rem;
    overflow: hidden;
  }
  .section-title {
    font-size: 1.1rem;
    font-weight: 600;
    color: #1a1a1a;
    margin-bottom: 0.75rem;
  }
  .chart-note {
    font-size: 0.8rem;
    color: #888;
    margin-bottom: 1rem;
  }
  .chart-frame {
    min-width: 310px;
    max-width: 800px;
    min-height: 400px;
    margin: 0.5em auto;
  }

  
  .button-row {
    max-width: 800px;
    margin: 0.5em auto;
  }

  .highcharts-demo-button {
    background: var(--highcharts-neutral-color-5, #f2f2f2);
    border: none;
    border-radius: 4px;
    color: var(--highcharts-neutral-color-100, #000);
    cursor: pointer;
    display: inline-block;
    font-size: 0.8rem;
    padding: 0.5rem 1.5rem;
    margin: 0.5rem -5px 0.5rem 10px;
    min-height: auto;
  }

  .highcharts-demo-button:hover {
    background: var(--highcharts-neutral-color-10, #e6e6e6);
  }

  section { margin-bottom: 3rem; }

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
  tbody tr:nth-child(even) { background: #f9f8f5; }
  tbody tr:hover { background: #f3f0ec; }

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
