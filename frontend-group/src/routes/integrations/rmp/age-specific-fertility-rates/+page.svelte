<script>
  import { onDestroy, onMount, tick } from "svelte";

  const D3_URL = "https://cdnjs.cloudflare.com/ajax/libs/d3/5.16.0/d3.min.js";
  const C3_URL = "https://cdnjs.cloudflare.com/ajax/libs/c3/0.7.20/c3.min.js";

  let fertility = [];
  let loading = true;
  let error = null;
  let chart = null;

  // Inserta scripts externos en la pagina y resuelve cuando el global existe.
  function loadScript(src, globalName) {
    if (window[globalName]) return Promise.resolve();

    return new Promise((resolve, reject) => {
      const existingScript = document.querySelector(`script[src="${src}"]`);
      if (existingScript) {
        existingScript.addEventListener("load", resolve, { once: true });
        existingScript.addEventListener("error", () => reject(new Error(`No se pudo cargar ${src}`)), { once: true });
        return;
      }
      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`No se pudo cargar ${src}`));
      document.head.appendChild(script);
    });
  }

  // Carga D3 y C3 solo cuando la pantalla lo necesita.
  async function loadC3() {
    await loadScript(D3_URL, "d3");
    await loadScript(C3_URL, "c3");
    if (!window.c3) throw new Error("No se pudo inicializar C3.js.");
  }

  // Al montar, pide los datos al proxy y genera la grafica.
  onMount(async () => {
    try {
      // Proxy definido en Express para evitar problemas CORS.
      const res = await fetch("/api/proxy/age-specific-fertility-rates");
      if (!res.ok) throw new Error(`Error ${res.status}`);
      fertility = await res.json();

      if (fertility.length > 0) await loadC3();

      loading = false;
      await tick();

      if (fertility.length > 0) renderChart();
    } catch (e) {
      error = e.message || "Error al cargar los datos.";
      loading = false;
    }
  });

  // Transforma los datos de fertilidad en columnas C3 por pais/anio.
  function renderChart() {
    const sample = fertility.slice(0, 20);
    chart?.destroy();
    chart = window.c3.generate({
      bindto: "#chart",
      data: {
        columns: [
          ["Fertilidad 15–19", ...sample.map(f => f.fert_15_19)],
          ["Fertilidad 20–24", ...sample.map(f => f.fert_20_24)]
        ],
        type: "bar"
      },
      axis: {
        x: {
          type: "category",
          categories: sample.map(f => f.country_code ?? f.country_name),
          tick: { rotate: -45, multiline: false },
          height: 60
        },
        y: {
          label: { text: "Tasa de fertilidad", position: "outer-middle" }
        }
      },
      color: { pattern: ["#01696f", "#7a39bb"] },
      bar: { width: { ratio: 0.6 } },
      legend: { position: "bottom" }
    });
  }

  onDestroy(() => chart?.destroy());
</script>

<svelte:head>
  <title>Age-Specific Fertility Rates – RMP</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/c3/0.7.20/c3.min.css" />
</svelte:head>

<main class="page">

  <div class="hero">
    <a href="/integrations/rmp" class="back-link">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M19 12H5M12 5l-7 7 7 7"/>
      </svg>
      Integraciones RMP
    </a>
    <div class="hero-badge">USO 01 · Proxy propio</div>
    <h1>Age-Specific <span class="accent">Fertility Rates</span></h1>
    <p class="hero-desc">
      Tasas de fertilidad por franja de edad y país. Datos obtenidos de la API externa.
    </p>
  </div>

  <!-- Recuadros de fuentes -->
  <section class="source-grid">
    <a class="source-card" href="/api/proxy/age-specific-fertility-rates" target="_blank" rel="noopener">
      <span>Proxy propio</span>
      <strong>SOS2526-29 · age-specific-fertility-rates</strong>
    </a>
    <a class="source-card" href="/api/v1/wine-stats" target="_blank" rel="noopener">
      <span>API propia</span>
      <strong>SOS2526-29 · wine-stats</strong>
    </a>
  </section>

  {#if loading}
    <div class="status-box">Cargando datos…</div>
  {:else if error}
    <div class="status-box error">{error}</div>
  {:else if fertility.length === 0}
    <div class="status-box">No hay datos disponibles.</div>
  {:else}

    <div class="summary-row">
      <div class="summary-card">
        <span class="summary-num">{fertility.length}</span>
        <span class="summary-label">registros cargados</span>
      </div>
      <div class="summary-card">
        <span class="summary-num">{[...new Set(fertility.map(f => f.country_name))].length}</span>
        <span class="summary-label">países</span>
      </div>
      <div class="summary-card">
        <span class="summary-num">{[...new Set(fertility.map(f => f.year))].length}</span>
        <span class="summary-label">años distintos</span>
      </div>
    </div>

    <section>
      <div class="widget-header">
        <h2 class="section-title">Fertilidad por franja de edad (primeros 20 países)</h2>
        <div class="widget-meta">
          <span class="lib-badge">C3.js</span>
          <span class="type-badge">Bar Chart</span>
        </div>
      </div>
      <div class="chart-card">
        <div id="chart"></div>
      </div>
    </section>

  {/if}
</main>

<style>
.page {
  max-width: 1100px;
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

/* Recuadros de fuentes */
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
  box-shadow: 0 4px 12px rgba(0,0,0,0.03);
  transition: box-shadow 160ms ease;
}
.source-card:hover { box-shadow: 0 8px 20px rgba(0,0,0,0.08); }
.source-card span { color: #777; font-size: 0.82rem; }
.source-card strong { color: #1a1a1a; font-size: 0.95rem; word-break: break-all; }

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
.summary-label { font-size: 0.8rem; color: #777; }

section { margin-bottom: 3rem; }

.widget-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.widget-header .section-title { margin-bottom: 0; }

.widget-meta {
  display: flex;
  gap: 0.4rem;
}
.lib-badge, .type-badge {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  padding: 0.2rem 0.55rem;
  border-radius: 9999px;
}
.lib-badge {
  background: color-mix(in oklch, #7a39bb 12%, transparent);
  color: #7a39bb;
  border: 1px solid color-mix(in oklch, #7a39bb 25%, transparent);
}
.type-badge {
  background: color-mix(in oklch, #01696f 12%, transparent);
  color: #01696f;
  border: 1px solid color-mix(in oklch, #01696f 25%, transparent);
}

.section-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 1rem;
}

.chart-card {
  background: #fff;
  border: 1px solid #e8e6e2;
  border-radius: 10px;
  padding: 1.5rem;
  overflow-x: auto;
}

#chart {
  min-width: 720px;
  min-height: 340px;
  font-size: 0.8375rem;
}

@media (max-width: 480px) {
  .page { padding: 1.5rem 1rem 3rem; }
  .summary-row { flex-direction: column; }
}
</style>