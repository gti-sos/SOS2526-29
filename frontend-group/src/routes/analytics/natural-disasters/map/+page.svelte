<script>
    import { onMount } from "svelte";
    
    // 1. Importamos Highcharts base
    import Highcharts from "highcharts";
    
    // 2. Silenciamos a Vite para que nos deje importar el módulo de mapas
    // @ts-ignore
    import MapModule from "highcharts/modules/map";

    let mapContainer;
    let mensaje = "Cargando mapa mundial...";

    // Diccionario de países a códigos ISO (2 letras) para Highcharts
    const codigosPaises = {
        'spain': 'es',
        'afghanistan': 'af',
        'usa': 'us',
        'japan': 'jp',
        'mexico': 'mx',
        'france': 'fr',
        'italy': 'it',
        'germany': 'de',
        'china': 'cn'
    };

    async function cargarMapa() {
        try {
            // 3. Activamos el módulo de mapas (con doble comprobación para evitar el bug de Vite)
            if (typeof MapModule === "function") {
                MapModule(Highcharts);
            } else if (MapModule && typeof MapModule.default === "function") {
                MapModule.default(Highcharts);
            }

            // Descargamos la silueta del mundo desde Highcharts
            const topologyRes = await fetch('https://code.highcharts.com/mapdata/custom/world.topo.json');
            const topology = await topologyRes.json();

            // Pedimos tus datos a la API
            const res = await fetch("/api/v2/natural-disasters");
            const data = await res.json();

            if (data.length === 0) {
                mensaje = "No hay datos para mostrar en el mapa.";
                return;
            }

            // Transformamos los datos al formato que pide Highmaps
            const mapData = data.map(d => {
                let nombreLimpio = d.country.toLowerCase().trim();
                let hcKey = codigosPaises[nombreLimpio] || nombreLimpio.substring(0, 2);

                return {
                    'hc-key': hcKey,
                    value: d.death_count + d.injured_count, // El color depende del total de afectados
                    countryName: d.country.toUpperCase(),
                    year: d.year,
                    deaths: d.death_count,
                    injured: d.injured_count,
                    damage: d.economic_damage_usd
                };
            });

            mensaje = ""; // Vaciamos el mensaje para quitar el aviso de carga

            if (mapContainer) {
                // 4. Silenciamos el falso error de TypeScript para mapChart
                // @ts-ignore
                const chart = Highcharts.mapChart(mapContainer, {
                    chart: {
                        map: topology,
                        backgroundColor: 'transparent'
                    },
                    title: {
                        text: 'Mapa de Impacto por Desastres Naturales',
                        style: { color: '#f5f7fb' }
                    },
                    mapNavigation: {
                        enabled: true,
                        buttonOptions: { verticalAlign: 'bottom' }
                    },
                    colorAxis: {
                        min: 0,
                        stops: [
                            [0, '#fef2f2'],   // Color para afectados mínimos
                            [0.5, '#ef4444'], // Rojo estándar
                            [1, '#7f1d1d']    // Granate para catástrofes
                        ]
                    },
                    tooltip: {
                        useHTML: true,
                        backgroundColor: '#1f2937',
                        style: { color: '#f5f7fb' },
                        formatter: function() {
                            if (!this.point.countryName) return 'Sin registros';
                            return `
                                <div style="text-align: center; padding: 5px;">
                                    <strong style="color: #60a5fa; font-size: 1.1em;">${this.point.countryName} (${this.point.year})</strong><br/><br/>
                                    💀 Muertes: <strong>${this.point.deaths}</strong><br/>
                                    🏥 Heridos: <strong>${this.point.injured}</strong><br/>
                                    💸 Daños: <strong>$${this.point.damage}</strong>
                                </div>
                            `;
                        }
                    },
                    series: [{
                        data: mapData,
                        name: 'Afectados Totales',
                        states: { hover: { color: '#f59e0b' } },
                        dataLabels: { enabled: false }
                    }]
                });

                // 5. TRUCO FINAL: Forzamos al mapa a recularcular su tamaño 
                // para evitar que se pinte invisible o pequeño.
                setTimeout(() => chart.reflow(), 100);
            }
        } catch (error) {
            mensaje = `Error al cargar mapa: ${error.message}`;
            console.error(error);
        }
    }

    onMount(() => {
        // Damos tiempo a Svelte a crear el <div> antes de llamar a la API
        setTimeout(() => cargarMapa(), 200);
    });
</script>

<div class="page">
    <div class="topbar">
        <a href="/analytics/natural-disasters" class="btn-back">← Volver a mis Gráficas</a>
    </div>

    <h1>🗺️ Mapa Mundial Interactivo</h1>
    <p>Visualización del impacto usando Highmaps. Los colores más oscuros indican mayor cantidad de personas afectadas.</p>

    {#if mensaje}
        <div class="mensaje">{mensaje}</div>
    {/if}

    <div bind:this={mapContainer} class="map-container"></div>
</div>

<style>
    .page { max-width: 1000px; margin: 0 auto; padding: 24px; color: #f5f7fb; }
    h1 { font-size: 2rem; margin-bottom: 5px; color: #f5f7fb; }
    p { margin-bottom: 24px; color: #9ca3af; }
    .map-container { 
        width: 100%; 
        height: 600px; /* Altura obligatoria para que el mapa sepa cuánto medir */
        border-radius: 12px; 
        border: 1px solid #374151; 
        background: #111827; 
        margin-top: 20px;
    }
    .btn-back { background: #374151; color: white; padding: 8px 16px; border-radius: 6px; text-decoration: none; display: inline-block; margin-bottom: 20px; font-weight: bold; }
    .mensaje { padding: 12px 16px; background: #374151; border-radius: 8px; text-align: center; font-weight: bold; }
</style>