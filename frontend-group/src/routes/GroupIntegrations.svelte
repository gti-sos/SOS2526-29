<script>
  const members = [
    {
      name: "Rufino Moreno",
      resource: "wine-stats",
      status: "Pendiente",
      href: ""
    },
    {
      name: "Luis Cortes",
      resource: "citys-stats",
      status: "Disponible",
      href: "/integrations/citys-stats"
    },
    {
      name: "Alberto Lirola",
      resource: "natural-disasters",
      status: "Disponible",
      href: "/integrations/natural-disasters"
    }
  ];
</script>

<svelte:head>
  <title>Integraciones | SOS2526-29</title>
</svelte:head>

<main class="page">
  <div class="topbar">
    <a href="/" class="btn-back">Volver al inicio</a>
  </div>

  <header class="hero">
    <p class="eyebrow">SOS2526-29</p>
    <h1>Integraciones del grupo</h1>
    <p>Acceso a las vistas de integraciones implementadas en la aplicacion desplegada.</p>
  </header>

  <section class="grid" aria-label="Integraciones por recurso">
    {#each members as member}
      <article class="card">
        <span class:ready={member.href} class="status">{member.status}</span>
        <h2>{member.name}</h2>
        <p><strong>Recurso:</strong> {member.resource}</p>
        {#if member.href}
          <a href={member.href}>Ver integraciones</a>
        {:else}
          <p class="pending">Vista individual no incluida en este cierre.</p>
        {/if}
      </article>
    {/each}
  </section>
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
    padding: 32px 20px 60px;
  }

  .topbar {
    margin-bottom: 24px;
  }

  .hero {
    margin-bottom: 32px;
    text-align: center;
  }

  .eyebrow,
  h1,
  h2,
  p {
    margin: 0;
  }

  .eyebrow {
    color: #0f766e;
    font-size: 0.82rem;
    font-weight: 700;
    text-transform: uppercase;
  }

  h1 {
    margin-top: 8px;
    font-size: clamp(2rem, 4vw, 3rem);
  }

  .hero p {
    margin-top: 10px;
    color: #526174;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 16px;
  }

  .card {
    position: relative;
    border: 1px solid #d9e0ea;
    border-radius: 8px;
    background: #ffffff;
    box-shadow: 0 10px 28px rgba(15, 23, 42, 0.06);
    padding: 20px;
  }

  .card h2 {
    color: #0f172a;
    font-size: 1.15rem;
    margin-bottom: 12px;
  }

  .card p {
    color: #475569;
    line-height: 1.45;
  }

  .status {
    display: inline-flex;
    margin-bottom: 14px;
    border-radius: 999px;
    background: #e2e8f0;
    color: #475569;
    padding: 5px 9px;
    font-size: 0.78rem;
    font-weight: 700;
  }

  .ready {
    background: #0f766e;
    color: white;
  }

  .pending {
    margin-top: 16px;
    color: #9a3412;
  }

  a {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 42px;
    margin-top: 16px;
    border-radius: 8px;
    background: #0f766e;
    color: white;
    padding: 0 14px;
    text-decoration: none;
    font-weight: 700;
  }

  a:hover {
    background: #0b5f59;
  }

  .btn-back {
    margin-top: 0;
    border: 1px solid #cbd5e1;
    background: #ffffff;
    color: #0f172a;
  }

  .btn-back:hover {
    background: #f1f5f9;
  }
</style>
