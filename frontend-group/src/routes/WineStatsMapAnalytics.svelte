<script>
  import { onDestroy, onMount, tick } from "svelte";
  import { getAllWineStats } from "../services/wine-stats.js";

  let Highcharts;
  let container;
  let chart;
  let loading = true;
  let error = "";
  let wines = [];

    async function loadHighcharts() {
  if (Highcharts) return;
  const HC = await import("highcharts");
  Highcharts = HC.default || HC;
  window._Highcharts = Highcharts;

  const accessibility = await import("highcharts/modules/accessibility.js");
  const accessFn = accessibility.default || accessibility;
  if (typeof accessFn === "function") accessFn(Highcharts);

  const map = await import("highcharts/modules/map.js");
  const mapFn = map.default || map;
  if (typeof mapFn === "function") mapFn(Highcharts);
}

  // Mapeo de nombres de país en inglés/español a códigos iso-a2
  const countryCodeMap = {
    spain: "ES",
    france: "FR",
    italy: "IT",
    germany: "DE",
    portugal: "PT",
    argentina: "AR",
    chile: "CL",
    australia: "AU",
    "united states": "US",
    usa: "US",
    "united kingdom": "GB",
    uk: "GB",
    "south africa": "ZA",
    newzealand: "NZ",
    "new zealand": "NZ",
    austria: "AT",
    greece: "GR",
    hungary: "HU",
    romania: "RO",
    bulgaria: "BG",
    croatia: "HR",
    moldova: "MD",
    georgia: "GE",
    china: "CN",
    japan: "JP",
    canada: "CA",
    mexico: "MX",
    brazil: "BR",
    uruguay: "UY"
  };

  function buildMapData(wines) {
    const countryMap = {};
    wines.forEach((w) => {
      const code = countryCodeMap[w.country?.toLowerCase().trim()];
      if (!code) return;
      if (!countryMap[code]) {
        countryMap[code] = { code, units: 0, count: 0, country: w.country };
      }
      countryMap[code].units += Number(w.unit) || 0;
      countryMap[code].count += 1;
    });
    return Object.values(countryMap).map((d) => ({
      "hc-key": d.code.toLowerCase(),
      value: d.units,
      count: d.count,
      country: d.country
    }));
  }

  async function renderChart() {
    const topology = await fetch(
      "https://code.highcharts.com/mapdata/custom/world.topo.json"
    ).then((r) => r.json());

    const mapData = buildMapData(wines);

    chart?.destroy();

    chart = Highcharts.mapChart(container, {
      chart: {
        map: topology,
        backgroundColor: "transparent"
      },
      title: {
        text: "Unidades de vino disponibles por país",
        align: "left",
        style: { color: "#0f172a", fontSize: "16px" }
      },
      subtitle: {
        text: "Basado en los datos de wine-stats",
        align: "left"
      },
      credits: { enabled: false },
      accessibility: {
        enabled: true,
        description:
          "Mapa mundial que muestra las unidades de vino disponibles por país según los datos de wine-stats."
      },
      mapNavigation: {
        enabled: true,
        buttonOptions: { verticalAlign: "bottom" }
      },
      colorAxis: {
        min: 0,
        minColor: "#e0f2fe",
        maxColor: "#7c3aed",
        labels: {
          format: "{value} uds"
        }
      },
      tooltip: {
        formatter() {
          if (this.point.value === undefined || this.point.value === null) {
            return `<b>${this.point.name}</b><br/>Sin datos`;
          }
          return `<b>${this.point.country || this.point.name}</b><br/>
            Unidades: <b>${this.point.value}</b><br/>
            Vinos registrados: <b>${this.point.count}</b>`;
        }
      },
      series: [
        {
          name: "Unidades disponibles",
          joinBy: "hc-key",
          data: mapData,
          nullColor: "#e5e7eb",
          borderColor: "#d1d5db",
          borderWidth: 0.5,
          states: {
            hover: { color: "#2563eb" }
          },
          dataLabels: {
            enabled: false
          }
        }
      ]
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
      await renderChart();
    } catch (e) {
      error = e.message || "No se pudieron cargar los datos.";
      loading = false;
    }
  }

  onMount(loadAnalytics);
  onDestroy(() => chart?.destroy());
</script>

<svelte:head>
  <title>Mapa Wine Stats | SOS2526-29</title>
</svelte:head>

<main class="page">
  <header class="header">
    <div>
      <p class="eyebrow">SOS2526-29 — RMP</p>
      <h1>Mapa de Wine Stats</h1>
      <p class="subtitle">
        Distribución mundial de unidades de vino disponibles por país.
      </p>
    </div>
    <div class="header-links">
      <a class="btn-link purple" href="/analytics/wine-stats">📊 Gráfico sincronizado</a>
      <a class="btn-link gray" href="/wine-stats">← Volver a Wine Stats</a>
    </div>
  </header>

  {#if loading}
    <p class="state" role="status">Cargando datos y mapa...</p>
  {:else if error}
    <div class="message error" role="alert">{error}</div>
  {:else}
    <section class="map-panel" aria-label="Mapa de unidades de vino por país">
      <div bind:this={container} class="map-frame"></div>
    </section>

    <section class="resumen" aria-label="Resumen por país">
      <h2>Países con datos</h2>
      <div class="resumen-grid">
        {#each Object.entries(
          wines.reduce((acc, w) => {
            const key = w.country || "Desconocido";
            if (!acc[key]) acc[key] = { count: 0, units: 0 };
            acc[key].count += 1;
            acc[key].units += Number(w.unit) || 0;
            return acc;
          }, {})
        ).sort((a, b) => b[1].units - a[1].units) as [country, stats]}
          <article class="resumen-card">
            <dt>{country}</dt>
            <dd>{stats.units} uds · {stats.count} vino{stats.count !== 1 ? "s" : ""}</dd>
          </article>
        {/each}
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

  .header-links {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .btn-link {
    display: inline-flex;
    align-items: center;
    min-height: 42px;
    padding: 0 16px;
    border-radius: 8px;
    color: white;
    text-decoration: none;
    font-weight: 700;
    white-space: nowrap;
  }

  .btn-link.purple { background: #7c3aed; }
  .btn-link.purple:hover { background: #6d28d9; }
  .btn-link.gray { background: #374151; }
  .btn-link.gray:hover { background: #1f2937; }

  .map-panel {
    background: white;
    border: 1px solid #d9e0ea;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 10px 28px rgba(15, 23, 42, 0.06);
    margin-bottom: 20px;
  }

  .map-frame {
    min-height: 500px;
  }

  .resumen {
    background: white;
    border: 1px solid #d9e0ea;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 10px 28px rgba(15, 23, 42, 0.06);
  }

  .resumen-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 12px;
  }

  .resumen-card {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 12px;
  }

  dt { color: #64748b; font-size: 0.86rem; text-transform: capitalize; }
  dd { margin: 4px 0 0; color: #111827; font-size: 1rem; font-weight: 700; }

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
    .header-links { justify-content: stretch; }
    .btn-link { width: 100%; box-sizing: border-box; justify-content: center; }
  }
</style>