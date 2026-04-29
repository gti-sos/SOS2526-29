<script>
  // onMount ejecuta codigo al abrir la pantalla.
  import { onMount } from "svelte";
  // Funciones para leer, crear, borrar y actualizar citys-stats.
  import {
    createCityStat,
    deleteCityStat,
    getOneCityStat,
    updateCityStat
  } from "../services/citysStatsApi";
  import { replace } from "../lib/navigation.js";

  // params contiene city y country tomados de la URL.
  export let params = {};

  // Devuelve el formulario vacio.
  const emptyForm = () => ({
    city: "",
    country: "",
    un_2025_population: ""
  });

  // Datos actuales del formulario.
  let form = emptyForm();
  // Guarda la ciudad y pais originales para saber que recurso se esta editando.
  let originalKey = { city: "", country: "" };
  // Mensaje de exito.
  let message = "";
  // Mensaje de error.
  let error = "";
  // Indica si la pantalla esta cargando.
  let loading = true;

  // Limpia los mensajes de la pantalla.
  function clearFeedback() {
    message = "";
    error = "";
  }

  // Convierte un valor a entero positivo obligatorio.
  function parsePositiveInteger(value, fieldLabel) {
    const trimmed = String(value ?? "").trim();

    if (!trimmed) {
      throw new Error(`Complete el campo "${fieldLabel}".`);
    }

    const parsed = Number(trimmed);

    if (!Number.isInteger(parsed) || parsed <= 0) {
      throw new Error(`"${fieldLabel}" debe ser un numero entero mayor que 0.`);
    }

    return parsed;
  }

  // Valida el formulario antes de guardar.
  function validateForm() {
    const city = String(form.city ?? "").trim();
    const country = String(form.country ?? "").trim();
    const un_2025_population = parsePositiveInteger(
      form.un_2025_population,
      "Poblacion estimada en 2025"
    );

    if (!city) {
      throw new Error("Indique una ciudad.");
    }

    if (!country) {
      throw new Error("Indique un pais.");
    }

    return {
      city,
      country,
      un_2025_population
    };
  }

  // Comprueba si ciudad y pais siguen siendo los mismos.
  function isSameResource(payload) {
    return (
      payload.city.trim().toLowerCase() === originalKey.city &&
      payload.country.trim().toLowerCase() === originalKey.country
    );
  }

  // Cambia la URL si el usuario modifica ciudad o pais.
  function updateRoute(city, country) {
    replace(`/citys-stats/editar/${encodeURIComponent(city)}/${encodeURIComponent(country)}`);
  }

  // Carga el registro original desde la API.
  async function loadResource() {
    loading = true;
    error = "";

    try {
      const data = await getOneCityStat(params.city, params.country);

      form = {
        city: data.city,
        country: data.country,
        un_2025_population: data.un_2025_population
      };

      originalKey = {
        city: data.city,
        country: data.country
      };
    } catch (e) {
      error = e.message || "No hemos encontrado el registro solicitado.";
    } finally {
      loading = false;
    }
  }

  // Guarda cambios, actualizando o recreando si cambia la clave.
  async function handleUpdate() {
    clearFeedback();

    try {
      const payload = validateForm();

      if (isSameResource(payload)) {
        const updated = await updateCityStat(
          originalKey.city,
          originalKey.country,
          payload
        );

        form = {
          city: updated.city,
          country: updated.country,
          un_2025_population: updated.un_2025_population
        };

        message = "Los cambios se han guardado correctamente.";
        return;
      }

      const created = await createCityStat(payload);
      await deleteCityStat(originalKey.city, originalKey.country);

      form = {
        city: created.city,
        country: created.country,
        un_2025_population: created.un_2025_population
      };

      originalKey = {
        city: created.city,
        country: created.country
      };

      updateRoute(created.city, created.country);
      message =
        "Se ha actualizado el registro y se ha guardado con la nueva ciudad o pais.";
    } catch (e) {
      error = e.message || "No se pudieron guardar los cambios.";
    }
  }

  // Al abrir la pantalla, cargamos el registro.
  onMount(loadResource);
</script>

<svelte:head>
  <title>City-stats | Editar registro</title>
</svelte:head>

<div class="page-shell">
  <div class="page">
    <div class="topbar">
      <a href="/citys-stats" class="ghost-link">Volver al listado</a>
    </div>

    <section class="panel hero-panel">
      <p class="eyebrow">Edicion separada</p>
      <h1>Editar registro</h1>
      <p class="subtitle">
        Aqui puedes actualizar la ciudad, el pais o la poblacion estimada sin volver a la lista principal.
      </p>
    </section>

    {#if message}
      <div class="message success" role="status" data-testid="edit-success">{message}</div>
    {/if}

    {#if error}
      <div class="message error" role="alert" data-testid="edit-error">{error}</div>
    {/if}

    <section class="panel">
      {#if loading}
        <p class="state-text">Se esta cargando el registro seleccionado...</p>
      {:else if error && !originalKey.city}
        <div class="empty-box">
          <p>No hemos podido abrir este registro.</p>
          <a href="/citys-stats" class="ghost-link full-width">Volver al listado</a>
        </div>
      {:else}
        <form class="grid-form" on:submit|preventDefault={handleUpdate}>
          <label>
            <span>Ciudad</span>
            <input bind:value={form.city} placeholder="Ejemplo: madrid" data-testid="edit-city" />
          </label>

          <label>
            <span>Pais</span>
            <input bind:value={form.country} placeholder="Ejemplo: spain" data-testid="edit-country" />
          </label>

          <label>
            <span>Poblacion estimada en 2025</span>
            <input
              bind:value={form.un_2025_population}
              type="number"
              min="1"
              step="1"
              placeholder="Ejemplo: 7100000"
              data-testid="edit-population"
            />
          </label>

          <div class="form-footer">
            <button type="submit" data-testid="edit-submit">Guardar cambios</button>
          </div>
        </form>
      {/if}
    </section>
  </div>
</div>

<style>
  :global(body) {
    margin: 0;
    font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
    background:
      radial-gradient(circle at top left, rgba(224, 242, 254, 0.8), transparent 28%),
      radial-gradient(circle at right center, rgba(255, 237, 213, 0.75), transparent 22%),
      linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%);
    color: #1f2937;
  }

  .page-shell {
    min-height: 100vh;
    padding: 24px 16px 48px;
    box-sizing: border-box;
  }

  .page {
    max-width: 920px;
    margin: 0 auto;
  }

  .topbar {
    margin-bottom: 18px;
  }

  .ghost-link,
  button,
  input {
    font: inherit;
  }

  .ghost-link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 10px 16px;
    border-radius: 999px;
    border: 1px solid rgba(31, 41, 55, 0.12);
    background: rgba(255, 255, 255, 0.82);
    text-decoration: none;
    color: #0f172a;
    box-shadow: 0 12px 26px rgba(15, 23, 42, 0.06);
  }

  .full-width {
    width: 100%;
    box-sizing: border-box;
  }

  .panel {
    border-radius: 24px;
    background: rgba(255, 255, 255, 0.88);
    border: 1px solid rgba(255, 255, 255, 0.72);
    box-shadow: 0 24px 60px rgba(15, 23, 42, 0.08);
    backdrop-filter: blur(12px);
    padding: 24px;
    margin-bottom: 18px;
  }

  .hero-panel {
    margin-bottom: 20px;
  }

  .eyebrow {
    margin: 0 0 8px;
    text-transform: uppercase;
    letter-spacing: 0.18em;
    color: #0284c7;
    font-size: 0.8rem;
    font-weight: 700;
  }

  h1 {
    margin: 0;
    font-size: clamp(2rem, 4vw, 3rem);
    color: #0f172a;
  }

  .subtitle {
    margin: 12px 0 0;
    color: #475569;
  }

  .message {
    margin-bottom: 16px;
    padding: 14px 18px;
    border-radius: 18px;
    border: 1px solid transparent;
  }

  .success {
    background: #ecfdf5;
    border-color: #a7f3d0;
    color: #065f46;
  }

  .error {
    background: #fef2f2;
    border-color: #fecaca;
    color: #991b1b;
  }

  .grid-form {
    display: grid;
    gap: 18px;
  }

  label {
    display: flex;
    flex-direction: column;
    gap: 8px;
    color: #334155;
    font-weight: 600;
  }

  label span {
    font-size: 0.95rem;
  }

  input {
    border: 1px solid #d8dee9;
    border-radius: 16px;
    background: #ffffff;
    color: #0f172a;
    padding: 13px 14px;
    box-sizing: border-box;
  }

  input:focus {
    outline: 2px solid rgba(14, 165, 233, 0.18);
    border-color: #38bdf8;
  }

  .form-footer {
    display: flex;
    justify-content: flex-start;
  }

  button {
    border: none;
    border-radius: 999px;
    background: linear-gradient(135deg, #0f766e 0%, #0ea5e9 100%);
    color: white;
    padding: 12px 18px;
    cursor: pointer;
    box-shadow: 0 14px 28px rgba(14, 116, 144, 0.18);
  }

  .state-text,
  .empty-box p {
    margin: 0;
    color: #64748b;
  }

  .empty-box {
    display: grid;
    gap: 14px;
  }

  @media (max-width: 640px) {
    .page-shell {
      padding-inline: 12px;
    }

    .panel {
      padding: 18px;
      border-radius: 20px;
    }

    .ghost-link,
    button {
      width: 100%;
      box-sizing: border-box;
    }
  }
</style>
