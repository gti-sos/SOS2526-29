
<svelte:head>
    <title>Sobre el Proyecto | SOS2526-29</title>
</svelte:head>

<div class="page">
    <div class="topbar">
        <a href="/" class="btn-back">← Volver al Inicio</a>
    </div>

    <h1>👥 Sobre el Proyecto y Vídeos</h1>
    <p>Presentación de los miembros del grupo SOS2526-29 y defensa individual del entregable D03.</p>

    <section class="team-grid">
        <div class="member-card">
            <div class="member-info">
                <h3>Alberto Lirola Gomez</h3>
                <p class="role">Responsable de: Desastres Naturales</p>
                <p class="github">Usuario GitHub: <code>albertolg10</code></p>
            </div>
            <div class="video-box">
                <a href="AQUÍ_TU_ENLACE_A_YOUTUBE" target="_blank" class="btn-video">
                    📺 Ver Vídeo de Defensa (D03)
                </a>
            </div>
        </div>

        <div class="member-card">
            <div class="member-info">
                <h3>Nombre Compañero 2</h3>
                <p class="role">Responsable de: Nombre de su API</p>
                <p class="github">Usuario GitHub: <code>usuario-2</code></p>
            </div>
            <div class="video-box">
                <a href="ENLACE_VIDEO_COMPAÑERO_2" target="_blank" class="btn-video">
                    📺 Ver Vídeo de Defensa (D03)
                </a>
            </div>
        </div>

        <div class="member-card">
            <div class="member-info">
                <h3>Nombre Compañero 3</h3>
                <p class="role">Responsable de: Nombre de su API</p>
                <p class="github">Usuario GitHub: <code>usuario-3</code></p>
            </div>
            <div class="video-box">
                <a href="ENLACE_VIDEO_COMPAÑERO_3" target="_blank" class="btn-video">
                    📺 Ver Vídeo de Defensa (D03)
                </a>
            </div>
        </div>
    </section>

    <section class="project-info">
        <h3>Información del Repositorio</h3>
        <p>Este proyecto ha sido desarrollado como parte de la asignatura Sistemas Orientados a Servicios (SOS).</p>
        <a href="http://github.com/gti-sos/SOS2526-29/" target="_blank" class="btn-github">
            📂 Repositorio Oficial en GitHub
        </a>
    </section>
</div>

<style>
    .page { max-width: 1000px; margin: 0 auto; padding: 40px 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; }
    
    h1 { color: #111827; font-size: 2.5rem; margin-bottom: 10px; }
    p { color: #4b5563; font-size: 1.1rem; }

    .topbar { margin-bottom: 30px; }
    .btn-back { 
        color: #4b5563; 
        text-decoration: none; 
        padding: 10px 15px; 
        border: 1px solid #d1d5db; 
        border-radius: 8px; 
        font-weight: 500;
        transition: all 0.2s;
    }
    .btn-back:hover { background: #f3f4f6; border-color: #9ca3af; }

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

    .member-info h3 { margin: 0 0 10px 0; color: #1f2937; }
    .role { font-weight: 600; color: #2563eb !important; margin-bottom: 5px; }
    .github { font-size: 0.9rem; color: #6b7280; }
    code { background: #f3f4f6; padding: 2px 5px; border-radius: 4px; }

    .video-box { margin-top: 20px; }
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
    .btn-video:hover { background: #dc2626; }

    .project-info { 
        margin-top: 50px; 
        padding: 30px; 
        background: #f9fafb; 
        border-radius: 15px; 
        text-align: center; 
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
</style>

