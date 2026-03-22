<script>
  import { onMount } from "svelte";
  
  import { getOneCityStat, updateCityStat } from "../services/citysStatsApi";

  export let params = {};

  let form = {
    city: "",
    country: "",
    un_2025_population: ""
  };

  let message = "";
  let error = "";

  async function loadResource() {
    try {
      const data = await getOneCityStat(params.city, params.country);
      form = {
        city: data.city,
        country: data.country,
        un_2025_population: data.un_2025_population
      };
    } catch (e) {
      error = `No existe un registro para ${params.city} (${params.country}).`;
    }
  }

  async function handleUpdate() {
    message = "";
    error = "";

    try {
      await updateCityStat(params.city, params.country, {
        city: form.city,
        country: form.country,
        un_2025_population: Number(form.un_2025_population)
      });

      message = `El registro ${form.city} (${form.country}) se ha actualizado correctamente.`;
    } catch (e) {
      error = `No se pudo actualizar el registro: ${e.message}`;
    }
  }

  onMount(loadResource);
</script>

<svelte:head>
  <title>Editar ciudad</title>
</svelte:head>

<div class="container">
  <div class="topbar">
    <a href="#/citys-stats">Volver al listado</a>
  </div>

  <h1>Editar registro</h1>
  <p>Modifica la información del recurso seleccionado.</p>

  {#if message}
    <div class="message success">{message}</div>
  {/if}

  {#if error}
    <div class="message error">{error}</div>
  {/if}

  <section class="panel">
    <div class="form-grid">
      <input bind:value={form.city} placeholder="Ciudad" />
      <input bind:value={form.country} placeholder="País" />
      <input bind:value={form.un_2025_population} type="number" placeholder="Población estimada en 2025" />
    </div>

    <button on:click={handleUpdate}>Guardar cambios</button>
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
    max-width: 900px;
    margin: 0 auto;
    padding: 24px;
  }

  .topbar {
    margin-bottom: 16px;
  }

  .topbar a {
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
    gap: 12px;
    margin-bottom: 16px;
  }

  input {
    padding: 12px;
    border: 1px solid #d1d5db;
    border-radius: 8px;
  }

  button {
    border: none;
    background: #2563eb;
    color: white;
    padding: 10px 14px;
    border-radius: 8px;
    cursor: pointer;
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
</style>