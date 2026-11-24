/// <reference types="node" />

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const db = new PrismaClient();

async function main() {
  const email = process.env.SEED_EMAIL;
  const password = process.env.SEED_PASSWORD;

  if (!email || !password || password.length < 12) {
    throw new Error(
      'Configurá SEED_EMAIL y SEED_PASSWORD en backend/.env. ' +
      'La contraseña debe tener al menos 12 caracteres.'
    );
  }

  await db.usuario.upsert({
    where: { email },
    update: {},
    create: {
      nombre: 'Administrador',
      email,
      passwordHash: await bcrypt.hash(password, 12),
    },
  });

  const nombres = ['Los Ceibos', 'El Remanso', 'La Ribera'];

  for (const [indice, nombre] of nombres.entries()) {
    const id = indice + 1;

    await db.cabana.upsert({
      where: { id },
      update: {},
      create: {
        id,
        nombre,
        descripcion:
          'Cabaña de ejemplo en Puerto Yeruá. Cocina equipada, ' +
          'aire acondicionado, parrilla y espacio verde.',
        capacidad: indice === 2 ? 6 : 4,
        precioNoche: 65000 + indice * 15000,
      },
    });
  }

  await db.huesped.upsert({
    where: { documento: 'DEMO-001' },
    update: {},
    create: {
      nombre: 'Huésped de ejemplo',
      documento: 'DEMO-001',
      telefono: 'Sin teléfono',
    },
  });

  console.log('Datos de ejemplo listos. Se conservaron los registros existentes.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());