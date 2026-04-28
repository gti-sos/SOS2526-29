// Este modulo registra todas las rutas de la API v2 de natural-disasters.
module.exports = function registerNaturalDisastersV2(app, db) {
    // Ruta base de la version 2 del recurso de desastres naturales.
    const BASE_API_URL = "/api/v2/natural-disasters";
    // Campos exactos que se aceptan al crear o actualizar un registro.
    const REQUIRED_FIELDS = [
        "country",
        "year",
        "death_count",
        "injured_count",
        "economic_damage_usd"
    ];
    // Datos de ejemplo usados por loadInitialData.
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

    // Quitamos el _id interno de NeDB antes de devolver un documento.
    function removeDatabaseId(document) {
        // Si no hay documento, devolvemos el mismo valor.
        if (!document) return document;
        // Copiamos todas las propiedades menos _id.
        const { _id, ...publicDocument } = document;
        // Devolvemos el objeto limpio.
        return publicDocument;
    }

    // Validamos que el body tenga exactamente la forma de un desastre natural.
    function hasValidDisasterBody(disaster) {
        // Solo aceptamos objetos normales.
        if (!disaster || typeof disaster !== "object" || Array.isArray(disaster)) return false;
        // Guardamos la lista de campos recibidos.
        const receivedFields = Object.keys(disaster);
        // Comprobamos estructura exacta y campos obligatorios.
        return REQUIRED_FIELDS.every((field) => receivedFields.includes(field)) &&
            receivedFields.length === REQUIRED_FIELDS.length &&
            Boolean(disaster.country) &&
            Boolean(disaster.year) &&
            disaster.death_count !== undefined &&
            disaster.injured_count !== undefined &&
            disaster.economic_damage_usd !== undefined;
    }

    // Construimos la busqueda de v2, que permite pais parcial y rango de anios.
    function buildSearchQuery(queryParams) {
        // Empezamos con una busqueda sin filtros.
        const searchQuery = {};

        // En v2, el pais se busca sin distinguir mayusculas y minusculas.
        if (queryParams.country) {
            searchQuery.country = new RegExp(queryParams.country, "i");
        }

        // Si viene year, se busca ese anio exacto.
        if (queryParams.year) {
            searchQuery.year = parseInt(queryParams.year);
        // Si no viene year, se permite buscar desde/hasta.
        } else if (queryParams.from || queryParams.to) {
            // NeDB entiende $gte como mayor o igual y $lte como menor o igual.
            searchQuery.year = {};
            // from marca el anio minimo.
            if (queryParams.from) searchQuery.year.$gte = parseInt(queryParams.from);
            // to marca el anio maximo.
            if (queryParams.to) searchQuery.year.$lte = parseInt(queryParams.to);
        }

        // El resto de filtros numericos se convierten de texto a numero.
        if (queryParams.death_count) searchQuery.death_count = parseInt(queryParams.death_count);
        if (queryParams.injured_count) searchQuery.injured_count = parseInt(queryParams.injured_count);
        if (queryParams.economic_damage_usd) searchQuery.economic_damage_usd = parseInt(queryParams.economic_damage_usd);
        // Devolvemos el filtro listo para NeDB.
        return searchQuery;
    }

    // Calculamos la paginacion de la respuesta.
    function getPagination(queryParams) {
        // offset indica cuantos registros se saltan.
        const offset = parseInt(queryParams.offset) || 0;
        // limit indica cuantos registros se devuelven como maximo.
        const limit = parseInt(queryParams.limit) || 100;
        // Agrupamos ambos valores en un objeto.
        return { offset, limit };
    }

    // Ruta de documentacion de la API v2.
    app.get(`${BASE_API_URL}/docs`, (request, response) => {
        // Redirigimos al documento Postman de v2.
        response.redirect("https://documenter.getpostman.com/view/52437562/2sBXijKBvx");
    });

    // Ruta para cargar datos iniciales si la base esta vacia.
    app.get(`${BASE_API_URL}/loadInitialData`, (request, response) => {
        // Contamos documentos actuales.
        db.count({}, (error, count) => {
            // Error de base de datos.
            if (error) return response.sendStatus(500);

            // Si ya habia datos, no insertamos duplicados.
            if (count > 0) {
                return response.status(400).send("La base de datos ya contiene datos.");
            }

            // Insertamos todos los datos de ejemplo.
            db.insert(initialData, (insertError) => {
                // Error al insertar.
                if (insertError) return response.status(500).send("Error al insertar en la base de datos: " + insertError);
                // Datos creados correctamente.
                return response.sendStatus(201);
            });
        });
    });

    // Ruta para consultar la coleccion con filtros, rangos y paginacion.
    app.get(BASE_API_URL, (request, response) => {
        // Creamos la consulta a partir de la URL.
        const searchQuery = buildSearchQuery(request.query);
        // Obtenemos offset y limit.
        const { offset, limit } = getPagination(request.query);

        // Ejecutamos la busqueda en NeDB.
        db.find(searchQuery).skip(offset).limit(limit).exec((error, documents) => {
            // Si falla la base, devolvemos 500.
            if (error) return response.sendStatus(500);
            // Quitamos los _id internos.
            const publicDocuments = documents.map(removeDatabaseId);
            // Enviamos el resultado en JSON.
            return response.json(publicDocuments);
        });
    });

    // Ruta para crear un nuevo registro.
    app.post(BASE_API_URL, (request, response) => {
        // Guardamos el body con un nombre descriptivo.
        const newDisaster = request.body;

        // Si el body no es exacto, devolvemos 400.
        if (!hasValidDisasterBody(newDisaster)) {
            return response.sendStatus(400);
        }

        // Comprobamos si ya existe un recurso con el mismo pais y anio.
        db.findOne({ country: newDisaster.country, year: newDisaster.year }, (error, existingDisaster) => {
            // Error de base de datos.
            if (error) return response.sendStatus(500);
            // Si ya existe, hay conflicto.
            if (existingDisaster) return response.sendStatus(409);

            // Insertamos el nuevo registro.
            db.insert(newDisaster, (insertError) => {
                // Error al insertar.
                if (insertError) return response.sendStatus(500);
                // Registro creado.
                return response.sendStatus(201);
            });
        });
    });

    // Ruta para obtener un registro concreto.
    app.get(`${BASE_API_URL}/:country/:year`, (request, response) => {
        // Pais de la URL.
        const country = request.params.country;
        // Anio de la URL convertido a numero.
        const year = parseInt(request.params.year);

        // Buscamos el registro exacto.
        db.findOne({ country, year }, (error, document) => {
            // Error de base de datos.
            if (error) return response.sendStatus(500);
            // Si no existe, devolvemos 404.
            if (!document) return response.sendStatus(404);
            // Si existe, devolvemos el documento limpio.
            return response.json(removeDatabaseId(document));
        });
    });

    // Ruta para actualizar un registro concreto.
    app.put(`${BASE_API_URL}/:country/:year`, (request, response) => {
        // Pais que identifica el recurso.
        const country = request.params.country;
        // Anio que identifica el recurso.
        const year = parseInt(request.params.year);
        // Datos nuevos enviados por el cliente.
        const updatedDisaster = request.body;

        // La URL y el body deben hablar del mismo recurso.
        if (updatedDisaster.country !== country || updatedDisaster.year !== year) {
            return response.sendStatus(400);
        }

        // Actualizamos el registro en NeDB.
        db.update({ country, year }, { $set: updatedDisaster }, {}, (error, replacedCount) => {
            // Error de base de datos.
            if (error) return response.sendStatus(500);
            // Si no se reemplazo ningun documento, no existia.
            if (replacedCount === 0) return response.sendStatus(404);
            // Actualizacion correcta.
            return response.sendStatus(200);
        });
    });

    // Ruta para borrar un registro concreto.
    app.delete(`${BASE_API_URL}/:country/:year`, (request, response) => {
        // Pais del recurso.
        const country = request.params.country;
        // Anio del recurso.
        const year = parseInt(request.params.year);

        // Eliminamos el documento exacto.
        db.remove({ country, year }, {}, (error, removedCount) => {
            // Error de base de datos.
            if (error) return response.sendStatus(500);
            // Si no se borro nada, el registro no existia.
            if (removedCount === 0) return response.sendStatus(404);
            // Borrado correcto.
            return response.sendStatus(200);
        });
    });

    // Ruta para borrar toda la coleccion.
    app.delete(BASE_API_URL, (request, response) => {
        // multi:true permite eliminar todos los documentos.
        db.remove({}, { multi: true }, (error) => {
            // Error de base de datos.
            if (error) return response.sendStatus(500);
            // Mantenemos el codigo 200 del recurso original.
            return response.sendStatus(200);
        });
    });

    // No se permite POST sobre un recurso concreto.
    app.post(`${BASE_API_URL}/:country/:year`, (request, response) => response.sendStatus(405));
    // No se permite PUT sobre toda la coleccion.
    app.put(BASE_API_URL, (request, response) => response.sendStatus(405));
};
