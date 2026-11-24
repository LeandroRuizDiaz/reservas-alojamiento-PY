import 'dotenv/config';
import express, { type ErrorRequestHandler } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { db } from './db.js';
import { auth, restricted } from './auth.js';
import { reservas } from './reservas.js';
const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '32kb' }));
app.get('/api/health', (_req,res) => res.json({ ok: true }));
app.use('/api/auth', auth);
app.get('/api/cabanas', async (_req,res,next) => { try { res.json(await db.cabana.findMany({ orderBy: { id: 'asc' } })); } catch(error) { next(error); } });
app.use('/api/reservas', restricted, reservas);
app.get('/api/huespedes', restricted, async (_req,res,next) => { try { res.json(await db.huesped.findMany({ orderBy: { nombre: 'asc' } })); } catch(error) { next(error); } });
app.post('/api/huespedes', restricted, async (req,res,next) => {
  try {
    const data = z.object({ nombre: z.string().trim().min(2).max(100), documento: z.string().trim().min(3).max(30), telefono: z.string().trim().min(3).max(40) }).parse(req.body);
    res.status(201).json(await db.huesped.create({ data }));
  } catch(error) { next(error); }
});
app.use((_req,res) => { res.status(404).json({ error: 'Recurso inexistente.' }); });
const errors: ErrorRequestHandler = (error,_req,res,_next) => {
  if (error instanceof z.ZodError) { res.status(400).json({ error: error.issues.map(issue => issue.message).join('. ') }); return; }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') { res.status(409).json({ error: 'Ya existe un huésped con ese documento.' }); return; }
    if (error.code === 'P2025') { res.status(404).json({ error: 'El registro ya no existe.' }); return; }
    if (error.code === 'P2034') { res.status(409).json({ error: 'Otra operación modificó estos datos. Intentá nuevamente.' }); return; }
  }
  if (error instanceof SyntaxError) { res.status(400).json({ error: 'Solicitud inválida.' }); return; }
  console.error(error);
  res.status(500).json({ error: 'No se pudo completar la operación.' });
};
app.use(errors);
const server = app.listen(Number(process.env.PORT || 3001), () => console.log('API disponible en http://localhost:' + (process.env.PORT || 3001)));
async function close() { server.close(); await db.$disconnect(); }
process.on('SIGTERM', close);
process.on('SIGINT', close);
