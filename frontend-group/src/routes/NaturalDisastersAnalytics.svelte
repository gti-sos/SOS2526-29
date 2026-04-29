
<script>
    import { onMount } from "svelte";
    import Highcharts from "highcharts";

    let chartContainer;
    let mensaje = "Cargando analíticas completas...";

    async function cargarGrafica() {
        try {
            const res = await fetch("/api/v2/natural-disasters");
            if (!res.ok) throw new Error("Error al obtener los datos");
            
            const data = await res.json();
            if (data.length === 0) {
                mensaje = "No hay datos suficientes para generar la gráfica.";
                return;
            }

            // Ordenamos por año
            data.sort((a, b) => a.year - b.year);

            // Preparamos los datos
            const categorias = data.map(d => `${d.country} (${d.year})`);
            const muertes = data.map(d => d.death_count);
            const heridos = data.map(d => d.injured_count);
            const daños = data.map(d => d.economic_damage_usd);

            mensaje = ""; // Quitamos el mensaje

            // Comprobación de seguridad: solo pintamos si el div ya existe
            if (chartContainer) {
                Highcharts.chart(chartContainer, {
                    chart: { type: 'area', backgroundColor: 'transparent' },
                    title: { text: 'Impacto Total de Desastres Naturales', style: { color: '#f5f7fb' } },
                    xAxis: { categories: categorias, labels: { style: { color: '#9ca3af' } } },
                    yAxis: [
                        { title: { text: 'Personas (Muertes/Heridos)', style: { color: '#f5f7fb' } }, labels: { style: { color: '#9ca3af' } } },
                        { title: { text: 'Daños Económicos (USD)', style: { color: '#34d399' } }, labels: { style: { color: '#34d399' } }, opposite: true }
                    ],
                    tooltip: { shared: true },
                    plotOptions: { area: { fillOpacity: 0.3, marker: { enabled: true, radius: 4 } } },
                    series: [
                        { name: 'Nº Muertes', data: muertes, color: '#ef4444', yAxis: 0 },
                        { name: 'Nº Heridos', data: heridos, color: '#f59e0b', yAxis: 0 },
                        { name: 'Daños Económicos', data: daños, color: '#10b981', yAxis: 1, dashStyle: 'ShortDash' }
                    ],
                    legend: { itemStyle: { color: '#f5f7fb' } }
                });
            }
        } catch (error) {
            mensaje = `Error al cargar gráfica: ${error.message}`;
        }
    }

    onMount(() => {
        // Le damos un respiro mínimo a Svelte para que pinte el HTML antes de pedir datos
        setTimeout(() => cargarGrafica(), 100); 
    });
</script>

<div class="page">
    <div class="topbar">
        <a href="/analytics" class="btn-back">← Volver a Analytics Grupal</a>
        <a href="/analytics/natural-disasters/map" class="btn-map">🗺️ Ver Mapa Mundial</a>
    </div>

    <h1>📈 Analíticas Individuales: Desastres Naturales</h1>
    <p>Visualización en formato de área mostrando el impacto humano y económico.</p>

    {#if mensaje}
        <div class="mensaje">{mensaje}</div>
    {/if}

    <div class="chart-container" bind:this={chartContainer} style={mensaje ? 'display: none;' : 'display: block;'}></div>
</div>

<style>
    .page { max-width: 1000px; margin: 0 auto; padding: 24px; color: #f5f7fb; }
    h1 { font-size: 2rem; margin-bottom: 5px; color: #f5f7fb; }
    p { margin-bottom: 24px; color: #9ca3af; }
    .chart-container { width: 100%; height: 500px; background: #111827; border: 1px solid #1f2937; border-radius: 12px; padding: 20px; margin-top: 20px;}
    .btn-back { background: #374151; color: white; padding: 8px 16px; border-radius: 6px; text-decoration: none; display: inline-block; margin-bottom: 20px; font-weight: bold; }
    .mensaje { padding: 12px 16px; background: #374151; border-radius: 8px; text-align: center; }
    .btn-map { background: #3b82f6; color: white; padding: 8px 16px; border-radius: 6px; text-decoration: none; display: inline-block; margin-bottom: 20px; font-weight: bold; margin-left: 10px; }
    .btn-map:hover { background: #2563eb; }
</style>
