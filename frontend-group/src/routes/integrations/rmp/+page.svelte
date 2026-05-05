<script>
  const integrations = [
    {
      id: "exportations-stats",
      title: "Exportations Stats",
      description: "Análisis de estadísticas de exportaciones mundiales cruzadas con datos de producción vinícola.",
      tipo: "INTEGRACION",
      proxy:false,
      icon: "📦",
      color: "#01696f",
      url: "/integrations/rmp/exportations-stats"
    },
    {
      id: "drought-stats",
      title: "Drought Stats",
      description: "Correlación entre sequías por región y el impacto en la producción y calidad del vino.",
      tipo: "USO",
      proxy:true,
      icon: "🌵",
      color: "#964219",
      url: "/integrations/rmp/drought-stats"
    },
    {
      id: "national-team-rankings",
      title: "National Team Rankings",
      description: "Relación entre el ranking de selecciones nacionales de fútbol y el consumo de vino por país.",
      tipo: "USO",
      proxy:false,
      icon: "⚽",
      color: "#437a22",
      url: "/integrations/rmp/national-team-rankings-per-years"
    },
    {
      id: "age-specific-fertility",
      title: "Age-Specific Fertility Rates",
      description: "Estudio demográfico entre tasas de fertilidad por edad y tradición vitivinícola por país.",
      tipo: "USO",
      proxy:true,
      icon: "👶",
      color: "#7a39bb",
      url: "/integrations/rmp/age-specific-fertility-rates"
    },
    {
      id: "hydroelectric-plant",
      title: "World Hydroelectric Plant",
      description: "Análisis del impacto de las plantas hidroeléctricas en la disponibilidad hídrica para la viticultura.",
      tipo: "USO",
      proxy:false,
      icon: "💧",
      color: "#006494",
      url: "/integrations/rmp/world-hydroelectric-plant"
    }
  ];
</script>

<svelte:head>
  <title>Integraciones RMP – SOS2526-29</title>
</svelte:head>

<div class="page">
  <div class="hero">
    <a href="/integrations" class="back-link">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M19 12H5M12 5l-7 7 7 7"/>
      </svg>
      Integraciones
    </a>

    <div class="hero-badge">RMP</div>
    <h1>Wine Stats <span class="accent">× APIs Externas</span></h1>
    <p class="hero-desc">
      Explora cómo los datos de producción y consumo vinícola se cruzan con otras fuentes de datos globales.
    </p>
    <div class="meta">
      <span class="meta-item">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
        </svg>
        Rufino Moreno Pacheco
      </span>
      <span class="meta-divider">·</span>
      <span class="meta-item">{integrations.length} integraciones</span>
    </div>
  </div>

  <div class="grid">
    {#each integrations as item, i}
      <a href={item.url} class="card" style="--accent: {item.color}">
        <div class="card-header">
          <span class="card-icon">{item.icon}</span>
          <span class="card-num">0{i + 1}</span>
          <span class="card-proxy">{item.proxy ? 'Proxy' : 'Sin proxy'}</span>
        </div>
        <h2 class="card-title">{item.title}</h2>
        <span  class="card-type" class:uso={item.tipo === "USO"} class:integracion={item.tipo === "INTEGRACION"}>{item.tipo}</span>
        <p class="card-desc">{item.description}</p>
        <div class="card-footer">
          <span class="card-link">
            Ver integración
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </span>
        </div>
      </a>
    {/each}
  </div>
</div>

<style>
  .page {
    max-width: 960px;
    margin: 0 auto;
    padding: 2.5rem 1.5rem 4rem;
  }

  .back-link {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.8125rem;
    color: var(--color-text-muted, #6b6b6b);
    text-decoration: none;
    margin-bottom: 1.75rem;
    transition: color 160ms ease;
  }
  .back-link:hover {
    color: var(--color-primary, #01696f);
  }

  .hero {
    margin-bottom: 2.5rem;
  }

  .hero-badge {
    display: inline-block;
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--color-primary, #01696f);
    background: color-mix(in oklch, var(--color-primary, #01696f) 12%, transparent);
    border: 1px solid color-mix(in oklch, var(--color-primary, #01696f) 25%, transparent);
    border-radius: 9999px;
    padding: 0.2rem 0.65rem;
    margin-bottom: 0.75rem;
  }

  h1 {
    font-size: clamp(1.75rem, 4vw, 2.75rem);
    font-weight: 700;
    line-height: 1.15;
    color: var(--color-text, #1a1a1a);
    margin-bottom: 0.75rem;
  }

  .accent {
    color: var(--color-primary, #01696f);
  }

  .hero-desc {
    font-size: var(--text-base, 1rem);
    color: var(--color-text-muted, #6b6b6b);
    max-width: 52ch;
    line-height: 1.6;
    margin-bottom: 1rem;
  }

  .meta {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.8125rem;
    color: var(--color-text-faint, #aaa);
  }

  .meta-item {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
  }

  .meta-divider {
    opacity: 0.5;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(280px, 100%), 1fr));
    gap: 1rem;
  }

  .card {
    display: flex;
    flex-direction: column;
    background: var(--color-surface, #fff);
    border: 1px solid var(--color-border, #e8e6e2);
    border-radius: 12px;
    padding: 1.5rem;
    text-decoration: none;
    color: inherit;
    position: relative;
    overflow: hidden;
    transition:
      transform 160ms cubic-bezier(0.16, 1, 0.3, 1),
      box-shadow 160ms cubic-bezier(0.16, 1, 0.3, 1),
      border-color 160ms cubic-bezier(0.16, 1, 0.3, 1);
  }

  .card::before {
    content: '';
    position: absolute;
    inset: 0 0 auto 0;
    height: 3px;
    background: var(--accent);
    opacity: 0;
    transition: opacity 160ms ease;
  }

  .card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px oklch(0.2 0.01 80 / 0.1);
    border-color: color-mix(in oklch, var(--accent) 30%, var(--color-border, #e8e6e2));
  }

  .card:hover::before {
    opacity: 1;
  }

  .card-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 1rem;
  }

  .card-icon {
    font-size: 1.75rem;
    line-height: 1;
  }

  .card-num {
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    color: var(--color-text-faint, #bbb);
    font-variant-numeric: tabular-nums;
  }
  .card-proxy {
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    color: var( #340000);
    font-variant-numeric: tabular-nums;
    margin-left: 0.5rem;
  }

  .card-title {
    font-size: 1rem;
    font-weight: 600;
    line-height: 1.3;
    color: var(--color-text, #1a1a1a);
    margin-bottom: 0.5rem;
  }
  .card-type {
  display: inline-flex;
  align-items: center;
  justify-content: center;

  padding: 0.3rem 0.7rem;
  min-height: 1.8rem;

  font-size: 0.75rem;
  font-weight: 700;
  line-height: 1;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-align: center;
  white-space: nowrap;

  border-radius: 9999px;
  color: var(--badge-text, #01696f);
  background: var(--badge-bg, #d9ecec);
  border: 1px solid var(--badge-border, #b9d7d8);
}
  .card-type.uso {
  --badge-text: #132d01;
  --badge-bg: #d4dfcc;
  --badge-border: #b8c9ad;
  }

  .card-type.integracion {
    --badge-text: #0b5177;
    --badge-bg: #c6d8e4;
    --badge-border: #a9c2d4;
  }


  .card-desc {
    font-size: 0.875rem;
    color: var(--color-text-muted, #777);
    line-height: 1.55;
    flex: 1;
    margin-bottom: 1.25rem;
    max-width: 100%;
  }

  .card-footer {
    margin-top: auto;
  }

  .card-link {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.8125rem;
    font-weight: 600;
    color: var(--accent);
    transition: gap 160ms ease;
  }

  .card:hover .card-link {
    gap: 0.65rem;
  }

  @media (max-width: 480px) {
    .page {
      padding: 1.5rem 1rem 3rem;
    }
  }
</style>