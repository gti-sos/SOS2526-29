// Este modulo registra todas las rutas de la API v1 de natural-disasters.
module.exports = function registerNaturalDisastersV1(app, db) {
    // Ruta base que usaran todas las operaciones de este recurso.
    const BASE_API_URL = "/api/v1/natural-disasters";
    // Campos obligatorios que debe tener cada registro de desastre natural.
    const REQUIRED_FIELDS = [
        "country",
        "year",
        "death_count",
        "injured_count",
        "economic_damage_usd"
    ];
    // Datos de ejemplo que se insertan cuando la base esta vacia.
    const initialData = [
        { country: "afghanistan", year: 1950, death_count: 215, injured_count: 200, economic_damage_usd: 0 },
        { country: "afghanistan", year: 1960, death_count: 11, injured_count: 0, economic_damage_usd: 20 },
        { country: "afghanistan", year: 1970, death_count: 48, injured_count: 16, economic_damage_usd: 5200 },
        { country: "afghanistan", year: 1980, death_count: 58, injured_count: 352, economic_damage_usd: 26900 },
        { country: "afghanistan", year: 1990, death_count: 1039, injured_count: 395, economic_damage_usd: 8401 },
        { country: "afghanistan", year: 2000, death_count: 449, injured_count: 197, economic_damage_usd: 2511 },
        { country: "afghanistan", year: 2010, death_count: 263, injured_count: 5918, economic_damage_usd: 14800 },
        { country: "africa", year: 1900, death_count: 1112, injured_count: 0, economic_damage_usd: 0 },
        { country: "africa", year: 1910, death_count: 8501, injured_count: 0, economic_damage_usd: 0 },
        { country: "africa", year: 1920, death_count: 2701, injured_count: 0, economic_damage_usd: 0 },
        { country: "spain", year: 2024, death_count: 220, injured_count: 500, economic_damage_usd: 30000 }
    ];

    // Quitamos el campo interno _id antes de enviar datos al cliente.
    function removeDatabaseId(document) {
        // Si no hay documento, devolvemos el mismo valor para evitar errores.
        if (!document) return document;
        // Hacemos una copia sin _id para que la API no muestre datos internos de NeDB.
        const { _id, ...publicDocument } = document;
        // Devolvemos solo los campos publicos del recurso.
        return publicDocument;
    }

    // Comprobamos que el body tenga exactamente los campos esperados.
    function hasValidDisasterBody(disaster) {
        // Si no llega un objeto normal, no se puede crear ni actualizar.
        if (!disaster || typeof disaster !== "object" || Array.isArray(disaster)) return false;
        // Obtenemos los nombres de campos que envio el cliente.
        const receivedFields = Object.keys(disaster);
        // La practica pide estructura exacta: ni campos de menos ni campos de mas.
        return REQUIRED_FIELDS.every((field) => receivedFields.includes(field)) &&
            receivedFields.length === REQUIRED_FIELDS.length &&
            Boolean(disaster.country) &&
            Boolean(disaster.year) &&
            disaster.death_count !== undefined &&
            disaster.injured_count !== undefined &&
            disaster.economic_damage_usd !== undefined;
    }

    // Creamos el objeto de busqueda a partir de los parametros de la URL.
    function buildSearchQuery(queryParams) {
        // Empezamos con una busqueda vacia, que significa "todos los registros".
        const searchQuery = {};
        // Filtramos por pais si el usuario lo indica.
        if (queryParams.country) searchQuery.country = queryParams.country;
        // Convertimos los campos numericos porque en la URL llegan como texto.
        if (queryParams.year) searchQuery.year = parseInt(queryParams.year);
        if (queryParams.death_count) searchQuery.death_count = parseInt(queryParams.death_count);
        if (queryParams.injured_count) searchQuery.injured_count = parseInt(queryParams.injured_count);
        if (queryParams.economic_damage_usd) searchQuery.economic_damage_usd = parseInt(queryParams.economic_damage_usd);
        // Devolvemos el filtro listo para usar con NeDB.
        return searchQuery;
    }

    // Convertimos limit y offset a numeros para paginar resultados.
    function getPagination(queryParams) {
        // offset indica cuantos registros saltar; si no viene, empieza en 0.
        const offset = parseInt(queryParams.offset) || 0;
        // limit indica cuantos registros devolver; si no viene, devuelve hasta 100.
        const limit = parseInt(queryParams.limit) || 100;
        // Devolvemos ambos valores juntos para que se lean facilmente.
        return { offset, limit };
    }

    // Ruta de documentacion en Postman.
    app.get(`${BASE_API_URL}/docs`, (request, response) => {
        // Redirigimos al enlace externo de la documentacion.
        response.redirect("https://documenter.getpostman.com/view/52437562/2sBXigNZbk");
    });

    // Ruta para cargar datos iniciales cuando la coleccion esta vacia.
    app.get(`${BASE_API_URL}/loadInitialData`, (request, response) => {
        // Contamos cuantos documentos hay ya en la base.
        db.count({}, (error, count) => {
            // Si NeDB falla, respondemos con error del servidor.
            if (error) return response.sendStatus(500);

            // Si ya hay datos, mantenemos el comportamiento original: no insertamos nada.
            if (count > 0) {
                return response.status(400).send("La base de datos ya contiene datos.");
            }

            // Si la base esta vacia, insertamos todos los datos de ejemplo.
            db.insert(initialData, (insertError) => {
                // Si no se puede insertar, devolvemos error del servidor.
                if (insertError) return response.status(500).send("Error al insertar en la base de datos: " + insertError);
                // Si se insertan correctamente, la practica espera codigo 201.
                return response.sendStatus(201);
            });
        });
    });

    // Ruta para obtener la coleccion completa con filtros y paginacion.
    app.get(BASE_API_URL, (request, response) => {
        // Creamos el filtro con los parametros recibidos.
        const searchQuery = buildSearchQuery(request.query);
        // Calculamos la paginacion solicitada.
        const { offset, limit } = getPagination(request.query);

        // Buscamos en NeDB, saltando offset y limitando el numero de resultados.
        db.find(searchQuery).skip(offset).limit(limit).exec((error, documents) => {
            // Si NeDB falla, devolvemos error del servidor.
            if (error) return response.sendStatus(500);
            // Quitamos _id de cada registro antes de responder.
            const publicDocuments = documents.map(removeDatabaseId);
            // Enviamos el array final en formato JSON.
            return response.json(publicDocuments);
        });
    });

    // Ruta para crear un nuevo desastre natural.
    app.post(BASE_API_URL, (request, response) => {
        // Guardamos el body con un nombre claro.
        const newDisaster = request.body;

        // Si falta algun campo o sobra alguno, devolvemos 400.
        if (!hasValidDisasterBody(newDisaster)) {
            return response.sendStatus(400);
        }

        // Buscamos si ya existe un registro con el mismo pais y anio.
        db.findOne({ country: newDisaster.country, year: newDisaster.year }, (error, existingDisaster) => {
            // Si la base falla, devolvemos error del servidor.
            if (error) return response.sendStatus(500);
            // Si ya existe, devolvemos conflicto 409.
            if (existingDisaster) return response.sendStatus(409);

            // Si no existe, insertamos el nuevo registro.
            db.insert(newDisaster, (insertError) => {
                // Si NeDB falla al insertar, devolvemos 500.
                if (insertError) return response.sendStatus(500);
                // Si se crea correctamente, devolvemos 201.
                return response.sendStatus(201);
            });
        });
    });

    // Ruta para obtener un registro concreto usando country y year.
    app.get(`${BASE_API_URL}/:country/:year`, (request, response) => {
        // Leemos el pais desde la URL.
        const country = request.params.country;
        // Convertimos el anio de texto a numero.
        const year = parseInt(request.params.year);

        // Buscamos un documento que coincida con pais y anio.
        db.findOne({ country, year }, (error, document) => {
            // Si NeDB falla, devolvemos 500.
            if (error) return response.sendStatus(500);
            // Si no existe, devolvemos 404.
            if (!document) return response.sendStatus(404);
            // Si existe, lo devolvemos sin el _id interno.
            return response.json(removeDatabaseId(document));
        });
    });

    // Ruta para actualizar un registro concreto.
    app.put(`${BASE_API_URL}/:country/:year`, (request, response) => {
        // Leemos el pais que aparece en la URL.
        const country = request.params.country;
        // Leemos y convertimos el anio que aparece en la URL.
        const year = parseInt(request.params.year);
        // Guardamos el body con nombre descriptivo.
        const updatedDisaster = request.body;

        // El pais y anio del body deben coincidir con los de la URL.
        if (updatedDisaster.country !== country || updatedDisaster.year !== year) {
            return response.sendStatus(400);
        }

        // Actualizamos el registro que coincide con pais y anio.
        db.update({ country, year }, { $set: updatedDisaster }, {}, (error, replacedCount) => {
            // Si NeDB falla, devolvemos 500.
            if (error) return response.sendStatus(500);
            // Si no se actualizo nada, el recurso no existia.
            if (replacedCount === 0) return response.sendStatus(404);
            // Si se actualizo, devolvemos codigo 200.
            return response.sendStatus(200);
        });
    });

    // Ruta para borrar un registro concreto.
    app.delete(`${BASE_API_URL}/:country/:year`, (request, response) => {
        // Leemos el pais desde la URL.
        const country = request.params.country;
        // Convertimos el anio a numero.
        const year = parseInt(request.params.year);

        // Eliminamos el registro que coincida con pais y anio.
        db.remove({ country, year }, {}, (error, removedCount) => {
            // Si NeDB falla, devolvemos 500.
            if (error) return response.sendStatus(500);
            // Si no se borro nada, no existia ese registro.
            if (removedCount === 0) return response.sendStatus(404);
            // Si se borro correctamente, devolvemos 200 como en el codigo original.
            return response.sendStatus(200);
        });
    });

    // Ruta para borrar toda la coleccion.
    app.delete(BASE_API_URL, (request, response) => {
        // multi:true permite borrar mas de un documento.
        db.remove({}, { multi: true }, (error) => {
            // Si NeDB falla, devolvemos 500.
            if (error) return response.sendStatus(500);
            // La coleccion se limpio correctamente.
            return response.sendStatus(200);
        });
    });

    // No se permite hacer POST sobre un recurso concreto.
    app.post(`${BASE_API_URL}/:country/:year`, (request, response) => response.sendStatus(405));
    // No se permite hacer PUT sobre toda la coleccion.
    app.put(BASE_API_URL, (request, response) => response.sendStatus(405));
};
