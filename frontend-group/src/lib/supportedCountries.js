// Paises que el formulario de citys-stats muestra como opciones validas.
// Esta lista ayuda al usuario, pero la seguridad real esta en el backend.
// Debe mantenerse sincronizada con SUPPORTED_COUNTRIES de citys-stats v1/v2.
export const supportedCountries = [
  "afghanistan", "albania", "algeria", "andorra", "angola", "argentina",
  "armenia", "australia", "austria", "azerbaijan", "bangladesh",
  "belgium", "bolivia", "brazil", "bulgaria", "cambodia", "cameroon",
  "canada", "chile", "china", "colombia", "costa-rica", "croatia",
  "cuba", "czech-republic", "denmark", "dominican-republic", "ecuador",
  "egypt", "el-salvador", "estonia", "ethiopia", "finland", "france",
  "germany", "ghana", "greece", "guatemala", "hungary", "india",
  "indonesia", "ireland", "israel", "italy", "japan", "kenya",
  "malaysia", "mexico", "morocco", "netherlands", "new-zealand",
  "nigeria", "norway", "pakistan", "panama", "paraguay", "peru",
  "philippines", "poland", "portugal", "romania", "russia",
  "saudi-arabia", "singapore", "south-africa", "south-korea", "spain",
  "sweden", "switzerland", "taiwan", "thailand", "turkey", "ukraine",
  "united-arab-emirates", "united-kingdom", "united-states", "uruguay",
  "venezuela", "vietnam"
];

// Alias que el frontend acepta antes de enviar datos al backend.
// La clave es lo que puede escribir el usuario despues de normalizarlo.
// El valor es el pais canonico que se manda a la API.
const countryAliases = {
  "alemania": "germany",
  "corea-del-sur": "south-korea",
  "eeuu": "united-states",
  "england": "united-kingdom",
  "espana": "spain",
  "estados-unidos": "united-states",
  "francia": "france",
  "great-britain": "united-kingdom",
  "holanda": "netherlands",
  "italia": "italy",
  "paises-bajos": "netherlands",
  "reino-unido": "united-kingdom",
  "republic-of-korea": "south-korea",
  "scotland": "united-kingdom",
  "u-k": "united-kingdom",
  "u-s-a": "united-states",
  "uae": "united-arab-emirates",
  "uk": "united-kingdom",
  "united-states-of-america": "united-states",
  "us": "united-states",
  "usa": "united-states",
  "wales": "united-kingdom"
};

export function normalizeSupportedCountry(country) {
  // String(...) evita errores si el campo llega vacio, null o como otro tipo.
  const normalized = String(country ?? "")
    // Quita espacios sobrantes.
    .trim()
    // Descompone letras con tilde para poder eliminar la tilde.
    .normalize("NFD")
    // Elimina las marcas Unicode de acentos.
    .replace(/[\u0300-\u036f]/g, "")
    // Compara siempre en minusculas.
    .toLowerCase()
    // Borra apostrofes y puntos: U.S.A. pasa a USA antes de los guiones.
    .replace(/['.]/g, "")
    // Convierte & a texto para no perder significado.
    .replace(/&/g, "and")
    // Sustituye espacios, barras bajas y otros separadores por guiones.
    .replace(/[^a-z]+/g, "-")
    // Limpia guiones sobrantes al principio y al final.
    .replace(/^-+|-+$/g, "");

  // Si coincide con un alias, devolvemos el nombre oficial de la API.
  // Si no coincide, devolvemos el valor normalizado.
  return countryAliases[normalized] || normalized;
}

export function isSupportedCountry(country) {
  // Reutiliza la normalizacion para que "España", "espana" y "spain"
  // se validen contra la misma lista canonica.
  return supportedCountries.includes(normalizeSupportedCountry(country));
}
