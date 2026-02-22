// index-LCC.js
// Ejecuta: node index-LCC.js

// 1) Array inicializado con datos de ejemplo (>=10 filas)
const data = [
  { City: "Delhi",     Country: "India", UN_2025_population: 30222405 },
  { City: "Shanghai",  Country: "China", UN_2025_population: 29558908 },
  { City: "Guangzhou", Country: "China", UN_2025_population: 27563372 },
  { City: "Kolkata",   Country: "India", UN_2025_population: 22549738 },
  { City: "Mumbai",    Country: "India", UN_2025_population: 20203056 },
  { City: "Beijing",   Country: "China", UN_2025_population: 17013303 },
  { City: "Shenzhen",  Country: "China", UN_2025_population: 13878396 },
  { City: "Bengaluru", Country: "India", UN_2025_population: 13187098 },
  { City: "Chennai",   Country: "India", UN_2025_population: 11153205 },
  { City: "Hyderabad", Country: "India", UN_2025_population:  9190795 },
  { City: "Suzhou",    Country: "China", UN_2025_population:  7731101 },
  { City: "Ahmedabad", Country: "India", UN_2025_population:  7632408 }
];

// 2) Valor geográfico repetido (Country se repite: China aparece varias veces)
const targetCountry = "China";

// 3) Subconjunto de filas que comparten ese valor geográfico
const subset = data.filter(row => row.Country === targetCountry);

// 4) Media de un campo numérico usando iteradores
if (subset.length === 0) {
  console.log(`No hay filas para Country="${targetCountry}"`);
} else {
  const avg =
    subset
      .map(row => row.UN_2025_population)
      .reduce((acc, v) => acc + v, 0) / subset.length;

  console.log(`Filas usadas: ${subset.length}`);
  console.log(`Media de UN_2025_population para Country="${targetCountry}": ${avg}`);
}