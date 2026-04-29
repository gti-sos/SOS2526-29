<script>
  // onMount ejecuta una funcion cuando la pantalla aparece por primera vez.
  import { onMount } from "svelte";
  // navigate permite navegar a otra ruta del frontend.
  import { navigate } from "../lib/navigation.js";
  // Importamos funciones ya preparadas para llamar a la API de vinos.
  import {
    getAllWineStats,
    createWineStat,
    deleteAllWineStats,
    deleteWineStat
  } from "../services/wine-stats.js";

  // Esta URL se usa en busquedas y carga inicial directa desde esta pantalla.
  const API_BASE =
    window.location.hostname === "localhost"
      ? "http://localhost:10000/api/v1/wine-stats"
      : "/api/v1/wine-stats";

  // Lista de vinos que se muestra en la tabla.
  let vinos = [];
  // Texto del mensaje de exito o error.
  let mensaje = "";
  // Tipo de mensaje: "ok" o "error".
  let tipoMensaje = "ok";
  // Controla si se ve el formulario de alta.
  let mostrarFormulario = false;
  // Controla si se ve el buscador.
  let mostrarBuscador = false;

  // Objeto enlazado al formulario para crear un vino.
  let nuevoVino = {
    title: "", country: "", region: "", year: 0,
    price: 0, abv: 0, unit: 0, grape: "", type: "", capacity: 75
  };

  // Objeto enlazado al formulario de filtros.
  let filtros = {
    title: "", country: "", region: "", year: "",
    price: "", abv: "", unit: "", grape: "", type: "",
    capacity: "", id: "", offset: "", limit: "",
    yearDesde: "", yearHasta: ""
  };

  // Muestra un mensaje temporal en pantalla.
  function mostrarMensaje(texto, tipo = "ok") {
    mensaje = texto;
    tipoMensaje = tipo;
    setTimeout(() => (mensaje = ""), 10000);
  }

  // Deja el formulario de alta como al principio.
  function resetFormulario() {
    nuevoVino = {
      title: "", country: "", region: "", year: 0,
      price: 0, abv: 0, unit: 0, grape: "", type: "", capacity: 75
    };
    mostrarFormulario = false;
  }

  // Limpia todos los filtros de busqueda.
  function resetFiltros() {
    filtros = {
      title: "", country: "", region: "", year: "",
      price: "", abv: "", unit: "", grape: "", type: "",
      capacity: "", id: "", offset: "", limit: "",
      yearDesde: "", yearHasta: ""
    };
  }

  // Carga todos los vinos desde la API.
  async function cargarVinos() {
    try {
      vinos = await getAllWineStats();
    } catch (e) {
      mostrarMensaje(e.message, "error");
    }
  }

  // Busca vinos aplicando los filtros indicados por el usuario.
  async function buscarVinos() {
    try {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(filtros)) {
        if (value !== "" && value !== null && key !== "yearDesde" && key !== "yearHasta") {
          params.append(key, value);
        }
      }
      const url = `${API_BASE}?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) {
        const data = await res.json();
        mostrarMensaje(data.error || "Error al buscar vinos.", "error");
        return;
      }
      let resultado = await res.json();

      if (filtros.yearDesde !== "") {
        resultado = resultado.filter(v => v.year >= Number(filtros.yearDesde));
      }
      if (filtros.yearHasta !== "") {
        resultado = resultado.filter(v => v.year <= Number(filtros.yearHasta));
      }

      vinos = resultado;
      if (vinos.length === 0) {
        mostrarMensaje("No se encontraron vinos con esos criterios.", "error");
      } else {
        mostrarMensaje(`Se encontraron ${vinos.length} vino(s).`);
      }
    } catch (e) {
      mostrarMensaje("No se pudo conectar con el servidor.", "error");
    }
  }

  // Pide al backend que cargue los datos iniciales.
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

  // Crea un vino con los datos del formulario.
  async function anadirVino() {
    try {
      await createWineStat(nuevoVino);
      mostrarMensaje(`Vino "${nuevoVino.title}" añadido correctamente.`);
      resetFormulario();
      cargarVinos();
    } catch (e) {
      mostrarMensaje(e.message, "error");
    }
  }

  // Borra todos los vinos despues de pedir confirmacion.
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

  // Borra un vino concreto por id.
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

  // Navega a la pantalla de edicion de un vino.
  function irAEditar(id) {
    navigate(`/wine-stats/editar/${id}`);
  }

  // Al abrir la pantalla, cargamos la lista inicial de vinos.
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
        <button class="btn-primary" on:click={anadirVino}>💾 Guardar vino</button>
        <button class="btn-cancel" on:click={resetFormulario}>Cancelar</button>
      </div>
    </section>
  {/if}

  {#if mostrarBuscador}
    <section class="card">
      <h2>🔍 Buscar vinos</h2>
      <div class="form-grid">
        <label>ID<input type="number" bind:value={filtros.id} placeholder="1, 2..." /></label>
        <label>Título<input bind:value={filtros.title} placeholder="The Guv'nor..." /></label>
        <label>País<input bind:value={filtros.country} placeholder="spain..." /></label>
        <label>Región<input bind:value={filtros.region} placeholder="rioja..." /></label>
        <label>Año exacto<input type="number" bind:value={filtros.year} placeholder="2022" /></label>
        <label>Año desde<input type="number" bind:value={filtros.yearDesde} placeholder="2015" /></label>
        <label>Año hasta<input type="number" bind:value={filtros.yearHasta} placeholder="2023" /></label>
        <label>Precio (€)<input type="number" bind:value={filtros.price} placeholder="9.99" /></label>
        <label>Graduación (%)<input type="number" bind:value={filtros.abv} placeholder="14" /></label>
        <label>Unidades<input type="number" bind:value={filtros.unit} placeholder="100" /></label>
        <label>Uva<input bind:value={filtros.grape} placeholder="Tempranillo..." /></label>
        <label>Tipo<input bind:value={filtros.type} placeholder="Red, White..." /></label>
        <label>Capacidad (cl)<input type="number" bind:value={filtros.capacity} placeholder="75" /></label>
        <label>Desde el resultado nº (offset)<input type="number" bind:value={filtros.offset} placeholder="0" /></label>
        <label>Máximo de resultados (limit)<input type="number" bind:value={filtros.limit} placeholder="10" /></label>
      </div>
      <div class="botones-form">
        <button class="btn-primary" on:click={buscarVinos}>🔍 Buscar</button>
        <button class="btn-cancel" on:click={() => { resetFiltros(); cargarVinos(); }}>✖ Limpiar y ver todos</button>
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
        <button class="btn-search" on:click={() => mostrarBuscador = !mostrarBuscador}>
          {mostrarBuscador ? "✖ Cerrar buscador" : "🔍 Buscar"}
        </button>
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
  .botones-form { display: flex; gap: 12px; margin-top: 4px; flex-wrap: wrap; }
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
  .btn-search { background: #0369a1; color: white; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; }
  .btn-search:hover { background: #075985; }
  .btn-init { background: #7c3aed; color: white; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; }
  .btn-init:hover { background: #6d28d9; }
  .btn-danger { background: #374151; color: white; border: none; padding: 10px 20px; border-radius: 10px; cursor: pointer; font-size: 0.95rem; }
  .btn-cancel { background: #374151; color: white; border: none; padding: 10px 20px; border-radius: 10px; cursor: pointer; font-size: 0.95rem; }
  .btn-cancel:hover { background: #4b5563; }
</style>
