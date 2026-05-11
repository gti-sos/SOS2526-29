<script>
  import { onDestroy, onMount, tick } from "svelte";
  import {
    getCountryInfo,
    getCountrySummaries,
    getGeocoding,
    getSosEarthquakes,
    getSosEsportsEarnings,
    getSosFifaSquadValues,
    getSosTouristArrivals,
    getWorldBankPopulation
  } from "@/services/citysStatsIntegrations";
  import { loadInitialCitysStats } from "@/services/citysStatsApi";

  // Pantalla de integraciones: cruza citys-stats con APIs externas y pinta
  // un widget distinto por fuente de datos.

  // FLUJO ASINCRONO DE ESTA PANTALLA
  // 1. Al abrir /integrations/citys-stats, Svelte registra onMount(loadIntegrations).
  // 2. loadIntegrations limpia estado y destruye graficas anteriores.
  // 3. Primero carga datos locales agregados:
  //    getCountrySummaries(selectedLimit).
  //    Si vienen vacios, llama a loadInitialCitysStats y repite getCountrySummaries.
  // 4. Con esos paises locales lanza llamadas externas por bloques:
  //    - Promise.all(getGeocoding por cada pais) usando safeLoad.
  //    - Promise.all(getCountryInfo por cada pais) usando safeLoad.
  //    - Promise.all(getWorldBankPopulation por cada codigo ISO3) usando safeLoad.
  //    - Promise.all de APIs SOS externas:
  //      turismo + terremotos + FIFA + eSports.
  // 5. safeLoad convierte cada fallo en { data: null, error }, asi una API externa
  //    rota no impide pintar el resto de widgets.
  // 6. Los resultados se normalizan en arrays de pantalla:
  //    geocodingRows, countryCards, worldBankRows, touristCountries,
  //    earthquakeCountries, fifaCountries y esportsCountries.
  // 7. loading=false y await tick espera a que existan los contenedores HTML.
  // 8. loadHighcharts importa Highcharts y todos los modulos necesarios una vez.
  // 9. renderIntegrationCharts llama a cada renderXChart y guarda las instancias.
  // 10. onDestroy limpia todas las graficas al salir.

  // Highcharts se importa de forma diferida para no cargarlo en otras paginas.
  let Highcharts;
  // Contenedores HTML de cada widget. Highcharts necesita referencias reales.
  let geocodingChartContainer;
  let countryChartContainer;
  let worldBankChartContainer;
  let tourismChartContainer;
  let earthquakeChartContainer;
  let fifaChartContainer;
  let esportsChartContainer;
  // Instancias activas para poder destruirlas antes de repintar.
  let integrationCharts = [];

  // Estado general de la pantalla.
  let loading = true;
  let error = "";
  let selectedLimit = 8;
  // Datos locales agregados por pais.
  let countrySummaries = [];
  // Filas ya combinadas para cada integracion.
  let geocodingRows = [];
  let countryCards = [];
  let worldBankRows = [];
  let touristCountries = [];
  let earthquakeCountries = [];
  let fifaCountries = [];
  let esportsCountries = [];
  let integrationErrors = [];
  // Indica si hubo que cargar datos iniciales porque la API local estaba vacia.
  let restoredInitialData = false;

  const formatter = new Intl.NumberFormat("es-ES", {
    maximumFractionDigits: 0
  });

  const decimalFormatter = new Intl.NumberFormat("es-ES", {
    maximumFractionDigits: 2
  });

  const compactFormatter = new Intl.NumberFormat("es-ES", {
    notation: "compact",
    maximumFractionDigits: 1
  });

  const sourceCards = [
    {
      name: "Open-Meteo",
      detail: "Geocoding JSON",
      proxy: "/api/v1/citys-stats/integrations/geocoding/:city",
      url: "https://open-meteo.com/en/docs/geocoding-api"
    },
    {
      name: "REST Countries",
      detail: "Country profile JSON",
      proxy: "/api/v1/citys-stats/integrations/country/:country",
      url: "https://restcountries.com/"
    },
    {
      name: "World Bank",
      detail: "Indicator JSON",
      proxy: "/api/v1/citys-stats/integrations/world-bank/:code",
      url: "https://datahelpdesk.worldbank.org/knowledgebase/articles/889392-about-the-indicators-api-documentation"
    },
    {
      name: "SOS2526-25",
      detail: "Tourist arrivals",
      proxy: "/api/v1/citys-stats/integrations/sos-tourist-arrivals",
      url: "https://sos2526-25.onrender.com/international-tourist-arrivals"
    },
    {
      name: "SOS2526-19",
      detail: "Earthquakes",
      proxy: "/api/v1/citys-stats/integrations/sos-earthquakes",
      url: "https://sos2526-19.onrender.com/earthquakes"
    },
    {
      name: "SOS2526-26",
      detail: "FIFA squad values",
      proxy: "/api/v1/citys-stats/integrations/sos-fifa-squad-values",
      url: "https://sos2526-26.onrender.com/front-rfr"
    },
    {
      name: "SOS2526-30",
      detail: "Esports earnings",
      proxy: "/api/v1/citys-stats/integrations/sos-esports-earnings",
      url: "https://sos2526-30.onrender.com/esportsearnings-stats"
    }
  ];

  const integrationDescriptions = {
    openMeteo: {
      summary:
        "Parte de los paises agregados de citys-stats. Para cada pais se toma la ciudad local con mas poblacion, se consulta Open-Meteo con esa ciudad y el proxy devuelve coordenadas, zona horaria, altitud y poblacion externa.",
      points: [
        { label: "Union", value: "topCity + country de citys-stats" },
        { label: "API externa", value: "Open-Meteo Geocoding" },
        { label: "Grafica", value: "Tamano por poblacion local y color por latitud externa" }
      ]
    },
    restCountries: {
      summary:
        "Cruza cada pais local con REST Countries usando el campo country. La API externa aporta datos oficiales del pais completo, mientras citys-stats aporta la suma de poblacion de las ciudades que tenemos guardadas para ese pais.",
      points: [
        { label: "Union", value: "country normalizado" },
        { label: "API externa", value: "REST Countries" },
        { label: "Grafica", value: "Flujo citys-stats -> pais -> REST Countries con escala logaritmica" }
      ]
    },
    worldBank: {
      summary:
        "Primero REST Countries da el codigo ISO3 del pais. Con ese codigo se consulta World Bank para traer el indicador SP.POP.TOTL, que representa la poblacion nacional mas reciente disponible.",
      points: [
        { label: "Union", value: "country -> codigo ISO3 cca3" },
        { label: "API externa", value: "World Bank Indicators" },
        { label: "Grafica", value: "Compara poblacion local agregada con poblacion nacional World Bank" }
      ]
    },
    tourism: {
      summary:
        "Descarga llegadas turisticas de SOS2526-25, normaliza las filas y las agrupa por pais. Luego intenta encontrar ese pais en citys-stats; si no hay coincidencia exacta, usa la media local como referencia.",
      points: [
        { label: "Union", value: "country normalizado; si falla, media citys-stats" },
        { label: "API externa", value: "SOS2526-25 international-tourist-arrivals" },
        { label: "Grafica", value: "Indices 0-100 para comparar turismo y poblacion local sin mezclar unidades" }
      ]
    },
    earthquakes: {
      summary:
        "Toma los terremotos de SOS2526-19, convierte codigos ISO3 a pais cuando hace falta y agrupa por pais. Para cada pais conserva la severidad maxima, numero de eventos, poblacion expuesta y fecha mas reciente.",
      points: [
        { label: "Union", value: "country normalizado o ISO3 convertido a pais" },
        { label: "API externa", value: "SOS2526-19 earthquakes" },
        { label: "Grafica", value: "Barra de severidad externa con marca de referencia de poblacion local" }
      ]
    },
    fifa: {
      summary:
        "Agrupa los datos FIFA por pais y se queda con el valor de plantilla del ultimo anio disponible. Como no siempre coinciden los mismos paises que citys-stats, la grafica compara rankings normalizados: ranking FIFA frente a ranking local de poblacion.",
      points: [
        { label: "Union", value: "ranking externo frente a ranking local" },
        { label: "API externa", value: "SOS2526-26 fifa-squad-value-per-years" },
        { label: "Grafica", value: "Dos indices 0-100: valor FIFA y poblacion citys-stats" }
      ]
    },
    esports: {
      summary:
        "Agrupa premios de eSports de SOS2526-30 por pais y busca coincidencia con citys-stats. El sunburst muestra dos ramas por pais: una rama local de poblacion y otra rama externa del juego con premios destacados.",
      points: [
        { label: "Union", value: "country normalizado; si falla, media citys-stats" },
        { label: "API externa", value: "SOS2526-30 esportsearnings-stats" },
        { label: "Grafica", value: "Ramas por pais que separan poblacion local y premios eSports" }
      ]
    }
  };

  // Convierte textos de API a una forma legible para titulos y etiquetas.
  function titleCase(value) {
    return String(value ?? "")
      .split(/[-\s]+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }

  // Convierte cualquier valor a numero finito o null si no sirve.
  function numberOrNull(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  // Decide que nombre de pais mostrar segun venga de REST Countries o de citys-stats.
  function countryName(row) {
    return row.countryInfo?.name || row.countryData?.name || titleCase(row.country);
  }

  // Muestra numeros grandes con separadores o un texto fallback si faltan.
  function displayNumber(value, fallback = "Sin dato") {
    const parsed = numberOrNull(value);
    return parsed === null ? fallback : formatter.format(parsed);
  }

  // Muestra numeros grandes abreviados, util en tooltips de poblacion o dinero.
  function displayCompact(value, fallback = "Sin dato") {
    const parsed = numberOrNull(value);
    return parsed === null ? fallback : compactFormatter.format(parsed);
  }

  // Muestra decimales con dos cifras maximas.
  function displayDecimal(value, fallback = "Sin dato") {
    const parsed = numberOrNull(value);
    return parsed === null ? fallback : decimalFormatter.format(parsed);
  }

  // Ordena y limita paises externos por una metrica concreta.
  function topCountries(data, metric, limit = 6) {
    return (Array.isArray(data?.countries) ? data.countries : [])
      .filter((item) => numberOrNull(item?.[metric]) !== null)
      .sort((a, b) => Number(b[metric] ?? 0) - Number(a[metric] ?? 0))
      .slice(0, limit);
  }

  // Normaliza nombres de pais para poder cruzar fuentes con guiones, tildes o mayusculas.
  function normalizeCountryKey(value) {
    return String(value ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[-_]+/g, " ")
      .trim()
      .toLowerCase();
  }

  // Crea un indice rapido pais -> resumen local de citys-stats.
  function localCountryIndex() {
    const index = new Map();

    countrySummaries.forEach((country) => {
      index.set(normalizeCountryKey(country.country), country);
    });

    return index;
  }

  // Busca un pais externo dentro de los paises disponibles en citys-stats.
  function findLocalCountry(country) {
    return localCountryIndex().get(normalizeCountryKey(country));
  }

  // Calcula una poblacion media local para usarla cuando una API externa no
  // tiene coincidencia exacta con nuestros paises.
  function localAveragePopulation() {
    const values = countrySummaries
      .map((country) => numberOrNull(country.un_2025_population))
      .filter((value) => value !== null);

    if (!values.length) return 0;
    return values.reduce((total, value) => total + value, 0) / values.length;
  }

  // Escoge la poblacion local que acompana a una fila externa.
  function localPopulationFor(match) {
    return numberOrNull(match?.local?.un_2025_population) ??
      numberOrNull(match?.localPopulation) ??
      localAveragePopulation();
  }

  // Empareja filas externas con paises locales; si no hay matches usa una
  // referencia media para que el widget siga siendo comparable.
  function combinedCountryRows(rows, metric, limit = 6) {
    const sortedRows = (Array.isArray(rows) ? rows : [])
      .filter((row) => numberOrNull(row?.[metric]) !== null)
      .sort((a, b) => Number(b[metric] ?? 0) - Number(a[metric] ?? 0));

    const exactMatches = sortedRows
      .map((external) => ({
        external,
        local: findLocalCountry(external.country),
        localLabel: "Pais en citys-stats"
      }))
      .filter((match) => match.local)
      .slice(0, limit);

    if (exactMatches.length) return exactMatches;

    const localPopulation = localAveragePopulation();
    return sortedRows.slice(0, limit).map((external) => ({
      external,
      local: null,
      localPopulation,
      localLabel: "Media citys-stats"
    }));
  }

  // Mantiene mas filas externas aunque no todas coincidan con citys-stats.
  function contextualCountryRows(rows, metric, limit = 8) {
    const localPopulation = localAveragePopulation();

    return (Array.isArray(rows) ? rows : [])
      .filter((row) => numberOrNull(row?.[metric]) !== null)
      .sort((a, b) => Number(b[metric] ?? 0) - Number(a[metric] ?? 0))
      .slice(0, limit)
      .map((external) => {
        const local = findLocalCountry(external.country);

        return {
          external,
          local,
          localPopulation: numberOrNull(local?.un_2025_population) ?? localPopulation,
          localLabel: local ? "Pais en citys-stats" : "Media citys-stats"
        };
      });
  }

  // Convierte un valor a una escala visual, evitando ceros que desaparezcan.
  function normalizedIndex(value, max, scale = 100) {
    const parsed = numberOrNull(value);
    const parsedMax = numberOrNull(max);

    if (parsed === null || !parsedMax || parsedMax <= 0) return 0;
    return Math.max(1, Math.min(scale, (parsed / parsedMax) * scale));
  }

  // Acumula errores de integracion para mostrarlos sin romper toda la pantalla.
  function collectError(list, label, result, context = "") {
    if (result.error) {
      list.push({
        label,
        context,
        message: result.error
      });
    }
  }

  // Ejecuta una llamada y devuelve siempre un objeto controlado de exito/error.
  async function safeLoad(task) {
    try {
      return { data: await task(), error: "" };
    } catch (e) {
      return { data: null, error: e.message || "No se pudo cargar la integracion." };
    }
  }

  // Carga Highcharts y todos los modulos usados por los widgets.
  async function loadHighcharts() {
    if (Highcharts) return Highcharts;

    const module = await import("highcharts");
    Highcharts = module.default;
    window._Highcharts = Highcharts;

    const moreModule = await import("highcharts/highcharts-more.js");
    const morePlugin = moreModule.default ?? moreModule;
    if (typeof morePlugin === "function") morePlugin(Highcharts);

    // Algunos modulos exportan una funcion plugin; este helper la aplica si existe.
    async function loadPlugin(pluginLoader) {
      const pluginModule = await pluginLoader();
      const plugin = pluginModule.default ?? pluginModule;
      if (typeof plugin === "function") plugin(Highcharts);
    }

    await loadPlugin(() => import("highcharts/modules/dumbbell.js"));
    await loadPlugin(() => import("highcharts/modules/lollipop.js"));
    await loadPlugin(() => import("highcharts/modules/bullet.js"));
    await loadPlugin(() => import("highcharts/modules/sankey.js"));
    await loadPlugin(() => import("highcharts/modules/heatmap.js"));
    await loadPlugin(() => import("highcharts/modules/treemap.js"));
    await loadPlugin(() => import("highcharts/modules/sunburst.js"));
    await loadPlugin(() => import("highcharts/modules/accessibility.js"));

    return Highcharts;
  }

  // Destruye todos los widgets antes de repintar o salir de la pantalla.
  function destroyIntegrationCharts() {
    integrationCharts.forEach((chart) => chart?.destroy());
    integrationCharts = [];
  }

  // Crea una grafica con opciones comunes para todos los widgets.
  function createChart(container, config) {
    if (!Highcharts || !container) return;

    integrationCharts.push(Highcharts.chart(container, {
      ...config,
      chart: {
        backgroundColor: "transparent",
        ...(config.chart ?? {})
      },
      credits: {
        enabled: false,
        ...(config.credits ?? {})
      }
    }));
  }

  // Widget 1: treemap de ciudades con coordenadas de Open-Meteo.
  function renderGeocodingChart() {
    const chartRows = geocodingRows
      .filter((row) =>
        numberOrNull(row.geocoding?.longitude) !== null &&
        numberOrNull(row.geocoding?.latitude) !== null
      )
      .map((row) => {
        const latitude = Number(row.geocoding.latitude);
        const longitude = Number(row.geocoding.longitude);
        const localPopulation = Number(row.topCityPopulation ?? row.un_2025_population ?? 1);
        const color = latitude < 0
          ? "#0284c7"
          : latitude < 20
            ? "#0d9488"
            : latitude < 35
              ? "#16a34a"
              : latitude < 45
                ? "#ca8a04"
                : "#dc2626";

        return {
          name: titleCase(row.topCity),
          value: Math.max(localPopulation, 1),
          color,
          custom: {
            country: titleCase(row.country),
            lat: latitude,
            lon: longitude,
            externalPopulation: row.geocoding.population,
            localPopulation,
            timezone: row.geocoding.timezone,
            elevation: row.geocoding.elevation
          }
        };
      });

    createChart(geocodingChartContainer, {
      chart: {
        type: "treemap",
        spacing: [8, 8, 8, 8]
      },
      title: {
        text: "Open-Meteo: geocoding y poblacion local",
        align: "left"
      },
      subtitle: {
        text: "Widget treemap: area por citys-stats y color por latitud Open-Meteo",
        align: "left"
      },
      accessibility: {
        enabled: true,
        description:
          "Treemap donde el area de cada rectangulo usa poblacion de citys-stats y el color agrupa la latitud obtenida desde Open-Meteo."
      },
      tooltip: {
        pointFormatter() {
          return `<strong>${this.name}, ${this.custom.country}</strong><br/>Poblacion citys-stats: ${displayNumber(this.custom.localPopulation)}<br/>Latitud Open-Meteo: ${displayDecimal(this.custom.lat)}<br/>Longitud Open-Meteo: ${displayDecimal(this.custom.lon)}<br/>Zona: ${this.custom.timezone ?? "Sin dato"}<br/>Altitud: ${displayNumber(this.custom.elevation)} m<br/>Poblacion Open-Meteo: ${displayNumber(this.custom.externalPopulation)}`;
        }
      },
      plotOptions: {
        treemap: {
          layoutAlgorithm: "squarified",
          borderColor: "#ffffff",
          borderWidth: 3,
          dataLabels: {
            enabled: true,
            format: "{point.name}",
            style: {
              color: "#ffffff",
              fontWeight: "800",
              textOutline: "0 1px 2px rgba(15,23,42,0.65)"
            }
          }
        }
      },
      series: [
        {
          name: "Ciudad principal",
          data: chartRows
        }
      ]
    });
  }

  // Widget 2: Sankey entre poblacion local y datos oficiales de REST Countries.
  function renderCountryChart() {
    const chartRows = countryCards
      .filter((row) => numberOrNull(row.countryData?.population) !== null)
      .map((row) => ({
        name: countryName(row),
        countryPopulation: Number(row.countryData.population),
        localPopulation: Number(row.un_2025_population ?? 0),
        custom: {
          capital: row.countryData.capital,
          region: row.countryData.region,
          area: row.countryData.area
        }
      }));
    const sankeyRows = chartRows.flatMap((row) => {
      const localWeight = Math.max(Math.log10(Math.max(row.localPopulation, 1)), 1);
      const countryWeight = Math.max(Math.log10(Math.max(row.countryPopulation, 1)), 1);

      return [
        {
          from: "citys-stats",
          to: row.name,
          weight: localWeight,
          custom: {
            ...row.custom,
            metric: "Poblacion agregada de citys-stats",
            localPopulation: row.localPopulation,
            countryPopulation: row.countryPopulation
          }
        },
        {
          from: row.name,
          to: "REST Countries",
          weight: countryWeight,
          custom: {
            ...row.custom,
            metric: "Poblacion oficial de REST Countries",
            localPopulation: row.localPopulation,
            countryPopulation: row.countryPopulation
          }
        }
      ];
    });

    createChart(countryChartContainer, {
      chart: {
        type: "sankey"
      },
      title: {
        text: "REST Countries: relacion local-oficial",
        align: "left"
      },
      subtitle: {
        text: "Widget sankey: citys-stats, pais y REST Countries en flujo logaritmico",
        align: "left"
      },
      accessibility: {
        enabled: true,
        description:
          "Diagrama Sankey que conecta la poblacion agregada de citys-stats con la poblacion nacional recuperada desde REST Countries."
      },
      tooltip: {
        pointFormatter() {
          if (!this.custom) {
            return `<strong>${this.name}</strong>`;
          }

          return `<strong>${this.from} -> ${this.to}</strong><br/>Metrica visual: ${this.custom.metric}<br/>citys-stats pais: ${displayNumber(this.custom.localPopulation)}<br/>REST Countries pais: ${displayNumber(this.custom.countryPopulation)}<br/>Area: ${displayCompact(this.custom.area)} km2<br/>Capital: ${this.custom.capital ?? "Sin dato"}`;
        }
      },
      plotOptions: {
        sankey: {
          curveFactor: 0.42,
          nodeWidth: 18,
          nodePadding: 18,
          dataLabels: {
            enabled: true,
            style: {
              color: "#0f172a",
              textOutline: "none"
            }
          }
        }
      },
      series: [
        {
          name: "Relacion local-oficial",
          keys: ["from", "to", "weight"],
          data: sankeyRows,
          nodes: [
            { id: "citys-stats", color: "#0f766e" },
            { id: "REST Countries", color: "#2563eb" }
          ]
        }
      ]
    });
  }

  // Widget 3: lollipop comparando citys-stats con poblacion de World Bank.
  function renderWorldBankChart() {
    const chartRows = worldBankRows
      .filter((row) => numberOrNull(row.worldBank?.value) !== null)
      .map((row) => ({
        name: countryName(row),
        worldPopulation: Number(row.worldBank.value),
        localPopulation: Number(row.localPopulation ?? 0),
        custom: {
          date: row.worldBank.date,
          code: row.countryInfo?.cca3
        }
      }));

    createChart(worldBankChartContainer, {
      chart: {
        type: "lollipop",
        inverted: true
      },
      title: {
        text: "World Bank: poblacion nacional",
        align: "left"
      },
      subtitle: {
        text: "Widget lollipop: citys-stats agregado frente a World Bank",
        align: "left"
      },
      accessibility: {
        enabled: true,
        description:
          "Grafico de barras horizontales con la poblacion nacional recuperada desde World Bank para los paises presentes en citys-stats."
      },
      xAxis: {
        type: "category",
        title: { text: null }
      },
      yAxis: {
        type: "logarithmic",
        min: 1,
        title: { text: "Poblacion" },
        labels: {
          formatter() {
            return compactFormatter.format(this.value);
          }
        }
      },
      tooltip: {
        pointFormatter() {
          return `<strong>${this.name}</strong><br/>Serie: ${this.series.name}<br/>Valor visualizado: <b>${displayNumber(this.y)}</b><br/>citys-stats pais: <b>${displayNumber(this.custom.localPopulation)}</b><br/>World Bank ${this.custom.date ?? ""}: <b>${displayNumber(this.custom.worldPopulation)}</b><br/>ISO3: ${this.custom.code ?? "N/D"}`;
        }
      },
      plotOptions: {
        lollipop: {
          color: "#2563eb",
          connectorWidth: 2,
          dataLabels: {
            enabled: true,
            formatter() {
              return compactFormatter.format(this.y);
            }
          }
        }
      },
      series: [
        {
          name: "citys-stats agregado",
          color: "#0f766e",
          data: chartRows.map((row) => ({
            name: row.name,
            y: Math.max(row.localPopulation, 1),
            custom: {
              ...row.custom,
              localPopulation: row.localPopulation,
              worldPopulation: row.worldPopulation
            }
          }))
        },
        {
          name: "World Bank pais",
          color: "#2563eb",
          data: chartRows.map((row) => ({
            name: row.name,
            y: Math.max(row.worldPopulation, 1),
            custom: {
              ...row.custom,
              localPopulation: row.localPopulation,
              worldPopulation: row.worldPopulation
            }
          }))
        }
      ]
    });
  }

  // Widget 4: ranking de turismo externo frente a poblacion local.
  function renderTourismChart() {
    const chartRows = contextualCountryRows(touristCountries, "totalArrivals", 8);
    const arrivalsMax = Math.max(...chartRows.map((match) => Number(match.external.totalArrivals ?? 0)), 1);
    const localMax = Math.max(...chartRows.map((match) => localPopulationFor(match)), 1);

    createChart(tourismChartContainer, {
      chart: {
        type: "bar"
      },
      title: {
        text: "SOS2526-25: llegadas turisticas",
        align: "left"
      },
      subtitle: {
        text: "Widget bar: ranking de llegadas y referencia citys-stats normalizada",
        align: "left"
      },
      accessibility: {
        enabled: true,
        description:
          "Grafico de barras que compara el indice de llegadas turisticas de SOS2526-25 con una referencia normalizada de poblacion citys-stats."
      },
      xAxis: {
        categories: chartRows.map((match) => titleCase(match.external.country)),
        title: { text: "Pais" }
      },
      yAxis: {
        min: 0,
        max: 100,
        title: { text: "Indice normalizado" }
      },
      tooltip: {
        pointFormatter() {
          return `<strong>${this.category}</strong><br/>Serie: ${this.series.name}: ${displayDecimal(this.y)}%<br/>Llegadas SOS2526-25: ${displayNumber(this.options.custom.arrivals)}<br/>Poblacion citys-stats: ${displayNumber(this.options.custom.localPopulation)}<br/>Base local: ${this.options.custom.localLabel}<br/>Registros turismo: ${this.options.custom.records}<br/>Ultimo anio: ${this.options.custom.latestYear ?? "N/D"}`;
        }
      },
      plotOptions: {
        bar: {
          borderRadius: 4,
          pointPadding: 0.12,
          groupPadding: 0.08,
          dataLabels: {
            enabled: true,
            format: "{point.y:.0f}%",
            style: {
              color: "#0f172a",
              fontWeight: "800",
              textOutline: "none"
            }
          }
        }
      },
      series: [
        {
          name: "Indice llegadas turisticas",
          color: "#db2777",
          data: chartRows.map((match) => ({
            y: normalizedIndex(match.external.totalArrivals, arrivalsMax),
            custom: {
              arrivals: match.external.totalArrivals,
              latestYear: match.external.latestYear,
              records: match.external.records,
              localPopulation: localPopulationFor(match),
              localLabel: match.localLabel
            }
          }))
        },
        {
          name: "Indice poblacion citys-stats",
          color: "#0f766e",
          data: chartRows.map((match) => ({
            y: normalizedIndex(localPopulationFor(match), localMax),
            custom: {
              arrivals: match.external.totalArrivals,
              latestYear: match.external.latestYear,
              records: match.external.records,
              localPopulation: localPopulationFor(match),
              localLabel: match.localLabel
            }
          }))
        }
      ]
    });
  }

  // Widget 5: bullet chart de severidad de terremotos frente a indice local.
  function renderEarthquakeChart() {
    const chartRows = combinedCountryRows(earthquakeCountries, "maxSeverity");
    const localMax = Math.max(...chartRows.map((match) => localPopulationFor(match)), 1);

    createChart(earthquakeChartContainer, {
      chart: {
        type: "bullet",
        inverted: true
      },
      title: {
        text: "SOS2526-19: severidad maxima",
        align: "left"
      },
      subtitle: {
        text: "Widget bullet: severidad externa frente a indice citys-stats",
        align: "left"
      },
      accessibility: {
        enabled: true,
        description:
          "Grafico bullet con la severidad maxima de terremotos por pais desde SOS2526-19 y un umbral de referencia alto."
      },
      xAxis: {
        categories: chartRows.map((match) => titleCase(match.external.country)),
        title: { text: "Pais" }
      },
      yAxis: {
        min: 0,
        max: 10,
        plotBands: [
          { from: 0, to: 4, color: "#dcfce7" },
          { from: 4, to: 6, color: "#fef9c3" },
          { from: 6, to: 10, color: "#fee2e2" }
        ],
        title: { text: "Severidad maxima" }
      },
      tooltip: {
        pointFormatter() {
          return `<strong>${this.category}</strong><br/>Severidad SOS2526-19: ${displayDecimal(this.y)}<br/>Indice citys-stats poblacion: ${displayDecimal(this.target)} / 10<br/>Poblacion citys-stats: ${displayNumber(this.options.custom.localPopulation)}<br/>Base local: ${this.options.custom.localLabel}<br/>Eventos: ${this.options.custom.records}<br/>Ultima fecha: ${this.options.custom.latestDate ?? "N/D"}`;
        }
      },
      plotOptions: {
        bullet: {
          color: "#dc2626",
          pointPadding: 0.22,
          borderWidth: 0,
          targetOptions: {
            width: "140%",
            height: 3,
            borderWidth: 0,
            color: "#111827"
          }
        }
      },
      series: [
        {
          name: "Severidad",
          data: chartRows.map((match) => ({
            y: Number(match.external.maxSeverity ?? 0),
            target: normalizedIndex(localPopulationFor(match), localMax, 10),
            custom: {
              records: match.external.records,
              latestDate: match.external.latestDate,
              localPopulation: localPopulationFor(match),
              localLabel: match.localLabel
            }
          }))
        }
      ]
    });
  }

  // Widget 6: column pyramid que compara ranking local con ranking de valor FIFA.
  function renderFifaChart() {
    const chartRows = fifaCountries
      .filter((country) => numberOrNull(country.latestTotalMarketValue) !== null)
      .slice(0, 6);
    const localRanks = countrySummaries.slice(0, chartRows.length);
    const maxFifaValue = Math.max(
      ...chartRows.map((country) => Number(country.latestTotalMarketValue ?? 0)),
      1
    );
    const maxLocalPopulation = Math.max(
      ...localRanks.map((country) => Number(country.un_2025_population ?? 0)),
      1
    );
    const comparisonRows = chartRows.map((country, index) => {
      const local = localRanks[index] ?? countrySummaries[index % Math.max(countrySummaries.length, 1)];
      const squadSize = Number(country.latestSquadSize ?? country.squadSize ?? 0);
      const totalValue = Number(country.latestTotalMarketValue ?? 0);
      const localPopulation = Number(local?.un_2025_population ?? 0);
      const localIndex = normalizedIndex(localPopulation, maxLocalPopulation);
      const fifaIndex = normalizedIndex(totalValue, maxFifaValue);

      return {
        latestYear: country.latestYear,
        squadSize,
        totalValue,
        localPopulation,
        localCountry: titleCase(local?.country),
        fifaCountry: titleCase(country.country),
        localIndex,
        fifaIndex
      };
    });

    createChart(fifaChartContainer, {
      chart: {
        type: "columnpyramid"
      },
      title: {
        text: "SOS2526-26: valor de plantillas FIFA",
        align: "left"
      },
      subtitle: {
        text: "Widget columnpyramid: indices normalizados citys-stats y FIFA",
        align: "left"
      },
      accessibility: {
        enabled: true,
        description:
          "Grafico column pyramid que compara por pais el indice de poblacion agregada de citys-stats con el indice de valor de plantilla desde SOS2526-26."
      },
      xAxis: {
        categories: comparisonRows.map((row) => row.fifaCountry),
        title: { text: "Pais FIFA" }
      },
      yAxis: {
        min: 0,
        max: 100,
        title: { text: "Indice normalizado" },
        labels: {
          format: "{value}%"
        }
      },
      tooltip: {
        pointFormatter() {
          return `<strong>${this.category}</strong><br/>Serie: ${this.series.name}: ${displayDecimal(this.y)}%<br/>citys-stats: ${this.options.custom.localCountry} (${displayNumber(this.options.custom.localPopulation)})<br/>Indice local: ${displayDecimal(this.options.custom.localIndex)}%<br/>FIFA: ${this.options.custom.fifaCountry} (${displayCompact(this.options.custom.totalValue)})<br/>Indice FIFA: ${displayDecimal(this.options.custom.fifaIndex)}%<br/>Plantilla: ${displayNumber(this.options.custom.squadSize)} jugadores<br/>Anio: ${this.options.custom.latestYear ?? "N/D"}`;
        }
      },
      plotOptions: {
        columnpyramid: {
          groupPadding: 0.12,
          pointPadding: 0.08,
          dataLabels: {
            enabled: true,
            format: "{point.y:.0f}%"
          }
        }
      },
      legend: {
        enabled: true
      },
      series: [
        {
          name: "Indice citys-stats",
          color: "#0f766e",
          data: comparisonRows.map((row) => ({
            y: row.localIndex,
            custom: row
          }))
        },
        {
          name: "Indice FIFA",
          color: "#0891b2",
          data: comparisonRows.map((row) => ({
            y: row.fifaIndex,
            custom: row
          }))
        }
      ]
    });
  }

  // Widget 7: sunburst que reparte paises locales y premios de eSports.
  function renderEsportsChart() {
    const chartRows = combinedCountryRows(esportsCountries, "topCountryEarnings");
    const maxEarnings = Math.max(
      ...chartRows.map((match) => Number(match.external.topCountryEarnings ?? 0)),
      1
    );
    const maxLocalPopulation = Math.max(...chartRows.map((match) => localPopulationFor(match)), 1);
    const sunburstData = [
      {
        id: "root",
        name: "eSports + citys-stats"
      },
      ...chartRows.flatMap((match, index) => {
        const countryId = `country-${index}`;
        const earnings = Number(match.external.topCountryEarnings ?? 0);
        const gameName = match.external.topGameName ?? match.external.latestGameName ?? "Juego sin dato";
        const localPopulation = localPopulationFor(match);

        return [
          {
            id: countryId,
            parent: "root",
            name: titleCase(match.external.country),
            custom: {
              earnings,
              gameName,
              records: match.external.records,
              localPopulation,
              localLabel: match.localLabel
            }
          },
          {
            parent: countryId,
            name: "citys-stats",
            value: normalizedIndex(localPopulation, maxLocalPopulation),
            color: "#0f766e",
            custom: {
              metric: "Poblacion citys-stats",
              earnings,
              gameName,
              records: match.external.records,
              localPopulation,
              localLabel: match.localLabel
            }
          },
          {
            parent: countryId,
            name: gameName,
            value: normalizedIndex(earnings, maxEarnings),
            color: "#9333ea",
            custom: {
              metric: "Premios eSports",
              earnings,
              gameName,
              records: match.external.records,
              localPopulation,
              localLabel: match.localLabel
            }
          }
        ];
      })
    ];

    createChart(esportsChartContainer, {
      chart: {
        type: "sunburst"
      },
      title: {
        text: "SOS2526-30: premios eSports",
        align: "left"
      },
      subtitle: {
        text: "Widget sunburst: ramas locales citys-stats y premios eSports",
        align: "left"
      },
      accessibility: {
        enabled: true,
        description:
          "Grafico sunburst con paises y juegos destacados segun premios de eSports desde SOS2526-30."
      },
      tooltip: {
        pointFormatter() {
          return `<strong>${this.name}</strong><br/>Metrica visual: ${this.custom?.metric ?? "Pais integrado"}<br/>Poblacion citys-stats: ${displayNumber(this.custom?.localPopulation)}<br/>Base local: ${this.custom?.localLabel ?? "N/D"}<br/>Premios eSports: ${displayCompact(this.custom?.earnings)}<br/>Juego principal: ${this.custom?.gameName ?? "Sin dato"}<br/>Registros: ${this.custom?.records ?? "N/D"}`;
        }
      },
      plotOptions: {
        sunburst: {
          allowDrillToNode: true,
          cursor: "pointer",
          dataLabels: {
            enabled: true,
            format: "{point.name}",
            filter: {
              property: "innerArcLength",
              operator: ">",
              value: 16
            }
          }
        }
      },
      series: [
        {
          name: "Premios eSports",
          size: "95%",
          center: ["50%", "50%"],
          data: sunburstData,
          levels: [
            {
              level: 1,
              colorByPoint: true,
              levelSize: {
                unit: "percentage",
                value: 40
              }
            },
            {
              level: 2,
              levelSize: {
                unit: "percentage",
                value: 60
              },
              colorVariation: {
                key: "brightness",
                to: -0.25
              }
            }
          ]
        }
      ]
    });
  }

  // Repinta todos los widgets despues de cargar o actualizar datos.
  function renderIntegrationCharts() {
    destroyIntegrationCharts();
    renderGeocodingChart();
    renderCountryChart();
    renderWorldBankChart();
    renderTourismChart();
    renderEarthquakeChart();
    renderFifaChart();
    renderEsportsChart();
  }

  // Orquesta toda la pantalla: datos locales, APIs externas, errores y charts.
  async function loadIntegrations() {
    loading = true;
    error = "";
    integrationErrors = [];
    restoredInitialData = false;
    destroyIntegrationCharts();

    try {
      countrySummaries = await getCountrySummaries(selectedLimit);

      if (countrySummaries.length === 0) {
        await loadInitialCitysStats();
        countrySummaries = await getCountrySummaries(selectedLimit);
        restoredInitialData = countrySummaries.length > 0;
      }

      const errors = [];

      const geocodingResults = await Promise.all(
        countrySummaries.map((item) =>
          safeLoad(() => getGeocoding(item.topCity, item.country))
        )
      );
      geocodingRows = geocodingResults.map((result, index) => {
        const local = countrySummaries[index];
        collectError(errors, "Open-Meteo", result, `${titleCase(local.topCity)}, ${titleCase(local.country)}`);
        return {
          ...local,
          geocoding: result.data,
          error: result.error
        };
      });

      const countryResults = await Promise.all(
        countrySummaries.map((item) => safeLoad(() => getCountryInfo(item.country)))
      );
      countryCards = countryResults.map((result, index) => {
        const local = countrySummaries[index];
        collectError(errors, "REST Countries", result, titleCase(local.country));
        return {
          ...local,
          countryData: result.data,
          error: result.error
        };
      });

      const worldBankResults = await Promise.all(
        countryCards.map((row) => {
          if (!row.countryData?.cca3) {
            return Promise.resolve({
              data: null,
              error: "Codigo ISO3 no disponible"
            });
          }

          return safeLoad(() => getWorldBankPopulation(row.countryData.cca3));
        })
      );
      worldBankRows = worldBankResults.map((result, index) => {
        const local = countrySummaries[index];
        const countryInfo = countryCards[index]?.countryData;
        collectError(errors, "World Bank", result, countryInfo?.name || titleCase(local.country));
        return {
          country: local.country,
          localPopulation: local.un_2025_population,
          countryInfo,
          worldBank: result.data,
          error: result.error
        };
      });

      const [tourismResult, earthquakeResult, fifaResult, esportsResult] = await Promise.all([
        safeLoad(getSosTouristArrivals),
        safeLoad(getSosEarthquakes),
        safeLoad(getSosFifaSquadValues),
        safeLoad(getSosEsportsEarnings)
      ]);

      collectError(errors, "SOS2526-25 turistas", tourismResult);
      collectError(errors, "SOS2526-19 terremotos", earthquakeResult);
      collectError(errors, "SOS2526-26 FIFA", fifaResult);
      collectError(errors, "SOS2526-30 eSports", esportsResult);

      touristCountries = topCountries(tourismResult.data, "totalArrivals", 8);
      earthquakeCountries = topCountries(earthquakeResult.data, "maxSeverity");
      fifaCountries = topCountries(fifaResult.data, "latestTotalMarketValue");
      esportsCountries = topCountries(esportsResult.data, "topCountryEarnings");

      integrationErrors = errors;

      loading = false;
      await tick();
      await loadHighcharts();
      renderIntegrationCharts();
    } catch (e) {
      error = e.message || "No se pudieron cargar las integraciones.";
      loading = false;
    }
  }

  // Al abrir la pantalla se cargan las integraciones.
  onMount(loadIntegrations);

  // Al salir se limpian las graficas creadas por Highcharts.
  onDestroy(() => {
    destroyIntegrationCharts();
  });
</script>

<svelte:head>
  <title>Integraciones citys-stats | SOS2526-29</title>
</svelte:head>

<main class="integrations-page">
  <header class="page-header">
    <div>
      <p class="eyebrow">LCC citys-stats</p>
      <h1>Integraciones externas</h1>
      <p class="subtitle">Datos de ciudades cruzados con APIs REST JSON mediante endpoints propios de Express.</p>
    </div>

    <div class="toolbar" aria-label="Opciones de integracion">
      <label>
        <span>Paises</span>
        <select bind:value={selectedLimit} on:change={loadIntegrations}>
          <option value={5}>5</option>
          <option value={8}>8</option>
          <option value={12}>12</option>
        </select>
      </label>
      <button type="button" on:click={loadIntegrations}>Actualizar</button>
    </div>
  </header>

  <section class="source-grid" aria-label="APIs usadas">
    {#each sourceCards as source}
      <a
        class="source-card"
        href={source.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Abrir ${source.name}: ${source.url}`}
        title={source.url}
      >
        <span>{source.detail}</span>
        <strong>{source.name}</strong>
        <small>{source.url}</small>
      </a>
    {/each}
  </section>

  <section class="integration-flow" aria-label="Como se leen las integraciones">
    <strong>Como leer estas graficas</strong>
    <p>
      Todas parten de citys-stats: el backend agrupa nuestras ciudades por pais,
      consulta APIs externas mediante proxies propios y normaliza nombres y numeros.
      Cuando las unidades no son comparables directamente, la grafica usa indices
      normalizados para ensenar relacion, no una suma literal de datos distintos.
    </p>
  </section>

  {#if loading}
    <p class="state" role="status">Cargando integraciones...</p>
  {:else if error}
    <div class="message error" role="alert">{error}</div>
  {:else if countrySummaries.length === 0}
    <div class="message">No hay registros locales de citys-stats para integrar.</div>
  {:else}
    {#if restoredInitialData}
      <div class="message success" role="status">
        Se han cargado los datos iniciales de citys-stats para poder mostrar las integraciones.
      </div>
    {/if}

    {#if integrationErrors.length}
      <section class="message warning" aria-label="Avisos de integracion">
        <h2>Avisos de carga</h2>
        <ul>
          {#each integrationErrors as item}
            <li>
              <strong>{item.label}</strong>
              {#if item.context} ({item.context}){/if}: {item.message}
            </li>
          {/each}
        </ul>
      </section>
    {/if}

    <section class="panel" aria-labelledby="open-meteo-title">
      <div class="section-heading">
        <span>Integracion 1</span>
        <h2 id="open-meteo-title">Open-Meteo: geocoding de la ciudad principal</h2>
      </div>
      <div class="integration-explainer">
        <p>{integrationDescriptions.openMeteo.summary}</p>
        <dl>
          {#each integrationDescriptions.openMeteo.points as point}
            <div>
              <dt>{point.label}</dt>
              <dd>{point.value}</dd>
            </div>
          {/each}
        </dl>
      </div>
      <div class="chart-frame" bind:this={geocodingChartContainer}></div>
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Ciudad</th>
              <th>Pais local</th>
              <th>Coordenadas</th>
              <th>Zona horaria</th>
              <th>Altitud</th>
              <th>Poblacion citys-stats</th>
              <th>Poblacion Open-Meteo</th>
            </tr>
          </thead>
          <tbody>
            {#each geocodingRows as row}
              <tr class:error-row={row.error}>
                <td>{titleCase(row.topCity)}</td>
                <td>{titleCase(row.country)}</td>
                <td>
                  {#if row.geocoding}
                    {displayDecimal(row.geocoding.latitude)}, {displayDecimal(row.geocoding.longitude)}
                  {:else}
                    Sin dato
                  {/if}
                </td>
                <td>{row.geocoding?.timezone ?? "Sin dato"}</td>
                <td>{displayNumber(row.geocoding?.elevation, "Sin dato")}</td>
                <td>{displayNumber(row.topCityPopulation ?? row.un_2025_population, "Sin dato")}</td>
                <td>{displayNumber(row.geocoding?.population, "Sin dato")}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </section>

    <section class="panel" aria-labelledby="rest-countries-title">
      <div class="section-heading">
        <span>Integracion 2</span>
        <h2 id="rest-countries-title">REST Countries: ficha nacional</h2>
      </div>
      <div class="integration-explainer">
        <p>{integrationDescriptions.restCountries.summary}</p>
        <dl>
          {#each integrationDescriptions.restCountries.points as point}
            <div>
              <dt>{point.label}</dt>
              <dd>{point.value}</dd>
            </div>
          {/each}
        </dl>
      </div>
      <div class="chart-frame" bind:this={countryChartContainer}></div>
      <div class="country-card-grid">
        {#each countryCards as row}
          <article class="country-card" class:error-card={row.error}>
            <div class="country-card-header">
              <div>
                <p>{titleCase(row.country)}</p>
                <h3>{row.countryData?.name ?? "Sin dato"}</h3>
              </div>
              {#if row.countryData?.flagPng}
                <img src={row.countryData.flagPng} alt={`Bandera de ${row.countryData.name}`} />
              {/if}
            </div>
            <dl>
              <div>
                <dt>Capital</dt>
                <dd>{row.countryData?.capital ?? "Sin dato"}</dd>
              </div>
              <div>
                <dt>Region</dt>
                <dd>{row.countryData?.region ?? "Sin dato"}</dd>
              </div>
              <div>
                <dt>Poblacion pais</dt>
                <dd>{displayCompact(row.countryData?.population)}</dd>
              </div>
              <div>
                <dt>Area</dt>
                <dd>{displayCompact(row.countryData?.area)} km2</dd>
              </div>
            </dl>
          </article>
        {/each}
      </div>
    </section>

    <section class="panel" aria-labelledby="world-bank-title">
      <div class="section-heading">
        <span>Integracion 3</span>
        <h2 id="world-bank-title">World Bank: indicador de poblacion</h2>
      </div>
      <div class="integration-explainer">
        <p>{integrationDescriptions.worldBank.summary}</p>
        <dl>
          {#each integrationDescriptions.worldBank.points as point}
            <div>
              <dt>{point.label}</dt>
              <dd>{point.value}</dd>
            </div>
          {/each}
        </dl>
      </div>
      <div class="chart-frame" bind:this={worldBankChartContainer}></div>
    </section>

    <section class="split-grid" aria-label="Integraciones SOS">
      <article class="panel" aria-labelledby="tourism-title">
        <div class="section-heading">
          <span>Integracion 4</span>
          <h2 id="tourism-title">SOS2526-25: llegadas turisticas</h2>
        </div>
        <div class="integration-explainer">
          <p>{integrationDescriptions.tourism.summary}</p>
          <dl>
            {#each integrationDescriptions.tourism.points as point}
              <div>
                <dt>{point.label}</dt>
                <dd>{point.value}</dd>
              </div>
            {/each}
          </dl>
        </div>
        <div class="chart-frame" bind:this={tourismChartContainer}></div>
        <div class="summary-list">
          {#each touristCountries as country, index}
            <div class="summary-row">
              <span class="rank">{index + 1}</span>
              <div>
                <strong>{titleCase(country.country)}</strong>
                <small>{country.records} registros, ultimo {country.latestYear ?? "N/D"}</small>
              </div>
              <b>{displayCompact(country.totalArrivals)}</b>
            </div>
          {/each}
        </div>
      </article>

      <article class="panel" aria-labelledby="earthquakes-title">
        <div class="section-heading">
          <span>Integracion 5</span>
          <h2 id="earthquakes-title">SOS2526-19: severidad de terremotos</h2>
        </div>
        <div class="integration-explainer">
          <p>{integrationDescriptions.earthquakes.summary}</p>
          <dl>
            {#each integrationDescriptions.earthquakes.points as point}
              <div>
                <dt>{point.label}</dt>
                <dd>{point.value}</dd>
              </div>
            {/each}
          </dl>
        </div>
        <div class="chart-frame" bind:this={earthquakeChartContainer}></div>
        <div class="summary-list">
          {#each earthquakeCountries as country, index}
            <div class="summary-row">
              <span class="rank danger">{index + 1}</span>
              <div>
                <strong>{titleCase(country.country)}</strong>
                <small>{country.records} eventos, ultima fecha {country.latestDate ?? "N/D"}</small>
              </div>
              <b>{displayDecimal(country.maxSeverity)}</b>
            </div>
          {/each}
        </div>
      </article>

      <article class="panel" aria-labelledby="fifa-title">
        <div class="section-heading">
          <span>Integracion 6</span>
          <h2 id="fifa-title">SOS2526-26: valor de plantillas FIFA</h2>
        </div>
        <div class="integration-explainer">
          <p>{integrationDescriptions.fifa.summary}</p>
          <dl>
            {#each integrationDescriptions.fifa.points as point}
              <div>
                <dt>{point.label}</dt>
                <dd>{point.value}</dd>
              </div>
            {/each}
          </dl>
        </div>
        <div class="chart-frame" bind:this={fifaChartContainer}></div>
        <div class="kpi-grid">
          {#each fifaCountries as country}
            <div class="kpi-card">
              <span>{titleCase(country.country)}</span>
              <strong>{displayCompact(country.latestTotalMarketValue)}</strong>
              <small>{country.latestYear ?? "N/D"} - {country.latestSquadSize ?? "N/D"} jugadores</small>
            </div>
          {/each}
        </div>
      </article>

      <article class="panel" aria-labelledby="esports-title">
        <div class="section-heading">
          <span>Integracion 7</span>
          <h2 id="esports-title">SOS2526-30: premios eSports</h2>
        </div>
        <div class="integration-explainer">
          <p>{integrationDescriptions.esports.summary}</p>
          <dl>
            {#each integrationDescriptions.esports.points as point}
              <div>
                <dt>{point.label}</dt>
                <dd>{point.value}</dd>
              </div>
            {/each}
          </dl>
        </div>
        <div class="chart-frame" bind:this={esportsChartContainer}></div>
        <div class="prize-board">
          {#each esportsCountries as country}
            <article>
              <span>{titleCase(country.country)}</span>
              <strong>{displayCompact(country.topCountryEarnings)}</strong>
              <small>{country.topGameName ?? country.latestGameName ?? "Juego sin dato"}</small>
            </article>
          {/each}
        </div>
      </article>
    </section>
  {/if}
</main>

<style>
  :global(body) {
    margin: 0;
    font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
    background: #f6f7fb;
    color: #111827;
  }

  .integrations-page {
    max-width: 1240px;
    margin: 0 auto;
    padding: 28px 16px 54px;
    text-align: left;
  }

  .page-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 20px;
    margin-bottom: 18px;
  }

  .eyebrow,
  h1,
  h2,
  h3,
  p {
    margin: 0;
  }

  .eyebrow,
  .section-heading span {
    color: #0f766e;
    font-size: 0.82rem;
    font-weight: 800;
    letter-spacing: 0;
    text-transform: uppercase;
  }

  h1 {
    margin-top: 8px;
    color: #0f172a;
    font-size: clamp(2rem, 4vw, 3.05rem);
    line-height: 1.08;
  }

  h2 {
    color: #0f172a;
    font-size: 1.16rem;
  }

  h3 {
    color: #0f172a;
    font-size: 1.05rem;
  }

  .subtitle {
    margin-top: 10px;
    color: #526174;
    max-width: 760px;
  }

  .toolbar {
    display: flex;
    align-items: end;
    gap: 10px;
    flex-wrap: wrap;
  }

  .toolbar label {
    display: grid;
    gap: 6px;
    color: #475569;
    font-size: 0.88rem;
    font-weight: 700;
  }

  select,
  button {
    min-height: 42px;
    border-radius: 8px;
    font: inherit;
  }

  select {
    border: 1px solid #cbd5e1;
    background: white;
    color: #0f172a;
    padding: 0 36px 0 12px;
  }

  button {
    border: 0;
    background: #0f766e;
    color: white;
    padding: 0 16px;
    font-weight: 700;
    cursor: pointer;
  }

  button:hover {
    background: #0b5f59;
  }

  .source-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
    gap: 12px;
    margin-bottom: 16px;
  }

  .source-card,
  .panel,
  .message,
  .state {
    border: 1px solid #d9e0ea;
    border-radius: 8px;
    background: #ffffff;
    box-shadow: 0 10px 28px rgba(15, 23, 42, 0.06);
  }

  .source-card {
    display: grid;
    gap: 5px;
    min-width: 0;
    padding: 14px;
    color: inherit;
    text-decoration: none;
  }

  .source-card span,
  .source-card small,
  dt,
  small,
  .country-card p {
    color: #64748b;
    font-size: 0.84rem;
  }

  .source-card strong {
    color: #0f172a;
    font-size: 1.02rem;
  }

  .source-card small {
    overflow-wrap: anywhere;
  }

  .integration-flow {
    border: 1px solid #bae6fd;
    border-radius: 8px;
    background: #f0f9ff;
    padding: 16px;
    margin-bottom: 16px;
  }

  .integration-flow strong {
    display: block;
    color: #0f172a;
    font-size: 1rem;
  }

  .integration-flow p {
    margin-top: 6px;
    color: #475569;
    line-height: 1.55;
  }

  .panel {
    padding: 20px;
    margin-top: 16px;
  }

  .section-heading {
    display: grid;
    gap: 4px;
    margin-bottom: 16px;
  }

  .integration-explainer {
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    background: #f8fafc;
    padding: 14px;
    margin: -2px 0 16px;
  }

  .integration-explainer p {
    color: #475569;
    line-height: 1.55;
  }

  .integration-explainer dl {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
    margin-top: 12px;
  }

  .integration-explainer dl > div {
    min-width: 0;
    border-left: 3px solid #0f766e;
    padding-left: 10px;
  }

  .integration-explainer dt {
    color: #64748b;
    font-size: 0.78rem;
    font-weight: 800;
    text-transform: uppercase;
  }

  .integration-explainer dd {
    margin-top: 3px;
    color: #0f172a;
    font-weight: 800;
    overflow-wrap: anywhere;
  }

  .table-wrapper {
    overflow-x: auto;
  }

  table {
    width: 100%;
    min-width: 790px;
    border-collapse: collapse;
  }

  th,
  td {
    padding: 12px 10px;
    border-bottom: 1px solid #e5e7eb;
    text-align: left;
  }

  th {
    color: #475569;
    font-size: 0.82rem;
    text-transform: uppercase;
  }

  td {
    color: #111827;
  }

  .error-row td {
    color: #991b1b;
  }

  .country-card-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
  }

  .country-card {
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 14px;
    background: #fbfdff;
  }

  .country-card-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    min-height: 48px;
    margin-bottom: 12px;
  }

  .country-card img {
    width: 46px;
    height: 32px;
    object-fit: cover;
    border: 1px solid #e2e8f0;
    border-radius: 4px;
  }

  dl {
    display: grid;
    gap: 10px;
    margin: 0;
  }

  dd {
    margin: 2px 0 0;
    color: #0f172a;
    font-weight: 800;
  }

  .chart-frame {
    min-height: 380px;
    margin-bottom: 16px;
  }

  .split-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
    margin-top: 16px;
  }

  .split-grid .panel {
    margin-top: 0;
  }

  .summary-list,
  .kpi-grid,
  .prize-board {
    display: grid;
    gap: 12px;
  }

  .summary-row {
    display: grid;
    grid-template-columns: 34px minmax(0, 1fr) auto;
    align-items: center;
    gap: 12px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 12px;
    background: #f8fafc;
  }

  .rank {
    display: inline-grid;
    place-items: center;
    width: 30px;
    height: 30px;
    border-radius: 999px;
    background: #e0f2fe;
    color: #0369a1;
    font-weight: 800;
  }

  .rank.danger {
    background: #fee2e2;
    color: #991b1b;
  }

  .summary-row div {
    min-width: 0;
  }

  .summary-row small,
  .kpi-card small,
  .prize-board small {
    display: block;
    margin-top: 2px;
  }

  .summary-row b {
    color: white;
    border-radius: 999px;
    background: #0f766e;
    padding: 5px 9px;
    font-weight: 900;
  }

  .kpi-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .kpi-card {
    display: grid;
    gap: 6px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 12px;
    background: #f8fafc;
  }

  .kpi-card span,
  .prize-board span {
    color: #334155;
    font-weight: 800;
  }

  .kpi-card strong,
  .prize-board strong {
    color: #0f172a;
  }

  .prize-board {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .prize-board article {
    display: grid;
    align-content: end;
    min-height: 122px;
    border: 1px solid #dbeafe;
    border-radius: 8px;
    padding: 12px;
    background: #eff6ff;
  }

  .message,
  .state {
    padding: 16px;
  }

  .message h2 {
    margin-bottom: 10px;
  }

  .message ul {
    margin: 0;
    padding-left: 18px;
  }

  .warning {
    border-color: #fed7aa;
    background: #fff7ed;
    color: #7c2d12;
  }

  .success {
    border-color: #bbf7d0;
    background: #f0fdf4;
    color: #166534;
  }

  .error,
  .error-card {
    border-color: #fecaca;
    background: #fef2f2;
    color: #991b1b;
  }

  .error-card p,
  .error-card dt,
  .error-card small {
    color: #7f1d1d;
  }

  @media (max-width: 960px) {
    .country-card-grid,
    .split-grid,
    .kpi-grid,
    .prize-board {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 760px) {
    .page-header {
      align-items: stretch;
      flex-direction: column;
    }

    .integration-explainer dl {
      grid-template-columns: 1fr;
    }

    .toolbar {
      display: grid;
    }

    button,
    select {
      width: 100%;
      box-sizing: border-box;
    }

    .chart-frame {
      min-height: 330px;
    }

    .summary-row {
      grid-template-columns: 30px minmax(0, 1fr);
    }

    .summary-row b {
      grid-column: 2;
      width: fit-content;
    }
  }
</style>
