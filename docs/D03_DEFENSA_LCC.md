# D03 Defensa LCC: `citys-stats`

Documento unico para preparar y defender la parte de Luis Cortes Cobos en D03. Incluye guion, rutas, endpoints, integraciones, cumplimiento de requisitos, preguntas probables y checklist final.

## 1. Resumen para empezar

`citys-stats` permite consultar y gestionar estadisticas de poblacion estimada para ciudades en 2025. La parte D03 anade:

- CRUD completo con API v2.
- Visualizacion individual con Highcharts no lineal.
- Mapa geografico del recurso.
- Integracion por pais con APIs externas y APIs de otros alumnos.
- Proxy propio desde el backend.
- Participacion en el widget grupal de `/analytics`.

Frase clave:

> Mi recurso es `citys-stats`. En v2 tengo el CRUD principal con busqueda, filtros, paginacion y ordenacion. En v1 mantengo compatibilidad y concentro las integraciones externas. Para D03 he integrado por pais porque las APIs externas coinciden mucho mejor a nivel de pais que a nivel de ciudad.

## 2. Rutas que conviene abrir

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

## 3. Guion de defensa en 4 minutos

### 3.1 Portada y contexto

Frase:

> Esta es la aplicacion del grupo SOS2526-29. Tenemos tres recursos: `wine-stats`, `citys-stats` y `natural-disasters`. Mi parte es `citys-stats`, centrada en ciudades, paises y poblacion estimada para 2025.

Mostrar:

- Portada `/`.
- Enlaces de API y documentacion.
- Barra de navegacion hacia ciudades, analytics e integraciones.

### 3.2 API y CRUD

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

### 3.3 Analytics individual

Frase:

> Esta vista cumple la visualizacion individual de D03. Usa Highcharts y no es de tipo `line`. La grafica representa la poblacion estimada de los registros del recurso.

Mostrar:

- `/analytics/citys-stats`.
- Tipo de grafica.
- Datos procedentes de la API propia.

### 3.4 Mapa

Frase:

> El mapa ayuda a interpretar los datos geograficamente. Las burbujas representan ciudades del recurso y su poblacion estimada.

Mostrar:

- `/analytics/citys-stats/map`.
- Una burbuja o tooltip.

### 3.5 Integraciones

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

### 3.6 Analytics grupal

Frase:

> En `/analytics` hay un unico widget combinado con los datos de los tres recursos del grupo. No es `line`, y combina recuentos e indicadores principales normalizados.

Mostrar:

- `/analytics`.
- Las tres series o categorias del grupo.

## 4. APIs integradas por LCC

La vista `/integrations/citys-stats` integra por el campo `country`, porque asi se combinan muchos mas datos que por ciudad. Todas las integraciones hacen `fetch`, reciben JSON y se representan en HTML o en un widget Highcharts.

| API | Tipo requerido | Endpoint fuente | Endpoint local proxy | Uso en la vista |
| --- | --- | --- | --- | --- |
| Open-Meteo Geocoding | No SOS | `https://geocoding-api.open-meteo.com/v1/search` | `/api/v1/citys-stats/integrations/geocoding/:city` | Coordenadas aproximadas de la ciudad principal de cada pais |
| REST Countries | No SOS | `https://restcountries.com/v3.1/name/:country` | `/api/v1/citys-stats/integrations/country/:country` | Codigo ISO, region, capital y poblacion real del pais |
| World Bank Indicators | No SOS | `https://api.worldbank.org/v2/country/:code/indicator/SP.POP.TOTL` | `/api/v1/citys-stats/integrations/world-bank/:countryCode` | Poblacion nacional mas reciente |
| SOS2526-25 `international-tourist-arrivals` | Alumno SOS | `https://sos2526-25.onrender.com/api/v2/international-tourist-arrivals` | `/api/v1/citys-stats/integrations/sos-tourist-arrivals` | Llegadas turisticas por pais y ultimo anio disponible |
| SOS2526-19 `earthquakes` | Alumno SOS | `https://sos2526-19.onrender.com/api/v1/earthquakes` | `/api/v1/citys-stats/integrations/sos-earthquakes` | Severidad maxima y poblacion expuesta por pais |
| SOS2526-26 `fifa-squad-value-per-years` | Alumno SOS | `https://sos2526-26.onrender.com/api/v2/fifa-squad-value-per-years` | `/api/v1/citys-stats/integrations/sos-fifa-squad-values` | Valor de mercado de plantillas por pais y ultimo anio disponible |

## 5. Cumplimiento D03.B

- Al menos 5 APIs distintas: se usan 6.
- Al menos 3 APIs no realizadas por alumnos SOS: Open-Meteo, REST Countries y World Bank.
- Al menos 2 APIs realizadas por alumnos SOS de otros grupos: se usan 3, de los grupos 25, 19 y 26.
- Estilo RESTful y JSON: todas las fuentes se consumen mediante peticiones HTTP y se parsean como JSON.
- Uso de proxy propio: las llamadas externas se encapsulan en el backend Express.
- Sin JSON crudo en pantalla: el frontend muestra graficas, tarjetas, metricas y listas.
- Widget no `line`: la grafica de integraciones no usa `chart.type = "line"`.
- Vista requerida: todo se accede desde `/integrations/citys-stats`, enlazada desde `/integrations`.

## 6. Flujo tecnico de integraciones

1. El usuario abre `/integrations/citys-stats`.
2. El frontend llama a `getCitysStatsIntegrationSummary(limit)`.
3. El servicio `frontend-group/src/services/citysStatsIntegrations.js` hace `fetch` a `/api/v1/citys-stats/integrations/summary?limit=N`.
4. El backend lee los registros locales de `citys-stats`.
5. El backend agrega registros por `country` con `buildCityCountrySummaries`.
6. Para cada pais seleccionado, el backend consulta Open-Meteo y REST Countries.
7. Con el codigo ISO obtenido, consulta World Bank.
8. En paralelo obtiene y normaliza las APIs SOS externas.
9. El backend devuelve un JSON ya integrado por pais.
10. El frontend transforma ese JSON en series de Highcharts, tarjetas por API y detalle por pais.

## 7. Contrato del endpoint `summary`

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

## 8. Normalizacion de datos

El backend no pasa los datos externos directamente al frontend. Antes los normaliza:

- `normalizeCountryKey`: usa paises en minusculas y sin espacios extra para poder cruzar fuentes.
- `countryFromIso3`: convierte codigos ISO3 de la API de terremotos a nombres de pais comparables.
- `readFiniteNumber`: evita `NaN` y valores no numericos antes de crear metricas.
- `asArray`: protege el codigo si una API devuelve un objeto envoltorio en vez de un array directo.
- `normalizeTouristArrival`: calcula `totalArrivals` como suma de `air_arrival`, `water_arrival` y `land_arrival`.
- `normalizeEarthquake`: extrae severidad, profundidad, alerta y poblacion expuesta.
- `normalizeFifaSquadValue`: extrae valor total, valor medio, tamano de plantilla y anio.

## 9. Por que se integra por pais

La integracion inicial por ciudad era mas debil porque muchas APIs externas no tienen datos a nivel ciudad o no comparten exactamente los mismos nombres. El campo `country` es mucho mas estable:

- `citys-stats` ya tiene pais para cada ciudad.
- REST Countries y World Bank trabajan naturalmente por pais.
- Las APIs SOS externas tambien publican pais o ISO3.
- La grafica permite comparar paises con varias metricas simultaneas.

Esta decision mejora la defensa porque la grafica contiene mas informacion real y menos huecos.

## 10. Codigo que conviene saber localizar

| Archivo | Que contiene |
| --- | --- |
| `index.js` | Configuracion Express, bases NeDB, APIs y fallback de la SPA |
| `src/back/v2/citys-stats.js` | CRUD principal de LCC |
| `src/back/v1/citys-stats.js` | API v1, agregados por pais, proxies e integraciones |
| `frontend-group/src/routes/CitysStats.svelte` | Pantalla CRUD |
| `frontend-group/src/routes/CitysStatsAnalytics.svelte` | Grafica individual |
| `frontend-group/src/routes/CitysStatsMapAnalytics.svelte` | Mapa |
| `frontend-group/src/routes/CitysStatsIntegrations.svelte` | Vista de integraciones |
| `frontend-group/src/routes/GroupAnalytics.svelte` | Widget grupal |
| `frontend-group/src/routes/GroupIntegrations.svelte` | Entrada de integraciones del grupo |
| `frontend-group/src/services/citysStatsApi.js` | Fetch al CRUD v2 |
| `frontend-group/src/services/citysStatsIntegrations.js` | Fetch a integraciones v1 |

## 11. Preguntas probables

### Por que hay v1 y v2

> La v1 conserva compatibilidad con el contrato anterior y aloja las integraciones. La v2 es la API principal del CRUD porque incorpora mejoras como busqueda libre, ordenacion, paginacion y validaciones mas completas.

### Por que `citys-stats` se escribe asi

> Es el nombre historico del recurso en el proyecto. Lo mantengo para no romper rutas, tests, documentacion y enlaces ya entregados.

### Donde esta el proxy propio

> En `src/back/v1/citys-stats.js`, bajo las rutas `/api/v1/citys-stats/integrations/...`. El frontend llama a mi backend y mi backend llama a las APIs externas.

### Que pasa si falla una API externa

> El backend usa funciones de captura de errores para que la vista no se caiga. Si una fuente falla, se devuelve el resto de datos y se informa en `integrationErrors`.

### Por que no se muestra JSON crudo

> El JSON se usa como dato de entrada. En pantalla se transforma en grafica, tarjetas y listas HTML, que es lo que pide D03.

### Como se relacionan los datos

> Primero agrego mi recurso por pais. Despues normalizo los paises de las APIs externas y los cruzo por la misma clave. Para terremotos tambien convierto algunos ISO3 a nombre de pais.

### Que parte cumple la visualizacion grupal

> `/analytics` contiene un unico widget Highcharts que combina datos de `citys-stats`, `natural-disasters` y `wine-stats`. Usa columnas y ejes separados para no mezclar unidades.

### Que pasa si Render esta dormido

> La primera peticion puede tardar mas porque Render despierta el servicio. Una vez despierto, las rutas cargan con normalidad.

## 12. Endpoints para probar rapidamente

Local:

```text
http://localhost:10000/
http://localhost:10000/citys-stats
http://localhost:10000/analytics
http://localhost:10000/integrations
http://localhost:10000/integrations/citys-stats
http://localhost:10000/api/v1/citys-stats/country-summaries?limit=8
http://localhost:10000/api/v1/citys-stats/integrations/summary?limit=8
http://localhost:10000/api/v1/citys-stats/integrations/sos-tourist-arrivals
http://localhost:10000/api/v1/citys-stats/integrations/sos-earthquakes
http://localhost:10000/api/v1/citys-stats/integrations/sos-fifa-squad-values
```

Render:

```text
https://sos2526-29.onrender.com/
https://sos2526-29.onrender.com/citys-stats
https://sos2526-29.onrender.com/analytics
https://sos2526-29.onrender.com/integrations
https://sos2526-29.onrender.com/integrations/citys-stats
https://sos2526-29.onrender.com/api/v1/citys-stats/country-summaries?limit=8
https://sos2526-29.onrender.com/api/v1/citys-stats/integrations/summary?limit=8
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

## 13. Comandos utiles

Build:

```powershell
npm.cmd run build
```

Tests LCC:

```powershell
npm.cmd run test-citys-stats
npm.cmd run test-citys-stats-v2
npm.cmd run test-LCC-e2e
```

Arranque local:

```powershell
npm.cmd start
```

## 14. Riesgos y como explicarlos

| Riesgo | Explicacion para defensa |
| --- | --- |
| Una API externa esta dormida en Render | La vista no rompe; el backend captura errores parciales en `integrationErrors` |
| Una API devuelve array vacio | Se muestra la parte local y las demas fuentes disponibles |
| Los paises no coinciden exactamente | Se normalizan nombres y algunos ISO3 conocidos |
| World Bank necesita codigo ISO | Se obtiene desde REST Countries antes de consultar World Bank |
| Los datos tienen unidades distintas | La grafica combina ejes y tarjetas para evitar mezclar significados sin contexto |

## 15. Checklist final LCC

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

## 16. Pendiente fuera de LCC

Estos puntos no quedan resueltos solo con codigo LCC:

- Videos personales de menos de 5 minutos.
- Enlaces reales a videos en la vista `/about`.
- Informes Toggl en `efforts/MMMMM/summary.pdf` y `efforts/MMMMM/detailed.pdf`.
- Pull Request formal antes de la hora limite, asociada a issue en estado done y milestone o release D03.
- Partes individuales de otros miembros si todavia no estan completas.

