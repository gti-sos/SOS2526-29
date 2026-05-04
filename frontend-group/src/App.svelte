<script>
  import { onMount } from "svelte";
  import Navbar from "./components/Navbar.svelte";

  // Cada carpeta con +page.svelte se convierte automaticamente en una ruta.
  const routeModules = import.meta.glob("./routes/**/+page.svelte", {
    eager: true
  });

  function filePathToRoutePath(filePath) {
    const routePath = filePath
      .replace(/\\/g, "/")
      .replace(/^\.\/routes/, "")
      .replace(/\/\+page\.svelte$/, "");

    return routePath || "/";
  }

  function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

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

  const compiledRoutes = Object.entries(routeModules)
    .map(([filePath, module]) =>
      compileRoute(filePathToRoutePath(filePath), module.default)
    )
    .sort((a, b) => b.score - a.score || b.path.length - a.path.length);

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

  function onLocationChange() {
    currentRoute = resolveRoute(window.location.pathname);
  }

  onMount(() => {
    window.addEventListener("popstate", onLocationChange);
    return () => window.removeEventListener("popstate", onLocationChange);
  });
</script>

<Navbar />

<svelte:component this={currentRoute.component} params={currentRoute.params} />
