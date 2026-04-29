<script>
  // onDestroy limpia el mapa; tick espera a que exista el contenedor.
  import { onDestroy, onMount, tick } from "svelte";
  // Mapa mundial en formato TopoJSON para Highcharts Maps.
  import worldMap from "@highcharts/map-collection/custom/world.topo.json";
  // Servicio para pedir registros de citys-stats.
  import { getAllCitysStats } from "../services/citysStatsApi";

  // Coordenadas locales para colocar cada ciudad en el mapa.
  const coordinates = {
    "jakarta|indonesia": { lat: -6.2088, lon: 106.8456 },
    "dhaka|bangladesh": { lat: 23.8103, lon: 90.4125 },
    "tokyo|japan": { lat: 35.6762, lon: 139.6503 },
    "delhi|india": { lat: 28.6139, lon: 77.209 },
    "shanghai|china": { lat: 31.2304, lon: 121.4737 },
    "guangzhou|china": { lat: 23.1291, lon: 113.2644 },
    "cairo|egypt": { lat: 30.0444, lon: 31.2357 },
    "manila|philippines": { lat: 14.5995, lon: 120.9842 },
    "kolkata|india": { lat: 22.5726, lon: 88.3639 },
    "seoul|south-korea": { lat: 37.5665, lon: 126.978 },
    "karachi|pakistan": { lat: 24.8607, lon: 67.0011 },
    "mumbai|india": { lat: 19.076, lon: 72.8777 },
    "madrid|spain": { lat: 40.4168, lon: -3.7038 },
    "valencia|spain": { lat: 39.4699, lon: -0.3763 },
    "malaga|spain": { lat: 36.7213, lon: -4.4214 },
    "sevilla|spain": { lat: 37.3891, lon: -5.9845 }
  };

  // Libreria Highcharts cargada de forma dinamica.
  let Highcharts;
  // Contenedor HTML del mapa.
  let mapContainer;
  // Objeto del mapa creado por Highcharts.
  let mapChart;
  // Registros de citys-stats.
  let citysStats = [];
  // Estado de carga.
  let loading = true;
  // Mensaje de error.
  let error = "";
  // Clave de la ciudad seleccionada.
  let selectedKey = "";

  // Formateador de numeros en espanol.
  const formatter = new Intl.NumberFormat("es-ES", {
    maximumFractionDigits: 0
  });

  // Construye la clave city|country para buscar coordenadas.
  function keyFor(item) {
    return `${String(item.city).toLowerCase()}|${String(item.country).toLowerCase()}`;
  }

  // Convierte textos con guiones a formato de titulo.
  function titleCase(value) {
    return String(value)
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }

  // Elige color de marcador segun la poblacion.
  function colorFor(population) {
    if (population >= 35000000) return "#b91c1c";
    if (population >= 30000000) return "#ea580c";
    if (population >= 25000000) return "#0f766e";
    return "#2563eb";
  }

  // Calcula el tamano del marcador segun la poblacion.
  function radiusFor(population) {
    return 8 + Math.sqrt(population / maxPopulation) * 15;
  }

  // Guarda la ciudad que el usuario ha seleccionado.
  function selectPoint(point) {
    selectedKey = point.key;
  }

  // Evita que los marcadores se recorten en los bordes del mapa.
  function removeCityMarkerClip(chart) {
    const citySeries = chart.series.find((series) => series.name === "Ciudades");
    citySeries?.markerGroup?.element?.removeAttribute("clip-path");
    citySeries?.group?.element?.removeAttribute("clip-path");
  }

  // Carga Highcharts Maps y accesibilidad.
  async function loadHighchartsMap() {
    if (Highcharts) return Highcharts;

    const module = await import("highcharts");
    Highcharts = module.default;
    window._Highcharts = Highcharts;
    await import("highcharts/modules/map.js");
    await import("highcharts/modules/accessibility.js");

    return Highcharts;
  }

  // Dibuja el mapa con marcadores de ciudades.
  function renderMap() {
    if (!mapContainer || !Highcharts || points.length === 0) return;

    mapChart?.destroy();

    mapChart = Highcharts.mapChart(mapContainer, {
      chart: {
        map: worldMap,
        backgroundColor: "transparent",
        spacing: [8, 8, 8, 8],
        events: {
          render() {
            removeCityMarkerClip(this);
          }
        }
      },
      title: {
        text: "Mapa mundial de citys-stats"
      },
      subtitle: {
        text: "Burbujas situadas por latitud y longitud"
      },
      accessibility: {
        enabled: true,
        description:
          "Mapa mundial real con burbujas geolocalizadas que representan ciudades de la API citys-stats y su poblacion estimada para 2025."
      },
      mapNavigation: {
        enabled: true,
        enableMouseWheelZoom: false,
        buttonOptions: {
          align: "right",
          verticalAlign: "bottom"
        }
      },
      legend: {
        enabled: false
      },
      tooltip: {
        useHTML: true,
        pointFormatter() {
          const city = this.options.custom;

          if (!city) {
            return `<strong>${this.name}</strong>`;
          }

          return `<strong>${titleCase(city.city)}</strong><br/>${titleCase(city.country)}<br/>${formatter.format(city.population)} habitantes`;
        }
      },
      plotOptions: {
        mappoint: {
          cursor: "pointer",
          dataLabels: {
            enabled: true,
            format: "{point.cityLabel}",
            allowOverlap: false,
            style: {
              color: "#0f172a",
              fontSize: "10px",
              fontWeight: "700",
              textOutline: "2px contrast"
            }
          },
          marker: {
            symbol: "diamond",
            lineWidth: 2,
            lineColor: "#0f172a",
            states: {
              hover: {
                lineColor: "#ffffff",
                lineWidth: 3
              }
            }
          },
          point: {
            events: {
              click() {
                selectPoint(this.options.custom);
              },
              mouseOver() {
                selectPoint(this.options.custom);
              }
            }
          }
        }
      },
      colorAxis: {
        min: minPopulation,
        max: maxPopulation,
        stops: [
          [0, "#2563eb"],
          [0.48, "#0f766e"],
          [0.72, "#ea580c"],
          [1, "#b91c1c"]
        ]
      },
      series: [
        {
          name: "Paises",
          nullColor: "#dbe6dd",
          borderColor: "#9fb5aa",
          borderWidth: 0.55,
          states: {
            inactive: {
              opacity: 1
            },
            hover: {
              color: "#c8d9cf"
            }
          },
          accessibility: {
            enabled: false
          }
        },
        {
          type: "mappoint",
          name: "Ciudades",
          clip: false,
          zIndex: 10,
          data: points.map((point) => ({
            name: titleCase(point.city),
            cityLabel: titleCase(point.city),
            country: point.country,
            lat: point.lat,
            lon: point.lon,
            color: point.color,
            marker: {
              radius: point.radius,
              fillColor: point.color
            },
            custom: point
          })),
          accessibility: {
            description:
              "Marcadores de ciudades. El tamano y el color aumentan con la poblacion estimada."
          }
        }
      ],
      credits: {
        enabled: false
      }
    });
  }

  // Carga citys-stats y despues pinta el mapa.
  async function loadMapData() {
    loading = true;
    error = "";

    try {
      citysStats = await getAllCitysStats({ sort: "-un_2025_population" });
      loading = false;
      await tick();
      await loadHighchartsMap();
      renderMap();
    } catch (e) {
      error = e.message || "No se pudieron cargar los datos del mapa.";
      loading = false;
    }
  }

  // Calcula registros que tienen coordenadas.
  $: geolocated = citysStats
    .map((item) => {
      const key = keyFor(item);
      const coords = coordinates[key];
      if (!coords) return null;

      return {
        ...item,
        key,
        lat: coords.lat,
        lon: coords.lon,
        population: Number(item.un_2025_population || 0)
      };
    })
    .filter(Boolean);

  // Registros sin coordenadas locales.
  $: missing = citysStats.filter((item) => !coordinates[keyFor(item)]);
  // Poblacion maxima para calcular colores y radios.
  $: maxPopulation = Math.max(...geolocated.map((item) => item.population), 1);
  // Poblacion minima para la escala de color.
  $: minPopulation = Math.min(...geolocated.map((item) => item.population), maxPopulation);
  // Puntos finales que se envian a Highcharts.
  $: points = geolocated.map((item) => ({
    ...item,
    color: colorFor(item.population),
    radius: radiusFor(item.population)
  }));
  // Si no hay ciudad seleccionada, elegimos la primera.
  $: if (!selectedKey && points.length > 0) {
    selectedKey = points[0].key;
  }
  // Ciudad seleccionada que se muestra en el panel lateral.
  $: selectedPoint = points.find((point) => point.key === selectedKey) || points[0];
  // Suma de poblaciones representadas en el mapa.
  $: totalPopulation = geolocated.reduce((total, item) => total + item.population, 0);

  // Al abrir la pantalla, cargamos los datos del mapa.
  onMount(loadMapData);

  // Al salir, destruimos el mapa.
  onDestroy(() => {
    mapChart?.destroy();
  });
</script>

<svelte:head>
  <title>Mapa citys-stats | SOS2526-29</title>
</svelte:head>

<main class="map-page">
  <header class="map-header">
    <div>
      <p class="eyebrow">LCC citys-stats</p>
      <h1>Mapa geoespacial de ciudades</h1>
      <p class="subtitle">
        Marcadores geolocalizados con poblacion estimada para 2025.
      </p>
    </div>
    <nav class="header-actions" aria-label="Navegacion de analytics">
      <a class="secondary-link" href="/analytics/citys-stats">Grafico individual</a>
      <a class="secondary-link" href="/analytics">Analytics grupo</a>
    </nav>
  </header>

  {#if loading}
    <p class="state" role="status">Cargando mapa de citys-stats...</p>
  {:else if error}
    <div class="message error" role="alert">{error}</div>
  {:else}
    <section class="summary-band" aria-label="Resumen del mapa">
      <div>
        <span>Ciudades geolocalizadas</span>
        <strong>{formatter.format(geolocated.length)}</strong>
      </div>
      <div>
        <span>Poblacion representada</span>
        <strong>{formatter.format(totalPopulation)}</strong>
      </div>
      <div>
        <span>Registros sin coordenadas</span>
        <strong>{formatter.format(missing.length)}</strong>
      </div>
    </section>

    <section class="map-layout" aria-labelledby="map-heading">
      <div class="map-panel">
        <div class="map-title-row">
          <div>
            <h2 id="map-heading">Widget geoespacial</h2>
            <p>Usa los controles del mapa para acercar, alejar y seleccionar ciudades.</p>
          </div>
          <div class="legend" aria-label="Leyenda de poblacion">
            <span><i class="small"></i> Menor</span>
            <span><i class="large"></i> Mayor</span>
          </div>
        </div>

        <div
          class="map-frame"
          data-testid="citys-stats-map"
          bind:this={mapContainer}
        ></div>
      </div>

      <aside class="detail-panel" aria-live="polite">
        {#if selectedPoint}
          <p class="detail-kicker">Ciudad seleccionada</p>
          <h2>{titleCase(selectedPoint.city)}</h2>
          <dl>
            <div>
              <dt>Pais</dt>
              <dd>{titleCase(selectedPoint.country)}</dd>
            </div>
            <div>
              <dt>Poblacion estimada 2025</dt>
              <dd>{formatter.format(selectedPoint.population)}</dd>
            </div>
            <div>
              <dt>Coordenadas</dt>
              <dd>{selectedPoint.lat.toFixed(2)}, {selectedPoint.lon.toFixed(2)}</dd>
            </div>
          </dl>
        {/if}
      </aside>
    </section>

    <section class="table-panel" aria-labelledby="map-table-title">
      <h2 id="map-table-title">Datos geolocalizados</h2>
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Ciudad</th>
              <th>Pais</th>
              <th>Poblacion 2025</th>
              <th>Latitud</th>
              <th>Longitud</th>
            </tr>
          </thead>
          <tbody>
            {#each geolocated as item}
              <tr
                class:selected={selectedPoint?.key === item.key}
                on:mouseenter={() => selectPoint(item)}
                on:focus={() => selectPoint(item)}
              >
                <td>{titleCase(item.city)}</td>
                <td>{titleCase(item.country)}</td>
                <td>{formatter.format(item.population)}</td>
                <td>{item.lat.toFixed(4)}</td>
                <td>{item.lon.toFixed(4)}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
      {#if missing.length > 0}
        <p class="missing-note">
          {formatter.format(missing.length)} registro(s) no se muestran en el mapa porque no tienen coordenadas locales definidas.
        </p>
      {/if}
    </section>
  {/if}
</main>

<style>
  :global(body) {
    margin: 0;
    font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
    background: #f5f7fb;
    color: #111827;
  }

  .map-page {
    max-width: 1220px;
    margin: 0 auto;
    padding: 28px 16px 48px;
    text-align: left;
  }

  .map-header,
  .map-title-row {
    display: flex;
    gap: 18px;
    justify-content: space-between;
  }

  .map-header {
    align-items: flex-end;
    margin-bottom: 22px;
  }

  .map-title-row {
    align-items: flex-start;
    margin-bottom: 14px;
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
    font-size: 1.18rem;
  }

  .subtitle,
  .map-title-row p,
  .missing-note {
    color: #526174;
  }

  .subtitle {
    margin-top: 10px;
    max-width: 720px;
  }

  .header-actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    justify-content: flex-end;
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

  .summary-band {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
    margin-bottom: 16px;
  }

  .summary-band div,
  .map-panel,
  .detail-panel,
  .table-panel,
  .state,
  .message {
    border: 1px solid #d9e0ea;
    border-radius: 8px;
    background: #ffffff;
    box-shadow: 0 10px 28px rgba(15, 23, 42, 0.06);
  }

  .summary-band div {
    padding: 16px;
  }

  .summary-band span,
  dt,
  .detail-kicker {
    color: #64748b;
    font-size: 0.86rem;
  }

  .summary-band strong {
    display: block;
    margin-top: 4px;
    color: #0f172a;
    font-size: 1.35rem;
  }

  .map-layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 300px;
    gap: 16px;
  }

  .map-panel,
  .detail-panel,
  .table-panel {
    padding: 20px;
  }

  .map-frame {
    min-height: 520px;
    overflow: hidden;
    border: 1px solid #dbe5ef;
    border-radius: 8px;
    background: #dbeafe;
  }

  .legend {
    display: flex;
    align-items: center;
    gap: 12px;
    color: #475569;
    font-size: 0.88rem;
    white-space: nowrap;
  }

  .legend span {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .legend i {
    display: inline-block;
    border-radius: 999px;
    background: #0f766e;
  }

  .legend .small {
    width: 12px;
    height: 12px;
  }

  .legend .large {
    width: 24px;
    height: 24px;
  }

  .detail-panel {
    align-self: start;
  }

  .detail-kicker {
    margin-bottom: 8px;
    font-weight: 700;
    text-transform: uppercase;
  }

  dl {
    display: grid;
    gap: 14px;
    margin: 18px 0 0;
  }

  dd {
    margin: 3px 0 0;
    color: #0f172a;
    font-weight: 700;
  }

  .table-panel {
    margin-top: 16px;
  }

  .table-wrapper {
    overflow-x: auto;
  }

  table {
    width: 100%;
    min-width: 760px;
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

  tbody tr.selected td,
  tbody tr:hover td {
    background: #eff6ff;
  }

  .missing-note {
    margin-top: 12px;
    font-size: 0.92rem;
  }

  .state,
  .message {
    padding: 16px;
  }

  .error {
    border-color: #fecaca;
    background: #fef2f2;
    color: #991b1b;
  }

  @media (max-width: 900px) {
    .map-header,
    .map-title-row {
      flex-direction: column;
      align-items: stretch;
    }

    .summary-band,
    .map-layout {
      grid-template-columns: 1fr;
    }

    .header-actions {
      justify-content: stretch;
    }

    .secondary-link {
      width: 100%;
      box-sizing: border-box;
    }

    .map-frame {
      min-height: 380px;
    }
  }
</style>
