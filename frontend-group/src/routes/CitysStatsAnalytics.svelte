<script>
  // onDestroy limpia la grafica; tick espera a que exista el contenedor.
  import { onDestroy, onMount, tick } from "svelte";
  // Servicio para pedir citys-stats al backend.
  import { getAllCitysStats } from "../services/citysStatsApi";

  // Libreria Highcharts cargada cuando se necesita.
  let Highcharts;
  // Contenedor HTML de la grafica.
  let chartContainer;
  // Grafica creada por Highcharts.
  let chart;
  // Datos locales de citys-stats.
  let citysStats = [];
  // Estado de carga.
  let loading = true;
  // Mensaje de error.
  let error = "";

  // Formateador de numeros en espanol.
  const formatter = new Intl.NumberFormat("es-ES", {
    maximumFractionDigits: 0
  });

  // Crea una etiqueta legible para una ciudad.
  function labelFor(item) {
    return `${item.city} (${item.country})`;
  }

  // Carga Highcharts y su modulo de accesibilidad.
  async function loadHighcharts() {
    if (Highcharts) return Highcharts;

    const module = await import("highcharts");
    Highcharts = module.default;
    window._Highcharts = Highcharts;
    await import("highcharts/modules/accessibility.js");

    return Highcharts;
  }

  // Dibuja la grafica circular.
  function renderChart() {
    if (!chartContainer) return;

    const data = citysStats
      .slice()
      .sort((a, b) => Number(b.un_2025_population) - Number(a.un_2025_population))
      .map((item) => ({
        name: labelFor(item),
        y: Number(item.un_2025_population)
      }));

    chart?.destroy();

    chart = Highcharts.chart(chartContainer, {
      chart: {
        type: "pie",
        backgroundColor: "transparent"
      },
      title: {
        text: "Poblacion estimada por ciudad"
      },
      subtitle: {
        text: "API LCC citys-stats"
      },
      accessibility: {
        enabled: true,
        description:
          "Grafico circular accesible con todos los registros de citys-stats y su poblacion estimada para 2025."
      },
      tooltip: {
        pointFormatter() {
          return `<span>${this.name}</span><br/><strong>${formatter.format(this.y)}</strong> habitantes`;
        }
      },
      plotOptions: {
        pie: {
          allowPointSelect: true,
          borderWidth: 2,
          cursor: "pointer",
          dataLabels: {
            enabled: true,
            format: "{point.name}: {point.percentage:.1f}%"
          },
          showInLegend: true
        }
      },
      series: [
        {
          name: "Poblacion 2025",
          colorByPoint: true,
          data,
          accessibility: {
            point: {
              valueSuffix: " habitantes"
            }
          }
        }
      ],
      credits: {
        enabled: false
      }
    });
  }

  // Carga datos y despues pinta la grafica.
  async function loadAnalytics() {
    loading = true;
    error = "";

    try {
      citysStats = await getAllCitysStats({ sort: "-un_2025_population" });
      loading = false;
      await tick();
      await loadHighcharts();
      renderChart();
    } catch (e) {
      error = e.message || "No se pudieron cargar los datos de citys-stats.";
      loading = false;
    }
  }

  // Al abrir la pantalla, cargamos las analiticas.
  onMount(loadAnalytics);

  // Al salir de la pantalla, destruimos la grafica.
  onDestroy(() => {
    chart?.destroy();
  });
</script>

<svelte:head>
  <title>Analytics citys-stats | SOS2526-29</title>
</svelte:head>

<main class="analytics-page">
  <header class="analytics-header">
    <div>
      <p class="eyebrow">LCC</p>
      <h1>Analytics de citys-stats</h1>
      <p class="subtitle">Visualizacion individual de la poblacion estimada para 2025.</p>
    </div>
    <nav class="header-actions" aria-label="Navegacion de analytics">
      <a class="secondary-link" href="/analytics">Analytics grupo</a>
      <a class="primary-link" href="/analytics/citys-stats/map">Mapa</a>
    </nav>
  </header>

  {#if loading}
    <p class="state" role="status">Cargando citys-stats...</p>
  {:else if error}
    <div class="message error" role="alert">{error}</div>
  {:else}
    <section class="chart-panel" aria-labelledby="city-chart-title">
      <h2 id="city-chart-title">Widget Highcharts individual</h2>
      <div class="chart-frame" bind:this={chartContainer}></div>
    </section>

    <section class="table-panel" aria-labelledby="city-table-title">
      <h2 id="city-table-title">Datos representados</h2>
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Ciudad</th>
              <th>Pais</th>
              <th>Poblacion estimada 2025</th>
            </tr>
          </thead>
          <tbody>
            {#each citysStats as item}
              <tr>
                <td>{item.city}</td>
                <td>{item.country}</td>
                <td>{formatter.format(item.un_2025_population)}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </section>
  {/if}
</main>

<style>
  :global(body) {
    margin: 0;
    font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
    background: #f7f8fb;
    color: #111827;
  }

  .analytics-page {
    max-width: 1120px;
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
    color: #1d4ed8;
    font-size: 0.82rem;
    font-weight: 700;
    text-transform: uppercase;
  }

  h1,
  h2,
  p {
    margin: 0;
  }

  h1 {
    color: #0f172a;
    font-size: clamp(2rem, 4vw, 3rem);
    line-height: 1.08;
  }

  h2 {
    color: #0f172a;
    font-size: 1.2rem;
    margin-bottom: 14px;
  }

  .subtitle {
    margin-top: 10px;
    color: #526174;
    max-width: 680px;
  }

  .secondary-link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 42px;
    padding: 0 16px;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    background: white;
    color: #0f172a;
    text-decoration: none;
    font-weight: 700;
    white-space: nowrap;
  }

  .primary-link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 42px;
    padding: 0 16px;
    border-radius: 8px;
    background: #1d4ed8;
    color: white;
    text-decoration: none;
    font-weight: 700;
    white-space: nowrap;
  }

  .header-actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .chart-panel,
  .table-panel,
  .message,
  .state {
    border: 1px solid #d9e0ea;
    border-radius: 8px;
    background: #ffffff;
    box-shadow: 0 10px 28px rgba(15, 23, 42, 0.06);
  }

  .chart-panel,
  .table-panel {
    padding: 20px;
  }

  .table-panel {
    margin-top: 16px;
  }

  .chart-frame {
    min-height: 480px;
  }

  .table-wrapper {
    overflow-x: auto;
  }

  table {
    width: 100%;
    min-width: 620px;
    border-collapse: collapse;
  }

  th,
  td {
    padding: 12px 10px;
    border-bottom: 1px solid #e5e7eb;
    text-align: left;
  }

  th {
    color: #475569;
    font-size: 0.86rem;
    text-transform: uppercase;
  }

  td {
    color: #111827;
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

    .secondary-link,
    .primary-link {
      width: 100%;
      box-sizing: border-box;
    }

    .header-actions {
      justify-content: stretch;
    }

    .chart-frame {
      min-height: 390px;
    }
  }
</style>
