

<script>
    import { onMount } from "svelte";
    import { push } from "svelte-spa-router";
    import {
        getDisasters,
        createDisaster,
        deleteAllDisasters,
        deleteDisaster,
        loadInitialData
    } from "../services/natural-disasters.js";

    let disasters = [];
    let mensaje = "";
    let tipoMensaje = "ok"; // 'ok' o 'error'

    // Formulario de creación
    let form = { country: "", year: "", death_count: "", injured_count: "", economic_damage_usd: "" };

    // Buscador
    let searchCountry = "";
    let searchYear = "";
    let searchFrom = ""; // NUEVO: Año de inicio
    let searchTo = "";   // NUEVO: Año de fin

    function mostrarMensaje(texto, tipo = "ok") {
        mensaje = texto;
        tipoMensaje = tipo;
        setTimeout(() => (mensaje = ""), 4500); // El mensaje desaparece solo
    }

    async function cargarDatos(query = "") {
        try {
            const data = await getDisasters(query);
            disasters = data;
            return data.length; // <--- Devolvemos la longitud
        } catch (e) {
            mostrarMensaje(e.message, "error");
            return -1; // <--- Indicamos que hubo un error
        }
    }

    async function cargarIniciales() {
        try {
            await loadInitialData();
            mostrarMensaje("Datos iniciales cargados con éxito.");
            cargarDatos(); // Recargamos la tabla automáticamente
        } catch (e) {
            mostrarMensaje(e.message, "error");
        }
    }

    async function manejarCreacion() {
        if (!form.country || !form.year) {
            mostrarMensaje("El país y el año son obligatorios para crear un registro.", "error");
            return;
        }
        try {
            await createDisaster({
                country: form.country,
                year: Number(form.year),
                death_count: Number(form.death_count),
                injured_count: Number(form.injured_count),
                economic_damage_usd: Number(form.economic_damage_usd)
            });
            mostrarMensaje(`¡Registro de ${form.country} creado correctamente!`);
            form = { country: "", year: "", death_count: "", injured_count: "", economic_damage_usd: "" };
            cargarDatos();
        } catch (e) {
            mostrarMensaje(e.message, "error");
        }
    }

    async function borrarTodos() {
        if (!confirm("¿Estás 100% seguro de que quieres vaciar toda la base de datos?")) return;
        try {
            await deleteAllDisasters();
            mostrarMensaje("Todos los registros han sido pulverizados.");
            cargarDatos();
        } catch (e) {
            mostrarMensaje(e.message, "error");
        }
    }

    async function borrarUno(country, year) {
        if (!confirm(`¿Eliminar el registro de ${country} (${year})?`)) return;
        try {
            await deleteDisaster(country, year);
            mostrarMensaje(`Registro de ${country} eliminado.`);
            cargarDatos();
        } catch (e) {
            mostrarMensaje(e.message, "error");
        }
    }

    // Función para manejar la búsqueda (Requisito del profesor)
    

    async function buscar() {
        let queryParams = [];
        if (searchCountry) queryParams.push(`country=${searchCountry}`);
        if (searchYear) queryParams.push(`year=${searchYear}`);
        if (searchFrom) queryParams.push(`from=${searchFrom}`); // NUEVO
        if (searchTo) queryParams.push(`to=${searchTo}`);
        
        let queryString = queryParams.length > 0 ? "?" + queryParams.join("&") : "";
        
        // Ejecutamos la carga y guardamos el número de resultados
        const numResultados = await cargarDatos(queryString);
        
        if (numResultados === 0) {
            let errorMsg = "No se han encontrado registros";
            if (searchCountry && searchYear) {
                errorMsg += ` para el país "${searchCountry}" en el año ${searchYear}.`;
            } else if (searchCountry) {
                errorMsg += ` para el país "${searchCountry}".`;
            } else if (searchYear) {
                errorMsg += ` para el año ${searchYear}.`;
            } else {
                errorMsg += " con los criterios introducidos.";
            }
            mostrarMensaje(errorMsg, "error");
        } else if (numResultados > 0) {
            let successMsg = `Se han encontrado ${numResultados} resultados`;
            if (searchCountry) successMsg += ` para "${searchCountry}"`;
            if (searchYear) successMsg += ` del año ${searchYear}`;
            mostrarMensaje(successMsg, "ok");
        }
        // Si numResultados es -1, no hacemos nada porque cargarDatos ya mostró su propio error
    }

    function limpiarBusqueda() {
        searchCountry = "";
        searchYear = "";
        searchFrom = ""; // Limpiar también los nuevos
        searchTo = "";
        cargarDatos();
    }

    onMount(() => cargarDatos());
</script>

<div class="page">
    <div class="topbar">
        <a href="#/" class="btn-back">← Volver al inicio</a>
    </div>

    <h1>🌍 Gestión de Desastres Naturales</h1>
    <p>Administra los datos de de cada pais y año.</p>

    {#if mensaje}
        <div class="mensaje {tipoMensaje}">{mensaje}</div>
    {/if}

    <div class="paneles-superiores">
        <section class="card">
            <h2>➕ Añadir nuevo registro</h2>
            <div class="form-grid">
                <input bind:value={form.country} placeholder="País (ej: spain)" />
                <input bind:value={form.year} type="number" placeholder="Año" />
                <input bind:value={form.death_count} type="number" placeholder="Nº Muertes" />
                <input bind:value={form.injured_count} type="number" placeholder="Nº Heridos" />
                <input bind:value={form.economic_damage_usd} type="number" placeholder="Daños economicos" />
            </div>
            <button class="btn-primary" on:click={manejarCreacion}>Guardar registro</button>
        </section>

        <section class="card search-card">
            <h2>🔍 Buscar registros</h2>
            <div class="form-grid">
                <input bind:value={searchCountry} placeholder="Buscar por país..." />
                <input bind:value={searchYear} type="number" placeholder="Buscar año exacto..." />
                <input bind:value={searchFrom} type="number" placeholder="Desde año (ej: 2000)" />
                <input bind:value={searchTo} type="number" placeholder="Hasta año (ej: 2020)" />
            </div>
            <div class="botones-busqueda">
                <button class="btn-primary" on:click={buscar}>Buscar</button>
                <button class="btn-secondary" on:click={limpiarBusqueda}>Limpiar</button>
            </div>
        </section>
    </div>

    <section class="card">
        <div class="list-header">
            <h2>Listado General ({disasters.length} registros)</h2>
            <div class="acciones-globales">
                <button class="btn-secondary" on:click={() => cargarDatos()}>🔄 Recargar</button>
                <button class="btn-init" on:click={cargarIniciales}>📦 Cargar Iniciales</button>
                <button class="btn-danger" on:click={borrarTodos}>🗑️ Borrar Todos</button>
            </div>
        </div>

        {#if disasters.length === 0}
            <p class="vacio">No hay registros en la base de datos en este momento.</p>
        {:else}
            <div class="tabla-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>País</th>
                            <th>Año</th>
                            <th>Nº Muertes</th>
                            <th>Nº Heridos</th>
                            <th>Daños economicos</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each disasters as disaster}
                            <tr>
                                <td><strong>{disaster.country}</strong></td>
                                <td>{disaster.year}</td>
                                <td>{disaster.death_count}</td>
                                <td>{disaster.injured_count}</td>
                                <td>{disaster.economic_damage_usd}</td>
                                <td class="acciones-fila">
                                    <button class="btn-edit" on:click={() => push(`/natural-disasters/editar/${disaster.country}/${disaster.year}`)}>✏️ Editar</button>
                                    <button class="btn-danger-sm" on:click={() => borrarUno(disaster.country, disaster.year)}>🗑️ Borrar</button>
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        {/if}
    </section>
</div>

<style>
    /* Estilos basados en el tema de tus compañeros para mantener consistencia */
    .page { max-width: 1200px; margin: 0 auto; padding: 24px; color: #f5f7fb; }
    h1 { font-size: 2rem; margin-bottom: 5px; color: #f5f7fb; }
    h2 { margin-top: 0; font-size: 1.2rem; margin-bottom: 16px; border-bottom: 1px solid #374151; padding-bottom: 8px;}
    p { margin-bottom: 24px; color: #9ca3af; }
    
    .paneles-superiores { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; margin-bottom: 24px; }
    @media (max-width: 768px) { .paneles-superiores { grid-template-columns: 1fr; } }
    
    .card { background: #111827; border: 1px solid #1f2937; border-radius: 12px; padding: 20px; }
    .search-card { background: #1f2937; border-color: #374151; }
    
    .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin-bottom: 16px; }
    input { padding: 10px; border-radius: 8px; border: 1px solid #374151; background: #111827; color: #f5f7fb; }
    input:focus { outline: none; border-color: #2563eb; }
    
    .list-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 16px; }
    .acciones-globales, .botones-busqueda, .acciones-fila { display: flex; gap: 8px; flex-wrap: wrap; }
    
    table { width: 100%; border-collapse: collapse; font-size: 0.95rem; }
    th { background: #1f2937; padding: 12px; text-align: left; color: #9ca3af; }
    td { padding: 12px; border-bottom: 1px solid #1f2937; color: #f5f7fb; }
    tr:hover td { background: #1f2937; }
    
    .mensaje { padding: 12px 16px; border-radius: 8px; margin-bottom: 20px; font-weight: bold; }
    .mensaje.ok { background: #065f46; color: #6ee7b7; border: 1px solid #047857; }
    .mensaje.error { background: #7f1d1d; color: #fca5a5; border: 1px solid #991b1b; }
    .vacio { text-align: center; color: #6b7280; padding: 30px; }
    
    /* Botones */
    button, .btn-back { border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: bold; text-decoration: none; display: inline-block; }
    .btn-back { background: #374151; color: white; margin-bottom: 20px; }
    .btn-primary { background: #2563eb; color: white; }
    .btn-primary:hover { background: #1d4ed8; }
    .btn-secondary { background: #4b5563; color: white; }
    .btn-secondary:hover { background: #6b7280; }
    .btn-init { background: #7c3aed; color: white; }
    .btn-init:hover { background: #6d28d9; }
    .btn-danger { background: #dc2626; color: white; }
    .btn-danger:hover { background: #b91c1c; }
    .btn-danger-sm { background: #dc2626; color: white; padding: 6px 10px; font-size: 0.85rem;}
    .btn-edit { background: #d97706; color: white; padding: 6px 10px; font-size: 0.85rem;}
</style>