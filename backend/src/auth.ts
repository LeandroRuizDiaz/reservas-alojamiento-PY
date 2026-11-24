import { Router, type RequestHandler } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { db } from './db.js';
const secret = process.env.JWT_SECRET;
if (!secret || secret.length < 32 || secret.includes('reemplaza')) throw new Error('Configurá JWT_SECRET con una clave aleatoria de al menos 32 caracteres.');
export const auth = Router();
auth.post('/login', rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: 'draft-7', legacyHeaders: false, message: { error: 'Demasiados intentos. Probá más tarde.' } }), async (req, res, next) => {
  try {
    const { email, password } = z.object({ email: z.string().email(), password: z.string().min(1).max(200) }).parse(req.body);
    const user = await db.usuario.findUnique({ where: { email } });
    if (!user || !await bcrypt.compare(password, user.passwordHash)) { res.status(401).json({ error: 'Email o contraseña incorrectos.' }); return; }
    const token = jwt.sign({}, secret, { subject: String(user.id), expiresIn: '2h', issuer: 'cabanas-api', audience: 'cabanas-panel', algorithm: 'HS256' });
    res.json({ token, usuario: { id: user.id, nombre: user.nombre } });
  } catch (error) { next(error); }
});
export const restricted: RequestHandler = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
    if (!token) { res.status(401).json({ error: 'Iniciá sesión para continuar.' }); return; }
    const payload = jwt.verify(token, secret, { algorithms: ['HS256'], issuer: 'cabanas-api', audience: 'cabanas-panel' });
    if (typeof payload === 'string' || !payload.sub || !/^\d+$/.test(payload.sub)) throw new Error('Token inválido');
    const user = await db.usuario.findUnique({ where: { id: Number(payload.sub) }, select: { id: true } });
    if (!user) throw new Error('Usuario inexistente');
    res.locals.usuarioId = user.id;
    next();
  } catch { res.status(401).json({ error: 'La sesión venció. Volvé a ingresar.' }); }
};
