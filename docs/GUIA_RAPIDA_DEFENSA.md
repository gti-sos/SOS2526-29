# SOS2526-29

## Defensa y cambios rapidos

Esta seccion esta pensada para una defensa real: si el profesor pide un cambio, no vale decir "eso esta en el backend". Hay que saber el archivo exacto, la funcion aproximada y la comprobacion. La version larga esta en [GUIA_DEFENSA.md](GUIA_DEFENSA.md).

Para preguntas mas teoricas del temario, usa tambien [TEORIA_Y_ESTILO_DEFENSA.md](TEORIA_Y_ESTILO_DEFENSA.md), que cruza las diapositivas L00-L11 con archivos concretos del proyecto.

### Idea principal para explicar el proyecto

> "Nuestro proyecto es una aplicacion web hecha con Node, Express y Svelte. El backend ofrece una API REST con tres recursos: `natural-disasters`, `citys-stats` y `wine-stats`. Cada recurso permite listar, buscar, crear, editar, borrar y cargar datos iniciales. Los datos se guardan en NeDB, una base de datos local basada en archivos. El frontend usa Svelte para mostrar formularios, tablas, mensajes, graficas, mapa e integraciones. Cuando el usuario hace una accion, Svelte llama al backend con `fetch`, Express valida la peticion, consulta o modifica NeDB y responde en JSON."

### Mapa mental del codigo

Arranque y servidor:

- Archivo: `index.js`.
- Ahi se crea Express, se activa CORS, se activa `express.json`, se abren las bases NeDB y se registran los modulos de API.
- Si el cambio afecta al puerto, bases de datos, rutas directas sin `#/` o frontend compilado, empieza por aqui.

Backend:

- Desastres: `src/back/v1/natural-disasters.js` y `src/back/v2/natural-disasters.js`.
- Ciudades: `src/back/v1/citys-stats.js` y `src/back/v2/citys-stats.js`.
- Vinos: `src/back/v1/wine-stats.js`.
- Ahi estan `initialData`, validaciones, filtros, rutas CRUD, codigos HTTP y llamadas a NeDB.

Frontend:

- Rutas generales: `frontend-group/src/App.svelte`.
- Menu: `frontend-group/src/components/Navbar.svelte`.
- Services: `frontend-group/src/services/*.js`.
- Pantallas: `frontend-group/src/routes/*.svelte`.
- Si el cambio es visual, de formularios, tablas, mensajes, graficas o navegacion, normalmente esta aqui.

Tests:

- API/Postman/Newman: `tests/ALG`, `tests/LCC`, `tests/RMP`.
- Navegador/Playwright: `tests/*/e2e/*.spec.js`.
- Si cambia el contrato de una API, casi seguro hay que revisar estos tests.

### Regla de oro para no perderse

- Si cambia una ruta HTTP, se toca backend y probablemente un service de `frontend-group/src/services`.
- Si cambia un campo de datos, se toca backend, datos iniciales, formulario, tabla, edicion, graficas si usan ese campo y tests.
- Si cambia solo un texto o estilo visible, se toca el componente `.svelte`.
- Si cambia una grafica, se toca `renderChart` o `renderMap`, no normalmente la API.
- Si falla un test, primero se mira si el test esta describiendo un comportamiento real que se ha roto.

### Recursos y claves

`natural-disasters`:

- Versiones: v1 y v2.
- Campos: `country`, `year`, `death_count`, `injured_count`, `economic_damage_usd`.
- Identificador: `country` + `year`.
- Frontend: `frontend-group/src/routes/NaturalDisastersStats.svelte`.
- Edicion: `frontend-group/src/routes/EditNaturalDisasters.svelte`.
- Service: `frontend-group/src/services/natural-disasters.js`.

`citys-stats`:

- Versiones: v1 y v2.
- Campos: `city`, `country`, `un_2025_population`.
- Identificador: `city` + `country`.
- Frontend: `frontend-group/src/routes/CitysStats.svelte`.
- Edicion: `frontend-group/src/routes/EditCitysStats.svelte`.
- Service CRUD: `frontend-group/src/services/citysStatsApi.js`.
- Service integraciones: `frontend-group/src/services/citysStatsIntegrations.js`.

`wine-stats`:

- Version: v1.
- Campos: `id`, `title`, `country`, `region`, `year`, `price`, `abv`, `unit`, `grape`, `type`, `capacity`.
- Identificador: `id`.
- Frontend: `frontend-group/src/routes/WineStats.svelte`.
- Edicion: `frontend-group/src/routes/EditWineStats.svelte`.
- Service: `frontend-group/src/services/wine-stats.js`.

La v2 de `citys-stats` se usa para el CRUD del frontend porque tiene `q`, `sort` y paginacion. La v1 de `citys-stats` se conserva porque contiene las integraciones externas. La v2 de `natural-disasters` mejora la busqueda con pais parcial y rango `from`/`to`.

### Como actuar si piden cambios

Antes de editar nada:

1. Identifica el recurso: desastres, ciudades o vinos.
2. Decide si cambia el contrato de la API, la interfaz, o solo una visualizacion.
3. Si cambia el contrato, toca backend primero.
4. Luego toca el service de frontend.
5. Luego toca la pantalla Svelte.
6. Al final actualiza tests y ejecuta build si cambiaste frontend.

#### Cambiar puerto

1. Abre `index.js`.
2. Busca `const port = process.env.PORT || 10000`.
3. Cambia `10000` por el puerto que pidan, o explica que en despliegue manda `process.env.PORT`.
4. Reinicia con `npm start`.
5. Comprueba en consola que Express escucha en el puerto nuevo.

#### Cambiar donde se guarda una base

1. Abre `index.js`.
2. Busca el Datastore del recurso:
   - Desastres: `naturalDisastersDb`.
   - Ciudades: `citysStatsDb`.
   - Vinos: `wineStatsDb`.
3. Cambia la propiedad `filename`.
4. Arranca el servidor.
5. Comprueba que el archivo `.db` nuevo se crea o que la API lee los datos esperados.

#### Cambiar datos iniciales

Para desastres:

1. Abre `src/back/v1/natural-disasters.js`.
2. Cambia el array `initialData`.
3. Repite lo mismo en `src/back/v2/natural-disasters.js`.
4. Borra la coleccion con `DELETE /api/v2/natural-disasters`.
5. Carga otra vez con `/api/v2/natural-disasters/loadInitialData`.

Para ciudades:

1. Abre `src/back/v1/citys-stats.js`.
2. Cambia el array `initialData`.
3. Repite lo mismo en `src/back/v2/citys-stats.js`.
4. Borra la coleccion con `DELETE /api/v2/citys-stats`.
5. Carga otra vez con `/api/v2/citys-stats/loadInitialData`.

Para vinos:

1. Abre `src/back/v1/wine-stats.js`.
2. Cambia el array `initialData`.
3. No metas `id` manual si es un dato inicial normal, porque el backend lo genera al cargar.
4. Borra la coleccion con `DELETE /api/v1/wine-stats`.
5. Carga otra vez con `/api/v1/wine-stats/loadInitialData`.

#### Cambiar validaciones

Desastres:

1. Abre `src/back/v1/natural-disasters.js` y `src/back/v2/natural-disasters.js`.
2. Si cambian campos obligatorios, toca `REQUIRED_FIELDS`.
3. Si cambia la forma del body, toca `hasValidDisasterBody`.
4. Si cambia un filtro numerico o de query, toca `buildSearchQuery`.
5. Comprueba con un `POST` correcto y otro con campo de mas.

Ciudades:

1. Abre `src/back/v1/citys-stats.js` y `src/back/v2/citys-stats.js`.
2. Si cambian campos, toca `hasExactCityFields`.
3. Si cambia limpieza o conversion de datos, toca `normalizeCityStat`.
4. Comprueba creando una ciudad valida y otra con poblacion invalida.

Vinos:

1. Abre `src/back/v1/wine-stats.js`.
2. Si cambian campos, toca `EXPECTED_FIELDS`.
3. Si cambia estructura, toca `hasExactWineFields`.
4. Si cambia conversion de datos, toca `normalizeWineStat`.
5. Comprueba creando un vino valido y otro con body incompleto.

#### Anadir un campo

Si el campo es de desastres:

1. Backend: abre `src/back/v1/natural-disasters.js` y `src/back/v2/natural-disasters.js`.
2. Anade el campo a `REQUIRED_FIELDS`.
3. Anade el campo a cada objeto de `initialData`.
4. Ajusta `hasValidDisasterBody` si el campo tiene reglas especiales.
5. Si se filtra por ese campo, anadelo a `buildSearchQuery`.
6. Frontend: abre `frontend-group/src/routes/NaturalDisastersStats.svelte`.
7. Anade el campo al objeto `form`.
8. Anade el input de creacion.
9. Anade la columna en la tabla.
10. Edicion: abre `EditNaturalDisasters.svelte` y anade input/carga/guardado.
11. Service: revisa `frontend-group/src/services/natural-disasters.js`.
12. Tests: revisa `tests/ALG`.
13. Comprueba con `npm run test-ALG` y creando un registro en la pantalla.

Si el campo es de ciudades:

1. Backend: abre `src/back/v1/citys-stats.js` y `src/back/v2/citys-stats.js`.
2. Anade el campo a la lista `expected` dentro de `hasExactCityFields`.
3. Limpialo y validalo dentro de `normalizeCityStat`.
4. Anade el campo a cada objeto de `initialData`.
5. Si afecta a integraciones, revisa `buildIntegratedCity`.
6. Frontend: abre `frontend-group/src/routes/CitysStats.svelte`.
7. Anade el campo a `emptyCreateForm`.
8. Anade input en el formulario de creacion.
9. Anade columna en la tabla.
10. Edicion: abre `EditCitysStats.svelte` y anade input/carga/guardado.
11. Service: revisa `frontend-group/src/services/citysStatsApi.js`.
12. Tests: revisa `tests/LCC`.
13. Comprueba con `npm run test-LCC-v2` y `npm run test-LCC-e2e`.

Si el campo es de vinos:

1. Backend: abre `src/back/v1/wine-stats.js`.
2. Anade el campo a `EXPECTED_FIELDS`.
3. Limpialo y validalo dentro de `normalizeWineStat`.
4. Anade el campo a cada objeto de `initialData`.
5. Si se puede filtrar, anadelo a `TEXT_FILTER_FIELDS` o `NUMBER_FILTER_FIELDS`.
6. Frontend: abre `frontend-group/src/routes/WineStats.svelte`.
7. Anade el campo a `nuevoVino`.
8. Anade input en el formulario.
9. Anade columna en la tabla.
10. Edicion: abre `EditWineStats.svelte` y anade input/carga/guardado.
11. Service: revisa `frontend-group/src/services/wine-stats.js`.
12. Tests: revisa `tests/RMP`.
13. Comprueba con `npm run test-RMP`.

#### Renombrar un campo

1. Busca todos los usos con `rg "nombre_antiguo"`.
2. Cambia primero el backend del recurso.
3. Cambia `initialData`.
4. Cambia validaciones y normalizacion.
5. Cambia services.
6. Cambia formularios, tablas y edicion.
7. Cambia analytics si ese campo se suma o se pinta.
8. Cambia tests.
9. Vuelve a ejecutar `rg "nombre_antiguo"` y comprueba que no quedan usos reales.

#### Permitir un campo opcional

1. Abre el archivo API del recurso.
2. Localiza `hasValidDisasterBody`, `hasExactCityFields` o `hasExactWineFields`.
3. Separa mentalmente campos obligatorios y campos permitidos.
4. La validacion debe exigir obligatorios, pero no rechazar el opcional.
5. En `normalize...`, usa valor por defecto si no viene.
6. Prueba dos casos: body sin el campo opcional y body con el campo opcional.

#### Anadir un filtro

Para desastres:

1. Abre `src/back/v2/natural-disasters.js`.
2. Toca `buildSearchQuery`.
3. Convierte el query param al tipo correcto.
4. Abre `NaturalDisastersStats.svelte`.
5. Anade input de busqueda.
6. Anade el parametro a la query string en la funcion `buscar`.
7. Revisa `natural-disasters.js` si hace falta.
8. Comprueba `/api/v2/natural-disasters?nuevoFiltro=valor`.

Para ciudades:

1. Abre `src/back/v2/citys-stats.js`.
2. Toca el bloque `app.get(BASE_API_URL, ...)`.
3. Filtra `result` despues de leer los documentos.
4. Abre `CitysStats.svelte`.
5. Anade el campo a `emptySearchForm`.
6. Anade el input.
7. Anade el parametro en `buildSearchQuery`.
8. Comprueba `/api/v2/citys-stats?nuevoFiltro=valor`.

Para vinos:

1. Abre `src/back/v1/wine-stats.js`.
2. Si el filtro es texto, revisa `TEXT_FILTER_FIELDS` y `applyTextFilters`.
3. Si el filtro es numerico, revisa `NUMBER_FILTER_FIELDS` y `applyNumberFilters`.
4. Abre `WineStats.svelte`.
5. Anade el campo a `filtros`.
6. Anade input en el buscador.
7. Anade el parametro en `buscarVinos`.
8. Comprueba `/api/v1/wine-stats?nuevoFiltro=valor`.

#### Anadir ordenacion

1. Si es ciudades, abre `src/back/v2/citys-stats.js` porque ya tiene patron con `sort`.
2. Busca el bloque `if (req.query.sort !== undefined)`.
3. Anade el campo nuevo a `allowedFields`.
4. Si es otro recurso, copia el patron: `sort=campo` ascendente y `sort=-campo` descendente.
5. Si se controla desde pantalla, anade selector en la pantalla del recurso.
6. Comprueba `?sort=campo` y `?sort=-campo`.

#### Cambiar paginacion

1. Desastres: abre `natural-disasters.js` y toca `getPagination`.
2. Ciudades: abre `citys-stats.js` y toca el bloque `offset`/`limit`.
3. Vinos: abre `wine-stats.js` y toca `readPagination`.
4. Manten validacion de enteros.
5. Prueba `?offset=0&limit=2`.
6. Prueba un valor invalido para comprobar que devuelve `400`.

#### Crear una ruta nueva de API

1. Abre el archivo API del recurso.
2. Decide metodo HTTP: `GET`, `POST`, `PUT` o `DELETE`.
3. Escribe la ruta con `app.get`, `app.post`, `app.put` o `app.delete`.
4. Pon la ruta concreta antes de rutas con parametros como `/:id` o `/:city/:country`.
5. Si devuelve datos, limpia `_id` con `removeDatabaseId`.
6. Si la va a usar el frontend, crea funcion en el service del recurso.
7. Pintala en la pantalla si procede.
8. Crea o adapta tests.
9. Abre la URL nueva directamente para comprobarla.

#### Crear una v3

1. Crea carpeta `src/back/v3`.
2. Copia como base el archivo v2 del recurso.
3. Cambia `BASE_API_URL` a `/api/v3/...`.
4. Implementa solo los cambios nuevos.
5. Abre `index.js`.
6. Importa el modulo con `require`.
7. Registralo pasando `app` y la base de datos correspondiente.
8. Si debe aparecer en portada, actualiza `Home.svelte`.
9. Crea tests nuevos o adapta los de v2.
10. Comprueba `/api/v3/recurso`.

#### Cambiar rutas o paginas del frontend

Para una ruta normal con `#/`:

1. Crea o edita un componente en `frontend-group/src/routes`.
2. Abre `frontend-group/src/App.svelte`.
3. Importa el componente.
4. Anadelo al objeto `routes`.
5. Abre `Navbar.svelte` si quieres enlace visible.
6. Usa href tipo `/#/nueva-ruta`.
7. Comprueba abriendo `/#/nueva-ruta`.

Para una ruta directa sin `#/`:

1. Haz lo anterior en `App.svelte`.
2. Anadela tambien a `directRoutes`.
3. Abre `index.js`.
4. Anade un `app.get("/ruta", ...)` que devuelva `frontendIndexPath`.
5. Comprueba abriendo `/ruta` directamente.

#### Cambiar tablas, formularios o mensajes

Tablas:

1. Ciudades: `CitysStats.svelte`.
2. Desastres: `NaturalDisastersStats.svelte`.
3. Vinos: `WineStats.svelte`.
4. Cambia cabeceras, filas del `{#each ...}` y botones.
5. Comprueba la pantalla del recurso.

Formularios:

1. Crear ciudad: `CitysStats.svelte`.
2. Editar ciudad: `EditCitysStats.svelte`.
3. Crear desastre: `NaturalDisastersStats.svelte`.
4. Editar desastre: `EditNaturalDisasters.svelte`.
5. Crear vino: `WineStats.svelte`.
6. Editar vino: `EditWineStats.svelte`.
7. Cambia objeto de formulario, inputs, validacion y payload.
8. Comprueba creando o editando un registro.

Mensajes:

1. Ciudades: `citysStatsApi.js` y `CitysStats.svelte`.
2. Desastres: `natural-disasters.js` y `NaturalDisastersStats.svelte`.
3. Vinos: `wine-stats.js` y `WineStats.svelte`.
4. Busca `friendlyApiMessage`, `mostrarMensaje`, `message` o `error`.
5. Provoca un exito y un error para ver ambos mensajes.

#### Cambiar graficas, mapa o integraciones

Grafica del grupo:

1. Abre `frontend-group/src/routes/GroupAnalytics.svelte`.
2. Cambia `buildMetrics` si cambia el dato calculado.
3. Cambia `renderChart` si cambia el tipo de grafica, titulo, ejes o series.
4. Comprueba `/#/analytics`.

Grafica de ciudades:

1. Abre `frontend-group/src/routes/CitysStatsAnalytics.svelte`.
2. Cambia transformacion de datos, labels o `renderChart`.
3. Comprueba `/analytics/citys-stats`.

Mapa:

1. Abre `frontend-group/src/routes/CitysStatsMapAnalytics.svelte`.
2. Si falta una ciudad, anadela en `coordinates` con clave `city-country`.
3. Si cambia color o tamano, toca `colorFor` o `radiusFor`.
4. Si cambia Highcharts, toca `renderMap`.
5. Comprueba `/analytics/citys-stats/map`.

Integraciones:

1. Backend: abre `src/back/v1/citys-stats.js`.
2. Open-Meteo: `getGeocoding`.
3. REST Countries: `getCountryInfo`.
4. World Bank: `getWorldBankPopulation`.
5. APIs SOS externas: `getTouristArrivals`, `getEarthquakes` y `getFifaSquadValues`.
6. Agregado local por pais: `buildCityCountrySummaries`.
7. Union de datos: `buildIntegratedCity`.
8. Control de errores: `fetchJson` y `safeExternal`.
9. Frontend service: `citysStatsIntegrations.js`.
10. Pantalla: `CitysStatsIntegrations.svelte`.
11. Comprueba `/api/v1/citys-stats/integrations/summary` y `/integrations/citys-stats`.

### Codigos HTTP que hay que saber explicar

`200`: peticion correcta con respuesta.

`201`: recurso creado o datos iniciales insertados.

`204`: borrado correcto sin cuerpo de respuesta.

`400`: body incorrecto, query invalida o URL/body no coinciden.

`404`: recurso concreto no encontrado.

`405`: metodo no permitido para esa ruta.

`409`: recurso duplicado o coleccion ya cargada segun recurso.

`500`: error interno de base de datos o servidor.

`502`: fallo controlado en API externa.

### Preguntas tipicas del profesor

**Por que NeDB?**

Porque permite persistencia local en archivos `.db` sin montar una base de datos externa. Para esta practica es suficiente y cada recurso queda separado.

**Por que quitamos `_id`?**

Porque `_id` es interno de NeDB. La API publica no debe depender de detalles de almacenamiento, por eso usamos `removeDatabaseId`.

**Por que hay v1 y v2?**

Porque v1 mantiene el contrato inicial y v2 anade mejoras sin romper compatibilidad. Por ejemplo, `citys-stats` v2 anade `q` y `sort`; `natural-disasters` v2 anade pais parcial y rango de anios.

**Por que `citys-stats` se escribe asi?**

Porque es el nombre del recurso usado en las rutas, tests y documentacion. Cambiarlo romperia el contrato publicado.

**Por que algunas claves son compuestas?**

Porque no todos los datasets tienen un `id` natural. Desastres usa `country` + `year`; ciudades usa `city` + `country`; vinos genera `id`.

**Por que CORS?**

Porque en desarrollo el frontend puede ejecutarse en otro puerto y necesita permiso del backend para llamar a la API.

**Por que las integraciones se llaman desde backend?**

Porque asi controlamos timeout, errores y formato de respuesta antes de que llegue al navegador.

### Si algo falla durante la defensa

- Si `npm start` falla, comprobar dependencias, puerto `10000` y ultimo archivo tocado.
- Si la web se ve antigua, ejecutar `npm run build` porque Express sirve `public`.
- Si una API devuelve `400`, revisar body, campos extra, numeros y coincidencia URL/body.
- Si devuelve `409`, hay duplicado.
- Si devuelve `404`, el identificador no existe o fue borrado.
- Si devuelve `405`, el metodo no esta permitido y eso puede ser correcto.
- Si fallan integraciones, mirar `integrationErrors` y recordar que dependen de APIs externas.

### Checklist antes de defender

```bash
npm install
npm --prefix frontend-group install
npm run build
npm start
```

Probar despues:

- `http://localhost:10000`
- `/api/v2/citys-stats`
- `/api/v2/natural-disasters`
- `/api/v1/wine-stats`
- `/#/citys-stats`
- `/#/natural-disasters`
- `/#/wine-stats`
- `/#/analytics`
- `/analytics/citys-stats`
- `/analytics/citys-stats/map`
- `/integrations/citys-stats`

Tests utiles:

```bash
npm run test-ALG
npm run test-LCC
npm run test-LCC-v2
npm run test-RMP
npm run test-LCC-e2e
```

### Estrategia ante un cambio grande

Di esto y luego actua en ese orden:

> "Primero identifico si es cambio de contrato de API, de interfaz o de visualizacion. Si cambia el contrato, actualizo backend, frontend y tests. Si solo cambia visualizacion, lo limito al componente Svelte."

Orden seguro:

1. Backend.
2. Service frontend.
3. Pantalla Svelte.
4. Tests.
5. `npm run build`.

## ¿Qué hace este proyecto?

Este proyecto es una aplicacion web con backend y frontend. Sirve para gestionar y consultar tres conjuntos de datos:

- `natural-disasters`: desastres naturales por pais y anio.
- `citys-stats`: poblacion estimada de ciudades para 2025.
- `wine-stats`: informacion de vinos, precios, tipos y caracteristicas.

La aplicacion permite ver datos, buscar, crear, editar, borrar y cargar datos iniciales. Tambien incluye graficas e integraciones externas para la parte de `citys-stats`.

## Tecnologías utilizadas

- Node.js: ejecuta el servidor.
- Express: crea las rutas de la API REST.
- NeDB: guarda datos en archivos `.db`.
- Svelte: crea el frontend.
- Vite: compila el frontend.
- Highcharts: muestra graficas y mapa.
- Newman: ejecuta pruebas de Postman.
- Playwright: ejecuta pruebas end-to-end en navegador.

## Cómo ejecutar el proyecto

1. Instalar dependencias del backend:

```bash
npm install
```

2. Instalar dependencias del frontend:

```bash
npm --prefix frontend-group install
```

3. Compilar el frontend:

```bash
npm run build
```

4. Arrancar el servidor:

```bash
npm start
```

5. Abrir la aplicacion:

```text
http://localhost:10000
```

En Windows, si PowerShell bloquea `npm`, usa `npm.cmd`:

```bash
npm.cmd start
```

## Estructura del proyecto

```text
SOS2526-29/
├── index.js
├── package.json
├── playwright.config.js
├── public/
├── src/
│   └── back/
│       ├── v1/
│       ├── v2/
│       └── *.db
├── frontend-group/
│   ├── src/
│   │   ├── components/
│   │   ├── routes/
│   │   └── services/
│   └── vite.config.js
└── tests/
    ├── ALG/
    ├── LCC/
    └── RMP/
```

## Explicación de cada archivo

- `index.js`: archivo principal del backend. Crea el servidor Express, abre las bases de datos NeDB, carga las APIs y sirve el frontend compilado.
- `src/back/v1/natural-disasters.js`: API v1 de desastres naturales. Tiene rutas para documentacion, carga inicial, busqueda, creacion, edicion y borrado.
- `src/back/v2/natural-disasters.js`: API v2 de desastres naturales. Es parecida a v1, pero mejora busquedas por pais parcial y rango de anios.
- `src/back/v1/citys-stats.js`: API v1 de ciudades. Incluye CRUD, top de ciudades, agregados por pais, proxies e integraciones con Open-Meteo, REST Countries, World Bank y APIs SOS externas.
- `src/back/v2/citys-stats.js`: API v2 de ciudades. Anade busqueda libre con `q` y ordenacion con `sort`.
- `src/back/v1/wine-stats.js`: API v1 de vinos. Gestiona vinos con identificador numerico `id`.
- `src/back/*.db`: archivos donde NeDB guarda los datos reales.
- `frontend-group/src/main.js`: punto de entrada del frontend Svelte.
- `frontend-group/src/App.svelte`: define las rutas del frontend y decide que pantalla se muestra.
- `frontend-group/src/components/Navbar.svelte`: barra de navegacion superior.
- `frontend-group/src/services/*.js`: funciones que llaman al backend con `fetch`.
- `frontend-group/src/routes/*.svelte`: pantallas visibles de la aplicacion.
- `frontend-group/vite.config.js`: configura la compilacion del frontend hacia `public`.
- `public/`: frontend compilado que sirve Express en produccion.
- `tests/`: pruebas Postman/Newman y Playwright.

## Funciones más importantes

- `registerNaturalDisastersV1` en `src/back/v1/natural-disasters.js`: registra todas las rutas v1 de desastres.
- `registerNaturalDisastersV2` en `src/back/v2/natural-disasters.js`: registra todas las rutas v2 de desastres.
- `removeDatabaseId`: aparece en varias APIs y elimina `_id`, que es un campo interno de NeDB.
- `normalizeCityStat` en `citys-stats`: limpia ciudad, pais y poblacion antes de guardar.
- `normalizeWineStat` en `wine-stats`: valida y convierte los datos de un vino.
- `getNextWineId` en `wine-stats`: calcula el siguiente `id` disponible.
- `fetchJson` en `src/back/v1/citys-stats.js`: llama a APIs externas y controla errores.
- `buildIntegratedCity` en `src/back/v1/citys-stats.js`: une datos locales agregados por pais con datos externos.
- `getAllCitysStats`, `createCityStat`, `updateCityStat`: servicio frontend para ciudades.
- `getDisasters`, `createDisaster`, `updateDisaster`: servicio frontend para desastres.
- `getAllWineStats`, `createWineStat`, `updateWineStat`: servicio frontend para vinos.
- `renderChart` y `renderMap`: funciones de las pantallas de analytics que dibujan graficas con Highcharts.

## Flujo del programa

1. El usuario ejecuta `npm start`.
2. `index.js` crea una aplicacion Express.
3. `index.js` abre tres bases NeDB: desastres, ciudades y vinos.
4. `index.js` carga los modulos de API de `src/back/v1` y `src/back/v2`.
5. Express queda escuchando en `http://localhost:10000`.
6. Si el usuario abre la web, Express sirve los archivos de `public`.
7. Svelte carga `App.svelte` y muestra la pantalla segun la ruta.
8. Cuando el usuario pulsa botones o envia formularios, los servicios de `frontend-group/src/services` hacen peticiones `fetch`.
9. El backend recibe la peticion, valida datos, consulta o modifica NeDB y responde en JSON.
10. El frontend actualiza tablas, mensajes, formularios, graficas o mapas con la respuesta.

## Errores comunes

- `npm.ps1 no se puede cargar`: PowerShell bloquea scripts. Solucion: usar `npm.cmd install`, `npm.cmd start` o cambiar la politica de ejecucion si el profesor lo permite.
- Puerto `10000` ocupado: otro proceso esta usando el puerto. Solucion: cerrar ese proceso o cambiar la variable `PORT`.
- La carga inicial dice que ya hay datos: la base `.db` no esta vacia. Solucion: borrar datos desde la interfaz o con `DELETE` a la coleccion.
- Error 400 al crear: falta algun campo o sobra un campo. Solucion: enviar exactamente los campos esperados.
- Error 409 al crear: el registro ya existe. Solucion: usar otros identificadores o editar el existente.
- Graficas o integraciones no cargan: puede fallar una API externa o la conexion. Solucion: probar de nuevo y revisar la consola/terminal.
- Cambios del frontend no se ven con `npm start`: hay que ejecutar `npm run build` para regenerar `public`.

## Cómo explicar este proyecto en clase

Puedes explicarlo asi:

> "Nuestro proyecto es una aplicacion web hecha con Node, Express y Svelte. El backend ofrece una API REST con tres recursos: desastres naturales, estadisticas de ciudades y vinos. Cada recurso tiene rutas para listar, buscar, crear, editar, borrar y cargar datos iniciales. Los datos se guardan en NeDB, que es una base de datos sencilla en archivos locales. El frontend usa Svelte para mostrar formularios, tablas, mensajes, graficas y mapas. Cuando el usuario hace una accion, el frontend llama al backend con `fetch`, el backend valida la peticion, consulta la base de datos y devuelve una respuesta JSON."

Consejos para defenderlo:

- Empieza por `index.js`, porque es donde se entiende el arranque.
- Explica que cada recurso esta separado en su propio archivo de API.
- Di que NeDB crea un `_id` interno, pero la API lo oculta con `removeDatabaseId`.
- Explica que se validan los datos antes de guardar para evitar registros incompletos.
- Muestra un ejemplo de flujo: crear una ciudad desde el formulario, el servicio llama a la API, Express guarda en NeDB y Svelte refresca la tabla.
- Para analytics, explica que Highcharts no guarda datos: solo los representa visualmente.
