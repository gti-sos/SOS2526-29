

<script>
    // No necesitamos mucha lógica aquí, solo visual.
</script>

<div class="page">
    <div class="topbar">
        <a href="/" class="btn-back">← Volver al inicio</a>
    </div>

    <header class="hero">
        <h1>🤝 Integraciones del Grupo</h1>
        <p>Explora cómo cada miembro del equipo ha cruzado sus datos con APIs externas y de compañeros.</p>
    </header>

    <div class="grid">
        <!-- Bloque de Rufino -->
        <article class="card">
            <h3>🍷 Rufino Moreno</h3>
            <p><strong>Recurso:</strong> wine-stats</p>
            <div class="buttons">
                <a href="/integrations/wine-stats">Ver sus integraciones</a>
            </div>
        </article>

        <!-- Bloque de Luis -->
        <article class="card">
            <h3>🏙️ Luis Cortés</h3>
            <p><strong>Recurso:</strong> citys-stats</p>
            <div class="buttons">
                <a href="/integrations/citys-stats">Ver sus integraciones</a>
            </div>
        </article>

        <!-- TU BLOQUE (Alberto) -->
        <article class="card">
            <h3>🌍 Alberto Lirola</h3>
            <p><strong>Recurso:</strong> natural-disasters</p>
            <div class="buttons">
                <!-- Este botón llevará a tu página personal de integraciones -->
                <a href="/integrations/natural-disasters" class="btn-analytics">Ver mis integraciones</a>
            </div>
        </article>
    </div>
</div>

<style>
    /* Usamos los mismos estilos que ya tenéis en Home para que quede igual de bonito */
    .page { max-width: 1100px; margin: 0 auto; padding: 32px 20px 60px; color: #f5f7fb; }
    .hero { text-align: center; margin-bottom: 40px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 20px; }
    .card { background: #111827; border: 1px solid #1f2937; border-radius: 16px; padding: 20px; text-align: center; }
    .buttons { margin-top: 16px; }
    a { color: white; text-decoration: none; background: #2563eb; padding: 10px 14px; border-radius: 10px; display: inline-block; }
    a:hover { background: #1d4ed8; }
    .btn-analytics { background: #7c3aed; }
    .btn-analytics:hover { background: #6d28d9; }
    .btn-back { background: transparent; border: 1px solid #4b5563; margin-bottom: 20px;}
</style>
