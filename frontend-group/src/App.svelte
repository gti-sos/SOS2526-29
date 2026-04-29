<script>
  // Router permite cambiar de pantalla dentro de una SPA sin recargar toda la pagina.
  import Router from "svelte-spa-router";
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


  // routes relaciona cada hash de la URL con el componente que se debe mostrar.
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

  // directRoutes permite abrir algunas pantallas sin usar # en la URL.
  const directRoutes = {
    "/analytics": GroupAnalytics,
    "/analytics/citys-stats": CitysStatsAnalytics,
    "/analytics/citys-stats/map": CitysStatsMapAnalytics,
    "/analytics/city-stats": CitysStatsAnalytics,
    "/analytics/city-stats/map": CitysStatsMapAnalytics,
    "/integrations/citys-stats": CitysStatsIntegrations,
    "/integrations/city-stats": CitysStatsIntegrations,
    "/analytics/wine-stats": WineStatsAnalytics,
    "/analytics/wine-stats/map": WineStatsMapAnalytics,
    "/analytics/natural-disasters": NaturalDisastersAnalytics,
    "/analytics/natural-disasters/map": NaturalDisastersMapAnalytics
  };

  // Si la URL ya usa #/, dejamos que svelte-spa-router la gestione.
  const directPath = window.location.hash.startsWith("#/") ? "" : window.location.pathname;
  // Buscamos si la ruta directa existe en el mapa anterior.
  const DirectRoute = directRoutes[directPath] || null;
</script>

<!-- Mostramos la barra de navegacion en todas las pantallas. -->
<Navbar />

<!-- Si hay ruta directa, mostramos su componente; si no, usamos el router normal. -->
{#if DirectRoute}
  <svelte:component this={DirectRoute} />
{:else}
  <Router {routes} />
{/if}
