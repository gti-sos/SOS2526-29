<script>
  import { onMount } from "svelte";
  import {
    getAllCitysStats,
    createCityStat,
    deleteAllCitysStats,
    deleteCityStat
  } from "../services/citysStatsApi";

  let citysStats = [];
  let message = "";
  let error = "";

  let form = {
    city: "",
    country: "",
    un_2025_population: ""
  };

  async function loadData() {
    error = "";
    try {
      citysStats = await getAllCitysStats();
    } catch (e) {
      error = "No se pudieron cargar los datos de ciudades.";
    }
  }

  async function handleCreate() {
    message = "";
    error = "";

    try {
      await createCityStat({
        city: form.city,
        country: form.country,
        un_2025_population: Number(form.un_2025_population)
      });

      message = `La ciudad ${form.city} (${form.country}) se ha creado correctamente.`;
      form = { city: "", country: "", un_2025_population: "" };
      await loadData();
    } catch (e) {
      error = `No se pudo crear el recurso: ${e.message}`;
    }
  }

  async function handleDeleteAll() {
    message = "";
    error = "";

    try {
      await deleteAllCitysStats();
      message = "Se han eliminado todos los registros correctamente.";
      await loadData();
    } catch (e) {
      error = `No se pudieron eliminar todos los registros: ${e.message}`;
    }
  }

  async function handleDeleteOne(city, country) {
    message = "";
    error = "";

    try {
      await deleteCityStat(city, country);
      message = `Se ha eliminado correctamente la ciudad ${city} (${country}).`;
      await loadData();
    } catch (e) {
      error = `No se pudo eliminar ${city} (${country}): ${e.message}`;
    }
  }

  onMount(loadData);
</script>

<svelte:head>
  <title>Gestión de ciudades</title>
</svelte:head>

<div class="container">
  <div class="topbar">
    <a href="#/">Volver al inicio</a>
  </div>

  <h1>Gestión de estadísticas de ciudades</h1>
  <p>Desde esta pantalla puedes crear, consultar y eliminar registros.</p>

  {#if message}
    <div class="message success">{message}</div>
  {/if}

  {#if error}
    <div class="message error">{error}</div>
  {/if}

  <section class="panel">
    <h2>Crear nuevo registro</h2>

    <div class="form-grid">
      <input bind:value={form.city} placeholder="Ciudad" />
      <input bind:value={form.country} placeholder="País" />
      <input bind:value={form.un_2025_population} placeholder="Población estimada en 2025" type="number" />
    </div>

    <div class="actions">
      <button on:click={handleCreate}>Crear registro</button>
      <button class="danger" on:click={handleDeleteAll}>Eliminar todos los registros</button>
    </div>
  </section>

  <section class="panel">
    <h2>Listado de registros</h2>

    {#if citysStats.length === 0}
      <p>No hay registros disponibles.</p>
    {:else}
      <table>
        <thead>
          <tr>
            <th>Ciudad</th>
            <th>País</th>
            <th>Población estimada 2025</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {#each citysStats as item}
            <tr>
              <td>{item.city}</td>
              <td>{item.country}</td>
              <td>{item.un_2025_population}</td>
              <td class="row-actions">
               <a href={`#/citys-stats/editar/${item.city}/${item.country}`}>Editar</a>
                <button class="danger small" on:click={() => handleDeleteOne(item.city, item.country)}>
                  Eliminar
                </button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  </section>
</div>

<style>
  :global(body) {
    margin: 0;
    font-family: Arial, Helvetica, sans-serif;
    background: #f4f7fb;
    color: #111827;
  }

  .container {
    max-width: 1100px;
    margin: 0 auto;
    padding: 24px;
  }

  .topbar {
    margin-bottom: 16px;
  }

  .topbar a,
  .row-actions a {
    text-decoration: none;
    color: white;
    background: #2563eb;
    padding: 8px 12px;
    border-radius: 8px;
    display: inline-block;
  }

  .panel {
    background: white;
    padding: 20px;
    border-radius: 14px;
    margin-bottom: 24px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  }

  .form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 12px;
    margin-bottom: 16px;
  }

  input {
    padding: 12px;
    border: 1px solid #d1d5db;
    border-radius: 8px;
  }

  .actions,
  .row-actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    align-items: center;
  }

  button {
    border: none;
    background: #2563eb;
    color: white;
    padding: 10px 14px;
    border-radius: 8px;
    cursor: pointer;
  }

  button.danger {
    background: #dc2626;
  }

  button.small {
    padding: 8px 12px;
  }

  .message {
    padding: 12px 14px;
    border-radius: 10px;
    margin-bottom: 16px;
  }

  .success {
    background: #dcfce7;
    color: #166534;
  }

  .error {
    background: #fee2e2;
    color: #991b1b;
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  th, td {
    border-bottom: 1px solid #e5e7eb;
    padding: 12px;
    text-align: left;
  }
</style>