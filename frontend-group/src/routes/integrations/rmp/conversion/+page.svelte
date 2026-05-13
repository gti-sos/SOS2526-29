<script>
  import { onDestroy, onMount, tick } from "svelte";

  const WINE_STATS_URL = "/api/v1/wine-stats?limit=200";
  const FX_BASE = "https://api.frankfurter.dev/v2";

  const rateCache = {};

  let chartInstance  = null;
  let loading        = true;
  let error          = "";
  let wines          = [];
  let rates          = { EUR: 1, USD: null, GBP: null };
  let chartContainer;

  const fmtDec = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 2 });

  const SERIES_COLORS = {
    EUR: "#058dc7",
    USD: "#50b432",
    GBP: "#ed561b"
  };

  // Carga un script externo una sola vez y resuelve al terminar.
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) return resolve();
      const s = document.createElement("script");
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  // Espera a que Highcharts este disponible tras cargar el script CDN.
  function waitForHighcharts() {
    return new Promise(resolve => {
      const check = () => {
        if (window.Highcharts) resolve(window.Highcharts);
        else setTimeout(check, 100);
      };
      check();
    });
  }

  // Dibuja el grafico que compara precio/unidad y conversiones de divisa.
  function renderChart() {
    if (!chartContainer || !wines.length) return;
    if (rates.USD === null || rates.GBP === null) return;

    chartInstance?.destroy();

    const filtered = wines.filter(w => w.price > 0 && w.unit > 0);

    const makeSeries = (code, symbol, markerSymbol) => ({
      name: code,
      color: SERIES_COLORS[code],
      marker: { symbol: markerSymbol, radius: 5 },
      data: filtered.map(w => ({
        x: w.unit,                                                  // ← eje X: puntuación
        y: parseFloat((w.price * rates[code]).toFixed(2)),          // ← eje Y: precio
        name: w.title,
        symbol
      }))
    });

    chartInstance = window.Highcharts.chart(chartContainer, {
      chart: {
        type: "scatter",
        zooming: { type: "xy" },
        backgroundColor: "#ffffff",
        style: { fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }
      },
      title: {
        text: "Puntuación vs Precio de vinos",
        style: { fontSize: "16px", fontWeight: "600", color: "#1a1a1a" }
      },
      subtitle: {
        text: 'Fuente: <a href="/api/v1/wine-stats" style="color:#058dc7">SOS2526-29 · wine-stats</a> · Tipos de cambio: Frankfurter / BCE',
        style: { color: "#888" }
      },
      xAxis: {
        title: { text: "Puntuación", style: { color: "#555" } },
        labels: { format: "{value} pts", style: { color: "#666" } },
        startOnTick: true,
        endOnTick: true,
        showLastLabel: true,
        gridLineColor: "#f0f0f0",
        lineColor: "#e0e0e0",
        tickColor: "#e0e0e0"
      },
      yAxis: {
        title: { text: "Precio", style: { color: "#555" } },
        labels: { format: "{value}", style: { color: "#666" } },
        gridLineColor: "#f0f0f0"
      },
      legend: {
        enabled: true,
        itemStyle: { fontSize: "13px", fontWeight: "600", color: "#333" },
        itemHoverStyle: { color: "#000" }
      },
      plotOptions: {
        scatter: {
          marker: {
            radius: 5,
            states: {
              hover: {
                enabled: true,
                lineColor: "rgba(0,0,0,0.4)",
                lineWidth: 1
              }
            }
          },
          states: { hover: { marker: { enabled: false } } },
          jitter: { x: 0.05 }
        }
      },
      tooltip: {
        backgroundColor: "#fff",
        borderColor: "#e0e0e0",
        borderRadius: 8,
        shadow: { color: "rgba(0,0,0,0.08)", offsetX: 0, offsetY: 4, opacity: 1, width: 16 },
        useHTML: true,
        formatter() {
          const p = this.point;
          const color = SERIES_COLORS[p.series.name] || "#333";
          return `
            <div style="min-width:160px; padding:2px 0">
              <div style="font-weight:700; color:#1a1a1a; margin-bottom:4px">${p.name}</div>
              <div style="color:${color}; font-weight:600">
                ${p.symbol}${fmtDec.format(p.y)} ${p.series.name}
              </div>
              <div style="color:#666; margin-top:2px">Puntuación: <b>${p.x} pts</b></div>
            </div>
          `;
        }
      },
      credits: { enabled: false },
      series: [
        makeSeries("EUR", "€", "circle"),
        makeSeries("USD", "$", "triangle"),
        makeSeries("GBP", "£", "square")
      ]
    });
  }

  // Consulta una tasa de cambio EUR -> divisa indicada.
  async function fetchRate(code) {
    if (code === "EUR") return 1;
    if (rateCache[code]) return rateCache[code];
    const r = await fetch(`${FX_BASE}/rate/EUR/${code}`);
    if (!r.ok) throw new Error(`Frankfurter ${r.status}`);
    const data = await r.json();
    rateCache[code] = data.rate;
    return data.rate;
  }

  // Carga vinos y tasas de cambio antes de pintar el grafico.
  async function load() {
    loading = true;
    error   = "";
    try {
      await loadScript("https://code.highcharts.com/highcharts.js");
      await loadScript("https://code.highcharts.com/modules/exporting.js");
      await loadScript("https://code.highcharts.com/modules/export-data.js");
      await loadScript("https://code.highcharts.com/modules/accessibility.js");

      const [winesRes, usd, gbp] = await Promise.all([
        fetch(WINE_STATS_URL),
        fetchRate("USD"),
        fetchRate("GBP")
      ]);
      if (!winesRes.ok) throw new Error(`wine-stats: ${winesRes.status}`);

      wines = await winesRes.json();
      rates = { EUR: 1, USD: usd, GBP: gbp };

      await waitForHighcharts();
    } catch (e) {
      error = e.message;
    } finally {
      loading = false;
    }

    if (!error) {
      await tick();
      renderChart();
    }
  }

  // Arranca la integracion al montar la vista.
  onMount(load);
  onDestroy(() => chartInstance?.destroy());
</script>

<svelte:head>
  <title>Tipos de cambio – RMP</title>
</svelte:head>

<div class="page">

  <div class="hero">
    <a href="/integrations/rmp" class="back-link">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M19 12H5M12 5l-7 7 7 7"/>
      </svg>
      Integraciones RMP
    </a>
    <div class="hero-badge">USO 05 · Integración externa</div>
    <h1>Tipos de cambio <span class="accent">Frankfurter</span></h1>
    <p class="hero-desc">
      Precios de los vinos de wine-stats convertidos en tiempo real usando
      los tipos de cambio del BCE vía Frankfurter API — sin clave, sin límites.
    </p>
  </div>

  <section class="source-grid">
    <a class="source-card" href="https://frankfurter.dev" target="_blank" rel="noopener">
      <span>API pública · sin auth</span>
      <strong>Frankfurter</strong>
    </a>
    <a class="source-card" href="https://frankfurter.dev/providers/" target="_blank" rel="noopener">
      <span>Fuente de datos</span>
      <strong>55 bancos centrales</strong>
    </a>
    <a class="source-card" href="/api/v1/wine-stats" target="_blank" rel="noopener">
      <span>API propia</span>
      <strong>SOS2526-29 · wine-stats</strong>
    </a>
  </section>

  {#if loading}
    <div class="status-box">Cargando vinos y tipos de cambio…</div>

  {:else if error}
    <div class="status-box error">{error}</div>

  {:else}

    <div class="chart-wrapper">
      <div bind:this={chartContainer} class="chart-frame"></div>
      <p class="chart-desc">
        Cada punto es un vino · EUR (círculo) · USD (triángulo) · GBP (cuadrado) ·
        Arrastra para hacer zoom
      </p>
    </div>

  {/if}

</div>

<style>
  .page { max-width: 1060px; margin: 0 auto; padding: 2.5rem 1.5rem 4rem; }

  .back-link { display: inline-flex; align-items: center; gap: 0.4rem; font-size: 0.8125rem; color: #6b6b6b; text-decoration: none; margin-bottom: 1.75rem; transition: color 160ms ease; }
  .back-link:hover { color: #01696f; }

  .hero { margin-bottom: 2rem; }
  .hero-badge { display: inline-block; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #01696f; background: color-mix(in oklch, #01696f 12%, transparent); border: 1px solid color-mix(in oklch, #01696f 25%, transparent); border-radius: 9999px; padding: 0.2rem 0.65rem; margin-bottom: 0.75rem; }
  h1 { font-size: clamp(1.5rem, 3.5vw, 2.25rem); font-weight: 700; color: #1a1a1a; margin-bottom: 0.6rem; }
  .accent { color: #01696f; }
  .hero-desc { font-size: 0.9375rem; color: #6b6b6b; max-width: 56ch; line-height: 1.6; }

  .status-box { padding: 1.5rem; border-radius: 8px; background: #f9f8f5; color: #777; font-size: 0.9rem; text-align: center; }
  .status-box.error { color: #a12c7b; }

  .source-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin: 1rem 0 2rem; }
  .source-card { display: grid; gap: 4px; padding: 14px; border: 1px solid #e8e6e2; border-radius: 10px; background: #fff; text-decoration: none; color: inherit; box-shadow: 0 4px 12px rgba(0,0,0,0.03); transition: box-shadow 160ms ease; }
  .source-card:hover { box-shadow: 0 8px 20px rgba(0,0,0,0.08); }
  .source-card span { color: #777; font-size: 0.82rem; }
  .source-card strong { color: #1a1a1a; font-size: 0.95rem; }

  .chart-wrapper { background: #fff; border: 1px solid #e8e6e2; border-radius: 12px; padding: 1.5rem 1.5rem 1rem; box-shadow: 0 4px 20px rgba(0,0,0,0.04); }
  .chart-frame { min-height: 420px; }
  .chart-desc { margin-top: 0.75rem; font-size: 0.78rem; color: #aaa; text-align: center; }

  @media (max-width: 600px) {
    .page { padding: 1.5rem 1rem 3rem; }
    .chart-wrapper { padding: 1rem 0.75rem 0.75rem; }
  }
</style>
