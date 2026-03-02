const datosVinos = [
    {
        title: "The Guv'nor, Spain",
        price: 9.99,
        capacity: 75,
        grape: "Tempranillo",
        secondary_grape: "",
        closure: "Natural Cork",
        country: "Spain",
        unit: 105,
        characteristic: "Vanilla, Blackberry, Blackcurrant",
        per_bottle_case_each: "per bottle",
        type: "Red",
        abv: 14,
        region: "",
        style: "Rich & Juicy",
        year: "2026",
        appellation: ""
    },
    {
        title: "Marqués de Riscal Rioja Reserva 2018/19",
        price: 17.99,
        capacity: 75,
        grape: "Tempranillo",
        secondary_grape: "Graciano",
        closure: "Natural Cork",
        country: "Spain",
        unit: 109,
        characteristic: "Vanilla, Black Fruit, Red Fruit",
        per_bottle_case_each: "per bottle",
        type: "Red",
        abv: 14.5,
        region: "Rioja And Navarra",
        style: "Savoury & Full Bodied",
        year: "2019",
        appellation: "Rioja"
    },
    {
        title: "The Guv'nor VIP, Spain",
        price: 11.99,
        capacity: 75,
        grape: "Tempranillo",
        secondary_grape: "",
        closure: "Natural Cork",
        country: "Spain",
        unit: 105,
        characteristic: "Cloves, Nutmeg, Ripe Fruit",
        per_bottle_case_each: "per bottle",
        type: "Red",
        abv: 14,
        region: "",
        style: "Smooth & Mellow",
        year: "2026",
        appellation: ""
    },
    {
        title: "The Gathering Storm Red 2022, Spain",
        price: 7.99,
        capacity: 75,
        grape: "Tempranillo",
        secondary_grape: "",
        closure: "Screwcap",
        country: "Spain",
        unit: 9,
        characteristic: "",
        per_bottle_case_each: "per bottle",
        type: "Red",
        abv: 12,
        region: "",
        style: "Soft & Fruity",
        year: "2022",
        appellation: ""
    },
    {
        title: "The Guv'nor Rosé, Spain",
        price: 8.99,
        capacity: 75,
        grape: "Garnacha",
        secondary_grape: "Tempranillo, Bobal",
        closure: "Screwcap",
        country: "Spain",
        unit: 98,
        characteristic: "Nectarine, Raspberry, Strawberry",
        per_bottle_case_each: "per bottle",
        type: "Rosé",
        abv: 13,
        region: "",
        style: "Ripe & Fruity",
        year: "2026",
        appellation: ""
    },
    {
        title: "Marqués de Cáceres Rioja Gran Reserva 2014/15",
        price: 22.99,
        capacity: 75,
        grape: "Tempranillo",
        secondary_grape: "Grenache, Graciano",
        closure: "Natural Cork",
        country: "Spain",
        unit: 109,
        characteristic: "Vanilla, Black Fruit, Red Fruit, Spice",
        per_bottle_case_each: "per bottle",
        type: "Red",
        abv: 14.5,
        region: "Rioja And Navarra",
        style: "Savoury & Full Bodied",
        year: "2015",
        appellation: "Rioja"
    },
    {
        title: "Vilarnau ‘Gaudi’ Organic Cava Brut Reserva, Penedès",
        price: 13.99,
        capacity: 75,
        grape: "Macabeo",
        secondary_grape: "Parellada, Xarel-lo",
        closure: "Natural Cork",
        country: "Spain",
        unit: 86,
        characteristic: "Bread, Green Apple, Pastry, Pear",
        per_bottle_case_each: "per bottle",
        type: "White",
        abv: 11.5,
        region: "Penedès",
        style: "Crisp & Zesty",
        year: "2026",
        appellation: "Penedès"
    },
    {
        title: "The Guv'nor Blanco, Spain",
        price: 8.99,
        capacity: 75,
        grape: "Verdejo",
        secondary_grape: "Sauvignon Blanc, Chardonnay",
        closure: "Screwcap",
        country: "Spain",
        unit: 93,
        characteristic: "Lime, Fennel, Green Apple",
        per_bottle_case_each: "per bottle",
        type: "White",
        abv: 12.5,
        region: "",
        style: "Crisp & Zesty",
        year: "2026",
        appellation: ""
    },
    {
        title: "The Guv'nor Sparkling, Spain",
        price: 9.99,
        capacity: 75,
        grape: "Chardonnay",
        secondary_grape: "Viura",
        closure: "Natural Cork",
        country: "Spain",
        unit: 94,
        characteristic: "Citrus Fruit, Peach, Vanilla",
        per_bottle_case_each: "per bottle",
        type: "White",
        abv: 12.5,
        region: "",
        style: "Crisp & Fruity",
        year: "2026",
        appellation: ""
    },
    {
        title: "Finca Carelio Tempranillo 2018/19, Spain",
        price: 9.99,
        capacity: 75,
        grape: "Tempranillo",
        secondary_grape: "",
        closure: "Natural Cork",
        country: "Spain",
        unit: 109,
        characteristic: "Cedar, Black Cherry, Blackcurrant",
        per_bottle_case_each: "per bottle",
        type: "Red",
        abv: 14.5,
        region: "Castilla Y León",
        style: "Savoury & Full Bodied",
        year: "2019",
        appellation: ""
    }
];

function mediaPrecioPorPais(datosVinos, pais) {
    const paisesFiltrados = datosVinos.filter(obj => obj.country === pais);

    if (paisesFiltrados.length === 0) {
        return null; // o 0, según prefieras
    }

    const precios = paisesFiltrados.map(obj => obj.price);

    const sum = precios.reduce((acum, precio) => acum + precio, 0);

    return sum / precios.length;
}

const mediaSpain = mediaPrecioPorPais(datosVinos,"Spain")

console.log(mediaSpain)

module.exports = {
    datosVinos, mediaPrecioPorPais
};

