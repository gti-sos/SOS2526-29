// Paises que la API de citys-stats acepta para evitar registros inventados.
// Deben coincidir con la lista del backend, porque el backend es la validacion real.
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
  const normalized = String(country ?? "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['.]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return countryAliases[normalized] || normalized;
}

export function isSupportedCountry(country) {
  return supportedCountries.includes(normalizeSupportedCountry(country));
}
