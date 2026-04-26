<script>
  import Router from "svelte-spa-router";
  import Home from "./routes/Home.svelte";
  import CitysStats from "./routes/CitysStats.svelte";
  import EditCitysStats from "./routes/EditCitysStats.svelte";
  import WineStats from "./routes/WineStats.svelte";
  import EditWineStats from "./routes/EditWineStats.svelte";
  import Navbar from "./components/Navbar.svelte";
  import NaturalDisasters from "./routes/NaturalDisastersStats.svelte";
  import EditNaturalDisasters from "./routes/EditNaturalDisasters.svelte";
  import GroupAnalytics from "./routes/GroupAnalytics.svelte";
  import CitysStatsAnalytics from "./routes/CitysStatsAnalytics.svelte";
  import CitysStatsMapAnalytics from "./routes/CitysStatsMapAnalytics.svelte";
<<<<<<< HEAD
  import WineStatsAnalytics from "./routes/WineStatsAnalytics.svelte";


=======
  import CitysStatsIntegrations from "./routes/CitysStatsIntegrations.svelte";
>>>>>>> 375655691e1e6ec9cbe9072fa82924e6c6bd5a95

  const routes = {
    "/": Home,
    "/citys-stats": CitysStats,
    "/citys-stats/editar/:city/:country": EditCitysStats,
    "/wine-stats" : WineStats,
    "/wine-stats/editar/:id": EditWineStats,
    "/natural-disasters": NaturalDisasters,
    "/natural-disasters/editar/:country/:year": EditNaturalDisasters,
    "/analytics": GroupAnalytics,
    "/analytics/citys-stats": CitysStatsAnalytics,
    "/analytics/citys-stats/map": CitysStatsMapAnalytics,
    "/analytics/city-stats": CitysStatsAnalytics,
    "/analytics/city-stats/map": CitysStatsMapAnalytics,
<<<<<<< HEAD
    "/analytics/wine-stats": WineStatsAnalytics
    
=======
    "/integrations/citys-stats": CitysStatsIntegrations,
    "/integrations/city-stats": CitysStatsIntegrations
>>>>>>> 375655691e1e6ec9cbe9072fa82924e6c6bd5a95
  };

  const directRoutes = {
    "/analytics": GroupAnalytics,
    "/analytics/citys-stats": CitysStatsAnalytics,
    "/analytics/citys-stats/map": CitysStatsMapAnalytics,
    "/analytics/city-stats": CitysStatsAnalytics,
    "/analytics/city-stats/map": CitysStatsMapAnalytics,
    "/integrations/citys-stats": CitysStatsIntegrations,
    "/integrations/city-stats": CitysStatsIntegrations,
    "/analytics/wine-stats": WineStatsAnalytics 
  };

  const directPath = window.location.hash.startsWith("#/") ? "" : window.location.pathname;
  const DirectRoute = directRoutes[directPath] || null;
</script>
<Navbar />

{#if DirectRoute}
  <svelte:component this={DirectRoute} />
{:else}
  <Router {routes} />
{/if}
