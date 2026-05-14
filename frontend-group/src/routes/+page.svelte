<script>
  // API_ORIGIN decide si los enlaces a API apuntan a local o a Render.
  import { API_ORIGIN } from "@/services/apiBase.js";

  // Comprobamos si el frontend se esta ejecutando con Vite en local.
  const isViteLocal = import.meta.env.DEV;

  // Informacion general del grupo.
  const group = {
    // Nombre que se muestra como titulo principal de la portada.
    name: "SOS2526-29",
    // Texto corto que resume los tres recursos del proyecto.
    description:
      "Nuestro proyecto analiza la relacion entre desastres naturales, estadisticas de ciudades y datos sobre vino.",
    // Enlace al repositorio entregado en GitHub.
    repository: "https://github.com/gti-sos/SOS2526-29",
    // En local mandamos al backend local; en produccion al origen real de Render.
    deployUrl: isViteLocal
      ? "http://localhost:10000/"
      : `${window.location.origin}/`
  };

  // Lista de miembros y enlaces asociados a cada recurso.
  const members = [
    {
      // Datos de RMP.
      name: "Rufino Moreno Pacheco",
      resource: "wine-stats",
      source: "wine-stats",
      frontendUrl: "/wine-stats",
      analyticsUrl: "/analytics/wine-stats",
      videoUrl: "https://youtu.be/Ekca5ytk92Y",
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
      // Datos de LCC: esta es la tarjeta que hay que dominar en la defensa.
      name: "Luis Cortes Cobos (LCC)",
      // Nombre exacto del recurso de la API.
      resource: "citys-stats",
      // Fuente de datos asociada al recurso.
      source: "citys-stats",
      // Pantalla CRUD donde se crean, editan, borran y consultan datos.
      frontendUrl: "/citys-stats",
      // Pantalla de grafica individual de citys-stats.
      analyticsUrl: "/analytics/citys-stats",
      // Video individual de defensa D03.
      videoUrl: "https://drive.google.com/file/d/1eQrHi9SZjL9rFjSMXKlsfm4OR3bbY3Nf/view?usp=drivesdk",
      // Enlaces directos a las dos versiones de API de citys-stats.
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
      // Enlaces directos a documentacion Postman de LCC.
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
      // Datos de ALG.
      name: "Alberto Lirola Gomez",
      resource: "natural-disasters",
      source: "natural-disasters",
      frontendUrl: "/natural-disasters",
      analyticsUrl: "/analytics/natural-disasters",
      videoUrl: "https://drive.google.com/file/d/1EWnZG67eu5oh1cb4qRatLUafsLchD4Vu/view?usp=sharing",
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
  <!-- Cabecera principal de la portada del proyecto. -->
  <header class="hero">
    <h1>{group.name}</h1>
    <p>{group.description}</p>
    <div class="group-links">
      <!-- Enlace externo al repositorio. -->
      <a href={group.repository} target="_blank" rel="noreferrer">Repositorio GitHub</a>
      <!-- Enlace al despliegue del grupo o al backend local si se ejecuta con Vite. -->
      <a href={group.deployUrl} target="_blank" rel="noreferrer">Despliegue del grupo</a>
    </div>
  </header>

  <!-- Tarjetas de cada miembro del grupo. -->
  <section class="members">
    <h2>Componentes del equipo</h2>
    <div class="grid">
      <!-- Se pinta una tarjeta por miembro a partir del array members. -->
      {#each members as member}
        <article class="card" data-testid={`member-${member.resource}`}>
          <h3>{member.name}</h3>
          <p><strong>Recurso de la API:</strong> {member.resource}</p>
          <p><strong>Fuente de datos asociada:</strong> {member.source}</p>

          <div class="buttons">
            <!-- Enlace a la interfaz CRUD del recurso. -->
            <a href={member.frontendUrl} data-testid={`frontend-${member.resource}`}>Frontend</a>

            <!-- Enlace a la grafica o analitica del recurso. -->
            <a href={member.analyticsUrl} data-testid={`analytics-${member.resource}`} class="btn-analytics">
              Analytics
            </a>

            <!-- Enlace directo al video individual de defensa D03. -->
            {#if member.videoUrl}
              <a
                href={member.videoUrl}
                target="_blank"
                rel="noreferrer"
                data-testid={`video-${member.resource}`}
                class="btn-video"
              >
                Video defensa
              </a>
            {:else}
              <span class="btn-disabled" aria-disabled="true">Video pendiente</span>
            {/if}

            <!-- Enlaces a endpoints REST de la API. -->
            {#each member.apiLinks as link}
              <a href={link.url} target="_blank" rel="noreferrer" data-testid={link.id}>
                {link.label}
              </a>
            {/each}

            <!-- Enlaces a la documentacion Postman. -->
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
    min-height: calc(100vh - 48px);
    background: #0b1220;
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

  .btn-video {
    background: #ef4444;
    color: white;
  }

  .btn-video:hover {
    background: #dc2626;
  }

  .btn-disabled {
    color: #111827;
    background: #cbd5e1;
    padding: 10px 14px;
    border-radius: 10px;
    display: inline-block;
    font-weight: 700;
    cursor: default;
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
