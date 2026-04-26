module.exports = (app, db) => {
    const BASE_API_URL = "/api/v1/citys-stats";

    const DOCS_URL =
        process.env.LCC_DOCS_URL ||
        "https://documenter.getpostman.com/view/52412147/2sBXiqEUAt";

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

    function clean(doc) {
        if (!doc) return doc;
        const { _id, ...rest } = doc;
        return rest;
    }

    function isExactBody(body) {
        if (!body || typeof body !== "object" || Array.isArray(body)) return false;

        const expected = ["city", "country", "un_2025_population"].sort();
        const keys = Object.keys(body).sort();

        return keys.length === expected.length &&
            keys.every((k, i) => k === expected[i]);
    }

    function normalize(body) {
        if (!isExactBody(body)) return null;

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

    function cleanSearchTerm(value) {
        return String(value ?? "").trim().replace(/[-_]+/g, " ");
    }

    function parseLimit(value, fallback, max) {
        if (value === undefined) return fallback;

        const limit = Number(value);

        if (!Number.isInteger(limit) || limit < 1 || limit > max) {
            return null;
        }

        return limit;
    }

    const worldBankPopulationCache = new Map();

    function findAll() {
        return new Promise((resolve, reject) => {
            db.find({}, (err, docs) => {
                if (err) return reject(err);
                resolve(docs.map(clean));
            });
        });
    }

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

    async function safeExternal(source, task) {
        try {
            return { source, data: await task(), error: null };
        } catch (err) {
            return { source, data: null, error: err.message };
        }
    }

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

    function buildIntegratedCity(base, worldBankByCode, worldBankBatchError) {
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

        return {
            city: base.item.city,
            country: base.item.country,
            un_2025_population: base.item.un_2025_population,
            geocoding: base.geocodingResult.data,
            countryInfo: base.countryResult.data,
            worldBankPopulation: worldBankResult.data,
            integrationErrors: [
                base.geocodingResult,
                base.countryResult,
                worldBankResult
            ]
                .filter((result) => result.error)
                .map((result) => ({
                    source: result.source,
                    error: result.error
                }))
        };
    }

    app.get(`${BASE_API_URL}/docs`, (req, res) => {
        res.redirect(DOCS_URL);
    });

    app.get(`${BASE_API_URL}/loadInitialData`, (req, res) => {
        db.count({}, (err, count) => {
            if (err) return res.sendStatus(500);

            if (count > 0) {
                db.find({}, (err2, docs) => {
                    if (err2) return res.sendStatus(500);
                    return res.status(200).json(docs.map(clean));
                });
                return;
            }

            db.insert(initialData, (err3, docs) => {
                if (err3) return res.sendStatus(500);
                return res.status(201).json(docs.map(clean));
            });
        });
    });

    app.get(BASE_API_URL, (req, res) => {
        db.find({}, (err, docs) => {
            if (err) return res.sendStatus(500);

            let result = docs.map(clean);

            if (req.query.city !== undefined) {
                result = result.filter(
                    d => d.city === String(req.query.city).trim().toLowerCase()
                );
            }

            if (req.query.country !== undefined) {
                result = result.filter(
                    d => d.country === String(req.query.country).trim().toLowerCase()
                );
            }

            if (req.query.un_2025_population !== undefined) {
                const value = Number(req.query.un_2025_population);
                if (!Number.isFinite(value)) {
                    return res.status(400).json({ error: "Invalid query" });
                }
                result = result.filter(d => d.un_2025_population === value);
            }

            let offset = 0;
            let limit = result.length;

            if (req.query.offset !== undefined) {
                offset = Number(req.query.offset);
                if (!Number.isInteger(offset) || offset < 0) {
                    return res.status(400).json({ error: "Invalid offset" });
                }
            }

            if (req.query.limit !== undefined) {
                limit = Number(req.query.limit);
                if (!Number.isInteger(limit) || limit < 0) {
                    return res.status(400).json({ error: "Invalid limit" });
                }
            }

            return res.status(200).json(result.slice(offset, offset + limit));
        });
    });

    app.get(`${BASE_API_URL}/top-cities`, async (req, res) => {
        const limit = parseLimit(req.query.limit, 5, 20);

        if (limit === null) {
            return res.status(400).json({ error: "Invalid limit" });
        }

        try {
            const result = (await findAll())
                .sort((a, b) => Number(b.un_2025_population) - Number(a.un_2025_population))
                .slice(0, limit);

            return res.status(200).json(result);
        } catch {
            return res.sendStatus(500);
        }
    });

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

    app.get(`${BASE_API_URL}/integrations/summary`, async (req, res) => {
        const limit = parseLimit(req.query.limit, 5, 10);

        if (limit === null) {
            return res.status(400).json({ error: "Invalid limit" });
        }

        try {
            const topCities = (await findAll())
                .sort((a, b) => Number(b.un_2025_population) - Number(a.un_2025_population))
                .slice(0, limit);

            const integrationBases = await Promise.all(topCities.map(buildIntegratedCityBase));
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

            const integrations = integrationBases.map((base) =>
                buildIntegratedCity(base, worldBankByCode, worldBankBatchError)
            );

            return res.status(200).json({
                localResource: `${BASE_API_URL}/top-cities`,
                externalApis: [
                    "Open-Meteo Geocoding API",
                    "REST Countries API",
                    "World Bank Indicators API"
                ],
                count: integrations.length,
                items: integrations
            });
        } catch {
            return res.sendStatus(500);
        }
    });

    app.get(`${BASE_API_URL}/:city/:country`, (req, res) => {
        const city = req.params.city.trim().toLowerCase();
        const country = req.params.country.trim().toLowerCase();

        db.findOne({ city, country }, (err, doc) => {
            if (err) return res.sendStatus(500);
            if (!doc) return res.status(404).json({ error: "Resource not found" });

            return res.status(200).json(clean(doc));
        });
    });

    app.post(BASE_API_URL, (req, res) => {
        const item = normalize(req.body);

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
                return res.status(201).json(clean(newDoc));
            });
        });
    });

    app.post(`${BASE_API_URL}/:city/:country`, (req, res) => {
        return res.sendStatus(405);
    });

    app.put(BASE_API_URL, (req, res) => {
        return res.sendStatus(405);
    });

    app.put(`${BASE_API_URL}/:city/:country`, (req, res) => {
        const city = req.params.city.trim().toLowerCase();
        const country = req.params.country.trim().toLowerCase();

        const item = normalize(req.body);

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
                    return res.status(200).json(clean(updated));
                });
            });
        });
    });

    app.delete(BASE_API_URL, (req, res) => {
        db.remove({}, { multi: true }, (err) => {
            if (err) return res.sendStatus(500);
            return res.sendStatus(204);
        });
    });

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
