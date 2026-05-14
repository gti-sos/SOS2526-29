// =============================================================================
// API REST v2 para el recurso citys-stats
// =============================================================================
//
// Este módulo registra todas las rutas de la API v2 para gestionar estadísticas
// de población de ciudades.
//
// Sigue un patrón REST:
// - URL de colección:
//   /api/v2/citys-stats
//
// - URL de recurso concreto:
//   /api/v2/citys-stats/:city/:country
//
// Métodos HTTP usados:
// - GET    → obtener datos
// - POST   → crear datos
// - PUT    → actualizar datos
// - DELETE → borrar datos
//
// Se usa una base de datos NeDB, recibida como parámetro "db".
//
// =============================================================================
// FLUJO GENERAL DE ESTA API V2
// =============================================================================
//
// Este archivo se carga una vez cuando arranca el servidor.
// En ese momento se crean constantes, se declaran funciones y se registran rutas.
// Las funciones auxiliares NO se ejecutan al declararse.
// Las rutas NO se ejecutan al registrarse.
// Una ruta se ejecuta solo cuando llega una peticion con su metodo y URL.
// Encima de cada app.get/app.post/app.put/app.delete esta su flujo real.
module.exports = (app, db) => {

    // -------------------------------------------------------------------------
    // Constantes generales
    // -------------------------------------------------------------------------

    // Ruta base de esta API.
    // Todas las rutas empiezan por esta URL.
    const BASE_API_URL = "/api/v2/citys-stats";

    // URL de la documentación de Postman.
    // Si existe una variable de entorno LCC_DOCS_V2_URL, se usa esa.
    // Si no existe, se usa la URL fija indicada.
    const DOCS_URL =
        process.env.LCC_DOCS_V2_URL ||
        "https://documenter.getpostman.com/view/52412147/2sBXiqEUAv";

    // Datos iniciales de ejemplo.
    // Estos datos se insertan cuando la base de datos está vacía
    // y se llama al endpoint /loadInitialData.
    const initialData = [
        { city: "jakarta", country: "indonesia", un_2025_population: 41913860 },
        { city: "dhaka", country: "bangladesh", un_2025_population: 36585479 },
        { city: "tokyo", country: "japan", un_2025_population: 33412512 },
        { city: "delhi", country: "india", un_2025_population: 30222405 },
        { city: "shanghai", country: "china", un_2025_population: 29558908 },
        { city: "guangzhou", country: "china", un_2025_population: 27563372 },
        { city: "cairo", country: "egypt", un_2025_population: 25566102 },
        { city: "manila", country: "philippines", un_2025_population: 24735305 },
        { city: "kolkata", country: "india", un_2025_population: 22549738 },
        { city: "seoul", country: "south-korea", un_2025_population: 22490482 },
        { city: "karachi", country: "pakistan", un_2025_population: 21422590 },
        { city: "mumbai", country: "india", un_2025_population: 20203056 }
    ];

    // -------------------------------------------------------------------------
    // Funciones auxiliares
    // -------------------------------------------------------------------------

    // NeDB añade automáticamente un campo interno llamado "_id" a cada documento.
    // Como ese campo no forma parte del recurso de la API, se elimina antes de
    // devolver los datos al cliente.
    function removeDatabaseId(doc) {
        // Si no hay documento, se devuelve tal cual.
        // Esto evita errores si doc es null o undefined.
        if (!doc) return doc;

        // Se separa _id del resto de campos.
        // "_id" se descarta y "rest" contiene solo los campos útiles.
        const { _id, ...rest } = doc;

        // Se devuelve el documento sin el campo interno _id.
        return rest;
    }

    // Comprueba que el body recibido tenga exactamente los campos esperados:
    // - city
    // - country
    // - un_2025_population
    //
    // No permite campos de más ni campos de menos.
    function hasExactCityFields(body) {
        // Primero se comprueba que el body exista,
        // que sea un objeto y que no sea un array.
        if (!body || typeof body !== "object" || Array.isArray(body)) return false;

        // Lista de campos que debe tener obligatoriamente el recurso.
        const expected = ["city", "country", "un_2025_population"].sort();

        // Campos que realmente vienen en el body de la petición.
        const keys = Object.keys(body).sort();

        // Se comprueba:
        // 1. Que tengan el mismo número de campos.
        // 2. Que cada campo coincida exactamente con el esperado.
        return keys.length === expected.length &&
            keys.every((k, i) => k === expected[i]);
    }

    // Limpia, normaliza y valida un registro de ciudad.
    //
    // Esta función se usa en POST y PUT para asegurarse de que los datos recibidos
    // son correctos antes de guardarlos en la base de datos.
    function normalizeCityStat(body) {
        // Si el body no tiene exactamente los campos esperados,
        // se devuelve null para indicar que no es válido.
        if (!hasExactCityFields(body)) return null;

        // Se convierte la ciudad a texto, se eliminan espacios al principio/final
        // y se pasa a minúsculas para mantener un formato uniforme.
        const city = String(body.city).trim().toLowerCase();

        // Se hace lo mismo con el país.
        const country = String(body.country).trim().toLowerCase();

        // Se convierte la población a número.
        const un_2025_population = Number(body.un_2025_population);

        // Validaciones importantes:
        // - city no puede estar vacío.
        // - country no puede estar vacío.
        // - un_2025_population debe ser un número entero.
        // - un_2025_population debe ser mayor que 0.
        if (
            !city ||
            !country ||
            !Number.isInteger(un_2025_population) ||
            un_2025_population <= 0
        ) {
            return null;
        }

        // Si todo es correcto, se devuelve el objeto normalizado.
        return { city, country, un_2025_population };
    }

    // RUTA:
    // GET /api/v2/citys-stats/docs
    //
    // CABECERA:
    // app.get(`${BASE_API_URL}/docs`, (req, res) => { ... });
    //
    // TIPO:
    // Sincrona.
    //
    // FLUJO:
    // 1. Entra cuando alguien pide /docs.
    // 2. Redirige a DOCS_URL.
    //
    // USA:
    // - DOCS_URL
    //
    // RESPUESTA:
    // - Redirect a Postman.
    app.get(`${BASE_API_URL}/docs`, (req, res) => {
        // res.redirect envía al navegador a la URL de documentación.
        res.redirect(DOCS_URL);
    });

    // RUTA:
    // GET /api/v2/citys-stats/loadInitialData
    //
    // CABECERA:
    // app.get(`${BASE_API_URL}/loadInitialData`, (req, res) => { ... });
    //
    // TIPO:
    // Usa callbacks de NeDB.
    //
    // FLUJO:
    // 1. Cuenta registros con db.count.
    // 2. Si ya hay datos, hace db.find.
    // 3. Si no hay datos, hace db.insert(initialData).
    // 4. Quita _id antes de responder.
    //
    // USA:
    // - removeDatabaseId
    // - initialData
    //
    // RESPUESTA:
    // - 200 con datos existentes.
    // - 201 con datos creados.
    // - 500 si falla la base de datos.
    app.get(`${BASE_API_URL}/loadInitialData`, (req, res) => {

        // db.count cuenta cuántos documentos hay en la colección.
        // El filtro {} significa "contar todos los documentos".
        db.count({}, (err, count) => {

            // Si ocurre un error en la base de datos, se devuelve error 500.
            if (err) return res.sendStatus(500);

            // Si ya hay datos en la base de datos, no se insertan otra vez.
            if (count > 0) {

                // Se buscan todos los documentos existentes.
                db.find({}, (err2, docs) => {
                    if (err2) return res.sendStatus(500);

                    // Se devuelven los datos existentes sin el campo _id.
                    return res.status(200).json(docs.map(removeDatabaseId));
                });

                // Este return evita que el código continúe y vuelva a insertar datos.
                return;
            }

            // Si la base de datos está vacía, se insertan los datos iniciales.
            db.insert(initialData, (err3, docs) => {
                if (err3) return res.sendStatus(500);

                // Código 201 significa "Created", es decir, datos creados correctamente.
                return res.status(201).json(docs.map(removeDatabaseId));
            });
        });
    });

    // RUTA:
    // GET /api/v2/citys-stats
    //
    // CABECERA:
    // app.get(BASE_API_URL, (req, res) => { ... });
    //
    // TIPO:
    // Usa callback de NeDB.
    //
    // FLUJO:
    // 1. Lee todos los registros con db.find.
    // 2. Quita _id.
    // 3. Aplica filtros si vienen.
    // 4. Aplica busqueda q si viene.
    // 5. Aplica orden sort si viene.
    // 6. Aplica paginacion.
    // 7. Devuelve el array final.
    //
    // USA:
    // - removeDatabaseId
    //
    // RESPUESTA:
    // - 200 con JSON.
    // - 400 si query, sort u offset/limit no valen.
    // - 500 si falla la base de datos.
    app.get(BASE_API_URL, (req, res) => {

        // Se obtienen todos los documentos de la base de datos.
        db.find({}, (err, docs) => {
            if (err) return res.sendStatus(500);

            // Antes de trabajar con los datos, se elimina el campo interno _id.
            let result = docs.map(removeDatabaseId);

            // -----------------------------------------------------------------
            // Filtro exacto por ciudad
            // -----------------------------------------------------------------
            //
            // Ejemplo:
            // /api/v2/citys-stats?city=tokyo
            if (req.query.city !== undefined) {

                // Se normaliza el valor recibido por query:
                // se convierte a texto, se eliminan espacios y se pasa a minúsculas.
                const city = String(req.query.city).trim().toLowerCase();

                // Se conservan solo los registros cuya ciudad coincida exactamente.
                result = result.filter(d => d.city === city);
            }

            // -----------------------------------------------------------------
            // Filtro exacto por país
            // -----------------------------------------------------------------
            //
            // Ejemplo:
            // /api/v2/citys-stats?country=india
            if (req.query.country !== undefined) {

                // Se normaliza el país recibido.
                const country = String(req.query.country).trim().toLowerCase();

                // Se conservan solo los registros cuyo país coincida exactamente.
                result = result.filter(d => d.country === country);
            }

            // -----------------------------------------------------------------
            // Filtro exacto por población
            // -----------------------------------------------------------------
            //
            // Ejemplo:
            // /api/v2/citys-stats?un_2025_population=33412512
            if (req.query.un_2025_population !== undefined) {

                // Se convierte el parámetro recibido a número.
                const value = Number(req.query.un_2025_population);

                // Si no es un número válido, se devuelve error 400.
                // Código 400 significa que la petición del cliente está mal formada.
                if (!Number.isFinite(value)) {
                    return res.status(400).json({ error: "Invalid query" });
                }

                // Se conservan solo los registros cuya población coincida exactamente.
                result = result.filter(d => d.un_2025_population === value);
            }

            // -----------------------------------------------------------------
            // Búsqueda libre por ciudad o país
            // -----------------------------------------------------------------
            //
            // Ejemplo:
            // /api/v2/citys-stats?q=chi
            //
            // Buscaría "chi" dentro de city o country.
            if (req.query.q !== undefined) {

                // Se normaliza el texto de búsqueda.
                const q = String(req.query.q).trim().toLowerCase();

                // Se conservan los registros donde q aparezca en la ciudad o el país.
                result = result.filter(d =>
                    d.city.includes(q) || d.country.includes(q)
                );
            }

            // -----------------------------------------------------------------
            // Ordenación
            // -----------------------------------------------------------------
            //
            // Ejemplos:
            // /api/v2/citys-stats?sort=city
            // /api/v2/citys-stats?sort=country
            // /api/v2/citys-stats?sort=un_2025_population
            // /api/v2/citys-stats?sort=-un_2025_population
            //
            // Si sort empieza por "-", se ordena de forma descendente.
            if (req.query.sort !== undefined) {

                // Se obtiene el campo por el que se quiere ordenar.
                const sort = String(req.query.sort).trim();

                // Por defecto se ordena de forma ascendente.
                let field = sort;
                let direction = 1;

                // Si el parámetro empieza por "-", se ordena descendente.
                // Por ejemplo: -city o -un_2025_population.
                if (sort.startsWith("-")) {
                    field = sort.slice(1);
                    direction = -1;
                }

                // Solo se permite ordenar por estos campos.
                // Esto evita errores o usos indebidos de otros campos.
                const allowedFields = ["city", "country", "un_2025_population"];

                // Si el campo no está permitido, se devuelve error 400.
                if (!allowedFields.includes(field)) {
                    return res.status(400).json({ error: "Invalid sort field" });
                }

                // Ordenación real del array.
                result.sort((a, b) => {
                    if (a[field] < b[field]) return -1 * direction;
                    if (a[field] > b[field]) return 1 * direction;
                    return 0;
                });
            }

            // -----------------------------------------------------------------
            // Paginación
            // -----------------------------------------------------------------
            //
            // offset indica cuántos resultados se saltan.
            // limit indica cuántos resultados se devuelven.
            //
            // Ejemplo:
            // /api/v2/citys-stats?offset=5&limit=3
            //
            // Esto salta los 5 primeros registros y devuelve los 3 siguientes.

            // Por defecto, no se salta ningún resultado.
            let offset = 0;

            // Por defecto, se devuelven todos los resultados.
            let limit = result.length;

            // Validación del offset.
            if (req.query.offset !== undefined) {
                offset = Number(req.query.offset);

                // offset debe ser un número entero mayor o igual que 0.
                if (!Number.isInteger(offset) || offset < 0) {
                    return res.status(400).json({ error: "Invalid offset" });
                }
            }

            // Validación del limit.
            if (req.query.limit !== undefined) {
                limit = Number(req.query.limit);

                // limit debe ser un número entero mayor o igual que 0.
                if (!Number.isInteger(limit) || limit < 0) {
                    return res.status(400).json({ error: "Invalid limit" });
                }
            }

            // Se devuelve solo la parte del array indicada por offset y limit.
            return res.status(200).json(result.slice(offset, offset + limit));
        });
    });

    // RUTA:
    // GET /api/v2/citys-stats/:city/:country
    //
    // CABECERA:
    // app.get(`${BASE_API_URL}/:city/:country`, (req, res) => { ... });
    //
    // TIPO:
    // Usa callback de NeDB.
    //
    // FLUJO:
    // 1. Lee city y country de la URL.
    // 2. Los normaliza.
    // 3. Busca con db.findOne.
    // 4. Quita _id.
    // 5. Devuelve el registro.
    //
    // USA:
    // - removeDatabaseId
    //
    // RESPUESTA:
    // - 200 con JSON.
    // - 404 si no existe.
    // - 500 si falla la base de datos.
    app.get(`${BASE_API_URL}/:city/:country`, (req, res) => {

        // Se leen los parámetros de la URL.
        // req.params.city viene de :city.
        // req.params.country viene de :country.
        const city = req.params.city.trim().toLowerCase();
        const country = req.params.country.trim().toLowerCase();

        // Se busca un único documento que coincida con ciudad y país.
        db.findOne({ city, country }, (err, doc) => {
            if (err) return res.sendStatus(500);

            // Si no existe, se devuelve 404.
            // Código 404 significa "no encontrado".
            if (!doc) {
                return res.status(404).json({ error: "Resource not found" });
            }

            // Si existe, se devuelve el documento sin _id.
            return res.status(200).json(removeDatabaseId(doc));
        });
    });

    // RUTA:
    // POST /api/v2/citys-stats
    //
    // CABECERA:
    // app.post(BASE_API_URL, (req, res) => { ... });
    //
    // TIPO:
    // Usa callbacks de NeDB.
    //
    // FLUJO:
    // 1. Lee req.body.
    // 2. Valida datos.
    // 3. Busca duplicados con db.findOne.
    // 4. Inserta con db.insert.
    // 5. Quita _id.
    // 6. Devuelve el creado.
    //
    // USA:
    // - normalizeCityStat
    // - removeDatabaseId
    //
    // RESPUESTA:
    // - 201 con JSON.
    // - 400 si el body no vale.
    // - 409 si ya existe.
    // - 500 si falla la base de datos.
    app.post(BASE_API_URL, (req, res) => {

        // Se normaliza y valida el body recibido.
        const item = normalizeCityStat(req.body);

        // Si item es null, significa que el body no es válido.
        if (!item) {
            return res.status(400).json({
                error: "JSON body does not match expected structure"
            });
        }

        // Antes de insertar, se comprueba si ya existe un recurso
        // con la misma ciudad y el mismo país.
        db.findOne({ city: item.city, country: item.country }, (err, doc) => {
            if (err) return res.sendStatus(500);

            // Si ya existe, no se permite duplicarlo.
            // Código 409 significa "conflicto".
            if (doc) {
                return res.status(409).json({ error: "Resource already exists" });
            }

            // Si no existe, se inserta el nuevo registro.
            db.insert(item, (err2, newDoc) => {
                if (err2) return res.sendStatus(500);

                // Código 201 significa que el recurso ha sido creado.
                return res.status(201).json(removeDatabaseId(newDoc));
            });
        });
    });

    // RUTA:
    // POST /api/v2/citys-stats/:city/:country
    //
    // CABECERA:
    // app.post(`${BASE_API_URL}/:city/:country`, (req, res) => { ... });
    //
    // TIPO:
    // Sincrona.
    //
    // FLUJO:
    // 1. Entra si intentan hacer POST sobre un recurso concreto.
    // 2. Rechaza la operacion.
    //
    // USA:
    // - Ninguna
    //
    // RESPUESTA:
    // - 405.
    app.post(`${BASE_API_URL}/:city/:country`, (req, res) => {

        // Código 405 significa "método no permitido".
        return res.sendStatus(405);
    });

    // RUTA:
    // PUT /api/v2/citys-stats
    //
    // CABECERA:
    // app.put(BASE_API_URL, (req, res) => { ... });
    //
    // TIPO:
    // Sincrona.
    //
    // FLUJO:
    // 1. Entra si intentan hacer PUT sobre toda la coleccion.
    // 2. Rechaza la operacion.
    //
    // USA:
    // - Ninguna
    //
    // RESPUESTA:
    // - 405.
    app.put(BASE_API_URL, (req, res) => {

        // Código 405 significa que PUT no está permitido sobre la colección.
        return res.sendStatus(405);
    });

    // RUTA:
    // PUT /api/v2/citys-stats/:city/:country
    //
    // CABECERA:
    // app.put(`${BASE_API_URL}/:city/:country`, (req, res) => { ... });
    //
    // TIPO:
    // Usa callbacks de NeDB.
    //
    // FLUJO:
    // 1. Lee city y country de la URL.
    // 2. Valida req.body.
    // 3. Comprueba que URL y body coinciden.
    // 4. Busca con db.findOne.
    // 5. Actualiza con db.update.
    // 6. Vuelve a buscar con db.findOne.
    // 7. Quita _id y devuelve el actualizado.
    //
    // USA:
    // - normalizeCityStat
    // - removeDatabaseId
    //
    // RESPUESTA:
    // - 200 con JSON.
    // - 400 si body o URL no valen.
    // - 404 si no existe.
    // - 500 si falla la base de datos.
    app.put(`${BASE_API_URL}/:city/:country`, (req, res) => {

        // Se obtienen los identificadores desde la URL.
        const city = req.params.city.trim().toLowerCase();
        const country = req.params.country.trim().toLowerCase();

        // Se valida y normaliza el body.
        const item = normalizeCityStat(req.body);

        // Si el body no es válido, se devuelve error 400.
        if (!item) {
            return res.status(400).json({
                error: "JSON body does not match expected structure"
            });
        }

        // Comprobación importante:
        // La ciudad y el país del body deben coincidir con los de la URL.
        //
        // Ejemplo incorrecto:
        // URL:  /citys-stats/tokyo/japan
        // Body: { city: "delhi", country: "india", ... }
        //
        // Eso no se permite porque sería ambiguo.
        if (item.city !== city || item.country !== country) {
            return res.status(400).json({ error: "URL and body do not match" });
        }

        // Primero se comprueba si el recurso existe.
        db.findOne({ city, country }, (err, doc) => {
            if (err) return res.sendStatus(500);

            // Si no existe, no se puede actualizar.
            if (!doc) {
                return res.status(404).json({ error: "Resource not found" });
            }

            // Si existe, se actualiza el documento completo.
            db.update({ city, country }, item, {}, (err2) => {
                if (err2) return res.sendStatus(500);

                // Después de actualizar, se vuelve a buscar para devolver
                // el recurso actualizado al cliente.
                db.findOne({ city, country }, (err3, updated) => {
                    if (err3) return res.sendStatus(500);

                    // Se devuelve el documento actualizado sin _id.
                    return res.status(200).json(removeDatabaseId(updated));
                });
            });
        });
    });

    // RUTA:
    // DELETE /api/v2/citys-stats
    //
    // CABECERA:
    // app.delete(BASE_API_URL, (req, res) => { ... });
    //
    // TIPO:
    // Usa callback de NeDB.
    //
    // FLUJO:
    // 1. Entra cuando piden borrar toda la coleccion.
    // 2. Borra con db.remove({}, { multi: true }).
    // 3. Devuelve sin contenido.
    //
    // USA:
    // - Ninguna
    //
    // RESPUESTA:
    // - 204.
    // - 500 si falla la base de datos.
    app.delete(BASE_API_URL, (req, res) => {

        // db.remove con filtro {} borra todos los documentos.
        // La opción { multi: true } indica que se pueden borrar varios documentos.
        db.remove({}, { multi: true }, (err) => {
            if (err) return res.sendStatus(500);

            // Código 204 significa que la operación fue correcta,
            // pero no se devuelve contenido en la respuesta.
            return res.sendStatus(204);
        });
    });

    // RUTA:
    // DELETE /api/v2/citys-stats/:city/:country
    //
    // CABECERA:
    // app.delete(`${BASE_API_URL}/:city/:country`, (req, res) => { ... });
    //
    // TIPO:
    // Usa callback de NeDB.
    //
    // FLUJO:
    // 1. Lee city y country de la URL.
    // 2. Los normaliza.
    // 3. Borra con db.remove.
    // 4. Devuelve sin contenido.
    //
    // USA:
    // - Ninguna
    //
    // RESPUESTA:
    // - 204.
    // - 404 si no existia.
    // - 500 si falla la base de datos.
    app.delete(`${BASE_API_URL}/:city/:country`, (req, res) => {

        // Se normalizan los parámetros recibidos por URL.
        const city = req.params.city.trim().toLowerCase();
        const country = req.params.country.trim().toLowerCase();

        // Se intenta borrar el documento que coincida con ciudad y país.
        db.remove({ city, country }, {}, (err, numRemoved) => {
            if (err) return res.sendStatus(500);

            // numRemoved indica cuántos documentos se han eliminado.
            // Si es 0, significa que no existía ese recurso.
            if (numRemoved === 0) {
                return res.status(404).json({ error: "Resource not found" });
            }

            // Si se ha borrado correctamente, se devuelve 204 sin contenido.
            return res.sendStatus(204);
        });
    });
};
