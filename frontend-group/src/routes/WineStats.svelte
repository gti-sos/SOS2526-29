<script>
  import { onMount } from "svelte";
  import { push } from "svelte-spa-router";
  import {
    getAllWineStats,
    createWineStat,
    deleteAllWineStats,
    deleteWineStat
  } from "../services/wine-stats.js";

  const API_BASE =
    window.location.hostname === "localhost"
      ? "http://localhost:10000/api/v1/wine-stats"
      : "/api/v1/wine-stats";

  let vinos = [];
  let mensaje = "";
  let tipoMensaje = "ok";
  let mostrarFormulario = false;

  let nuevoVino = {
    title: "", country: "", region: "", year: 0,
    price: 0, abv: 0, unit: 0, grape: "", type: "", capacity: 75
  };

  function mostrarMensaje(texto, tipo = "ok") {
    mensaje = texto;
    tipoMensaje = tipo;
    setTimeout(() => (mensaje = ""), 4000);
  }

  function resetFormulario() {
    nuevoVino = {
      title: "", country: "", region: "", year: 0,
      price: 0, abv: 0, unit: 0, grape: "", type: "", capacity: 75
    };
    mostrarFormulario = false;
  }

  async function cargarVinos() {
    try {
      vinos = await getAllWineStats();
    } catch (e) {
      mostrarMensaje(e.message, "error");
    }
  }

  async function cargarDatosIniciales() {
    try {
      const res = await fetch(`${API_BASE}/loadInitialData`);
      if (res.status === 201 || res.status === 200) {
        mostrarMensaje("Datos iniciales cargados correctamente.");
        cargarVinos();
      } else if (res.status === 409) {
        mostrarMensaje("Ya existen datos en la base de datos, no se pueden cargar los iniciales.", "error");
      } else {
        mostrarMensaje(`Error al cargar los datos iniciales. (código ${res.status})`, "error");
      }
    } catch (e) {
      mostrarMensaje("No se pudo conectar con el servidor.", "error");
    }
  }

  async function añadirVino() {
    try {
      await createWineStat(nuevoVino);
      mostrarMensaje(`Vino "${nuevoVino.title}" añadido correctamente.`);
      resetFormulario();
      cargarVinos();
    } catch (e) {
      mostrarMensaje(e.message, "error");
    }
  }

  async function borrarTodos() {
    if (!confirm("¿Estás seguro de que quieres borrar todos los vinos?")) return;
    try {
      await deleteAllWineStats();
      mostrarMensaje("Todos los vinos han sido eliminados.");
      vinos = [];
    } catch (e) {
      mostrarMensaje(e.message, "error");
    }
  }

  async function borrarVino(id, title) {
    if (!confirm(`¿Eliminar el vino "${title}"?`)) return;
    try {
      await deleteWineStat(id);
      mostrarMensaje(`Vino "${title}" eliminado correctamente.`);
      cargarVinos();
    } catch (e) {
      mostrarMensaje(e.message, "error");
    }
  }

  function irAEditar(id) {
    push(`/wine-stats/editar/${id}`);
  }

  onMount(cargarVinos);
</script>

<svelte:head>
  <title>Wine Stats - SOS2526-29</title>
</svelte:head>

<div class="page">
  <h1>🍷 Estadísticas de Vinos</h1>

  {#if mensaje}
    <div class="mensaje {tipoMensaje === 'error' ? 'error' : 'ok'}">{mensaje}</div>
  {/if}

  {#if mostrarFormulario}
    <section class="card">
      <h2>➕ Añadir nuevo vino</h2>
      <div class="form-grid">
        <label>Título<input bind:value={nuevoVino.title} placeholder="Nombre del vino" /></label>
        <label>País<input bind:value={nuevoVino.country} placeholder="spain, france..." /></label>
        <label>Región<input bind:value={nuevoVino.region} placeholder="Rioja, Penedès..." /></label>
        <label>Año<input type="number" bind:value={nuevoVino.year} /></label>
        <label>Precio (€)<input type="number" bind:value={nuevoVino.price} /></label>
        <label>Graduación (%)<input type="number" bind:value={nuevoVino.abv} /></label>
        <label>Unidades<input type="number" bind:value={nuevoVino.unit} /></label>
        <label>Uva<input bind:value={nuevoVino.grape} placeholder="Tempranillo..." /></label>
        <label>Tipo<input bind:value={nuevoVino.type} placeholder="Red, White, Rosé..." /></label>
        <label>Capacidad (cl)<input type="number" bind:value={nuevoVino.capacity} /></label>
      </div>
      <div class="botones-form">
        <button class="btn-primary" on:click={añadirVino}>💾 Guardar vino</button>
        <button class="btn-cancel" on:click={resetFormulario}>Cancelar</button>
      </div>
    </section>
  {/if}

  <section class="card">
    <div class="list-header">
      <h2>Lista de vinos ({vinos.length})</h2>
      <div class="acciones">
        <button class="btn-add" on:click={() => mostrarFormulario = !mostrarFormulario}>
          {mostrarFormulario ? "✖ Cerrar formulario" : "➕ Añadir vino"}
        </button>
        <button class="btn-secondary" on:click={cargarVinos}>🔄 Actualizar</button>
        <button class="btn-init" on:click={cargarDatosIniciales}>📦 Cargar datos iniciales</button>
        <button class="btn-danger" on:click={borrarTodos}>🗑️ Eliminar todos</button>
      </div>
    </div>

    {#if vinos.length === 0}
      <p class="vacio">No hay vinos registrados.</p>
    {:else}
      <div class="tabla-wrapper">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Título</th>
              <th>País</th>
              <th>Año</th>
              <th>Precio</th>
              <th>Uva</th>
              <th>Tipo</th>
              <th>Graduación</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {#each vinos as vino}
              <tr>
                <td>{vino.id}</td>
                <td>{vino.title}</td>
                <td>{vino.country}</td>
                <td>{vino.year}</td>
                <td>{vino.price} €</td>
                <td>{vino.grape}</td>
                <td>{vino.type}</td>
                <td>{vino.abv}%</td>
                <td class="acciones-fila">
                  <button class="btn-edit" on:click={() => irAEditar(vino.id)}>✏️ Editar</button>
                  <button class="btn-danger-sm" on:click={() => borrarVino(vino.id, vino.title)}>🗑️ Borrar</button>
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
  .page { max-width: 1200px; margin: 0 auto; padding: 24px 16px; color: #f5f7fb; }
  h1 { font-size: 2rem; margin-bottom: 24px; color: #000000; }
  h2 { margin-top: 0; margin-bottom: 16px; color: #f5f7fb; }
  .card { background: #111827; border: 1px solid #1f2937; border-radius: 16px; padding: 24px; margin-bottom: 24px; }
  .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-bottom: 16px; }
  label { display: flex; flex-direction: column; font-size: 0.85rem; color: #9ca3af; gap: 4px; }
  input { padding: 8px 10px; border-radius: 8px; border: 1px solid #374151; background: #1f2937; color: #f5f7fb; font-size: 0.95rem; }
  input:focus { outline: none; border-color: #2563eb; }
  .botones-form { display: flex; gap: 12px; margin-top: 4px; }
  .list-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 16px; }
  .acciones { display: flex; gap: 8px; flex-wrap: wrap; }
  .tabla-wrapper { overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
  th { background: #1f2937; padding: 10px 12px; text-align: left; color: #9ca3af; }
  td { padding: 10px 12px; border-bottom: 1px solid #1f2937; color: #f5f7fb; }
  tr:hover td { background: #1f2937; }
  .acciones-fila { display: flex; gap: 6px; }
  .vacio { color: #6b7280; text-align: center; padding: 24px 0; }
  .mensaje { padding: 12px 16px; border-radius: 10px; margin-bottom: 20px; font-weight: 500; }
  .mensaje.ok { background: #065f46; color: #6ee7b7; }
  .mensaje.error { background: #7f1d1d; color: #fca5a5; }
  .btn-add { background: #16a34a; color: white; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; }
  .btn-add:hover { background: #15803d; }
  .btn-secondary { background: #374151; color: white; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; }
  .btn-secondary:hover { background: #4b5563; }
  .btn-init { background: #7c3aed; color: white; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; }
  .btn-init:hover { background: #6d28d9; }
  .btn-danger { background: #dc2626; color: white; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; }
  .btn-danger:hover { background: #b91c1c; }
  .btn-edit { background: #d97706; color: white; border: none; padding: 6px 10px; border-radius: 6px; cursor: pointer; font-size: 0.85rem; }
  .btn-edit:hover { background: #b45309; }
  .btn-danger-sm { background: #dc2626; color: white; border: none; padding: 6px 10px; border-radius: 6px; cursor: pointer; font-size: 0.85rem; }
  .btn-danger-sm:hover { background: #b91c1c; }
  .btn-primary { background: #2563eb; color: white; border: none; padding: 10px 20px; border-radius: 10px; cursor: pointer; font-size: 0.95rem; }
  .btn-primary:hover { background: #1d4ed8; }
  .btn-cancel { background: #374151; color: white; border: none; padding: 10px 20px; border-radius: 10px; cursor: pointer; font-size: 0.95rem; }
  .btn-cancel:hover { background: #4b5563; }
</style>
