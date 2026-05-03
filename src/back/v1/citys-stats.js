// Este modulo registra la API v1 del recurso citys-stats.
module.exports = (app, db) => {
    // Ruta base usada por todas las rutas de esta API.
    const BASE_API_URL = "/api/v1/citys-stats";

    // URL de la documentacion; se puede cambiar con variable de entorno.
    const DOCS_URL =
        process.env.LCC_DOCS_URL ||
        "https://documenter.getpostman.com/view/52412147/2sBXiqEUAt";

    const TOURIST_ARRIVALS_API_URL =
        "https://sos2526-25.onrender.com/api/v2/international-tourist-arrivals";
    const EARTHQUAKES_API_URL =
        "https://sos2526-19.onrender.com/api/v1/earthquakes";
    const FIFA_SQUAD_VALUES_API_URL =
        "https://sos2526-26.onrender.com/api/v2/fifa-squad-value-per-years";

    // Las integraciones viven en backend como proxy propio: el navegador llama
    // a nuestra API y Express normaliza fuentes externas antes de responder JSON.
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

    // Datos de ejemplo que se cargan cuando la base esta vacia.
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

    // Devuelve un documento sin el campo interno _id de NeDB.
    function removeDatabaseId(doc) {
        if (!doc) return doc;
        const { _id, ...rest } = doc;
        return rest;
    }

    // Comprueba que el body tenga exactamente los campos de citys-stats.
    function hasExactCityFields(body) {
        if (!body || typeof body !== "object" || Array.isArray(body)) return false;

        const expected = ["city", "country", "un_2025_population"].sort();
        const keys = Object.keys(body).sort();

        return keys.length === expected.length &&
            keys.every((k, i) => k === expected[i]);
    }

    // Limpia y valida los datos recibidos antes de guardarlos en la base.
    function normalizeCityStat(body) {
        if (!hasExactCityFields(body)) return null;

        const city = String(body.city).trim().toLowerCase();
        const country = String(body.country).trim().toLowerCase();
        const un_2025_population = Number(body.un_2025_population);

        if (
            !city ||
            !country ||
            !Number.isInteger(un_2025_population) ||
            un_2025_population <= 0
        ) {
            return null;
        }

        return { city, country, un_2025_population };
    }

    // Limpia un texto de busqueda para mandarlo a APIs externas.
    function cleanSearchTerm(value) {
        return String(value ?? "").trim().replace(/[-_]+/g, " ");
    }

    // Normaliza paises para cruzar nuestra API con APIs SOS de otros grupos.
    function normalizeCountryKey(value) {
        return String(value ?? "")
            .trim()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[-_]+/g, " ")
            .toLowerCase();
    }

    function countryFromIso3(value, fallback) {
        const code = String(value ?? "").trim().toUpperCase();
        return ISO3_COUNTRY_NAMES[code] || fallback;
    }

    function readFiniteNumber(value, fallback = null) {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : fallback;
    }

    function asArray(data) {
        if (Array.isArray(data)) return data;
        if (Array.isArray(data?.data)) return data.data;
        if (Array.isArray(data?.items)) return data.items;
        return [];
    }

    // Convierte limit en numero y comprueba que este dentro del rango permitido.
    function parseLimit(value, fallback, max) {
        if (value === undefined) return fallback;

        const limit = Number(value);

        if (!Number.isInteger(limit) || limit < 1 || limit > max) {
            return null;
        }

        return limit;
    }

    // Cache para no pedir varias veces la misma poblacion al Banco Mundial.
    const worldBankPopulationCache = new Map();

    // Lee todos los registros locales de citys-stats.
    function findAllCityStats() {
        return new Promise((resolve, reject) => {
            db.find({}, (err, docs) => {
                if (err) return reject(err);
                resolve(docs.map(removeDatabaseId));
            });
        });
    }

    function buildCityCountrySummaries(items) {
        const byCountry = new Map();

        items.forEach((item) => {
            const key = normalizeCountryKey(item.country);
            if (!key) return;

            const population = readFiniteNumber(item.un_2025_population, 0);
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

            current.cityCount += 1;
            current.un_2025_population += population;
            current.cities.push({
                city: item.city,
                population
            });

            if (population > current.topCityPopulation) {
                current.city = item.city;
                current.topCity = item.city;
                current.topCityPopulation = population;
            }

            byCountry.set(key, current);
        });

        return [...byCountry.values()]
            .map((item) => ({
                ...item,
                cities: item.cities.sort((a, b) => b.population - a.population)
            }))
            .sort((a, b) => b.un_2025_population - a.un_2025_population);
    }

    // Hace una peticion HTTP y devuelve JSON con control de errores y timeout.
    async function fetchJson(url, sourceName, timeoutMs = 20000) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), timeoutMs);

        try {
            const response = await fetch(url, {
                headers: {
                    Accept: "application/json",
                    "User-Agent": "SOS2526-29 citys-stats integration"
                },
                signal: controller.signal
            });

            const text = await response.text();
            let data = null;

            try {
                data = text ? JSON.parse(text) : null;
            } catch {
                throw new Error(`${sourceName} did not return JSON`);
            }

            if (!response.ok) {
                const reason = data?.message || data?.error || response.statusText;
                throw new Error(`${sourceName} returned ${response.status}: ${reason}`);
            }

            return data;
        } catch (err) {
            if (err.name === "AbortError") {
                throw new Error(`${sourceName} request timed out`);
            }

            throw err;
        } finally {
            clearTimeout(timeout);
        }
    }

    // Busca coordenadas y datos basicos de una ciudad en Open-Meteo.
    async function getGeocoding(city, country = "") {
        const params = new URLSearchParams({
            name: cleanSearchTerm(city),
            count: "10",
            language: "en",
            format: "json"
        });

        const data = await fetchJson(
            `https://geocoding-api.open-meteo.com/v1/search?${params.toString()}`,
            "Open-Meteo Geocoding API"
        );

        const results = Array.isArray(data?.results) ? data.results : [];
        const countrySearch = cleanSearchTerm(country).toLowerCase();
        const match = results.find((item) =>
            countrySearch && String(item.country ?? "").toLowerCase() === countrySearch
        ) || results[0];

        if (!match) return null;

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

    // Busca informacion general de un pais en REST Countries.
    async function getCountryInfo(country) {
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

        const data = await fetchJson(
            `https://restcountries.com/v3.1/name/${encodeURIComponent(cleanSearchTerm(country))}?fields=${fields}`,
            "REST Countries API"
        );

        const target = cleanSearchTerm(country).toLowerCase();
        const items = Array.isArray(data) ? data : [data];
        const item = items.find((countryItem) =>
            String(countryItem.name?.common ?? "").toLowerCase() === target
        ) || items.find((countryItem) =>
            String(countryItem.name?.official ?? "").toLowerCase() === target
        ) || items[0];

        if (!item) return null;

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

    // Busca la poblacion mas reciente de un pais en World Bank.
    async function getWorldBankPopulation(countryCode) {
        const code = String(countryCode ?? "").trim().toUpperCase();

        if (worldBankPopulationCache.has(code)) {
            return worldBankPopulationCache.get(code);
        }

        const params = new URLSearchParams({
            format: "json",
            mrv: "1"
        });

        const data = await fetchJson(
            `https://api.worldbank.org/v2/country/${encodeURIComponent(code)}/indicator/SP.POP.TOTL?${params.toString()}`,
            "World Bank Indicators API",
            60000
        );

        const rows = Array.isArray(data) && Array.isArray(data[1]) ? data[1] : [];
        const row = rows.find((item) => item?.value !== null && item?.value !== undefined) || rows[0];

        const normalized = normalizeWorldBankRow(row, code);

        if (normalized) {
            worldBankPopulationCache.set(code, normalized);
        }

        return normalized;
    }

    // Convierte una fila de World Bank al formato sencillo que devuelve esta API.
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

    // Busca poblaciones de varios paises a la vez para que la integracion sea mas rapida.
    async function getWorldBankPopulations(countryCodes) {
        const uniqueCodes = [...new Set(countryCodes
            .map((countryCode) => String(countryCode ?? "").trim().toUpperCase())
            .filter(Boolean)
        )];

        if (uniqueCodes.length === 0) return new Map();

        const missingCodes = uniqueCodes.filter((code) => !worldBankPopulationCache.has(code));

        if (missingCodes.length > 0) {
            const params = new URLSearchParams({
                format: "json",
                mrv: "1",
                per_page: "100"
            });

            const data = await fetchJson(
                `https://api.worldbank.org/v2/country/${missingCodes.join(";")}/indicator/SP.POP.TOTL?${params.toString()}`,
                "World Bank Indicators API",
                60000
            );

            const rows = Array.isArray(data) && Array.isArray(data[1]) ? data[1] : [];

            rows.forEach((row) => {
                const normalized = normalizeWorldBankRow(row, row?.countryiso3code);
                if (normalized?.countryCode && normalized.value !== null && normalized.value !== undefined) {
                    worldBankPopulationCache.set(normalized.countryCode, normalized);
                }
            });
        }

        const byCode = new Map();
        uniqueCodes.forEach((code) => {
            if (worldBankPopulationCache.has(code)) {
                byCode.set(code, worldBankPopulationCache.get(code));
            }
        });

        return byCode;
    }

    // Ejecuta una llamada externa y la convierte en exito o error controlado.
    async function safeExternal(source, task) {
        try {
            return { source, data: await task(), error: null };
        } catch (err) {
            return { source, data: null, error: err.message };
        }
    }

    // Prepara los datos externos de una ciudad antes de pedir World Bank por lotes.
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

    // Une el registro local con geocoding, pais y World Bank en un solo objeto.
    function buildIntegratedCity(base, worldBankByCode, worldBankBatchError, studentApis) {
        const code = base.countryResult.data?.cca3;
        let worldBankResult;

        if (!code) {
            worldBankResult = {
                source: "World Bank Indicators API",
                data: null,
                error: "Country ISO3 code not available"
            };
        } else if (worldBankBatchError) {
            worldBankResult = {
                source: "World Bank Indicators API",
                data: null,
                error: worldBankBatchError
            };
        } else {
            const data = worldBankByCode.get(code) ?? null;
            worldBankResult = {
                source: "World Bank Indicators API",
                data,
                error: data ? null : "World Bank data not found"
            };
        }

        const countryKey = normalizeCountryKey(base.item.country);
        const touristArrivals = studentApis?.touristByCountry?.get(countryKey) ?? null;
        const earthquakeStats = studentApis?.earthquakesByCountry?.get(countryKey) ?? null;
        const fifaSquadValue = studentApis?.fifaByCountry?.get(countryKey) ?? null;
        const integrationResults = [
            base.geocodingResult,
            base.countryResult,
            worldBankResult
        ];

        if (studentApis?.touristResult?.error) {
            integrationResults.push(studentApis.touristResult);
        }

        if (studentApis?.earthquakeResult?.error) {
            integrationResults.push(studentApis.earthquakeResult);
        }

        if (studentApis?.fifaResult?.error) {
            integrationResults.push(studentApis.fifaResult);
        }

        return {
            city: base.item.city,
            country: base.item.country,
            cityCount: base.item.cityCount ?? 1,
            topCity: base.item.topCity ?? base.item.city,
            topCityPopulation: base.item.topCityPopulation ?? base.item.un_2025_population,
            cities: base.item.cities ?? [{
                city: base.item.city,
                population: base.item.un_2025_population
            }],
            un_2025_population: base.item.un_2025_population,
            geocoding: base.geocodingResult.data,
            countryInfo: base.countryResult.data,
            worldBankPopulation: worldBankResult.data,
            touristArrivals,
            earthquakeStats,
            fifaSquadValue,
            integrationErrors: integrationResults
                .filter((result) => result.error)
                .map((result) => ({
                    source: result.source,
                    error: result.error
                }))
        };
    }

    function normalizeTouristArrival(row) {
        const country = String(row?.country ?? "").trim();
        const year = readFiniteNumber(row?.year);
        const airArrival = readFiniteNumber(row?.air_arrival, 0);
        const waterArrival = readFiniteNumber(row?.water_arrival, 0);
        const landArrival = readFiniteNumber(row?.land_arrival, 0);

        if (!country || year === null) return null;

        return {
            source: "SOS2526-25 International Tourist Arrivals API",
            country,
            year,
            airArrival,
            waterArrival,
            landArrival,
            totalArrivals: airArrival + waterArrival + landArrival
        };
    }

    async function getTouristArrivals() {
        const data = await fetchJson(
            TOURIST_ARRIVALS_API_URL,
            "SOS2526-25 International Tourist Arrivals API",
            60000
        );

        return asArray(data).map(normalizeTouristArrival).filter(Boolean);
    }

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

            if (current.latestYear === null || row.year > current.latestYear) {
                current.latestYear = row.year;
                current.latestTotalArrivals = row.totalArrivals;
            }

            byCountry.set(key, current);
        });

        return byCountry;
    }

    function normalizeEarthquake(row) {
        const country = String(countryFromIso3(row?.iso3, row?.country) ?? "").trim();
        const severity = readFiniteNumber(row?.severity);

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

    async function getEarthquakes() {
        const data = await fetchJson(
            EARTHQUAKES_API_URL,
            "SOS2526-19 Earthquakes API",
            60000
        );

        return asArray(data).map(normalizeEarthquake).filter(Boolean);
    }

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
            current.maxSeverity = Math.max(current.maxSeverity, row.severity);
            current.exposedPopulation += row.exposedPopulation || 0;

            if (!current.latestDate || (row.date && row.date > current.latestDate)) {
                current.latestDate = row.date;
            }

            byCountry.set(key, current);
        });

        return byCountry;
    }

    function normalizeFifaSquadValue(row) {
        const country = String(row?.country ?? "").trim();
        const year = readFiniteNumber(row?.year);
        const squadSize = readFiniteNumber(row?.squad_size, 0);
        const totalMarketValue = readFiniteNumber(row?.total_market_value, 0);
        const averageMarketValue = readFiniteNumber(row?.average_market_value, 0);

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

    async function getFifaSquadValues() {
        const data = await fetchJson(
            FIFA_SQUAD_VALUES_API_URL,
            "SOS2526-26 FIFA Squad Value API",
            60000
        );

        return asArray(data).map(normalizeFifaSquadValue).filter(Boolean);
    }

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

    // Redirige a la documentacion de Postman.
    app.get(`${BASE_API_URL}/docs`, (request, response) => {
        response.redirect(DOCS_URL);
    });

    // Carga los datos iniciales si la base esta vacia.
    app.get(`${BASE_API_URL}/loadInitialData`, (request, response) => {
        db.count({}, (error, count) => {
            if (error) return response.sendStatus(500);

            if (count > 0) {
                db.find({}, (findError, docs) => {
                    if (findError) return response.sendStatus(500);
                    return response.status(200).json(docs.map(removeDatabaseId));
                });
                return;
            }

            db.insert(initialData, (insertError, docs) => {
                if (insertError) return response.sendStatus(500);
                return response.status(201).json(docs.map(removeDatabaseId));
            });
        });
    });

    // Devuelve la coleccion con filtros exactos y paginacion.
    app.get(BASE_API_URL, (request, response) => {
        db.find({}, (error, docs) => {
            if (error) return response.sendStatus(500);

            let result = docs.map(removeDatabaseId);

            if (request.query.city !== undefined) {
                result = result.filter(
                    item => item.city === String(request.query.city).trim().toLowerCase()
                );
            }

            if (request.query.country !== undefined) {
                result = result.filter(
                    item => item.country === String(request.query.country).trim().toLowerCase()
                );
            }

            if (request.query.un_2025_population !== undefined) {
                const value = Number(request.query.un_2025_population);
                if (!Number.isFinite(value)) {
                    return response.status(400).json({ error: "Invalid query" });
                }
                result = result.filter(item => item.un_2025_population === value);
            }

            let offset = 0;
            let limit = result.length;

            if (request.query.offset !== undefined) {
                offset = Number(request.query.offset);
                if (!Number.isInteger(offset) || offset < 0) {
                    return response.status(400).json({ error: "Invalid offset" });
                }
            }

            if (request.query.limit !== undefined) {
                limit = Number(request.query.limit);
                if (!Number.isInteger(limit) || limit < 0) {
                    return response.status(400).json({ error: "Invalid limit" });
                }
            }

            return response.status(200).json(result.slice(offset, offset + limit));
        });
    });

    // Devuelve las ciudades con mayor poblacion, usado por las integraciones.
    app.get(`${BASE_API_URL}/top-cities`, async (request, response) => {
        const limit = parseLimit(request.query.limit, 5, 20);

        if (limit === null) {
            return response.status(400).json({ error: "Invalid limit" });
        }

        try {
            const result = (await findAllCityStats())
                .sort((a, b) => Number(b.un_2025_population) - Number(a.un_2025_population))
                .slice(0, limit);

            return response.status(200).json(result);
        } catch {
            return response.sendStatus(500);
        }
    });

    // Devuelve citys-stats agregado por pais para integraciones por campo country.
    app.get(`${BASE_API_URL}/country-summaries`, async (request, response) => {
        const limit = parseLimit(request.query.limit, 8, 20);

        if (limit === null) {
            return response.status(400).json({ error: "Invalid limit" });
        }

        try {
            const result = buildCityCountrySummaries(await findAllCityStats()).slice(0, limit);

            return response.status(200).json(result);
        } catch {
            return response.sendStatus(500);
        }
    });

    // Consulta Open-Meteo para una ciudad concreta.
    app.get(`${BASE_API_URL}/integrations/geocoding/:city`, async (req, res) => {
        try {
            const result = await getGeocoding(req.params.city, req.query.country);

            if (!result) {
                return res.status(404).json({ error: "City not found in external API" });
            }

            return res.status(200).json(result);
        } catch (err) {
            return res.status(502).json({ error: err.message });
        }
    });

    // Consulta REST Countries para un pais concreto.
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

    // Consulta World Bank para un codigo de pais concreto.
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

    // Proxy propio hacia la API SOS2526-25 de llegadas internacionales de turistas.
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

    // Proxy propio hacia la API SOS2526-19 de terremotos.
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

    // Proxy propio hacia la API SOS2526-26 de valor de plantillas FIFA.
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

    // Une datos locales y externos para mostrar un resumen integrado.
    app.get(`${BASE_API_URL}/integrations/summary`, async (req, res) => {
        const limit = parseLimit(req.query.limit, 8, 20);

        if (limit === null) {
            return res.status(400).json({ error: "Invalid limit" });
        }

        try {
            const countrySummaries = buildCityCountrySummaries(await findAllCityStats())
                .slice(0, limit);

            const integrationBases = await Promise.all(countrySummaries.map(buildIntegratedCityBase));
            const countryCodes = integrationBases
                .map((base) => base.countryResult.data?.cca3)
                .filter(Boolean);

            let worldBankByCode = new Map();
            let worldBankBatchError = null;

            try {
                worldBankByCode = await getWorldBankPopulations(countryCodes);
            } catch (err) {
                worldBankBatchError = err.message;
            }

            const [touristResult, earthquakeResult, fifaResult] = await Promise.all([
                safeExternal("SOS2526-25 International Tourist Arrivals API", getTouristArrivals),
                safeExternal("SOS2526-19 Earthquakes API", getEarthquakes),
                safeExternal("SOS2526-26 FIFA Squad Value API", getFifaSquadValues)
            ]);

            const touristByCountry = touristResult.data
                ? buildTouristArrivalsByCountry(touristResult.data)
                : new Map();
            const earthquakesByCountry = earthquakeResult.data
                ? buildEarthquakesByCountry(earthquakeResult.data)
                : new Map();
            const fifaByCountry = fifaResult.data
                ? buildFifaSquadValuesByCountry(fifaResult.data)
                : new Map();

            const studentApis = {
                touristResult,
                earthquakeResult,
                fifaResult,
                touristByCountry,
                earthquakesByCountry,
                fifaByCountry
            };

            const integrations = integrationBases.map((base) =>
                buildIntegratedCity(base, worldBankByCode, worldBankBatchError, studentApis)
            );

            return res.status(200).json({
                localResource: `${BASE_API_URL}/country-summaries`,
                externalApis: [
                    "Open-Meteo Geocoding API",
                    "REST Countries API",
                    "World Bank Indicators API",
                    "SOS2526-25 International Tourist Arrivals API",
                    "SOS2526-19 Earthquakes API",
                    "SOS2526-26 FIFA Squad Value API"
                ],
                studentApis: [
                    {
                        source: "SOS2526-25 International Tourist Arrivals API",
                        endpoint: TOURIST_ARRIVALS_API_URL,
                        count: touristResult.data?.length ?? 0,
                        error: touristResult.error,
                        metricLabel: "Llegadas totales",
                        countries: [...touristByCountry.values()]
                            .sort((a, b) => b.totalArrivals - a.totalArrivals)
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
                        countries: [...earthquakesByCountry.values()]
                            .sort((a, b) => b.maxSeverity - a.maxSeverity)
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
                        countries: [...fifaByCountry.values()]
                            .sort((a, b) => b.latestTotalMarketValue - a.latestTotalMarketValue)
                            .slice(0, 5)
                            .map((country) => ({
                                country: country.country,
                                metric: country.latestTotalMarketValue,
                                detail: `${country.latestYear}, ${country.latestSquadSize} jugadores`
                            }))
                    }
                ],
                count: integrations.length,
                items: integrations
            });
        } catch {
            return res.sendStatus(500);
        }
    });

    // Devuelve un registro concreto identificado por ciudad y pais.
    app.get(`${BASE_API_URL}/:city/:country`, (req, res) => {
        const city = req.params.city.trim().toLowerCase();
        const country = req.params.country.trim().toLowerCase();

        db.findOne({ city, country }, (err, doc) => {
            if (err) return res.sendStatus(500);
            if (!doc) return res.status(404).json({ error: "Resource not found" });

            return res.status(200).json(removeDatabaseId(doc));
        });
    });

    // Crea un nuevo registro de ciudad.
    app.post(BASE_API_URL, (req, res) => {
        const item = normalizeCityStat(req.body);

        if (!item) {
            return res.status(400).json({
                error: "JSON body does not match expected structure"
            });
        }

        db.findOne({ city: item.city, country: item.country }, (err, doc) => {
            if (err) return res.sendStatus(500);
            if (doc) return res.status(409).json({ error: "Resource already exists" });

            db.insert(item, (err2, newDoc) => {
                if (err2) return res.sendStatus(500);
                return res.status(201).json(removeDatabaseId(newDoc));
            });
        });
    });

    // No se permite POST sobre un recurso concreto.
    app.post(`${BASE_API_URL}/:city/:country`, (req, res) => {
        return res.sendStatus(405);
    });

    // No se permite PUT sobre la coleccion completa.
    app.put(BASE_API_URL, (req, res) => {
        return res.sendStatus(405);
    });

    // Actualiza un registro concreto.
    app.put(`${BASE_API_URL}/:city/:country`, (req, res) => {
        const city = req.params.city.trim().toLowerCase();
        const country = req.params.country.trim().toLowerCase();

        const item = normalizeCityStat(req.body);

        if (!item) {
            return res.status(400).json({
                error: "JSON body does not match expected structure"
            });
        }

        if (item.city !== city || item.country !== country) {
            return res.status(400).json({ error: "URL and body do not match" });
        }

        db.findOne({ city, country }, (err, doc) => {
            if (err) return res.sendStatus(500);
            if (!doc) return res.status(404).json({ error: "Resource not found" });

            db.update({ city, country }, item, {}, (err2) => {
                if (err2) return res.sendStatus(500);

                db.findOne({ city, country }, (err3, updated) => {
                    if (err3) return res.sendStatus(500);
                    return res.status(200).json(removeDatabaseId(updated));
                });
            });
        });
    });

    // Borra todos los registros de la coleccion.
    app.delete(BASE_API_URL, (req, res) => {
        db.remove({}, { multi: true }, (err) => {
            if (err) return res.sendStatus(500);
            return res.sendStatus(204);
        });
    });

    // Borra un registro concreto.
    app.delete(`${BASE_API_URL}/:city/:country`, (req, res) => {
        const city = req.params.city.trim().toLowerCase();
        const country = req.params.country.trim().toLowerCase();

        db.remove({ city, country }, {}, (err, numRemoved) => {
            if (err) return res.sendStatus(500);
            if (numRemoved === 0) {
                return res.status(404).json({ error: "Resource not found" });
            }

            return res.sendStatus(204);
        });
    });
};
