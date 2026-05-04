<script>
  // onDestroy limpia la grafica; tick espera a que Svelte actualice el DOM.
  import { onDestroy, onMount, tick } from "svelte";
  // Servicio que pide el resumen integrado al backend.
  import { getCitysStatsIntegrationSummary } from "@/services/citysStatsIntegrations";

  // Libreria Highcharts cargada de forma dinamica.
  let Highcharts;
  // Contenedor HTML de la grafica.
  let chartContainer;
  let sosChartContainer;
  // Objeto de grafica.
  let chart;
  let sosChart;
  // Resumen completo devuelto por el backend.
  let summary = null;
  // Lista de ciudades integradas.
  let items = [];
  // Estado de carga.
  let loading = true;
  // Mensaje de error.
  let error = "";
  // Numero de paises que se piden al resumen.
  let selectedLimit = 8;

  // Formateador normal para numeros grandes.
  const formatter = new Intl.NumberFormat("es-ES", {
    maximumFractionDigits: 0
  });

  // Formateador compacto, por ejemplo 1,2 M.
  const compactFormatter = new Intl.NumberFormat("es-ES", {
    notation: "compact",
    maximumFractionDigits: 1
  });

  // Enlaces a las APIs externas que usa esta integracion.
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
    },
    {
      name: "SOS2526-25",
      label: "Tourist arrivals",
      url: "https://sos2526-25.onrender.com/api/v2/international-tourist-arrivals/docs"
    },
    {
      name: "SOS2526-19",
      label: "Earthquakes",
      url: "https://sos2526-19.onrender.com/api/v1/earthquakes/docs"
    },
    {
      name: "SOS2526-26",
      label: "FIFA squad values",
      url: "https://documenter.getpostman.com/view/52260149/2sBXinGW4o"
    },
    {
      name: "SOS2526-30",
      label: "Esports earnings",
      url: "https://documenter.getpostman.com/view/52332561/2sBXijJWy6"
    }
  ];

  // Convierte textos como south-korea en South Korea.
  function titleCase(value) {
    return String(value ?? "")
      .split(/[-\s]+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }

  // Convierte a numero o devuelve null si no se puede.
  function numberOrNull(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  // Lee la poblacion local agregada por pais de citys-stats.
  function localPopulation(item) {
    return numberOrNull(item.un_2025_population) ?? 0;
  }

  // Lee la poblacion devuelta por Open-Meteo.
  function geocodingPopulation(item) {
    return numberOrNull(item.geocoding?.population);
  }

  // Lee la poblacion del pais segun World Bank.
  function worldBankPopulation(item) {
    return numberOrNull(item.worldBankPopulation?.value);
  }

  // Lee las llegadas turisticas agregadas del proxy SOS2526-25.
  function touristArrivals(item) {
    return numberOrNull(item.touristArrivals?.totalArrivals);
  }

  // Lee la poblacion expuesta agregada del proxy SOS2526-19.
  function earthquakeExposedPopulation(item) {
    return numberOrNull(item.earthquakeStats?.exposedPopulation);
  }

  // Lee el valor de plantilla FIFA agregado del proxy SOS2526-26.
  function fifaSquadValue(item) {
    return numberOrNull(item.fifaSquadValue?.latestTotalMarketValue);
  }

  // Lee los premios de eSports agregados del proxy SOS2526-30.
  function esportsEarnings(item) {
    return numberOrNull(item.esportsEarnings?.topCountryEarnings);
  }

  function positiveOrNull(value) {
    const parsed = numberOrNull(value);
    return parsed && parsed > 0 ? parsed : null;
  }

  function studentMetricValue(value) {
    const parsed = numberOrNull(value);
    if (parsed === null) return "Sin dato";

    if (Number.isInteger(parsed)) return formatter.format(parsed);

    return parsed.toLocaleString("es-ES", {
      maximumFractionDigits: 1
    });
  }

  function shortApiName(source) {
    source = String(source ?? "");
    if (source.includes("SOS2526-25")) return "SOS25 turismo";
    if (source.includes("SOS2526-19")) return "SOS19 terremotos";
    if (source.includes("SOS2526-26")) return "SOS26 FIFA";
    if (source.includes("SOS2526-30")) return "SOS30 eSports";
    return source;
  }

  function topStudentCountry(api) {
    return Array.isArray(api?.countries) ? api.countries[0] : null;
  }

  function studentApiRecordCount(api) {
    return numberOrNull(api?.count) ?? 0;
  }

  // Carga Highcharts cuando se va a pintar la grafica.
  async function loadHighcharts() {
    if (Highcharts) return Highcharts;

    const module = await import("highcharts");
    Highcharts = module.default;
    window._Highcharts = Highcharts;
    await import("highcharts/modules/accessibility.js");

    return Highcharts;
  }

  // Dibuja la grafica comparativa de poblaciones.
  function renderChart() {
    if (!chartContainer || !Highcharts || items.length === 0) return;

    chart?.destroy();

    chart = Highcharts.chart(chartContainer, {
      chart: {
        type: "column",
        backgroundColor: "transparent"
      },
      title: {
        text: "Indicadores integrados por pais"
      },
      subtitle: {
        text: "citys-stats agregado por pais frente a APIs externas y SOS"
      },
      accessibility: {
        enabled: true,
        description:
          "Comparacion por pais de citys-stats, Open-Meteo, World Bank, llegadas turisticas, terremotos, valor de plantillas FIFA y premios de eSports."
      },
      xAxis: {
        categories: items.map((item) => titleCase(item.country)),
        title: {
          text: "Pais"
        }
      },
      yAxis: {
        type: "logarithmic",
        min: 1,
        title: {
          text: "Indicador integrado"
        }
      },
      tooltip: {
        formatter() {
          if (this.y === null || this.y === undefined) {
            return `<strong>${this.series.name}</strong><br/>${this.x}: sin dato`;
          }
          return `<strong>${this.series.name}</strong><br/>${this.x}: ${formatter.format(this.y)}`;
        }
      },
      plotOptions: {
        column: {
          borderRadius: 3,
          dataLabels: {
            enabled: true,
            formatter() {
              if (this.y === null || this.y === undefined) return "";
              return compactFormatter.format(this.y);
            }
          }
        }
      },
      series: [
        {
          name: "citys-stats pais",
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
          data: items.map((item) => positiveOrNull(worldBankPopulation(item)))
        },
        {
          name: "SOS25 turistas pais",
          color: "#db2777",
          data: items.map((item) => positiveOrNull(touristArrivals(item)))
        },
        {
          name: "SOS19 poblacion expuesta",
          color: "#4f46e5",
          data: items.map((item) => positiveOrNull(earthquakeExposedPopulation(item)))
        },
        {
          name: "SOS26 valor FIFA",
          color: "#0891b2",
          data: items.map((item) => positiveOrNull(fifaSquadValue(item)))
        },
        {
          name: "SOS30 premios eSports",
          color: "#7c3aed",
          data: items.map((item) => positiveOrNull(esportsEarnings(item)))
        }
      ],
      credits: {
        enabled: false
      }
    });
  }

  function renderSosChart() {
    const apis = Array.isArray(summary?.studentApis) ? summary.studentApis : [];
    if (!sosChartContainer || !Highcharts || apis.length === 0) return;

    sosChart?.destroy();

    sosChart = Highcharts.chart(sosChartContainer, {
      chart: {
        type: "column",
        backgroundColor: "transparent"
      },
      title: {
        text: "Registros recibidos de APIs SOS"
      },
      subtitle: {
        text: "Permite ver rapidamente que APIs traen datos y cuales responden vacias"
      },
      accessibility: {
        enabled: true,
        description:
          "Grafica de columnas con las cuatro APIs SOS externas y el numero de registros recibidos desde cada una."
      },
      xAxis: {
        categories: apis.map((api) => shortApiName(api.source)),
        title: {
          text: "API SOS"
        }
      },
      yAxis: {
        min: 0,
        allowDecimals: false,
        title: {
          text: "Registros recibidos"
        }
      },
      tooltip: {
        formatter() {
          const detail = this.point.custom ?? {};
          if (detail.error) {
            return `<strong>${detail.source}</strong><br/>${detail.error}`;
          }

          if (this.y === 0) {
            return `<strong>${detail.source}</strong><br/>La API responde, pero ahora mismo no devuelve registros.`;
          }

          const countryLine = detail.country
            ? `<br/>Pais destacado: ${titleCase(detail.country)}<br/>${detail.metricLabel}: ${studentMetricValue(detail.metric)}`
            : "";

          return `<strong>${detail.source}</strong><br/>Registros recibidos: ${formatter.format(this.y)}${countryLine}${detail.detail ? `<br/>${detail.detail}` : ""}`;
        }
      },
      plotOptions: {
        column: {
          borderRadius: 3,
          dataLabels: {
            enabled: true,
            formatter() {
              return this.y === 0 ? "0" : compactFormatter.format(this.y);
            }
          }
        }
      },
      series: [
        {
          name: "APIs SOS",
          colorByPoint: true,
          data: apis.map((api, index) => {
            const topCountry = topStudentCountry(api);
            return {
              y: studentApiRecordCount(api),
              color: ["#db2777", "#4f46e5", "#0891b2", "#7c3aed"][index] ?? "#0f766e",
              custom: {
                source: api.source,
                metricLabel: api.metricLabel,
                metric: topCountry?.metric,
                country: topCountry?.country,
                detail: topCountry?.detail,
                error: api.error
              }
            };
          })
        }
      ],
      credits: {
        enabled: false
      }
    });
  }

  // Carga los datos integrados y actualiza la grafica.
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
      renderSosChart();
    } catch (e) {
      error = e.message || "No se pudieron cargar las integraciones.";
      loading = false;
    }
  }

  // Al abrir la pantalla, cargamos las integraciones.
  onMount(loadIntegrations);

  // Al salir, destruimos la grafica para no dejar memoria ocupada.
  onDestroy(() => {
    chart?.destroy();
    sosChart?.destroy();
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
      <p class="subtitle">Datos agregados por pais y conectados con APIs externas y de otros grupos SOS.</p>
    </div>

    <div class="toolbar" aria-label="Opciones de integracion">
      <label>
        <span>Paises</span>
        <select bind:value={selectedLimit} on:change={loadIntegrations}>
          <option value={5}>5</option>
          <option value={8}>8</option>
          <option value={12}>12</option>
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
    {#if summary?.studentApis?.length}
      <section class="student-api-grid" aria-label="Resumen de APIs SOS de otros grupos">
        {#each summary.studentApis as api}
          <article class="student-api-card" class:error-card={api.error}>
            <span>API SOS de otro grupo</span>
            <strong>{api.source}</strong>
            {#if api.error}
              <p>{api.error}</p>
            {:else}
              <p>{formatter.format(api.count)} registros recibidos por proxy propio.</p>
              {#if api.countries?.length}
                <ul class="student-api-list" aria-label={`Top paises de ${api.source}`}>
                  {#each api.countries as country}
                    <li>
                      <span>{titleCase(country.country)}</span>
                      <strong>{api.metricLabel}: {studentMetricValue(country.metric)}</strong>
                      <small>{country.detail}</small>
                    </li>
                  {/each}
                </ul>
              {/if}
            {/if}
          </article>
        {/each}
      </section>
    {/if}

    <section class="chart-panel" aria-labelledby="integration-chart-title">
      <h2 id="integration-chart-title">Vista comparada</h2>
      <div class="chart-frame" bind:this={chartContainer}></div>
    </section>

    <section class="chart-panel" aria-labelledby="sos-chart-title">
      <h2 id="sos-chart-title">APIs SOS externas</h2>
      <div class="chart-frame" bind:this={sosChartContainer}></div>
    </section>

    <section class="city-grid" aria-label="Detalle de integraciones por ciudad">
      {#each items as item}
        <article class="city-card">
          <div class="city-heading">
            <div>
              <p>{titleCase(item.country)}</p>
              <h2>{titleCase(item.country)}</h2>
              <p>{item.cityCount} ciudades · principal: {titleCase(item.topCity)}</p>
            </div>
            {#if item.countryInfo?.flagPng}
              <img src={item.countryInfo.flagPng} alt={`Bandera de ${item.countryInfo.name}`} />
            {/if}
          </div>

          <dl>
            <div>
              <dt>citys-stats pais</dt>
              <dd>{formatter.format(localPopulation(item))}</dd>
            </div>
            <div>
              <dt>Open-Meteo ciudad principal</dt>
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
            <div>
              <dt>SOS25 turistas</dt>
              <dd>
                {#if item.touristArrivals}
                  {compactFormatter.format(item.touristArrivals.totalArrivals)}
                  ({item.touristArrivals.records} reg., ult. {item.touristArrivals.latestYear})
                {:else}
                  Sin dato
                {/if}
              </dd>
            </div>
            <div>
              <dt>SOS19 terremotos</dt>
              <dd>
                {#if item.earthquakeStats}
                  {item.earthquakeStats.records} eventos · M{item.earthquakeStats.maxSeverity}
                {:else}
                  Sin dato
                {/if}
              </dd>
            </div>
            <div>
              <dt>SOS26 valor FIFA</dt>
              <dd>
                {#if item.fifaSquadValue}
                  {compactFormatter.format(item.fifaSquadValue.latestTotalMarketValue)}
                  ({item.fifaSquadValue.latestYear})
                {:else}
                  Sin dato
                {/if}
              </dd>
            </div>
            <div>
              <dt>SOS30 premios eSports</dt>
              <dd>
                {#if item.esportsEarnings}
                  {compactFormatter.format(item.esportsEarnings.topCountryEarnings)}
                  ({item.esportsEarnings.topGameName ?? item.esportsEarnings.latestGameName})
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
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 12px;
    margin-bottom: 16px;
  }

  .source-card,
  .student-api-card,
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

  .student-api-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
    margin-bottom: 16px;
  }

  .student-api-card {
    padding: 14px;
  }

  .student-api-card span {
    color: #64748b;
    font-size: 0.82rem;
    font-weight: 700;
    text-transform: uppercase;
  }

  .student-api-card strong {
    display: block;
    margin-top: 4px;
    color: #0f172a;
  }

  .student-api-card p {
    margin-top: 8px;
    color: #475569;
  }

  .student-api-list {
    display: grid;
    gap: 8px;
    margin: 12px 0 0;
    padding: 0;
    list-style: none;
  }

  .student-api-list li {
    display: grid;
    gap: 2px;
    border-top: 1px solid #e2e8f0;
    padding-top: 8px;
  }

  .student-api-list span,
  .student-api-list small {
    color: #64748b;
  }

  .student-api-list strong {
    margin-top: 0;
  }

  .error-card {
    border-color: #fecaca;
    background: #fef2f2;
  }

  .chart-panel {
    padding: 20px;
  }

  .chart-panel + .chart-panel {
    margin-top: 16px;
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
    .student-api-grid,
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
