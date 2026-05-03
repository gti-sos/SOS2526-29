# Defensa completa SOS2526-29

Documento unico fusionado a partir de:

- `docs/GUIA_RAPIDA_DEFENSA.md`
- `docs/GUIA_DEFENSA.md`
- `docs/TEORIA_Y_ESTILO_DEFENSA.md`
- `docs/D03_DEFENSA_LCC.md`

La idea es tener una guia ordenada para defender el proyecto, responder teoria, localizar codigo, hacer cambios en directo y preparar la parte D03 de LCC sin tener que saltar entre varios Markdown.

## Indice

- [1. Idea principal del proyecto](#1-idea-principal-del-proyecto)
- [2. Guion de defensa](#2-guion-de-defensa)
- [3. Rutas que conviene abrir](#3-rutas-que-conviene-abrir)
- [4. Como ejecutar y probar](#4-como-ejecutar-y-probar)
- [5. Mapa mental del codigo](#5-mapa-mental-del-codigo)
- [6. Arquitectura y teoria de la asignatura](#6-arquitectura-y-teoria-de-la-asignatura)
- [7. Recursos, campos y endpoints](#7-recursos-campos-y-endpoints)
- [8. Frontend, pantallas y services](#8-frontend-pantallas-y-services)
- [9. Analytics, mapa e integraciones](#9-analytics-mapa-e-integraciones)
- [10. Parte D03 LCC: `citys-stats`](#10-parte-d03-lcc-citys-stats)
- [11. Cambios que pueden pedir en directo](#11-cambios-que-pueden-pedir-en-directo)
- [12. Si algo falla durante la defensa](#12-si-algo-falla-durante-la-defensa)
- [13. Preguntas probables y respuestas](#13-preguntas-probables-y-respuestas)
- [14. Checklists finales](#14-checklists-finales)
- [15. Pendiente fuera de LCC](#15-pendiente-fuera-de-lcc)

## 1. Idea principal del proyecto

Este proyecto es una aplicacion web con backend y frontend para gestionar y consultar tres conjuntos de datos:

- `natural-disasters`: desastres naturales por pais y anio.
- `citys-stats`: poblacion estimada de ciudades para 2025.
- `wine-stats`: informacion de vinos, precios, tipos y caracteristicas.

La aplicacion permite:

- Ver datos.
- Buscar y filtrar.
- Crear registros.
- Editar registros.
- Borrar registros concretos o colecciones completas.
- Cargar datos iniciales.
- Mostrar graficas.
- Mostrar un mapa.
- Usar integraciones externas para `citys-stats`.

Frase base para explicar el proyecto:

> Nuestro proyecto es una aplicacion web hecha con Node, Express y Svelte. El backend ofrece una API REST con tres recursos: `natural-disasters`, `citys-stats` y `wine-stats`. Cada recurso permite listar, buscar, crear, editar, borrar y cargar datos iniciales. Los datos se guardan en NeDB, una base de datos local basada en archivos. El frontend usa Svelte para mostrar formularios, tablas, mensajes, graficas, mapa e integraciones. Cuando el usuario hace una accion, Svelte llama al backend con `fetch`, Express valida la peticion, consulta o modifica NeDB y responde en JSON.

Tecnologias usadas:

- Node.js: ejecuta el servidor.
- Express: crea las rutas de la API REST.
- NeDB: guarda datos en archivos `.db`.
- Svelte: crea el frontend.
- Vite: compila el frontend.
- Highcharts: muestra graficas y mapa.
- Newman: ejecuta pruebas de Postman.
- Playwright: ejecuta pruebas end-to-end en navegador.

## 2. Guion de defensa

### 2.1 Guion rapido de 90 segundos

1. Abrir `index.js`.
2. Decir: "Aqui arranca Express, se abren las bases NeDB, se registran APIs y se sirve Svelte compilado".
3. Abrir `src/back/v2/citys-stats.js`.
4. Decir: "Aqui esta el contrato REST principal de mi recurso: GET, POST, PUT, DELETE, filtros, ordenacion y paginacion".
5. Abrir `frontend-group/src/services/citysStatsApi.js`.
6. Decir: "Aqui Svelte llama al backend con `fetch`".
7. Abrir `frontend-group/src/routes/CitysStats.svelte`.
8. Decir: "Aqui esta el CRUD visible".
9. Abrir `src/back/v1/citys-stats.js`.
10. Decir: "Aqui estan los proxies e integraciones por backend".
11. Abrir `frontend-group/src/routes/GroupAnalytics.svelte`.
12. Decir: "Aqui se cumple el widget grupal no lineal".

### 2.2 Guion D03 LCC de 4 minutos

#### Portada y contexto

Frase:

> Esta es la aplicacion del grupo SOS2526-29. Tenemos tres recursos: `wine-stats`, `citys-stats` y `natural-disasters`. Mi parte es `citys-stats`, centrada en ciudades, paises y poblacion estimada para 2025.

Mostrar:

- Portada `/`.
- Enlaces de API y documentacion.
- Barra de navegacion hacia ciudades, analytics e integraciones.

#### API y CRUD

Frase:

> Para el CRUD uso `/api/v2/citys-stats`. La v2 anade busqueda libre con `q`, ordenacion con `sort`, paginacion con `limit` y `offset`, validacion y operaciones REST.

Mostrar:

- `/citys-stats`.
- Boton de cargar datos iniciales si hace falta.
- Busqueda.
- Ordenacion o paginacion.
- Crear, editar o borrar un registro si da tiempo.

Endpoints para mencionar:

```text
GET /api/v2/citys-stats
GET /api/v2/citys-stats/loadInitialData
GET /api/v2/citys-stats?q=india
GET /api/v2/citys-stats?sort=-un_2025_population&limit=5
POST /api/v2/citys-stats
PUT /api/v2/citys-stats/:city/:country
DELETE /api/v2/citys-stats/:city/:country
```

#### Analytics individual

Frase:

> Esta vista cumple la visualizacion individual de D03. Usa Highcharts y no es de tipo `line`. La grafica representa la poblacion estimada de los registros del recurso.

Mostrar:

- `/analytics/citys-stats`.
- Tipo de grafica.
- Datos procedentes de la API propia.

#### Mapa

Frase:

> El mapa ayuda a interpretar los datos geograficamente. Las burbujas representan ciudades del recurso y su poblacion estimada.

Mostrar:

- `/analytics/citys-stats/map`.
- Una burbuja o tooltip.

#### Integraciones

Frase:

> Para D03 he hecho la integracion por `country`. Lo cambie desde ciudad porque era demasiado pobre: muchas APIs externas no trabajan por ciudad o no coinciden exactamente en nombres. Por pais hay mas datos comparables y la grafica queda mas informativa.

Mostrar:

- `/integrations`.
- `/integrations/citys-stats`.
- Selector de numero de paises.
- Grafica Highcharts.
- Tarjetas de APIs SOS externas.
- Detalle por pais.

Frase tecnica:

> Todas las llamadas externas pasan por mi backend, asi que tengo proxy propio. El frontend no llama directamente a esas APIs; llama a `/api/v1/citys-stats/integrations/summary`, Express recoge JSON de las fuentes, normaliza los datos y devuelve un unico objeto integrado.

#### Analytics grupal

Frase:

> En `/analytics` hay un unico widget combinado con los datos de los tres recursos del grupo. No es `line`, y combina recuentos e indicadores principales normalizados.

Mostrar:

- `/analytics`.
- Las tres series o categorias del grupo.

## 3. Rutas que conviene abrir

Orden recomendado para la defensa:

| Orden | Ruta | Que demostrar |
| --- | --- | --- |
| 1 | `/` | Portada del proyecto y enlaces principales |
| 2 | `/api/v2/citys-stats/docs` | Documentacion Postman de la API v2 |
| 3 | `/citys-stats` | CRUD completo de LCC |
| 4 | `/analytics/citys-stats` | Highcharts individual no lineal |
| 5 | `/analytics/citys-stats/map` | Mapa del recurso |
| 6 | `/integrations` | Entrada comun de integraciones |
| 7 | `/integrations/citys-stats` | Integraciones LCC con 6 APIs |
| 8 | `/analytics` | Analytics grupal en un unico widget |

URLs desplegadas:

```text
https://sos2526-29.onrender.com/
https://sos2526-29.onrender.com/api/v2/citys-stats/docs
https://sos2526-29.onrender.com/citys-stats
https://sos2526-29.onrender.com/analytics/citys-stats
https://sos2526-29.onrender.com/analytics/citys-stats/map
https://sos2526-29.onrender.com/integrations
https://sos2526-29.onrender.com/integrations/citys-stats
https://sos2526-29.onrender.com/analytics
```

URLs locales:

```text
http://localhost:10000/
http://localhost:10000/citys-stats
http://localhost:10000/analytics
http://localhost:10000/integrations
http://localhost:10000/integrations/citys-stats
http://localhost:10000/api/v2/citys-stats
http://localhost:10000/api/v2/natural-disasters
http://localhost:10000/api/v1/wine-stats
http://localhost:10000/api/v1/citys-stats/country-summaries?limit=8
http://localhost:10000/api/v1/citys-stats/integrations/summary?limit=8
http://localhost:10000/api/v1/citys-stats/integrations/sos-tourist-arrivals
http://localhost:10000/api/v1/citys-stats/integrations/sos-earthquakes
http://localhost:10000/api/v1/citys-stats/integrations/sos-fifa-squad-values
```

Comprobacion local con PowerShell:

```powershell
Invoke-WebRequest http://localhost:10000/ -UseBasicParsing
Invoke-WebRequest http://localhost:10000/citys-stats -UseBasicParsing
Invoke-WebRequest http://localhost:10000/analytics -UseBasicParsing
Invoke-WebRequest http://localhost:10000/integrations -UseBasicParsing
Invoke-WebRequest http://localhost:10000/integrations/citys-stats -UseBasicParsing
Invoke-WebRequest http://localhost:10000/api/v1/citys-stats/integrations/summary?limit=8 -UseBasicParsing
```

## 4. Como ejecutar y probar

Instalar dependencias del backend:

```bash
npm install
```

Instalar dependencias del frontend:

```bash
npm --prefix frontend-group install
```

Compilar el frontend:

```bash
npm run build
```

Arrancar el servidor:

```bash
npm start
```

Abrir la aplicacion:

```text
http://localhost:10000
```

Desarrollo frontend con Vite:

```bash
npm run dev-front
```

En Windows, si PowerShell bloquea `npm`, usar `npm.cmd`:

```bash
npm.cmd run build
npm.cmd start
```

Tests de API:

```bash
npm run test-ALG
npm run test-LCC
npm run test-LCC-v2
npm run test-RMP
```

Tests internos directos de Newman:

```bash
npm run test-natural-disasters
npm run test-citys-stats
npm run test-citys-stats-v2
npm run test-wine-stats
```

Tests generales de API:

```bash
npm test
```

Tests E2E de LCC:

```bash
npm run test-LCC-e2e
```

## 5. Mapa mental del codigo

El proyecto tiene cuatro capas principales:

- `index.js`: arranque del servidor. Crea Express, abre las bases NeDB, registra las APIs y sirve el frontend compilado.
- `src/back/v1` y `src/back/v2`: backend REST. Aqui viven rutas, validaciones, filtros, datos iniciales, integraciones y codigos HTTP.
- `frontend-group/src/services`: funciones `fetch` que llaman al backend desde Svelte.
- `frontend-group/src/routes`: pantallas visibles: tablas, formularios, busquedas, graficas, mapa e integraciones.

Estructura general:

```text
SOS2526-29/
|-- index.js
|-- package.json
|-- playwright.config.js
|-- public/
|-- src/
|   |-- back/
|       |-- v1/
|       |-- v2/
|       |-- *.db
|-- frontend-group/
|   |-- src/
|   |   |-- components/
|   |   |-- routes/
|   |   |-- services/
|   |-- vite.config.js
|-- tests/
    |-- ALG/
    |-- LCC/
    |-- RMP/
```

Regla de oro para no perderse:

- Si cambia una ruta HTTP, se toca backend y probablemente un service.
- Si cambia un campo de datos, se toca backend, datos iniciales, formulario, tabla, edicion, analytics si usa ese campo y tests.
- Si cambia solo un texto o estilo visible, se toca el componente `.svelte`.
- Si cambia una grafica, se toca `renderChart` o `renderMap`, no normalmente la API.
- Si falla un test, primero se mira si el test esta describiendo un comportamiento real que se ha roto.

Archivos importantes:

| Archivo | Que contiene |
| --- | --- |
| `index.js` | Configuracion Express, CORS, `express.json`, bases NeDB, APIs y fallback de la SPA |
| `src/back/v1/natural-disasters.js` | CRUD v1, filtros exactos, validacion, carga inicial y codigos HTTP |
| `src/back/v2/natural-disasters.js` | CRUD v2, pais parcial, rango `from`/`to`, validacion, carga inicial y codigos HTTP |
| `src/back/v1/citys-stats.js` | CRUD v1, agregados por pais, proxies e integraciones |
| `src/back/v2/citys-stats.js` | CRUD v2, busqueda libre `q`, ordenacion `sort`, paginacion, validacion y carga inicial |
| `src/back/v1/wine-stats.js` | CRUD v1, ids automaticos, filtros, validacion y carga inicial |
| `src/back/*.db` | Archivos donde NeDB guarda los datos reales |
| `frontend-group/src/main.js` | Punto de entrada del frontend Svelte |
| `frontend-group/src/App.svelte` | Define rutas del frontend y decide que pantalla se muestra |
| `frontend-group/src/components/Navbar.svelte` | Barra de navegacion superior |
| `frontend-group/src/services/*.js` | Funciones que llaman al backend con `fetch` |
| `frontend-group/src/routes/*.svelte` | Pantallas visibles de la aplicacion |
| `frontend-group/vite.config.js` | Configura la compilacion del frontend hacia `public` |
| `public/` | Frontend compilado que sirve Express en produccion |
| `tests/` | Pruebas Postman/Newman y Playwright |

Funciones importantes:

- `registerNaturalDisastersV1` en `src/back/v1/natural-disasters.js`: registra todas las rutas v1 de desastres.
- `registerNaturalDisastersV2` en `src/back/v2/natural-disasters.js`: registra todas las rutas v2 de desastres.
- `removeDatabaseId`: aparece en varias APIs y elimina `_id`, que es un campo interno de NeDB.
- `normalizeCityStat` en `citys-stats`: limpia ciudad, pais y poblacion antes de guardar.
- `normalizeWineStat` en `wine-stats`: valida y convierte los datos de un vino.
- `getNextWineId` en `wine-stats`: calcula el siguiente `id` disponible.
- `fetchJson` en `src/back/v1/citys-stats.js`: llama a APIs externas y controla errores.
- `buildIntegratedCity` en `src/back/v1/citys-stats.js`: une datos locales agregados por pais con datos externos.
- `getAllCitysStats`, `createCityStat`, `updateCityStat`: service frontend para ciudades.
- `getDisasters`, `createDisaster`, `updateDisaster`: service frontend para desastres.
- `getAllWineStats`, `createWineStat`, `updateWineStat`: service frontend para vinos.
- `renderChart` y `renderMap`: funciones de analytics que dibujan graficas con Highcharts.

Flujo general del programa:

1. El usuario ejecuta `npm start`.
2. `index.js` crea una aplicacion Express.
3. `index.js` abre tres bases NeDB: desastres, ciudades y vinos.
4. `index.js` carga los modulos de API de `src/back/v1` y `src/back/v2`.
5. Express queda escuchando en `http://localhost:10000`.
6. Si el usuario abre la web, Express sirve los archivos de `public`.
7. Svelte carga `App.svelte` y muestra la pantalla segun la ruta.
8. Cuando el usuario pulsa botones o envia formularios, los services hacen peticiones `fetch`.
9. El backend recibe la peticion, valida datos, consulta o modifica NeDB y responde en JSON.
10. El frontend actualiza tablas, mensajes, formularios, graficas o mapas.

## 6. Arquitectura y teoria de la asignatura

### 6.1 Idea general del curso aplicada al proyecto

Una aplicacion orientada a servicios separa frontend, backend, API REST, datos propios e integraciones externas.

En este proyecto se ve asi:

- Frontend: `frontend-group/src`, hecho con Svelte.
- Backend: `index.js` y `src/back`, hecho con Node.js y Express.
- API REST propia: rutas bajo `/api/v1/...` y `/api/v2/...`.
- Datos abiertos: tres recursos con datos mundiales.
- Sistema externo: APIs usadas en integraciones y widgets.
- Persistencia: NeDB guarda documentos JSON en archivos `.db`.

Frase de defensa:

> El proyecto sigue la arquitectura de la asignatura: Svelte en el cliente, Express en el servidor, API REST entre ambos, NeDB como persistencia local y APIs externas integradas mediante nuestro backend.

### 6.2 Herramientas de gestion y desarrollo

Herramientas que se reflejan en el repo:

- `README.md`: enlaces principales, miembros, rutas, comandos y estado.
- `.github/`: configuracion relacionada con GitHub.
- `tests/*/*.json`: colecciones Postman/Newman.
- `playwright.config.js` y `tests/*/e2e`: pruebas end-to-end.
- Enlaces `/docs` de cada API: documentacion publicada en Postman.

Frase de defensa:

> GitHub no se usa solo para subir codigo; tambien documenta entregables, issues, milestones, pruebas y trazabilidad del trabajo del grupo.

### 6.3 Node, Express y servidor dinamico

En el proyecto:

- `index.js` crea la aplicacion Express.
- `app.use(express.json())` permite leer cuerpos JSON en `POST` y `PUT`.
- `app.use(cors())` permite llamadas desde el frontend en desarrollo.
- `express.static("public")` sirve el frontend compilado.
- El fallback `app.get(/^\/(?!api\/).*/, ...)` devuelve la SPA para rutas directas.

Frase de defensa:

> Express sirve dos cosas: la API bajo `/api` y el frontend compilado desde `public`. Si una ruta no es API, se devuelve `index.html` para que Svelte resuelva la pantalla.

### 6.4 REST: recursos, URLs y metodos

Ideas REST que hay que saber:

- Una entidad o concepto se modela como recurso.
- Cada recurso tiene una URL de coleccion y una URL de elemento concreto.
- CRUD se expresa con metodos HTTP: `POST`, `GET`, `PUT`, `DELETE`.
- Los datos se intercambian como JSON.
- Las busquedas, paginacion y vistas se expresan con query params.
- Los estados HTTP forman parte del contrato.

Resumen de metodos:

- `GET /api/.../recurso`: lista recursos.
- `GET /api/.../recurso/:id`: obtiene un recurso concreto.
- `POST /api/.../recurso`: crea un recurso dentro de la coleccion.
- `PUT /api/.../recurso/:id`: actualiza un recurso concreto.
- `DELETE /api/.../recurso`: borra toda la coleccion.
- `DELETE /api/.../recurso/:id`: borra un recurso concreto.

Frase de defensa:

> No usamos verbos en la URL porque el verbo ya lo marca el metodo HTTP. La URL identifica el recurso y el metodo indica la operacion.

### 6.5 Codigos HTTP que hay que justificar

| Codigo | Uso en defensa |
| --- | --- |
| `200` | Lectura o actualizacion correcta con respuesta |
| `201` | Recurso creado o datos iniciales insertados |
| `204` | Borrado correcto sin cuerpo de respuesta |
| `400` | Body incorrecto, query invalida, campo extra o URL/body no coinciden |
| `404` | Recurso concreto no encontrado |
| `405` | Metodo no permitido para esa URL |
| `409` | Conflicto por duplicado o coleccion ya cargada |
| `500` | Error interno de servidor o base de datos |
| `502` | Error controlado al consultar una API externa |

Frase de defensa:

> El codigo HTTP tambien documenta el contrato de la API. Si envio un body con campos de mas, es `400`; si creo algo repetido, es `409`; si pido algo que no existe, es `404`.

### 6.6 Versionado de APIs

En el proyecto:

- `src/back/v1`: contrato inicial y compatibilidad.
- `src/back/v2`: mejoras de busqueda, rangos, ordenacion o paginacion.
- El frontend de `citys-stats` usa v2 para CRUD.
- Las integraciones de `citys-stats` siguen en v1 porque ahi vive el proxy externo.

Frase de defensa:

> La v2 no sustituye borrando la v1; convive con ella. Asi mantenemos compatibilidad y podemos anadir mejoras sin romper rutas ya entregadas.

### 6.7 NeDB, Postman, Newman y CI

En el repo:

- `@seald-io/nedb` aparece en `package.json`.
- Cada recurso tiene su propio `.db`, configurado en `index.js`.
- `removeDatabaseId` oculta `_id`, porque es un detalle interno de NeDB.
- Los tests Postman/Newman estan en `tests/ALG`, `tests/LCC` y `tests/RMP`.
- Los scripts `npm run test-*` ejecutan esos tests.

Frase de defensa:

> NeDB nos da persistencia local en documentos JSON. La API no expone `_id` porque pertenece al almacenamiento, no al contrato publico.

### 6.8 Frontend Svelte y services `fetch`

En el proyecto:

- `frontend-group/src/App.svelte` registra rutas.
- `frontend-group/src/components/Navbar.svelte` define navegacion.
- `frontend-group/src/routes` contiene pantallas.
- `frontend-group/src/services` contiene funciones `fetch`.
- `frontend-group/vite.config.js` compila hacia `../public`.

Frase de defensa:

> El frontend no accede a la base de datos. Solo llama a la API con `fetch`; Express valida y responde JSON.

### 6.9 Pruebas E2E

En el proyecto:

- Playwright esta en `devDependencies`.
- `tests/*/e2e/*.spec.js` prueba flujos reales de navegador.
- `npm run test-LCC-e2e` ejecuta la parte e2e de `citys-stats`.

Frase de defensa:

> Newman comprueba contrato de API y Playwright comprueba flujos de usuario en navegador. Son capas de prueba distintas.

### 6.10 Visualizacion

La asignatura pide visualizacion con widget no `line`, grafico grupal y, como extra, mapa o bibliotecas adicionales.

En el proyecto:

- `frontend-group/src/routes/GroupAnalytics.svelte`: widget grupal con datos de los tres recursos.
- `frontend-group/src/routes/CitysStatsAnalytics.svelte`: grafica individual de ciudades.
- `frontend-group/src/routes/CitysStatsMapAnalytics.svelte`: mapa.
- `frontend-group/src/routes/CitysStatsIntegrations.svelte`: widget de integraciones.

Frase de defensa:

> Highcharts no es la fuente de datos; solo representa los datos que vienen de nuestras APIs y de las integraciones normalizadas.

### 6.11 Integracion, SOP y proxy

En el proyecto:

- El frontend llama a `/api/v1/citys-stats/integrations/...`.
- Express llama desde backend a Open-Meteo, REST Countries, World Bank y APIs SOS externas.
- `fetchJson` controla JSON, estados HTTP y timeout.
- `safeExternal` evita que una API externa rompa toda la vista.
- `integrationErrors` informa errores parciales.

Frase de defensa:

> Las integraciones pasan por nuestro backend para evitar problemas de origen, controlar errores y devolver un JSON ya normalizado al frontend.

### 6.12 Estilo del codigo que conviene explicar

El estilo del codigo responde a ideas de la asignatura:

- Un modulo por recurso y version facilita localizar contratos REST.
- Constantes al principio agrupan rutas base, URLs de docs, APIs externas y datos iniciales.
- Helpers antes de rutas concentran validacion, normalizacion, paginacion y limpieza de `_id`.
- Rutas concretas antes que rutas con parametros evitan que Express confunda `/docs` o `/loadInitialData` con `/:id`.
- Validacion estricta del body deja claro el contrato JSON y los errores `400`.
- Identificadores estables: claves compuestas cuando no hay `id` natural; `id` generado para vinos.
- Respuestas sin `_id`: se separa persistencia de API publica.
- Proxy en backend: el navegador no carga APIs externas directamente.
- Services Svelte separados: las pantallas no duplican URLs ni parsing de errores.

Frase de defensa:

> El codigo esta organizado por capas: servidor, modulos REST, services frontend y pantallas. Eso hace que un cambio de contrato, interfaz o visualizacion tenga un sitio claro.

## 7. Recursos, campos y endpoints

### 7.1 Tabla general de recursos

| Recurso | Coleccion | Elemento concreto | Identificador |
| --- | --- | --- | --- |
| `natural-disasters` | `/api/v2/natural-disasters` | `/api/v2/natural-disasters/:country/:year` | `country` + `year` |
| `citys-stats` | `/api/v2/citys-stats` | `/api/v2/citys-stats/:city/:country` | `city` + `country` |
| `wine-stats` | `/api/v1/wine-stats` | `/api/v1/wine-stats/:id` | `id` |

### 7.2 `natural-disasters`

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

Identificador:

- `country` + `year`.

Archivos:

- `src/back/v1/natural-disasters.js`
- `src/back/v2/natural-disasters.js`
- `frontend-group/src/routes/NaturalDisastersStats.svelte`
- `frontend-group/src/routes/EditNaturalDisasters.svelte`
- `frontend-group/src/services/natural-disasters.js`
- `tests/ALG`

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

### 7.3 `citys-stats`

Campos:

```json
{
  "city": "tokyo",
  "country": "japan",
  "un_2025_population": 33412512
}
```

Identificador:

- `city` + `country`.

Archivos:

- `src/back/v1/citys-stats.js`
- `src/back/v2/citys-stats.js`
- `frontend-group/src/routes/CitysStats.svelte`
- `frontend-group/src/routes/EditCitysStats.svelte`
- `frontend-group/src/services/citysStatsApi.js`
- `frontend-group/src/services/citysStatsIntegrations.js`
- `tests/LCC`

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

### 7.4 `wine-stats`

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

Identificador:

- `id`.

Archivos:

- `src/back/v1/wine-stats.js`
- `frontend-group/src/routes/WineStats.svelte`
- `frontend-group/src/routes/EditWineStats.svelte`
- `frontend-group/src/services/wine-stats.js`
- `tests/RMP`

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

## 8. Frontend, pantallas y services

Rutas y navegacion:

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

Flujo completo al crear una ciudad:

1. El usuario rellena el formulario en `CitysStats.svelte`.
2. `handleCreate` valida el formulario.
3. `createCityStat` en `citysStatsApi.js` hace `POST /api/v2/citys-stats`.
4. Express recibe la peticion en `src/back/v2/citys-stats.js`.
5. `normalizeCityStat` limpia ciudad y pais, y convierte poblacion a numero.
6. El backend comprueba duplicados con `db.findOne`.
7. Si no existe, guarda con `db.insert`.
8. La API responde `201`.
9. El frontend muestra mensaje de exito y recarga la tabla.

Flujo completo al editar:

1. La tabla navega a `/#/citys-stats/editar/:city/:country`.
2. `App.svelte` carga `EditCitysStats.svelte`.
3. `onMount` llama `getOneCityStat`.
4. El usuario cambia datos y pulsa guardar.
5. `updateCityStat` hace `PUT /api/v2/citys-stats/:city/:country`.
6. El backend comprueba que URL y body coinciden.
7. NeDB actualiza el documento.
8. El frontend muestra confirmacion.

## 9. Analytics, mapa e integraciones

Analytics e integraciones:

- `frontend-group/src/routes/GroupAnalytics.svelte`: grafica conjunta de las tres APIs.
- `frontend-group/src/routes/CitysStatsAnalytics.svelte`: grafica de ciudades.
- `frontend-group/src/routes/CitysStatsMapAnalytics.svelte`: mapa de ciudades.
- `frontend-group/src/routes/CitysStatsIntegrations.svelte`: pantalla de integraciones externas.
- `frontend-group/src/routes/GroupIntegrations.svelte`: entrada de integraciones del grupo.

Flujo de analytics:

1. `GroupAnalytics.svelte` se monta.
2. Llama en paralelo a ciudades, desastres y vinos con `Promise.all`.
3. `buildMetrics` calcula registros e indicadores.
4. `renderChart` crea una grafica Highcharts.
5. `onDestroy` destruye la grafica al cambiar de pantalla.

Grafica del grupo:

- Archivo: `frontend-group/src/routes/GroupAnalytics.svelte`.
- Cambiar `buildMetrics` si cambia el dato calculado.
- Cambiar `renderChart` si cambia tipo de grafica, titulo, ejes o series.
- Comprobar `/#/analytics`.

Grafica de ciudades:

- Archivo: `frontend-group/src/routes/CitysStatsAnalytics.svelte`.
- Cambiar transformacion de datos, labels o `renderChart`.
- Comprobar `/analytics/citys-stats`.

Mapa:

- Archivo: `frontend-group/src/routes/CitysStatsMapAnalytics.svelte`.
- Si falta una ciudad, anadirla en `coordinates` con clave `city-country`.
- Si cambia color o tamano, tocar `colorFor` o `radiusFor`.
- Si cambia Highcharts, tocar `renderMap`.
- Comprobar `/analytics/citys-stats/map`.

Integraciones:

- Backend: `src/back/v1/citys-stats.js`.
- Open-Meteo: `getGeocoding`.
- REST Countries: `getCountryInfo`.
- World Bank: `getWorldBankPopulation`.
- APIs SOS externas: `getTouristArrivals`, `getEarthquakes` y `getFifaSquadValues`.
- Agregado local por pais: `buildCityCountrySummaries`.
- Union final: `buildIntegratedCity`.
- Errores: `fetchJson` y `safeExternal`.
- Frontend service: `citysStatsIntegrations.js`.
- Pantalla: `CitysStatsIntegrations.svelte`.
- Comprobar `/api/v1/citys-stats/integrations/summary` y `/integrations/citys-stats`.

Frase de defensa:

> Highcharts solo pinta datos. La informacion sale de nuestras APIs y se transforma antes de crear la serie.

## 10. Parte D03 LCC: `citys-stats`

### 10.1 Resumen para empezar

`citys-stats` permite consultar y gestionar estadisticas de poblacion estimada para ciudades en 2025. La parte D03 anade:

- CRUD completo con API v2.
- Visualizacion individual con Highcharts no lineal.
- Mapa geografico del recurso.
- Integracion por pais con APIs externas y APIs de otros alumnos.
- Proxy propio desde el backend.
- Participacion en el widget grupal de `/analytics`.

Frase clave:

> Mi recurso es `citys-stats`. En v2 tengo el CRUD principal con busqueda, filtros, paginacion y ordenacion. En v1 mantengo compatibilidad y concentro las integraciones externas. Para D03 he integrado por pais porque las APIs externas coinciden mucho mejor a nivel de pais que a nivel de ciudad.

### 10.2 APIs integradas por LCC

La vista `/integrations/citys-stats` integra por el campo `country`, porque asi se combinan muchos mas datos que por ciudad. Todas las integraciones hacen `fetch`, reciben JSON y se representan en HTML o en un widget Highcharts.

| API | Tipo requerido | Endpoint fuente | Endpoint local proxy | Uso en la vista |
| --- | --- | --- | --- | --- |
| Open-Meteo Geocoding | No SOS | `https://geocoding-api.open-meteo.com/v1/search` | `/api/v1/citys-stats/integrations/geocoding/:city` | Coordenadas aproximadas de la ciudad principal de cada pais |
| REST Countries | No SOS | `https://restcountries.com/v3.1/name/:country` | `/api/v1/citys-stats/integrations/country/:country` | Codigo ISO, region, capital y poblacion real del pais |
| World Bank Indicators | No SOS | `https://api.worldbank.org/v2/country/:code/indicator/SP.POP.TOTL` | `/api/v1/citys-stats/integrations/world-bank/:countryCode` | Poblacion nacional mas reciente |
| SOS2526-25 `international-tourist-arrivals` | Alumno SOS | `https://sos2526-25.onrender.com/api/v2/international-tourist-arrivals` | `/api/v1/citys-stats/integrations/sos-tourist-arrivals` | Llegadas turisticas por pais y ultimo anio disponible |
| SOS2526-19 `earthquakes` | Alumno SOS | `https://sos2526-19.onrender.com/api/v1/earthquakes` | `/api/v1/citys-stats/integrations/sos-earthquakes` | Severidad maxima y poblacion expuesta por pais |
| SOS2526-26 `fifa-squad-value-per-years` | Alumno SOS | `https://sos2526-26.onrender.com/api/v2/fifa-squad-value-per-years` | `/api/v1/citys-stats/integrations/sos-fifa-squad-values` | Valor de mercado de plantillas por pais y ultimo anio disponible |

### 10.3 Cumplimiento D03.B

- Al menos 5 APIs distintas: se usan 6.
- Al menos 3 APIs no realizadas por alumnos SOS: Open-Meteo, REST Countries y World Bank.
- Al menos 2 APIs realizadas por alumnos SOS de otros grupos: se usan 3, de los grupos 25, 19 y 26.
- Estilo RESTful y JSON: todas las fuentes se consumen mediante peticiones HTTP y se parsean como JSON.
- Uso de proxy propio: las llamadas externas se encapsulan en el backend Express.
- Sin JSON crudo en pantalla: el frontend muestra graficas, tarjetas, metricas y listas.
- Widget no `line`: la grafica de integraciones no usa `chart.type = "line"`.
- Vista requerida: todo se accede desde `/integrations/citys-stats`, enlazada desde `/integrations`.

### 10.4 Flujo tecnico de integraciones

1. El usuario abre `/integrations/citys-stats`.
2. El frontend llama a `getCitysStatsIntegrationSummary(limit)`.
3. El service `frontend-group/src/services/citysStatsIntegrations.js` hace `fetch` a `/api/v1/citys-stats/integrations/summary?limit=N`.
4. El backend lee los registros locales de `citys-stats`.
5. El backend agrega registros por `country` con `buildCityCountrySummaries`.
6. Para cada pais seleccionado, el backend consulta Open-Meteo y REST Countries.
7. Con el codigo ISO obtenido, consulta World Bank.
8. En paralelo obtiene y normaliza las APIs SOS externas.
9. El backend devuelve un JSON ya integrado por pais.
10. El frontend transforma ese JSON en series de Highcharts, tarjetas por API y detalle por pais.

### 10.5 Contrato del endpoint `summary`

Ruta:

```text
GET /api/v1/citys-stats/integrations/summary?limit=8
```

Respuesta principal:

```text
{
  count: number,
  localResource: "/api/v1/citys-stats/country-summaries",
  externalApis: string[],
  studentApis: object[],
  items: object[]
}
```

Campos relevantes de cada item:

| Campo | Significado |
| --- | --- |
| `country` | Pais usado como clave de integracion |
| `cityCount` | Numero de ciudades locales del pais |
| `totalPopulation2025` | Suma de poblacion estimada 2025 en `citys-stats` |
| `topCity` | Ciudad local mas poblada del pais |
| `geocoding` | Datos de Open-Meteo de la ciudad principal |
| `countryInfo` | Datos de REST Countries |
| `worldBankPopulation` | Poblacion nacional segun World Bank |
| `touristArrivals` | Datos agregados de llegadas turisticas |
| `earthquakeStats` | Datos agregados de terremotos |
| `fifaSquadValue` | Datos agregados de valor FIFA |
| `integrationErrors` | Errores parciales si una fuente externa falla |

### 10.6 Normalizacion de datos

El backend no pasa los datos externos directamente al frontend. Antes los normaliza:

- `normalizeCountryKey`: usa paises en minusculas y sin espacios extra para poder cruzar fuentes.
- `countryFromIso3`: convierte codigos ISO3 de la API de terremotos a nombres de pais comparables.
- `readFiniteNumber`: evita `NaN` y valores no numericos antes de crear metricas.
- `asArray`: protege el codigo si una API devuelve un objeto envoltorio en vez de un array directo.
- `normalizeTouristArrival`: calcula `totalArrivals` como suma de `air_arrival`, `water_arrival` y `land_arrival`.
- `normalizeEarthquake`: extrae severidad, profundidad, alerta y poblacion expuesta.
- `normalizeFifaSquadValue`: extrae valor total, valor medio, tamano de plantilla y anio.

### 10.7 Por que se integra por pais

La integracion inicial por ciudad era mas debil porque muchas APIs externas no tienen datos a nivel ciudad o no comparten exactamente los mismos nombres. El campo `country` es mucho mas estable:

- `citys-stats` ya tiene pais para cada ciudad.
- REST Countries y World Bank trabajan naturalmente por pais.
- Las APIs SOS externas tambien publican pais o ISO3.
- La grafica permite comparar paises con varias metricas simultaneas.

Esta decision mejora la defensa porque la grafica contiene mas informacion real y menos huecos.

### 10.8 Riesgos D03 y como explicarlos

| Riesgo | Explicacion para defensa |
| --- | --- |
| Una API externa esta dormida en Render | La vista no rompe; el backend captura errores parciales en `integrationErrors` |
| Una API devuelve array vacio | Se muestra la parte local y las demas fuentes disponibles |
| Los paises no coinciden exactamente | Se normalizan nombres y algunos ISO3 conocidos |
| World Bank necesita codigo ISO | Se obtiene desde REST Countries antes de consultar World Bank |
| Los datos tienen unidades distintas | La grafica combina ejes y tarjetas para evitar mezclar significados sin contexto |

## 11. Cambios que pueden pedir en directo

### 11.1 Estrategia ante un cambio grande

Di esto y luego actua en ese orden:

> Primero identifico si es cambio de contrato de API, de interfaz o de visualizacion. Si cambia el contrato, actualizo backend, frontend y tests. Si solo cambia visualizacion, lo limito al componente Svelte.

Orden seguro:

1. Backend: que la API responda bien.
2. Service frontend: que el frontend llame a la ruta correcta.
3. Pantalla Svelte: que el usuario pueda usarlo.
4. Tests: que el comportamiento quede fijado.
5. Build: que `public` quede actualizado.

### 11.2 Cambiar puerto

1. Abre `index.js`.
2. Busca `const port = process.env.PORT || 10000`.
3. Cambia `10000` por el puerto pedido, o explica que en despliegue manda `process.env.PORT`.
4. Arranca con `npm start`.
5. Comprueba el puerto que aparece en consola.

### 11.3 Cambiar donde se guarda una base

1. Abre `index.js`.
2. Busca el Datastore del recurso:
   - Desastres: `naturalDisastersDb`.
   - Ciudades: `citysStatsDb`.
   - Vinos: `wineStatsDb`.
3. Cambia la propiedad `filename`.
4. Arranca el servidor.
5. Comprueba que el archivo `.db` nuevo se crea o que la API lee los datos esperados.

### 11.4 Cambiar datos iniciales

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

### 11.5 Cambiar validaciones

Desastres:

1. Abre `src/back/v1/natural-disasters.js` y `src/back/v2/natural-disasters.js`.
2. Si cambian campos obligatorios, toca `REQUIRED_FIELDS`.
3. Si cambia la forma del body, toca `hasValidDisasterBody`.
4. Si cambia un filtro numerico o de query, toca `buildSearchQuery`.
5. Prueba un `POST` correcto y otro con campo de mas.

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

### 11.6 Anadir un campo

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
10. Edicion: abre `EditNaturalDisasters.svelte` y anade input, carga y guardado.
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
10. Edicion: abre `EditCitysStats.svelte` y anade input, carga y guardado.
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
10. Edicion: abre `EditWineStats.svelte` y anade input, carga y guardado.
11. Service: revisa `frontend-group/src/services/wine-stats.js`.
12. Tests: revisa `tests/RMP`.
13. Comprueba con `npm run test-RMP`.

Frase de defensa:

> Como la API exige estructura exacta, no basta con pintar un input. Hay que aceptar el campo en la validacion, guardarlo normalizado, mostrarlo en Svelte y actualizar los tests.

### 11.7 Renombrar un campo

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
7. Volver a ejecutar `rg "nombre_antiguo"` para confirmar que no quedan usos reales.

Riesgo:

- Es un cambio de contrato de API. Si lo cambias en backend pero no en frontend, la tabla queda vacia o aparecen valores `undefined`.

### 11.8 Permitir un campo opcional

Ahora varias APIs exigen estructura exacta. Si piden permitir un campo opcional:

1. Abre el archivo API del recurso.
2. Localiza `hasValidDisasterBody`, `hasExactCityFields` o `hasExactWineFields`.
3. Separa campos obligatorios y campos permitidos.
4. La validacion debe exigir obligatorios, pero no rechazar el opcional.
5. En `normalize...`, usa valor por defecto si no viene.
6. Prueba dos casos: body sin el campo opcional y body con el campo opcional.

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

### 11.9 Anadir un filtro

Desastres:

1. Abre `src/back/v2/natural-disasters.js`.
2. Toca `buildSearchQuery`.
3. Convierte el query param al tipo correcto.
4. Abre `NaturalDisastersStats.svelte`.
5. Anade input de busqueda.
6. Anade el parametro a la query string en la funcion `buscar`.
7. Revisa `natural-disasters.js` si hace falta.
8. Comprueba `/api/v2/natural-disasters?nuevoFiltro=valor`.

Ciudades:

1. Abre `src/back/v2/citys-stats.js`.
2. Toca el bloque `app.get(BASE_API_URL, ...)`.
3. Filtra `result` despues de leer los documentos.
4. Abre `CitysStats.svelte`.
5. Anade el campo a `emptySearchForm`.
6. Anade el input.
7. Anade el parametro en `buildSearchQuery`.
8. Comprueba `/api/v2/citys-stats?nuevoFiltro=valor`.

Vinos:

1. Abre `src/back/v1/wine-stats.js`.
2. Si el filtro es texto, revisa `TEXT_FILTER_FIELDS` y `applyTextFilters`.
3. Si el filtro es numerico, revisa `NUMBER_FILTER_FIELDS` y `applyNumberFilters`.
4. Abre `WineStats.svelte`.
5. Anade el campo a `filtros`.
6. Anade input en el buscador.
7. Anade el parametro en `buscarVinos`.
8. Comprueba `/api/v1/wine-stats?nuevoFiltro=valor`.

Ejemplo de filtro numerico en vinos:

1. Leer `request.query.max_price`.
2. Convertirlo con `Number`.
3. Si no es numero, devolver `400`.
4. Filtrar con `item.price <= maxPrice`.

Frase de defensa:

> Los query params llegan como texto, por eso siempre convierto y valido antes de filtrar.

### 11.10 Anadir busqueda parcial

Ejemplo: buscar vinos cuyo titulo contenga una palabra.

Toca:

- Backend: `src/back/v1/wine-stats.js`.
- Funcion: `applyTextFilters`.

Cambio conceptual:

```js
String(item[field]).toLowerCase().includes(requestedText)
```

Riesgo:

- Si los tests esperan una coincidencia exacta, habra que ajustarlos.

### 11.11 Anadir ordenacion

Ya existe en `citys-stats` v2 con `sort`.

Si es ciudades:

1. Abre `src/back/v2/citys-stats.js`.
2. Busca el bloque `if (req.query.sort !== undefined)`.
3. Anade el campo nuevo a `allowedFields`.
4. Comprueba `?sort=campo` y `?sort=-campo`.

Si es otro recurso:

1. Copia el patron de ciudades.
2. Usa `sort=campo` para ascendente.
3. Usa `sort=-campo` para descendente.
4. Valida con una lista `allowedFields`.
5. Si el campo no esta permitido, devuelve `400`.

Frase de defensa:

> No dejo ordenar por cualquier campo enviado por URL; uso una lista blanca para evitar comportamientos raros.

### 11.12 Cambiar paginacion

Donde mirar:

- Desastres: `getPagination` en `natural-disasters`.
- Ciudades: bloque `offset` y `limit` en `citys-stats`.
- Vinos: `readPagination` en `wine-stats`.

Si piden cambiar el limite por defecto:

- Desastres: cambiar `const limit = parseInt(queryParams.limit) || 100`.
- Ciudades: cambiar el valor inicial `limit = result.length`.
- Vinos: cambiar el segundo argumento de `readPagination(request.query, ...)`.

Pruebas:

- Probar `?offset=0&limit=2`.
- Probar un valor invalido para comprobar que devuelve `400`.

### 11.13 Cambiar un codigo HTTP

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
- Services frontend si dependen de un status concreto.

Frase de defensa:

> El codigo HTTP forma parte del contrato. Si lo cambio, actualizo los tests porque ellos documentan el comportamiento esperado.

### 11.14 Crear una ruta nueva de API

Ejemplo: `/api/v2/citys-stats/count`.

Pasos:

1. Abre el archivo API del recurso.
2. Decide metodo HTTP: `GET`, `POST`, `PUT` o `DELETE`.
3. Escribe la ruta con `app.get`, `app.post`, `app.put` o `app.delete`.
4. Pon la ruta concreta antes de rutas con parametros como `/:id` o `/:city/:country`.
5. Si devuelve documentos, limpia `_id` con `removeDatabaseId`.
6. Si se usa en frontend, crea funcion en el service del recurso.
7. Pintala en la pantalla si procede.
8. Crea o adapta tests.
9. Abre la URL nueva para comprobar.

Frase de defensa:

> En Express importa el orden: primero rutas concretas y luego rutas parametrizadas.

### 11.15 Crear una v3

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

Frase de defensa:

> Una version nueva no rompe la anterior. Mantengo v1/v2 funcionando y registro v3 como contrato adicional.

### 11.16 Cambiar el frontend para usar v1 en vez de v2

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

### 11.17 Cambiar rutas o paginas del frontend

Ruta con `#/`:

1. Crea o edita un componente en `frontend-group/src/routes`.
2. Abre `frontend-group/src/App.svelte`.
3. Importa el componente.
4. Anadelo al objeto `routes`.
5. Abre `Navbar.svelte` si quieres enlace visible.
6. Usa `href="/#/nueva-ruta"`.
7. Comprueba abriendo `/#/nueva-ruta`.

Ruta directa sin `#/`:

1. Haz lo anterior en `App.svelte`.
2. Anadela tambien a `directRoutes`.
3. Abre `index.js`.
4. Anade un `app.get("/ruta", ...)` que devuelva `frontendIndexPath`.
5. Comprueba abriendo `/ruta` directamente.

### 11.18 Modificar menu

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

### 11.19 Modificar portada

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

- Los tests de LCC pueden comprobar textos y `data-testid`, asi que no cambies ids sin actualizar `tests/LCC/e2e/citys-stats.spec.js`.

### 11.20 Cambiar tablas, formularios o mensajes

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

### 11.21 Cambiar una grafica Highcharts

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

### 11.22 Anadir una ciudad al mapa

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

### 11.23 Cambiar una integracion externa

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

### 11.24 Borrar base o recargar datos

Desde navegador:

- Entrar en la pantalla del recurso.
- Usar boton de borrar todos.
- Usar boton de cargar iniciales.

Desde API para ciudades:

```powershell
Invoke-RestMethod -Method Delete http://localhost:10000/api/v2/citys-stats
Invoke-RestMethod http://localhost:10000/api/v2/citys-stats/loadInitialData
```

Desde API para desastres:

```powershell
Invoke-RestMethod -Method Delete http://localhost:10000/api/v2/natural-disasters
Invoke-RestMethod http://localhost:10000/api/v2/natural-disasters/loadInitialData
```

Desde API para vinos:

```powershell
Invoke-RestMethod -Method Delete http://localhost:10000/api/v1/wine-stats
Invoke-RestMethod http://localhost:10000/api/v1/wine-stats/loadInitialData
```

## 12. Si algo falla durante la defensa

### 12.1 Falla `npm start`

Comprueba:

- Que estas en la raiz del proyecto.
- Que ejecutaste `npm install`.
- Que el puerto `10000` no esta ocupado.
- Que no hay un error de sintaxis en el ultimo archivo modificado.

Comando:

```bash
npm.cmd start
```

### 12.2 La web abre pero se ve antigua

Causa:

- Cambiaste frontend en `frontend-group/src`, pero `npm start` sirve `public`, que es el build compilado.

Solucion:

```bash
npm run build
npm start
```

### 12.3 PowerShell bloquea `npm`

Error habitual:

- `npm.ps1 no se puede cargar`.

Solucion rapida:

- Usar `npm.cmd install`, `npm.cmd start` o `npm.cmd run build`.

### 12.4 Puerto `10000` ocupado

Soluciones:

- Cerrar el proceso que usa el puerto.
- Cambiar la variable `PORT`.
- Cambiar temporalmente el puerto en `index.js` si el profesor lo pide.

### 12.5 La carga inicial dice que ya hay datos

Causa:

- La base `.db` no esta vacia.

Solucion:

- Borrar datos desde la interfaz.
- O hacer `DELETE` a la coleccion y luego llamar a `loadInitialData`.

### 12.6 Una API devuelve `400`

Significa normalmente:

- Body incompleto.
- Campo extra no permitido.
- Campo numerico que llega como texto no convertible.
- URL y body no coinciden en `PUT`.

Mira:

- `normalize...`
- `hasExact...`
- `hasValid...`

### 12.7 Una API devuelve `409`

Significa duplicado.

Donde se comprueba:

- Desastres: duplicado por `country` + `year`.
- Ciudades: duplicado por `city` + `country`.
- Vinos: duplicado por `title` + `year`.

### 12.8 Una API devuelve `404`

Significa que no existe el recurso concreto.

Mira:

- Si estas usando el identificador correcto.
- Si el texto esta normalizado en minusculas.
- Si el dato fue borrado antes en un test.

### 12.9 Una API devuelve `405`

Significa metodo no permitido.

Ejemplos:

- `POST /api/v2/citys-stats/tokyo/japan`
- `PUT /api/v2/citys-stats`

Frase de defensa:

> El 405 no es fallo, es una decision REST: no permitimos crear en la URL de un recurso concreto ni actualizar toda la coleccion con PUT.

### 12.10 Graficas o integraciones no cargan

Puede pasar por:

- Una API externa falla.
- Render esta dormido.
- Hay timeout.
- Hay un cambio en el formato de una API externa.

Donde mirar:

- `fetchJson` en `src/back/v1/citys-stats.js`.
- `safeExternal` para errores parciales.
- `integrationErrors` en la respuesta del summary.

Frase de defensa:

> Si una API externa falla, devolvemos el error controlado en `integrationErrors` y mantenemos los datos locales.

## 13. Preguntas probables y respuestas

### 13.1 Por que REST y no funciones tipo `/crearCiudad`

> Porque REST identifica recursos con URLs y usa el metodo HTTP para la accion. Es mas uniforme y documentable.

### 13.2 Por que `POST` crea en coleccion y no en recurso concreto

> Porque la coleccion es donde nace un nuevo recurso. La URL concreta se usa cuando el recurso ya esta identificado.

### 13.3 Por que `PUT` lleva identificador en URL

> Porque actualiza un recurso concreto. Ademas se comprueba que URL y body coincidan para no modificar otro registro por error.

### 13.4 Por que usar query params para busqueda y paginacion

> Porque no cambian el recurso base; solo cambian la vista o subconjunto de resultados.

### 13.5 Por que NeDB

> Porque para esta practica necesitamos persistencia sencilla en archivos locales. NeDB nos permite guardar documentos JSON sin montar un servidor de base de datos externo. Cada recurso tiene su propio `.db`, asi evitamos mezclar dominios.

### 13.6 Por que quitamos `_id`

> `_id` es un campo interno de NeDB. La API publica no debe depender de detalles de la base de datos, por eso usamos `removeDatabaseId` antes de responder.

### 13.7 Por que hay v1 y v2

> La v1 mantiene el contrato inicial. La v2 anade mejoras sin romper a clientes que usen v1. Por ejemplo, `citys-stats` v2 tiene `q` y `sort`; `natural-disasters` v2 tiene pais parcial y rango de anios.

### 13.8 Por que algunas rutas usan v1 en frontend

> El CRUD principal de ciudades usa v2, pero las integraciones estan implementadas en v1. Por eso `citysStatsIntegrations.js` apunta a `/api/v1/citys-stats`.

### 13.9 Por que `citys-stats` esta escrito asi

> Es el nombre historico del recurso en el proyecto. Lo mantengo para no romper rutas, tests, documentacion y enlaces ya entregados.

### 13.10 Por que usais claves compuestas en algunos recursos

> Porque no todos los datasets tienen un `id` natural. En desastres, `country` + `year` identifica un registro. En ciudades, `city` + `country` identifica una ciudad. En vinos si generamos `id` porque puede haber nombres repetidos o mas atributos.

### 13.11 Que pasa si mando un campo de mas

> En general se devuelve `400`, porque las validaciones exigen estructura exacta. Esto evita guardar datos inesperados y hace que el contrato de la API sea claro.

### 13.12 Por que algunas APIs devuelven `204` al borrar

> Porque el borrado ha ido bien y no hace falta devolver cuerpo. Es una respuesta REST habitual.

### 13.13 Que hace CORS

> Permite que el frontend en desarrollo, por ejemplo Vite en otro puerto, pueda llamar al backend de Express sin bloqueo del navegador.

### 13.14 Como se despliega el frontend

> El frontend Svelte se compila con Vite. El build acaba en `public`, y Express sirve esa carpeta con `express.static`.

### 13.15 Por que algunas rutas directas estan tambien en `index.js`

> Porque al abrir `/analytics` directamente, el navegador pide esa URL al servidor. Express debe devolver `public/index.html` para que Svelte cargue la pantalla correspondiente.

### 13.16 Como se protegen las llamadas externas

> `fetchJson` usa timeout, valida JSON y transforma errores. `safeExternal` evita que un fallo de una API externa rompa todo el resumen integrado.

### 13.17 Donde esta el proxy propio

> En `src/back/v1/citys-stats.js`, bajo las rutas `/api/v1/citys-stats/integrations/...`. El frontend llama a mi backend y mi backend llama a las APIs externas.

### 13.18 Que pasa si falla una API externa

> El backend usa funciones de captura de errores para que la vista no se caiga. Si una fuente falla, se devuelve el resto de datos y se informa en `integrationErrors`.

### 13.19 Por que no se muestra JSON crudo

> El JSON se usa como dato de entrada. En pantalla se transforma en grafica, tarjetas y listas HTML, que es lo que pide D03.

### 13.20 Como se relacionan los datos

> Primero agrego mi recurso por pais. Despues normalizo los paises de las APIs externas y los cruzo por la misma clave. Para terremotos tambien convierto algunos ISO3 a nombre de pais.

### 13.21 Que parte cumple la visualizacion grupal

> `/analytics` contiene un unico widget Highcharts que combina datos de `citys-stats`, `natural-disasters` y `wine-stats`. Usa columnas y ejes separados para no mezclar unidades.

### 13.22 Que pasa si Render esta dormido

> La primera peticion puede tardar mas porque Render despierta el servicio. Una vez despierto, las rutas cargan con normalidad.

### 13.23 Donde se ve el trabajo de grupo

> En los tres recursos, en el widget grupal `/analytics`, en `/integrations`, en tests y en la documentacion del README.

## 14. Checklists finales

### 14.1 Checklist antes de defender

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

### 14.2 Checklist despues de cualquier cambio

- Si tocaste backend, reinicia `npm start`.
- Si tocaste frontend y usas `npm start`, ejecuta `npm run build`.
- Si tocaste una API, prueba la ruta con navegador, Postman o `Invoke-RestMethod`.
- Si tocaste campos, busca el nombre antiguo con `rg`.
- Si tocaste rutas, revisa `App.svelte`, `Navbar.svelte` e `index.js`.
- Si tocaste textos que aparecen en tests, revisa Playwright.
- Si tocaste un recurso concreto, ejecuta su test Newman.

### 14.3 Checklist final LCC

- CRUD v2 accesible y documentado.
- Carga inicial disponible.
- Busqueda, filtros, paginacion y ordenacion preparados.
- Grafica individual no lineal.
- Mapa preparado.
- Integraciones por pais con 6 APIs.
- Al menos 3 APIs no SOS.
- Al menos 2 APIs SOS externas de otros grupos.
- Proxy propio en backend.
- Vista `/integrations` enlaza la parte LCC.
- Vista `/analytics` contiene un unico widget grupal.
- README actualizado con rutas, comandos y estado.

## 15. Pendiente fuera de LCC

Estos puntos no quedan resueltos solo con codigo LCC:

- Videos personales de menos de 5 minutos.
- Enlaces reales a videos en la vista `/about`.
- Informes Toggl en `efforts/MMMMM/summary.pdf` y `efforts/MMMMM/detailed.pdf`.
- Pull Request formal antes de la hora limite, asociada a issue en estado done y milestone o release D03.
- Partes individuales de otros miembros si todavia no estan completas.
