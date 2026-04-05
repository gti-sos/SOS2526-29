## SOS2526-29

- **Team**
  - Rufino Moreno Pacheco (https://github.com/rufmorpac)
  - Luis Cortes Cobos (https://github.com/luicorcob)
  - Alberto Lirola Gomez (https://github.com/albertolg10)

- **Project description**: Our project analyzes the correlation between natural disasters, city statistics and wine-related data.

- **Repository**: https://github.com/gti-sos/SOS2526-29

- **URL**: https://sos2526-29.onrender.com/

- **APIs**:
  - https://sos2526-29.onrender.com/api/v1/wine-stats/docs (developed by Rufino Moreno Pacheco)
  - https://sos2526-29.onrender.com/api/v1/citys-stats/docs (developed by Luis Cortes Cobos - v1)
  - https://sos2526-29.onrender.com/api/v2/citys-stats/docs (developed by Luis Cortes Cobos - v2)
  - https://sos2526-29.onrender.com/api/v1/natural-disasters/docs (developed by Alberto Lirola Gomez - v1)
  - https://sos2526-29.onrender.com/api/v2/natural-disasters/docs (developed by ALbero Lirola Gomez - v2)

## Parte LCC: citys-stats

- **Descripcion breve**: `citys-stats` gestiona estadisticas de poblacion estimada para ciudades y paises.
- **Frontend desplegado**: https://sos2526-29.onrender.com/#/citys-stats
- **API v1**: https://sos2526-29.onrender.com/api/v1/citys-stats
- **API v2**: https://sos2526-29.onrender.com/api/v2/citys-stats
- **Documentacion Postman v1**: https://sos2526-29.onrender.com/api/v1/citys-stats/docs
- **Documentacion Postman v2**: https://sos2526-29.onrender.com/api/v2/citys-stats/docs
- **Fuente de datos asociada**: citys-stats

### Ejecutar en local

1. `npm install`
2. `npm --prefix frontend-group install`
3. `npm start`

El backend y el frontend compilado quedan disponibles en `http://localhost:10000`.

Si quieres trabajar con el frontend de `citys-stats` en modo desarrollo:

1. `cd frontend-group`
2. `npm exec vite -- --configLoader native`

### Probar la parte LCC

- API v1: `npm run test-citys-stats`
- API v2: `npm run test-citys-stats-v2`
- E2E Playwright: `npm run test-LCC-e2e`
- Documentacion online v1: `npm run test-online-LCC`
- Documentacion online v2: `npm run test-online-LCC-v2`
