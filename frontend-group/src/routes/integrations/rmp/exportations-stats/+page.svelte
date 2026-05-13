<script>
  import { onDestroy, onMount, tick } from "svelte";

  const WINE_STATS_URL = "/api/v1/wine-stats?limit=200";
  const EXPORTATIONS_URL = "/api/proxy/exportations-stats?limit=200";

  let Highcharts;
  let vennContainer;
  let vennChart;

  let loading = true;
  let error = "";

  let crossRows = [];
  let totalWines = 0;
  let totalExportations = 0;

  // Conjuntos para el Venn
  let onlyWine = 0;
  let onlyArms = 0;
  let both = 0;

  const fmtDec = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 2 });
  const fmtInt = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 0 });

  // Pasa nombres de pais a formato titulo para mostrarlos mejor.
  function titleCase(str) {
    return String(str ?? "")
      .split(/[-\s]+/)
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }

  // Normaliza paises para poder cruzar wine-stats con exportations-stats.
  function normCountry(str) {
    const cleaned = String(str ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[.,]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    const aliases = {
      spain: "spain",
      espana: "spain",
      germany: "germany",
      alemania: "germany"
    };

    return aliases[cleaned] || cleaned;
  }

  // Carga Highcharts y los modulos de Venn y accesibilidad.
  async function loadHighcharts() {
    if (Highcharts) return;
    const mod = await import("highcharts");
    Highcharts = mod.default;
    window._Highcharts = Highcharts;

    // Módulo Venn (necesario)
    const vennMod = await import("highcharts/modules/venn.js");
    const vennFn = vennMod.default ?? vennMod;
    if (typeof vennFn === "function") vennFn(Highcharts);

    // Accesibilidad
    const accMod = await import("highcharts/modules/accessibility.js");
    const accFn = accMod.default ?? accMod;
    if (typeof accFn === "function") accFn(Highcharts);
  }

  // Pinta el diagrama de Venn de paises compartidos/no compartidos.
  function renderVenn() {
    if (!vennContainer || !Highcharts) return;
    vennChart?.destroy();

  // Valores fijos para que los dos círculos tengan el mismo tamaño visual.
  // Solo la intersección es proporcional a `both`.
    const BASE = 10;
    const intersectionValue = both > 0 ? Math.max(1, Math.round((both / Math.max(onlyWine + both, onlyArms + both)) * BASE * 2)) : 1;

    vennChart = Highcharts.chart(vennContainer, {
    chart: {
      backgroundColor: "transparent",
      height: 400
    },

    title: {
      text: "Países productores de vino vs. países en exportaciones de armamento",
      align: "left",
      style: { fontSize: "14px", color: "#1a1a1a" }
    },

    subtitle: {
      text: "Intersección entre wine-stats (SOS2526-29) y exportations-stats (SOS2526-13)",
      align: "left",
      style: { fontSize: "12px", color: "#888" }
    },

    accessibility: {
      enabled: true,
      point: { valueDescriptionFormat: "{point.name}: {point.longDescription}." },
      description: "Diagrama de Venn que muestra la intersección entre países productores de vino y países presentes en exportaciones de armamento."
    },

    tooltip: {
      headerFormat:
        '<span style="color:{point.color}">●</span> ' +
        '<span style="font-size:14px"> {point.point.name}</span><br/>',
      pointFormat: "{point.longDescription}"
    },

    series: [
      {
        type: "venn",
        name: "Países",
        data: [
          {
            sets: ["Wine Stats"],
            value: BASE,                      // <-- fijo
            name: `Wine Stats (${onlyWine + both})`,
            color: "#01696f",
            longDescription: `${onlyWine + both} países tienen vinos en wine-stats. De ellos, ${both} también aparecen en exportaciones de armamento.`
          },
          {
            sets: ["Exportaciones"],
            value: BASE,                      // <-- fijo, mismo tamaño
            name: `Armamento (${onlyArms + both})`,
            color: "#437a22",
            longDescription: `${onlyArms + both} países aparecen en exportations-stats. De ellos, ${both} también producen vinos en nuestro catálogo.`
          },
          {
            sets: ["Wine Stats", "Exportaciones"],
            value: intersectionValue,         // <-- proporcional a `both`
            name: `En ambos (${both})`,
            color: "#d19900",
            longDescription: `${both} países aparecen en ambos datasets: ${crossRows
              .filter((r) => r.receivedTiv !== null || r.exportedTiv !== null)
              .map((r) => titleCase(r.country))
              .join(", ")}.`
          }
        ]
      }
    ],

    credits: { enabled: false }
    });
  }

  // Carga vinos y exportaciones, cruza paises y prepara listas auxiliares.
  async function load() {
    loading = true;
    error = "";
    try {
      const [wRes, eRes] = await Promise.all([
        fetch(WINE_STATS_URL),
        fetch(EXPORTATIONS_URL)
      ]);
      if (!wRes.ok) throw new Error(`wine-stats: ${wRes.status}`);
      if (!eRes.ok) throw new Error(`exportations-stats: ${eRes.status}`);

      const wines = await wRes.json();
      const exportations = await eRes.json();

      const winesArr = Array.isArray(wines) ? wines : [];
      const expArr = Array.isArray(exportations) ? exportations : [];

      totalWines = winesArr.length;
      totalExportations = expArr.length;

      // Agrupar vinos por país
      const wineByCountry = {};
      for (const w of winesArr) {
        const key = normCountry(w.country);
        if (!wineByCountry[key]) {
          wineByCountry[key] = {
            rawName: w.country,
            count: 0,
            priceSum: 0,
            abvSum: 0,
            types: {}
          };
        }
        const entry = wineByCountry[key];
        entry.count++;
        entry.priceSum += Number(w.price) || 0;
        entry.abvSum += Number(w.abv) || 0;
        entry.types[w.type] = (entry.types[w.type] || 0) + 1;
      }

      // Agrupar exportaciones por receptor y proveedor
      const byRecipient = {};
      const bySupplier = {};
      const armsCountries = new Set();

      for (const e of expArr) {
        const rec = normCountry(e.recipient);
        const sup = normCountry(e.supplier);
        const tiv = Number(e.tiv_total_order) || 0;

        if (rec) {
          armsCountries.add(rec);
          if (!byRecipient[rec]) byRecipient[rec] = { tiv: 0, count: 0, topSup: {} };
          byRecipient[rec].tiv += tiv;
          byRecipient[rec].count++;
          byRecipient[rec].topSup[sup] = (byRecipient[rec].topSup[sup] || 0) + tiv;
        }
        if (sup) {
          armsCountries.add(sup);
          if (!bySupplier[sup]) bySupplier[sup] = { tiv: 0, count: 0, rawName: e.supplier };
          bySupplier[sup].tiv += tiv;
          bySupplier[sup].count++;
        }
      }

      // Calcular conjuntos para el Venn
      const wineCountries = new Set(Object.keys(wineByCountry));
      const intersection = [...wineCountries].filter((k) => armsCountries.has(k));

      both     = intersection.length;
      onlyWine = wineCountries.size - both;
      onlyArms = armsCountries.size - both;

      // Filas cruzadas para la tabla
      crossRows = Object.entries(wineByCountry)
        .map(([key, w]) => {
          const rec = byRecipient[key] ?? null;
          const sup = bySupplier[key] ?? null;
          const topSup = rec
            ? Object.entries(rec.topSup).sort((a, b) => b[1] - a[1])[0]?.[0]
            : null;
          const dominantType =
            Object.entries(w.types).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
          return {
            country: w.rawName,
            wineCount: w.count,
            avgPrice: w.priceSum / w.count,
            avgAbv: w.abvSum / w.count,
            dominantType,
            receivedTiv: rec?.tiv ?? null,
            receivedCount: rec?.count ?? 0,
            topSupplier: topSup,
            exportedTiv: sup?.tiv ?? null,
            exportedCount: sup?.count ?? 0
          };
        })
        .sort((a, b) => b.wineCount - a.wineCount);

      loading = false;
      await tick();
      await loadHighcharts();
      renderVenn();
    } catch (e) {
      error = e.message || "No se pudo cargar la integración.";
      loading = false;
    }
  }

  // Arranca la integracion al abrir la pantalla.
  onMount(load);
  onDestroy(() => vennChart?.destroy());
</script>

<svelte:head>
  <title>Exportations Stats – RMP</title>
</svelte:head>

<div class="page">
  <div class="hero">
    <a href="/integrations/rmp" class="back-link">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M19 12H5M12 5l-7 7 7 7"/>
      </svg>
      Integraciones RMP
    </a>
    <div class="hero-badge">USO 02 · Integración externa</div>
    <h1>
      Exportations Stats <span class="accent">(SOS2526-13)</span>
    </h1>
    <p class="hero-desc">
      Cruce entre el catálogo de vinos de wine-stats y las exportaciones de armamento
      de SOS2526‑13, con diagrama de Venn y tabla cruzada.
    </p>
  </div>

  <section class="source-grid">
    <a
      class="source-card"
      href="https://sos2526-13.onrender.com/api/v2/exportations-stats"
      target="_blank"
      rel="noopener"
    >
      <span>API alumno SOS (distinto grupo)</span>
      <strong>SOS2526-13 · exportations-stats</strong>
    </a>
    <a
      class="source-card"
      href="https://documenter.getpostman.com/view/52406650/2sBXiomVBY"
      target="_blank"
      rel="noopener"
    >
      <span>Documentación</span>
      <strong>Postman SOS2526-13</strong>
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
        <span class="summary-num">{fmtInt.format(totalExportations)}</span>
        <span class="summary-label">exportaciones SOS2526-13</span>
      </div>
      <div class="summary-card">
        <span class="summary-num">{crossRows.length}</span>
        <span class="summary-label">países productores de vino</span>
      </div>
      <div class="summary-card">
        <span class="summary-num">{both}</span>
        <span class="summary-label">países en ambos datasets</span>
      </div>
    </div>

    <section class="chart-panel">
      <h2 class="section-title">Intersección de países entre datasets</h2>
      <p class="chart-note">
        El diagrama muestra cuántos países de wine-stats también aparecen en
        exportations-stats como proveedores o receptores de armamento.
      </p>
      <div bind:this={vennContainer} class="chart-frame"></div>
    </section>

    <section>
      <h2 class="section-title">
        Cruce: países productores de vino vs. exportaciones de armamento
      </h2>
      <p class="table-note">
        Fuente: SOS2526-13 y SOS2526-29 · Los valores de TIV se obtienen desde
        <code>exportations-stats</code>.
      </p>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>País</th>
              <th>Nº vinos</th>
              <th>Precio medio (£)</th>
              <th>ABV medio (%)</th>
              <th>Tipo dominante</th>
              <th>TIV recibido</th>
              <th>Principal proveedor</th>
              <th>TIV exportado</th>
            </tr>
          </thead>
          <tbody>
            {#each crossRows as row}
              <tr>
                <td class="td-country">{titleCase(row.country)}</td>
                <td class="td-num">{row.wineCount}</td>
                <td class="td-num">{fmtDec.format(row.avgPrice)}</td>
                <td class="td-num">{fmtDec.format(row.avgAbv)}</td>
                <td>{row.dominantType}</td>
                <td class="td-num">
                  {#if row.receivedTiv !== null}
                    {fmtDec.format(row.receivedTiv)}
                    <small>({row.receivedCount} pedido{row.receivedCount !== 1 ? "s" : ""})</small>
                  {:else}
                    <span class="na">Sin datos</span>
                  {/if}
                </td>
                <td>
                  {#if row.topSupplier}
                    {titleCase(row.topSupplier)}
                  {:else}
                    <span class="na">—</span>
                  {/if}
                </td>
                <td class="td-num">
                  {#if row.exportedTiv !== null}
                    {fmtDec.format(row.exportedTiv)}
                    <small>({row.exportedCount} pedido{row.exportedCount !== 1 ? "s" : ""})</small>
                  {:else}
                    <span class="na">Sin datos</span>
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </section>
  {/if}
</div>

<style>
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
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
    transition: box-shadow 160ms ease;
  }
  .source-card:hover { box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08); }
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
  .chart-frame { min-height: 400px; }

  section { margin-bottom: 3rem; }

  .table-note {
    font-size: 0.8rem;
    color: #888;
    margin-bottom: 1rem;
  }
  .table-note code {
    background: #f3f0ec;
    padding: 2px 6px;
    border-radius: 4px;
    font-family: monospace;
    font-size: 0.78rem;
  }

  .table-wrap {
    overflow-x: auto;
    border: 1px solid #e8e6e2;
    border-radius: 10px;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.8375rem;
  }
  thead tr { background: #f3f0ec; }
  th {
    text-align: left;
    padding: 0.65rem 1rem;
    font-weight: 600;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #777;
    white-space: nowrap;
    border-bottom: 1px solid #e8e6e2;
  }
  td {
    padding: 0.6rem 1rem;
    border-bottom: 1px solid #ebebeb;
    color: #1a1a1a;
    vertical-align: middle;
  }
  tbody tr:last-child td { border-bottom: none; }
  tbody tr:nth-child(even) { background: #f9f8f5; }
  tbody tr:hover { background: #f3f0ec; }

  .td-country { font-weight: 500; white-space: nowrap; }
  .td-num {
    font-variant-numeric: tabular-nums;
    text-align: right;
    white-space: nowrap;
  }
  small {
    display: block;
    color: #777;
    font-size: 0.78rem;
  }
  .na {
    color: #999;
    font-style: italic;
  }

  @media (max-width: 480px) {
    .page { padding: 1.5rem 1rem 3rem; }
    .summary-row { flex-direction: column; }
  }
</style>
