

<script>
    import { onMount } from "svelte";

    // Variables G19 (Productividad)
    let cargando1 = true;
    let errorMensaje1 = "";
    
    // Variables G26 (IDH)
    let cargando2 = true;
    let errorMensaje2 = "";


    let cargando3 = true;
    let errorMensaje3 = "";

    // URLs de las APIs
    const MI_API = "/api/v2/natural-disasters";
    const API_COMPANERO_1 = "https://sos2526-19-integracion.onrender.com/api/v1/workers-productivity";
    const API_COMPANERO_2 = "https://sos2526-26.onrender.com/api/v2/countries-idh-per-years";


    // -- TRADUCCION DE NOMBRES DE PAISES (para comparar "España" / "espana" / inglés) ---

    function sinDiacriticos(str) {
        return String(str || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
    }

    const VARIANTE_A_PAIS_CANONICO = (() => {
        const map = {};
        const add = (canon, lista) => {
            for (const v of lista) {
                const k = sinDiacriticos(String(v).trim()).toLowerCase();
                if (k) map[k] = canon;
            }
        };
        add("spain", ["spain", "españa", "espana"]);
        add("france", ["france", "francia"]);
        add("brazil", ["brazil", "brasil"]);
        add("cambodia", ["cambodia", "camboya"]);
        add("norway", ["norway", "noruega"]);
        add("afghanistan", ["afghanistan", "afganistan", "afganistán"]);
        add("australia", ["australia"]);
        add("africa", ["africa", "áfrica"]);
        return map;
    })();

    function clavePaisCanonica(nombre) {
        const slug = sinDiacriticos(String(nombre || "").trim()).toLowerCase();
        if (!slug) return "";
        return VARIANTE_A_PAIS_CANONICO[slug] || slug;
    }

    function leerNombrePaisEnFila(row) {
        if (!row || typeof row !== "object") return "";
        for (const [key, val] of Object.entries(row)) {
            const k = String(key).toLowerCase();
            if ((k.includes("country") || k.includes("pais") || k.includes("país") || k === "nation" || k === "name") && val != null && String(val).trim() !== "") {
                return String(val);
            }
        }
        return "";
    }


    // --- INTEGRACION 1: CHART.JS (Productividad G19 vs Muertes acumuladas) ---
     
    function leerMetricaProductividad(row) {
        if (!row || typeof row !== "object") return NaN;
        const excluir = new Set(["id", "year", "country", "pais", "país"]);
        const entries = Object.entries(row);
        for (const [key, val] of entries) {
            const k = String(key).toLowerCase();
            if (excluir.has(k)) continue;
            if (k.includes("productivity")) {
                const n = parseFloat(val);
                if (!Number.isNaN(n)) return n;
            }
        }
        for (const [key, val] of entries) {
            const k = String(key).toLowerCase();
            if (excluir.has(k)) continue;
            const n = parseFloat(val);
            if (!Number.isNaN(n) && k !== "year") return n;
        }
        return NaN;
    }

    async function cargarIntegracion1() {
        try {
            const [resMia, resComp1] = await Promise.all([fetch(MI_API), fetch(API_COMPANERO_1)]);
            if (!resMia.ok || !resComp1.ok) throw new Error("Error de conexión");

            const misDatos = await resMia.json();
            let datosComp1 = await resComp1.json();

            if (typeof datosComp1 === "string") {
                try {
                    datosComp1 = JSON.parse(datosComp1);
                } catch {
                    /* vacío */
                }
            }

            const listaCompanero = Array.isArray(datosComp1)
                ? datosComp1
                : datosComp1?.data || datosComp1?.hdi || datosComp1?.response || [];

            if (misDatos.length === 0 || listaCompanero.length === 0) {
                throw new Error("Datos vacíos. Revisa las APIs.");
            }

            const misDatosAgrupados = {};
            for (const miDato of misDatos) {
                const canon = clavePaisCanonica(miDato.country);
                if (!canon) continue;
                if (!misDatosAgrupados[canon]) {
                    misDatosAgrupados[canon] = { nombreVisual: miDato.country, totalMuertes: 0 };
                }
                misDatosAgrupados[canon].totalMuertes += parseFloat(miDato.death_count) || 0;
            }

            const compDatosAgrupados = {};
            for (let item of listaCompanero) {
                if (typeof item === "string") {
                    try {
                        item = JSON.parse(item);
                    } catch {
                        continue;
                    }
                }
                const nombrePais = leerNombrePaisEnFila(item);
                const canon = clavePaisCanonica(nombrePais);
                const metric = leerMetricaProductividad(item);
                if (!canon || Number.isNaN(metric)) continue;

                if (!compDatosAgrupados[canon]) compDatosAgrupados[canon] = { sumaValor: 0, cuenta: 0 };
                compDatosAgrupados[canon].sumaValor += metric;
                compDatosAgrupados[canon].cuenta += 1;
            }

            const datosCombinados = [];
            for (const canon of Object.keys(misDatosAgrupados)) {
                const bloqueComp = compDatosAgrupados[canon];
                if (!bloqueComp || bloqueComp.cuenta === 0) continue;
                const mediaValor = bloqueComp.sumaValor / bloqueComp.cuenta;
                datosCombinados.push({
                    pais: misDatosAgrupados[canon].nombreVisual,
                    muertes: misDatosAgrupados[canon].totalMuertes,
                    valorCompanero: parseFloat(mediaValor.toFixed(3))
                });
            }

            if (datosCombinados.length === 0) {
                const misClaves = Object.keys(misDatosAgrupados).join(", ") || "Ninguno";
                const susClaves = Object.keys(compDatosAgrupados).join(", ") || "Ninguno";
                throw new Error(
                    `No hay países en común tras normalizar nombres. Mis claves: [${misClaves}]. Compañero: [${susClaves}].`
                );
            }

            datosCombinados.sort((a, b) => a.pais.localeCompare(b.pais));

            const etiquetasPaises = [];
            const lineaValor = [];
            const lineaMuertes = [];
            for (const dato of datosCombinados) {
                etiquetasPaises.push(dato.pais);
                lineaValor.push(dato.valorCompanero);
                lineaMuertes.push(dato.muertes);
            }

            setTimeout(() => {
                const ctx = document.getElementById("grafica-companero-1").getContext("2d");
                if (window.miGrafica1ChartJS) window.miGrafica1ChartJS.destroy();

                window.miGrafica1ChartJS = new Chart(ctx, {
                    type: "bar",
                    data: {
                        labels: etiquetasPaises,
                        datasets: [
                            {
                                label: "Productividad / hora (G19, media)",
                                data: lineaValor,
                                yAxisID: "yIzquierda",
                                backgroundColor: "rgba(153, 102, 255, 0.7)", 
                                borderColor: "rgba(153, 102, 255, 1)",
                                borderWidth: 1
                            },
                            {
                                label: "Total muertes (histórico)",
                                data: lineaMuertes,
                                yAxisID: "yDerecha",
                                backgroundColor: "rgba(255, 159, 64, 0.7)", 
                                borderColor: "rgba(255, 159, 64, 1)",
                                borderWidth: 1
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        interaction: { mode: "index", intersect: false },
                        scales: {
                            x: { title: { display: true, text: "Países en común" } },
                            yIzquierda: {
                                type: "linear",
                                position: "left",
                                title: { display: true, text: "Productividad (API compañero)" }
                            },
                            yDerecha: {
                                type: "linear",
                                position: "right",
                                title: { display: true, text: "Nº total de muertes" },
                                grid: { drawOnChartArea: false }
                            }
                        }
                    }
                });
                cargando1 = false;
            }, 500);
        } catch (error) {
            errorMensaje1 = error.message;
            cargando1 = false;
        }
    }

    // --- INTEGRACIÓN 2: CHART.JS (Burbujas: IDH vs Muertes) ---
    async function cargarIntegracion2() {
        try {
            const [resMia, resComp2] = await Promise.all([fetch(MI_API), fetch(API_COMPANERO_2)]);
            if (!resMia.ok || !resComp2.ok) throw new Error("Error de conexión (¿CORS?)");

            const misDatos = await resMia.json();
            const datosComp2 = await resComp2.json();

            if (misDatos.length === 0 || datosComp2.length === 0) throw new Error("Datos vacíos en G26");

            let datosBurbujas = [];
            let limite = Math.min(10, misDatos.length, datosComp2.length);

            for (let i = 0; i < limite; i++) {
                let año = misDatos[i].year || "N/A";
                let pais = misDatos[i].country || "N/A";
                let muertes = misDatos[i].death_count; 
                let valorIdh = Object.values(datosComp2[i]).find(v => typeof v === 'number' && v < 10) || 0;

                datosBurbujas.push({
                    x: valorIdh, 
                    y: muertes, 
                    r: 15, // Tamaño de la burbuja
                    country: pais, 
                    year: año 
                });
            }

            setTimeout(() => {
                const ctx = document.getElementById('grafica-companero-2').getContext('2d');
                if(window.miGraficaChartJS) window.miGraficaChartJS.destroy();

                window.miGraficaChartJS = new Chart(ctx, {
                    type: 'bubble', 
                    data: {
                        datasets: [{
                            label: 'Relación País/Año (IDH vs Muertes)',
                            data: datosBurbujas,
                            backgroundColor: 'rgba(54, 162, 235, 0.6)', 
                            borderColor: 'rgba(54, 162, 235, 1)',
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        let punto = context.raw;
                                        return `${punto.country} (${punto.year}) -> IDH: ${punto.x} | Muertes: ${punto.y}`;
                                    }
                                }
                            }
                        },
                        scales: {
                            x: { title: { display: true, text: 'Valor IDH (API Compañero)' } },
                            y: { title: { display: true, text: 'Nº de Muertes (Mis Datos)' } }
                        }
                    }
                });
                cargando2 = false;
            }, 500);
        } catch (error) {
            errorMensaje2 = error.message;
            cargando2 = false;
        }
    }

    // --- INTEGRACIÓN 3: API Externa de Terremotos vs Mis Muertes ---
    
    // Variables de estado (asegúrate de tenerlas arriba con las demás)
    

    // --- INTEGRACIÓN 3: API Externa de Terremotos vs Mis Muertes (DIRECTA) ---
    async function cargarIntegracionExterna() {
        try {
            // 1. Llamamos a TU backend local y DIRECTAMENTE a la web de terremotos
            const urlUSGS = "https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=1950-01-01&endtime=2024-12-31&minmagnitude=6.5";
            
            const [resMia, resExterna] = await Promise.all([
                fetch(MI_API), 
                fetch(urlUSGS)
            ]);

            if (!resMia.ok) throw new Error("Error cargando los datos de tu API local");
            if (!resExterna.ok) throw new Error("Error conectando con la API de USGS");

            const misDatos = await resMia.json();
            const datosBrutosSismos = await resExterna.json(); 

            // 2. Procesamos los terremotos por año directamente aquí
            let terremotosPorAno = {};
            for (let sismo of datosBrutosSismos.features) {
                const fecha = new Date(sismo.properties.time);
                const ano = fecha.getFullYear();
                terremotosPorAno[ano] = (terremotosPorAno[ano] || 0) + 1;
            }

            // 3. Agrupamos tus muertes por año
            let misMuertesPorAno = {};
            for (let miDato of misDatos) {
                let ano = miDato.year;
                if (!misMuertesPorAno[ano]) misMuertesPorAno[ano] = 0;
                misMuertesPorAno[ano] += (parseFloat(miDato.death_count) || 0);
            }

            // 4. Cruzamos ambos datos por el "Año"
            let datosCombinados = [];
            for (let ano in misMuertesPorAno) {
                if (terremotosPorAno[ano]) {
                    datosCombinados.push({
                        ano: parseInt(ano),
                        muertes: misMuertesPorAno[ano],
                        terremotos: terremotosPorAno[ano]
                    });
                }
            }

            if (datosCombinados.length === 0) {
                throw new Error("No hay años en común entre ambas APIs.");
            }

            datosCombinados.sort((a, b) => a.ano - b.ano);

            let etiquetasAnos = [];
            let lineaMuertes = [];
            let barrasTerremotos = [];

            for (let dato of datosCombinados) {
                etiquetasAnos.push(dato.ano);
                lineaMuertes.push(dato.muertes);
                barrasTerremotos.push(dato.terremotos);
            }

            // 5. Dibujamos la gráfica mixta (Chart.js)
            setTimeout(() => {
                const ctx = document.getElementById('grafica-externa-1').getContext('2d');
                if (window.miGraficaExterna) window.miGraficaExterna.destroy();

                window.miGraficaExterna = new Chart(ctx, {
                    type: 'line', 
                    data: {
                        labels: etiquetasAnos,
                        datasets: [
                            {
                                type: 'bar', 
                                label: 'Nº Terremotos (Mag > 6.5)',
                                data: barrasTerremotos,
                                yAxisID: 'yIzquierda',
                                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                                borderColor: 'rgba(54, 162, 235, 1)',
                                borderWidth: 1
                            },
                            {
                                type: 'line', 
                                label: 'Muertes Totales',
                                data: lineaMuertes,
                                yAxisID: 'yDerecha',
                                borderColor: 'rgba(255, 99, 132, 1)',
                                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                                fill: true,
                                tension: 0.4
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        interaction: { mode: 'index', intersect: false },
                        scales: {
                            x: { title: { display: true, text: 'Años' } },
                            yIzquierda: {
                                type: 'linear', position: 'left',
                                title: { display: true, text: 'Nº Terremotos' }
                            },
                            yDerecha: {
                                type: 'linear', position: 'right',
                                title: { display: true, text: 'Nº Muertes' },
                                grid: { drawOnChartArea: false }
                            }
                        }
                    }
                });
                cargando3 = false;
            }, 500);

        } catch (error) {
            errorMensaje3 = error.message;
            cargando3 = false;
        }
    }


    // Al montar la página, ejecutamos TODAS simultáneamente
    onMount(() => {
        cargarIntegracion1();
        cargarIntegracion2();
        cargarIntegracionExterna();
    });
</script>

<svelte:head>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</svelte:head>

<div class="page">
    <div class="topbar">
        <a href="/integrations" class="btn-back">← Volver a Integraciones</a>
    </div>

    <h1>🌍 Integraciones de Desastres Naturales</h1>
    <p>Comparativa de mis datos con APIs externas y de compañeros.</p>
    
    <!-- BLOQUE DE LA INTEGRACIÓN 1 (Productividad) -->
    <section class="card integration-card">
        <h2>1. Mis Datos VS Productividad (Chart.js)</h2>
        <p>Gráfica de barras con doble eje comparando productividad por país y el número histórico de muertes.</p>
        
        {#if errorMensaje1} <p class="error">❌ {errorMensaje1}</p> {/if}
        {#if cargando1 && !errorMensaje1} <p>⏳ Carga de Productividad...</p> {/if}
        
        <div style="width: 100%; height: 400px; display: flex; justify-content: center;">
            <canvas id="grafica-companero-1"></canvas>
        </div>
    </section>

    <!-- BLOQUE DE LA INTEGRACIÓN 2 (IDH) -->
    <section class="card integration-card">
        <h2>2. Desastres Naturales VS IDH por país (Chart.js)</h2>
        <p>Relación entre el número de muertes por desastres naturales y el Índice de Desarrollo Humano por país.</p>
        
        {#if errorMensaje2} <p class="error">❌ {errorMensaje2}</p> {/if}
        {#if cargando2 && !errorMensaje2} <p>⏳ Carga de IDH...</p> {/if}
        
        <div style="width: 100%; height: 400px; display: flex; justify-content: center;">
            <canvas id="grafica-companero-2"></canvas>
        </div>
    </section>

    <!-- BLOQUE DE LA INTEGRACIÓN 3 (API EXTERNA) -->
    <section class="card integration-card">
        <h2>3. Terremotos Globales VS Mis Muertes (API USGS)</h2>
        <p>Comparativa mixta (Barras y Líneas) del número de terremotos extremos (Mag > 6.5) y las muertes históricas por año.</p>
        
        {#if errorMensaje3} <p class="error">❌ {errorMensaje3}</p> {/if}
        {#if cargando3 && !errorMensaje3} <p>⏳ Carga de Terremotos...</p> {/if}
        
        <div style="width: 100%; height: 400px; display: flex; justify-content: center;">
            <canvas id="grafica-externa-1"></canvas>
        </div>
    </section>

</div>

<style>
    .page { max-width: 1100px; margin: 0 auto; padding: 32px 20px; color: #f5f7fb; }
    .btn-back { color: white; text-decoration: none; padding: 8px 12px; border: 1px solid #4b5563; border-radius: 8px; }
    .btn-back:hover { background: #374151; }
    .integration-card { margin-top: 30px; background: #ffffff; color: #333; padding: 20px; border-radius: 12px; margin-bottom: 20px; }
    .integration-card h2 { color: #111827; margin-top: 0; }
    .error { color: #f87171; background: #451a1a; padding: 10px; border-radius: 8px; }
</style>
