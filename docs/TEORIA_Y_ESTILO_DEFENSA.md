# Teoria y estilo para la defensa

Esta guia conecta las diapositivas del profesor con el codigo real del proyecto. La idea no es memorizar todo, sino saber explicar por que el proyecto esta organizado asi y donde se ve cada concepto.

## 1. Idea general del curso aplicada al proyecto

De L00 sale la idea principal: una aplicacion orientada a servicios separa frontend, backend, API REST, datos propios e integraciones externas.

En este proyecto se ve asi:

- Frontend: `frontend-group/src`, hecho con Svelte.
- Backend: `index.js` y `src/back`, hecho con Node.js y Express.
- API REST propia: rutas bajo `/api/v1/...` y `/api/v2/...`.
- Datos abiertos: tres recursos con datos mundiales.
- Sistema externo: APIs usadas en integraciones y widgets.
- Persistencia: NeDB guarda documentos JSON en archivos `.db`.

Frase de defensa:

> El proyecto sigue la arquitectura de la asignatura: Svelte en el cliente, Express en el servidor, API REST entre ambos, NeDB como persistencia local y APIs externas integradas mediante nuestro backend.

## 2. Herramientas de gestion y desarrollo

L01 y L02 insisten en GitHub, issues, milestones, Toggl/Clockify, Slack, Postman y trabajo en grupo.

En el repo se refleja en:

- `README.md`: enlaces principales, miembros, rutas, comandos y estado.
- `.github/`: configuracion relacionada con GitHub.
- `tests/*/*.json`: colecciones Postman/Newman.
- `playwright.config.js` y `tests/*/e2e`: pruebas end-to-end.
- Enlaces `/docs` de cada API: documentacion publicada en Postman.

Frase de defensa:

> GitHub no se usa solo para subir codigo; tambien documenta entregables, issues, milestones, pruebas y trazabilidad del trabajo del grupo.

## 3. Node, Express y servidor dinamico

L04 diferencia servidor estatico, servidor dinamico y Node/Express.

En el proyecto:

- `index.js` crea la aplicacion Express.
- `app.use(express.json())` permite leer cuerpos JSON en `POST` y `PUT`.
- `app.use(cors())` permite llamadas desde el frontend en desarrollo.
- `express.static("public")` sirve el frontend compilado.
- El fallback `app.get(/^\/(?!api\/).*/, ...)` devuelve la SPA para rutas directas.

Frase de defensa:

> Express sirve dos cosas: la API bajo `/api` y el frontend compilado desde `public`. Si una ruta no es API, se devuelve `index.html` para que Svelte resuelva la pantalla.

## 4. REST: recursos, URLs y metodos

L05 es la base teorica del backend REST:

- Una entidad o concepto se modela como recurso.
- Cada recurso tiene una URL de coleccion y una URL de elemento concreto.
- CRUD se expresa con metodos HTTP: `POST`, `GET`, `PUT`, `DELETE`.
- Los datos se intercambian como JSON.
- Las busquedas, paginacion y vistas se expresan con query params.
- Los estados HTTP forman parte del contrato.

En este proyecto:

| Recurso | Coleccion | Elemento concreto | Identificador |
| --- | --- | --- | --- |
| `natural-disasters` | `/api/v2/natural-disasters` | `/api/v2/natural-disasters/:country/:year` | `country` + `year` |
| `citys-stats` | `/api/v2/citys-stats` | `/api/v2/citys-stats/:city/:country` | `city` + `country` |
| `wine-stats` | `/api/v1/wine-stats` | `/api/v1/wine-stats/:id` | `id` |

Resumen de metodos:

- `GET /api/.../recurso`: lista recursos.
- `GET /api/.../recurso/:id`: obtiene un recurso concreto.
- `POST /api/.../recurso`: crea un recurso dentro de la coleccion.
- `PUT /api/.../recurso/:id`: actualiza un recurso concreto.
- `DELETE /api/.../recurso`: borra toda la coleccion.
- `DELETE /api/.../recurso/:id`: borra un recurso concreto.

Frase de defensa:

> No usamos verbos en la URL porque el verbo ya lo marca el metodo HTTP. La URL identifica el recurso y el metodo indica la operacion.

## 5. Codigos HTTP que hay que justificar

| Codigo | Uso en defensa |
| --- | --- |
| `200` | Lectura o actualizacion correcta con respuesta. |
| `201` | Recurso creado o datos iniciales insertados. |
| `204` | Borrado correcto sin cuerpo de respuesta. |
| `400` | Body, query param o coincidencia URL/body invalida. |
| `404` | Recurso concreto no encontrado. |
| `405` | Metodo no permitido para esa URL. |
| `409` | Conflicto por duplicado o coleccion ya cargada. |
| `500` | Error interno de servidor o base de datos. |
| `502` | Error controlado al consultar una API externa. |

Frase de defensa:

> El codigo HTTP tambien documenta el contrato de la API. Si envio un body con campos de mas, es `400`; si creo algo repetido, es `409`; si pido algo que no existe, es `404`.

## 6. Versionado de APIs

L05 menciona versionado como alternativa para evolucionar una API sin romper clientes.

En el proyecto:

- `src/back/v1`: contrato inicial y compatibilidad.
- `src/back/v2`: mejoras de busqueda, rangos, ordenacion o paginacion.
- El frontend de `citys-stats` usa v2 para CRUD.
- Las integraciones de `citys-stats` siguen en v1 porque ahi vive el proxy externo.

Frase de defensa:

> La v2 no sustituye borrando la v1; convive con ella. Asi mantenemos compatibilidad y podemos anadir mejoras sin romper rutas ya entregadas.

## 7. NeDB, Postman, Newman y CI

L06 apunta a NeDB, Postman y pipeline CI/CD.

En el repo:

- `@seald-io/nedb` aparece en `package.json`.
- Cada recurso tiene su propio `.db`, configurado en `index.js`.
- `removeDatabaseId` oculta `_id`, porque es un detalle interno de NeDB.
- Los tests Postman/Newman estan en `tests/ALG`, `tests/LCC` y `tests/RMP`.
- Los scripts `npm run test-*` ejecutan esos tests.

Frase de defensa:

> NeDB nos da persistencia local en documentos JSON. La API no expone `_id` porque pertenece al almacenamiento, no al contrato publico.

## 8. Frontend Svelte y servicios `fetch`

L07 introduce el frontend con Svelte y la construccion con Vite.

En el proyecto:

- `frontend-group/src/App.svelte` registra rutas.
- `frontend-group/src/components/Navbar.svelte` define navegacion.
- `frontend-group/src/routes` contiene pantallas.
- `frontend-group/src/services` contiene funciones `fetch`.
- `frontend-group/vite.config.js` compila hacia `../public`.

Frase de defensa:

> El frontend no accede a la base de datos. Solo llama a la API con `fetch`; Express valida y responde JSON.

## 9. Pruebas e2e

L09 habla de pruebas end-to-end.

En el proyecto:

- Playwright esta en `devDependencies`.
- `tests/*/e2e/*.spec.js` prueba flujos reales de navegador.
- `npm run test-LCC-e2e` ejecuta la parte e2e de `citys-stats`.

Frase de defensa:

> Newman comprueba contrato de API y Playwright comprueba flujos de usuario en navegador. Son capas de prueba distintas.

## 10. Visualizacion

L10 pide visualizacion con widget no `line`, grafico grupal y, como extra, mapa o bibliotecas adicionales.

En el proyecto:

- `frontend-group/src/routes/GroupAnalytics.svelte`: widget grupal con datos de los tres recursos.
- `frontend-group/src/routes/CitysStatsAnalytics.svelte`: grafica individual de ciudades.
- `frontend-group/src/routes/CitysStatsMapAnalytics.svelte`: mapa.
- `frontend-group/src/routes/CitysStatsIntegrations.svelte`: widget de integraciones.

Frase de defensa:

> Highcharts no es la fuente de datos; solo representa los datos que vienen de nuestras APIs y de las integraciones normalizadas.

## 11. Integracion, SOP y proxy

L11 explica la Same Origin Policy y la solucion de proxy propio.

En el proyecto:

- El frontend llama a `/api/v1/citys-stats/integrations/...`.
- Express llama desde backend a Open-Meteo, REST Countries, World Bank y APIs SOS externas.
- `fetchJson` controla JSON, estados HTTP y timeout.
- `safeExternal` evita que una API externa rompa toda la vista.
- `integrationErrors` informa errores parciales.

Frase de defensa:

> Las integraciones pasan por nuestro backend para evitar problemas de origen, controlar errores y devolver un JSON ya normalizado al frontend.

## 12. Estilo del codigo que conviene explicar

El estilo no es casual; responde a ideas de las diapositivas:

- Un modulo por recurso y version: facilita localizar contratos REST.
- Constantes al principio: rutas base, URLs de docs, APIs externas y datos iniciales.
- Helpers antes de rutas: validacion, normalizacion, paginacion y limpieza de `_id`.
- Rutas concretas antes que rutas con parametros: evita que Express confunda `/docs` o `/loadInitialData` con `/:id`.
- Validacion estricta del body: el contrato JSON queda claro y los errores son `400`.
- Identificadores estables: claves compuestas cuando no hay `id` natural; `id` generado para vinos.
- Respuestas sin `_id`: se separa persistencia de API publica.
- Proxy en backend: el navegador no carga APIs externas directamente.
- Services Svelte separados: las pantallas no duplican URLs ni parsing de errores.

Frase de defensa:

> El codigo esta organizado por capas: servidor, modulos REST, servicios frontend y pantallas. Eso hace que un cambio de contrato, interfaz o visualizacion tenga un sitio claro.

## 13. Preguntas teoricas probables

**Por que REST y no funciones tipo `/crearCiudad`?**

Porque REST identifica recursos con URLs y usa el metodo HTTP para la accion. Es mas uniforme y documentable.

**Por que `POST` crea en coleccion y no en recurso concreto?**

Porque la coleccion es donde nace un nuevo recurso. La URL concreta se usa cuando el recurso ya esta identificado.

**Por que `PUT` lleva identificador en URL?**

Porque actualiza un recurso concreto. Ademas se comprueba que URL y body coincidan para no modificar otro registro por error.

**Por que usar query params para busqueda y paginacion?**

Porque no cambian el recurso base; solo cambian la vista o subconjunto de resultados.

**Por que no exponer `_id`?**

Porque es interno de NeDB. La API publica debe depender de campos del dominio, no de detalles de almacenamiento.

**Por que algunas APIs devuelven `204` al borrar?**

Porque el borrado ha ido bien y no hace falta devolver cuerpo. Es una respuesta REST habitual.

**Por que `citys-stats` esta escrito asi?**

Porque es el nombre publicado del recurso. Cambiarlo romperia rutas, tests y documentacion.

**Que pasa si una API externa falla?**

La respuesta no se cae entera. El backend devuelve los datos disponibles y deja el fallo en `integrationErrors`.

**Donde se ve el trabajo de grupo?**

En los tres recursos, en el widget grupal `/analytics`, en `/integrations`, en tests y en la documentacion del README.

## 14. Mini guion de 90 segundos

1. `index.js`: "Aqui arranca Express, se abren las bases NeDB, se registran APIs y se sirve Svelte compilado".
2. `src/back/v2/citys-stats.js`: "Aqui esta el contrato REST principal de mi recurso: GET, POST, PUT, DELETE, filtros, ordenacion y paginacion".
3. `frontend-group/src/services/citysStatsApi.js`: "Aqui Svelte llama al backend con fetch".
4. `frontend-group/src/routes/CitysStats.svelte`: "Aqui esta el CRUD visible".
5. `src/back/v1/citys-stats.js`: "Aqui estan los proxies e integraciones por backend".
6. `frontend-group/src/routes/GroupAnalytics.svelte`: "Aqui se cumple el widget grupal no lineal".
