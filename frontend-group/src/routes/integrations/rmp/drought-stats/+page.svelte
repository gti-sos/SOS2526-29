<script>
  import { onMount } from "svelte";

  let droughts = [];
  let loading = true;
  let error = null;

  onMount(async () => {
    try {
      const res = await fetch("/api/proxy/drought-stats");
      if (!res.ok) throw new Error(`Error ${res.status}`);
      droughts = await res.json();
    } catch (e) {
      error = "Error al cargar los datos.";
    } finally {
      loading = false;
    }
  });

  const alertColors = {
    Green:  { bg: "#d4dfcc", text: "#2e5c10" },
    Orange: { bg: "#e7d7c4", text: "#ac3e00" },
    Red:    { bg: "#dececb", text: "#a13544" }
  };

  function alertStyle(level) {
    const c = alertColors[level] || { bg: "#e8e6e2", text: "#555" };
    return `background:${c.bg};color:${c.text}`;
  }

  function severityClass(sev) {
    const n = Number(sev) || 0;
    if (n > 100_000_000) return "sev-high";
    if (n > 50_000_000) return "sev-med";
    return "sev-low";
  }
</script>

<svelte:head>
  <title>Drought Stats – RMP</title>
</svelte:head>

<div class="page">

  <div class="hero">
    <a href="/integrations/rmp" class="back-link">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M19 12H5M12 5l-7 7 7 7"/>
      </svg>
      Integraciones RMP
    </a>
    <div class="hero-badge">Integración 01 · Proxy propio</div>
    <h1>Drought Stats <span class="accent">(SOS2526-19)</span></h1>
    <p class="hero-desc">
      Sequías agrícolas globales obtenidas a través de un proxy propio.
    </p>
  </div>

  {#if loading}
    <div class="status-box">Cargando datos…</div>
  {:else if error}
    <div class="status-box error">{error}</div>
  {:else if droughts.length === 0}
    <div class="status-box">No hay datos disponibles.</div>
  {:else}

    <div class="summary-row">
      <div class="summary-card">
        <span class="summary-num">{droughts.length}</span>
        <span class="summary-label">sequías registradas</span>
      </div>
      <div class="summary-card">
        <span class="summary-num">
          {[...new Set(droughts.map(d => d.country))].length}
        </span>
        <span class="summary-label">países afectados</span>
      </div>
      <div class="summary-card">
        <span class="summary-num red">
          {droughts.filter(d => d.alert_level === "Red").length}
        </span>
        <span class="summary-label">alertas rojas</span>
      </div>
      <div class="summary-card">
        <span class="summary-num orange">
          {droughts.filter(d => d.alert_level === "Orange").length}
        </span>
        <span class="summary-label">alertas naranjas</span>
      </div>
    </div>

    <section>
      <h2 class="section-title">Sequías registradas</h2>
      <p class="table-note">
        Fuente: SOS2526-19 · Accedido vía proxy de /api/proxy/drought-stats
      </p>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>País</th>
              <th>Nivel</th>
              <th>Puntuación</th>
              <th>Desde</th>
              <th>Hasta</th>
              <th>Duración (días)</th>
              <th>Severidad (km²)</th>
              <th>Impacto</th>
            </tr>
          </thead>
          <tbody>
            {#each droughts as d}
              <tr class={severityClass(d.severity_km2)}>
                <td class="td-country">{d.country ?? "—"}</td>
                <td>
                  <span class="badge" style={alertStyle(d.alert_level)}>
                    {d.alert_level ?? "—"}
                  </span>
                </td>
                <td class="td-num">{d.alert_score ?? "—"}</td>
                <td class="td-num">{d.from_date ?? "—"}</td>
                <td class="td-num">{d.to_date ?? "—"}</td>
                <td class="td-num">{d.duration_day ?? "—"}</td>
                <td class="td-num sev-col">
                  {d.severity_km2 != null ? d.severity_km2.toLocaleString() : "—"}
                </td>
                <td class="td-impact">{d.impact ?? "—"}</td>
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
  .summary-num.red { color: #a12c7b; }
  .summary-num.orange { color: #ac3e00; }
  .summary-label {
    font-size: 0.8rem;
    color: #777;
  }

  section { margin-bottom: 3rem; }
  .section-title {
    font-size: 1.1rem;
    font-weight: 600;
    color: #1a1a1a;
    margin-bottom: 0.75rem;
  }
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
  tbody tr:hover { background: #f9f8f5; }
  tbody tr.sev-high { background: #fef2f2; }
  tbody tr.sev-high td { border-bottom-color: #fecaca; }
  tbody tr.sev-med { background: #fffbeb; }
  tbody tr.sev-med td { border-bottom-color: #fde68a; }

  .td-num {
    font-variant-numeric: tabular-nums;
    text-align: right;
    white-space: nowrap;
  }
  .td-country { font-weight: 500; white-space: nowrap; }
  .td-impact { max-width: 220px; color: #666; font-size: 0.8rem; }

  .badge {
    display: inline-block;
    font-size: 0.7rem;
    font-weight: 700;
    padding: 0.2rem 0.55rem;
    border-radius: 9999px;
    white-space: nowrap;
  }

  @media (max-width: 480px) {
    .page { padding: 1.5rem 1rem 3rem; }
    .summary-row { flex-direction: column; }
  }
</style>