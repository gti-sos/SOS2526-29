<script>
  import { onDestroy, onMount, tick } from "svelte";
  import { getCitysStatsIntegrationSummary } from "../services/citysStatsIntegrations";

  let Highcharts;
  let chartContainer;
  let chart;
  let summary = null;
  let items = [];
  let loading = true;
  let error = "";
  let selectedLimit = 5;

  const formatter = new Intl.NumberFormat("es-ES", {
    maximumFractionDigits: 0
  });

  const compactFormatter = new Intl.NumberFormat("es-ES", {
    notation: "compact",
    maximumFractionDigits: 1
  });

  const apiLinks = [
    {
      name: "Open-Meteo",
      label: "Geocoding",
      url: "https://open-meteo.com/en/docs/geocoding-api"
    },
    {
      name: "REST Countries",
      label: "Country data",
      url: "https://restcountries.com/"
    },
    {
      name: "World Bank",
      label: "Indicators",
      url: "https://datahelpdesk.worldbank.org/knowledgebase/articles/889392-about-the-indicators-api-documentation"
    }
  ];

  function titleCase(value) {
    return String(value ?? "")
      .split(/[-\s]+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }

  function numberOrNull(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function localPopulation(item) {
    return numberOrNull(item.un_2025_population) ?? 0;
  }

  function geocodingPopulation(item) {
    return numberOrNull(item.geocoding?.population);
  }

  function worldBankPopulation(item) {
    return numberOrNull(item.worldBankPopulation?.value);
  }

  async function loadHighcharts() {
    if (Highcharts) return Highcharts;

    const module = await import("highcharts");
    Highcharts = module.default;
    window._Highcharts = Highcharts;
    await import("highcharts/modules/accessibility.js");

    return Highcharts;
  }

  function renderChart() {
    if (!chartContainer || !Highcharts || items.length === 0) return;

    chart?.destroy();

    chart = Highcharts.chart(chartContainer, {
      chart: {
        type: "column",
        backgroundColor: "transparent"
      },
      title: {
        text: "Poblacion local y externa"
      },
      subtitle: {
        text: "citys-stats frente a Open-Meteo y World Bank"
      },
      accessibility: {
        enabled: true,
        description:
          "Comparacion de poblacion local de citys-stats, poblacion de ciudad segun Open-Meteo y poblacion del pais segun World Bank."
      },
      xAxis: {
        categories: items.map((item) => titleCase(item.city)),
        title: {
          text: "Ciudad"
        }
      },
      yAxis: {
        type: "logarithmic",
        min: 1,
        title: {
          text: "Poblacion"
        }
      },
      tooltip: {
        formatter() {
          return `<strong>${this.series.name}</strong><br/>${this.x}: ${formatter.format(this.y)}`;
        }
      },
      plotOptions: {
        column: {
          borderRadius: 3,
          dataLabels: {
            enabled: true,
            formatter() {
              return compactFormatter.format(this.y);
            }
          }
        }
      },
      series: [
        {
          name: "citys-stats",
          color: "#0f766e",
          data: items.map(localPopulation)
        },
        {
          name: "Open-Meteo ciudad",
          color: "#2563eb",
          data: items.map((item) => geocodingPopulation(item))
        },
        {
          name: "World Bank pais",
          color: "#b45309",
          data: items.map((item) => worldBankPopulation(item))
        }
      ],
      credits: {
        enabled: false
      }
    });
  }

  async function loadIntegrations() {
    loading = true;
    error = "";

    try {
      summary = await getCitysStatsIntegrationSummary(selectedLimit);
      items = Array.isArray(summary?.items) ? summary.items : [];
      loading = false;
      await tick();
      await loadHighcharts();
      renderChart();
    } catch (e) {
      error = e.message || "No se pudieron cargar las integraciones.";
      loading = false;
    }
  }

  onMount(loadIntegrations);

  onDestroy(() => {
    chart?.destroy();
  });
</script>

<svelte:head>
  <title>Integraciones citys-stats | SOS2526-29</title>
</svelte:head>

<main class="integrations-page">
  <header class="page-header">
    <div>
      <p class="eyebrow">LCC citys-stats</p>
      <h1>Integraciones externas</h1>
      <p class="subtitle">Datos conectados con geocodificacion, paises e indicadores oficiales.</p>
    </div>

    <div class="toolbar" aria-label="Opciones de integracion">
      <label>
        <span>Ciudades</span>
        <select bind:value={selectedLimit} on:change={loadIntegrations}>
          <option value={3}>3</option>
          <option value={5}>5</option>
          <option value={8}>8</option>
        </select>
      </label>
      <button type="button" on:click={loadIntegrations}>Actualizar</button>
    </div>
  </header>

  <section class="source-grid" aria-label="APIs externas usadas">
    {#each apiLinks as api}
      <a class="source-card" href={api.url} target="_blank" rel="noreferrer">
        <span>{api.label}</span>
        <strong>{api.name}</strong>
      </a>
    {/each}
  </section>

  {#if loading}
    <p class="state" role="status">Cargando integraciones...</p>
  {:else if error}
    <div class="message error" role="alert">{error}</div>
  {:else if items.length === 0}
    <div class="message">No hay registros locales de citys-stats para integrar.</div>
  {:else}
    <section class="chart-panel" aria-labelledby="integration-chart-title">
      <h2 id="integration-chart-title">Vista comparada</h2>
      <div class="chart-frame" bind:this={chartContainer}></div>
    </section>

    <section class="city-grid" aria-label="Detalle de integraciones por ciudad">
      {#each items as item}
        <article class="city-card">
          <div class="city-heading">
            <div>
              <p>{titleCase(item.country)}</p>
              <h2>{titleCase(item.city)}</h2>
            </div>
            {#if item.countryInfo?.flagPng}
              <img src={item.countryInfo.flagPng} alt={`Bandera de ${item.countryInfo.name}`} />
            {/if}
          </div>

          <dl>
            <div>
              <dt>citys-stats 2025</dt>
              <dd>{formatter.format(localPopulation(item))}</dd>
            </div>
            <div>
              <dt>Open-Meteo</dt>
              <dd>
                {#if item.geocoding}
                  {item.geocoding.latitude?.toFixed(2)}, {item.geocoding.longitude?.toFixed(2)}
                {:else}
                  Sin dato
                {/if}
              </dd>
            </div>
            <div>
              <dt>REST Countries</dt>
              <dd>
                {#if item.countryInfo}
                  {item.countryInfo.region} · {compactFormatter.format(item.countryInfo.population)}
                {:else}
                  Sin dato
                {/if}
              </dd>
            </div>
            <div>
              <dt>World Bank</dt>
              <dd>
                {#if item.worldBankPopulation}
                  {compactFormatter.format(item.worldBankPopulation.value)} ({item.worldBankPopulation.date})
                {:else}
                  Sin dato
                {/if}
              </dd>
            </div>
          </dl>

          {#if item.integrationErrors.length > 0}
            <ul class="warning-list" aria-label="Avisos de integracion">
              {#each item.integrationErrors as integrationError}
                <li>{integrationError.source}: {integrationError.error}</li>
              {/each}
            </ul>
          {/if}
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

  .integrations-page {
    max-width: 1220px;
    margin: 0 auto;
    padding: 28px 16px 48px;
    text-align: left;
  }

  .page-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 20px;
    margin-bottom: 18px;
  }

  .eyebrow,
  h1,
  h2,
  p {
    margin: 0;
  }

  .eyebrow {
    color: #0f766e;
    font-size: 0.82rem;
    font-weight: 700;
    text-transform: uppercase;
  }

  h1 {
    margin-top: 8px;
    color: #0f172a;
    font-size: clamp(2rem, 4vw, 3.05rem);
    line-height: 1.08;
  }

  h2 {
    color: #0f172a;
    font-size: 1.16rem;
  }

  .subtitle {
    margin-top: 10px;
    color: #526174;
    max-width: 720px;
  }

  .toolbar {
    display: flex;
    align-items: end;
    gap: 10px;
    flex-wrap: wrap;
  }

  .toolbar label {
    display: grid;
    gap: 6px;
    color: #475569;
    font-size: 0.88rem;
    font-weight: 700;
  }

  select,
  button {
    min-height: 42px;
    border-radius: 8px;
    font: inherit;
  }

  select {
    border: 1px solid #cbd5e1;
    background: white;
    color: #0f172a;
    padding: 0 36px 0 12px;
  }

  button {
    border: 0;
    background: #0f766e;
    color: white;
    padding: 0 16px;
    font-weight: 700;
    cursor: pointer;
  }

  .source-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
    margin-bottom: 16px;
  }

  .source-card,
  .chart-panel,
  .city-card,
  .message,
  .state {
    border: 1px solid #d9e0ea;
    border-radius: 8px;
    background: #ffffff;
    box-shadow: 0 10px 28px rgba(15, 23, 42, 0.06);
  }

  .source-card {
    display: grid;
    gap: 4px;
    padding: 14px;
    color: inherit;
    text-decoration: none;
  }

  .source-card span,
  dt,
  .city-heading p {
    color: #64748b;
    font-size: 0.86rem;
  }

  .source-card strong {
    color: #0f172a;
    font-size: 1.05rem;
  }

  .chart-panel {
    padding: 20px;
  }

  .chart-panel h2 {
    margin-bottom: 14px;
  }

  .chart-frame {
    min-height: 430px;
  }

  .city-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
    margin-top: 16px;
  }

  .city-card {
    padding: 16px;
  }

  .city-heading {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 16px;
  }

  .city-heading img {
    width: 46px;
    height: 32px;
    object-fit: cover;
    border: 1px solid #e2e8f0;
    border-radius: 4px;
  }

  dl {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
    margin: 0;
  }

  dd {
    margin: 3px 0 0;
    color: #0f172a;
    font-weight: 700;
  }

  .warning-list {
    margin: 14px 0 0;
    padding-left: 18px;
    color: #9a3412;
    font-size: 0.9rem;
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

  @media (max-width: 820px) {
    .page-header {
      align-items: stretch;
      flex-direction: column;
    }

    .toolbar,
    .source-grid,
    .city-grid,
    dl {
      grid-template-columns: 1fr;
    }

    .toolbar {
      display: grid;
    }

    button,
    select {
      width: 100%;
      box-sizing: border-box;
    }

    .chart-frame {
      min-height: 360px;
    }
  }
</style>
