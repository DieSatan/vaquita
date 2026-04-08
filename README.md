# 🐄 Vaquita

> **Vaquita**: chilenismo para "hacer una vaquita" — juntar plata entre varios. Viene de *vaca*; antiguamente se juntaba plata para comprar un animal vacuno, hoy se usa para cualquier colecta grupal.

Coordinador de cobros grupales para juntas de amigos. El organizador crea un evento, divide la cuenta y comparte links individuales. Cada participante ve cuánto debe con los datos bancarios listos para copiar, y marca su pago. Sin apps que instalar. Sin registro. Sin manejo de dinero.

Creado por **Gustavo Aguilera P.**

---

## ¿Cómo funciona?

### Para el organizador
1. Crea el evento con nombre, datos bancarios y modo de división
2. Agrega los participantes
3. Comparte los links individuales (o QR, o por WhatsApp)
4. Desde el dashboard confirma los pagos a medida que llegan

### Para el participante
1. Abre su link único
2. Ve cuánto debe y los datos para transferir
3. Copia los datos con un clic y transfiere en su app de banco
4. Apreta "Ya pagué"

### Modos de división
| Modo | Descripción |
|------|-------------|
| ⚖️ **Parejo** | El total se divide en partes iguales |
| ✏️ **Manual** | El organizador asigna cuánto paga cada uno |
| 🍺 **Por consumo** | Cada participante registra lo que pidió, con soporte para items compartidos y propina |

---

## Stack técnico

### Backend
- **.NET 9** — Minimal APIs, Clean Architecture
- **EF Core 9** + **SQLite** (un archivo, zero config)
- **Serilog** para logging estructurado
- **FluentValidation** para validación de inputs

### Frontend
- **React 18** + **Vite** + **TypeScript**
- **Tailwind CSS** — diseño mobile-first
- **PWA** — instalable como app nativa en el celular

### Infraestructura
- **Docker** — contenedor único (API + frontend estático)
- **Render.com** — free tier, auto-deploy desde GitHub, HTTPS automático
- **SQLite** en persistent disk de Render

---

## Seguridad

La app maneja datos bancarios sensibles (RUT, número de cuenta) y aplica múltiples capas de protección:

- **AES-256** para datos bancarios en reposo (AccountNumber, RUT, Email, HolderName)
- **Tokens criptográficos**: AdminCode (8 hex = 4.294.967.296 combinaciones), UniqueToken (22 chars base64url = 2¹²⁸)
- **AdminCode en header** `X-Admin-Code` — nunca en query string ni logs
- **Rate limiting**: 100 req/min global, 10/5min en endpoints admin, 5/hr en creación
- **Security headers**: CSP, X-Frame-Options, Referrer-Policy, etc.
- **Anti-enumeración**: misma respuesta para "no existe" y "código incorrecto"
- **Expiración automática**: eventos eliminados a los 7 días

> La app **NO** maneja dinero. Solo coordina información para que las transferencias ocurran directamente banco a banco entre personas. Esto evita regulación de la CMF Chile.

---

## Correr localmente

### Requisitos
- [.NET 9 SDK](https://dotnet.microsoft.com/download/dotnet/9.0)
- [Node.js 20+](https://nodejs.org) (para el frontend)

### Backend

```bash
# Clonar el repo
git clone https://github.com/TU_USUARIO/vaquita.git
cd vaquita

# Correr la API (aplica migraciones automáticamente)
dotnet run --project src/Vaquita.API
```

La API queda disponible en `http://localhost:5174`
Swagger UI disponible en `http://localhost:5174/swagger`

### Frontend (desarrollo)

```bash
cd client
npm install
npm run dev
```

El frontend queda en `http://localhost:5173` con proxy a la API.

### Con Docker

```bash
docker build -t vaquita .
docker run -p 8080:8080 \
  -e Security__EncryptionKey="tu-clave-secreta-minimo-32-chars" \
  vaquita
```

Accede en `http://localhost:8080`

---

## Estructura del proyecto

```
vaquita/
├── src/
│   ├── Vaquita.Domain/          # Entidades, enums, interfaces
│   ├── Vaquita.Application/     # DTOs, servicios, validadores
│   ├── Vaquita.Infrastructure/  # EF Core, repositorios, encriptación
│   └── Vaquita.API/             # Minimal APIs, endpoints, Program.cs
├── client/                      # React + Vite + TypeScript
│   └── src/
│       ├── components/
│       │   ├── CreateEvent/     # Flujo creación de evento (4 pasos)
│       │   ├── Dashboard/       # Vista organizador
│       │   ├── ParticipantView/ # Vista participante + registro consumo
│       │   └── Shared/          # Layout, QRCode
│       ├── pages/               # Home, DashboardPage, PayPage
│       └── services/api.ts      # Cliente HTTP tipado
├── Dockerfile                   # Build multi-stage
├── render.yaml                  # Configuración Render.com
└── .github/workflows/ci.yml     # CI con GitHub Actions
```

---

## Despliegue en Render.com

1. Haz fork/clone y sube a GitHub
2. En Render → **New Web Service** → conecta el repo
3. Render detecta el `Dockerfile` automáticamente
4. Crea un **Environment Group** llamado `vaquita-secrets` con:
   ```
   Security__EncryptionKey = <clave-aleatoria-segura-32+-chars>
   ```
5. Cada `git push` a `main` despliega automáticamente

La app queda en `https://vaquita.onrender.com`

> **Nota**: El free tier de Render se duerme tras 15 min de inactividad. El cold start toma ~30 segundos.

---

## API Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/api/events` | Crear evento |
| `GET` | `/api/events/{id}` | Dashboard organizador *(X-Admin-Code)* |
| `DELETE` | `/api/events/{id}` | Eliminar evento *(X-Admin-Code)* |
| `GET` | `/api/events/{id}/summary` | Desglose por consumo *(X-Admin-Code)* |
| `POST` | `/api/events/{id}/lock` | Cerrar registro *(X-Admin-Code)* |
| `POST` | `/api/events/{id}/remind/{pid}` | Link WhatsApp recordatorio *(X-Admin-Code)* |
| `GET` | `/api/participants/{token}` | Vista participante |
| `PATCH` | `/api/participants/{token}/mark-paid` | Marcar como pagado |
| `PATCH` | `/api/participants/{id}/confirm` | Confirmar pago *(X-Admin-Code)* |
| `POST` | `/api/participants/{token}/items` | Agregar item de consumo |
| `PUT` | `/api/participants/{token}/items/{id}` | Editar item |
| `DELETE` | `/api/participants/{token}/items/{id}` | Eliminar item |
| `GET` | `/health` | Health check |

---

## Licencia

MIT — úsalo como quieras.
