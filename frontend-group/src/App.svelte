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

  const routes = {
    "/": Home,
    "/citys-stats": CitysStats,
    "/citys-stats/editar/:city/:country": EditCitysStats,
    "/wine-stats" : WineStats,
    "/wine-stats/editar/:id": EditWineStats,
    "/natural-disasters": NaturalDisasters,
    "/natural-disasters/editar/:country/:year": EditNaturalDisasters
  };
</script>
<Navbar />

<Router {routes} />