<svelte:head>
    <title>Sobre el Proyecto | SOS2526-29</title>
</svelte:head>

<div class="page">
    <div class="topbar">
        <a href="/" class="btn-back">Volver al inicio</a>
    </div>

    <!-- Vista /about exigida por D03.A: aqui deben aparecer los videos de defensa del grupo. -->
    <h1>Sobre el proyecto y videos</h1>
    <p>Presentacion de los miembros del grupo SOS2526-29 y defensa individual del entregable D03.</p>

    <!-- Tarjetas de miembros. Los href de video deben sustituirse por enlaces publicos reales. -->
    <section class="team-grid">
        <div class="member-card">
            <div class="member-info">
                <h3>Rufino Moreno Pacheco</h3>
                <p class="role">Responsable de: wine-stats</p>
                <p class="github">
                    Usuario GitHub:
                    <a href="https://github.com/rufmorpac" target="_blank" rel="noopener noreferrer" class="github-user">
                        rufmorpac
                    </a>
                </p>
            </div>
           <div class="video-box">
                <a
                    href="https://youtu.be/Ekca5ytk92Y"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="btn-video"
                    aria-label="Ver video de defensa D03 de Rufino Moreno Pacheco"
                >
                    Ver video de defensa (D03)
                </a>
            </div>
        </div>

        <div class="member-card">
            <div class="member-info">
                <h3>Luis Cortes Cobos</h3>
                <p class="role">Responsable de: citys-stats</p>
                <p class="github">
                    Usuario GitHub:
                    <a href="https://github.com/luicorcob" target="_blank" rel="noopener noreferrer" class="github-user">
                        luicorcob
                    </a>
                </p>
            </div>
            <div class="video-box">
                <a
                    href="https://drive.google.com/file/d/1eQrHi9SZjL9rFjSMXKlsfm4OR3bbY3Nf/view?usp=drivesdk"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="btn-video"
                    aria-label="Ver video de defensa D03 de Luis Cortes Cobos"
                >
                    Ver video de defensa (D03)
                </a>
            </div>
        </div>

        <div class="member-card">
            <div class="member-info">
                <h3>Alberto Lirola Gomez</h3>
                <p class="role">Responsable de: natural-disasters</p>
                <p class="github">
                    Usuario GitHub:
                    <a href="https://github.com/albertolg10" target="_blank" rel="noopener noreferrer" class="github-user">
                        albertolg10
                    </a>
                </p>
            </div>
            <div class="video-box">
                <span class="btn-video btn-video-disabled" aria-disabled="true">Video pendiente (D03)</span>
            </div>
        </div>
    </section>

    <!-- Enlace comun al repositorio oficial entregado en GitHub. -->
    <section class="project-info">
        <h3>Informacion del repositorio</h3>
        <p>Este proyecto ha sido desarrollado como parte de la asignatura Sistemas Orientados a Servicios (SOS).</p>
        <a href="http://github.com/gti-sos/SOS2526-29/" target="_blank" rel="noreferrer" class="btn-github">
            Repositorio oficial en GitHub
        </a>
    </section>
</div>

<style>
    .page {
        max-width: 1000px;
        margin: 0 auto;
        padding: 40px 20px;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        color: #333;
    }

    h1 {
        color: #111827;
        font-size: 2.5rem;
        margin-bottom: 10px;
    }

    p {
        color: #4b5563;
        font-size: 1.1rem;
    }

    .topbar {
        margin-bottom: 30px;
    }

    .btn-back {
        color: #4b5563;
        text-decoration: none;
        padding: 10px 15px;
        border: 1px solid #d1d5db;
        border-radius: 8px;
        font-weight: 500;
        transition: all 0.2s;
    }

    .btn-back:hover {
        background: #f3f4f6;
        border-color: #9ca3af;
    }

    .team-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 25px;
        margin-top: 40px;
    }

    .member-card {
        background: #ffffff;
        border: 1px solid #e5e7eb;
        border-radius: 15px;
        padding: 25px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        display: flex;
        flex-direction: column;
        justify-content: space-between;
    }

    .member-info h3 {
        margin: 0 0 10px 0;
        color: #1f2937;
    }

    .role {
        font-weight: 600;
        color: #2563eb !important;
        margin-bottom: 5px;
    }

    .github {
        font-size: 0.9rem;
        color: #374151 !important;
        background: #ffffff;
        line-height: 1.5;
    }

    .github-user {
        display: inline-block;
        min-width: 0;
        background: #e5e7eb;
        color: #111827 !important;
        padding: 3px 8px;
        border-radius: 6px;
        font-weight: 600;
        border: 1px solid #d1d5db;
        text-decoration: none;
    }

    .github-user:hover {
        background: #d1d5db;
        color: #030712 !important;
    }

    .video-box {
        margin-top: 20px;
    }

    .btn-video {
        display: block;
        text-align: center;
        background: #ef4444;
        color: white;
        text-decoration: none;
        padding: 12px;
        border-radius: 10px;
        font-weight: bold;
        transition: background 0.3s;
    }

    .btn-video:hover {
        background: #dc2626;
    }

    .btn-video-disabled,
    .btn-video-disabled:hover {
        cursor: not-allowed;
        background: #9ca3af;
        color: #111827;
    }

    .project-info {
        margin-top: 50px;
        padding: 30px;
        background: #f9fafb;
        border-radius: 15px;
        text-align: center;
    }

    .project-info h3 {
        color: #1f2937;
    }

    .btn-github {
        display: inline-block;
        margin-top: 15px;
        background: #1f2937;
        color: white;
        text-decoration: none;
        padding: 12px 25px;
        border-radius: 10px;
    }

    .btn-github:hover {
        background: #111827;
    }
</style>
