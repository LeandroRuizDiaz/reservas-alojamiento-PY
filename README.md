# reservas-alojamiento-PY

**Cabañas Puerto Yeruá**

Aplicación académica de reservas con frontend React y API Express, escrita en TypeScript. Usa Prisma ORM y una base relacional MySQL. El catálogo es público y el encargado administra reservas y registra huéspedes mediante autenticación JWT.

## Requisitos

- Node.js 22 o 24 y npm.
- MySQL 8 funcionando, con acceso para crear una base de datos. También se puede probar con MariaDB compatible.
- Un editor como VS Code.

## Instalación en Windows

1. Extraé todo el ZIP y abrí la carpeta `reservas-alojamiento-PY` en VS Code.
2. En phpMyAdmin, abrí la pestaña SQL y ejecutá el contenido de `CREAR_BASE.sql`. Este comando crea la base con el nombre del repositorio. Si ya creaste `cabanas_puerto_yerua`, se conserva como una base aparte.

```sql
CREATE DATABASE IF NOT EXISTS `reservas-alojamiento-PY`
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

3. En la terminal de VS Code, desde la carpeta donde está este README, ejecutá lo siguiente.

```powershell
npm ci
Copy-Item backend/.env.example backend/.env
```

4. Editá `backend/.env`. En `DATABASE_URL`, reemplazá `root` y `tu_clave` con tus credenciales de MySQL. Si tu usuario no tiene contraseña, usá `mysql://root@localhost:3306/reservas-alojamiento-PY`. Si la contraseña tiene caracteres especiales, codificalos para una URL.
5. Generá una clave para JWT y pegá el resultado en `JWT_SECRET` dentro de `.env`.

```powershell
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

6. Generá el cliente ORM, aplicá las migraciones y cargá los datos de prueba.

```powershell
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

7. Abrí http://localhost:5173. La API se ejecuta en http://localhost:3001.

En Linux o macOS, reemplazá `Copy-Item backend/.env.example backend/.env` por `cp backend/.env.example backend/.env`.

## Cuenta de demostración

Antes de cargar el seed, podés cambiar `SEED_EMAIL` y `SEED_PASSWORD` en `.env`. El ejemplo usa `admin@cabanas.local` y `CabanasDemo2026!`. La contraseña se guarda con bcrypt y nunca se devuelve desde la API. El seed conserva las cuentas existentes y no reemplaza contraseñas. Reejecutarlo conserva los registros que ya existen.

## Cómo probar la aplicación

1. Abrí el catálogo y revisá las tres cabañas de ejemplo.
2. Entrá en Acceso del encargado e iniciá sesión.
3. En Huéspedes, registrá nombre, documento y teléfono.
4. En Reservas, creá una reserva del 4 al 6 de diciembre de 2026 en Los Ceibos. Corresponde a dos noches.
5. Intentá crear otra del 5 al 7 en la misma cabaña. El backend debe rechazarla.
6. Creá una del 6 al 7. Está permitido entrar el día en que termina la anterior.
7. Editá el huésped, las personas, fechas o estado de esa reserva y guardá.
8. Eliminá una reserva de prueba y verificá que desaparezca del listado.
9. Cerrá sesión. El panel debe dejar de estar disponible.

Las reservas pendientes y confirmadas ocupan fechas. Las canceladas liberan disponibilidad. Los precios están en pesos argentinos y las fechas se interpretan como días calendario. Al modificar las fechas de una reserva se conserva su tarifa por noche. Si cambiás la cabaña, se toma su tarifa actual. La capacidad se valida en el servidor. Las reservas pueden registrar fechas pasadas para permitir cargar estadías históricas.

## Organización

```text
frontend/src/main.jsx       Pantallas, formularios y llamadas a la API
frontend/src/style.css      Estilos adaptables a PC y celular
backend/src/server.ts       Configuración de Express y recursos
backend/src/auth.ts         Login, bcrypt y middleware JWT
backend/src/reservas.ts     CRUD, transacciones y reglas de reservas
backend/src/db.ts           Cliente Prisma compartido
backend/prisma/schema.prisma       Modelos y relaciones
backend/prisma/migrations/         Migración inicial reproducible
backend/prisma/seed.ts             Datos ficticios y cuenta inicial
DIAGRAMA_CLASES.md                  Diagrama con atributos y relaciones
EXPOSICION.md                      Guion de la demostración
```

## API

| Método | Ruta | Acceso | Función |
| --- | --- | --- | --- |
| GET | /api/health | Público | Comprobar servidor |
| GET | /api/cabanas | Público | Listar catálogo |
| POST | /api/auth/login | Público, con límite de intentos | Obtener JWT |
| GET | /api/huespedes | JWT | Listar huéspedes |
| POST | /api/huespedes | JWT | Registrar huésped |
| GET | /api/reservas | JWT | Listar reservas |
| POST | /api/reservas | JWT | Crear reserva |
| PUT | /api/reservas/:id | JWT | Editar reserva |
| DELETE | /api/reservas/:id | JWT | Eliminar reserva |

Login recibe `email` y `password`. El token se envía mediante `Authorization: Bearer TOKEN`. El JWT vence en dos horas. El frontend lo conserva en sessionStorage hasta que termina la sesión de la pestaña o se cierra sesión.

Una reserva recibe este JSON.

```json
{
  "cabanaId": 1,
  "huespedId": 1,
  "entrada": "2026-12-04",
  "salida": "2026-12-06",
  "personas": 2,
  "estado": "Confirmada"
}
```

## Base de datos y concurrencia

`Reserva` referencia mediante claves foráneas a `Cabana`, `Huesped` y `Usuario`. El documento del huésped y el email del usuario son únicos. Los datos del huésped y de la cabaña se mantienen en sus tablas. `tarifaNoche` guarda el precio pactado para la operación, que puede ser distinto del precio actual del catálogo. El total se calcula multiplicando la tarifa por la cantidad de noches.

La API usa transacciones de Prisma con aislamiento ReadCommitted y bloquea la fila de la cabaña con `SELECT ... FOR UPDATE` antes de consultar cruces e insertar o actualizar. Así dos solicitudes concurrentes de esta API para la misma cabaña se coordinan. En una edición, bloquea primero la reserva y después las cabañas en orden de ID. Las claves foráneas restringen borrar entidades referenciadas. No se incluyen rutas para editar ni eliminar huéspedes o cabañas. El CRUD completo exigido se implementa en reservas.

## GitHub

Tu repositorio ya tiene commits. Clonalo desde una carpeta distinta de la que extrajiste del ZIP.

```powershell
git clone https://github.com/LeandroRuizDiaz/reservas-alojamiento-PY.git
cd reservas-alojamiento-PY
```

Copiá el contenido de la carpeta extraída a la carpeta clonada, incluidos `.gitignore` y `README.md`. Conservá la carpeta `.git` del clon. Después ejecutá:

```powershell
git add .
git status --short
```

Comprobá que `backend/.env` no figure en el listado. Luego ejecutá:

```powershell
git commit -m "Agregar aplicación de reservas de cabañas"
git push origin main
```

## Compilación

```powershell
npm run build
```

Esto compila el backend TypeScript en `backend/dist` y la web en `frontend/dist`. `npm run dev` es el punto de entrada para la demostración local. Para un despliegue se deben configurar MySQL, secretos, URL del frontend y el servidor que entregue la web y redirija `/api` a Express.

## Alcance

Esta primera versión permite demostrar login, API protegida, ORM, base relacional y CRUD completo de reservas. Las cabañas se cargan con el seed y los huéspedes se registran desde el panel. Se usan ilustraciones y datos ficticios. El visitante consulta el catálogo y el encargado registra las reservas. Los cobros y las reservas autónomas del visitante quedan fuera de esta entrega.

## Verificación de esta entrega

Se verificaron la compilación TypeScript, la compilación de React, la migración y la carga de datos con MariaDB 11.8 mediante el conector MySQL de Prisma. Se probaron por HTTP el rechazo sin JWT, login incorrecto y correcto, alta de huésped, listado, alta, edición y eliminación de reservas, capacidad, fechas inválidas, cruce, fechas adyacentes y dos altas concurrentes para una misma cabaña. La prueba concurrente aceptó una reserva y rechazó la otra. Queda pendiente la comprobación visual en navegador y la ejecución en tu instalación de MySQL y Windows.
