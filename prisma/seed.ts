import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

type DishSeed = {
  name: string;
  description: string;
  price: number; // en pesos; se guarda en centavos
  tags?: string[];
  schedule?: [string, string]; // [desde, hasta] en formato 24 h
};

type CategorySeed = {
  name: string;
  description: string;
  icon: string;
  dishes: DishSeed[];
};

const ALMUERZO: [string, string] = ["11:00", "15:00"];

const MENU: CategorySeed[] = [
  // ───────────── ENTRADAS (15) ─────────────
  {
    name: "Entradas",
    description: "Para abrir el apetito",
    icon: "salad",
    dishes: [
      { name: "Tostones con queso frito", description: "Plátano verde crujiente con queso frito y salsa de la casa.", price: 350, tags: ["Popular"], schedule: ALMUERZO },
      { name: "Yaniqueques crujientes", description: "Clásicos yaniqueques de harina, dorados al momento.", price: 180 },
      { name: "Quipes de carne", description: "Croquetas de trigo rellenas de carne sazonada.", price: 160 },
      { name: "Croquetas de pollo", description: "Croquetas cremosas de pollo con rebozado dorado y salsa tártara.", price: 280 },
      { name: "Chicharrón de pollo", description: "Trozos de pollo marinados y fritos, con limón y salsa de ajo.", price: 420, tags: ["Popular"] },
      { name: "Chicharrón de cerdo", description: "Cerdo frito y crujiente, acompañado de limón y yuca.", price: 450 },
      { name: "Pastelitos de carne", description: "Masa hojaldrada rellena de carne guisada. Porción de 4 unidades.", price: 240 },
      { name: "Empanadas de queso", description: "Empanadas fritas rellenas de queso derretido. Porción de 3 unidades.", price: 220, tags: ["Vegetariano"] },
      { name: "Bolitas de yuca rellenas", description: "Masa de yuca rellena de queso, fritas y servidas con salsa rosada.", price: 300, tags: ["Vegetariano"] },
      { name: "Alitas picantes", description: "Alitas de pollo bañadas en salsa picante casera.", price: 450, tags: ["Picante"] },
      { name: "Calamares fritos", description: "Anillos de calamar tiernos y crujientes con salsa tártara.", price: 520, tags: ["Especial"] },
      { name: "Camarones al ajillo", description: "Camarones salteados en mantequilla, ajo y un toque de vino blanco.", price: 580, tags: ["Recomendado"] },
      { name: "Yuca frita con salsa rosada", description: "Bastones de yuca fritos, dorados por fuera y suaves por dentro.", price: 260, tags: ["Vegetariano"] },
      { name: "Sopa de pollo", description: "Caldo casero de pollo con verduras y fideos.", price: 320, schedule: ALMUERZO },
      { name: "Ensalada de la casa", description: "Lechuga, tomate, zanahoria y aguacate con aderezo de la casa.", price: 300, tags: ["Vegetariano"] },
    ],
  },

  // ───────────── PLATOS FUERTES (10) ─────────────
  {
    name: "Platos fuertes",
    description: "Cocina criolla y de la parrilla",
    icon: "beef",
    dishes: [
      { name: "La bandera dominicana", description: "Arroz blanco, habichuelas rojas y pollo guisado, con ensalada verde.", price: 450, tags: ["Popular"], schedule: ALMUERZO },
      { name: "Pollo guisado", description: "Pollo cocido a fuego lento en salsa criolla con vegetales.", price: 480, schedule: ALMUERZO },
      { name: "Pernil al horno", description: "Cerdo marinado y horneado lentamente hasta quedar jugoso y tierno.", price: 620, tags: ["Recomendado"] },
      { name: "Rabo encendido", description: "Rabo de res guisado en una salsa intensa con un toque picante.", price: 780, tags: ["Picante", "Especial"] },
      { name: "Chivo guisado", description: "Chivo tierno guisado con especias y hierbas locales.", price: 720 },
      { name: "Pescado frito entero", description: "Pescado fresco del día frito, con limón y salsa criolla.", price: 690 },
      { name: "Filete de res a la plancha", description: "Corte de res a la plancha con salsa de champiñones.", price: 850 },
      { name: "Chuleta frita", description: "Chuleta de cerdo frita y crujiente, con cebolla encurtida.", price: 520 },
      { name: "Camarones al coco", description: "Camarones en una salsa cremosa de coco y especias suaves.", price: 890, tags: ["Especial"] },
      { name: "Costillas BBQ", description: "Costillas de cerdo glaseadas con salsa BBQ ahumada.", price: 780, tags: ["Nuevo"] },
    ],
  },

  // ───────────── BEBIDAS (13) ─────────────
  {
    name: "Bebidas",
    description: "Naturales, batidos, cafés y cócteles",
    icon: "cup-soda",
    dishes: [
      { name: "Jugo de chinola", description: "Jugo natural de maracuyá, bien frío.", price: 150 },
      { name: "Jugo de naranja natural", description: "Naranja recién exprimida.", price: 160 },
      { name: "Morir soñando", description: "Naranja y leche con hielo, la bebida más dominicana.", price: 180, tags: ["Popular"] },
      { name: "Limonada", description: "Limón natural con hielo y un toque de azúcar.", price: 120, tags: ["Vegano"] },
      { name: "Batida de fresa", description: "Fresa fresca licuada con leche y hielo.", price: 200 },
      { name: "Batida de mamey", description: "Mamey maduro con leche, cremoso y espeso.", price: 210, tags: ["Recomendado"] },
      { name: "Agua", description: "Botella de agua de 500 ml.", price: 60 },
      { name: "Refresco", description: "Variedad de refrescos en botella.", price: 90 },
      { name: "Café", description: "Café colado servido caliente.", price: 80 },
      { name: "Té caliente", description: "Té negro, verde o de manzanilla.", price: 80 },
      { name: "Cerveza Presidente", description: "Cerveza nacional bien fría.", price: 180 },
      { name: "Piña colada", description: "Piña, coco y ron, servida en copa.", price: 350, tags: ["Especial"] },
      { name: "Mojito", description: "Ron, hierbabuena, limón y soda.", price: 340 },
    ],
  },

  // ───────────── POSTRES (10) ─────────────
  {
    name: "Postres",
    description: "El final dulce",
    icon: "cake",
    dishes: [
      { name: "Flan de coco", description: "Flan casero con caramelo y coco rallado.", price: 220, tags: ["Popular"] },
      { name: "Tres leches", description: "Bizcocho esponjoso bañado en tres leches con crema chantilly.", price: 260, tags: ["Recomendado"] },
      { name: "Majarete", description: "Crema de maíz con canela y leche de coco.", price: 180 },
      { name: "Arroz con leche", description: "Arroz cremoso con canela, pasas y leche condensada.", price: 180 },
      { name: "Tembleque", description: "Postre de coco suave y tembloroso, con canela.", price: 200 },
      { name: "Brazo gitano", description: "Bizcocho enrollado relleno de crema.", price: 240 },
      { name: "Cheesecake de guayaba", description: "Tarta de queso crema con mermelada de guayaba.", price: 290, tags: ["Nuevo"] },
      { name: "Bizcocho dominicano", description: "Bizcocho tradicional con merengue y relleno de piña.", price: 230 },
      { name: "Helado de coco", description: "Dos bolas de helado artesanal de coco.", price: 200 },
      { name: "Dulce de leche cortada", description: "Dulce tradicional de leche con canela y un toque de vainilla.", price: 190 },
    ],
  },

  // ───────────── ACOMPAÑANTES (16) ─────────────
  {
    name: "Acompañantes",
    description: "Para completar tu plato",
    icon: "carrot",
    dishes: [
      { name: "Arroz blanco", description: "Porción de arroz blanco desgranado.", price: 100, tags: ["Vegano"] },
      { name: "Moro de guandules", description: "Arroz con guandules, sofrito y especias.", price: 160, tags: ["Popular"] },
      { name: "Moro de habichuelas negras", description: "Arroz mezclado con habichuelas negras y sazón criolla.", price: 160 },
      { name: "Habichuelas rojas guisadas", description: "Habichuelas rojas cocidas lentamente con auyama.", price: 120 },
      { name: "Maduros fritos", description: "Plátano maduro frito hasta caramelizar.", price: 140, tags: ["Vegano"] },
      { name: "Yuca hervida", description: "Yuca suave con cebollitas salteadas en aceite.", price: 150, tags: ["Vegetariano"] },
      { name: "Papas fritas", description: "Papas cortadas en bastones, fritas y saladas.", price: 150, tags: ["Vegano"] },
      { name: "Puré de papa", description: "Puré cremoso con mantequilla.", price: 150, tags: ["Vegetariano"] },
      { name: "Ensalada de repollo", description: "Repollo y zanahoria con aderezo cremoso.", price: 120, tags: ["Vegetariano"] },
      { name: "Aguacate", description: "Aguacate fresco en rodajas, con sal y limón.", price: 160, tags: ["Vegano"] },
      { name: "Ensalada de papa", description: "Papa cocida con huevo, zanahoria y mayonesa.", price: 150 },
      { name: "Víveres hervidos", description: "Plátano, yuca y yautía hervidos con cebolla.", price: 180, tags: ["Vegano"] },
      { name: "Vegetales salteados", description: "Mezcla de vegetales de temporada con ajo.", price: 170, tags: ["Vegano"] },
      { name: "Arroz con maíz", description: "Arroz con maíz tierno y cilantro.", price: 150, tags: ["Vegetariano"] },
      { name: "Pan de ajo", description: "Pan tostado con mantequilla y ajo.", price: 130, tags: ["Vegetariano"] },
      { name: "Concón", description: "Costra crujiente de arroz, el favorito de la olla.", price: 120, tags: ["Nuevo"] },
    ],
  },
];

async function seedMenu() {
  if (process.env.SEED_DEMO_MENU === "false") {
    console.log("Menú de ejemplo omitido (SEED_DEMO_MENU=false).");
    return;
  }
  if ((await db.category.count()) > 0) {
    console.log("Ya hay categorías: el menú de ejemplo no se cargó.");
    return;
  }

  let totalDishes = 0;

  for (const [ci, cat] of MENU.entries()) {
    const category = await db.category.create({
      data: {
        name: cat.name,
        description: cat.description,
        icon: cat.icon,
        sortOrder: ci + 1,
      },
    });

    for (const [di, dish] of cat.dishes.entries()) {
      await db.dish.create({
        data: {
          name: dish.name,
          description: dish.description,
          priceCents: Math.round(dish.price * 100),
          categoryId: category.id,
          sortOrder: di + 1,
          showSchedule: !!dish.schedule,
          scheduleFrom: dish.schedule?.[0] ?? null,
          scheduleTo: dish.schedule?.[1] ?? null,
          tags: { connect: (dish.tags ?? []).map((name) => ({ name })) },
        },
      });
      totalDishes++;
    }
    console.log(`  ${cat.name}: ${cat.dishes.length} platos`);
  }

  console.log(`Menú de ejemplo cargado: ${MENU.length} categorías y ${totalDishes} platos.`);
}

async function main() {
  // 1. Configuración (fila única)
  await db.settings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });

  // 2. Administrador
  await db.user.upsert({
    where: { email: process.env.ADMIN_EMAIL! },
    update: {},
    create: {
      name: "Administrador",
      email: process.env.ADMIN_EMAIL!,
      passwordHash: await bcrypt.hash(process.env.ADMIN_PASSWORD!, 12),
      role: "ADMIN",
    },
  });

  // 3. Usuario de prueba (rol USER)
  if (process.env.DEMO_USER_EMAIL && process.env.DEMO_USER_PASSWORD) {
    await db.user.upsert({
      where: { email: process.env.DEMO_USER_EMAIL },
      update: {},
      create: {
        name: "Usuario de prueba",
        email: process.env.DEMO_USER_EMAIL,
        passwordHash: await bcrypt.hash(process.env.DEMO_USER_PASSWORD, 12),
        role: "USER",
      },
    });
  }

  // 4. Etiquetas (deben existir antes de cargar los platos)
  const tags = ["Popular", "Nuevo", "Picante", "Vegetariano", "Vegano", "Especial", "Recomendado"];
  for (const [i, name] of tags.entries()) {
    await db.tag.upsert({ where: { name }, update: {}, create: { name, sortOrder: i } });
  }

  // 5. Menú de ejemplo
  await seedMenu();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
