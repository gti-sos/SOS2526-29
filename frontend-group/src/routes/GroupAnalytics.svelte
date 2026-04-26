<script>
  import { onDestroy, onMount, tick } from "svelte";
  import { getAllCitysStats } from "../services/citysStatsApi";
  import { getDisasters } from "../services/natural-disasters.js";
  import { getAllWineStats } from "../services/wine-stats.js";

  let Highcharts;
  let chartContainer;
  let chart;
  let loading = true;
  let error = "";
  let metrics = [];

  const formatter = new Intl.NumberFormat("es-ES", {
    maximumFractionDigits: 0
  });

  function sum(items, field) {
    return items.reduce((total, item) => total + Number(item[field] || 0), 0);
  }

  async function loadHighcharts() {
    if (Highcharts) return Highcharts;

    const module = await import("highcharts");
    Highcharts = module.default;
    window._Highcharts = Highcharts;
    await import("highcharts/modules/accessibility.js");

    return Highcharts;
  }

  function buildMetrics(citysStats, disasters, wines) {
    const raw = [
      {
        name: "LCC citys-stats",
        records: citysStats.length,
        indicatorName: "Poblacion total 2025",
        indicator: sum(citysStats, "un_2025_population")
      },
      {
        name: "ALG natural-disasters",
        records: disasters.length,
        indicatorName: "Muertes registradas",
        indicator: sum(disasters, "death_count")
      },
      {
        name: "RMP wine-stats",
        records: wines.length,
        indicatorName: "Unidades disponibles",
        indicator: sum(wines, "unit")
      }
    ];

    const maxIndicator = Math.max(...raw.map((item) => item.indicator), 1);

    return raw.map((item) => ({
      ...item,
      index: Number(((item.indicator / maxIndicator) * 100).toFixed(2))
    }));
  }

  function renderChart() {
    if (!chartContainer) return;

    chart?.destroy();

    chart = Highcharts.chart(chartContainer, {
      chart: {
        type: "column",
        backgroundColor: "transparent"
      },
      title: {
        text: "Vista integrada del grupo"
      },
      subtitle: {
        text: "Comparacion combinada de las APIs de LCC, ALG y RMP"
      },
      accessibility: {
        enabled: true,
        description:
          "Grafico de columnas que combina datos de las tres APIs del grupo. Cada serie representa a un miembro y muestra registros disponibles y un indicador principal normalizado."
      },
      xAxis: {
        categories: ["Registros", "Indicador 0-100"],
        title: {
          text: "Medida"
        }
      },
      yAxis: {
        min: 0,
        title: {
          text: "Valor"
        }
      },
      tooltip: {
        formatter() {
          const pointIndex = this.point.index;
          const metric = metrics.find((item) => item.name === this.series.name);

          if (!metric) {
            return `<strong>${this.series.name}</strong>: ${formatter.format(this.y)}`;
          }

          if (pointIndex === 0) {
            return `<strong>${metric.name}</strong><br/>Registros: ${formatter.format(metric.records)}`;
          }

          return `<strong>${metric.name}</strong><br/>${metric.indicatorName}: ${formatter.format(metric.indicator)}<br/>Indice normalizado: ${this.y}`;
        }
      },
      plotOptions: {
        column: {
          borderRadius: 3,
          dataLabels: {
            enabled: true
          }
        },
        series: {
          pointPadding: 0.08,
          groupPadding: 0.12
        }
      },
      series: metrics.map((metric) => ({
        name: metric.name,
        data: [metric.records, metric.index],
        accessibility: {
          description: `${metric.name}. ${metric.records} registros. ${metric.indicatorName}: ${metric.indicator}.`
        }
      })),
      credits: {
        enabled: false
      }
    });
  }

  async function loadAnalytics() {
    loading = true;
    error = "";

    try {
      const [citysStats, disasters, wines] = await Promise.all([
        getAllCitysStats(),
        getDisasters(),
        getAllWineStats()
      ]);

      metrics = buildMetrics(citysStats, disasters, wines);
      loading = false;
      await tick();
      await loadHighcharts();
      renderChart();
    } catch (e) {
      error = e.message || "No se pudieron cargar los datos de analytics.";
      loading = false;
    }
  }

  onMount(loadAnalytics);

  onDestroy(() => {
    chart?.destroy();
  });
</script>

<svelte:head>
  <title>Analytics | SOS2526-29</title>
</svelte:head>

<main class="analytics-page">
  <header class="analytics-header">
    <div>
      <p class="eyebrow">SOS2526-29</p>
      <h1>Analytics del grupo</h1>
      <p class="subtitle">Datos combinados de citys-stats, natural-disasters y wine-stats.</p>
    </div>
    <a class="primary-link" href="/analytics/citys-stats">Ver citys-stats</a>
  </header>

  {#if loading}
    <p class="state" role="status">Cargando datos de analytics...</p>
  {:else if error}
    <div class="message error" role="alert">{error}</div>
  {:else}
    <section class="chart-panel" aria-labelledby="group-chart-title">
      <h2 id="group-chart-title">Widget Highcharts integrado</h2>
      <div class="chart-frame" bind:this={chartContainer}></div>
    </section>

    <section class="metric-grid" aria-label="Resumen de metricas integradas">
      {#each metrics as metric}
        <article class="metric-card">
          <h3>{metric.name}</h3>
          <dl>
            <div>
              <dt>Registros</dt>
              <dd>{formatter.format(metric.records)}</dd>
            </div>
            <div>
              <dt>{metric.indicatorName}</dt>
              <dd>{formatter.format(metric.indicator)}</dd>
            </div>
          </dl>
        </article>
      {/each}
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

  .analytics-page {
    max-width: 1180px;
    margin: 0 auto;
    padding: 28px 16px 48px;
    text-align: left;
  }

  .analytics-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 20px;
    margin-bottom: 24px;
  }

  .eyebrow {
    margin: 0 0 8px;
    color: #0f766e;
    font-size: 0.82rem;
    font-weight: 700;
    text-transform: uppercase;
  }

  h1,
  h2,
  h3,
  p {
    margin: 0;
  }

  h1 {
    color: #0f172a;
    font-size: clamp(2rem, 4vw, 3.1rem);
    line-height: 1.08;
  }

  h2 {
    color: #0f172a;
    font-size: 1.2rem;
    margin-bottom: 14px;
  }

  h3 {
    color: #0f172a;
    font-size: 1rem;
    margin-bottom: 14px;
  }

  .subtitle {
    margin-top: 10px;
    color: #526174;
    max-width: 680px;
  }

  .primary-link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 42px;
    padding: 0 16px;
    border-radius: 8px;
    background: #0f766e;
    color: white;
    text-decoration: none;
    font-weight: 700;
    white-space: nowrap;
  }

  .chart-panel,
  .metric-card,
  .message,
  .state {
    border: 1px solid #d9e0ea;
    border-radius: 8px;
    background: #ffffff;
    box-shadow: 0 10px 28px rgba(15, 23, 42, 0.06);
  }

  .chart-panel {
    padding: 20px;
  }

  .chart-frame {
    min-height: 430px;
  }

  .metric-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 14px;
    margin-top: 16px;
  }

  .metric-card {
    padding: 16px;
  }

  dl {
    display: grid;
    gap: 12px;
    margin: 0;
  }

  dt {
    color: #64748b;
    font-size: 0.86rem;
  }

  dd {
    margin: 2px 0 0;
    color: #111827;
    font-size: 1.1rem;
    font-weight: 700;
  }

  .message,
  .state {
    padding: 16px;
  }

  .error {
    border-color: #fecaca;
    background: #fef2f2;
    color: #991b1b;
  }

  @media (max-width: 760px) {
    .analytics-header {
      align-items: stretch;
      flex-direction: column;
    }

    .primary-link {
      width: 100%;
      box-sizing: border-box;
    }

    .metric-grid {
      grid-template-columns: 1fr;
    }

    .chart-frame {
      min-height: 360px;
    }
  }
</style>
