<script>
  // Comprobamos si el frontend se esta ejecutando con Vite en local.
  const isViteLocal =
    window.location.hostname === "localhost" && window.location.port === "5173";

  // API_ORIGIN apunta al backend real cuando usamos Vite.
  const API_ORIGIN = isViteLocal
    ? "http://localhost:10000"
    : window.location.origin;

  // Informacion general del grupo.
  const group = {
    name: "SOS2526-29",
    description:
      "Nuestro proyecto analiza la relacion entre desastres naturales, estadisticas de ciudades y datos sobre vino.",
    repository: "https://github.com/gti-sos/SOS2526-29",
    deployUrl: isViteLocal
      ? "http://localhost:10000/"
      : `${window.location.origin}/`
  };

  // Lista de miembros y enlaces asociados a cada recurso.
  const members = [
    {
      name: "Rufino Moreno Pacheco",
      resource: "wine-stats",
      source: "wine-stats",
      frontendUrl: "/wine-stats",
      analyticsUrl: "/analytics/wine-stats",
      apiLinks: [
        {
          id: "api-v1-wine-stats",
          label: "API v1",
          url: `${API_ORIGIN}/api/v1/wine-stats`
        }
      ],
      docsLinks: [
        {
          id: "docs-v1-wine-stats",
          label: "Documentacion Postman v1",
          url: `${API_ORIGIN}/api/v1/wine-stats/docs`
        }
      ]
    },
    {
      name: "Luis Cortes Cobos (LCC)",
      resource: "citys-stats",
      source: "citys-stats",
      frontendUrl: "/citys-stats",
      analyticsUrl: "/analytics/citys-stats",
      apiLinks: [
        {
          id: "api-v1-citys-stats",
          label: "API v1",
          url: `${API_ORIGIN}/api/v1/citys-stats`
        },
        {
          id: "api-v2-citys-stats",
          label: "API v2",
          url: `${API_ORIGIN}/api/v2/citys-stats`
        }
      ],
      docsLinks: [
        {
          id: "docs-v1-citys-stats",
          label: "Documentacion Postman v1",
          url: `${API_ORIGIN}/api/v1/citys-stats/docs`
        },
        {
          id: "docs-v2-citys-stats",
          label: "Documentacion Postman v2",
          url: `${API_ORIGIN}/api/v2/citys-stats/docs`
        }
      ]
    },
    {
      name: "Alberto Lirola Gomez",
      resource: "natural-disasters",
      source: "natural-disasters",
      frontendUrl: "/natural-disasters",
      analyticsUrl: "/analytics/natural-disasters",
      apiLinks: [
        {
          id: "api-v1-natural-disasters",
          label: "API v1",
          url: `${API_ORIGIN}/api/v1/natural-disasters`
        },
        {
          id: "api-v2-natural-disasters",
          label: "API v2",
          url: `${API_ORIGIN}/api/v2/natural-disasters`
        }
      ],
      docsLinks: [
        {
          id: "docs-v1-natural-disasters",
          label: "Documentacion Postman v1",
          url: `${API_ORIGIN}/api/v1/natural-disasters/docs`
        },
        {
          id: "docs-v2-natural-disasters",
          label: "Documentacion Postman v2",
          url: `${API_ORIGIN}/api/v2/natural-disasters/docs`
        }
      ]
    }
  ];
</script>

<svelte:head>
  <title>SOS2526-29 | Inicio</title>
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
        <article class="card" data-testid={`member-${member.resource}`}>
          <h3>{member.name}</h3>
          <p><strong>Recurso de la API:</strong> {member.resource}</p>
          <p><strong>Fuente de datos asociada:</strong> {member.source}</p>

          <div class="buttons">
            <a href={member.frontendUrl} data-testid={`frontend-${member.resource}`}>Frontend</a>

            <a href={member.analyticsUrl} data-testid={`analytics-${member.resource}`} class="btn-analytics">
              Analytics
            </a>

            {#each member.apiLinks as link}
              <a href={link.url} target="_blank" rel="noreferrer" data-testid={link.id}>
                {link.label}
              </a>
            {/each}

            {#each member.docsLinks as link}
              <a href={link.url} target="_blank" rel="noreferrer" data-testid={link.id}>
                {link.label}
              </a>
            {/each}
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
    color: #f5f7fb;
  }

  .hero {
    margin-bottom: 40px;
    text-align: center;
  }

  .hero h1,
  .hero p,
  .members h2,
  .card h3,
  .card p,
  .card strong {
    color: #f5f7fb;
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
  .btn-analytics {
    background: #7c3aed;
    color: white;
  }
  .btn-analytics:hover {
    background: #6d28d9;
  }

  a:hover {
    background: #1d4ed8;
  }

  .members {
    margin-top: 32px;
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
    margin-bottom: 12px;
  }
</style>
