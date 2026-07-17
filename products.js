// Base de datos de productos — Casa Anglard 2026/27
// Los precios son números enteros expresados en pesos mexicanos.

const AROMA_VARIANTS = [
  {
    id: "10ml",
    name: "Gotero de 10 ml",
    price: 250
  },
  {
    id: "20ml",
    name: "Gotero de 20 ml",
    price: 320
  },
  {
    id: "spray",
    name: "Spray ambiental",
    price: 380
  }
];

const PRODUCTS = [
  {
    id: "poster",
    sku: "CA-IMP-001",
    name: "Póster de Exhibición",
    category: "papeleria",
    categoryLabel: "Papelería",
    medidas: "28 × 43 cm",
    material: "Papel couché de 225 g",
    description: "Póster editorial impreso en alta definición.",
    price: 68,
    img: "images/poster.jpg"
  },
  {
    id: "postal",
    sku: "CA-IMP-002",
    name: "Postal Editorial",
    category: "papeleria",
    categoryLabel: "Papelería",
    medidas: "15 × 10 cm",
    material: "Impresión mate",
    description: "Postal editorial para obsequio, colección o exhibición.",
    price: 41,
    img: "images/postal.jpg"
  },
  {
    id: "termo",
    sku: "CA-ACC-001",
    name: "Termo de Acero Inoxidable",
    category: "accesorios",
    categoryLabel: "Accesorios",
    medidas: "8 × 22 cm",
    material: "Acero inoxidable con impresión UV",
    description: "Termo reutilizable con diseño de Casa Anglard.",
    price: 567,
    img: "images/termo.jpg"
  },
  {
    id: "libreta",
    sku: "CA-PAP-001",
    name: "Libreta de Cubierta Rígida",
    category: "papeleria",
    categoryLabel: "Papelería",
    medidas: "14.5 × 21 cm",
    material: "Cubierta rígida de acabado suave",
    description: "Libreta editorial para escritura, notas y proyectos.",
    price: 189,
    img: "images/libreta.jpg"
  },
  {
    id: "imanes",
    sku: "CA-ACC-002",
    name: "Imanes de Acrílico",
    category: "accesorios",
    categoryLabel: "Accesorios",
    medidas: "7 × 7 cm / 5 × 7 cm",
    material: "Acrílico pulido",
    description: "Imanes decorativos en formatos seleccionados.",
    price: 61,
    img: "images/imanes.jpg"
  },
  {
    id: "lapices",
    sku: "CA-PAP-002",
    name: "Lápices Especiales",
    category: "papeleria",
    categoryLabel: "Papelería",
    medidas: "Tamaño estándar",
    material: "Madera y grafito",
    description: "Lápices disponibles en distintas presentaciones.",
    variants: [
      {
        id: "sin-goma",
        name: "Negro sin goma",
        price: 16
      },
      {
        id: "con-goma",
        name: "Negro con goma",
        price: 20
      },
      {
        id: "arcoiris",
        name: "Arcoíris",
        price: 20
      }
    ],
    img: "images/lapices.jpg"
  },
  {
    id: "pin",
    sku: "CA-ACC-003",
    name: "Pin Metálico Esmaltado",
    category: "accesorios",
    categoryLabel: "Accesorios",
    medidas: "Según diseño",
    material: "Metal esmaltado",
    description: "Producto elaborado bajo cotización y volumen.",
    price: null,
    img: "images/pin.jpg"
  },
  {
    id: "bolsa-chica",
    sku: "CA-BOL-001",
    name: "Bolsa Premium Chica",
    category: "bolsas",
    categoryLabel: "Bolsas",
    medidas: "35 × 35 cm",
    material: "Lona satinada",
    description: "Bolsa reutilizable de formato compacto.",
    price: 284,
    img: "images/bolsa-chica.jpg"
  },
  {
    id: "bolsa-mediana",
    sku: "CA-BOL-002",
    name: "Bolsa Premium Mediana",
    category: "bolsas",
    categoryLabel: "Bolsas",
    medidas: "52 × 35 cm",
    material: "Lona satinada",
    description: "Bolsa reutilizable de formato mediano.",
    price: 338,
    img: "images/bolsa-mediana.jpg"
  },
  {
    id: "bolsa-grande",
    sku: "CA-BOL-003",
    name: "Bolsa Premium Grande",
    category: "bolsas",
    categoryLabel: "Bolsas",
    medidas: "35 × 45 cm",
    material: "Lona satinada",
    description: "Bolsa reutilizable de gran capacidad.",
    price: 311,
    img: "images/bolsa-grande.jpg"
  },
  {
    id: "bolsa-manta",
    sku: "CA-BOL-004",
    name: "Bolsa de Manta",
    category: "bolsas",
    categoryLabel: "Bolsas",
    medidas: "40 × 40 cm",
    material: "Manta de algodón",
    description: "Bolsa ligera y reutilizable de manta natural.",
    price: 115,
    img: "images/bolsa-manta.jpg"
  },
  {
    id: "cosmetiquera",
    sku: "CA-ACC-004",
    name: "Cosmetiquera de Mezclilla",
    category: "accesorios",
    categoryLabel: "Accesorios",
    medidas: "27 × 17 cm",
    material: "Mezclilla con forro y cierre",
    description: "Cosmetiquera práctica para objetos personales.",
    price: 115,
    img: "images/cosmetiquera.jpg"
  },
  {
    id: "monedero",
    sku: "CA-ACC-005",
    name: "Monedero de Mezclilla",
    category: "accesorios",
    categoryLabel: "Accesorios",
    medidas: "13.5 × 11 cm",
    material: "Mezclilla con cierre",
    description: "Monedero compacto de mezclilla.",
    price: 54,
    img: "images/monedero.jpg"
  },
  {
    id: "playera",
    sku: "CA-TEX-001",
    name: "Playera Estampada",
    category: "textil",
    categoryLabel: "Textil",
    medidas: "Tallas CH / M / G / XG",
    material: "Algodón con impresión DTG",
    description: "Playera estampada disponible en diferentes tallas.",
    variants: [
      {
        id: "ch-m-g",
        name: "Tallas CH, M o G",
        price: 270
      },
      {
        id: "xg",
        name: "Talla XG",
        price: 311
      }
    ],
    img: "images/playera.jpg"
  },
  {
    id: "sudadera",
    sku: "CA-TEX-002",
    name: "Sudadera con Capucha",
    category: "textil",
    categoryLabel: "Textil",
    medidas: "Tallas CH / M / G / XG",
    material: "Felpa con impresión DTG",
    description: "Sudadera con capucha disponible en diferentes tallas.",
    variants: [
      {
        id: "ch-m-g",
        name: "Tallas CH, M o G",
        price: 574
      },
      {
        id: "xg",
        name: "Talla XG",
        price: 621
      }
    ],
    img: "images/sudadera.jpg"
  },

  ...[
    {
      id: "patchouli",
      aromaName: "Patchouli",
      imageFile: "patchouli.png"
    },
    {
      id: "flor-naranjo",
      aromaName: "Flor de Naranjo",
      imageFile: "flor-de-naranjo.png"
    },
    {
      id: "mandarina",
      aromaName: "Mandarina",
      imageFile: "mandarina.png"
    },
    {
      id: "sandalo",
      aromaName: "Sándalo",
      imageFile: "sandalo.png"
    },
    {
      id: "mix-18",
      aromaName: "Mix de 18 Elementos",
      imageFile: "mix-de-18-elementos.png"
    },
    {
      id: "arbol-te",
      aromaName: "Árbol de Té",
      imageFile: "arbol-de-te.png"
    },
    {
      id: "bergamota",
      aromaName: "Bergamota",
      imageFile: "bergamota.png"
    },
    {
      id: "toronja-rosa",
      aromaName: "Toronja Rosa",
      imageFile: "toronja-rosa.png"
    },
    {
      id: "geranio",
      aromaName: "Geranio",
      imageFile: "geranio.png"
    },
    {
      id: "menta",
      aromaName: "Menta",
      imageFile: "menta.png"
    },
    {
      id: "eucalipto",
      aromaName: "Eucalipto",
      imageFile: "eucalipto.png"
    },
    {
      id: "romero",
      aromaName: "Romero",
      imageFile: "romero.png"
    },
    {
      id: "lavanda",
      aromaName: "Lavanda",
      imageFile: "lavanda.png"
    },
    {
      id: "eucalipto-dulce",
      aromaName: "Eucalipto Dulce",
      imageFile: "eucalipto-dulce.png"
    },
    {
      id: "limon",
      aromaName: "Limón",
      imageFile: "limon.png"
    }
  ].map((aroma, index) => ({
    id: aroma.id,
    sku: `CA-ARO-${String(index + 1).padStart(3, "0")}`,
    name: `Aroma de ${aroma.aromaName}`,
    category: "aromas",
    categoryLabel: "Aromas",
    medidas: "10 ml / 20 ml / Spray",
    material: "Preparación aromática",
    description:
      `Producto aromático de ${aroma.aromaName} ` +
      "disponible en tres presentaciones.",
    variants: AROMA_VARIANTS.map(variant => ({
      ...variant
    })),
    img: `images/${aroma.imageFile}`
  }))
];