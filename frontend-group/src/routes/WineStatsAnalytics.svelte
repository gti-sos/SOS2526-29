<script>
  import { onDestroy, onMount, tick } from "svelte";
  import { getAllWineStats } from "../services/wine-stats.js";

  let Highcharts;
  let container;
  let heatmapContainer;
  let charts = [];
  let heatmapChart;
  let loading = true;
  let error = "";
  let wines = [];

async function loadHighcharts() {
  if (Highcharts) return Highcharts;
  const module = await import("highcharts");
  Highcharts = module.default;
  window._Highcharts = Highcharts;

  const accMod = await import("highcharts/modules/accessibility.js");
  const accFn = accMod.default ?? accMod;
  if (typeof accFn === "function") accFn(Highcharts);

  const heatMod = await import("highcharts/modules/heatmap.js");
  const heatFn = heatMod.default ?? heatMod;
  if (typeof heatFn === "function") heatFn(Highcharts);

  return Highcharts;
}

  function syncExtremes(e) {
    const thisChart = this.chart;
    if (e.trigger !== "syncExtremes") {
      Highcharts.charts.forEach((chart) => {
        if (chart && chart !== thisChart && chart.xAxis[0].setExtremes) {
          chart.xAxis[0].setExtremes(e.min, e.max, undefined, false, {
            trigger: "syncExtremes"
          });
        }
      });
    }
  }

  function resetZoom(e) {
    if (e.resetSelection) return;
    Highcharts.charts.forEach((chart) => {
      if (chart && chart !== e.target) chart.zoomOut();
    });
  }

  function bindSync() {
    ["mousemove", "touchmove", "touchstart"].forEach((eventType) => {
      container.addEventListener(eventType, function (e) {
        Highcharts.charts.forEach((chart) => {
          if (!chart) return;
          try {
            const event = chart.pointer.normalize(e);
            const point = chart.series[0].searchPoint(event, true);
            if (point) {
              point.onMouseOver();
              chart.tooltip.refresh(point);
              chart.xAxis[0].drawCrosshair(event, point);
            }
          } catch (_) {}
        });
      });
    });

    Highcharts.Pointer.prototype.reset = function () {
      return undefined;
    };
  }

  function renderCharts() {
    charts.forEach((c) => c?.destroy());
    charts = [];

    const categories = wines.map((w) =>
      w.title.length > 20 ? w.title.slice(0, 20) + "…" : w.title
    );

    const datasets = [
      {
        name: "Precio (€)",
        unit: "€",
        decimals: 2,
        color: "#2563eb",
        data: wines.map((w, i) => [i, Number(w.price)]),
        description: "Precio de cada vino en euros"
      },
      {
        name: "Graduación alcohólica (%)",
        unit: "%",
        decimals: 1,
        color: "#7c3aed",
        data: wines.map((w, i) => [i, Number(w.abv)]),
        description: "Porcentaje de alcohol de cada vino"
      },
      {
        name: "Capacidad (cl)",
        unit: " cl",
        decimals: 0,
        color: "#0f766e",
        data: wines.map((w, i) => [i, Number(w.capacity)]),
        description: "Capacidad en centilitros de cada vino"
      }
    ];

    datasets.forEach((dataset) => {
      const chartDiv = document.createElement("div");
      chartDiv.className = "chart-frame";
      container.appendChild(chartDiv);

      const c = Highcharts.chart(chartDiv, {
        chart: {
          type: "area",
          marginLeft: 60,
          spacingTop: 20,
          spacingBottom: 20,
          backgroundColor: "transparent",
          zooming: { type: "x" },
          events: { selection: resetZoom }
        },
        title: {
          text: dataset.name,
          align: "left",
          margin: 0,
          x: 10,
          style: { fontSize: "14px", color: "#111827" }
        },
        credits: { enabled: false },
        legend: { enabled: false },
        xAxis: {
          categories: categories,
          crosshair: true,
          events: { setExtremes: syncExtremes },
          labels: { rotation: -30, style: { fontSize: "10px" } },
          accessibility: { description: "Nombre del vino" }
        },
        yAxis: { title: { text: dataset.unit }, min: 0 },
        tooltip: {
          fixed: true,
          position: { align: "right", relativeTo: "spacingBox", y: -2 },
          padding: 6,
          headerFormat: "<b>{point.key}</b><br/>",
          pointFormat: `{series.name}: <b>{point.y} ${dataset.unit}</b>`,
          backgroundColor: "#fff",
          borderColor: "#d1d5db",
          shadow: false,
          style: { fontSize: "13px" },
          valueDecimals: dataset.decimals
        },
        accessibility: { enabled: true, description: dataset.description },
        series: [
          {
            data: dataset.data,
            name: dataset.name,
            type: "area",
            color: dataset.color,
            fillOpacity: 0.25,
            tooltip: { valueSuffix: " " + dataset.unit }
          }
        ]
      });

      charts.push(c);
    });

    bindSync();
  }

  function renderHeatmap() {
    if (!heatmapContainer) return;
    heatmapChart?.destroy();

    const types = [...new Set(wines.map(w => w.type || "Otros"))].sort();
    const priceRanges = ["0-8€", "8-12€", "12-16€", "16-20€", "20€+"];

    function getPriceIndex(price) {
      const p = Number(price);
      if (p < 8) return 0;
      if (p < 12) return 1;
      if (p < 16) return 2;
      if (p < 20) return 3;
      return 4;
    }

    const matrix = {};
    wines.forEach(w => {
      const typeIdx = types.indexOf(w.type || "Otros");
      const priceIdx = getPriceIndex(w.price);
      const key = `${typeIdx}-${priceIdx}`;
      matrix[key] = (matrix[key] || 0) + 1;
    });

    const data = [];
    types.forEach((_, ti) => {
      priceRanges.forEach((_, pi) => {
        data.push([ti, pi, matrix[`${ti}-${pi}`] || 0]);
      });
    });

    heatmapChart = Highcharts.chart(heatmapContainer, {
      chart: {
        type: "heatmap",
        marginTop: 60,
        marginBottom: 80,
        plotBorderWidth: 1,
        backgroundColor: "transparent"
      },
      title: {
        text: "Distribución de vinos por tipo y precio",
        style: { fontSize: "14px", color: "#111827" },
        align: "left"
      },
      subtitle: {
        text: "Número de vinos por cada combinación de tipo y rango de precio",
        align: "left",
        style: { fontSize: "12px" }
      },
      accessibility: {
        enabled: true,
        description: "Mapa de calor que muestra la distribución de vinos por tipo y rango de precio."
      },
      credits: { enabled: false },
      xAxis: {
        categories: types,
        title: { text: "Tipo de vino" }
      },
      yAxis: {
        categories: priceRanges,
        title: { text: "Rango de precio" },
        reversed: true
      },
      colorAxis: {
        min: 0,
        minColor: "#f0fdf4",
        maxColor: "#7c3aed"
      },
      legend: {
        align: "right",
        layout: "vertical",
        margin: 0,
        verticalAlign: "top",
        y: 40,
        symbolHeight: 200
      },
      tooltip: {
        formatter() {
          const type = types[this.point.x];
          const range = priceRanges[this.point.y];
          return `<b>${type}</b> — <b>${range}</b><br/>Vinos: <b>${this.point.value}</b>`;
        }
      },
      series: [{
        name: "Número de vinos",
        borderWidth: 1,
        data: data,
        dataLabels: {
          enabled: true,
          color: "contrast",
          style: { fontSize: "12px" }
        }
      }]
    });
  }

  async function loadAnalytics() {
    loading = true;
    error = "";
    try {
      wines = await getAllWineStats();
      if (wines.length === 0) {
        error = "No hay vinos registrados. Carga los datos iniciales primero.";
        loading = false;
        return;
      }
      loading = false;
      await tick();
      await loadHighcharts();
      renderCharts();
      renderHeatmap();
    } catch (e) {
      error = e.message || "No se pudieron cargar los datos.";
      loading = false;
    }
  }

  onMount(loadAnalytics);

  onDestroy(() => {
    charts.forEach((c) => c?.destroy());
    heatmapChart?.destroy();
  });
</script>
<svelte:head>
  <title>Analytics Wine Stats | SOS2526-29</title>
</svelte:head>

<main class="page">
  <header class="header">
    <div>
      <p class="eyebrow">SOS2526-29 — RMP</p>
      <h1>Analytics de Wine Stats</h1>
      <p class="subtitle">
        Visualización sincronizada de precio, graduación y capacidad por vino.
        Puedes hacer zoom arrastrando sobre cualquier gráfico.
      </p>
    </div>
    <div class="header-links">
      <a class="btn-link purple" href="/analytics/wine-stats/map">🗺️ Ver mapa</a>
      <a class="btn-link gray" href="/wine-stats">← Volver a Wine Stats</a>
    </div>
  </header>

  {#if loading}
    <p class="state" role="status">Cargando datos...</p>
  {:else if error}
    <div class="message error" role="alert">{error}</div>
  {:else}
    <section class="charts-section" aria-label="Gráficos de vinos sincronizados">
      <h2>Evolución por vino</h2>
      <div bind:this={container} class="charts-container"></div>
    </section>

    <section class="charts-section" aria-label="Heatmap de vinos por tipo y precio">
      <h2>Distribución por tipo y precio</h2>
      <div bind:this={heatmapContainer} class="heatmap-frame"></div>
    </section>

    <section class="resumen" aria-label="Resumen estadístico">
      <h2>Resumen</h2>
      <div class="resumen-grid">
        <article class="resumen-card">
          <dt>Total de vinos</dt>
          <dd>{wines.length}</dd>
        </article>
        <article class="resumen-card">
          <dt>Precio medio</dt>
          <dd>{(wines.reduce((s, w) => s + Number(w.price), 0) / wines.length).toFixed(2)} €</dd>
        </article>
        <article class="resumen-card">
          <dt>Graduación media</dt>
          <dd>{(wines.reduce((s, w) => s + Number(w.abv), 0) / wines.length).toFixed(1)} %</dd>
        </article>
        <article class="resumen-card">
          <dt>Unidades totales</dt>
          <dd>{wines.reduce((s, w) => s + Number(w.unit), 0)}</dd>
        </article>
      </div>
    </section>
  {/if}
</main>
<style>
  :global(body) {
    margin: 0;
    font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
    background: #f6f7fb;
    color: #111827;
  }


  .page {
    max-width: 1100px;
    margin: 0 auto;
    padding: 28px 16px 48px;
  }


  .header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 20px;
    margin-bottom: 28px;
    flex-wrap: wrap;
  }


  .eyebrow {
    margin: 0 0 8px;
    color: #7c3aed;
    font-size: 0.82rem;
    font-weight: 700;
    text-transform: uppercase;
  }


  h1 { color: #0f172a; font-size: clamp(1.8rem, 4vw, 2.8rem); margin: 0; }
  h2 { color: #0f172a; font-size: 1.2rem; margin: 0 0 14px; }


  .subtitle {
    margin-top: 10px;
    color: #526174;
    max-width: 680px;
  }


  .btn-back {
    display: inline-flex;
    align-items: center;
    min-height: 42px;
    padding: 0 16px;
    border-radius: 8px;
    background: #7c3aed;
    color: white;
    text-decoration: none;
    font-weight: 700;
    white-space: nowrap;
  }


  .btn-back:hover { background: #6d28d9; }


  .charts-section {
    background: white;
    border: 1px solid #d9e0ea;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 10px 28px rgba(15,23,42,0.06);
    margin-bottom: 20px;
  }


  .charts-container :global(.chart-frame) {
    min-height: 200px;
    margin-bottom: 12px;
    border-bottom: 1px solid #f1f5f9;
  }
  .header-links {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    justify-content: flex-end;
  }


  .primary-link.gray {
    background: #374151;
  }


  .primary-link.gray:hover {
    background: #1f2937;
  }
  .resumen {
    background: white;
    border: 1px solid #d9e0ea;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 10px 28px rgba(15,23,42,0.06);
  }


  .resumen-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 14px;
  }


  .resumen-card {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 14px;
  }


  dt { color: #64748b; font-size: 0.86rem; }
  dd { margin: 4px 0 0; color: #111827; font-size: 1.2rem; font-weight: 700; }


  .state, .message {
    padding: 16px;
    border-radius: 8px;
    border: 1px solid #d9e0ea;
    background: white;
  }


  .error {
    border-color: #fecaca;
    background: #fef2f2;
    color: #991b1b;
  }


  @media (max-width: 640px) {
    .header { flex-direction: column; align-items: stretch; }
    .btn-back { width: 100%; box-sizing: border-box; justify-content: center; }
  }
</style>