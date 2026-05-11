<script>
  import { onDestroy, onMount, tick } from "svelte";

  const WINE_STATS_URL = "/api/v1/wine-stats?limit=200";
  const COCKTAILS_BY_INGREDIENT_BASE = "https://www.thecocktaildb.com/api/json/v1/1/filter.php?i=";

  const WINE_INGREDIENTS = [
    "Red wine", "White wine", "Rose", "Champagne",
    "Prosecco", "Sparkling wine", "Port wine", "Sherry", "Vermouth"
  ];

  let Highcharts;
  let pieContainer;
  let pieChart;
  let patternsEnabled = true;
  let pieColors = [];
  let patterns = [];

  let loading = true;
  let error = "";

  let wines = [];
  let cocktailRows = [];
  let totalCocktails = 0;
  let totalWines = 0;
  let matchedIngredients = 0;

  const fmtDec = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 2 });
  const fmtInt = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 0 });

  function norm(str) {
    return String(str ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  function wineTypeToCocktailIngredient(type) {
    const t = norm(type);
    if (t === "red")               return "Red wine";
    if (t === "white")             return "White wine";
    if (t === "rosé" || t === "rose") return "Rose";
    if (t === "sparkling")         return "Champagne";
    return null;
  }

  async function loadHighcharts() {
    if (Highcharts) return;
    const mod = await import("highcharts");
    Highcharts = mod.default;
    window._Highcharts = Highcharts;

    const patMod = await import("highcharts/modules/pattern-fill.js");
    const patFn = patMod.default ?? patMod;
    if (typeof patFn === "function") patFn(Highcharts);

    const accMod = await import("highcharts/modules/accessibility.js");
    const accFn = accMod.default ?? accMod;
    if (typeof accFn === "function") accFn(Highcharts);

    // Preparar colores y patrones tras cargar Highcharts
    const clrs = Highcharts.getOptions().colors;
    pieColors = [clrs[2], clrs[0], clrs[3], clrs[1], clrs[4]];
    patterns = [0, 1, 2, 3, 4].map((i) => ({
      pattern: Highcharts.merge(Highcharts.patterns[i], { color: pieColors[i] })
    }));
  }

  function renderPie() {
    if (!pieContainer || !Highcharts || !cocktailRows.length) return;
    pieChart?.destroy();

    // Datos: % de cócteles por tipo de vino
    const total = cocktailRows.reduce((s, r) => s + r.cocktailCount, 0);

    pieChart = Highcharts.chart(pieContainer, {
      chart: {
        type: "pie",
        backgroundColor: "transparent",
        height: 420
      },

      title: {
        text: "Cócteles en TheCocktailDB por tipo de vino",
        align: "left",
        style: { fontSize: "14px", color: "#1a1a1a" }
      },

      subtitle: {
        text: "Fuente: TheCocktailDB + SOS2526-29 wine-stats · Haz clic en un sector para ver los cócteles",
        align: "left",
        style: { fontSize: "11px", color: "#888" }
      },

      colors: patternsEnabled ? patterns : pieColors,

      tooltip: {
        valueSuffix: "%",
        borderColor: "#8ae",
        shape: "rect",
        backgroundColor: "rgba(255,255,255,0.94)",
        followPointer: false,
        stickOnContact: true,
        formatter() {
          return `<b>${this.point.name}</b><br/>
            ${this.point.cocktailCount} cócteles (${this.y.toFixed(1)} %)<br/>
            <span style="color:#888;font-size:11px">${this.point.wineCount} vinos · precio medio £${fmtDec.format(this.point.avgPrice)}</span>`;
        }
      },

      plotOptions: {
        series: {
          dataLabels: {
            enabled: true,
            connectorColor: "#777",
            format: "<b>{point.name}</b>: {point.percentage:.1f} %"
          },
          cursor: "pointer",
          borderWidth: 3
        }
      },

      series: [
        {
          name: "Cócteles",
          data: cocktailRows.map((r) => ({
            name: r.wineType,
            y: Math.round((r.cocktailCount / total) * 1000) / 10,
            cocktailCount: r.cocktailCount,
            wineCount: r.wineCount,
            avgPrice: r.avgPrice
          }))
        }
      ],

      responsive: {
        rules: [
          {
            condition: { maxWidth: 500 },
            chartOptions: {
              plotOptions: {
                series: {
                  dataLabels: { format: "<b>{point.name}</b>" }
                }
              }
            }
          }
        ]
      },

      credits: { enabled: false }
    });
  }

  function togglePatterns() {
    if (!pieChart) return;
    pieChart.update({ colors: patternsEnabled ? patterns : pieColors });
  }

  async function fetchCocktailsForIngredient(ingredient) {
    const url = `${COCKTAILS_BY_INGREDIENT_BASE}${encodeURIComponent(ingredient)}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.drinks) ? data.drinks : [];
  }

  async function load() {
    loading = true;
    error = "";
    try {
      const wRes = await fetch(WINE_STATS_URL);
      if (!wRes.ok) throw new Error(`wine-stats: ${wRes.status}`);
      wines = await wRes.json();
      const winesArr = Array.isArray(wines) ? wines : [];
      totalWines = winesArr.length;

      const byType = {};
      for (const w of winesArr) {
        const t = String(w.type ?? "").trim();
        if (!t) continue;
        if (!byType[t]) byType[t] = { count: 0, priceSum: 0 };
        byType[t].count++;
        byType[t].priceSum += Number(w.price) || 0;
      }

      const results = [];
      for (const [wineType, stats] of Object.entries(byType)) {
        const ingredient = wineTypeToCocktailIngredient(wineType);
        if (!ingredient) continue;
        const cocktails = await fetchCocktailsForIngredient(ingredient);
        if (!cocktails.length) continue;
        totalCocktails += cocktails.length;
        results.push({
          ingredient,
          wineType,
          wineCount: stats.count,
          avgPrice: stats.priceSum / stats.count,
          cocktailCount: cocktails.length,
          cocktails: cocktails.slice(0, 5)
        });
      }

      cocktailRows = results.sort((a, b) => b.cocktailCount - a.cocktailCount);
      matchedIngredients = cocktailRows.length;

      loading = false;
      await tick();
      await loadHighcharts();
      renderPie();
    } catch (e) {
      error = e.message || "No se pudo cargar la integración.";
      loading = false;
    }
  }

  onMount(load);
  onDestroy(() => pieChart?.destroy());
</script>

<svelte:head>
  <title>CocktailDB – RMP</title>
</svelte:head>

<div class="page">
  <div class="hero">
    <a href="/integrations/rmp" class="back-link">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M19 12H5M12 5l-7 7 7 7"/>
      </svg>
      Integraciones RMP
    </a>
    <div class="hero-badge">USO 03 · Integración externa</div>
    <h1>The Cocktail DB <span class="accent">(TheCocktailDB)</span></h1>
    <p class="hero-desc">
      Cruce entre los tipos de vino de wine-stats y los cócteles de TheCocktailDB
      que los usan como ingrediente, con precio medio por tipo.
    </p>
  </div>

  <section class="source-grid">
    <a
      class="source-card"
      href="https://the-cocktail-db-five.vercel.app"
      target="_blank"
      rel="noopener"
    >
      <span>API pública gratuita</span>
      <strong>TheCocktailDB</strong>
    </a>
    <a
      class="source-card"
      href="https://www.thecocktaildb.com/api.php"
      target="_blank"
      rel="noopener"
    >
      <span>Documentación</span>
      <strong>TheCocktailDB API docs</strong>
    </a>
    <a class="source-card" href="/api/v1/wine-stats" target="_blank" rel="noopener">
      <span>API propia</span>
      <strong>SOS2526-29 · wine-stats</strong>
    </a>
  </section>

  <div class="toolbar">
    <button on:click={load}>↺ Actualizar</button>
  </div>

  {#if loading}
    <div class="status-box">Cargando integración…</div>
  {:else if error}
    <div class="status-box error">{error}</div>
  {:else}
    <div class="summary-row">
      <div class="summary-card">
        <span class="summary-num">{fmtInt.format(totalWines)}</span>
        <span class="summary-label">vinos en wine-stats</span>
      </div>
      <div class="summary-card">
        <span class="summary-num">{fmtInt.format(totalCocktails)}</span>
        <span class="summary-label">cócteles encontrados</span>
      </div>
      <div class="summary-card">
        <span class="summary-num">{matchedIngredients}</span>
        <span class="summary-label">tipos de vino con cócteles</span>
      </div>
      <div class="summary-card">
        <span class="summary-num">
          {cocktailRows.length ? fmtDec.format(Math.max(...cocktailRows.map(r => r.cocktailCount))) : 0}
        </span>
        <span class="summary-label">máx. cócteles por tipo</span>
      </div>
    </div>

    <section class="chart-panel">
  <h2 class="section-title">Cócteles por tipo de vino</h2>
  <p class="chart-note">
    Distribución porcentual de cócteles en TheCocktailDB según el tipo de vino
    que usan como ingrediente.
  </p>

  <label class="patterns-label">
    <input
      type="checkbox"
      bind:checked={patternsEnabled}
      on:change={togglePatterns}
    />
    Activar patrones de color
  </label>

  <div bind:this={pieContainer} class="chart-frame"></div>
</section>

    <section>
      <h2 class="section-title">Detalle por tipo de vino</h2>
      <p class="table-note">
        Para cada tipo de vino de <code>wine-stats</code> se muestran hasta 5 cócteles de
        <code>TheCocktailDB</code> que lo usan como ingrediente.
      </p>

      {#each cocktailRows as row}
        <div class="type-block">
          <div class="type-header">
            <span class="type-badge" data-type={norm(row.wineType)}>{row.wineType}</span>
            <span class="type-meta">
              {row.wineCount} vino{row.wineCount !== 1 ? "s" : ""} ·
              precio medio <strong>£{fmtDec.format(row.avgPrice)}</strong> ·
              <strong>{row.cocktailCount}</strong> cóctel{row.cocktailCount !== 1 ? "es" : ""} en CocktailDB
            </span>
          </div>

          <div class="cocktail-grid">
            {#each row.cocktails as c}
              <a
                class="cocktail-card"
                href="https://www.thecocktaildb.com/drink/{c.idDrink}"
                target="_blank"
                rel="noopener"
              >
                <img
                  src={c.strDrinkThumb + "/preview"}
                  alt={c.strDrink}
                  width="80"
                  height="80"
                  loading="lazy"
                />
                <span>{c.strDrink}</span>
              </a>
            {/each}
          </div>
        </div>
      {/each}
    </section>
  {/if}
</div>

<style>
.patterns-label {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.82rem;
  color: #666;
  cursor: pointer;
  margin-bottom: 0.75rem;
  user-select: none;
}
.patterns-label input {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: #01696f;
}
  .page {
    max-width: 1060px;
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

  .toolbar { margin-bottom: 1.5rem; }

  button {
    min-height: 40px;
    border: 0;
    border-radius: 9999px;
    background: #01696f;
    color: #fff;
    padding: 0 18px;
    font: inherit;
    font-weight: 700;
    font-size: 0.875rem;
    cursor: pointer;
    transition: background 160ms ease;
  }
  button:hover { background: #005a5f; }

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

  .chart-panel {
    background: #fff;
    border: 1px solid #e8e6e2;
    border-radius: 10px;
    padding: 1.5rem;
    margin-bottom: 3rem;
    overflow: hidden;
  }
  .section-title {
    font-size: 1.1rem;
    font-weight: 600;
    color: #1a1a1a;
    margin-bottom: 0.75rem;
  }
  .chart-note {
    font-size: 0.8rem;
    color: #888;
    margin-bottom: 1rem;
  }
  .chart-frame { min-height: 380px; }

  section { margin-bottom: 3rem; }

  .table-note {
    font-size: 0.8rem;
    color: #888;
    margin-bottom: 1.25rem;
  }
  .table-note code {
    background: #f3f0ec;
    padding: 2px 6px;
    border-radius: 4px;
    font-family: monospace;
    font-size: 0.78rem;
  }

  /* Bloques por tipo */
  .type-block {
    margin-bottom: 2rem;
    background: #fff;
    border: 1px solid #e8e6e2;
    border-radius: 10px;
    overflow: hidden;
  }

  .type-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.9rem 1.25rem;
    background: #f9f8f5;
    border-bottom: 1px solid #e8e6e2;
    flex-wrap: wrap;
  }

  .type-badge {
    display: inline-flex;
    align-items: center;
    padding: 0.28rem 0.7rem;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border-radius: 9999px;
    color: var(--badge-color, #01696f);
    background: color-mix(in oklab, var(--badge-color, #01696f) 12%, white);
    border: 1px solid color-mix(in oklab, var(--badge-color, #01696f) 28%, white);
  }
  .type-badge[data-type="red"]      { --badge-color: #a12c2c; }
  .type-badge[data-type="white"]    { --badge-color: #d19900; }
  .type-badge[data-type="rosé"],
  .type-badge[data-type="rose"]     { --badge-color: #a12c7b; }
  .type-badge[data-type="sparkling"]{ --badge-color: #006494; }

  .type-meta {
    font-size: 0.85rem;
    color: #666;
  }
  .type-meta strong { color: #1a1a1a; }

  .cocktail-grid {
    display: flex;
    gap: 1rem;
    padding: 1rem 1.25rem;
    flex-wrap: wrap;
  }

  .cocktail-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    text-decoration: none;
    color: #1a1a1a;
    font-size: 0.78rem;
    font-weight: 500;
    text-align: center;
    width: 90px;
    transition: opacity 160ms ease;
  }
  .cocktail-card:hover { opacity: 0.75; }
  .cocktail-card img {
    width: 80px;
    height: 80px;
    border-radius: 10px;
    object-fit: cover;
    background: #f3f0ec;
  }

  @media (max-width: 480px) {
    .page { padding: 1.5rem 1rem 3rem; }
    .summary-row { flex-direction: column; }
    .type-header { flex-direction: column; align-items: flex-start; }
  }
</style>