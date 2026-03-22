<script>
  import Router from "svelte-spa-router";
  import Home from "./routes/Home.svelte";
  import CitysStats from "./routes/CitysStats.svelte";
  import EditCitysStats from "./routes/EditCitysStats.svelte";

  const routes = {
    "/": Home,
    "/citys-stats": CitysStats,
    "/citys-stats/editar/:city/:country": EditCitysStats
  };
</script>

<Router {routes} />