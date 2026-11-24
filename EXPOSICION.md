# Guion de exposición

## Presentación

“Desarrollamos Cabañas Puerto Yeruá para que un encargado pueda consultar el catálogo, registrar huéspedes y administrar las reservas de un conjunto de alojamientos. La aplicación centraliza las estadías y valida que la misma cabaña no se reserve dos veces en fechas superpuestas.”

## Arquitectura y tecnologías

El navegador ejecuta React. Cuando una persona inicia sesión, React envía email y contraseña a Express. El backend compara la contraseña con un hash bcrypt y genera un JWT. En las siguientes operaciones, el frontend envía ese token y el middleware de la API lo valida.

Express procesa solicitudes HTTP, valida datos con Zod y accede a MySQL mediante Prisma ORM. Las migraciones crean cuatro tablas relacionadas. Mostrá el diagrama de clases y el esquema Prisma.

## Proceso de desarrollo

1. A partir de la consigna se identificaron el catálogo público, el encargado y las operaciones de reserva.
2. Se definieron entidades y relaciones.
3. Se implementaron la base, el seed y el login.
4. Se agregaron el CRUD de reservas y sus validaciones.
5. Se conectaron las pantallas con la API y se verificó el proyecto.

Antes de exponer, actualizá este apartado con las pruebas que realizó tu grupo y cualquier cambio que hayan hecho.

## Demostración

- Abrí el catálogo y explicá que usa GET /api/cabanas.
- Intentá pedir /api/reservas sin token y mostrá la respuesta 401.
- Iniciá sesión y registrá un huésped.
- Creá una reserva del 4 al 6 de diciembre de 2026.
- Mostrá el total de dos noches.
- Intentá otra del 5 al 7 en la misma cabaña. Mostrá el mensaje de conflicto.
- Mostrá que una reserva del 6 al 7 se permite.
- Editá una reserva, guardala y comprobá que el listado se actualiza.
- Eliminá una reserva de prueba mediante la confirmación.
- Cerrá sesión y mostrale al docente el repositorio.

## Retos que podés explicar con el código

El primer reto es definir correctamente el cruce de fechas. Existe conflicto si una reserva empieza antes de la salida solicitada y termina después de la entrada solicitada. Esto permite una entrada el mismo día de otra salida.

El segundo reto es coordinar solicitudes concurrentes. Una transacción bloquea la cabaña mientras consulta disponibilidad y guarda. Revisá `backend/src/reservas.ts` para mostrar esa lógica.

El tercero es conservar el precio pactado. Cada reserva guarda su tarifa por noche, así el historial no cambia si más adelante cambia el precio de la cabaña.

## Antes de rendir

- Probá la instalación completa y el CRUD con tu base local.
- Asegurate de tener MySQL funcionando antes de abrir la app.
- Verificá el acceso al repositorio y llevá este ZIP como respaldo.
- Prepará los huéspedes y las fechas que vas a usar.
- Revisá que los ejemplos sean ficticios.
