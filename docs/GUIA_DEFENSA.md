# Guia de defensa y cambios rapidos

Esta guia esta pensada para la defensa: si el profesor pide explicar o modificar algo en directo, aqui tienes que tocar, por que se toca ahi y como comprobar que no has roto nada.

## 1. Mapa mental del proyecto

El proyecto tiene cuatro capas:

- `index.js`: arranque del servidor. Crea Express, abre las bases NeDB, registra las APIs y sirve el frontend compilado.
- `src/back/v1` y `src/back/v2`: backend REST. Aqui viven las rutas, validaciones, filtros, datos iniciales y codigos HTTP.
- `frontend-group/src/services`: funciones `fetch` que llaman al backend desde Svelte.
- `frontend-group/src/routes`: pantallas visibles: tablas, formularios, busquedas, graficas, mapa e integraciones.

Regla de oro en defensa:

- Si cambia una ruta HTTP, se toca backend y probablemente un service.
- Si cambia un campo de datos, se toca backend, service si construye payloads, formulario, tabla, edicion y tests.
- Si cambia solo el aspecto visual o un texto, se toca el componente Svelte correspondiente.
- Si cambia una grafica, se toca la pantalla de analytics y normalmente no la API.
- Si cambia un test, se toca `tests/...`, pero antes revisa si el fallo viene del codigo.

## 2. Comandos que hay que saberse

Instalar dependencias:

```bash
npm install
npm --prefix frontend-group install
```

Arrancar backend y frontend compilado:

```bash
npm run build
npm start
```

Abrir:

```text
http://localhost:10000
```

Desarrollo frontend con Vite:

```bash
npm run dev-front
```

Tests de API:

```bash
npm run test-ALG
npm run test-LCC
npm run test-LCC-v2
npm run test-RMP
```

Tests generales de API:

```bash
npm test
```

Tests E2E de LCC:

```bash
npm run test-LCC-e2e
```

En Windows, si PowerShell bloquea `npm`, usa `npm.cmd`:

```bash
npm.cmd run build
npm.cmd start
```

## 3. Donde esta cada cosa importante

Servidor y bases de datos:

- `index.js`: cambia aqui el puerto, el servidor Express, CORS, `express.json`, las bases NeDB y las rutas directas que devuelven `index.html`.
- `naturalDisastersDb` en `index.js`: base de datos de desastres.
- `citysStatsDb` en `index.js`: base de datos de ciudades.
- `wineStatsDb` en `index.js`: base de datos de vinos.

APIs de desastres:

- `src/back/v1/natural-disasters.js`: CRUD v1, filtros exactos, validacion, carga inicial y codigos HTTP.
- `src/back/v2/natural-disasters.js`: CRUD v2, pais parcial, rango `from`/`to`, validacion, carga inicial y codigos HTTP.

APIs de ciudades:

- `src/back/v1/citys-stats.js`: CRUD v1, filtros, agregados por pais, proxies e integraciones con Open-Meteo, REST Countries, World Bank y APIs SOS externas.
- `src/back/v2/citys-stats.js`: CRUD v2, busqueda libre `q`, ordenacion `sort`, paginacion, validacion y carga inicial.

API de vinos:

- `src/back/v1/wine-stats.js`: CRUD v1, ids automaticos, filtros de texto, filtros numericos, validacion y carga inicial.

Rutas y navegacion frontend:

- `frontend-group/src/App.svelte`: registra las rutas Svelte y las rutas directas.
- `frontend-group/src/components/Navbar.svelte`: cambia aqui el menu superior.
- `frontend-group/src/routes/Home.svelte`: cambia aqui portada, miembros, links de APIs y links de documentacion.

Services frontend:

- `frontend-group/src/services/citysStatsApi.js`: llamadas CRUD a `/api/v2/citys-stats`.
- `frontend-group/src/services/citysStatsIntegrations.js`: llamadas a `/api/v1/citys-stats/integrations`.
- `frontend-group/src/services/natural-disasters.js`: llamadas a `/api/v2/natural-disasters`.
- `frontend-group/src/services/wine-stats.js`: llamadas a `/api/v1/wine-stats`.

Pantallas frontend:

- `frontend-group/src/routes/CitysStats.svelte`: listar, crear, buscar y borrar ciudades.
- `frontend-group/src/routes/EditCitysStats.svelte`: cargar y actualizar una ciudad.
- `frontend-group/src/routes/NaturalDisastersStats.svelte`: listar, crear, buscar y borrar desastres.
- `frontend-group/src/routes/EditNaturalDisasters.svelte`: cargar y actualizar un desastre.
- `frontend-group/src/routes/WineStats.svelte`: listar, crear, buscar y borrar vinos.
- `frontend-group/src/routes/EditWineStats.svelte`: cargar y actualizar un vino.

Analytics e integraciones:

- `frontend-group/src/routes/GroupAnalytics.svelte`: grafica conjunta de las tres APIs.
- `frontend-group/src/routes/CitysStatsAnalytics.svelte`: grafica de ciudades.
- `frontend-group/src/routes/CitysStatsMapAnalytics.svelte`: mapa de ciudades.
- `frontend-group/src/routes/CitysStatsIntegrations.svelte`: pantalla de integraciones externas.

Build:

- `frontend-group/vite.config.js`: configura que el build del frontend vaya a `../public`.

## 4. Recursos, campos e identificadores

### `natural-disasters`

Campos:

```json
{
  "country": "spain",
  "year": 2024,
  "death_count": 220,
  "injured_count": 500,
  "economic_damage_usd": 30000
}
```

Identificador del recurso: `country` + `year`.

Rutas principales:

- `GET /api/v1/natural-disasters`
- `GET /api/v2/natural-disasters`
- `GET /api/v2/natural-disasters?country=spa`
- `GET /api/v2/natural-disasters?from=2000&to=2024`
- `GET /api/v2/natural-disasters/:country/:year`
- `POST /api/v2/natural-disasters`
- `PUT /api/v2/natural-disasters/:country/:year`
- `DELETE /api/v2/natural-disasters/:country/:year`
- `DELETE /api/v2/natural-disasters`

Defensa rapida:

> Desastres usa `country` y `year` como clave compuesta. La v1 filtra de forma exacta; la v2 mejora la busqueda con pais parcial y rangos de anio.

### `citys-stats`

Campos:

```json
{
  "city": "tokyo",
  "country": "japan",
  "un_2025_population": 33412512
}
```

Identificador del recurso: `city` + `country`.

Rutas principales:

- `GET /api/v1/citys-stats`
- `GET /api/v2/citys-stats`
- `GET /api/v2/citys-stats?q=seo`
- `GET /api/v2/citys-stats?sort=-un_2025_population&limit=1`
- `GET /api/v2/citys-stats/:city/:country`
- `POST /api/v2/citys-stats`
- `PUT /api/v2/citys-stats/:city/:country`
- `DELETE /api/v2/citys-stats/:city/:country`
- `DELETE /api/v2/citys-stats`

Integraciones externas en v1:

- `GET /api/v1/citys-stats/top-cities`
- `GET /api/v1/citys-stats/country-summaries`
- `GET /api/v1/citys-stats/integrations/geocoding/:city`
- `GET /api/v1/citys-stats/integrations/country/:country`
- `GET /api/v1/citys-stats/integrations/world-bank/:countryCode`
- `GET /api/v1/citys-stats/integrations/sos-tourist-arrivals`
- `GET /api/v1/citys-stats/integrations/sos-earthquakes`
- `GET /api/v1/citys-stats/integrations/sos-fifa-squad-values`
- `GET /api/v1/citys-stats/integrations/summary`

Defensa rapida:

> Ciudades usa `city` y `country` como clave compuesta. La v2 es la API principal del frontend porque incluye busqueda libre con `q`, ordenacion con `sort` y paginacion. La v1 se conserva porque ahi estan las integraciones externas, ahora agregadas por pais para cruzar mejor los datos.

### `wine-stats`

Campos para crear o actualizar:

```json
{
  "title": "The Guv'nor, Spain",
  "country": "spain",
  "region": "",
  "year": 2026,
  "price": 9.99,
  "abv": 14,
  "unit": 105,
  "grape": "Tempranillo",
  "type": "Red",
  "capacity": 75
}
```

Campo generado por backend:

```json
{
  "id": 1
}
```

Identificador del recurso: `id`.

Rutas principales:

- `GET /api/v1/wine-stats`
- `GET /api/v1/wine-stats?country=spain`
- `GET /api/v1/wine-stats?year=2026`
- `GET /api/v1/wine-stats/:id`
- `POST /api/v1/wine-stats`
- `PUT /api/v1/wine-stats/:id`
- `DELETE /api/v1/wine-stats/:id`
- `DELETE /api/v1/wine-stats`

Defensa rapida:

> Vinos usa un `id` numerico generado en backend. Para evitar duplicados comprueba `title` y `year`. El cliente no decide el id al crear.

## 5. Cambios que pueden pedir y como hacerlos

### Cambio: "Anade un nuevo campo a un recurso"

Ejemplo: anadir `continent` a `citys-stats`.

Toca:

- Backend: `src/back/v2/citys-stats.js` y, si afecta a integraciones, `src/back/v1/citys-stats.js`.
- Datos iniciales: array `initialData`.
- Validacion: `hasExactCityFields` y `normalizeCityStat`.
- Frontend service: normalmente no hay que cambiarlo si recibe objetos completos, pero revisa `citysStatsApi.js`.
- Pantalla de listado/creacion: `CitysStats.svelte`.
- Pantalla de edicion: `EditCitysStats.svelte`.
- Tests: `tests/LCC/pruebas-lcc*.json` y `tests/LCC/e2e/citys-stats.spec.js`.

Pasos:

1. Anadir el campo en `expected` dentro de `hasExactCityFields`.
2. Leerlo, limpiarlo y validarlo en `normalizeCityStat`.
3. Incluirlo en todos los objetos de `initialData`.
4. Anadir input en el formulario de crear.
5. Anadir input en el formulario de editar.
6. Anadir columna en la tabla.
7. Ajustar tests que crean o actualizan registros.

Frase de defensa:

> Como la API exige estructura exacta, no basta con pintar un input. Hay que aceptar el campo en la validacion, guardarlo normalizado, mostrarlo en Svelte y actualizar los tests.

### Cambio: "Cambia un campo de nombre"

Ejemplo: `un_2025_population` pasa a `population_2025`.

Toca:

- Backend: `src/back/v1/citys-stats.js`, `src/back/v2/citys-stats.js`.
- Frontend: todos los componentes que imprimen o leen `un_2025_population`.
- Analytics: `CitysStatsAnalytics.svelte`, `CitysStatsMapAnalytics.svelte`, `GroupAnalytics.svelte`.
- Tests: Postman/Newman y Playwright.

Busqueda recomendada:

```bash
rg "un_2025_population"
```

Pasos:

1. Cambiar nombre en datos iniciales.
2. Cambiar validacion y normalizacion.
3. Cambiar filtros de query.
4. Cambiar formularios y tablas.
5. Cambiar graficas que suman ese campo.
6. Cambiar tests.

Riesgo:

- Es un cambio de contrato de API. Si lo cambias en backend pero no en frontend, la tabla queda vacia o aparecen valores `undefined`.

### Cambio: "Permite campos opcionales"

Ahora varias APIs exigen estructura exacta. Si piden permitir un campo opcional:

Toca:

- `hasExactCityFields`, `hasExactWineFields` o `hasValidDisasterBody`.
- `normalizeCityStat`, `normalizeWineStat` o validacion equivalente.

Idea:

- Mantener campos obligatorios en un array.
- Permitir que el body tenga obligatorios mas opcionales.
- No rechazar por `keys.length === expected.length`.

Ejemplo conceptual:

```js
const required = ["city", "country", "un_2025_population"];
const optional = ["continent"];
const allowed = [...required, ...optional];
const keysAreAllowed = keys.every((key) => allowed.includes(key));
const requiredArePresent = required.every((field) => keys.includes(field));
```

Frase de defensa:

> Ahora el proyecto valida con estructura exacta para cumplir la practica. Si queremos campos opcionales, separo campos obligatorios y campos permitidos.

### Cambio: "Anade un filtro nuevo"

Ejemplo: filtrar vinos por precio maximo `max_price`.

Toca:

- Backend: `src/back/v1/wine-stats.js`.
- Frontend: `WineStats.svelte` si el buscador debe tener input.
- Tests: `tests/RMP/pruebas-rmp.json`.

Pasos:

1. En backend, localizar `applyNumberFilters` o la ruta `app.get(BASE_API_URL, ...)`.
2. Leer `request.query.max_price`.
3. Convertirlo con `Number`.
4. Si no es numero, devolver `400`.
5. Filtrar con `item.price <= maxPrice`.
6. En frontend, anadir campo en `filtros`.
7. En `buscarVinos`, anadirlo a `URLSearchParams`.

Frase de defensa:

> Los query params llegan como texto, por eso siempre convierto y valido antes de filtrar.

### Cambio: "Anade busqueda parcial"

Ejemplo: buscar vinos cuyo titulo contenga una palabra.

Toca:

- Backend: `src/back/v1/wine-stats.js`.
- Funcion: `applyTextFilters`.

Cambio:

- Pasar de igualdad exacta:

```js
String(item[field]).toLowerCase() === requestedText
```

- A busqueda parcial:

```js
String(item[field]).toLowerCase().includes(requestedText)
```

Riesgo:

- Si los tests esperan una coincidencia exacta, habra que ajustarlos.

### Cambio: "Anade ordenacion"

Ya existe en `citys-stats` v2 con `sort`.

Toca si es para ciudades:

- `src/back/v2/citys-stats.js`, bloque `if (req.query.sort !== undefined)`.

Toca si es para otro recurso:

- Implementar el mismo patron en su `GET BASE_API_URL`.

Patron:

- `sort=campo` ordena ascendente.
- `sort=-campo` ordena descendente.
- Validar con una lista `allowedFields`.
- Si el campo no esta permitido, devolver `400`.

Frase de defensa:

> No dejo ordenar por cualquier campo enviado por URL; uso una lista blanca para evitar comportamientos raros.

### Cambio: "Anade paginacion"

Ya existe en los tres recursos.

Donde:

- Desastres: `getPagination` en `natural-disasters`.
- Ciudades: bloque `offset` y `limit` en `citys-stats`.
- Vinos: `readPagination` en `wine-stats`.

Si piden cambiar el limite por defecto:

- Desastres: cambiar `const limit = parseInt(queryParams.limit) || 100`.
- Ciudades: cambiar el valor inicial `limit = result.length`.
- Vinos: cambiar el segundo argumento de `readPagination(request.query, ...)`.

### Cambio: "Cambia un codigo HTTP"

Ejemplos:

- `DELETE` devuelve `204` en ciudades y vinos.
- Algunos `DELETE` de desastres devuelven `200`.
- `POST` correcto suele devolver `201`.
- Recurso duplicado devuelve `409`.
- Body incorrecto devuelve `400`.
- Recurso inexistente devuelve `404`.
- Metodo no permitido devuelve `405`.

Toca:

- Backend correspondiente.
- Tests Postman/Newman.
- Puede tocar servicios frontend si dependen de un status concreto.

Frase de defensa:

> El codigo HTTP forma parte del contrato. Si lo cambio, actualizo los tests porque ellos documentan el comportamiento esperado.

### Cambio: "Cambia datos iniciales"

Toca:

- `initialData` del recurso.

Archivos:

- `src/back/v1/natural-disasters.js`
- `src/back/v2/natural-disasters.js`
- `src/back/v1/citys-stats.js`
- `src/back/v2/citys-stats.js`
- `src/back/v1/wine-stats.js`

Pasos:

1. Cambiar o anadir objetos en `initialData`.
2. Respetar la estructura exacta del recurso.
3. Si la base local ya tiene datos, ejecutar `DELETE` sobre la coleccion antes de `loadInitialData`.
4. Revisar tests que esperan un numero exacto de elementos.

Comprobacion:

```bash
curl http://localhost:10000/api/v2/citys-stats/loadInitialData
curl http://localhost:10000/api/v2/citys-stats
```

En Windows PowerShell, si `curl` se comporta raro, usa:

```bash
Invoke-RestMethod http://localhost:10000/api/v2/citys-stats
```

### Cambio: "Anade una nueva ruta al backend"

Ejemplo: `/api/v2/citys-stats/count`.

Toca:

- Archivo de API del recurso.
- Service frontend si la ruta se usa desde Svelte.
- Tests.

Muy importante:

- En Express, las rutas especificas deben ir antes de las rutas con parametros.
- Por ejemplo, `/top-cities` debe estar antes de `/:city/:country`.
- Si pones `/count` despues de `/:city/:country`, Express puede interpretarlo como parametro.

Pasos:

1. Anadir `app.get(`${BASE_API_URL}/count`, ...)` antes de rutas tipo `/:id` o `/:city/:country`.
2. Leer datos con `db.count` o `db.find`.
3. Responder JSON claro, por ejemplo `{ count: 12 }`.
4. Crear funcion en service si hace falta.
5. Pintarlo en componente.

Frase de defensa:

> En Express importa el orden: primero rutas concretas y luego rutas parametrizadas.

### Cambio: "Crea una v3"

Toca:

- Crear `src/back/v3/recurso.js`.
- Registrar el modulo en `index.js`.
- Crear tests nuevos o duplicar/adaptar los de v2.
- Cambiar service frontend solo si quieres que la interfaz consuma v3.

Pasos:

1. Copiar el archivo v2 del recurso como base.
2. Cambiar `BASE_API_URL` a `/api/v3/...`.
3. Implementar solo las mejoras nuevas.
4. En `index.js`, hacer `require("./src/back/v3/recurso")` y llamarlo con `app` y `db`.
5. Anadir link en `Home.svelte` si debe aparecer en portada.

Frase de defensa:

> Una version nueva no rompe la anterior. Mantengo v1/v2 funcionando y registro v3 como contrato adicional.

### Cambio: "Cambia el frontend para usar v1 en vez de v2"

Toca:

- `frontend-group/src/services/citysStatsApi.js`
- `frontend-group/src/services/natural-disasters.js`

Cambiar:

```js
"/api/v2/citys-stats"
```

por:

```js
"/api/v1/citys-stats"
```

Riesgo:

- Pierdes funciones propias de v2, como `q` y `sort` en ciudades o rango `from`/`to` en desastres.
- Si la pantalla envia parametros que v1 no entiende, no funcionara igual.

### Cambio: "Anade una pagina nueva"

Toca:

- Crear componente en `frontend-group/src/routes/NuevaPagina.svelte`.
- Importarlo en `frontend-group/src/App.svelte`.
- Anadirlo al objeto `routes`.
- Si quieres enlace visible, tocar `Navbar.svelte`.
- Si quieres ruta directa sin `#/`, anadirla en `directRoutes` y tambien en `index.js`.

Pasos:

1. Crear el componente Svelte.
2. En `App.svelte`, importar el componente.
3. Anadir `"/nueva-ruta": NuevaPagina`.
4. En `Navbar.svelte`, anadir `<a href="/#/nueva-ruta">Texto</a>`.
5. Si es ruta directa `/nueva-ruta`, anadir `app.get("/nueva-ruta", ...)` en `index.js`.

Frase de defensa:

> Como usamos `svelte-spa-router`, las rutas normales van con `#/`. Las rutas directas necesitan que Express devuelva `index.html`.

### Cambio: "Modifica el menu"

Toca:

- `frontend-group/src/components/Navbar.svelte`.

Ejemplos:

- Cambiar texto de un enlace.
- Cambiar orden.
- Anadir ruta.
- Quitar una ruta.

Si el enlace apunta a pagina Svelte:

- Usar `/#/ruta`.

Si el enlace apunta a ruta directa servida por Express:

- Usar `/analytics` o `/integrations/citys-stats`.

### Cambio: "Modifica la portada"

Toca:

- `frontend-group/src/routes/Home.svelte`.

Que se cambia ahi:

- Nombre del grupo.
- Descripcion.
- Miembros.
- Enlaces a API v1/v2.
- Enlaces a documentacion.
- Test ids que usa Playwright.

Riesgo:

- Los tests de LCC comprueban textos y `data-testid`, asi que no cambies ids sin actualizar `tests/LCC/e2e/citys-stats.spec.js`.

### Cambio: "Cambia una tabla"

Toca:

- Ciudades: `CitysStats.svelte`.
- Desastres: `NaturalDisastersStats.svelte`.
- Vinos: `WineStats.svelte`.

Pasos:

1. Buscar el `<table>`.
2. Cambiar cabeceras `<th>`.
3. Cambiar filas dentro de `{#each ...}`.
4. Si anades boton, crear funcion en `<script>`.
5. Si el boton llama API, anadir o usar service.

### Cambio: "Cambia un formulario"

Toca:

- Crear ciudad: `CitysStats.svelte`.
- Editar ciudad: `EditCitysStats.svelte`.
- Crear desastre: `NaturalDisastersStats.svelte`.
- Editar desastre: `EditNaturalDisasters.svelte`.
- Crear vino: `WineStats.svelte`.
- Editar vino: `EditWineStats.svelte`.

Pasos:

1. Anadir variable en el objeto de formulario.
2. Anadir input en HTML.
3. Validar antes de enviar.
4. Incluir el campo en el payload enviado al service.
5. Revisar backend para aceptar ese campo.

### Cambio: "Cambia mensajes de error o exito"

Toca:

- Ciudades service: `frontend-group/src/services/citysStatsApi.js`, funcion `friendlyApiMessage`.
- Ciudades pantalla: `CitysStats.svelte`.
- Desastres service: `frontend-group/src/services/natural-disasters.js`.
- Desastres pantalla: `NaturalDisastersStats.svelte`.
- Vinos service: `frontend-group/src/services/wine-stats.js`.
- Vinos pantalla: `WineStats.svelte`.

Riesgo:

- Si Playwright comprueba texto exacto o parcial, actualiza tests.

### Cambio: "Cambia una grafica Highcharts"

Toca:

- Analytics grupo: `GroupAnalytics.svelte`.
- Analytics ciudades: `CitysStatsAnalytics.svelte`.
- Mapa: `CitysStatsMapAnalytics.svelte`.
- Integraciones con grafica: `CitysStatsIntegrations.svelte`.

Patron:

- `loadAnalytics` o `loadMapData` carga datos.
- `buildMetrics` o calculos reactivos transforman datos.
- `renderChart` o `renderMap` configura Highcharts.
- `onDestroy` destruye la grafica al salir.

Cambios comunes:

- Tipo de grafica: cambiar `chart.type`.
- Titulo: cambiar `title.text`.
- Series: cambiar `series`.
- Tooltip: cambiar `tooltip.formatter`.
- Datos: cambiar el array que se pasa a `series`.

Frase de defensa:

> Highcharts solo pinta datos. La informacion sale de nuestras APIs y se transforma antes de crear la serie.

### Cambio: "Anade una ciudad al mapa"

Toca:

- `frontend-group/src/routes/CitysStatsMapAnalytics.svelte`
- Objeto `coordinates`.

Pasos:

1. Anadir clave con formato `city-country`.
2. Incluir `lat` y `lon`.
3. Asegurarte de que coincide con los datos normalizados en minusculas.

Ejemplo:

```js
"madrid-spain": { lat: 40.4168, lon: -3.7038 }
```

Si no aparece:

- Comprobar que la API devuelve `city: "madrid"` y `country: "spain"`.
- Comprobar que `keyFor(item)` genera la misma clave.

### Cambio: "Cambia una integracion externa"

Toca:

- Backend: `src/back/v1/citys-stats.js`.
- Frontend service: `frontend-group/src/services/citysStatsIntegrations.js`.
- Pantalla: `CitysStatsIntegrations.svelte`.

Funciones backend:

- `getGeocoding`: Open-Meteo.
- `getCountryInfo`: REST Countries.
- `getWorldBankPopulation`: World Bank.
- `getTouristArrivals`: API SOS2526-25 de llegadas turisticas.
- `getEarthquakes`: API SOS2526-19 de terremotos.
- `getFifaSquadValues`: API SOS2526-26 de valor de plantillas FIFA.
- `buildCityCountrySummaries`: agrega `citys-stats` por pais.
- `buildIntegratedCityBase`: lanza llamadas externas.
- `buildIntegratedCity`: une datos locales agregados por pais con datos externos.
- `safeExternal`: captura errores para que una API externa no hunda todo.

Frase de defensa:

> Las integraciones se llaman desde el backend, no desde el navegador. Asi controlamos errores, timeout y formato antes de devolverlo al frontend. En D03 las cruzo por pais porque da mas coincidencias reales que por ciudad.

### Cambio: "El profesor pide borrar la base o recargar datos"

Desde navegador:

- Entrar en la pantalla del recurso.
- Usar boton de borrar todos.
- Usar boton de cargar iniciales.

Desde API:

```bash
Invoke-RestMethod -Method Delete http://localhost:10000/api/v2/citys-stats
Invoke-RestMethod http://localhost:10000/api/v2/citys-stats/loadInitialData
```

O para desastres:

```bash
Invoke-RestMethod -Method Delete http://localhost:10000/api/v2/natural-disasters
Invoke-RestMethod http://localhost:10000/api/v2/natural-disasters/loadInitialData
```

O para vinos:

```bash
Invoke-RestMethod -Method Delete http://localhost:10000/api/v1/wine-stats
Invoke-RestMethod http://localhost:10000/api/v1/wine-stats/loadInitialData
```

## 6. Que hacer si algo falla en directo

### Falla `npm start`

Comprueba:

- Que estas en la raiz del proyecto.
- Que ejecutaste `npm install`.
- Que el puerto `10000` no esta ocupado.
- Que no hay un error de sintaxis en el ultimo archivo modificado.

Comando:

```bash
npm.cmd start
```

### La web abre pero se ve antigua

Causa:

- Cambiaste frontend en `frontend-group/src`, pero `npm start` sirve `public`, que es el build compilado.

Solucion:

```bash
npm run build
npm start
```

### Una API devuelve `400`

Significa normalmente:

- Body incompleto.
- Campo extra no permitido.
- Campo numerico que llega como texto no convertible.
- URL y body no coinciden en PUT.

Mira:

- `normalize...`
- `hasExact...`
- `hasValid...`

### Una API devuelve `409`

Significa duplicado.

Donde se comprueba:

- Desastres: duplicado por `country` + `year`.
- Ciudades: duplicado por `city` + `country`.
- Vinos: duplicado por `title` + `year`.

### Una API devuelve `404`

Significa que no existe el recurso concreto.

Mira:

- Si estas usando el identificador correcto.
- Si el texto esta normalizado en minusculas.
- Si el dato fue borrado antes en un test.

### Una API devuelve `405`

Significa metodo no permitido.

Ejemplos:

- `POST /api/v2/citys-stats/tokyo/japan`
- `PUT /api/v2/citys-stats`

Frase de defensa:

> El 405 no es fallo, es una decision REST: no permitimos crear en la URL de un recurso concreto ni actualizar toda la coleccion con PUT.

### Una integracion externa falla

Puede pasar por red, timeout o API externa.

Donde mirar:

- `fetchJson` en `src/back/v1/citys-stats.js`.
- `safeExternal` para errores parciales.
- `integrationErrors` en la respuesta del summary.

Frase de defensa:

> Si una API externa falla, devolvemos el error controlado en `integrationErrors` y mantenemos los datos locales.

## 7. Como explicar el flujo completo

Ejemplo con crear ciudad:

1. El usuario rellena el formulario en `CitysStats.svelte`.
2. `handleCreate` valida el formulario.
3. `createCityStat` en `citysStatsApi.js` hace `POST /api/v2/citys-stats`.
4. Express recibe la peticion en `src/back/v2/citys-stats.js`.
5. `normalizeCityStat` limpia ciudad y pais, y convierte poblacion a numero.
6. El backend comprueba duplicados con `db.findOne`.
7. Si no existe, guarda con `db.insert`.
8. La API responde `201`.
9. El frontend muestra mensaje de exito y recarga la tabla.

Ejemplo con editar:

1. La tabla navega a `/#/citys-stats/editar/:city/:country`.
2. `App.svelte` carga `EditCitysStats.svelte`.
3. `onMount` llama `getOneCityStat`.
4. El usuario cambia datos y pulsa guardar.
5. `updateCityStat` hace `PUT /api/v2/citys-stats/:city/:country`.
6. El backend comprueba que URL y body coinciden.
7. NeDB actualiza el documento.
8. El frontend muestra confirmacion.

Ejemplo con analytics:

1. `GroupAnalytics.svelte` se monta.
2. Llama en paralelo a ciudades, desastres y vinos con `Promise.all`.
3. `buildMetrics` calcula registros e indicadores.
4. `renderChart` crea una grafica Highcharts.
5. `onDestroy` destruye la grafica al cambiar de pantalla.

## 8. Como responder preguntas tipicas del profesor

### "Por que usais NeDB?"

Respuesta:

> Porque para esta practica necesitamos persistencia sencilla en archivos locales. NeDB nos permite guardar documentos JSON sin montar un servidor de base de datos externo. Cada recurso tiene su propio `.db`, asi evitamos mezclar dominios.

### "Por que quitais `_id`?"

Respuesta:

> `_id` es un campo interno de NeDB. La API publica no debe depender de detalles de la base de datos, por eso usamos `removeDatabaseId` antes de responder.

### "Por que hay v1 y v2?"

Respuesta:

> La v1 mantiene el contrato inicial. La v2 anade mejoras sin romper a clientes que usen v1. Por ejemplo, `citys-stats` v2 tiene `q` y `sort`; `natural-disasters` v2 tiene pais parcial y rango de anios.

### "Por que algunas rutas usan v1 en frontend?"

Respuesta:

> El CRUD principal de ciudades usa v2, pero las integraciones estan implementadas en v1. Por eso `citysStatsIntegrations.js` apunta a `/api/v1/citys-stats`.

### "Por que `citys-stats` esta escrito asi?"

Respuesta:

> Es el nombre del recurso usado en la practica y en los tests. Aunque en ingles correcto seria `cities`, cambiarlo romperia URLs, tests y contratos ya publicados.

### "Por que usais claves compuestas en algunos recursos?"

Respuesta:

> Porque no todos los datasets tienen un id natural. En desastres, `country` + `year` identifica un registro. En ciudades, `city` + `country` identifica una ciudad. En vinos si generamos `id` porque puede haber nombres repetidos o mas atributos.

### "Que pasa si mando un campo de mas?"

Respuesta:

> En general se devuelve `400`, porque las validaciones exigen estructura exacta. Esto evita guardar datos inesperados y hace que el contrato de la API sea claro.

### "Que hace CORS?"

Respuesta:

> Permite que el frontend en desarrollo, por ejemplo Vite en otro puerto, pueda llamar al backend de Express sin bloqueo del navegador.

### "Como se despliega el frontend?"

Respuesta:

> El frontend Svelte se compila con Vite. El build acaba en `public`, y Express sirve esa carpeta con `express.static`.

### "Por que algunas rutas directas estan tambien en `index.js`?"

Respuesta:

> Porque al abrir `/analytics` directamente, el navegador pide esa URL al servidor. Express debe devolver `public/index.html` para que Svelte cargue la pantalla correspondiente.

### "Como se protegen las llamadas externas?"

Respuesta:

> `fetchJson` usa timeout, valida JSON y transforma errores. `safeExternal` evita que un fallo de una API externa rompa todo el resumen integrado.

## 9. Checklist antes de defender

- Ejecutar `npm run build`.
- Ejecutar `npm start`.
- Probar `http://localhost:10000`.
- Abrir `/api/v2/citys-stats`.
- Abrir `/api/v2/natural-disasters`.
- Abrir `/api/v1/wine-stats`.
- Cargar datos iniciales si una tabla esta vacia.
- Probar crear, editar y borrar al menos un registro.
- Abrir `/#/analytics`.
- Abrir `/analytics/citys-stats`.
- Abrir `/analytics/citys-stats/map`.
- Abrir `/integrations/citys-stats`.
- Ejecutar los tests del recurso que vayas a tocar.

## 10. Checklist despues de cualquier cambio

- Si tocaste backend, reinicia `npm start`.
- Si tocaste frontend y usas `npm start`, ejecuta `npm run build`.
- Si tocaste una API, prueba la ruta con navegador, Postman o `Invoke-RestMethod`.
- Si tocaste campos, busca el nombre antiguo con `rg`.
- Si tocaste rutas, revisa `App.svelte`, `Navbar.svelte` e `index.js`.
- Si tocaste textos que aparecen en tests, revisa Playwright.
- Si tocaste un recurso concreto, ejecuta su test Newman.

## 11. Mini chuleta de decision

Esta chuleta se lee asi: identifica lo que pide el profesor, abre el archivo exacto, toca la funcion concreta y comprueba el resultado antes de pasar a otra cosa.

### Si dice "cambia el puerto"

1. Abre `index.js`.
2. Busca `const port = process.env.PORT || 10000`.
3. Cambia `10000` por el puerto pedido.
4. Arranca con `npm start`.
5. Comprueba el puerto que aparece en consola.

### Si dice "cambia donde se guarda la base"

1. Abre `index.js`.
2. Para desastres, busca `naturalDisastersDb`.
3. Para ciudades, busca `citysStatsDb`.
4. Para vinos, busca `wineStatsDb`.
5. Cambia la propiedad `filename`.
6. Arranca el servidor y comprueba que se crea o usa el `.db` correcto.

### Si dice "cambia los datos iniciales"

Desastres:

1. Abre `src/back/v1/natural-disasters.js`.
2. Cambia `initialData`.
3. Repite el cambio en `src/back/v2/natural-disasters.js`.
4. Borra datos con `DELETE /api/v2/natural-disasters`.
5. Carga datos con `/api/v2/natural-disasters/loadInitialData`.

Ciudades:

1. Abre `src/back/v1/citys-stats.js`.
2. Cambia `initialData`.
3. Repite el cambio en `src/back/v2/citys-stats.js`.
4. Borra datos con `DELETE /api/v2/citys-stats`.
5. Carga datos con `/api/v2/citys-stats/loadInitialData`.

Vinos:

1. Abre `src/back/v1/wine-stats.js`.
2. Cambia `initialData`.
3. Recuerda que el `id` lo anade el backend al cargar.
4. Borra datos con `DELETE /api/v1/wine-stats`.
5. Carga datos con `/api/v1/wine-stats/loadInitialData`.

### Si dice "cambia validaciones"

Desastres:

1. Abre `src/back/v1/natural-disasters.js` y `src/back/v2/natural-disasters.js`.
2. Cambia `REQUIRED_FIELDS` si cambia la lista de campos.
3. Cambia `hasValidDisasterBody` si cambia lo que se acepta en el body.
4. Cambia `buildSearchQuery` si cambia una query.
5. Prueba un `POST` correcto y un `POST` incorrecto.

Ciudades:

1. Abre `src/back/v1/citys-stats.js` y `src/back/v2/citys-stats.js`.
2. Cambia `hasExactCityFields` si cambia la estructura.
3. Cambia `normalizeCityStat` si cambia limpieza o conversion.
4. Prueba crear una ciudad valida y otra invalida.

Vinos:

1. Abre `src/back/v1/wine-stats.js`.
2. Cambia `EXPECTED_FIELDS` si cambia la lista de campos.
3. Cambia `hasExactWineFields` si cambia la estructura.
4. Cambia `normalizeWineStat` si cambia limpieza o conversion.
5. Prueba crear un vino valido y otro incorrecto.

### Si dice "anade un campo"

Desastres:

1. Backend: toca `src/back/v1/natural-disasters.js` y `src/back/v2/natural-disasters.js`.
2. Anade el campo a `REQUIRED_FIELDS`.
3. Anade el campo a `initialData`.
4. Ajusta `hasValidDisasterBody`.
5. Si se filtra, ajusta `buildSearchQuery`.
6. Frontend: toca `NaturalDisastersStats.svelte` para crear/listar.
7. Toca `EditNaturalDisasters.svelte` para editar.
8. Revisa `natural-disasters.js`.
9. Actualiza `tests/ALG`.
10. Comprueba con `npm run test-ALG`.

Ciudades:

1. Backend: toca `src/back/v1/citys-stats.js` y `src/back/v2/citys-stats.js`.
2. Anade el campo a `hasExactCityFields`.
3. Limpialo en `normalizeCityStat`.
4. Anade el campo a `initialData`.
5. Si afecta a integraciones, revisa `buildIntegratedCity`.
6. Frontend: toca `CitysStats.svelte`.
7. Toca `EditCitysStats.svelte`.
8. Revisa `citysStatsApi.js`.
9. Actualiza `tests/LCC`.
10. Comprueba con `npm run test-LCC-v2` y `npm run test-LCC-e2e`.

Vinos:

1. Backend: toca `src/back/v1/wine-stats.js`.
2. Anade el campo a `EXPECTED_FIELDS`.
3. Limpialo en `normalizeWineStat`.
4. Anade el campo a `initialData`.
5. Si se filtra, anadelo a `TEXT_FILTER_FIELDS` o `NUMBER_FILTER_FIELDS`.
6. Frontend: toca `WineStats.svelte`.
7. Toca `EditWineStats.svelte`.
8. Revisa `wine-stats.js`.
9. Actualiza `tests/RMP`.
10. Comprueba con `npm run test-RMP`.

### Si dice "renombra un campo"

1. Ejecuta `rg "nombre_antiguo"`.
2. Cambia el backend del recurso.
3. Cambia `initialData`.
4. Cambia validaciones.
5. Cambia normalizacion.
6. Cambia services.
7. Cambia pantallas.
8. Cambia analytics si usan ese campo.
9. Cambia tests.
10. Ejecuta otra vez `rg "nombre_antiguo"` para confirmar que no quedan usos reales.

### Si dice "anade filtro"

Desastres:

1. Abre `src/back/v2/natural-disasters.js`.
2. Toca `buildSearchQuery`.
3. Abre `NaturalDisastersStats.svelte`.
4. Anade input y query string en `buscar`.
5. Revisa `natural-disasters.js` si hace falta.
6. Prueba `/api/v2/natural-disasters?filtro=valor`.

Ciudades:

1. Abre `src/back/v2/citys-stats.js`.
2. Toca el `GET BASE_API_URL`.
3. Abre `CitysStats.svelte`.
4. Anade campo a `emptySearchForm`.
5. Anade input.
6. Anade parametro en `buildSearchQuery`.
7. Prueba `/api/v2/citys-stats?filtro=valor`.

Vinos:

1. Abre `src/back/v1/wine-stats.js`.
2. Para texto, toca `TEXT_FILTER_FIELDS` y `applyTextFilters`.
3. Para numeros, toca `NUMBER_FILTER_FIELDS` y `applyNumberFilters`.
4. Abre `WineStats.svelte`.
5. Anade campo a `filtros`.
6. Anade input.
7. Anade parametro en `buscarVinos`.
8. Prueba `/api/v1/wine-stats?filtro=valor`.

### Si dice "anade orden"

1. Si es ciudades, abre `src/back/v2/citys-stats.js`.
2. Busca el bloque `sort`.
3. Anade el campo en `allowedFields`.
4. Si es otro recurso, copia el patron de ciudades.
5. Si se usa desde la interfaz, anade selector en la pantalla.
6. Prueba `?sort=campo` y `?sort=-campo`.

### Si dice "crea una ruta nueva"

1. Abre el archivo API del recurso.
2. Decide el metodo HTTP.
3. Crea la ruta con `app.get`, `app.post`, `app.put` o `app.delete`.
4. Ponla antes de rutas con parametros como `/:id`.
5. Si devuelve documentos, quita `_id`.
6. Si se usa en frontend, crea funcion en el service.
7. Si se muestra, toca la pantalla Svelte.
8. Anade o cambia tests.
9. Abre la URL nueva para comprobar.

### Si dice "crea una v3"

1. Crea `src/back/v3`.
2. Copia el archivo v2 del recurso.
3. Cambia `BASE_API_URL` a `/api/v3/...`.
4. Implementa la mejora.
5. Abre `index.js`.
6. Importa y registra el modulo nuevo.
7. Anade link en `Home.svelte` si debe verse.
8. Crea tests.
9. Prueba `/api/v3/recurso`.

### Si dice "cambia rutas del frontend"

Ruta con `#/`:

1. Crea o edita componente en `frontend-group/src/routes`.
2. Abre `App.svelte`.
3. Importa el componente.
4. Anadelo a `routes`.
5. Abre `Navbar.svelte` si debe aparecer en menu.
6. Prueba `/#/ruta`.

Ruta sin `#/`:

1. Haz lo anterior.
2. Anade la ruta a `directRoutes` en `App.svelte`.
3. Abre `index.js`.
4. Anade `app.get("/ruta", ...)` devolviendo `frontendIndexPath`.
5. Prueba `/ruta`.

### Si dice "cambia tablas, formularios o mensajes"

Tablas:

1. Ciudades: `CitysStats.svelte`.
2. Desastres: `NaturalDisastersStats.svelte`.
3. Vinos: `WineStats.svelte`.
4. Cambia cabeceras, filas y botones.
5. Comprueba la pantalla.

Formularios:

1. Crear ciudad: `CitysStats.svelte`.
2. Editar ciudad: `EditCitysStats.svelte`.
3. Crear desastre: `NaturalDisastersStats.svelte`.
4. Editar desastre: `EditNaturalDisasters.svelte`.
5. Crear vino: `WineStats.svelte`.
6. Editar vino: `EditWineStats.svelte`.
7. Cambia objeto de formulario, input, validacion y payload.
8. Crea o edita un registro.

Mensajes:

1. Ciudades: `citysStatsApi.js` y `CitysStats.svelte`.
2. Desastres: `natural-disasters.js` y `NaturalDisastersStats.svelte`.
3. Vinos: `wine-stats.js` y `WineStats.svelte`.
4. Busca `friendlyApiMessage`, `mostrarMensaje`, `message` o `error`.
5. Prueba un exito y un error.

### Si dice "cambia graficas, mapa o integraciones"

Grafica del grupo:

1. Abre `GroupAnalytics.svelte`.
2. Toca `buildMetrics` si cambia el calculo.
3. Toca `renderChart` si cambia la grafica.
4. Prueba `/#/analytics`.

Grafica de ciudades:

1. Abre `CitysStatsAnalytics.svelte`.
2. Toca transformacion de datos, labels o `renderChart`.
3. Prueba `/analytics/citys-stats`.

Mapa:

1. Abre `CitysStatsMapAnalytics.svelte`.
2. Toca `coordinates`, `keyFor`, `colorFor`, `radiusFor` o `renderMap`.
3. Prueba `/analytics/citys-stats/map`.

Integraciones:

1. Backend: `src/back/v1/citys-stats.js`.
2. Open-Meteo: `getGeocoding`.
3. REST Countries: `getCountryInfo`.
4. World Bank: `getWorldBankPopulation`.
5. APIs SOS externas: `getTouristArrivals`, `getEarthquakes` y `getFifaSquadValues`.
6. Agregado local por pais: `buildCityCountrySummaries`.
7. Union final: `buildIntegratedCity`.
8. Errores: `fetchJson` y `safeExternal`.
9. Frontend service: `citysStatsIntegrations.js`.
10. Pantalla: `CitysStatsIntegrations.svelte`.
11. Prueba `/api/v1/citys-stats/integrations/summary`.

## 12. Estrategia si te piden un cambio grande

No intentes tocar todo a ciegas. Di esto:

> "Primero identifico si es cambio de contrato de API, de interfaz o de visualizacion. Si cambia el contrato, actualizo backend, frontend y tests. Si solo cambia visualizacion, lo limito al componente Svelte."

Orden seguro:

1. Backend: que la API responda bien.
2. Service: que el frontend llame a la ruta correcta.
3. Pantalla: que el usuario pueda usarlo.
4. Tests: que el comportamiento quede fijado.
5. Build: que `public` quede actualizado.

Esa es la forma de no perderse.
