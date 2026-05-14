// =============================================================================
// API REST v1 para el recurso citys-stats
// =============================================================================
//
// Este módulo registra todas las rutas de la API v1 para el recurso citys-stats.
//
// El recurso citys-stats representa ciudades con:
// - city: nombre de la ciudad
// - country: país
// - un_2025_population: población estimada por la ONU para 2025
//
// Además de las operaciones CRUD básicas, esta versión incluye varias
// integraciones con APIs externas para enriquecer los datos locales.
//
// Patrón REST usado:
// - Colección completa:
//   /api/v1/citys-stats
//
// - Recurso concreto:
//   /api/v1/citys-stats/:city/:country
//
// - Integraciones externas:
//   /api/v1/citys-stats/integrations/...
//
// =============================================================================
// FLUJO GENERAL DE ESTA API V1
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
    // Constantes principales de la API
    // -------------------------------------------------------------------------

    // Ruta base usada por todas las rutas de esta API.
    // Así evitamos repetir el texto "/api/v1/citys-stats" en todo el código.
    const BASE_API_URL = "/api/v1/citys-stats";

    // URL de la documentación de Postman.
    // Si existe la variable de entorno LCC_DOCS_URL, se usa esa.
    // Si no existe, se usa la URL fija indicada.
    const DOCS_URL =
        process.env.LCC_DOCS_URL ||
        "https://documenter.getpostman.com/view/52412147/2sBXiqEUAt";

    // -------------------------------------------------------------------------
    // URLs de APIs externas usadas en las integraciones
    // -------------------------------------------------------------------------
    //
    // Estas constantes guardan las URLs de otras APIs SOS2526.
    // El backend las consulta como proxy para evitar problemas de CORS
    // y para poder normalizar los datos antes de enviarlos al frontend.

    const TOURIST_ARRIVALS_API_URL =
        "https://sos2526-25.onrender.com/api/v2/international-tourist-arrivals";

    const EARTHQUAKES_API_URL =
        "https://sos2526-19.onrender.com/api/v1/earthquakes";

    const FIFA_SQUAD_VALUES_API_URL =
        "https://sos2526-26.onrender.com/api/v2/fifa-squad-value-per-years";

    const ESPORTS_EARNINGS_API_URL =
        "https://sos2526-30.onrender.com/api/v1/esportsearnings-stats";

    // Cache corto para respuestas de APIs externas.
    // No cachea NeDB ni los datos propios: solo evita repetir llamadas externas
    // cuando la pantalla de integraciones se recarga varias veces seguidas.
    const EXTERNAL_CACHE_TTL_MS = 5 * 60 * 1000;

    // externalJsonCache guarda respuestas ya completadas.
    // externalJsonPendingRequests guarda promesas en curso para deduplicar
    // dos peticiones iguales que lleguen al mismo tiempo.
    const externalJsonCache = new Map();
    const externalJsonPendingRequests = new Map();

    // -------------------------------------------------------------------------
    // Diccionario de códigos ISO3 a nombres de países
    // -------------------------------------------------------------------------
    //
    // Algunas APIs externas devuelven países como códigos ISO3.
    // Por ejemplo:
    // - ESP significa Spain
    // - JPN significa Japan
    // - IND significa India
    //
    // Este objeto permite convertir esos códigos a nombres legibles.
    const ISO3_COUNTRY_NAMES = {
        AFG: "Afghanistan",
        ARG: "Argentina",
        AUS: "Australia",
        BEL: "Belgium",
        BRA: "Brazil",
        CHN: "China",
        DEU: "Germany",
        EGY: "Egypt",
        ESP: "Spain",
        FRA: "France",
        GRC: "Greece",
        IDN: "Indonesia",
        IND: "India",
        IRN: "Iran",
        ITA: "Italy",
        JPN: "Japan",
        NLD: "Netherlands",
        PHL: "Philippines",
        PRT: "Portugal",
        TJK: "Tajikistan"
    };

    // -------------------------------------------------------------------------
    // Datos iniciales
    // -------------------------------------------------------------------------
    //
    // Estos datos se insertan en la base de datos cuando está vacía
    // y se llama al endpoint:
    //
    // GET /api/v1/citys-stats/loadInitialData
    //
    // Cada objeto representa una ciudad.
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

    // Paises admitidos para crear o editar citys-stats.
    // Evita guardar paises inventados que luego no tienen ISO3 para World Bank.
    const SUPPORTED_COUNTRIES = new Set([
        "afghanistan", "albania", "algeria", "andorra", "angola", "argentina",
        "armenia", "australia", "austria", "azerbaijan", "bangladesh",
        "belgium", "bolivia", "brazil", "bulgaria", "cambodia", "cameroon",
        "canada", "chile", "china", "colombia", "costa-rica", "croatia",
        "cuba", "czech-republic", "denmark", "dominican-republic", "ecuador",
        "egypt", "el-salvador", "estonia", "ethiopia", "finland", "france",
        "germany", "ghana", "greece", "guatemala", "hungary", "india",
        "indonesia", "ireland", "israel", "italy", "japan", "kenya",
        "malaysia", "mexico", "morocco", "netherlands", "new-zealand",
        "nigeria", "norway", "pakistan", "panama", "paraguay", "peru",
        "philippines", "poland", "portugal", "romania", "russia",
        "saudi-arabia", "singapore", "south-africa", "south-korea", "spain",
        "sweden", "switzerland", "taiwan", "thailand", "turkey", "ukraine",
        "united-arab-emirates", "united-kingdom", "united-states", "uruguay",
        "venezuela", "vietnam"
    ]);

    // Alias aceptados por comodidad del usuario.
    // La clave es lo que puede escribir el usuario ya normalizado.
    // El valor es el país canónico que realmente se guarda en NeDB.
    const COUNTRY_ALIASES = {
        "alemania": "germany",
        "corea-del-sur": "south-korea",
        "eeuu": "united-states",
        "england": "united-kingdom",
        "espana": "spain",
        "estados-unidos": "united-states",
        "francia": "france",
        "great-britain": "united-kingdom",
        "holanda": "netherlands",
        "italia": "italy",
        "paises-bajos": "netherlands",
        "reino-unido": "united-kingdom",
        "republic-of-korea": "south-korea",
        "scotland": "united-kingdom",
        "u-k": "united-kingdom",
        "u-s-a": "united-states",
        "uae": "united-arab-emirates",
        "uk": "united-kingdom",
        "united-states-of-america": "united-states",
        "us": "united-states",
        "usa": "united-states",
        "wales": "united-kingdom"
    };

    // -------------------------------------------------------------------------
    // Funciones auxiliares básicas
    // -------------------------------------------------------------------------

    // NeDB añade automáticamente un campo interno llamado "_id".
    // Ese campo sirve para la base de datos, pero no queremos devolverlo
    // en las respuestas de nuestra API.
    function removeDatabaseId(doc) {
        // Si no hay documento, se devuelve tal cual.
        // Esto evita errores si doc es null o undefined.
        if (!doc) return doc;

        // Se extrae _id y se guarda el resto del documento en "rest".
        // El campo _id queda descartado.
        const { _id, ...rest } = doc;

        // Se devuelve el documento sin el campo _id.
        return rest;
    }

    // Comprueba que el body recibido tenga exactamente los campos del recurso:
    // - city
    // - country
    // - un_2025_population
    //
    // No acepta campos de más ni campos de menos.
    function hasExactCityFields(body) {
        // El body debe existir, debe ser un objeto y no debe ser un array.
        if (!body || typeof body !== "object" || Array.isArray(body)) return false;

        // Campos esperados para un recurso citys-stats.
        const expected = ["city", "country", "un_2025_population"].sort();

        // Campos recibidos realmente en el body.
        const keys = Object.keys(body).sort();

        // Se comprueba:
        // 1. Que haya el mismo número de campos.
        // 2. Que los nombres coincidan exactamente.
        return keys.length === expected.length &&
            keys.every((k, i) => k === expected[i]);
    }

    // Normaliza el pais a la forma canonica guardada por la API.
    // Ejemplo: "South Korea", "south korea" y "south_korea" pasan a "south-korea".
    function normalizeCountryForStorage(country) {
        // String(...) evita errores si country viene como numero, null o undefined.
        const normalized = String(country ?? "")
            // Quita espacios al principio y al final.
            .trim()
            // Separa letras y tildes para poder borrar los acentos.
            .normalize("NFD")
            // Borra las marcas Unicode de tildes.
            .replace(/[\u0300-\u036f]/g, "")
            // Guarda todo en minusculas, igual que el resto de la API.
            .toLowerCase()
            // Quita apostrofes y puntos para aceptar variantes como U.S.A.
            .replace(/['.]/g, "")
            // Convierte & en texto para evitar simbolos raros.
            .replace(/&/g, "and")
            // Cambia espacios, barras bajas y cualquier separador por guiones.
            .replace(/[^a-z]+/g, "-")
            // Elimina guiones sobrantes al principio o al final.
            .replace(/^-+|-+$/g, "");

        // Si el usuario escribio un alias, devolvemos el pais oficial.
        // Si no era alias, devolvemos el valor normalizado directamente.
        return COUNTRY_ALIASES[normalized] || normalized;
    }

    // Valida y normaliza un body de citys-stats.
    // Devuelve { item } si es correcto o { error } si debe responder 400.
    function parseCityStat(body) {
        // Primero comprobamos la estructura exacta del JSON.
        // Esto mantiene la regla de la asignatura: no campos de mas ni de menos.
        if (!hasExactCityFields(body)) {
            return { error: "JSON body does not match expected structure" };
        }

        // city se guarda en minusculas para que la clave sea estable.
        const city = String(body.city).trim().toLowerCase();
        // country se guarda normalizado y con alias resueltos.
        const country = normalizeCountryForStorage(body.country);
        // La poblacion se convierte a Number porque llega desde JSON/formulario.
        const un_2025_population = Number(body.un_2025_population);

        // Validacion general del recurso.
        // Si falla, el problema es que el JSON no representa un citys-stats valido.
        if (
            !city ||
            !country ||
            !Number.isInteger(un_2025_population) ||
            un_2025_population <= 0
        ) {
            return { error: "JSON body does not match expected structure" };
        }

        // Validacion nueva: el pais debe estar en la lista soportada.
        // Si no esta, no se guarda, porque luego REST Countries/World Bank no
        // podrian obtener ISO3 ni datos externos para las integraciones.
        if (!SUPPORTED_COUNTRIES.has(country)) {
            return { error: "Invalid country" };
        }

        // Si todo va bien, devolvemos el recurso listo para insertar o actualizar.
        return { item: { city, country, un_2025_population } };
    }

    // Envoltorio compatible con el código anterior.
    // parseCityStat da más detalle del error; esta función solo devuelve item o null.
    function normalizeCityStat(body) {
        return parseCityStat(body).item || null;
    }

    // Limpia un texto antes de enviarlo a una API externa.
    //
    // Por ejemplo:
    // "south-korea" pasa a "south korea"
    // "new_york" pasa a "new york"
    function cleanSearchTerm(value) {
        return String(value ?? "").trim().replace(/[-_]+/g, " ");
    }

    // Normaliza un nombre de país para poder compararlo con otros nombres.
    //
    // Esta función ayuda a cruzar datos entre distintas APIs, porque no todas
    // escriben los países exactamente igual.
    //
    // Hace varias cosas:
    // - Convierte a texto.
    // - Quita espacios.
    // - Elimina tildes.
    // - Sustituye guiones y barras bajas por espacios.
    // - Pasa todo a minúsculas.
    function normalizeCountryKey(value) {
        return String(value ?? "")
            .trim()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")//Borra esas marcas especiales de acentos/tildes.
            .replace(/[-_]+/g, " ")//Cambia guiones - y barras bajas _ por espacios.
            .toLowerCase();
    }

    // Convierte un código ISO3 a nombre de país si está en el diccionario.
    //
    // Si no se reconoce el código, devuelve el valor fallback.
    function countryFromIso3(value, fallback) {
        // Se convierte el código a mayúsculas.
        const code = String(value ?? "").trim().toUpperCase();

        // Si el código existe en ISO3_COUNTRY_NAMES, devuelve el país.
        // Si no existe, devuelve fallback.
        return ISO3_COUNTRY_NAMES[code] || fallback;
    }

    // Convierte un valor a número de forma segura.
    //
    // Si el valor no es un número válido, devuelve fallback.
    // Esto es útil porque muchas APIs externas devuelven números como texto
    // o incluso campos vacíos.
    function readFiniteNumber(value, fallback = null) {
        const parsed = Number(value);

        // Number.isFinite comprueba que sea un número real válido.
        return Number.isFinite(parsed) ? parsed : fallback;
    }

    // Convierte distintas formas de respuesta en un array.
    //
    // Algunas APIs devuelven directamente:
    // [ ... ]
    //
    // Otras devuelven:
    // { data: [...] }
    // { items: [...] }
    // { value: [...] }
    // { results: [...] }
    //
    // Esta función intenta cubrir esos casos.
    function asArray(data) {
        if (Array.isArray(data)) return data;
        if (Array.isArray(data?.data)) return data.data;
        if (Array.isArray(data?.items)) return data.items;
        if (Array.isArray(data?.value)) return data.value;
        if (Array.isArray(data?.results)) return data.results;

        // Si no reconoce ningún formato, devuelve un array vacío.
        return [];
    }

    // Convierte el parámetro limit en número y comprueba que sea válido.
    //
    // value: valor recibido por query.
    // fallback: valor por defecto si no se indica limit.
    // max: límite máximo permitido.
    function parseLimit(value, fallback, max) {
        // Si no se manda limit, se usa el valor por defecto.
        if (value === undefined) return fallback;

        // Se convierte a número.
        const limit = Number(value);

        // El limit debe ser:
        // - entero
        // - mayor o igual que 1
        // - menor o igual que max
        if (!Number.isInteger(limit) || limit < 1 || limit > max) {
            return null;
        }

        return limit;
    }

    function readTimedCache(cache, key) {
        const entry = cache.get(key);

        if (!entry) return { hit: false, value: null };

        if (entry.expiresAt <= Date.now()) {
            cache.delete(key);
            return { hit: false, value: null };
        }

        return { hit: true, value: entry.value };
    }

    function writeTimedCache(cache, key, value, ttlMs) {
        cache.set(key, {
            value,
            expiresAt: Date.now() + ttlMs
        });
    }

    // -------------------------------------------------------------------------
    // Caché para World Bank
    // -------------------------------------------------------------------------
    //
    // Esta caché evita pedir varias veces la población del mismo país al Banco Mundial.
    //
    // Ejemplo:
    // Si ya hemos pedido la población de JPN, se guarda en el Map.
    // La próxima vez se lee desde aquí, sin volver a llamar a la API externa.
    const worldBankPopulationCache = new Map();

    // -------------------------------------------------------------------------
    // Funciones auxiliares para leer datos locales
    // -------------------------------------------------------------------------

    // Lee todos los registros locales de citys-stats desde NeDB.
    //
    // Se envuelve db.find en una Promise para poder usar async/await.
    function findAllCityStats() {
        return new Promise((resolve, reject) => {
            db.find({}, (err, docs) => {
                if (err) return reject(err);

                // Se eliminan los _id antes de devolver los datos.
                resolve(docs.map(removeDatabaseId));
            });
        });
    }

    // Agrupa las ciudades locales por país.
    //
    // Sirve para convertir varios registros de ciudades en un resumen por país.
    //
    // Por ejemplo, si hay varias ciudades de India:
    // - delhi
    // - kolkata
    // - mumbai
    //
    // Esta función calcula:
    // - población total sumada
    // - ciudad con mayor población
    // - número de ciudades
    // - lista de ciudades ordenadas por población
    function buildCityCountrySummaries(items) {
        const byCountry = new Map();

        items.forEach((item) => {
            // Se crea una clave normalizada para poder agrupar por país.
            const key = normalizeCountryKey(item.country);
            if (!key) return;

            // Se lee la población de forma segura.
            const population = readFiniteNumber(item.un_2025_population, 0);

            // Si el país todavía no existe en el Map, se crea un resumen inicial.
            const current = byCountry.get(key) || {
                country: item.country,
                countryKey: key,
                city: item.city,
                topCity: item.city,
                topCityPopulation: population,
                cityCount: 0,
                un_2025_population: 0,
                cities: []
            };

            // Se incrementa el contador de ciudades.
            current.cityCount += 1;

            // Se suma la población de esta ciudad al total del país.
            current.un_2025_population += population;

            // Se añade la ciudad al listado interno.
            current.cities.push({
                city: item.city,
                population
            });

            // Si esta ciudad tiene más población que la actual ciudad principal,
            // se actualiza topCity.
            if (population > current.topCityPopulation) {
                current.city = item.city;
                current.topCity = item.city;
                current.topCityPopulation = population;
            }

            // Se guarda el resumen actualizado en el Map.
            byCountry.set(key, current);
        });

        // Se convierte el Map a array.
        // Además, las ciudades de cada país se ordenan de mayor a menor población.
        return [...byCountry.values()]
            .map((item) => ({
                ...item,
                cities: item.cities.sort((a, b) => b.population - a.population)
            }))
            // Finalmente, los países se ordenan por población total descendente.
            .sort((a, b) => b.un_2025_population - a.un_2025_population);
    }

    // -------------------------------------------------------------------------
    // Función genérica para llamar a APIs externas
    // -------------------------------------------------------------------------

    // Hace una petición HTTP y devuelve JSON.
    //
    // También controla:
    // - errores HTTP
    // - respuestas que no son JSON
    // - timeout para que la petición no se quede colgada
    // - cache de 5 minutos para no saturar APIs externas
    // - deduplicacion de peticiones simultaneas iguales
    async function fetchJson(url, sourceName, timeoutMs = 20000) {
        const cacheKey = `${sourceName}:${url}`;
        const cached = readTimedCache(externalJsonCache, cacheKey);

        if (cached.hit) {
            return cached.value;
        }

        if (externalJsonPendingRequests.has(cacheKey)) {
            return externalJsonPendingRequests.get(cacheKey);
        }

        const request = fetchJsonFromNetwork(url, sourceName, timeoutMs)
            .then((data) => {
                writeTimedCache(externalJsonCache, cacheKey, data, EXTERNAL_CACHE_TTL_MS);
                return data;
            })
            .finally(() => {
                externalJsonPendingRequests.delete(cacheKey);
            });

        externalJsonPendingRequests.set(cacheKey, request);
        return request;
    }

    async function fetchJsonFromNetwork(url, sourceName, timeoutMs = 20000) {
        // AbortController permite cancelar una petición fetch.
        const controller = new AbortController();

        // Si pasa más tiempo del permitido, se cancela la petición.
        const timeout = setTimeout(() => controller.abort(), timeoutMs);

        try {
            const response = await fetch(url, {
                headers: {
                    // Indicamos que queremos recibir JSON.
                    Accept: "application/json",

                    // User-Agent identificativo de nuestra integración.
                    "User-Agent": "SOS2526-29 citys-stats integration"
                },

                // Señal usada para cancelar la petición si supera el timeout.
                signal: controller.signal
            });

            // Se lee primero como texto.
            // Esto permite controlar mejor errores cuando la API no devuelve JSON.
            const text = await response.text();

            let data = null;

            try {
                // Si hay texto, se intenta convertir a JSON.
                data = text ? JSON.parse(text) : null;
            } catch {
                // Si JSON.parse falla, la API no ha devuelto JSON válido.
                throw new Error(`${sourceName} did not return JSON`);
            }

            // Si la respuesta HTTP no es correcta, lanzamos un error.
            if (!response.ok) {
                const reason = data?.message || data?.error || response.statusText;
                throw new Error(`${sourceName} returned ${response.status}: ${reason}`);
            }

            // Si todo va bien, se devuelve el JSON.
            return data;
        } catch (err) {
            // Si la petición fue cancelada por timeout, se devuelve un error claro.
            if (err.name === "AbortError") {
                throw new Error(`${sourceName} request timed out`);
            }

            // Cualquier otro error se vuelve a lanzar.
            throw err;
        } finally {
            // Se limpia el timeout tanto si la petición fue bien como si falló.
            clearTimeout(timeout);
        }
    }

    // -------------------------------------------------------------------------
    // Integración con Open-Meteo Geocoding API
    // -------------------------------------------------------------------------

    // Busca coordenadas y datos básicos de una ciudad en Open-Meteo.
    //
    // Devuelve información como:
    // - latitud
    // - longitud
    // - país
    // - zona horaria
    // - elevación
    async function getGeocoding(city, country = "") {
        // Se construyen los parámetros de búsqueda.
        const params = new URLSearchParams({
            name: cleanSearchTerm(city),
            count: "10",
            language: "en",
            format: "json"
        });

        // Se llama a la API externa usando la función genérica fetchJson.
        const data = await fetchJson(
            `https://geocoding-api.open-meteo.com/v1/search?${params.toString()}`,
            "Open-Meteo Geocoding API"
        );

        // Open-Meteo devuelve los resultados dentro de data.results.
        const results = Array.isArray(data?.results) ? data.results : [];

        // Si se ha enviado país, se usa para intentar elegir el resultado correcto.
        const countrySearch = cleanSearchTerm(country).toLowerCase();

        // Primero intenta encontrar una ciudad cuyo país coincida.
        // Si no encuentra coincidencia, usa el primer resultado.
        const match = results.find((item) =>
            countrySearch && String(item.country ?? "").toLowerCase() === countrySearch
        ) || results[0];

        // Si no hay ningún resultado, se devuelve null.
        if (!match) return null;

        // Se devuelve solo la información que nos interesa.
        return {
            source: "Open-Meteo Geocoding API",
            matchedName: match.name,
            country: match.country,
            countryCode: match.country_code,
            latitude: match.latitude,
            longitude: match.longitude,
            elevation: match.elevation ?? null,
            timezone: match.timezone ?? null,
            population: match.population ?? null
        };
    }

    // -------------------------------------------------------------------------
    // Integración con REST Countries API
    // -------------------------------------------------------------------------

    // Busca información general de un país.
    //
    // Devuelve datos como:
    // - nombre
    // - capital
    // - región
    // - población
    // - área
    // - códigos cca2 y cca3
    // - bandera
    // - enlace a Google Maps
    async function getCountryInfo(country) {
        // Campos concretos que queremos pedir a REST Countries.
        // Pedir solo los campos necesarios hace la respuesta más pequeña.
        const fields = [
            "name",
            "capital",
            "region",
            "subregion",
            "population",
            "area",
            "cca2",
            "cca3",
            "flags",
            "maps"
        ].join(",");

        // Se llama a REST Countries buscando por nombre de país.
        const data = await fetchJson(
            `https://restcountries.com/v3.1/name/${encodeURIComponent(cleanSearchTerm(country))}?fields=${fields}`,
            "REST Countries API"
        );

        // País buscado, normalizado para comparar.
        const target = cleanSearchTerm(country).toLowerCase();

        // REST Countries suele devolver un array.
        // Si no fuera array, lo metemos en un array para tratarlo igual.
        const items = Array.isArray(data) ? data : [data];

        // Se intenta elegir el país cuyo nombre común coincida exactamente.
        // Si no, se intenta con el nombre oficial.
        // Si tampoco, se usa el primer resultado.
        const item = items.find((countryItem) =>
            String(countryItem.name?.common ?? "").toLowerCase() === target
        ) || items.find((countryItem) =>
            String(countryItem.name?.official ?? "").toLowerCase() === target
        ) || items[0];

        if (!item) return null;

        // Se devuelve un objeto simplificado.
        return {
            source: "REST Countries API",
            name: item.name?.common ?? null,
            officialName: item.name?.official ?? null,
            capital: Array.isArray(item.capital) ? item.capital.join(", ") : null,
            region: item.region ?? null,
            subregion: item.subregion ?? null,
            population: item.population ?? null,
            area: item.area ?? null,
            cca2: item.cca2 ?? null,
            cca3: item.cca3 ?? null,
            flagPng: item.flags?.png ?? null,
            flagSvg: item.flags?.svg ?? null,
            googleMaps: item.maps?.googleMaps ?? null
        };
    }

    // -------------------------------------------------------------------------
    // Integración con World Bank
    // -------------------------------------------------------------------------

    // Busca la población más reciente de un país en World Bank.
    //
    // Recibe un código de país, normalmente ISO3.
    // Por ejemplo:
    // - JPN
    // - IND
    // - CHN
    async function getWorldBankPopulation(countryCode) {
        // Se normaliza el código a mayúsculas.
        const code = String(countryCode ?? "").trim().toUpperCase();

        // Si ya tenemos ese país en caché, se devuelve directamente.
        if (worldBankPopulationCache.has(code)) {
            return worldBankPopulationCache.get(code);
        }

        // Parámetros de World Bank:
        // - format=json: respuesta JSON
        // - mrv=1: most recent value, es decir, solo el dato más reciente
        const params = new URLSearchParams({
            format: "json",
            mrv: "1"
        });

        // Se llama a la API de indicadores del Banco Mundial.
        const data = await fetchJson(
            `https://api.worldbank.org/v2/country/${encodeURIComponent(code)}/indicator/SP.POP.TOTL?${params.toString()}`,
            "World Bank Indicators API",
            60000
        );

        // World Bank devuelve una estructura tipo:
        // [
        //   metadata,
        //   [ filas de datos ]
        // ]
        const rows = Array.isArray(data) && Array.isArray(data[1]) ? data[1] : [];

        // Se busca la primera fila que tenga valor.
        const row = rows.find((item) => item?.value !== null && item?.value !== undefined) || rows[0];

        // Se normaliza la fila al formato de nuestra API.
        const normalized = normalizeWorldBankRow(row, code);

        // Si hay dato válido, se guarda en caché.
        if (normalized) {
            worldBankPopulationCache.set(code, normalized);
        }

        return normalized;
    }

    // Convierte una fila de World Bank a un formato sencillo.
    function normalizeWorldBankRow(row, fallbackCode) {
        if (!row) return null;

        return {
            source: "World Bank Indicators API",
            indicator: row.indicator?.value ?? "Population, total",
            country: row.country?.value ?? null,
            countryCode: row.countryiso3code ?? fallbackCode,
            date: row.date ?? null,
            value: row.value ?? null
        };
    }

    // Busca poblaciones de varios países a la vez.
    //
    // Esto mejora el rendimiento, porque en lugar de hacer una petición por país,
    // se hace una petición para varios países juntos.
    async function getWorldBankPopulations(countryCodes) {
        // Se limpian los códigos:
        // - Se convierten a mayúsculas.
        // - Se eliminan vacíos.
        // - Se quitan duplicados con Set.
        const uniqueCodes = [...new Set(countryCodes
            .map((countryCode) => String(countryCode ?? "").trim().toUpperCase())
            .filter(Boolean)
        )];

        // Si no hay códigos, devolvemos un Map vacío.
        if (uniqueCodes.length === 0) return new Map();

        // Se detectan los códigos que todavía no están en caché.
        const missingCodes = uniqueCodes.filter((code) => !worldBankPopulationCache.has(code));

        // Solo pedimos a World Bank los países que faltan en caché.
        if (missingCodes.length > 0) {
            const params = new URLSearchParams({
                format: "json",
                mrv: "1",
                per_page: "100"
            });

            // World Bank permite pedir varios países separados por ;
            // Ejemplo:
            // JPN;IND;CHN
            const data = await fetchJson(
                `https://api.worldbank.org/v2/country/${missingCodes.join(";")}/indicator/SP.POP.TOTL?${params.toString()}`,
                "World Bank Indicators API",
                60000
            );

            const rows = Array.isArray(data) && Array.isArray(data[1]) ? data[1] : [];

            // Se normaliza cada fila y se guarda en caché.
            rows.forEach((row) => {
                const normalized = normalizeWorldBankRow(row, row?.countryiso3code);

                if (normalized?.countryCode && normalized.value !== null && normalized.value !== undefined) {
                    worldBankPopulationCache.set(normalized.countryCode, normalized);
                }
            });
        }

        // Se construye un Map final con los datos disponibles.
        const byCode = new Map();

        uniqueCodes.forEach((code) => {
            if (worldBankPopulationCache.has(code)) {
                byCode.set(code, worldBankPopulationCache.get(code));
            }
        });

        return byCode;
    }

    // -------------------------------------------------------------------------
    // Función para capturar errores de APIs externas
    // -------------------------------------------------------------------------

    // Ejecuta una tarea externa y devuelve siempre un objeto controlado.
    //
    // Si la tarea va bien:
    // {
    //   source,
    //   data,
    //   error: null
    // }
    //
    // Si la tarea falla:
    // {
    //   source,
    //   data: null,
    //   error: mensaje
    // }
    //
    // Esto permite que una API externa fallida no rompa todo el resumen integrado.
    async function safeExternal(source, task) {
        try {
            return { source, data: await task(), error: null };
        } catch (err) {
            return { source, data: null, error: err.message };
        }
    }

    // -------------------------------------------------------------------------
    // Construcción de datos integrados
    // -------------------------------------------------------------------------

    // Prepara la información externa básica de una ciudad o resumen de país.
    //
    // Llama en paralelo a:
    // - Open-Meteo Geocoding API
    // - REST Countries API
    //
    // Promise.all permite ejecutar ambas peticiones a la vez.
    async function buildIntegratedCityBase(item) {
        const [geocodingResult, countryResult] = await Promise.all([
            safeExternal("Open-Meteo Geocoding API", () => getGeocoding(item.city, item.country)),
            safeExternal("REST Countries API", () => getCountryInfo(item.country))
        ]);

        return {
            item,
            geocodingResult,
            countryResult
        };
    }

    // Une en un único objeto:
    // - datos locales de citys-stats
    // - geocoding
    // - información del país
    // - población World Bank
    // - APIs SOS externas de otros grupos
    function buildIntegratedCity(base, worldBankByCode, worldBankBatchError, studentApis) {
        // Código ISO3 del país obtenido desde REST Countries.
        const code = base.countryResult.data?.cca3;

        let worldBankResult;

        // Si no tenemos código ISO3, no podemos consultar World Bank.
        if (!code) {
            worldBankResult = {
                source: "World Bank Indicators API",
                data: null,
                error: "Country ISO3 code not available"
            };
        }

        // Si la llamada por lotes a World Bank falló, guardamos el error.
        else if (worldBankBatchError) {
            worldBankResult = {
                source: "World Bank Indicators API",
                data: null,
                error: worldBankBatchError
            };
        }

        // Si no hubo error, intentamos leer el dato del Map.
        else {
            const data = worldBankByCode.get(code) ?? null;

            worldBankResult = {
                source: "World Bank Indicators API",
                data,
                error: data ? null : "World Bank data not found"
            };
        }

        // Clave normalizada del país para cruzarlo con las APIs externas.
        const countryKey = normalizeCountryKey(base.item.country);

        // Se buscan los datos de cada API externa por país.
        const touristArrivals = studentApis?.touristByCountry?.get(countryKey) ?? null;
        const earthquakeStats = studentApis?.earthquakesByCountry?.get(countryKey) ?? null;
        const fifaSquadValue = studentApis?.fifaByCountry?.get(countryKey) ?? null;
        const esportsEarnings = studentApis?.esportsByCountry?.get(countryKey) ?? null;

        // Lista de resultados de integraciones principales.
        // Luego se usa para construir integrationErrors.
        const integrationResults = [
            base.geocodingResult,
            base.countryResult,
            worldBankResult
        ];

        // Si alguna API externa de estudiantes falló, se añade a integrationResults
        // para que el error aparezca en la respuesta final.
        if (studentApis?.touristResult?.error) {
            integrationResults.push(studentApis.touristResult);
        }

        if (studentApis?.earthquakeResult?.error) {
            integrationResults.push(studentApis.earthquakeResult);
        }

        if (studentApis?.fifaResult?.error) {
            integrationResults.push(studentApis.fifaResult);
        }

        if (studentApis?.esportsResult?.error) {
            integrationResults.push(studentApis.esportsResult);
        }

        // Objeto final integrado.
        return {
            city: base.item.city,
            country: base.item.country,

            // Datos agregados locales.
            cityCount: base.item.cityCount ?? 1,
            topCity: base.item.topCity ?? base.item.city,
            topCityPopulation: base.item.topCityPopulation ?? base.item.un_2025_population,
            cities: base.item.cities ?? [{
                city: base.item.city,
                population: base.item.un_2025_population
            }],

            // Población local de citys-stats.
            un_2025_population: base.item.un_2025_population,

            // Datos externos principales.
            geocoding: base.geocodingResult.data,
            countryInfo: base.countryResult.data,
            worldBankPopulation: worldBankResult.data,

            // Datos de APIs SOS externas.
            touristArrivals,
            earthquakeStats,
            fifaSquadValue,
            esportsEarnings,

            // Lista de errores de integración, si los hay.
            integrationErrors: integrationResults
                .filter((result) => result.error)
                .map((result) => ({
                    source: result.source,
                    error: result.error
                }))
        };
    }

    // -------------------------------------------------------------------------
    // Integración con SOS2526-25: International Tourist Arrivals
    // -------------------------------------------------------------------------

    // Normaliza una fila de llegadas turísticas.
    //
    // Convierte una fila externa al formato común que usa esta API.
    function normalizeTouristArrival(row) {
        const country = String(row?.country ?? "").trim();
        const year = readFiniteNumber(row?.year);
        const airArrival = readFiniteNumber(row?.air_arrival, 0);
        const waterArrival = readFiniteNumber(row?.water_arrival, 0);
        const landArrival = readFiniteNumber(row?.land_arrival, 0);

        // Si falta país o año, la fila no es útil.
        if (!country || year === null) return null;

        return {
            source: "SOS2526-25 International Tourist Arrivals API",
            country,
            year,
            airArrival,
            waterArrival,
            landArrival,

            // Total calculado sumando llegadas por aire, agua y tierra.
            totalArrivals: airArrival + waterArrival + landArrival
        };
    }

    // Descarga todos los datos de llegadas turísticas.
    async function getTouristArrivals() {
        const data = await fetchJson(
            TOURIST_ARRIVALS_API_URL,
            "SOS2526-25 International Tourist Arrivals API",
            60000
        );

        // asArray permite aceptar distintas formas de respuesta.
        // Después se normaliza cada fila y se eliminan las inválidas.
        return asArray(data).map(normalizeTouristArrival).filter(Boolean);
    }

    // Agrupa llegadas turísticas por país.
    //
    // Calcula:
    // - número de registros
    // - llegadas totales acumuladas
    // - último año disponible
    // - llegadas del último año
    function buildTouristArrivalsByCountry(rows) {
        const byCountry = new Map();

        rows.forEach((row) => {
            const key = normalizeCountryKey(row.country);
            if (!key) return;

            const current = byCountry.get(key) || {
                source: row.source,
                country: row.country,
                records: 0,
                totalArrivals: 0,
                latestYear: null,
                latestTotalArrivals: 0
            };

            current.records += 1;
            current.totalArrivals += row.totalArrivals;

            // Se guarda el dato del año más reciente.
            if (current.latestYear === null || row.year > current.latestYear) {
                current.latestYear = row.year;
                current.latestTotalArrivals = row.totalArrivals;
            }

            byCountry.set(key, current);
        });

        return byCountry;
    }

    // -------------------------------------------------------------------------
    // Integración con SOS2526-19: Earthquakes
    // -------------------------------------------------------------------------

    // Normaliza una fila de terremotos.
    function normalizeEarthquake(row) {
        // Algunas filas pueden traer ISO3 en vez de país.
        // countryFromIso3 intenta convertirlo a nombre de país.
        const country = String(countryFromIso3(row?.iso3, row?.country) ?? "").trim();

        const severity = readFiniteNumber(row?.severity);

        // Si falta país o severidad, la fila no sirve para comparar.
        if (!country || severity === null) return null;

        return {
            source: "SOS2526-19 Earthquakes API",
            country,
            name: row?.name ?? row?.description ?? "Earthquake",
            date: row?.fromdate ?? row?.date ?? null,
            severity,
            depth: readFiniteNumber(row?.depth),
            alertLevel: row?.alertlevel ?? row?.episodealertlevel ?? null,
            exposedPopulation: readFiniteNumber(row?.exposed_population, 0)
        };
    }

    // Descarga los terremotos desde la API externa.
    async function getEarthquakes() {
        const data = await fetchJson(
            EARTHQUAKES_API_URL,
            "SOS2526-19 Earthquakes API",
            60000
        );

        return asArray(data).map(normalizeEarthquake).filter(Boolean);
    }

    // Agrupa terremotos por país.
    //
    // Calcula:
    // - número de eventos
    // - severidad máxima
    // - población expuesta acumulada
    // - fecha más reciente
    function buildEarthquakesByCountry(rows) {
        const byCountry = new Map();

        rows.forEach((row) => {
            const key = normalizeCountryKey(row.country);
            if (!key) return;

            const current = byCountry.get(key) || {
                source: row.source,
                country: row.country,
                records: 0,
                maxSeverity: 0,
                exposedPopulation: 0,
                latestDate: null
            };

            current.records += 1;

            // Se conserva la mayor severidad encontrada para ese país.
            current.maxSeverity = Math.max(current.maxSeverity, row.severity);

            // Se suma la población expuesta.
            current.exposedPopulation += row.exposedPopulation || 0;

            // Se conserva la fecha más reciente.
            if (!current.latestDate || (row.date && row.date > current.latestDate)) {
                current.latestDate = row.date;
            }

            byCountry.set(key, current);
        });

        return byCountry;
    }

    // -------------------------------------------------------------------------
    // Integración con SOS2526-26: FIFA Squad Values
    // -------------------------------------------------------------------------

    // Normaliza una fila de valor de plantillas FIFA.
    function normalizeFifaSquadValue(row) {
        const country = String(row?.country ?? "").trim();
        const year = readFiniteNumber(row?.year);
        const squadSize = readFiniteNumber(row?.squad_size, 0);
        const totalMarketValue = readFiniteNumber(row?.total_market_value, 0);
        const averageMarketValue = readFiniteNumber(row?.average_market_value, 0);

        // Si falta país o año, se descarta.
        if (!country || year === null) return null;

        return {
            source: "SOS2526-26 FIFA Squad Value API",
            country,
            year,
            squadSize,
            totalMarketValue,
            averageMarketValue
        };
    }

    // Descarga valores FIFA desde la API externa.
    async function getFifaSquadValues() {
        const data = await fetchJson(
            FIFA_SQUAD_VALUES_API_URL,
            "SOS2526-26 FIFA Squad Value API",
            60000
        );

        return asArray(data).map(normalizeFifaSquadValue).filter(Boolean);
    }

    // Agrupa valores FIFA por país.
    //
    // Calcula:
    // - número de registros
    // - valor total acumulado
    // - último año disponible
    // - valor total del último año
    // - valor medio del último año
    // - tamaño de plantilla del último año
    function buildFifaSquadValuesByCountry(rows) {
        const byCountry = new Map();

        rows.forEach((row) => {
            const key = normalizeCountryKey(row.country);
            if (!key) return;

            const current = byCountry.get(key) || {
                source: row.source,
                country: row.country,
                records: 0,
                totalMarketValue: 0,
                latestYear: null,
                latestTotalMarketValue: 0,
                latestAverageMarketValue: 0,
                latestSquadSize: 0
            };

            current.records += 1;
            current.totalMarketValue += row.totalMarketValue;

            // Se guarda el registro del año más reciente.
            if (current.latestYear === null || row.year > current.latestYear) {
                current.latestYear = row.year;
                current.latestTotalMarketValue = row.totalMarketValue;
                current.latestAverageMarketValue = row.averageMarketValue;
                current.latestSquadSize = row.squadSize;
            }

            byCountry.set(key, current);
        });

        return byCountry;
    }

    // -------------------------------------------------------------------------
    // Integración con SOS2526-30: Esports Earnings
    // -------------------------------------------------------------------------

    // Normaliza una fila de ganancias de eSports.
    function normalizeEsportsEarning(row) {
        const country = String(row?.country ?? "").trim();
        const gameName = String(row?.game_name ?? "").trim();
        const genre = String(row?.genre ?? "").trim();
        const year = readFiniteNumber(row?.year);

        // Si falta país, juego o año, se descarta la fila.
        if (!country || !gameName || year === null) return null;

        return {
            source: "SOS2526-30 Esports Earnings API",
            country,
            gameName,
            genre: genre || null,
            year,
            totalMoney: readFiniteNumber(row?.total_money, 0),
            playerNo: readFiniteNumber(row?.player_no, 0),
            tournamentNo: readFiniteNumber(row?.tournament_no, 0),
            topCountryEarnings: readFiniteNumber(row?.top_country_earnings, 0)
        };
    }

    // Descarga datos de ganancias de eSports.
    async function getEsportsEarnings() {
        const data = await fetchJson(
            ESPORTS_EARNINGS_API_URL,
            "SOS2526-30 Esports Earnings API",
            60000
        );

        return asArray(data).map(normalizeEsportsEarning).filter(Boolean);
    }

    // Agrupa ganancias de eSports por país.
    //
    // Calcula:
    // - número de registros
    // - dinero total
    // - número total de jugadores
    // - número total de torneos
    // - ganancias destacadas
    // - juego más reciente
    // - juego con más ganancias
    function buildEsportsEarningsByCountry(rows) {
        const byCountry = new Map();

        rows.forEach((row) => {
            const key = normalizeCountryKey(row.country);
            if (!key) return;

            const current = byCountry.get(key) || {
                source: row.source,
                country: row.country,
                records: 0,
                totalMoney: 0,
                playerNo: 0,
                tournamentNo: 0,
                topCountryEarnings: 0,
                latestYear: null,
                latestGameName: null,
                latestGenre: null,
                latestTotalMoney: 0,
                topGameName: null,
                topGameGenre: null,
                topGameYear: null,
                topGameEarnings: 0
            };

            current.records += 1;
            current.totalMoney += row.totalMoney;
            current.playerNo += row.playerNo;
            current.tournamentNo += row.tournamentNo;
            current.topCountryEarnings += row.topCountryEarnings;

            // Se guarda el juego del año más reciente.
            if (current.latestYear === null || row.year > current.latestYear) {
                current.latestYear = row.year;
                current.latestGameName = row.gameName;
                current.latestGenre = row.genre;
                current.latestTotalMoney = row.totalMoney;
            }

            // Se guarda el juego con más ganancias destacadas.
            if (row.topCountryEarnings > current.topGameEarnings) {
                current.topGameName = row.gameName;
                current.topGameGenre = row.genre;
                current.topGameYear = row.year;
                current.topGameEarnings = row.topCountryEarnings;
            }

            byCountry.set(key, current);
        });

        return byCountry;
    }

    // RUTA:
    // GET /api/v1/citys-stats/docs
    //
    // CABECERA:
    // app.get(`${BASE_API_URL}/docs`, (request, response) => { ... });
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
    app.get(`${BASE_API_URL}/docs`, (request, response) => {
        response.redirect(DOCS_URL);
    });

    // RUTA:
    // GET /api/v1/citys-stats/loadInitialData
    //
    // CABECERA:
    // app.get(`${BASE_API_URL}/loadInitialData`, (request, response) => { ... });
    //
    // TIPO:
    // Usa callbacks de NeDB.
    //
    // FLUJO:
    // 1. Entra cuando alguien pide /loadInitialData.
    // 2. Cuenta registros con db.count.
    // 3. Si ya hay datos, hace db.find.
    // 4. Si no hay datos, hace db.insert(initialData).
    // 5. Quita _id antes de responder.
    //
    // USA:
    // - removeDatabaseId
    // - initialData
    //
    // RESPUESTA:
    // - 200 con datos existentes.
    // - 201 con datos creados.
    // - 500 si falla la base de datos.
    app.get(`${BASE_API_URL}/loadInitialData`, (request, response) => {

        // Cuenta todos los documentos de la colección.
        db.count({}, (error, count) => {
            if (error) return response.sendStatus(500);

            // Si ya hay documentos, no se insertan datos duplicados.
            if (count > 0) {
                db.find({}, (findError, docs) => {
                    if (findError) return response.sendStatus(500);

                    // Se devuelven los documentos existentes sin _id.
                    return response.status(200).json(docs.map(removeDatabaseId));
                });

                // Evita que el código siga y ejecute db.insert.
                return;
            }

            // Si la colección está vacía, se insertan los datos iniciales.
            db.insert(initialData, (insertError, docs) => {
                if (insertError) return response.sendStatus(500);

                // 201 Created indica que se han creado recursos nuevos.
                return response.status(201).json(docs.map(removeDatabaseId));
            });
        });
    });

    // RUTA:
    // GET /api/v1/citys-stats
    //
    // CABECERA:
    // app.get(BASE_API_URL, (request, response) => { ... });
    //
    // TIPO:
    // Usa callback de NeDB.
    //
    // FLUJO:
    // 1. Entra cuando alguien pide la coleccion.
    // 2. Lee todos los registros con db.find.
    // 3. Quita _id.
    // 4. Aplica filtros de query si vienen.
    // 5. Aplica paginacion con offset y limit.
    // 6. Devuelve el array final.
    //
    // USA:
    // - removeDatabaseId
    //
    // RESPUESTA:
    // - 200 con JSON.
    // - 400 si un filtro numerico no vale.
    // - 500 si falla la base de datos.
    app.get(BASE_API_URL, (request, response) => {

        // Se leen todos los documentos de la base de datos.
        db.find({}, (error, docs) => {
            if (error) return response.sendStatus(500);

            // Se elimina el _id interno de NeDB.
            let result = docs.map(removeDatabaseId);

            // -----------------------------------------------------------------
            // Filtro exacto por ciudad
            // -----------------------------------------------------------------
            if (request.query.city !== undefined) {
                result = result.filter(
                    item => item.city === String(request.query.city).trim().toLowerCase()
                );
            }

            // -----------------------------------------------------------------
            // Filtro exacto por país
            // -----------------------------------------------------------------
            if (request.query.country !== undefined) {
                result = result.filter(
                    item => item.country === String(request.query.country).trim().toLowerCase()
                );
            }

            // -----------------------------------------------------------------
            // Filtro exacto por población
            // -----------------------------------------------------------------
            if (request.query.un_2025_population !== undefined) {
                const value = Number(request.query.un_2025_population);

                // Si el valor recibido no es un número válido, se responde 400.
                if (!Number.isFinite(value)) {
                    return response.status(400).json({ error: "Invalid query" });
                }

                result = result.filter(item => item.un_2025_population === value);
            }

            // -----------------------------------------------------------------
            // Paginación
            // -----------------------------------------------------------------
            //
            // offset: cuántos resultados se saltan.
            // limit: cuántos resultados se devuelven.
            let offset = 0;
            let limit = result.length;

            if (request.query.offset !== undefined) {
                offset = Number(request.query.offset);

                // offset debe ser entero y no negativo.
                if (!Number.isInteger(offset) || offset < 0) {
                    return response.status(400).json({ error: "Invalid offset" });
                }
            }

            if (request.query.limit !== undefined) {
                limit = Number(request.query.limit);

                // limit debe ser entero y no negativo.
                if (!Number.isInteger(limit) || limit < 0) {
                    return response.status(400).json({ error: "Invalid limit" });
                }
            }

            // slice aplica la paginación.
            return response.status(200).json(result.slice(offset, offset + limit));
        });
    });

    // RUTA:
    // GET /api/v1/citys-stats/top-cities
    //
    // CABECERA:
    // app.get(`${BASE_API_URL}/top-cities`, async (request, response) => { ... });
    //
    // TIPO:
    // Asincrona.
    //
    // FLUJO:
    // 1. Lee query.limit.
    // 2. Valida limit.
    // 3. Lee datos locales.
    // 4. Ordena por poblacion.
    // 5. Aplica slice.
    // 6. Devuelve las ciudades top.
    //
    // USA:
    // - parseLimit
    // - findAllCityStats
    //
    // RESPUESTA:
    // - 200 con JSON.
    // - 400 si limit no vale.
    // - 500 si falla la base de datos.
    app.get(`${BASE_API_URL}/top-cities`, async (request, response) => {

        // Se lee y valida el parámetro limit.
        // Valor por defecto: 5.
        // Máximo permitido: 20.
        const limit = parseLimit(request.query.limit, 5, 20);

        if (limit === null) {
            return response.status(400).json({ error: "Invalid limit" });
        }

        try {
            const result = (await findAllCityStats())
                // Ordena de mayor a menor población.
                .sort((a, b) => Number(b.un_2025_population) - Number(a.un_2025_population))
                // Se queda solo con los primeros "limit".
                .slice(0, limit);

            return response.status(200).json(result);
        } catch {
            return response.sendStatus(500);
        }
    });

    // RUTA:
    // GET /api/v1/citys-stats/country-summaries
    //
    // CABECERA:
    // app.get(`${BASE_API_URL}/country-summaries`, async (request, response) => { ... });
    //
    // TIPO:
    // Asincrona.
    //
    // FLUJO:
    // 1. Lee query.limit.
    // 2. Valida limit.
    // 3. Lee datos locales.
    // 4. Agrupa ciudades por pais.
    // 5. Aplica slice.
    // 6. Devuelve resumen por pais.
    //
    // USA:
    // - parseLimit
    // - findAllCityStats
    // - buildCityCountrySummaries
    //
    // RESPUESTA:
    // - 200 con JSON.
    // - 400 si limit no vale.
    // - 500 si falla la base de datos.
    app.get(`${BASE_API_URL}/country-summaries`, async (request, response) => {
        const limit = parseLimit(request.query.limit, 8, 20);

        if (limit === null) {
            return response.status(400).json({ error: "Invalid limit" });
        }

        try {
            // Lee todos los registros locales, los agrupa por país y aplica limit.
            const result = buildCityCountrySummaries(await findAllCityStats()).slice(0, limit);

            return response.status(200).json(result);
        } catch {
            return response.sendStatus(500);
        }
    });

    // RUTA:
    // GET /api/v1/citys-stats/integrations/geocoding/:city
    //
    // CABECERA:
    // app.get(`${BASE_API_URL}/integrations/geocoding/:city`, async (req, res) => { ... });
    //
    // TIPO:
    // Asincrona.
    //
    // FLUJO:
    // 1. Lee req.params.city.
    // 2. Lee req.query.country si viene.
    // 3. Llama a Open-Meteo.
    // 4. Devuelve datos de geocoding.
    //
    // USA:
    // - getGeocoding
    // - fetchJson
    //
    // RESPUESTA:
    // - 200 con JSON.
    // - 404 si no encuentra ciudad.
    // - 502 si falla la API externa.
    app.get(`${BASE_API_URL}/integrations/geocoding/:city`, async (req, res) => {
        try {
            // req.params.city viene de :city.
            // req.query.country es opcional y ayuda a elegir mejor la ciudad.
            const result = await getGeocoding(req.params.city, req.query.country);

            if (!result) {
                return res.status(404).json({ error: "City not found in external API" });
            }

            return res.status(200).json(result);
        } catch (err) {
            // 502 Bad Gateway se usa porque el fallo viene de una API externa.
            return res.status(502).json({ error: err.message });
        }
    });

    // RUTA:
    // GET /api/v1/citys-stats/integrations/country/:country
    //
    // CABECERA:
    // app.get(`${BASE_API_URL}/integrations/country/:country`, async (req, res) => { ... });
    //
    // TIPO:
    // Asincrona.
    //
    // FLUJO:
    // 1. Lee req.params.country.
    // 2. Llama a REST Countries.
    // 3. Normaliza la respuesta.
    // 4. Devuelve datos del pais.
    //
    // USA:
    // - getCountryInfo
    // - fetchJson
    //
    // RESPUESTA:
    // - 200 con JSON.
    // - 404 si no encuentra pais.
    // - 502 si falla la API externa.
    app.get(`${BASE_API_URL}/integrations/country/:country`, async (req, res) => {
        try {
            const result = await getCountryInfo(req.params.country);

            if (!result) {
                return res.status(404).json({ error: "Country not found in external API" });
            }

            return res.status(200).json(result);
        } catch (err) {
            return res.status(502).json({ error: err.message });
        }
    });

    // RUTA:
    // GET /api/v1/citys-stats/integrations/world-bank/:countryCode
    //
    // CABECERA:
    // app.get(`${BASE_API_URL}/integrations/world-bank/:countryCode`, async (req, res) => { ... });
    //
    // TIPO:
    // Asincrona.
    //
    // FLUJO:
    // 1. Lee req.params.countryCode.
    // 2. Busca en cache.
    // 3. Si no esta, llama a World Bank.
    // 4. Normaliza la poblacion.
    // 5. Guarda en cache.
    // 6. Devuelve el resultado.
    //
    // USA:
    // - getWorldBankPopulation
    // - fetchJson
    // - normalizeWorldBankRow
    //
    // RESPUESTA:
    // - 200 con JSON.
    // - 404 si no hay datos.
    // - 502 si falla la API externa.
    app.get(`${BASE_API_URL}/integrations/world-bank/:countryCode`, async (req, res) => {
        try {
            const result = await getWorldBankPopulation(req.params.countryCode);

            if (!result) {
                return res.status(404).json({ error: "World Bank data not found" });
            }

            return res.status(200).json(result);
        } catch (err) {
            return res.status(502).json({ error: err.message });
        }
    });

    // RUTA:
    // GET /api/v1/citys-stats/integrations/sos-tourist-arrivals
    //
    // CABECERA:
    // app.get(`${BASE_API_URL}/integrations/sos-tourist-arrivals`, async (req, res) => { ... });
    //
    // TIPO:
    // Asincrona.
    //
    // FLUJO:
    // 1. Llama a la API SOS2526-25.
    // 2. Normaliza filas.
    // 3. Agrupa por pais.
    // 4. Ordena por llegadas.
    // 5. Devuelve resultado.
    //
    // USA:
    // - getTouristArrivals
    // - buildTouristArrivalsByCountry
    //
    // RESPUESTA:
    // - 200 con JSON.
    // - 502 si falla la API externa.
    app.get(`${BASE_API_URL}/integrations/sos-tourist-arrivals`, async (req, res) => {
        try {
            const rows = await getTouristArrivals();

            const countries = [...buildTouristArrivalsByCountry(rows).values()]
                .sort((a, b) => b.totalArrivals - a.totalArrivals);

            return res.status(200).json({
                source: "SOS2526-25 International Tourist Arrivals API",
                endpoint: TOURIST_ARRIVALS_API_URL,
                count: rows.length,
                countries
            });
        } catch (err) {
            return res.status(502).json({ error: err.message });
        }
    });

    // RUTA:
    // GET /api/v1/citys-stats/integrations/sos-earthquakes
    //
    // CABECERA:
    // app.get(`${BASE_API_URL}/integrations/sos-earthquakes`, async (req, res) => { ... });
    //
    // TIPO:
    // Asincrona.
    //
    // FLUJO:
    // 1. Llama a la API SOS2526-19.
    // 2. Normaliza filas.
    // 3. Agrupa por pais.
    // 4. Ordena por severidad.
    // 5. Devuelve resultado.
    //
    // USA:
    // - getEarthquakes
    // - buildEarthquakesByCountry
    //
    // RESPUESTA:
    // - 200 con JSON.
    // - 502 si falla la API externa.
    app.get(`${BASE_API_URL}/integrations/sos-earthquakes`, async (req, res) => {
        try {
            const rows = await getEarthquakes();

            const countries = [...buildEarthquakesByCountry(rows).values()]
                .sort((a, b) => b.maxSeverity - a.maxSeverity);

            return res.status(200).json({
                source: "SOS2526-19 Earthquakes API",
                endpoint: EARTHQUAKES_API_URL,
                count: rows.length,
                countries
            });
        } catch (err) {
            return res.status(502).json({ error: err.message });
        }
    });

    // RUTA:
    // GET /api/v1/citys-stats/integrations/sos-fifa-squad-values
    //
    // CABECERA:
    // app.get(`${BASE_API_URL}/integrations/sos-fifa-squad-values`, async (req, res) => { ... });
    //
    // TIPO:
    // Asincrona.
    //
    // FLUJO:
    // 1. Llama a la API SOS2526-26.
    // 2. Normaliza filas.
    // 3. Agrupa por pais.
    // 4. Ordena por valor de plantilla.
    // 5. Devuelve resultado.
    //
    // USA:
    // - getFifaSquadValues
    // - buildFifaSquadValuesByCountry
    //
    // RESPUESTA:
    // - 200 con JSON.
    // - 502 si falla la API externa.
    app.get(`${BASE_API_URL}/integrations/sos-fifa-squad-values`, async (req, res) => {
        try {
            const rows = await getFifaSquadValues();

            const countries = [...buildFifaSquadValuesByCountry(rows).values()]
                .sort((a, b) => b.latestTotalMarketValue - a.latestTotalMarketValue);

            return res.status(200).json({
                source: "SOS2526-26 FIFA Squad Value API",
                endpoint: FIFA_SQUAD_VALUES_API_URL,
                count: rows.length,
                countries
            });
        } catch (err) {
            return res.status(502).json({ error: err.message });
        }
    });

    // RUTA:
    // GET /api/v1/citys-stats/integrations/sos-esports-earnings
    //
    // CABECERA:
    // app.get(`${BASE_API_URL}/integrations/sos-esports-earnings`, async (req, res) => { ... });
    //
    // TIPO:
    // Asincrona.
    //
    // FLUJO:
    // 1. Llama a la API SOS2526-30.
    // 2. Normaliza filas.
    // 3. Agrupa por pais.
    // 4. Ordena por ganancias.
    // 5. Devuelve resultado.
    //
    // USA:
    // - getEsportsEarnings
    // - buildEsportsEarningsByCountry
    //
    // RESPUESTA:
    // - 200 con JSON.
    // - 502 si falla la API externa.
    app.get(`${BASE_API_URL}/integrations/sos-esports-earnings`, async (req, res) => {
        try {
            const rows = await getEsportsEarnings();

            const countries = [...buildEsportsEarningsByCountry(rows).values()]
                .sort((a, b) => b.topCountryEarnings - a.topCountryEarnings);

            return res.status(200).json({
                source: "SOS2526-30 Esports Earnings API",
                endpoint: ESPORTS_EARNINGS_API_URL,
                count: rows.length,
                countries
            });
        } catch (err) {
            return res.status(502).json({ error: err.message });
        }
    });

    // RUTA:
    // GET /api/v1/citys-stats/integrations/summary
    //
    // CABECERA:
    // app.get(`${BASE_API_URL}/integrations/summary`, async (req, res) => { ... });
    //
    // TIPO:
    // Asincrona.
    //
    // FLUJO:
    // 1. Lee query.limit.
    // 2. Carga datos locales y agrupa por pais.
    // 3. Llama a Open-Meteo y REST Countries en paralelo.
    // 4. Llama a World Bank.
    // 5. Llama a APIs SOS externas en paralelo.
    // 6. Une todo en un resumen.
    // 7. Devuelve resultado.
    //
    // USA:
    // - parseLimit
    // - findAllCityStats
    // - buildCityCountrySummaries
    // - buildIntegratedCityBase
    // - buildIntegratedCity
    //
    // RESPUESTA:
    // - 200 con JSON.
    // - 400 si limit no vale.
    // - 500 si falla el proceso general.
    app.get(`${BASE_API_URL}/integrations/summary`, async (req, res) => {
        const limit = parseLimit(req.query.limit, 8, 20);

        if (limit === null) {
            return res.status(400).json({ error: "Invalid limit" });
        }

        try {
            // 1. Se leen los datos locales y se agrupan por país.
            const countrySummaries = buildCityCountrySummaries(await findAllCityStats())
                .slice(0, limit);

            // 2. Para cada país, se preparan datos de Open-Meteo y REST Countries.
            const integrationBases = await Promise.all(countrySummaries.map(buildIntegratedCityBase));

            // 3. Se extraen los códigos ISO3 obtenidos desde REST Countries.
            // Estos códigos se usarán para consultar World Bank.
            const countryCodes = integrationBases
                .map((base) => base.countryResult.data?.cca3)
                .filter(Boolean);

            let worldBankByCode = new Map();
            let worldBankBatchError = null;

            // 4. Se intenta consultar World Bank por lotes.
            // Si falla, se guarda el error pero no se rompe toda la respuesta.
            try {
                worldBankByCode = await getWorldBankPopulations(countryCodes);
            } catch (err) {
                worldBankBatchError = err.message;
            }

            // 5. Se consultan las APIs externas de otros grupos en paralelo.
            //
            // safeExternal evita que un fallo en una API externa rompa todo.
            const [touristResult, earthquakeResult, fifaResult, esportsResult] = await Promise.all([
                safeExternal("SOS2526-25 International Tourist Arrivals API", getTouristArrivals),
                safeExternal("SOS2526-19 Earthquakes API", getEarthquakes),
                safeExternal("SOS2526-26 FIFA Squad Value API", getFifaSquadValues),
                safeExternal("SOS2526-30 Esports Earnings API", getEsportsEarnings)
            ]);

            // 6. Si las APIs han devuelto datos, se agrupan por país.
            // Si han fallado, se usa un Map vacío.
            const touristByCountry = touristResult.data
                ? buildTouristArrivalsByCountry(touristResult.data)
                : new Map();

            const earthquakesByCountry = earthquakeResult.data
                ? buildEarthquakesByCountry(earthquakeResult.data)
                : new Map();

            const fifaByCountry = fifaResult.data
                ? buildFifaSquadValuesByCountry(fifaResult.data)
                : new Map();

            const esportsByCountry = esportsResult.data
                ? buildEsportsEarningsByCountry(esportsResult.data)
                : new Map();

            // 7. Se agrupan todos los resultados externos para pasarlos a buildIntegratedCity.
            const studentApis = {
                touristResult,
                earthquakeResult,
                fifaResult,
                esportsResult,
                touristByCountry,
                earthquakesByCountry,
                fifaByCountry,
                esportsByCountry
            };

            // 8. Se construye el resultado integrado final para cada país.
            const integrations = integrationBases.map((base) =>
                buildIntegratedCity(base, worldBankByCode, worldBankBatchError, studentApis)
            );

            const touristCountries = [...touristByCountry.values()]
                .sort((a, b) => b.totalArrivals - a.totalArrivals);

            const earthquakeCountries = [...earthquakesByCountry.values()]
                .sort((a, b) => b.maxSeverity - a.maxSeverity);

            const fifaCountries = [...fifaByCountry.values()]
                .sort((a, b) => b.latestTotalMarketValue - a.latestTotalMarketValue);

            const esportsCountries = [...esportsByCountry.values()]
                .sort((a, b) => b.topCountryEarnings - a.topCountryEarnings);

            // 9. Se devuelve el resumen completo.
            const payload = {
                // Endpoint local usado como base.
                localResource: `${BASE_API_URL}/country-summaries`,

                // Lista de APIs externas usadas.
                externalApis: [
                    "Open-Meteo Geocoding API",
                    "REST Countries API",
                    "World Bank Indicators API",
                    "SOS2526-25 International Tourist Arrivals API",
                    "SOS2526-19 Earthquakes API",
                    "SOS2526-26 FIFA Squad Value API",
                    "SOS2526-30 Esports Earnings API"
                ],

                // Resumen específico de las APIs de otros grupos.
                studentApis: [
                    {
                        source: "SOS2526-25 International Tourist Arrivals API",
                        endpoint: TOURIST_ARRIVALS_API_URL,
                        count: touristResult.data?.length ?? 0,
                        error: touristResult.error,
                        metricLabel: "Llegadas totales",

                        // Top 5 países por llegadas turísticas.
                        countries: touristCountries
                            .slice(0, 5)
                            .map((country) => ({
                                country: country.country,
                                metric: country.totalArrivals,
                                detail: `${country.records} registros`
                            }))
                    },
                    {
                        source: "SOS2526-19 Earthquakes API",
                        endpoint: EARTHQUAKES_API_URL,
                        count: earthquakeResult.data?.length ?? 0,
                        error: earthquakeResult.error,
                        metricLabel: "Severidad maxima",

                        // Top 5 países por severidad máxima.
                        countries: earthquakeCountries
                            .slice(0, 5)
                            .map((country) => ({
                                country: country.country,
                                metric: country.maxSeverity,
                                detail: `${country.records} eventos`
                            }))
                    },
                    {
                        source: "SOS2526-26 FIFA Squad Value API",
                        endpoint: FIFA_SQUAD_VALUES_API_URL,
                        count: fifaResult.data?.length ?? 0,
                        error: fifaResult.error,
                        metricLabel: "Valor plantilla",

                        // Top 5 países por valor de plantilla más reciente.
                        countries: fifaCountries
                            .slice(0, 5)
                            .map((country) => ({
                                country: country.country,
                                metric: country.latestTotalMarketValue,
                                detail: `${country.latestYear}, ${country.latestSquadSize} jugadores`
                            }))
                    },
                    {
                        source: "SOS2526-30 Esports Earnings API",
                        endpoint: ESPORTS_EARNINGS_API_URL,
                        count: esportsResult.data?.length ?? 0,
                        error: esportsResult.error,
                        metricLabel: "Premios eSports",

                        // Top 5 países por ganancias destacadas de eSports.
                        countries: esportsCountries
                            .slice(0, 5)
                            .map((country) => ({
                                country: country.country,
                                metric: country.topCountryEarnings,
                                detail: `${country.records} juegos, ult. ${country.latestYear}`
                            }))
                    }
                ],

                // Datos agrupados completos para que el frontend no llame a cada proxy por separado.
                studentApiDatasets: {
                    touristCountries,
                    earthquakeCountries,
                    fifaCountries,
                    esportsCountries
                },

                // Número de elementos integrados devueltos.
                count: integrations.length,

                // Datos integrados finales.
                items: integrations
            };

            return res.status(200).json(payload);
        } catch {
            return res.sendStatus(500);
        }
    });

    // RUTA:
    // GET /api/v1/citys-stats/:city/:country
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
        // Se normalizan los parámetros de la URL.
        const city = req.params.city.trim().toLowerCase();
        const country = req.params.country.trim().toLowerCase();

        // Se busca un documento con esa ciudad y ese país.
        db.findOne({ city, country }, (err, doc) => {
            if (err) return res.sendStatus(500);

            // Si no existe, se devuelve 404.
            if (!doc) return res.status(404).json({ error: "Resource not found" });

            // Si existe, se devuelve sin _id.
            return res.status(200).json(removeDatabaseId(doc));
        });
    });

    // RUTA:
    // POST /api/v1/citys-stats
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
    // - parseCityStat
    // - removeDatabaseId
    //
    // RESPUESTA:
    // - 201 con JSON.
    // - 400 si el body no vale o el pais no esta soportado.
    // - 409 si ya existe.
    // - 500 si falla la base de datos.
    app.post(BASE_API_URL, (req, res) => {
        // Se valida y normaliza el body.
        const parsed = parseCityStat(req.body);
        const item = parsed.item;

        // Si parsed.error existe, el body no es valido o el pais no esta soportado.
        if (parsed.error) {
            return res.status(400).json({ error: parsed.error });
        }

        // Antes de insertar, se comprueba que no exista ya ese recurso.
        db.findOne({ city: item.city, country: item.country }, (err, doc) => {
            if (err) return res.sendStatus(500);

            // Si ya existe, se devuelve 409 Conflict.
            if (doc) return res.status(409).json({ error: "Resource already exists" });

            // Si no existe, se inserta en la base de datos.
            db.insert(item, (err2, newDoc) => {
                if (err2) return res.sendStatus(500);

                // 201 Created indica que se ha creado correctamente.
                return res.status(201).json(removeDatabaseId(newDoc));
            });
        });
    });

    // RUTA:
    // POST /api/v1/citys-stats/:city/:country
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
        // 405 Method Not Allowed.
        return res.sendStatus(405);
    });

    // RUTA:
    // PUT /api/v1/citys-stats
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
        return res.sendStatus(405);
    });

    // RUTA:
    // PUT /api/v1/citys-stats/:city/:country
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
    // - parseCityStat
    // - removeDatabaseId
    //
    // RESPUESTA:
    // - 200 con JSON.
    // - 400 si body o URL no valen.
    // - 404 si no existe.
    // - 500 si falla la base de datos.
    app.put(`${BASE_API_URL}/:city/:country`, (req, res) => {
        const city = req.params.city.trim().toLowerCase();
        const country = normalizeCountryForStorage(req.params.country);

        // Se valida y normaliza el body.
        const parsed = parseCityStat(req.body);
        const item = parsed.item;

        if (parsed.error) {
            return res.status(400).json({ error: parsed.error });
        }

        // Evita inconsistencias entre la URL y el body.
        //
        // Ejemplo incorrecto:
        // URL:
        // /api/v1/citys-stats/tokyo/japan
        //
        // Body:
        // {
        //   "city": "delhi",
        //   "country": "india",
        //   "un_2025_population": 30222405
        // }
        if (item.city !== city || item.country !== country) {
            return res.status(400).json({ error: "URL and body do not match" });
        }

        // Primero se comprueba si el recurso existe.
        db.findOne({ city, country }, (err, doc) => {
            if (err) return res.sendStatus(500);

            // Si no existe, no se puede actualizar.
            if (!doc) return res.status(404).json({ error: "Resource not found" });

            // Se actualiza el documento completo.
            db.update({ city, country }, item, {}, (err2) => {
                if (err2) return res.sendStatus(500);

                // Después de actualizar, se vuelve a buscar para devolver
                // el documento actualizado.
                db.findOne({ city, country }, (err3, updated) => {
                    if (err3) return res.sendStatus(500);

                    return res.status(200).json(removeDatabaseId(updated));
                });
            });
        });
    });

    // RUTA:
    // DELETE /api/v1/citys-stats
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
        // Filtro {} significa borrar todos.
        // multi: true permite borrar más de un documento.
        db.remove({}, { multi: true }, (err) => {
            if (err) return res.sendStatus(500);

            // 204 No Content indica éxito sin devolver cuerpo.
            return res.sendStatus(204);
        });
    });

    // RUTA:
    // DELETE /api/v1/citys-stats/:city/:country
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
        const city = req.params.city.trim().toLowerCase();
        const country = req.params.country.trim().toLowerCase();

        // Se intenta borrar el documento que coincida.
        db.remove({ city, country }, {}, (err, numRemoved) => {
            if (err) return res.sendStatus(500);

            // numRemoved indica cuántos documentos se han borrado.
            // Si es 0, significa que no existía.
            if (numRemoved === 0) {
                return res.status(404).json({ error: "Resource not found" });
            }

            // Borrado correcto sin contenido.
            return res.sendStatus(204);
        });
    });
};
