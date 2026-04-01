<script>
  import { onMount } from "svelte";
  import { pop } from "svelte-spa-router";
  import { getOneWineStat, updateWineStat } from "../services/wine-stats.js";

  export let params = {};

  let vino = null;
  let mensaje = "";
  let tipoMensaje = "ok";
  let cargando = true;

  function mostrarMensaje(texto, tipo = "ok") {
    mensaje = texto;
    tipoMensaje = tipo;
    setTimeout(() => (mensaje = ""), 4000);
  }

  async function cargarVino() {
    const id = Number(params.id);
    try {
      vino = await getOneWineStat(id);
      cargando = false;
    } catch (e) {
      mostrarMensaje(`No existe un vino con el ID "${params.id}".`, "error");
      cargando = false;
    }
  }

  async function guardarCambios() {
    const id = Number(params.id);
    try {
      await updateWineStat(id, vino);
      mostrarMensaje("Vino actualizado correctamente.");
      setTimeout(() => pop(), 1500);
    } catch (e) {
      mostrarMensaje(e.message, "error");
    }
  }

  onMount(cargarVino);
</script>

<svelte:head>
  <title>Editar Vino - SOS2526-29</title>
</svelte:head>

<div class="page">
  <button class="btn-back" on:click={() => pop()}>← Volver</button>
  <h1>✏️ Editar vino</h1>

  {#if mensaje}
    <div class="mensaje {tipoMensaje === 'error' ? 'error' : 'ok'}">{mensaje}</div>
  {/if}

  {#if cargando}
    <p class="cargando">Cargando datos del vino...</p>
  {:else if vino}
    <div class="card">
      <div class="form-grid">
        <label>Título<input bind:value={vino.title} /></label>
        <label>País<input bind:value={vino.country} /></label>
        <label>Región<input bind:value={vino.region} /></label>
        <label>Año<input type="number" bind:value={vino.year} /></label>
        <label>Precio (€)<input type="number" bind:value={vino.price} /></label>
        <label>Graduación (%)<input type="number" bind:value={vino.abv} /></label>
        <label>Unidades<input type="number" bind:value={vino.unit} /></label>
        <label>Uva<input bind:value={vino.grape} /></label>
        <label>Tipo<input bind:value={vino.type} /></label>
        <label>Capacidad (cl)<input type="number" bind:value={vino.capacity} /></label>
      </div>
      <div class="botones">
        <button class="btn-primary" on:click={guardarCambios}>💾 Guardar cambios</button>
        <button class="btn-cancel" on:click={() => pop()}>Cancelar</button>
      </div>
    </div>
  {:else}
    <p class="vacio">No se encontró el vino.</p>
  {/if}
</div>

<style>
  .page { max-width: 900px; margin: 0 auto; padding: 24px 16px; color: #f5f7fb; }
  h1 { font-size: 1.8rem; margin-bottom: 24px; color: #f5f7fb; }
  .card { background: #111827; border: 1px solid #1f2937; border-radius: 16px; padding: 24px; }
  .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; margin-bottom: 24px; }
  label { display: flex; flex-direction: column; font-size: 0.85rem; color: #9ca3af; gap: 4px; }
  input { padding: 8px 10px; border-radius: 8px; border: 1px solid #374151; background: #1f2937; color: #f5f7fb; font-size: 0.95rem; }
  input:focus { outline: none; border-color: #2563eb; }
  .botones { display: flex; gap: 12px; }
  .mensaje { padding: 12px 16px; border-radius: 10px; margin-bottom: 20px; font-weight: 500; }
  .mensaje.ok { background: #065f46; color: #6ee7b7; }
  .mensaje.error { background: #7f1d1d; color: #fca5a5; }
  .cargando { color: #9ca3af; }
  .vacio { color: #6b7280; }
  .btn-back { background: #374151; color: white; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; margin-bottom: 16px; }
  .btn-back:hover { background: #4b5563; }
  .btn-primary { background: #2563eb; color: white; border: none; padding: 10px 20px; border-radius: 10px; cursor: pointer; font-size: 0.95rem; }
  .btn-primary:hover { background: #1d4ed8; }
  .btn-cancel { background: #374151; color: white; border: none; padding: 10px 20px; border-radius: 10px; cursor: pointer; font-size: 0.95rem; }
  .btn-cancel:hover { background: #4b5563; }
</style>
