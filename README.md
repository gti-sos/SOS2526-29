# SOS2526-29

Aplicacion web de la asignatura SOS2526 para analizar datos de desastres naturales, estadisticas de ciudades y datos relacionados con vino. El backend esta hecho con Node.js, Express y NeDB. El frontend esta hecho con Svelte y se sirve desde la carpeta `public` cuando se despliega en Render.

## Equipo

- Rufino Moreno Pacheco: https://github.com/rufmorpac
- Luis Cortes Cobos: https://github.com/luicorcob
- Alberto Lirola Gomez: https://github.com/albertolg10

## Enlaces principales

- Repositorio: https://github.com/gti-sos/SOS2526-29
- Aplicacion desplegada: https://sos2526-29.onrender.com/
- Portada local: http://localhost:10000/
- Analytics grupal: https://sos2526-29.onrender.com/analytics
- Integraciones grupales: https://sos2526-29.onrender.com/integrations

## Recursos de la API

| Recurso | Miembro | API | Documentacion |
| --- | --- | --- | --- |
| `wine-stats` | Rufino Moreno Pacheco | https://sos2526-29.onrender.com/api/v1/wine-stats | https://sos2526-29.onrender.com/api/v1/wine-stats/docs |
| `citys-stats` | Luis Cortes Cobos | https://sos2526-29.onrender.com/api/v1/citys-stats | https://sos2526-29.onrender.com/api/v1/citys-stats/docs |
| `citys-stats` | Luis Cortes Cobos | https://sos2526-29.onrender.com/api/v2/citys-stats | https://sos2526-29.onrender.com/api/v2/citys-stats/docs |
| `natural-disasters` | Alberto Lirola Gomez | https://sos2526-29.onrender.com/api/v1/natural-disasters | https://sos2526-29.onrender.com/api/v1/natural-disasters/docs |
| `natural-disasters` | Alberto Lirola Gomez | https://sos2526-29.onrender.com/api/v2/natural-disasters | https://sos2526-29.onrender.com/api/v2/natural-disasters/docs |

## Rutas de frontend

| Vista | Ruta desplegada | Objetivo de defensa |
| --- | --- | --- |
| Portada | https://sos2526-29.onrender.com/ | Enlaces a recursos, APIs y documentacion |
| CRUD `citys-stats` | https://sos2526-29.onrender.com/citys-stats | Listar, buscar, crear, editar, borrar y cargar datos |
| Analytics individual LCC | https://sos2526-29.onrender.com/analytics/citys-stats | Grafico Highcharts no lineal del recurso |
| Mapa LCC | https://sos2526-29.onrender.com/analytics/citys-stats/map | Visualizacion geografica del recurso |
| Integraciones LCC | https://sos2526-29.onrender.com/integrations/citys-stats | 6 APIs integradas con datos JSON y widget no lineal |
| Analytics grupal | https://sos2526-29.onrender.com/analytics | Un unico widget combinado de los tres recursos |
| Integraciones grupales | https://sos2526-29.onrender.com/integrations | Entrada comun a las integraciones del grupo |

## Parte LCC: `citys-stats`

`citys-stats` gestiona estadisticas de poblacion estimada por ciudad y pais. La defensa de LCC usa la API v2 para el CRUD principal y la API v1 para integraciones externas y endpoints proxy.

### Endpoints principales LCC

| Endpoint | Uso |
| --- | --- |
| `GET /api/v2/citys-stats` | Listado principal con filtros, paginacion y ordenacion |
| `GET /api/v2/citys-stats/loadInitialData` | Carga de datos iniciales |
| `GET /api/v2/citys-stats?q=seo` | Busqueda libre por ciudad o pais |
| `GET /api/v2/citys-stats?sort=-un_2025_population&limit=5` | Ordenacion por poblacion descendente |
| `POST /api/v2/citys-stats` | Crear registro |
| `PUT /api/v2/citys-stats/:city/:country` | Editar registro |
| `DELETE /api/v2/citys-stats/:city/:country` | Borrar registro |
| `GET /api/v1/citys-stats/country-summaries` | Agregado local por pais para integraciones |
| `GET /api/v1/citys-stats/integrations/summary` | Resumen integrado por pais |

### Proxies e integraciones LCC

La vista `https://sos2526-29.onrender.com/integrations/citys-stats` integra por el campo `country`, porque asi se combinan muchos mas datos que por ciudad. Todas las integraciones hacen `fetch`, reciben JSON y se representan en HTML o en un widget Highcharts.

| API externa | Tipo | Endpoint local |
| --- | --- | --- |
| Open-Meteo Geocoding | No SOS | `/api/v1/citys-stats/integrations/geocoding/:city` |
| REST Countries | No SOS | `/api/v1/citys-stats/integrations/country/:country` |
| World Bank Indicators | No SOS | `/api/v1/citys-stats/integrations/world-bank/:countryCode` |
| SOS2526-25 `international-tourist-arrivals` | Alumno SOS | `/api/v1/citys-stats/integrations/sos-tourist-arrivals` |
| SOS2526-19 `earthquakes` | Alumno SOS | `/api/v1/citys-stats/integrations/sos-earthquakes` |
| SOS2526-26 `fifa-squad-value-per-years` | Alumno SOS | `/api/v1/citys-stats/integrations/sos-fifa-squad-values` |

Guia principal de defensa LCC: [docs/D03_DEFENSA_LCC.md](docs/D03_DEFENSA_LCC.md).

Guia de teoria y estilo para defensa: [docs/TEORIA_Y_ESTILO_DEFENSA.md](docs/TEORIA_Y_ESTILO_DEFENSA.md).

## Ejecutar en local

Requisitos: Node.js y npm instalados.

```powershell
npm.cmd install
npm.cmd --prefix frontend-group install
npm.cmd run build
npm.cmd start
```

La aplicacion queda disponible en `http://localhost:10000`.

Para trabajar con el frontend en modo desarrollo:

```powershell
npm.cmd --prefix frontend-group run dev
```

## Comandos utiles

```powershell
npm.cmd run build
npm.cmd run test-citys-stats
npm.cmd run test-citys-stats-v2
npm.cmd run test-LCC-e2e
npm.cmd run test-online-LCC
npm.cmd run test-online-LCC-v2
```

En PowerShell se recomienda usar `npm.cmd` para evitar el bloqueo habitual de `npm.ps1`.

## Checklist D03

- Parte LCC de CRUD, API v1/v2, analytics individual, mapa e integraciones: preparada.
- Integraciones LCC: 6 APIs REST con JSON, 3 no SOS y 3 APIs de alumnos SOS.
- Integracion LCC por proxy propio: preparada mediante endpoints bajo `/api/v1/citys-stats/integrations`.
- Analytics grupal: preparado en `/analytics` con un unico widget Highcharts no lineal.
- Integraciones grupales: preparadas en `/integrations`, con la parte LCC enlazada.
- Pendiente fuera de esta parte: videos personales, informes Toggl en `efforts/MMMMM`, PR formal asociada a issue done y milestone/release D03, y partes individuales de otros miembros si no estan terminadas.
