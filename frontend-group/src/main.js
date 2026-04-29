// Importamos mount para colocar la aplicacion Svelte dentro del HTML.
import { mount } from "svelte";
// Importamos los estilos globales del frontend.
import "./app.css";
// Importamos el componente principal de la aplicacion.
import App from "./App.svelte";

// Montamos App dentro del elemento <div id="app"></div> de index.html.
const app = mount(App, {
  // target indica el nodo real del DOM donde se dibuja Svelte.
  target: document.getElementById("app")
});

// Exportamos la aplicacion por si alguna herramienta necesita acceder a ella.
export default app;
