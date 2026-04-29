<script>
  import { onMount } from "svelte";
  // Importamos la portada del proyecto.
  import Home from "./routes/Home.svelte";
  // Importamos la pantalla principal de citys-stats.
  import CitysStats from "./routes/CitysStats.svelte";
  // Importamos la pantalla para editar citys-stats.
  import EditCitysStats from "./routes/EditCitysStats.svelte";
  // Importamos la pantalla principal de wine-stats.
  import WineStats from "./routes/WineStats.svelte";
  // Importamos la pantalla para editar wine-stats.
  import EditWineStats from "./routes/EditWineStats.svelte";
  // Importamos la barra de navegacion comun.
  import Navbar from "./components/Navbar.svelte";
  // Importamos la pantalla principal de natural-disasters.
  import NaturalDisasters from "./routes/NaturalDisastersStats.svelte";
  // Importamos la pantalla para editar natural-disasters.
  import EditNaturalDisasters from "./routes/EditNaturalDisasters.svelte";
  // Importamos el panel de analiticas del grupo.
  import GroupAnalytics from "./routes/GroupAnalytics.svelte";
  // Importamos la grafica individual de citys-stats.
  import CitysStatsAnalytics from "./routes/CitysStatsAnalytics.svelte";
  // Importamos el mapa de citys-stats.
  import CitysStatsMapAnalytics from "./routes/CitysStatsMapAnalytics.svelte";
  // Importamos la grafica individual de wine-stats.
  import WineStatsAnalytics from "./routes/WineStatsAnalytics.svelte";
  // Importamos la pantalla de integraciones externas.
  import CitysStatsIntegrations from "./routes/CitysStatsIntegrations.svelte";
  // Importamos el mapa de wine-stats.
  import WineStatsMapAnalytics from "./routes/WineStatsMapAnalytics.svelte";
  // Importamos la grafica individual de natural-disasters.
  import NaturalDisastersAnalytics from "./routes/NaturalDisastersAnalytics.svelte";
  // Importamos el mapa de natural-disasters.
  import NaturalDisastersMapAnalytics from "./routes/NaturalDisastersMapAnalytics.svelte";


  // routes relaciona cada URL con el componente que se debe mostrar.
  const routes = {
    "/": Home,
    "/citys-stats": CitysStats,
    "/citys-stats/editar/:city/:country": EditCitysStats,
    "/wine-stats": WineStats,
    "/wine-stats/editar/:id": EditWineStats,
    "/natural-disasters": NaturalDisasters,
    "/natural-disasters/editar/:country/:year": EditNaturalDisasters,
    "/analytics": GroupAnalytics,
    "/analytics/citys-stats": CitysStatsAnalytics,
    "/analytics/citys-stats/map": CitysStatsMapAnalytics,
    "/analytics/city-stats": CitysStatsAnalytics,
    "/analytics/city-stats/map": CitysStatsMapAnalytics,
    "/analytics/wine-stats": WineStatsAnalytics,
    "/integrations/citys-stats": CitysStatsIntegrations,
    "/integrations/city-stats": CitysStatsIntegrations,
    "/analytics/wine-stats/map": WineStatsMapAnalytics,
    "/analytics/natural-disasters": NaturalDisastersAnalytics,
    "/analytics/natural-disasters/map": NaturalDisastersMapAnalytics
  };

  let currentPath = window.location.pathname;
  let currentRoute = { component: Home, params: {} };

  function toRegex(path) {
    const parts = path.split("/").filter(Boolean);
    const params = [];
    const pattern = parts
      .map((part) => {
        if (part.startsWith(":")) {
          params.push(part.slice(1));
          return "([^/]+)";
        }
        return part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      })
      .join("/");
    return {
      regex: new RegExp(`^/${pattern}$`),
      params
    };
  }

  const compiledRoutes = Object.entries(routes).map(([path, component]) => ({
    path,
    component,
    ...toRegex(path)
  }));

  function resolveRoute(pathname) {
    const cleanPath = pathname.endsWith("/") && pathname !== "/" ? pathname.slice(0, -1) : pathname;
    for (const route of compiledRoutes) {
      const match = cleanPath.match(route.regex);
      if (match) {
        const params = {};
        route.params.forEach((param, index) => {
          params[param] = decodeURIComponent(match[index + 1] || "");
        });
        return { component: route.component, params };
      }
    }
    return { component: Home, params: {} };
  }

  function onLocationChange() {
    currentPath = window.location.pathname;
    currentRoute = resolveRoute(currentPath);
  }

  onMount(() => {
    onLocationChange();
    window.addEventListener("popstate", onLocationChange);
    return () => window.removeEventListener("popstate", onLocationChange);
  });
</script>

<!-- Mostramos la barra de navegacion en todas las pantallas. -->
<Navbar />

<svelte:component this={currentRoute.component} params={currentRoute.params} />
