<script>
  const group = {
    name: "SOS2526-29",
    description:
      "Our project analyzes the correlation between natural disasters, city statistics and wine-related data.",
    repository: "https://github.com/gti-sos/SOS2526-29",
    deployUrl: "https://sos2526-29.onrender.com"
  };

  const members = [
    {
      name: "Rufino Moreno Pacheco",
      resource: "wine-stats",
      frontendUrl: "/wine-stats",
      apiUrl: "https://sos2526-29.onrender.com/api/v1/wine-stats",
      docsUrl: "https://sos2526-29.onrender.com/api/v1/wine-stats/docs"
    },
    {
      name: "Luis Cortes Cobos",
      resource: "citys-stats",
      frontendUrl: "/citys-stats",
      apiUrl: "https://sos2526-29.onrender.com/api/v1/citys-stats",
      docsUrl: "https://sos2526-29.onrender.com/api/v1/citys-stats/docs"
    },
    {
      name: "Alberto Lirola Gomez",
      resource: "natural-disasters",
      frontendUrl: "/natural-disasters",
      apiUrl: "https://sos2526-29.onrender.com/api/v1/natural-disasters",
      docsUrl: "https://sos2526-29.onrender.com/api/v1/natural-disasters/docs"
    }
  ];
</script>

<svelte:head>
  <title>SOS2526-29</title>
  <meta
    name="description"
    content="Portal del grupo SOS2526-29 con enlaces a frontends, APIs y documentación."
  />
</svelte:head>

<div class="page">
  <header class="hero">
    <h1>{group.name}</h1>
    <p>{group.description}</p>

    <div class="group-links">
      <a href={group.repository} target="_blank" rel="noreferrer">Repositorio GitHub</a>
      <a href={group.deployUrl} target="_blank" rel="noreferrer">Despliegue del grupo</a>
    </div>
  </header>

  <section class="members">
    <h2>Componentes del equipo</h2>

    <div class="grid">
      {#each members as member}
        <article class="card">
          <h3>{member.name}</h3>
          <p><strong>Fuente de datos / recurso:</strong> {member.resource}</p>

          <div class="buttons">
            <a href={member.frontendUrl}>Frontend</a>
            <a href={member.apiUrl} target="_blank" rel="noreferrer">API base</a>
            <a href={member.docsUrl} target="_blank" rel="noreferrer">Documentación Postman</a>
          </div>
        </article>
      {/each}
    </div>
  </section>
</div>

<style>
  :global(body) {
    margin: 0;
    font-family: Arial, Helvetica, sans-serif;
    background: #0b1220;
    color: #f5f7fb;
  }

  .page {
    max-width: 1100px;
    margin: 0 auto;
    padding: 32px 20px 60px;
  }

  .hero {
    margin-bottom: 40px;
  }

  h1 {
    font-size: 2.5rem;
    margin-bottom: 12px;
  }

  h2 {
    margin-bottom: 20px;
  }

  p {
    line-height: 1.5;
  }

  .group-links,
  .buttons {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    margin-top: 16px;
  }

  a {
    color: white;
    text-decoration: none;
    background: #2563eb;
    padding: 10px 14px;
    border-radius: 10px;
    display: inline-block;
  }

  a:hover {
    background: #1d4ed8;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 20px;
  }

  .card {
    background: #111827;
    border: 1px solid #1f2937;
    border-radius: 16px;
    padding: 20px;
  }

  .card h3 {
    margin-top: 0;
  }
</style>