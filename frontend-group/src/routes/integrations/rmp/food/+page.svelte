<script>
  import { onDestroy, onMount, tick } from "svelte";



  const USDA_API_KEY = import.meta.env.VITE_USDA_API_KEY;

  const WINE_STATS_URL = "/api/v1/wine-stats?limit=200";
  const USDA_SEARCH    = "https://api.nal.usda.gov/fdc/v1/foods/search";

  const TYPE_TO_USDA_QUERY = {
    Red:       "red wine",
    White:     "white wine",
    "Rosé":    "rose wine",
  };

  const TYPE_COLOR = {
    Red:       "#DC6060",
    White:     "#D4A843",
    "Rosé":    "#D45FA0",
  };

  // ── Caché en memoria ──────────────────────────────────────────────────────
  // Persiste mientras el componente esté vivo (no se pierde al pulsar Actualizar)
  // Se limpia solo si se recarga la pestaña o se navega fuera
  let cachedUSDA = null; // { timestamp, results[] }
  const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hora

  function isCacheValid() {
    return cachedUSDA && (Date.now() - cachedUSDA.timestamp) < CACHE_TTL_MS;
  }

  let loading     = true;
  let error       = "";
  let loadingStep = 0;
  let fromCache   = false;

  let totalWines   = 0;
  let crossRows    = [];
  let matchedTypes = 0;

  let chartContainer;
  let chartInstance;

  const fmtDec = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 2 });
  const fmtInt = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 0 });

  const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

  function norm(str) {
    return String(str ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  }

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

  function countBrands(foods) {
    const counts = {};
    for (const f of foods) {
      const brand = f.brandOwner || "Sin marca";
      counts[brand] = (counts[brand] || 0) + 1;
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([brand, count]) => ({ brand, count }));
  }

  // ── ECharts ───────────────────────────────────────────────────────────────
  async function renderChart() {
    if (!chartContainer || !crossRows.length) return;

    const echarts = await import("echarts");
    chartInstance?.dispose();
    chartInstance = echarts.init(chartContainer, null, { renderer: "svg" });

    const totalUSDA  = crossRows.reduce((s, r) => s + r.usdaCount, 0);
    const totalLocal = crossRows.reduce((s, r) => s + r.wineCount, 0);

    const outerData = crossRows.map(r => ({
      name:      `${r.type} (USDA)`,
      value:     r.usdaCount,
      itemStyle: { color: TYPE_COLOR[r.type] ?? "#aaa" }
    }));

    const innerData = crossRows.map(r => ({
      name:      `${r.type} (wine-stats)`,
      value:     r.wineCount,
      itemStyle: { color: TYPE_COLOR[r.type] ?? "#aaa", opacity: 0.45 }
    }));

    chartInstance.setOption({
      backgroundColor: "transparent",

      title: {
        text: "% de tipos de vino: wine-stats vs. hits USDA FDC",
        subtext: "Anillo exterior = hits USDA · Anillo interior = vinos propios",
        left: "center", top: 12,
        textStyle:    { fontSize: 14, color: "#1a1a1a", fontWeight: 700 },
        subtextStyle: { fontSize: 11, color: "#888" }
      },

      legend: {
        bottom: 10, left: "center",
        data: crossRows.map(r => r.type),
        formatter: (name) => {
          const r = crossRows.find(x => x.type === name);
          if (!r) return name;
          const pctUSDA  = totalUSDA  ? ((r.usdaCount / totalUSDA)  * 100).toFixed(1) : 0;
          const pctLocal = totalLocal ? ((r.wineCount  / totalLocal) * 100).toFixed(1) : 0;
          return `{bold|${name}}  USDA ${pctUSDA}%  /  propios ${pctLocal}%`;
        },
        textStyle: {
          color: "#555", fontSize: 12,
          rich: { bold: { fontWeight: 700, color: "#1a1a1a" } }
        }
      },

      tooltip: {
        trigger: "item",
        formatter: (params) => {
          const type = params.name.replace(/ \(.*\)$/, "");
          const ring = params.name.includes("USDA") ? "USDA FDC" : "wine-stats";
          const r    = crossRows.find(x => x.type === type);
          if (!r) return params.name;
          return [
            `<b style="color:${TYPE_COLOR[type] ?? '#333'}">${type}</b> · ${ring}`,
            `<b>${fmtInt.format(params.value)}</b> productos (${params.percent?.toFixed(1) ?? "—"}%)`,
            ring === "USDA FDC"
              ? `<span style="color:#888;font-size:11px">wine-stats: ${r.wineCount} vinos · £${fmtDec.format(r.avgPrice)} · ABV ${fmtDec.format(r.avgAbv)}%</span>`
              : `<span style="color:#888;font-size:11px">USDA hits: ${fmtInt.format(r.usdaCount)}</span>`
          ].join("<br/>");
        }
      },

      series: [
        {
          name: "USDA FDC", type: "pie",
          radius: ["52%", "72%"], center: ["50%", "50%"],
          avoidLabelOverlap: true,
          label: {
            show: true, position: "outside",
            formatter: (p) => {
              const type = p.name.replace(/ \(.*\)$/, "");
              return `{bold|${type}}\n${p.percent?.toFixed(1)}%`;
            },
            rich: { bold: { fontWeight: 700, fontSize: 12, color: "#1a1a1a" } },
            fontSize: 11, color: "#555"
          },
          labelLine: { length: 12, length2: 8 },
          emphasis: { scale: true, scaleSize: 8, itemStyle: { shadowBlur: 16, shadowColor: "rgba(0,0,0,0.2)" } },
          data: outerData
        },
        {
          name: "wine-stats", type: "pie",
          radius: ["28%", "48%"], center: ["50%", "50%"],
          avoidLabelOverlap: false,
          label: { show: false }, labelLine: { show: false },
          emphasis: { scale: true, scaleSize: 6, itemStyle: { shadowBlur: 12, shadowColor: "rgba(0,0,0,0.15)" } },
          data: innerData
        }
      ],

      animation: true, animationDuration: 1000, animationEasing: "cubicOut"
    });

    const onResize = () => chartInstance?.resize();
    window.addEventListener("resize", onResize);
    chartInstance._onResize = onResize;
  }

  // ── USDA fetch con reintentos ─────────────────────────────────────────────
  async function fetchUSDA(query, retries = 2) {
    const url =
      `${USDA_SEARCH}?api_key=${USDA_API_KEY}` +
      `&query=${encodeURIComponent(query)}&dataType=Branded&pageSize=25`;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const res = await fetch(url);
        if (res.status === 429) {
          if (attempt < retries) { await sleep(1500 * (attempt + 1)); continue; }
          return { totalHits: 0, foods: [] };
        }
        if (!res.ok) return { totalHits: 0, foods: [] };
        const data = await res.json();
        return { totalHits: data.totalHits ?? 0, foods: Array.isArray(data.foods) ? data.foods : [] };
      } catch {
        if (attempt < retries) await sleep(1000);
        else return { totalHits: 0, foods: [] };
      }
    }
    return { totalHits: 0, foods: [] };
  }

  // ── Carga principal ───────────────────────────────────────────────────────
  async function load(forceRefresh = false) {
    loading     = true;
    loadingStep = 0;
    error       = "";
    fromCache   = false;

    try {
      // 1. Vinos propios (siempre frescos)
      const wRes = await fetch(WINE_STATS_URL);
      if (!wRes.ok) throw new Error(`wine-stats: ${wRes.status}`);
      const wines = await wRes.json();
      totalWines = wines.length ?? 0;

      const byType = {};
      for (const wine of wines) {
        const type = String(wine.type ?? "").trim();
        if (!type) continue;
        if (!byType[type]) byType[type] = { count: 0, priceSum: 0, abvSum: 0 };
        byType[type].count++;
        byType[type].priceSum += Number(wine.price) || 0;
        byType[type].abvSum   += Number(wine.abv)   || 0;
      }

      // 2. USDA: usar caché si es válida y no se fuerza refresco
      if (!forceRefresh && isCacheValid()) {
        fromCache = true;
        crossRows = cachedUSDA.results.map(cached => {
          const stats = byType[cached.type];
          return stats
            ? { ...cached, wineCount: stats.count, avgPrice: stats.priceSum / stats.count, avgAbv: stats.abvSum / stats.count }
            : cached;
        });
        matchedTypes = crossRows.length;
        loading = false;
        await tick();
        await renderChart();
        return;
      }

      // 3. Primera carga o refresco forzado: llamar a USDA
      const results = [];
      for (const [type, stats] of Object.entries(byType)) {
        const query = TYPE_TO_USDA_QUERY[type];
        if (!query) continue;
        if (results.length > 0) await sleep(500);

        const { totalHits, foods } = await fetchUSDA(query);
        loadingStep++;

        results.push({
          type,
          wineCount: stats.count,
          avgPrice:  stats.priceSum / stats.count,
          avgAbv:    stats.abvSum   / stats.count,
          usdaCount: totalHits,
          topBrands: countBrands(foods),
          sample:    foods.filter(f => f.description).slice(0, 4).map(f => ({
            fdcId:       f.fdcId,
            description: f.description,
            brandOwner:  f.brandOwner ?? "",
            nutrients:   extractNutrients(f)
          }))
        });
      }

      // Guardar en caché con timestamp
      cachedUSDA   = { timestamp: Date.now(), results };
      crossRows    = results.sort((a, b) => b.usdaCount - a.usdaCount);
      matchedTypes = crossRows.length;

      loading = false;
      await tick();
      await renderChart();

    } catch (e) {
      error   = e.message || "No se pudo cargar la integración.";
      loading = false;
    }
  }

  // Refresco forzado: ignora caché y vuelve a llamar a USDA
  function forceRefresh() { load(true); }

  onMount(() => load());
  onDestroy(() => {
    if (chartInstance?._onResize) window.removeEventListener("resize", chartInstance._onResize);
    chartInstance?.dispose();
  });
</script>

<svelte:head>
  <title>USDA FoodData – RMP</title>
</svelte:head>

<div class="page">

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
      en USDA FoodData Central, con distribución por categorías y muestra de productos reales.
    </p>
  </div>

  <section class="source-grid">
    <a class="source-card" href="https://fdc.nal.usda.gov" target="_blank" rel="noopener">
      <span>Base de datos pública</span>
      <strong>USDA FoodData Central</strong>
    </a>
    <a class="source-card" href="https://fdc.nal.usda.gov/api-key-signup" target="_blank" rel="noopener">
      <span>Obtén tu key gratuita</span>
      <strong>FDC API Key Signup</strong>
    </a>
    <a class="source-card" href="/api/v1/wine-stats" target="_blank" rel="noopener">
      <span>API propia</span>
      <strong>SOS2526-29 · wine-stats</strong>
    </a>
  </section>

  <div class="toolbar">
    <button on:click={() => load()}>↺ Actualizar</button>
    <button class="btn-secondary" on:click={forceRefresh}>↺ Forzar recarga USDA</button>
    {#if fromCache}
      <span class="cache-badge">
        ✓ Datos USDA desde caché
        {#if cachedUSDA}
          · expira en {Math.max(0, Math.round((CACHE_TTL_MS - (Date.now() - cachedUSDA.timestamp)) / 60000))} min
        {/if}
      </span>
    {/if}
  </div>

  {#if loading}
    <div class="status-box">
      {#if fromCache}
        Actualizando vinos…
      {:else}
        Cargando integración con USDA FoodData Central…
        {#if loadingStep > 0}
          <br/><span style="font-size:0.8rem;color:#aaa">{loadingStep} / 4 tipos cargados</span>
        {/if}
      {/if}
    </div>

  {:else if error}
    <div class="status-box error">{error}</div>

  {:else}

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

    <section class="chart-panel">
      <h2 class="section-title">% de tipos de vino: wine-stats vs. USDA FDC</h2>
      <p class="chart-note">
        Anillo exterior: distribución porcentual de hits en USDA FoodData Central por tipo de vino.
        Anillo interior: distribución de vinos propios en wine-stats.
      </p>
      <div bind:this={chartContainer} style="width: 100%; height: 460px;"></div>
    </section>

    <section>
      <h2 class="section-title">Detalle por tipo de vino</h2>
      {#each crossRows as row}
        <div class="type-block">
          <div class="type-header">
            <span class="type-badge" data-type={norm(row.type)}>{row.type}</span>
            <span class="type-meta">
              {row.wineCount} vino{row.wineCount !== 1 ? "s" : ""} propios ·
              precio medio <strong>£{fmtDec.format(row.avgPrice)}</strong> ·
              ABV medio <strong>{fmtDec.format(row.avgAbv)} %</strong> ·
              <strong>{fmtInt.format(row.usdaCount)}</strong> hits en USDA FDC
            </span>
          </div>

          {#if row.topBrands.length}
            <div class="brands-row">
              <span class="brands-label">Top marcas:</span>
              {#each row.topBrands as b}
                <span class="brand-chip">{b.brand} ({b.count})</span>
              {/each}
            </div>
          {/if}

          <div class="product-list">
            {#each row.sample as p}
              <a
                class="product-item"
                href="https://fdc.nal.usda.gov/food-details/{p.fdcId}/nutrients"
                target="_blank"
                rel="noopener"
              >
                <div class="product-info">
                  <span class="product-name">{p.description}</span>
                  {#if p.brandOwner}
                    <span class="product-brand">{p.brandOwner}</span>
                  {/if}
                </div>
                <div class="product-nutrients">
                  {#if p.nutrients.alcohol != null}
                    <span class="nutrient-chip">Alcohol {p.nutrients.alcohol} g</span>
                  {/if}
                  {#if p.nutrients.kcal != null}
                    <span class="nutrient-chip">{p.nutrients.kcal} kcal</span>
                  {/if}
                  {#if p.nutrients.carbs != null}
                    <span class="nutrient-chip">Carbs {p.nutrients.carbs} g</span>
                  {/if}
                </div>
              </a>
            {/each}
          </div>
        </div>
      {/each}
    </section>

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

  .toolbar { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.5rem; flex-wrap: wrap; }

  button {
    min-height: 40px; border: 0; border-radius: 9999px; background: #01696f;
    color: #fff; padding: 0 18px; font: inherit; font-weight: 700;
    font-size: 0.875rem; cursor: pointer; transition: background 160ms ease;
  }
  button:hover { background: #005a5f; }

  .btn-secondary {
    background: transparent;
    color: #01696f;
    border: 1.5px solid #01696f;
  }
  .btn-secondary:hover { background: color-mix(in oklch, #01696f 8%, transparent); }

  .cache-badge {
    font-size: 0.78rem; color: #437a22; font-weight: 600;
    background: color-mix(in oklab, #437a22 10%, white);
    border: 1px solid color-mix(in oklab, #437a22 22%, white);
    border-radius: 9999px; padding: 0.25rem 0.7rem;
  }

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

  section { margin-bottom: 3rem; }

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
    padding: 0.65rem 1.25rem; border-bottom: 1px solid #f0eeeb; font-size: 0.8rem;
  }
  .brands-label { color: #888; font-weight: 600; }
  .brand-chip {
    display: inline-flex; align-items: center; padding: 0.18rem 0.55rem;
    font-size: 0.75rem; font-weight: 600; border-radius: 9999px;
    color: #01696f;
    background: color-mix(in oklab, #01696f 10%, white);
    border: 1px solid color-mix(in oklab, #01696f 22%, white);
  }

  .product-list { display: flex; flex-direction: column; }
  .product-item {
    display: flex; align-items: center; justify-content: space-between;
    gap: 1rem; padding: 0.75rem 1.25rem;
    text-decoration: none; color: inherit;
    border-bottom: 1px solid #f0eeeb;
    transition: background 160ms ease; flex-wrap: wrap;
  }
  .product-item:last-child { border-bottom: none; }
  .product-item:hover { background: #f9f8f5; }

  .product-info { display: flex; flex-direction: column; gap: 0.15rem; flex: 1; min-width: 0; }
  .product-name { font-size: 0.875rem; font-weight: 600; color: #1a1a1a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
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
    .toolbar { flex-direction: column; align-items: flex-start; }
  }
</style>