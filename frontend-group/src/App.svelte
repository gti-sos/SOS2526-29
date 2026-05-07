<script>
  import { onMount } from "svelte";
  import Navbar from "./components/Navbar.svelte";

  // Router ligero de la SPA: descubre las paginas, compara la URL actual y
  // renderiza el componente Svelte que corresponda sin recargar el navegador.

  // Cada carpeta con +page.svelte se convierte automaticamente en una ruta.
  const routeModules = import.meta.glob("./routes/**/+page.svelte", {
    eager: true
  });

  // Convierte una ruta de fichero en una ruta web.
  // Ejemplo: ./routes/citys-stats/+page.svelte -> /citys-stats.
  function filePathToRoutePath(filePath) {
    const routePath = filePath
      .replace(/\\/g, "/")
      .replace(/^\.\/routes/, "")
      .replace(/\/\+page\.svelte$/, "");

    return routePath || "/";
  }

  // Escapa caracteres especiales para que una ruta fija pueda usarse dentro
  // de una expresion regular sin cambiar su significado.
  function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  // Compila una ruta SvelteKit-like en un regex propio.
  // Los segmentos [city] y [country] se guardan como parametros dinamicos.
  function compileRoute(path, component) {
    const params = [];
    const parts = path.split("/").filter(Boolean);
    const pattern = parts
      .map((part) => {
        const dynamicSegment = part.match(/^\[(.+)\]$/);

        if (dynamicSegment) {
          params.push(dynamicSegment[1]);
          return "([^/]+)";
        }

        return escapeRegex(part);
      })
      .join("/");

    return {
      path,
      component,
      params,
      regex: new RegExp(`^/${pattern}$`),
      score: parts.reduce(
        (total, part) => total + (part.startsWith("[") ? 1 : 4),
        0
      )
    };
  }

  // Rutas listas para comparar. Las mas especificas van primero para que
  // /citys-stats/editar/[city]/[country] gane a rutas mas generales.
  const compiledRoutes = Object.entries(routeModules)
    .map(([filePath, module]) =>
      compileRoute(filePathToRoutePath(filePath), module.default)
    )
    .sort((a, b) => b.score - a.score || b.path.length - a.path.length);

  // Busca que componente debe mostrarse para la URL actual y extrae parametros
  // dinamicos decodificados para pasarselos a la pagina.
  function resolveRoute(pathname) {
    const cleanPath =
      pathname.endsWith("/") && pathname !== "/" ? pathname.slice(0, -1) : pathname;

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

    const fallbackRoute = compiledRoutes.find((route) => route.path === "/");
    return { component: fallbackRoute.component, params: {} };
  }

  let currentRoute = resolveRoute(window.location.pathname);

  // Se ejecuta cuando el usuario navega con atras/adelante del navegador.
  function onLocationChange() {
    currentRoute = resolveRoute(window.location.pathname);
  }

  // Registramos el listener del navegador y lo limpiamos al desmontar la app.
  onMount(() => {
    window.addEventListener("popstate", onLocationChange);
    return () => window.removeEventListener("popstate", onLocationChange);
  });
</script>

<Navbar />

<svelte:component this={currentRoute.component} params={currentRoute.params} />
