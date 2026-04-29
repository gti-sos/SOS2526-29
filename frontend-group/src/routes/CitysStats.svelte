<script>
  // onMount ejecuta codigo cuando la pantalla se abre.
  import { onMount } from "svelte";
  // Funciones del servicio que llaman a la API de citys-stats.
  import {
    createCityStat,
    deleteAllCitysStats,
    deleteCityStat,
    getAllCitysStats,
    loadInitialCitysStats
  } from "../services/citysStatsApi";
  import { navigate } from "../lib/navigation.js";

  // Opciones del desplegable de ordenacion.
  const sortOptions = [
    { value: "", label: "Sin orden especial" },
    { value: "city", label: "Ciudad (A-Z)" },
    { value: "-city", label: "Ciudad (Z-A)" },
    { value: "country", label: "Pais (A-Z)" },
    { value: "-country", label: "Pais (Z-A)" },
    { value: "un_2025_population", label: "Poblacion (menor a mayor)" },
    { value: "-un_2025_population", label: "Poblacion (mayor a menor)" }
  ];

  // Devuelve un formulario de creacion vacio.
  const emptyCreateForm = () => ({
    city: "",
    country: "",
    un_2025_population: ""
  });

  // Devuelve un formulario de busqueda vacio.
  const emptySearchForm = () => ({
    q: "",
    city: "",
    country: "",
    un_2025_population: "",
    sort: "",
    limit: "",
    offset: ""
  });

  // Lista de registros que se muestra en la tabla.
  let citysStats = [];
  // Datos del formulario para crear registros.
  let createForm = emptyCreateForm();
  // Datos del formulario de busqueda.
  let searchForm = emptySearchForm();
  // Mensaje de exito visible.
  let message = "";
  // Mensaje de error visible.
  let error = "";
  // Indica si se esta esperando respuesta de la API.
  let loading = false;
  // Ultima busqueda aplicada, util para refrescar despues de crear o borrar.
  let activeQuery = {};

  // Limpia mensajes de exito y error.
  function clearFeedback() {
    message = "";
    error = "";
  }

  // Comprueba si una busqueda tiene algun filtro activo.
  function hasQueryValues(query) {
    return Object.values(query).some(
      (value) => value !== undefined && value !== null && value !== ""
    );
  }

  // Convierte un valor obligatorio a entero positivo.
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

  // Convierte un valor opcional a entero igual o mayor que cero.
  function parseOptionalNonNegativeInteger(value, fieldLabel) {
    const trimmed = String(value ?? "").trim();

    if (!trimmed) {
      return undefined;
    }

    const parsed = Number(trimmed);

    if (!Number.isInteger(parsed) || parsed < 0) {
      throw new Error(`"${fieldLabel}" debe ser un numero entero igual o mayor que 0.`);
    }

    return parsed;
  }

  // Convierte un valor opcional a entero positivo.
  function parseOptionalPositiveInteger(value, fieldLabel) {
    const trimmed = String(value ?? "").trim();

    if (!trimmed) {
      return undefined;
    }

    const parsed = Number(trimmed);

    if (!Number.isInteger(parsed) || parsed <= 0) {
      throw new Error(`"${fieldLabel}" debe ser un numero entero mayor que 0.`);
    }

    return parsed;
  }

  // Valida el formulario de creacion antes de enviarlo al backend.
  function validateCityStatForm(form) {
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

  // Construye el objeto de filtros que se enviara a la API.
  function buildSearchQuery() {
    const query = {
      q: String(searchForm.q ?? "").trim(),
      city: String(searchForm.city ?? "").trim(),
      country: String(searchForm.country ?? "").trim(),
      un_2025_population: parseOptionalPositiveInteger(
        searchForm.un_2025_population,
        "Poblacion exacta"
      ),
      sort: String(searchForm.sort ?? "").trim(),
      limit: parseOptionalNonNegativeInteger(
        searchForm.limit,
        "Numero maximo de resultados"
      ),
      offset: parseOptionalNonNegativeInteger(
        searchForm.offset,
        "Posicion inicial"
      )
    };

    Object.keys(query).forEach((key) => {
      if (query[key] === "" || query[key] === undefined) {
        delete query[key];
      }
    });

    return query;
  }

  // Recarga la tabla usando una query concreta.
  async function refreshList(query = activeQuery, successMessage = "") {
    loading = true;
    error = "";

    try {
      citysStats = await getAllCitysStats(query);
      activeQuery = { ...query };

      if (successMessage) {
        message = successMessage;
      }

      return citysStats;
    } catch (e) {
      citysStats = [];
      error = e.message || "No se pudieron cargar los datos de ciudades.";
      return [];
    } finally {
      loading = false;
    }
  }

  // Ejecuta la busqueda del formulario.
  async function handleSearch() {
    clearFeedback();

    try {
      const query = buildSearchQuery();
      const results = await refreshList(query);

      if (hasQueryValues(query)) {
        message =
          results.length > 0
            ? `Busqueda aplicada. Se muestran ${results.length} registro(s).`
            : "No hemos encontrado registros con esa busqueda.";
      } else {
        message = "Se muestran todos los registros disponibles.";
      }
    } catch (e) {
      error = e.message;
    }
  }

  // Limpia filtros y vuelve a cargar todos los registros.
  async function handleResetSearch() {
    searchForm = emptySearchForm();
    clearFeedback();
    await refreshList({}, "Se han limpiado los filtros.");
  }

  // Crea un registro nuevo.
  async function handleCreate() {
    clearFeedback();

    try {
      const payload = validateCityStatForm(createForm);
      const created = await createCityStat(payload);

      createForm = emptyCreateForm();
      await refreshList(
        activeQuery,
        `Se ha creado el registro de ${created.city} (${created.country}).`
      );
    } catch (e) {
      error = e.message || "No se pudo crear el registro.";
    }
  }

  // Carga los datos iniciales de ejemplo.
  async function handleLoadInitialData() {
    clearFeedback();

    try {
      const loaded = await loadInitialCitysStats();
      const loadedCount = Array.isArray(loaded) ? loaded.length : 0;

      await refreshList(
        activeQuery,
        `Se han cargado los datos de ejemplo. Ahora hay ${loadedCount} registro(s) disponibles.`
      );
    } catch (e) {
      error = e.message || "No se pudieron cargar los datos de ejemplo.";
    }
  }

  // Borra todos los registros.
  async function handleDeleteAll() {
    clearFeedback();

    try {
      await deleteAllCitysStats();
      await refreshList(activeQuery, "Se han eliminado todos los registros.");
    } catch (e) {
      error = e.message || "No se pudieron eliminar todos los registros.";
    }
  }

  // Borra un registro concreto.
  async function handleDeleteOne(city, country) {
    clearFeedback();

    try {
      await deleteCityStat(city, country);
      await refreshList(
        activeQuery,
        `Se ha eliminado ${city} (${country}) correctamente.`
      );
    } catch (e) {
      error = e.message || "No se pudo eliminar el registro seleccionado.";
    }
  }

  // Abre la pantalla de edicion para una ciudad concreta.
  function openEdit(city, country) {
    navigate(`/citys-stats/editar/${encodeURIComponent(city)}/${encodeURIComponent(country)}`);
  }

  // Al abrir la pantalla, cargamos todos los datos.
  onMount(async () => {
    await refreshList({}, "");
  });
</script>

<svelte:head>
  <title>City-stats | Gestion de ciudades</title>
</svelte:head>

<div class="page-shell">
  <div class="page">
    <div class="topbar">
      <a href="/" class="ghost-link">Volver al inicio</a>
      <button type="button" class="ghost-button" on:click={handleLoadInitialData} data-testid="load-initial-data">
        Cargar datos de ejemplo
      </button>
    </div>

    <header class="hero">
      <div>
        <p class="eyebrow">LCC · city-stats</p>
        <h1>Estadisticas de ciudades</h1>
        <p class="subtitle">
          Desde esta pantalla puedes buscar, crear, editar y eliminar registros de forma sencilla.
        </p>
      </div>
      <div class="summary-card" data-testid="results-summary">
        <span>Registros visibles</span>
        <strong>{citysStats.length}</strong>
      </div>
    </header>

    {#if message}
      <div class="message success" role="status" data-testid="feedback-success">{message}</div>
    {/if}

    {#if error}
      <div class="message error" role="alert" data-testid="feedback-error">{error}</div>
    {/if}

    <section class="panel">
      <div class="section-heading">
        <div>
          <h2>Buscar registros</h2>
          <p>Usa cualquiera de las opciones disponibles para encontrar exactamente lo que necesitas.</p>
        </div>
        <div class="panel-actions">
          <button type="button" class="secondary" on:click={handleResetSearch} data-testid="reset-search">
            Limpiar filtros
          </button>
        </div>
      </div>

      <form class="grid-form" on:submit|preventDefault={handleSearch}>
        <label>
          <span>Busqueda libre</span>
          <input
            bind:value={searchForm.q}
            placeholder="Ejemplo: china o tokyo"
            data-testid="search-q"
          />
        </label>

        <label>
          <span>Ciudad exacta</span>
          <input
            bind:value={searchForm.city}
            placeholder="Ejemplo: shanghai"
            data-testid="search-city"
          />
        </label>

        <label>
          <span>Pais exacto</span>
          <input
            bind:value={searchForm.country}
            placeholder="Ejemplo: india"
            data-testid="search-country"
          />
        </label>

        <label>
          <span>Poblacion exacta</span>
          <input
            bind:value={searchForm.un_2025_population}
            type="number"
            min="1"
            step="1"
            placeholder="Ejemplo: 33412512"
            data-testid="search-population"
          />
        </label>

        <label>
          <span>Ordenar por</span>
          <select bind:value={searchForm.sort} data-testid="search-sort">
            {#each sortOptions as option}
              <option value={option.value}>{option.label}</option>
            {/each}
          </select>
        </label>

        <label>
          <span>Numero maximo de resultados</span>
          <input
            bind:value={searchForm.limit}
            type="number"
            min="0"
            step="1"
            placeholder="Ejemplo: 5"
            data-testid="search-limit"
          />
        </label>

        <label>
          <span>Posicion inicial</span>
          <input
            bind:value={searchForm.offset}
            type="number"
            min="0"
            step="1"
            placeholder="Ejemplo: 0"
            data-testid="search-offset"
          />
        </label>

        <div class="form-footer">
          <button type="submit" data-testid="apply-search">Aplicar busqueda</button>
        </div>
      </form>
    </section>

    <section class="panel">
      <div class="section-heading">
        <div>
          <h2>Crear nuevo registro</h2>
          <p>Introduce la ciudad, el pais y la poblacion estimada para anadir un nuevo dato.</p>
        </div>
        <div class="panel-actions">
          <button
            type="button"
            class="danger-soft"
            on:click={handleDeleteAll}
            data-testid="delete-all"
          >
            Borrar todos los registros
          </button>
        </div>
      </div>

      <form class="grid-form compact" on:submit|preventDefault={handleCreate}>
        <label>
          <span>Ciudad</span>
          <input
            bind:value={createForm.city}
            placeholder="Ejemplo: madrid"
            data-testid="create-city"
          />
        </label>

        <label>
          <span>Pais</span>
          <input
            bind:value={createForm.country}
            placeholder="Ejemplo: spain"
            data-testid="create-country"
          />
        </label>

        <label>
          <span>Poblacion estimada en 2025</span>
          <input
            bind:value={createForm.un_2025_population}
            type="number"
            min="1"
            step="1"
            placeholder="Ejemplo: 7000000"
            data-testid="create-population"
          />
        </label>

        <div class="form-footer">
          <button type="submit" data-testid="create-submit">Guardar registro</button>
        </div>
      </form>
    </section>

    <section class="panel">
      <div class="section-heading">
        <div>
          <h2>Listado actual</h2>
          <p>
            {#if hasQueryValues(activeQuery)}
              Estos son los resultados de la busqueda activa.
            {:else}
              Aqui tienes todos los registros disponibles en este momento.
            {/if}
          </p>
        </div>
      </div>

      {#if loading}
        <p class="state-text">Se estan cargando los datos...</p>
      {:else if citysStats.length === 0}
        <p class="state-text" data-testid="empty-state">
          No hay registros para mostrar con la seleccion actual.
        </p>
      {:else}
        <div class="table-wrapper">
          <table data-testid="citys-stats-table">
            <thead>
              <tr>
                <th>Ciudad</th>
                <th>Pais</th>
                <th>Poblacion estimada en 2025</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {#each citysStats as item}
                <tr data-testid={`row-${item.city}-${item.country}`}>
                  <td>{item.city}</td>
                  <td>{item.country}</td>
                  <td>{item.un_2025_population}</td>
                  <td class="row-actions">
                    <button
                      type="button"
                      class="secondary"
                      on:click={() => openEdit(item.city, item.country)}
                      data-testid={`edit-${item.city}-${item.country}`}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      class="danger"
                      on:click={() => handleDeleteOne(item.city, item.country)}
                      data-testid={`delete-${item.city}-${item.country}`}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </section>
  </div>
</div>

<style>
  :global(body) {
    margin: 0;
    font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
    background:
      radial-gradient(circle at top left, rgba(255, 224, 178, 0.65), transparent 30%),
      radial-gradient(circle at top right, rgba(186, 230, 253, 0.7), transparent 28%),
      linear-gradient(180deg, #fffaf0 0%, #f6f8fc 100%);
    color: #1f2937;
  }

  .page-shell {
    min-height: 100vh;
    padding: 24px 16px 48px;
    box-sizing: border-box;
  }

  .page {
    max-width: 1180px;
    margin: 0 auto;
  }

  .topbar {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
    margin-bottom: 20px;
  }

  .ghost-link,
  .ghost-button,
  button,
  select,
  input {
    font: inherit;
  }

  .ghost-link,
  .ghost-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    border-radius: 999px;
    border: 1px solid rgba(31, 41, 55, 0.12);
    background: rgba(255, 255, 255, 0.78);
    padding: 10px 16px;
    color: #1f2937;
    text-decoration: none;
    cursor: pointer;
    box-shadow: 0 12px 30px rgba(15, 23, 42, 0.06);
  }

  .hero {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 220px;
    gap: 20px;
    align-items: stretch;
    margin-bottom: 24px;
  }

  .eyebrow {
    margin: 0 0 8px;
    text-transform: uppercase;
    letter-spacing: 0.18em;
    color: #b45309;
    font-size: 0.8rem;
    font-weight: 700;
  }

  h1 {
    margin: 0;
    font-size: clamp(2rem, 4vw, 3.3rem);
    line-height: 1.05;
    color: #0f172a;
  }

  .subtitle {
    margin: 12px 0 0;
    max-width: 760px;
    color: #475569;
    font-size: 1.05rem;
  }

  .summary-card,
  .panel {
    border-radius: 24px;
    background: rgba(255, 255, 255, 0.86);
    border: 1px solid rgba(255, 255, 255, 0.75);
    box-shadow: 0 24px 60px rgba(15, 23, 42, 0.08);
    backdrop-filter: blur(12px);
  }

  .summary-card {
    padding: 20px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 8px;
    text-align: center;
  }

  .summary-card span {
    color: #64748b;
    font-size: 0.95rem;
  }

  .summary-card strong {
    font-size: 3rem;
    color: #0f172a;
    line-height: 1;
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

  .panel {
    padding: 24px;
    margin-bottom: 20px;
  }

  .section-heading {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
    margin-bottom: 18px;
  }

  .section-heading h2 {
    margin: 0 0 6px;
    color: #0f172a;
  }

  .section-heading p {
    margin: 0;
    color: #64748b;
  }

  .panel-actions {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    flex-wrap: wrap;
  }

  .grid-form {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 16px;
  }

  .grid-form.compact {
    align-items: end;
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

  input,
  select {
    border: 1px solid #d8dee9;
    border-radius: 16px;
    background: #ffffff;
    color: #0f172a;
    padding: 13px 14px;
    box-sizing: border-box;
  }

  input:focus,
  select:focus {
    outline: 2px solid rgba(14, 165, 233, 0.18);
    border-color: #38bdf8;
  }

  .form-footer {
    display: flex;
    align-items: end;
  }

  button {
    border: none;
    border-radius: 999px;
    background: linear-gradient(135deg, #0f766e 0%, #0ea5e9 100%);
    color: white;
    padding: 12px 18px;
    cursor: pointer;
    transition: transform 0.18s ease, box-shadow 0.18s ease;
    box-shadow: 0 14px 28px rgba(14, 116, 144, 0.18);
  }

  button:hover,
  .ghost-button:hover,
  .ghost-link:hover {
    transform: translateY(-1px);
  }

  button.secondary {
    background: #e2e8f0;
    color: #0f172a;
    box-shadow: none;
  }

  button.danger {
    background: linear-gradient(135deg, #dc2626 0%, #f97316 100%);
    box-shadow: 0 14px 28px rgba(220, 38, 38, 0.16);
  }

  button.danger-soft {
    background: #fff1f2;
    color: #b91c1c;
    box-shadow: none;
  }

  .state-text {
    margin: 0;
    color: #64748b;
  }

  .table-wrapper {
    overflow-x: auto;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    min-width: 720px;
  }

  th,
  td {
    padding: 14px 12px;
    border-bottom: 1px solid #e5e7eb;
    text-align: left;
  }

  th {
    color: #475569;
    font-size: 0.92rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  td {
    color: #0f172a;
  }

  .row-actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  @media (max-width: 900px) {
    .hero {
      grid-template-columns: 1fr;
    }

    .summary-card {
      text-align: left;
    }
  }

  @media (max-width: 640px) {
    .page-shell {
      padding-inline: 12px;
    }

    .panel {
      padding: 18px;
      border-radius: 20px;
    }

    .topbar,
    .section-heading,
    .row-actions,
    .panel-actions {
      flex-direction: column;
      align-items: stretch;
    }

    .form-footer {
      align-items: stretch;
    }

    button,
    .ghost-button,
    .ghost-link {
      width: 100%;
      box-sizing: border-box;
    }
  }
</style>
