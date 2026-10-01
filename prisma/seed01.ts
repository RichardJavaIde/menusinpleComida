//prisma/seed.ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

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

  // 4. Etiquetas
  const tags = ["Popular", "Nuevo", "Picante", "Vegetariano", "Vegano", "Especial", "Recomendado"];
  for (const [i, name] of tags.entries()) {
    await db.tag.upsert({ where: { name }, update: {}, create: { name, sortOrder: i } });
  }

  // 5. Categoría y plato de ejemplo (solo si no hay categorías)
  if ((await db.category.count()) === 0) {
    const entradas = await db.category.create({
      data: { name: "Entradas", icon: "salad", sortOrder: 1 },
    });
    await db.dish.create({
      data: {
        name: "Tostones con queso frito",
        description: "Plátano verde crujiente con queso frito y salsa de la casa.",
        priceCents: 35000,
        categoryId: entradas.id,
        showSchedule: true,
        scheduleFrom: "11:00",
        scheduleTo: "15:00",
        tags: { connect: [{ name: "Popular" }] },
      },
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());