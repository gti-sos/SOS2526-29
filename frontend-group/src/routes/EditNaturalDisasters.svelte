

<script>
    // back vuelve a la pantalla anterior.
    import { back } from "../lib/navigation.js";
    // Funciones del servicio para leer y actualizar desastres.
    import { getOneDisaster, updateDisaster } from "../services/natural-disasters.js";

    // params contiene los parametros de la URL (country y year).
    export let params = {};

    // Formulario enlazado a los inputs de la pantalla.
    let form = { country: "", year: "", death_count: "", injured_count: "", economic_damage_usd: "" };
    // Mensaje que se muestra al usuario.
    let mensaje = "";
    // Tipo del mensaje: ok o error.
    let tipoMensaje = "ok";
    // Indica si aun se estan cargando datos.
    let cargando = true;

    // Muestra un mensaje temporal.
    function mostrarMensaje(texto, tipo = "ok") {
        mensaje = texto;
        tipoMensaje = tipo;
        setTimeout(() => (mensaje = ""), 4000);
    }

    // Al abrir la pagina, buscamos los datos de ese pais y anio.
    async function cargarDatos() {
        try {
            const data = await getOneDisaster(params.country, params.year);
            form = { ...data }; // Rellenamos el formulario con la respuesta de la API.
            cargando = false;
        } catch (e) {
            mostrarMensaje(`No existe el registro para ${params.country} en ${params.year}.`, "error");
            cargando = false;
        }
    }

    // Envia a la API los cambios del formulario.
    async function guardarCambios() {
        try {
            await updateDisaster(params.country, params.year, {
                country: form.country,
                year: Number(form.year),
                death_count: Number(form.death_count),
                injured_count: Number(form.injured_count),
                economic_damage_usd: Number(form.economic_damage_usd)
            });
            mostrarMensaje("¡Registro actualizado correctamente!");
            setTimeout(() => back(), 1500); // Volvemos a la tabla tras 1.5 segundos.
        } catch (e) {
            mostrarMensaje(e.message, "error");
        }
    }

    // Cargamos el registro al crear el componente.
    cargarDatos();
</script>

<div class="page">
    <button class="btn-back" on:click={() => back()}>← Volver a la tabla</button>

    <div class="card">
        <h1>✏️ Editar Registro</h1>
        <p>Modificando datos de: <strong>{params.country}</strong> ({params.year})</p>

        {#if mensaje}
            <div class="mensaje {tipoMensaje}">{mensaje}</div>
        {/if}

        {#if cargando}
            <p>Cargando datos...</p>
        {:else if form.country}
            <div class="form-grid">
                <label>
                    País:
                    <input value={form.country} disabled />
                </label>
                <label>
                    Año:
                    <input value={form.year} disabled />
                </label>
                <label>
                    Nº Muertes:
                    <input bind:value={form.death_count} type="number" />
                </label>
                <label>
                    Nº Heridos:
                    <input bind:value={form.injured_count} type="number" />
                </label>
                <label>
                    Daños economicos:
                    <input bind:value={form.economic_damage_usd} type="number" />
                </label>
            </div>
            
            <button class="btn-primary" on:click={guardarCambios}>💾 Guardar cambios</button>
        {/if}
    </div>
</div>

<style>
    .page { max-width: 800px; margin: 0 auto; padding: 24px; color: #f5f7fb; }
    h1 { font-size: 1.8rem; margin-bottom: 5px; color: #f5f7fb; }
    p { color: #9ca3af; margin-bottom: 24px; }
    .card { background: #111827; border: 1px solid #1f2937; border-radius: 12px; padding: 24px; }
    
    .form-grid { display: grid; gap: 16px; margin-bottom: 24px; }
    label { display: flex; flex-direction: column; font-size: 0.9rem; color: #d1d5db; gap: 6px; }
    input { padding: 10px; border-radius: 8px; border: 1px solid #374151; background: #1f2937; color: #f5f7fb; }
    input:disabled { background: #374151; color: #9ca3af; cursor: not-allowed; }
    input:focus:not(:disabled) { outline: none; border-color: #2563eb; }
    
    .mensaje { padding: 12px 16px; border-radius: 8px; margin-bottom: 20px; font-weight: bold; }
    .mensaje.ok { background: #065f46; color: #6ee7b7; border: 1px solid #047857; }
    .mensaje.error { background: #7f1d1d; color: #fca5a5; border: 1px solid #991b1b; }
    
    button { border: none; padding: 10px 16px; border-radius: 6px; cursor: pointer; font-weight: bold; }
    .btn-back { background: #374151; color: white; margin-bottom: 20px; }
    .btn-primary { background: #d97706; color: white; width: 100%; font-size: 1.1rem; }
    .btn-primary:hover { background: #b45309; }
</style>
