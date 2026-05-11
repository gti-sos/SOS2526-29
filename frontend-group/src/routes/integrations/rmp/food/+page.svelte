<script>
  import { onDestroy, onMount, tick } from "svelte";

  // ── Configuración ──────────────────────────────────────────────────────────
  const WINE_STATS_URL = "/api/v1/wine-stats?limit=200";
  const USDA_API_KEY   = "DEMO_KEY";
  const USDA_SEARCH    = "https://api.nal.usda.gov/fdc/v1/foods/search";

  // Mapeo tipo de vino → query de búsqueda en USDA
  const TYPE_TO_USDA_QUERY = {
    Red:       "red wine",
    White:     "white wine",
    "Rosé":    "rose wine",
    Sparkling: "sparkling wine"
  };

  // Colores para el gráfico
  const TYPE_COLOR = {
    Red:       "rgb(220, 160, 160)",
    White:     "rgb(240, 220, 140)",
    "Rosé":    "rgb(240, 180, 210)",
    Sparkling: "rgb(160, 200, 240)"
  };

  // ── Estado ─────────────────────────────────────────────────────────────────
  let loading     = true;
  let error       = "";
  let loadingStep = 0;

  let totalWines   = 0;
  let crossRows    = [];
  let matchedTypes = 0;

  // ── Highcharts ─────────────────────────────────────────────────────────────
  let Highcharts;
  let vennContainer;
  let vennChart;

  // ── Formateadores ──────────────────────────────────────────────────────────
  const fmtDec = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 2 });
  const fmtInt = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 0 });

  // ── Utilidades ─────────────────────────────────────────────────────────────
  const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

  function norm(str) {
    return String(str ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  // Agrupa los nutrientes relevantes de un alimento USDA
  function extractNutrients(food) {
    const nutrients = {};
    for (const n of food.foodNutrients ?? []) {
      const name = n.nutrientName?.toLowerCase() ?? "";
      if (name.includes("alcohol")) nutrients.alcohol = n.value;
      if (name.includes("energy") && name.includes("kcal")) nutrients.kcal = n.value;
      if (name.includes("carbohydrate")) nutrients.carbs = n.value;
    }
    return nutrients;
  }

  // Cuenta cuántos productos tienen cada categoría USDA (brandOwner como agrupador)
  function countBrands(foods) {
    const counts = {};
    for (const f of foods) {
      const brand = f.brandOwner || "Sin marca";
      counts[brand] = (counts[brand] || 0) + 1;
    }
    // Devolver top 5
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([brand, count]) => ({ brand, count }));
  }

  // ── Highcharts: carga dinámica ─────────────────────────────────────────────
  async function loadHighcharts() {
    if (Highcharts) return;
    const mod = await import("highcharts");
    Highcharts = mod.default;

    const vennMod = await import("highcharts/modules/venn.js");
    const vennFn = vennMod.default ?? vennMod;
    if (typeof vennFn === "function") vennFn(Highcharts);

    const accMod = await import("highcharts/modules/accessibility.js");
    const accFn = accMod.default ?? accMod;
    if (typeof accFn === "function") accFn(Highcharts);
  }

  // ── Highcharts: construcción de datos ──────────────────────────────────────
  function buildVennData() {
    const data = [];

    for (const row of crossRows) {
      data.push({
        sets: [row.type],
        value: Math.max(3, Math.round(row.usdaCount / 5)),
        name: `${row.type} wine`,
        color: TYPE_COLOR[row.type] ?? "rgb(200,200,200)",
        dataLabels: { style: { fontSize: "13px" } },
        customDesc:
          `${fmtInt.format(row.usdaCount)} productos en USDA · ` +
          `${row.wineCount} vinos propios · ` +
          `precio medio £${fmtDec.format(row.avgPrice)} · ` +
          `ABV medio ${fmtDec.format(row.avgAbv)} %`
      });
    }

    for (let i = 0; i < crossRows.length; i++) {
      for (let j = i + 1; j < crossRows.length; j++) {
        const a = crossRows[i];
        const b = crossRows[j];
        const abvDiff = Math.abs(a.avgAbv - b.avgAbv);

        if (abvDiff < 2) {
          data.push({
            sets: [a.type, b.type],
            value: Math.max(0.5, 2 - abvDiff),
            name: `ABV similar (~${fmtDec.format((a.avgAbv + b.avgAbv) / 2)} %)`,
            color: "rgb(200, 210, 200)"
          });
        }
      }
    }

    return data;
  }

  // ── Highcharts: renderizado ────────────────────────────────────────────────
  function renderVenn() {
    if (!vennContainer || !Highcharts || !crossRows.length) return;
    vennChart?.destroy();

    vennChart = Highcharts.chart(vennContainer, {
      chart: { backgroundColor: "transparent", height: 500 },

      title: {
        text: "Relaciones entre tipos de vino: wine-stats vs. USDA FoodData Central",
        align: "left",
        style: { fontSize: "14px", color: "#1a1a1a" }
      },

      subtitle: {
        text: "Tamaño proporcional a productos en USDA · Intersecciones = ABV similar",
        align: "left",
        style: { fontSize: "11px", color: "#888" }
      },

      tooltip: {
        headerFormat: "",
        pointFormat:
          "{#if (eq 1 point.sets.length)}" +
            "<b>{point.name}</b><br/>{point.customDesc}" +
          "{else}" +
            "Tipos: {#each point.sets}<b>{this}</b>{#unless @last} y {/unless}{/each}" +
            "<br/><br/><b>{point.name}</b>" +
          "{/if}"
      },

      series: [{
        type: "venn",
        dataLabels: { style: { color: "#1a1a1a" } },
        data: buildVennData()
      }],

      accessibility: { enabled: true },
      credits: { enabled: false }
    });
  }

  // ── Llamada a USDA FoodData Central ───────────────────────────────────────
  async function fetchUSDA(query, retries = 2) {
    const url =
      `${USDA_SEARCH}?api_key=${USDA_API_KEY}` +
      `&query=${encodeURIComponent(query)}` +
      `&dataType=Branded` +
      `&pageSize=25`;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const res = await fetch(url);

        if (res.status === 429) {
          if (attempt < retries) { await sleep(1500 * (attempt + 1)); continue; }
          return { totalHits: 0, foods: [] };
        }

        if (!res.ok) return { totalHits: 0, foods: [] };

        const data = await res.json();
        return {
          totalHits: data.totalHits ?? 0,
          foods: Array.isArray(data.foods) ? data.foods : []
        };
      } catch {
        if (attempt < retries) await sleep(1000);
        else return { totalHits: 0, foods: [] };
      }
    }
    return { totalHits: 0, foods: [] };
  }

  // ── Carga principal ────────────────────────────────────────────────────────
  async function load() {
    loading     = true;
    loadingStep = 0;
    error       = "";

    try {
      // 1. Cargar vinos propios
      const wRes = await fetch(WINE_STATS_URL);
      if (!wRes.ok) throw new Error(`wine-stats: ${wRes.status}`);
      const wines = await wRes.json();
      totalWines = wines.length ?? 0;

      // 2. Agrupar por tipo
      const byType = {};
      for (const wine of wines) {
        const type = String(wine.type ?? "").trim();
        if (!type) continue;
        if (!byType[type]) byType[type] = { count: 0, priceSum: 0, abvSum: 0 };
        byType[type].count++;
        byType[type].priceSum += Number(wine.price) || 0;
        byType[type].abvSum   += Number(wine.abv)   || 0;
      }

      // 3. Consultar USDA con delay entre peticiones
      const results = [];
      for (const [type, stats] of Object.entries(byType)) {
        const query = TYPE_TO_USDA_QUERY[type];
        if (!query) continue;

        if (results.length > 0) await sleep(500);

        const { totalHits, foods } = await fetchUSDA(query);
        loadingStep++;

        const topBrands = countBrands(foods);

        // Muestra de hasta 4 productos con nombre e info nutricional
        const sample = foods
          .filter(f => f.description)
          .slice(0, 4)
          .map(f => ({
            fdcId:       f.fdcId,
            description: f.description,
            brandOwner:  f.brandOwner ?? "",
            nutrients:   extractNutrients(f)
          }));

        results.push({
          type,
          wineCount: stats.count,
          avgPrice:  stats.priceSum / stats.count,
          avgAbv:    stats.abvSum   / stats.count,
          usdaCount: totalHits,
          topBrands,
          sample
        });
      }

      crossRows    = results.sort((a, b) => b.usdaCount - a.usdaCount);
      matchedTypes = crossRows.length;

      loading = false;
      await tick();
      await loadHighcharts();
      renderVenn();

    } catch (e) {
      error   = e.message || "No se pudo cargar la integración.";
      loading = false;
    }
  }

  onMount(load);
  onDestroy(() => vennChart?.destroy());
</script>

<svelte:head>
  <title>USDA FoodData – RMP</title>
</svelte:head>

<div class="page">

  <!-- Cabecera -->
  <div class="hero">
    <a href="/integrations/rmp" class="back-link">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M19 12H5M12 5l-7 7 7 7"/>
      </svg>
      Integraciones RMP
    </a>
    <div class="hero-badge">USO 04 · Integración externa</div>
    <h1>USDA FoodData Central <span class="accent">(FDC)</span></h1>
    <p class="hero-desc">
      Cruce entre los tipos de vino de wine-stats y los productos registrados
      en USDA FoodData Central, con diagrama de relaciones y muestra de productos reales.
    </p>
  </div>

  <!-- Fuentes de datos -->
  <section class="source-grid">
    <a class="source-card" href="https://fdc.nal.usda.gov" target="_blank" rel="noopener">
      <span>Base de datos pública</span>
      <strong>USDA FoodData Central</strong>
    </a>
    <a class="source-card" href="https://fdc.nal.usda.gov/api-guide" target="_blank" rel="noopener">
      <span>Documentación</span>
      <strong>FDC API Docs</strong>
    </a>
    <a class="source-card" href="/api/v1/wine-stats" target="_blank" rel="noopener">
      <span>API propia</span>
      <strong>SOS2526-29 · wine-stats</strong>
    </a>
  </section>

  <div class="toolbar">
    <button on:click={load}>↺ Actualizar</button>
  </div>

  <!-- Estados -->
  {#if loading}
    <div class="status-box">
      Cargando integración con USDA FoodData Central…
      {#if loadingStep > 0}
        <br/><span style="font-size:0.8rem;color:#aaa">{loadingStep} / 4 tipos cargados</span>
      {/if}
    </div>

  {:else if error}
    <div class="status-box error">{error}</div>

  {:else}

    <!-- Resumen numérico -->
    <div class="summary-row">
      <div class="summary-card">
        <span class="summary-num">{fmtInt.format(totalWines)}</span>
        <span class="summary-label">vinos en wine-stats</span>
      </div>
      <div class="summary-card">
        <span class="summary-num">{fmtInt.format(crossRows.reduce((s, r) => s + r.usdaCount, 0))}</span>
        <span class="summary-label">productos en USDA FDC</span>
      </div>
      <div class="summary-card">
        <span class="summary-num">{matchedTypes}</span>
        <span class="summary-label">tipos de vino cruzados</span>
      </div>
      <div class="summary-card">
        <span class="summary-num">
          {fmtDec.format(crossRows.reduce((s, r) => s + r.avgAbv, 0) / (crossRows.length || 1))} %
        </span>
        <span class="summary-label">ABV medio (wine-stats)</span>
      </div>
    </div>

    <!-- Diagrama de Euler -->
    <section class="chart-panel">
      <h2 class="section-title">Relaciones entre tipos de vino</h2>
      <p class="chart-note">
        Cada círculo representa un tipo de vino. Su tamaño es proporcional al número de productos
        en USDA FoodData Central. Las intersecciones aparecen cuando dos tipos comparten
        un rango de ABV similar.
      </p>
      <div bind:this={vennContainer} class="chart-frame"></div>
    </section>

    <!-- Detalle por tipo -->
    
  {/if}
</div>

<style>
  .page { max-width: 1060px; margin: 0 auto; padding: 2.5rem 1.5rem 4rem; }

  .back-link {
    display: inline-flex; align-items: center; gap: 0.4rem;
    font-size: 0.8125rem; color: #6b6b6b; text-decoration: none;
    margin-bottom: 1.75rem; transition: color 160ms ease;
  }
  .back-link:hover { color: #01696f; }

  .hero { margin-bottom: 2rem; }
  .hero-badge {
    display: inline-block; font-size: 0.7rem; font-weight: 700;
    letter-spacing: 0.1em; text-transform: uppercase; color: #01696f;
    background: color-mix(in oklch, #01696f 12%, transparent);
    border: 1px solid color-mix(in oklch, #01696f 25%, transparent);
    border-radius: 9999px; padding: 0.2rem 0.65rem; margin-bottom: 0.75rem;
  }

  h1 { font-size: clamp(1.5rem, 3.5vw, 2.25rem); font-weight: 700; line-height: 1.2; color: #1a1a1a; margin-bottom: 0.6rem; }
  .accent { color: #01696f; }
  .hero-desc { font-size: 0.9375rem; color: #6b6b6b; max-width: 56ch; line-height: 1.6; }

  .status-box { padding: 1.5rem; border-radius: 8px; background: #f9f8f5; color: #777; font-size: 0.9rem; text-align: center; line-height: 1.8; }
  .status-box.error { color: #a12c7b; }

  .source-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin: 1rem 0 1.5rem; }
  .source-card {
    display: grid; gap: 4px; padding: 14px; border: 1px solid #e8e6e2;
    border-radius: 10px; background: #fff; text-decoration: none; color: inherit;
    box-shadow: 0 4px 12px rgba(0,0,0,0.03); transition: box-shadow 160ms ease;
  }
  .source-card:hover { box-shadow: 0 8px 20px rgba(0,0,0,0.08); }
  .source-card span { color: #777; font-size: 0.82rem; }
  .source-card strong { color: #1a1a1a; font-size: 0.95rem; word-break: break-all; }

  .toolbar { margin-bottom: 1.5rem; }
  button {
    min-height: 40px; border: 0; border-radius: 9999px; background: #01696f;
    color: #fff; padding: 0 18px; font: inherit; font-weight: 700;
    font-size: 0.875rem; cursor: pointer; transition: background 160ms ease;
  }
  button:hover { background: #005a5f; }

  .summary-row { display: flex; gap: 1rem; margin-bottom: 2.5rem; flex-wrap: wrap; }
  .summary-card {
    flex: 1; min-width: 140px; background: #fff; border: 1px solid #e8e6e2;
    border-radius: 10px; padding: 1.25rem 1.5rem; display: flex; flex-direction: column; gap: 0.25rem;
  }
  .summary-num { font-size: 2rem; font-weight: 700; color: #01696f; font-variant-numeric: tabular-nums; line-height: 1; }
  .summary-label { font-size: 0.8rem; color: #777; }

  .chart-panel { background: #fff; border: 1px solid #e8e6e2; border-radius: 10px; padding: 1.5rem; margin-bottom: 3rem; overflow: hidden; }
  .section-title { font-size: 1.1rem; font-weight: 600; color: #1a1a1a; margin-bottom: 0.75rem; }
  .chart-note { font-size: 0.8rem; color: #888; margin-bottom: 1rem; }
  .chart-frame { min-height: 500px; }

  section { margin-bottom: 3rem; }
  .table-note { font-size: 0.8rem; color: #888; margin-bottom: 1.25rem; }
  .table-note code { background: #f3f0ec; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 0.78rem; }

  .type-block { margin-bottom: 2rem; background: #fff; border: 1px solid #e8e6e2; border-radius: 10px; overflow: hidden; }
  .type-header {
    display: flex; align-items: center; gap: 0.75rem; padding: 0.9rem 1.25rem;
    background: #f9f8f5; border-bottom: 1px solid #e8e6e2; flex-wrap: wrap;
  }

  .type-badge {
    display: inline-flex; align-items: center; padding: 0.28rem 0.7rem;
    font-size: 0.75rem; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.05em; border-radius: 9999px;
    color: var(--badge-color, #01696f);
    background: color-mix(in oklab, var(--badge-color, #01696f) 12%, white);
    border: 1px solid color-mix(in oklab, var(--badge-color, #01696f) 28%, white);
  }
  .type-badge[data-type="red"]       { --badge-color: #a12c2c; }
  .type-badge[data-type="white"]     { --badge-color: #d19900; }
  .type-badge[data-type="rosé"],
  .type-badge[data-type="rose"]      { --badge-color: #a12c7b; }
  .type-badge[data-type="sparkling"] { --badge-color: #006494; }

  .type-meta { font-size: 0.85rem; color: #666; }
  .type-meta strong { color: #1a1a1a; }

  .brands-row {
    display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;
    padding: 0.65rem 1.25rem; border-bottom: 1px solid #f0eeeb;
    font-size: 0.8rem;
  }
  .brands-label { color: #888; font-weight: 600; }
  .brand-chip {
    display: inline-flex; align-items: center; padding: 0.18rem 0.55rem;
    font-size: 0.75rem; font-weight: 600; border-radius: 9999px;
    color: #01696f;
    background: color-mix(in oklab, #01696f 10%, white);
    border: 1px solid color-mix(in oklab, #01696f 22%, white);
  }

  .product-list { display: flex; flex-direction: column; gap: 0; }
  .product-item {
    display: flex; align-items: center; justify-content: space-between;
    gap: 1rem; padding: 0.75rem 1.25rem;
    text-decoration: none; color: inherit;
    border-bottom: 1px solid #f0eeeb;
    transition: background 160ms ease;
    flex-wrap: wrap;
  }
  .product-item:last-child { border-bottom: none; }
  .product-item:hover { background: #f9f8f5; }

  .product-info { display: flex; flex-direction: column; gap: 0.15rem; flex: 1; min-width: 0; }
  .product-name {
    font-size: 0.875rem; font-weight: 600; color: #1a1a1a;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .product-brand { font-size: 0.775rem; color: #888; }

  .product-nutrients { display: flex; gap: 0.4rem; flex-wrap: wrap; flex-shrink: 0; }
  .nutrient-chip {
    display: inline-flex; align-items: center; padding: 0.18rem 0.55rem;
    font-size: 0.72rem; font-weight: 600; border-radius: 9999px;
    color: #964219;
    background: color-mix(in oklab, #964219 10%, white);
    border: 1px solid color-mix(in oklab, #964219 22%, white);
  }

  @media (max-width: 480px) {
    .page { padding: 1.5rem 1rem 3rem; }
    .summary-row { flex-direction: column; }
    .type-header { flex-direction: column; align-items: flex-start; }
    .product-item { flex-direction: column; align-items: flex-start; }
  }
</style>