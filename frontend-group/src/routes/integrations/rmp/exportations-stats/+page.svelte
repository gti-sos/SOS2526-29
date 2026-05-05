<script>
  import { onDestroy, onMount, tick } from "svelte";

  // URLs de las dos APIs.
  const WINE_STATS_URL = "/api/v1/wine-stats?limit=200";
  const EXPORTATIONS_URL = "https://sos2526-13.onrender.com/api/v2/exportations-stats?limit=200";

  // Highcharts dinámico.
  let Highcharts;
  let pieContainer;
  let pieChart;

  // Estado.
  let loading = true;
  let error = "";

  // Datos procesados.
  let crossRows = [];
  let topSuppliers = [];
  let totalWines = 0;
  let totalExportations = 0;

  // Formateadores.
  const fmtDec = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 2 });
  const fmtInt = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 0 });

  // "spain" → "Spain".
  function titleCase(str) {
    return String(str ?? "")
      .split(/[-\s]+/)
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }

  // Normaliza nombre de país para comparar (quita tildes, lowercase).
  function norm(str) {
    return String(str ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  async function loadHighcharts() {
    if (Highcharts) return;
    const mod = await import("highcharts");
    Highcharts = mod.default;
    window._Highcharts = Highcharts;
    await import("highcharts/modules/accessibility.js");
  }

  function renderPie() {
    if (!pieContainer || !Highcharts || !topSuppliers.length) return;
    pieChart?.destroy();
    pieChart = Highcharts.chart(pieContainer, {
      chart: { type: "pie", backgroundColor: "transparent" },
      title: { text: "Top proveedores de armamento por TIV total" },
      subtitle: { text: "Fuente: SOS2526-13 exportations-stats" },
      accessibility: {
        enabled: true,
        description: "Gráfico de tarta con los países que más armamento exportan según TIV total.",
      },
      tooltip: {
        pointFormatter() {
          return `<b>${this.name}</b><br/>TIV: ${fmtDec.format(this.y)}<br/>${this.percentage?.toFixed(1)} %`;
        },
      },
      plotOptions: {
        pie: {
          allowPointSelect: true,
          cursor: "pointer",
          dataLabels: {
            enabled: true,
            format: "<b>{point.name}</b>: {point.percentage:.1f}%",
            style: { fontSize: "11px" },
          },
        },
      },
      series: [
        {
          name: "TIV total",
          colorByPoint: true,
          data: topSuppliers.map((s) => ({ name: titleCase(s.name), y: s.tiv })),
        },
      ],
      credits: { enabled: false },
    });
  }

  async function load() {
    loading = true;
    error = "";
    try {
      const [wRes, eRes] = await Promise.all([
        fetch(WINE_STATS_URL),
        fetch(EXPORTATIONS_URL),
      ]);
      if (!wRes.ok) throw new Error(`wine-stats: ${wRes.status}`);
      if (!eRes.ok) throw new Error(`exportations-stats: ${eRes.status}`);

      const wines = await wRes.json();
      const exportations = await eRes.json();

      const winesArr = Array.isArray(wines) ? wines : [];
      const expArr = Array.isArray(exportations) ? exportations : [];

      totalWines = winesArr.length;
      totalExportations = expArr.length;

      // Agrupar vinos por país.
      const wineByCountry = {};
      for (const w of winesArr) {
        const key = norm(w.country);
        if (!wineByCountry[key]) {
          wineByCountry[key] = {
            rawName: w.country,
            count: 0,
            priceSum: 0,
            abvSum: 0,
            types: {},
          };
        }
        const entry = wineByCountry[key];
        entry.count++;
        entry.priceSum += Number(w.price) || 0;
        entry.abvSum += Number(w.abv) || 0;
        entry.types[w.type] = (entry.types[w.type] || 0) + 1;
      }

      // Agrupar exportaciones por receptor y por proveedor.
      const byRecipient = {};
      const bySupplier = {};
      for (const e of expArr) {
        const rec = norm(e.recipient);
        const sup = norm(e.supplier);
        const tiv = Number(e.tiv_total_order) || 0;

        if (rec) {
          if (!byRecipient[rec]) byRecipient[rec] = { tiv: 0, count: 0, topSup: {} };
          byRecipient[rec].tiv += tiv;
          byRecipient[rec].count++;
          byRecipient[rec].topSup[sup] = (byRecipient[rec].topSup[sup] || 0) + tiv;
        }
        if (sup) {
          if (!bySupplier[sup]) bySupplier[sup] = { tiv: 0, count: 0, rawName: e.supplier };
          bySupplier[sup].tiv += tiv;
          bySupplier[sup].count++;
        }
      }

      // Filas cruzadas: un país por fila, datos de ambas APIs.
      crossRows = Object.entries(wineByCountry)
        .map(([key, w]) => {
          const rec = byRecipient[key] ?? null;
          const sup = bySupplier[key] ?? null;
          const topSup = rec
            ? Object.entries(rec.topSup).sort((a, b) => b[1] - a[1])[0]?.[0]
            : null;
          const dominantType = Object.entries(w.types)
            .sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
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
            exportedCount: sup?.count ?? 0,
          };
        })
        .sort((a, b) => b.wineCount - a.wineCount);

      // Top 8 proveedores para la tarta.
      topSuppliers = Object.values(bySupplier)
        .sort((a, b) => b.tiv - a.tiv)
        .slice(0, 8)
        .map((s) => ({ name: s.rawName, tiv: Math.round(s.tiv * 100) / 100 }));

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
  <title>Exportations Stats | Integraciones RMP</title>
</svelte:head>

<main class="page">
  <div class="topbar">
    <a href="/integrations/rmp" class="btn-back">← Volver</a>
  </div>

  <header class="hero">
    <p class="eyebrow">RMP · wine-stats × SOS2526-13</p>
    <h1>Exportations Stats</h1>
    <p class="subtitle">
      Cruce de los vinos locales con los datos de exportaciones de armamento de
      <strong>SOS2526-13</strong>. Para cada país productor de vino se muestra
      el armamento recibido y exportado según el TIV (Transfer Impact Value).
    </p>
  </header>

  <!-- Fuentes -->
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
    <div class="state">Cargando integración…</div>
  {:else if error}
    <div class="state error">{error}</div>
  {:else}
    <!-- Tarjetas resumen -->
    <section class="stats-row">
      <div class="stat-card">
        <span>Vinos en wine-stats</span>
        <strong>{fmtInt.format(totalWines)}</strong>
      </div>
      <div class="stat-card">
        <span>Exportaciones SOS2526-13</span>
        <strong>{fmtInt.format(totalExportations)}</strong>
      </div>
      <div class="stat-card">
        <span>Países productores de vino</span>
        <strong>{crossRows.length}</strong>
      </div>
      <div class="stat-card">
        <span>Con datos de armamento</span>
        <strong>
          {crossRows.filter((r) => r.receivedTiv !== null || r.exportedTiv !== null).length}
        </strong>
      </div>
    </section>

    <!-- Gráfica Highcharts pie -->
    <section class="chart-panel">
      <h2>Top proveedores de armamento — Highcharts de pie</h2>
      <div bind:this={pieContainer} class="chart-frame"></div>
    </section>

    <!-- Tabla cruzada -->
    <section class="table-panel">
      <h2>Cruce: países productores de vino vs. exportaciones de armamento</h2>
      <p class="table-note">
        Datos de armamento (TIV) de <strong>SOS2526-13</strong>.
        "Sin datos" significa que ese país no aparece en el dataset de exportaciones.
      </p>
      <div class="table-wrapper">
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
                <td class="country-cell">{titleCase(row.country)}</td>
                <td class="num">{row.wineCount}</td>
                <td class="num">{fmtDec.format(row.avgPrice)}</td>
                <td class="num">{fmtDec.format(row.avgAbv)}</td>
                <td>{row.dominantType}</td>
                <td class="num">
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
                <td class="num">
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
</main>

<style>
  :global(body) {
    margin: 0;
    font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
    background: #f6f7fb;
    color: #111827;
  }
  .page { max-width: 1200px; margin: 0 auto; padding: 28px 16px 60px; }
  .topbar { margin-bottom: 20px; }
  .btn-back {
    display: inline-block;
    background: #7c3aed;
    color: #fff;
    padding: 8px 16px;
    border-radius: 8px;
    text-decoration: none;
    font-weight: 700;
    font-size: 0.9rem;
  }
  .btn-back:hover { background: #6d28d9; }
  .hero { margin-bottom: 24px; }
  .eyebrow {
    color: #7c3aed;
    font-size: 0.82rem;
    font-weight: 700;
    text-transform: uppercase;
    margin: 0;
  }
  h1 { margin: 8px 0 6px; font-size: clamp(1.7rem, 4vw, 2.6rem); color: #0f172a; }
  h2 { color: #0f172a; font-size: 1.1rem; margin: 0 0 12px; }
  .subtitle { color: #526174; margin: 0; max-width: 700px; }

  .source-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
    gap: 12px;
    margin-bottom: 20px;
  }
  .source-card {
    display: grid;
    gap: 4px;
    padding: 14px;
    border: 1px solid #d9e0ea;
    border-radius: 8px;
    background: #fff;
    text-decoration: none;
    color: inherit;
    box-shadow: 0 4px 12px rgba(15,23,42,0.05);
    transition: box-shadow 0.15s;
  }
  .source-card:hover { box-shadow: 0 6px 20px rgba(15,23,42,0.10); }
  .source-card span { color: #64748b; font-size: 0.82rem; }
  .source-card strong { color: #0f172a; font-size: 0.95rem; }

  .toolbar { margin-bottom: 20px; }
  button {
    min-height: 40px;
    border: 0;
    border-radius: 8px;
    background: #7c3aed;
    color: #fff;
    padding: 0 18px;
    font: inherit;
    font-weight: 700;
    cursor: pointer;
  }
  button:hover { background: #6d28d9; }

  .stats-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 12px;
    margin-bottom: 24px;
  }
  .stat-card {
    background: #fff;
    border: 1px solid #d9e0ea;
    border-radius: 8px;
    padding: 16px;
    display: grid;
    gap: 6px;
    box-shadow: 0 4px 12px rgba(15,23,42,0.05);
  }
  .stat-card span { color: #64748b; font-size: 0.83rem; }
  .stat-card strong { color: #0f172a; font-size: 1.5rem; font-weight: 800; }

  .chart-panel {
    background: #fff;
    border: 1px solid #d9e0ea;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 4px 12px rgba(15,23,42,0.05);
    margin-bottom: 24px;
  }
  .chart-frame { min-height: 420px; }

  .table-panel {
    background: #fff;
    border: 1px solid #d9e0ea;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 4px 12px rgba(15,23,42,0.05);
  }
  .table-note { color: #64748b; font-size: 0.88rem; margin: 0 0 14px; }
  .table-wrapper { overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
  thead th {
    background: #f1f5f9;
    color: #0f172a;
    padding: 10px 12px;
    text-align: left;
    border-bottom: 2px solid #e2e8f0;
    white-space: nowrap;
  }
  tbody tr:nth-child(even) { background: #f8fafc; }
  tbody tr:hover { background: #ede9fe; }
  td {
    padding: 9px 12px;
    border-bottom: 1px solid #e2e8f0;
    vertical-align: middle;
  }
  .country-cell { font-weight: 600; color: #0f172a; }
  .num { text-align: right; font-variant-numeric: tabular-nums; }
  small { color: #64748b; font-size: 0.78rem; display: block; }
  .na { color: #94a3b8; font-style: italic; }
  .state {
    padding: 20px;
    border-radius: 8px;
    background: #fff;
    border: 1px solid #d9e0ea;
    color: #475569;
  }
  .error { border-color: #fecaca; background: #fef2f2; color: #991b1b; }

  @media (max-width: 700px) {
    .stats-row, .source-grid { grid-template-columns: 1fr; }
    .chart-frame { min-height: 300px; }
  }
</style>