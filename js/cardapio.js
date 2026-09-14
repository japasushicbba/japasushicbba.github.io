/* =====================================================================
   JAPA SUSHI CBBA — ARCHIVO DE CONFIGURACIÓN DEL MENÚ
   =====================================================================
   Este es el ÚNICO archivo que necesitás editar para tocar el menú.
   Precios en número (usá punto, no coma): 42 = Bs 42,00.
   ===================================================================== */

/* ---------- DATOS DE LA TIENDA ---------- */
const LOJA = {
  nome: "Japa Sushi CBBA",
  slogan: "El verdadero sabor japonés",
  whatsapp: "59167826717",
  telefoneExibicao: "+591 67826717",
  endereco: {
    linha1: "Indicá la dirección de la tienda",
    linha2: "Punto de referencia",
    cidade: "Cochabamba",
    cep: ""
  },
  coordenadas: { lat: -17.3935, lng: -66.1570 },
  horarios: [
    { dias: "Martes a Jueves", horario: "17:00 a 22:00" },
    { dias: "Viernes a Domingo", horario: "17:00 a 22:00" }
  ]
};

/* ---------- ENVÍO / DELIVERY ---------- */
const FRETE = {
  googleMapsApiKey: "",
  raioMaximoKm: 8,
  fatorRota: 1.3,
  faixas: [
    { ate: 2, valor: 0 },
    { ate: 3.5, valor: 10 },
    { ate: 5, valor: 15 },
    { ate: 6.5, valor: 20 },
    { ate: 8, valor: 25 }
  ],
  msgForaDeArea: "Por ahora entregamos en un radio de hasta 8 km. Para pedidos fuera de esa zona, escribinos por WhatsApp."
};

/* ---------- OPCIONES DEL "ARMÁ TU PROPIO COMBO" ---------- */
const OPCOES = {
  rolls: ["Hossomaki", "Uramaki", "Hot roll"],
  rellenos: ["Kanikama", "Skin", "Salmón", "Mixto", "Pescado blanco", "Camarones"]
};

/* ---------- ADICIONALES (ORDER BUMP) ---------- */
const ADICIONAIS_SUSHI = [
  { nome: "Queso crema extra", preco: 8 },
  { nome: "Cebollín y sésamo", preco: 5 },
  { nome: "Salsa extra (tarê)", preco: 7 },
  { nome: "Wasabi y jengibre extra", preco: 5 },
  { nome: "Palitos extra (par)", preco: 2 }
];

/* Extras del armá tu combo (queso crema y cebollín gratis, palta con costo) */
const ADICIONAIS_ARMAR = [
  { nome: "Agregar queso crema", preco: 0 },
  { nome: "Agregar cebollín", preco: 0 },
  { nome: "Agregar palta", preco: 6 }
];

/* ---------- CATEGORÍAS Y PRODUCTOS ----------
   tipo:
   - "acai-fixo" -> elegís una opción (y sabor único opcional, ej. cupmaki)
   - "armar"     -> cantidad + rolls (1 a N) + rellenos (1 a M) + extras
*/
const CATEGORIAS = [
  {
    id: "reapertura",
    nome: "Reapertura",
    emoji: "🎉",
    descricao: "Estamos de vuelta. Volvé a probar el verdadero sabor japonés.",
    itens: [
      {
        id: "oportunidad-50",
        nome: "Oportunidad de comer sushi · 50 piezas",
        tipo: "acai-fixo",
        img: "assets/img/foto-prod-2.jpg",
        destaque: true,
        realce: true,
        selo: "Solo septiembre",
        descricao: "Por la reapertura: 50 piezas variadas por Bs 120. Solo durante el mes de septiembre. Aprovechá para volver a disfrutar del verdadero sabor japonés.",
        composicao: ["50 piezas variadas", "Hossomaki, uramaki y hot roll"],
        tamanhos: [{ rotulo: "50 piezas", preco: 120 }],
        adicionais: ADICIONAIS_SUSHI
      }
    ]
  },
  {
    id: "combos",
    nome: "Combos",
    emoji: "🍱",
    descricao: "Para uno o para compartir. Elegí tu combo.",
    itens: [
      {
        id: "combo-solitario",
        nome: "Combo Solitário",
        tipo: "acai-fixo",
        img: "assets/img/foto-prod-4.jpg",
        destaque: true,
        selo: "Para 1 persona",
        descricao: "Para vos y nadie más. Ese momento en que pedís tu japa favorito para disfrutar solo, sin apuro y sin compartir con nadie. Selección pensada para una persona.",
        composicao: ["Selección para 1 persona"],
        tamanhos: [{ rotulo: "1 persona", preco: 85 }],
        adicionais: ADICIONAIS_SUSHI
      },
      {
        id: "combo-2-personas",
        nome: "Combos para 2 personas",
        tipo: "acai-fixo",
        img: "assets/img/foto-prod-1.jpg",
        destaque: true,
        selo: "Para compartir",
        descricao: "Selección generosa para compartir de a dos. Perfecto para una cena en pareja o con quien quieras.",
        composicao: ["Selección para 2 personas"],
        tamanhos: [{ rotulo: "2 personas", preco: 139 }],
        adicionais: ADICIONAIS_SUSHI
      }
    ]
  },
  {
    id: "prepara-combo",
    nome: "Prepará tu propio combo",
    emoji: "🎯",
    descricao: "Armalo a tu gusto: elegí la cantidad, los rolls y los rellenos. Todo con queso crema, cebollín y relleno a elección.",
    itens: [
      {
        id: "armar-combo",
        nome: "Prepará tu propio combo",
        tipo: "armar",
        img: "assets/img/foto-prod-5.jpg",
        destaque: true,
        maisVendido: true,
        descricao: "Elegí la cantidad (de 10 en 10), tus rolls y tus rellenos. Sumá extras si querés.",
        tamanhos: [
          { rotulo: "10 piezas", preco: 42 },
          { rotulo: "20 piezas", preco: 79 },
          { rotulo: "30 piezas", preco: 99 },
          { rotulo: "40 piezas", preco: 138 },
          { rotulo: "50 piezas", preco: 179 }
        ],
        opcoesRolls: OPCOES.rolls,
        limiteRolls: 3,
        opcoesSabores: OPCOES.rellenos,
        limiteSabores: 6,
        saboresExtra: { "Camarones": 15 },
        adicionais: ADICIONAIS_ARMAR
      }
    ]
  },
  {
    id: "temakis",
    nome: "Temakis",
    emoji: "🌯",
    descricao: "Cono de alga nori con arroz, queso crema, cebollín y relleno. Elegí el sabor.",
    itens: [
      {
        id: "temaki",
        nome: "Temaki",
        tipo: "acai-fixo",
        emojiFallback: "🌯",
        maisVendido: true,
        descricao: "Cono de alga nori con arroz, queso crema, cebollín y el relleno que elijas, enrollado a mano al momento.",
        tamanhos: [
          { rotulo: "Mixto", preco: 49 },
          { rotulo: "Skin", preco: 49 },
          { rotulo: "Kanikama", preco: 55 },
          { rotulo: "Salmón", preco: 59 },
          { rotulo: "Camarón", preco: 65 }
        ]
      }
    ]
  },
  {
    id: "handrolls",
    nome: "Handrolls",
    emoji: "🍙",
    descricao: "Roll compacto con arroz, queso crema, cebollín y relleno. Elegí el sabor.",
    itens: [
      {
        id: "handroll",
        nome: "Handroll",
        tipo: "acai-fixo",
        img: "assets/img/foto-prod-8.jpg",
        descricao: "Roll compacto de alga nori con arroz, queso crema, cebollín y tu relleno, servido al momento.",
        tamanhos: [
          { rotulo: "Mixto", preco: 39 },
          { rotulo: "Skin", preco: 39 },
          { rotulo: "Kanikama", preco: 45 },
          { rotulo: "Salmón", preco: 49 },
          { rotulo: "Camarón", preco: 59 }
        ]
      }
    ]
  },
  {
    id: "cupmaki",
    nome: "Cupmaki",
    emoji: "🥤",
    descricao: "Sushi en vaso para llevar. Elegí el tamaño y el sabor.",
    itens: [
      {
        id: "cupmaki",
        nome: "Cupmaki",
        tipo: "acai-fixo",
        emojiFallback: "🥤",
        destaque: true,
        descricao: "Sushi en vaso, práctico para llevar: arroz, queso crema, cebollín y relleno en capas.",
        tamanhos: [
          { rotulo: "Vaso 250ml", preco: 45 },
          { rotulo: "Vaso 400ml", preco: 69 }
        ],
        saborUnico: ["Mixto", "Skin", "Salmón", "Camarón", "Kanikama"]
      }
    ]
  },
  {
    id: "piezas-especiales",
    nome: "Piezas Especiales",
    emoji: "✨",
    descricao: "Las piezas premium de la casa. Elegí 3 o 6 unidades.",
    itens: [
      {
        id: "nigiry",
        nome: "Nigiry",
        tipo: "acai-fixo",
        emojiFallback: "🍣",
        descricao: "Bocado de arroz coronado con una lámina de salmón fresco. El clásico japonés.",
        tamanhos: [
          { rotulo: "3 unidades", preco: 29 },
          { rotulo: "6 unidades", preco: 49 }
        ]
      },
      {
        id: "joy",
        nome: "Joy",
        tipo: "acai-fixo",
        emojiFallback: "✨",
        destaque: true,
        descricao: "Pieza especial empanada en panko y flambeada: crocante por fuera, cremosa por dentro.",
        tamanhos: [
          { rotulo: "3 unidades", preco: 29 },
          { rotulo: "6 unidades", preco: 49 }
        ]
      },
      {
        id: "drago",
        nome: "Drago",
        tipo: "acai-fixo",
        emojiFallback: "🐉",
        descricao: "Roll premium estilo dragón, la presentación especial de la casa.",
        tamanhos: [
          { rotulo: "3 unidades", preco: 29 },
          { rotulo: "6 unidades", preco: 49 }
        ]
      }
    ]
  }
];
