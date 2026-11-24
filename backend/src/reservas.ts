import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { db } from './db.js';
export const reservas = Router();
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => { const parsed = new Date(value + 'T00:00:00Z'); return !isNaN(parsed.getTime()) && parsed.toISOString().slice(0,10) === value; }, 'Fecha inválida');
const input = z.object({ cabanaId: z.number().int().positive(), huespedId: z.number().int().positive(), entrada: date, salida: date, personas: z.number().int().min(1).max(100), estado: z.enum(['Confirmada','Pendiente','Cancelada']) });
class Conflict extends Error {}
reservas.get('/', async (_req,res,next) => {
  try { res.json(await db.reserva.findMany({ include: { cabana: true, huesped: true }, orderBy: { entrada: 'desc' } })); } catch (error) { next(error); }
});
// Todas las escrituras bloquean primero la cabaña. El bloqueo coordina solicitudes concurrentes.
async function save(body: unknown, usuarioId: number, id?: number) {
  const data = input.parse(body);
  if (data.salida <= data.entrada) throw new Conflict('La salida debe ser posterior a la entrada.');
  return db.$transaction(async tx => {
    if (id) await tx.$queryRaw`SELECT id FROM Reserva WHERE id = ${id} FOR UPDATE`;
    const old = id ? await tx.reserva.findUnique({ where: { id } }) : null;
    if (id && !old) throw new Conflict('La reserva ya no existe.');
    const lockIds = [...new Set([data.cabanaId, ...(old ? [old.cabanaId] : [])])].sort((a,b) => a-b);
    for (const lockId of lockIds) await tx.$queryRaw`SELECT id FROM Cabana WHERE id = ${lockId} FOR UPDATE`;
    const cabana = await tx.cabana.findUnique({ where: { id: data.cabanaId } });
    if (!cabana) throw new Conflict('Seleccioná una cabaña existente.');
    if (data.personas > cabana.capacidad) throw new Conflict('La cantidad de personas supera la capacidad de la cabaña.');
    if (!await tx.huesped.findUnique({ where: { id: data.huespedId } })) throw new Conflict('Seleccioná un huésped existente.');
    const entrada = new Date(data.entrada + 'T00:00:00Z');
    const salida = new Date(data.salida + 'T00:00:00Z');
    if (data.estado !== 'Cancelada') {
      const overlap = await tx.reserva.findFirst({ where: { cabanaId: data.cabanaId, estado: { not: 'Cancelada' }, entrada: { lt: salida }, salida: { gt: entrada }, ...(id ? { id: { not: id } } : {}) } });
      if (overlap) throw new Conflict('La cabaña ya tiene una reserva en esas fechas.');
    }
    const tarifaNoche = old?.cabanaId === data.cabanaId ? old.tarifaNoche : cabana.precioNoche;
    const values = { ...data, entrada, salida, tarifaNoche };
    return id ? tx.reserva.update({ where: { id }, data: values }) : tx.reserva.create({ data: { ...values, usuarioId } });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted });
}
for (const method of ['post', 'put'] as const) {
  reservas[method](method === 'post' ? '/' : '/:id', async (req,res,next) => {
    try {
      const id = method === 'put' ? z.coerce.number().int().positive().parse((req.params as Record<string, string>).id) : undefined;
      res.status(method === 'post' ? 201 : 200).json(await save(req.body, res.locals.usuarioId, id));
    } catch (error) {
      if (error instanceof Conflict) { res.status(409).json({ error: error.message }); return; }
      next(error);
    }
  });
}
reservas.delete('/:id', async (req,res,next) => {
  try {
    const id = z.coerce.number().int().positive().parse(req.params.id);
    await db.reserva.delete({ where: { id } });
    res.status(204).end();
  } catch (error) { next(error); }
});
