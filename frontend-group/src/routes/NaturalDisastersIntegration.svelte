

<script>
    import { onMount } from "svelte";

    // Variables G19 (Productividad)
    let cargando1 = true;
    let errorMensaje1 = "";
    
    // Variables G26 (IDH)
    let cargando2 = true;
    let errorMensaje2 = "";

    // URLs de las APIs
    const MI_API = "/api/v2/natural-disasters";
    const API_COMPANERO_1 = "https://sos2526-19-integracion.onrender.com/api/v1/workers-productivity";
    const API_COMPANERO_2 = "https://sos2526-26.onrender.com/api/v2/countries-idh-per-years";


    // -- TRADUCCION DE NOMBRES DE PAISES (para comparar "España" / "espana" / inglés) ---

    /// Quita tildes para comparar "España" / "espana" / inglés. 
    function sinDiacriticos(str) {
        return String(str || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
    }

    
    /// Misma clave para tu API (inglés) y la del compañero (inglés o español).
    /// Clave canónica = nombre en inglés en minúsculas, como en tu backend.

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

    /// País en fila del compañero: admite country, pais, nombre, etc.
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

    
    ///API G19: productividad por hora y otros numéricos.
    ///Priorizamos productivity_hour y claves con "productivity".
     
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

    ///FUNCION PRINCIPAL DE CARGA Y COMPARATIVA DE LA INTEGRACIÓN 1

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
                    type: "bar", // 🔥 Cambiamos a gráfico de barras
                    data: {
                        labels: etiquetasPaises,
                        datasets: [
                            {
                                label: "Productividad / hora (G19, media)",
                                data: lineaValor,
                                yAxisID: "yIzquierda",
                                backgroundColor: "rgba(153, 102, 255, 0.7)", // Barra sólida
                                borderColor: "rgba(153, 102, 255, 1)",
                                borderWidth: 1
                            },
                            {
                                label: "Total muertes (histórico)",
                                data: lineaMuertes,
                                yAxisID: "yDerecha",
                                backgroundColor: "rgba(255, 159, 64, 0.7)", // Barra sólida
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
                // Sacamos todos los datos que necesitamos
                let año = misDatos[i].year || "N/A";
                let pais = misDatos[i].country || "N/A";
                let muertes = misDatos[i].death_count; // Este será nuestro Eje Y
                
                // Buscamos el IDH (un número menor a 10). Este será nuestro Eje X
                let valorIdh = Object.values(datosComp2[i]).find(v => typeof v === 'number' && v < 10) || 0;

                // Creamos la burbuja con toda la información empaquetada
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
                            backgroundColor: 'rgba(54, 162, 235, 0.6)', // Azul semitransparente
                            borderColor: 'rgba(54, 162, 235, 1)',
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            tooltip: {
                                callbacks: {
                                    // Aquí montamos el texto exacto que pediste al pasar el ratón
                                    label: function(context) {
                                        let punto = context.raw;
                                        return `${punto.country} (${punto.year}) -> IDH: ${punto.x} | Muertes: ${punto.y}`;
                                    }
                                }
                            }
                        },
                        scales: {
                            x: { 
                                title: { display: true, text: 'Valor IDH (API Compañero)' } 
                            },
                            y: { 
                                title: { display: true, text: 'Nº de Muertes (Mis Datos)' } 
                            }
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

    // Al montar la página, ejecutamos ambas cargas simultáneamente
    onMount(() => {
        cargarIntegracion1();
        cargarIntegracion2();
    });
</script>

<svelte:head>
    <!-- Librería Highcharts (Para la Integración 1) -->
    <script src="https://code.highcharts.com/highcharts.js"></script>
    <script src="https://code.highcharts.com/modules/exporting.js"></script>
    <!-- Librería Chart.js (Para la Integración 2) -->
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
        <p>Gráfica de líneas con doble eje comparando la evolución por año.</p>
        
        {#if errorMensaje1} <p class="error">❌ {errorMensaje1}</p> {/if}
        {#if cargando1 && !errorMensaje1} <p>⏳ Carga de Productividad...</p> {/if}
        
        <!-- Cambiamos el div por un canvas centrado -->
        <div style="width: 100%; height: 400px; display: flex; justify-content: center;">
            <canvas id="grafica-companero-1"></canvas>
        </div>
    </section>

    <!-- BLOQUE DE LA INTEGRACIÓN 2 (IDH) -->
    <section class="card integration-card">
        <h2>2. Desastres Naturales VS IDH por país</h2>
        <p>Relación entre el número de muertes por desastres naturales y el Índice de Desarrollo Humano por país.</p>
        
        {#if errorMensaje2} <p class="error">❌ {errorMensaje2}</p> {/if}
        {#if cargando2 && !errorMensaje2} <p>⏳ Carga de IDH...</p> {/if}
        
        <!-- Chart.js necesita la etiqueta <canvas> obligatoriamente, no vale un <div> -->
        <div style="width: 100%; height: 400px; display: flex; justify-content: center;">
            <canvas id="grafica-companero-2"></canvas>
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
