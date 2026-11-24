# Diagrama de clases

```mermaid
classDiagram
  class Usuario {
    +Int id
    +String nombre
    +String email
    -String passwordHash
  }
  class Cabana {
    +Int id
    +String nombre
    +String descripcion
    +Int capacidad
    +Decimal precioNoche
  }
  class Huesped {
    +Int id
    +String nombre
    +String documento
    +String telefono
  }
  class Reserva {
    +Int id
    +Int cabanaId
    +Int huespedId
    +Int usuarioId
    +Date entrada
    +Date salida
    +Int personas
    +Decimal tarifaNoche
    +String estado
    +DateTime creadaEn
  }
  Usuario "1" --> "0..*" Reserva : registra
  Cabana "1" --> "0..*" Reserva : recibe
  Huesped "1" --> "0..*" Reserva : realiza
```

Cada reserva tiene exactamente un usuario responsable, una cabaña y un huésped. El modelo se implementa en `backend/prisma/schema.prisma`. Las operaciones se implementan en las rutas y servicios de la API. `passwordHash` es interno al backend.
