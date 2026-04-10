# CLAUDE.md — Vaquita: Coordinador de Cobros Grupales

## Visión del Proyecto

**Vaquita** es una web app que resuelve el problema de dividir cuentas en juntas de amigos. El organizador crea un evento, divide la cuenta y comparte links individuales. Cada participante ve cuánto debe, los datos bancarios del organizador listos para copiar, y marca su pago. El organizador trackea todo desde un dashboard.

**Principio clave**: La app NO maneja dinero. Solo coordina información de cobro para evitar regulación financiera (CMF Chile).

---

## Stack Tecnológico

### Backend
- **.NET 9** Web API (Minimal APIs)
- **Clean Architecture**: Domain → Application → Infrastructure → API
- **EF Core 9** con **Neon PostgreSQL** (free tier), provider `Npgsql.EntityFrameworkCore.PostgreSQL`
- **Serilog** para logging estructurado
- Autenticación simplificada: el organizador se identifica con un código único por evento (sin registro de usuario para el MVP)

### Frontend
- **React 18** + **Vite** + **TypeScript**
- **Tailwind CSS** para estilos
- **PWA** (manifest + service worker) para experiencia nativa en móvil
- Sin framework de estado complejo — `useState`/`useContext` es suficiente para el MVP

### Infraestructura
- **Render.com** free tier (contenedor Docker único)
- **Neon PostgreSQL** free tier (0.5 GB, scale-to-zero) como base de datos externa
- HTTPS automático (Let's Encrypt)
- Auto-deploy desde GitHub (push a main)
- Subdomain gratuito: `vaquita.onrender.com`

---

## Arquitectura del Backend

```
src/
├── Vaquita.Domain/
│   ├── Entities/
│   │   ├── Event.cs
│   │   ├── Participant.cs
│   │   ├── ConsumptionItem.cs
│   │   └── PaymentInfo.cs
│   ├── Enums/
│   │   ├── PaymentStatus.cs
│   │   └── SplitMode.cs
│   └── Interfaces/
│       └── IEventRepository.cs
├── Vaquita.Application/
│   ├── DTOs/
│   │   ├── CreateEventRequest.cs
│   │   ├── EventResponse.cs
│   │   ├── ParticipantResponse.cs
│   │   ├── AddConsumptionItemRequest.cs
│   │   └── MarkPaidRequest.cs
│   ├── Interfaces/
│   │   └── IEventService.cs
│   ├── Services/
│   │   └── EventService.cs
│   └── Mapping/
│       └── MappingProfile.cs
├── Vaquita.Infrastructure/
│   ├── Data/
│   │   ├── AppDbContext.cs
│   │   └── Migrations/
│   ├── Repositories/
│   │   └── EventRepository.cs
│   └── DependencyInjection.cs
├── Vaquita.API/
│   ├── Program.cs
│   ├── Endpoints/
│   │   ├── EventEndpoints.cs
│   │   ├── ParticipantEndpoints.cs
│   │   └── ConsumptionEndpoints.cs
│   └── appsettings.json
└── Vaquita.sln
```

### Entidades del Dominio

```csharp
// Event.cs
public class Event
{
    public Guid Id { get; set; }
    public string OrganizerName { get; set; }    // Nombre de quien paga
    public string EventName { get; set; }         // "Cumpleaños Pedro", "Asado viernes"
    public string AdminCode { get; set; }         // Código de 8 hex chars para administrar el evento
    public decimal TotalAmount { get; set; }      // Monto total de la cuenta (se calcula si es por consumo)
    public SplitMode SplitMode { get; set; }      // Even, Custom, ByConsumption
    public bool IsLocked { get; set; }            // true = registro de consumo cerrado
    public decimal TipPercentage { get; set; }    // % propina a prorratear (0 si no aplica)
    public PaymentInfo PaymentInfo { get; set; }  // Datos bancarios del organizador
    public List<Participant> Participants { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime ExpiresAt { get; set; }       // Eventos expiran en 7 días
}

// Participant.cs
public class Participant
{
    public Guid Id { get; set; }
    public Guid EventId { get; set; }
    public string Name { get; set; }
    public string? Phone { get; set; }            // Opcional, para link de WhatsApp
    public decimal Amount { get; set; }           // Calculado: suma de items + propina prorrateada
    public PaymentStatus Status { get; set; }     // Pending, MarkedAsPaid, Confirmed
    public string UniqueToken { get; set; }       // Token único para el link del participante
    public DateTime? PaidAt { get; set; }
    public List<ConsumptionItem> Items { get; set; } // Lo que consumió (modo ByConsumption)
    public Event Event { get; set; }
}

// ConsumptionItem.cs
public class ConsumptionItem
{
    public Guid Id { get; set; }
    public Guid ParticipantId { get; set; }
    public string Description { get; set; }       // "Cerveza Kunstmann", "Pizza Pepperoni"
    public decimal UnitPrice { get; set; }        // Precio unitario
    public int Quantity { get; set; }             // Cantidad (default 1)
    public bool IsShared { get; set; }            // true = se divide entre los que lo compartieron
    public List<Guid>? SharedWithParticipantIds { get; set; } // IDs de quienes comparten este item
    public Participant Participant { get; set; }
}

// PaymentInfo.cs (Value Object, owned por Event)
public class PaymentInfo
{
    public string BankName { get; set; }          // "Banco Estado", "BCI", etc.
    public string AccountType { get; set; }       // "Cuenta Vista", "Cuenta Corriente"
    public string AccountNumber { get; set; }
    public string Rut { get; set; }               // RUT del organizador
    public string HolderName { get; set; }        // Nombre del titular
    public string Email { get; set; }             // Email para la transferencia
}

// PaymentStatus.cs
public enum PaymentStatus
{
    Pending,         // No ha pagado
    MarkedAsPaid,    // Participante dice que pagó (no confirmado)
    Confirmed        // Organizador confirmó el pago
}

// SplitMode.cs
public enum SplitMode
{
    Even,            // Dividir parejo entre todos
    Custom,          // Organizador asigna montos manualmente
    ByConsumption    // Cada participante registra lo que consumió
}
```

### Endpoints de la API

```
POST   /api/events                              → Crear evento (incluye SplitMode)
GET    /api/events/{id}                          → Dashboard del organizador (AdminCode en header X-Admin-Code)
GET    /api/participants/{token}                  → Vista del participante (por token único)
PATCH  /api/participants/{token}/mark-paid        → Participante marca como pagado
PATCH  /api/participants/{id}/confirm             → Organizador confirma pago (AdminCode en header)
POST   /api/events/{id}/remind/{participantId}   → Genera link de WhatsApp con recordatorio
DELETE /api/events/{id}                           → Eliminar evento (AdminCode en header)

# Endpoints de Consumo (modo ByConsumption)
POST   /api/participants/{token}/items            → Participante agrega un item consumido
PUT    /api/participants/{token}/items/{itemId}    → Editar un item
DELETE /api/participants/{token}/items/{itemId}    → Eliminar un item
GET    /api/events/{id}/summary                   → Resumen: total por persona con desglose (AdminCode en header)
POST   /api/events/{id}/lock                      → Organizador cierra el registro (AdminCode en header)
```

### Reglas de Negocio
- El `AdminCode` se genera automáticamente (8 caracteres hexadecimales, criptográficamente aleatorios)
- El `UniqueToken` de cada participante: 22 chars base64url (criptográficamente aleatorio)
- Los eventos expiran automáticamente a los 7 días
- PaymentInfo es un owned entity en EF Core (se almacena en la misma tabla de Event)

#### Reglas por SplitMode
- **Even**: TotalAmount / N participantes. El organizador ingresa el total.
- **Custom**: El organizador asigna montos manualmente. TotalAmount >= suma de montos.
- **ByConsumption**: Cada participante registra sus items. El Amount se calcula como:
  `Amount = suma(items propios) + proporción de items compartidos + propina prorrateada`

#### Reglas de Consumo (modo ByConsumption)
- Cada participante solo puede agregar/editar/eliminar sus propios items
- Items compartidos (`IsShared = true`) se dividen equitativamente entre `SharedWithParticipantIds`
- El organizador puede definir un % de propina que se prorratea entre todos
- El organizador puede "cerrar" el registro (lock) para que nadie más agregue items
- Mientras el registro está abierto, el Amount de cada participante se recalcula en tiempo real
- Los items compartidos requieren que el participante que los agrega especifique con quiénes comparte

---

## Arquitectura del Frontend

```
client/
├── public/
│   ├── manifest.json
│   └── icons/
├── src/
│   ├── components/
│   │   ├── CreateEvent/
│   │   │   ├── EventForm.tsx          // Nombre evento + datos organizador + SplitMode
│   │   │   ├── PaymentInfoForm.tsx    // Datos bancarios
│   │   │   ├── ParticipantsForm.tsx   // Agregar participantes y montos
│   │   │   └── ShareLinks.tsx         // Mostrar links/QR generados
│   │   ├── Dashboard/
│   │   │   ├── EventDashboard.tsx     // Vista organizador: quién pagó
│   │   │   ├── ParticipantRow.tsx     // Fila por participante con estado
│   │   │   ├── ConsumptionSummary.tsx // Desglose de items por participante (modo ByConsumption)
│   │   │   ├── LockRegistrationBtn.tsx // Botón para cerrar registro de consumo
│   │   │   └── ProgressBar.tsx        // Barra de progreso del cobro
│   │   ├── ParticipantView/
│   │   │   ├── PaymentDetails.tsx     // Muestra datos bancarios + monto
│   │   │   ├── ConsumptionTracker.tsx // Registrar items consumidos (modo ByConsumption)
│   │   │   ├── AddItemForm.tsx        // Form para agregar item (nombre, precio, qty, compartido?)
│   │   │   ├── ItemList.tsx           // Lista de items agregados con editar/eliminar
│   │   │   ├── SharedItemSelector.tsx // Selector de con quién compartir un item
│   │   │   ├── CopyButton.tsx         // Copiar datos al portapapeles
│   │   │   └── MarkPaidButton.tsx     // Botón "Ya pagué"
│   │   └── Shared/
│   │       ├── QRCode.tsx             // Generador de QR (usa qrcode.react)
│   │       └── Layout.tsx
│   ├── pages/
│   │   ├── Home.tsx                   // Landing + crear evento
│   │   ├── DashboardPage.tsx          // /event/{id}?code={adminCode}
│   │   └── PayPage.tsx                // /pay/{token}
│   ├── services/
│   │   └── api.ts                     // Cliente HTTP (fetch wrapper)
│   ├── App.tsx
│   └── main.tsx
├── index.html
├── tailwind.config.js
├── vite.config.ts
├── tsconfig.json
└── package.json
```

### Flujos de Pantalla

#### Flujo Organizador (3-4 pasos)
1. **Crear evento**: Nombre del evento + nombre organizador + datos bancarios + **elegir modo** (Parejo / Manual / Por consumo)
2. **Agregar participantes**: Lista de nombres (+ montos si modo Manual, + teléfonos opcionales)
3. **Compartir**: Links individuales generados + QR + botón "Compartir por WhatsApp"
4. **Dashboard**: Ver estado de pagos, confirmar pagos, enviar recordatorios. En modo ByConsumption: ver items registrados por cada persona, subtotales en vivo, botón "Cerrar registro" y campo para agregar % propina

#### Flujo Participante
**Modo Even/Custom (1 pantalla)**:
Abre link → Ve cuánto debe + datos bancarios con botón copiar → Marca como pagado

**Modo ByConsumption (2 pantallas)**:
1. **Registrar consumo**: Abre link → Agrega lo que pidió (nombre, precio, cantidad) → Marca items compartidos y con quién → Ve su subtotal en tiempo real
2. **Pagar**: Una vez que el organizador cierra el registro → Ve monto final + datos bancarios → Marca como pagado

### UX Crítico
- **Mobile-first**: Todo el diseño pensado para celular
- **Copiar datos bancarios**: Cada campo (RUT, banco, cuenta, monto, email) con botón de copiar individual
- **También un botón "Copiar todo"** que copie el bloque completo formateado para pegar en la app del banco
- **QR**: Cada link de participante tiene un QR que el organizador puede mostrar en persona
- **WhatsApp**: Botón que abre `https://wa.me/{phone}?text={mensaje}` con el link de pago
- **Sin login**: Ni el organizador ni los participantes necesitan cuenta

---

## Flujo Completo (Ejemplos)

### Ejemplo 1: Modo Parejo (Even)
1. Pedro organiza un cumpleaños en un pub. Abre Vaquita.
2. Crea evento "Cumple Pedro" → Modo: Parejo → Total: $75.000 → Ingresa sus datos bancarios → Agrega 5 amigos.
3. Vaquita calcula $15.000 cada uno y genera 5 links. Pedro comparte por WhatsApp.
4. Juan abre su link → Ve que debe $15.000 → Copia datos → Transfiere → Apreta "Ya pagué".
5. Pedro ve en su dashboard que Juan pagó → Lo confirma.

### Ejemplo 2: Modo Por Consumo (ByConsumption)
1. Pedro crea evento "Asado Viernes" → Modo: Por consumo → Agrega 5 amigos → Comparte links.
2. Cada amigo abre su link y va registrando lo que pide:
   - Juan: "Cerveza Kunstmann" $3.500 x2, "Hamburguesa" $8.900
   - María: "Pisco Sour" $4.500, "Ensalada César" $7.200
   - Diego agrega "Tabla de Picoteo" $12.000 marcada como **compartida** con Juan y María → Se divide en 3 ($4.000 c/u)
3. Pedro ve el dashboard en tiempo real: quién ha registrado qué y los subtotales.
4. Pedro cierra el registro → Agrega 10% propina prorrateada → Los montos finales se calculan.
5. Cada participante ve su monto final + datos bancarios → Transfiere → Marca como pagado.

---

## Plan de Implementación (Orden sugerido)

### Fase 1: Backend base
1. Crear solution con Clean Architecture (4 proyectos)
2. Configurar EF Core + Npgsql (Neon PostgreSQL) + migraciones
3. Implementar entidades (Event, Participant, PaymentInfo, ConsumptionItem) y DbContext
4. Crear repositorio y servicio de eventos
5. Exponer endpoints de evento y participantes con Minimal APIs
6. Agregar Serilog
7. Probar con Swagger

### Fase 2: Frontend base (modos Even y Custom)
1. Scaffold React + Vite + TypeScript + Tailwind
2. Implementar flujo de crear evento (formulario multi-step con selector de SplitMode)
3. Implementar vista de participante (PayPage) para modos Even/Custom
4. Implementar dashboard del organizador
5. Agregar generación de QR (`qrcode.react`)
6. Agregar funcionalidad de copiar al portapapeles

### Fase 3: Modo Por Consumo (ByConsumption)
1. Implementar endpoints de consumo en el backend (CRUD items, summary, lock)
2. Implementar ConsumptionTracker en frontend (agregar/editar/eliminar items)
3. Implementar items compartidos (SharedItemSelector)
4. Implementar ConsumptionSummary en dashboard del organizador
5. Implementar lock de registro + cálculo de propina prorrateada
6. Recalcular Amount en tiempo real al agregar/editar items

### Fase 4: Seguridad
1. Implementar EncryptionService (AES-256) para datos bancarios en BD
2. Migrar AdminCode de query string a header `X-Admin-Code`
3. Implementar rate limiting (.NET nativo) con políticas por endpoint
4. Agregar FluentValidation en todos los DTOs (formato RUT, límites, sanitización)
5. Agregar middleware de security headers (CSP, X-Frame-Options, etc.)
6. Implementar respuestas genéricas anti-enumeración
7. Configurar logging seguro (nunca loguear datos bancarios)
8. Agregar CleanupService (BackgroundService) para expirar eventos
9. Deshabilitar Swagger en producción

### Fase 5: Despliegue
1. Crear Dockerfile multi-stage (frontend build + backend build + runtime)
2. Configurar Program.cs para servir React desde wwwroot + fallback SPA
3. Agregar health check endpoint
4. Crear proyecto en [neon.tech](https://neon.tech) y obtener connection string PostgreSQL
5. Regenerar migraciones de EF Core con provider Npgsql (`dotnet ef migrations add InitialCreate` con Npgsql configurado)
6. Crear `render.yaml` sin persistent disk (la DB es externa en Neon)
7. Configurar env vars en Render: `ConnectionStrings__DefaultConnection` (Neon), `Security__EncryptionKey`, `ASPNETCORE_ENVIRONMENT`
8. Conectar repositorio GitHub → auto-deploy en push a main
9. Verificar checklist de seguridad pre-deploy
10. Opcionalmente agregar GitHub Action para CI (dotnet test)

### Fase 6: Polish
1. Integración WhatsApp (links con mensaje pre-armado)
2. PWA (manifest.json + service worker básico)
3. Responsive design final
4. Manejo de errores y estados de carga
5. Expiración automática de eventos

---

## Decisiones Técnicas para el MVP

| Decisión | Elección | Razón |
|----------|----------|-------|
| Auth | Sin auth, AdminCode por evento | Simplicidad. No necesitamos cuentas de usuario |
| DB | Neon PostgreSQL (free tier) | SQLite no persiste en contenedores efímeros de Render (el disco se pierde al reiniciar). Neon es externa, persiste independiente del contenedor, free tier 0.5 GB |
| Hosting | Render.com free tier (contenedor único) | Gratis, subdomain incluido, soporta Docker |
| Frontend | Servido desde wwwroot del mismo proyecto .NET | Un solo deploy, zero config CORS |
| Pagos | No se manejan | Evitar regulación CMF |
| QR | qrcode.react | Librería simple y confiable |
| Notificaciones | Links de WhatsApp (wa.me) | No necesita backend de notificaciones |

---

## Despliegue

### Estrategia: Contenedor único en Render.com (Free Tier)

La app se despliega como **un solo contenedor Docker** que sirve tanto la API .NET como el frontend React (build estático en `wwwroot`). Esto simplifica todo: un deploy, un URL, sin CORS.

**¿Por qué Render?**
- Free tier con subdomain incluido (ej: `vaquita.onrender.com`) → no necesitas dominio
- Soporta Docker nativamente
- HTTPS automático con Let's Encrypt
- Auto-deploy desde GitHub
- Se apaga tras 15 min de inactividad (cold start ~30s, aceptable para uso ocasional)

**Alternativas evaluadas:**
- Azure App Service F1: Muy limitado (60 min CPU/día, sin SSL custom, sin WebSockets)
- Railway: $5 créditos/mes pero se agotan rápido
- Fly.io: Buen free tier pero más complejo de configurar

### Dockerfile

```dockerfile
# Build frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Build backend
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS backend-build
WORKDIR /app
COPY src/ ./src/
RUN dotnet publish src/Vaquita.API/Vaquita.API.csproj -c Release -o /publish

# Runtime
FROM mcr.microsoft.com/dotnet/aspnet:9.0
WORKDIR /app
COPY --from=backend-build /publish ./
COPY --from=frontend-build /app/client/dist ./wwwroot
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENTRYPOINT ["dotnet", "Vaquita.API.dll"]
```

### Configuración de Render

```yaml
# render.yaml (Infrastructure as Code)
services:
  - type: web
    name: vaquita
    runtime: docker
    plan: free
    healthCheckPath: /health
    envVars:
      - key: ASPNETCORE_ENVIRONMENT
        value: Production
      - key: ConnectionStrings__DefaultConnection
        fromGroup: vaquita-secrets  # Connection string de Neon PostgreSQL
      - key: Security__EncryptionKey
        fromGroup: vaquita-secrets
```

### Configuración de Neon

1. Crear cuenta en [neon.tech](https://neon.tech) (free tier, sin tarjeta de crédito)
2. Crear un nuevo proyecto → copiar la **connection string** (formato `postgresql://user:pass@host/db?sslmode=require`)
3. En Render, ir a **Environment Groups** → crear grupo `vaquita-secrets` → agregar:
   - `ConnectionStrings__DefaultConnection` = connection string de Neon
   - `Security__EncryptionKey` = key de encriptación (mínimo 32 bytes random)
4. El contenedor de Render se conecta a Neon por red; al reiniciarse, la DB persiste

### Configuración de EF Core con Npgsql

```csharp
// En Vaquita.Infrastructure/DependencyInjection.cs
services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(configuration.GetConnectionString("DefaultConnection")));
```

```xml
<!-- En Vaquita.Infrastructure/Vaquita.Infrastructure.csproj -->
<PackageReference Include="Npgsql.EntityFrameworkCore.PostgreSQL" Version="9.0.*" />
```

### Servir React desde .NET

```csharp
// En Program.cs
app.UseDefaultFiles();
app.UseStaticFiles();

// Fallback para React Router (SPA)
app.MapFallbackToFile("index.html");
```

### Health Check Endpoint

```csharp
app.MapGet("/health", () => Results.Ok(new { status = "healthy", timestamp = DateTime.UtcNow }));
```

### CI/CD

Render hace auto-deploy al hacer push a `main` en GitHub. No se necesita pipeline adicional para el MVP. Opcionalmente agregar un GitHub Action para correr tests antes del deploy:

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-dotnet@v4
        with: { dotnet-version: '9.0' }
      - run: dotnet test src/
```

---

## Seguridad

Al ser una app pública que maneja datos bancarios (RUT, número de cuenta), la seguridad es crítica. Estas son todas las capas de protección que debe implementar:

### 1. Protección de Datos Sensibles (PaymentInfo)

```csharp
// Los datos bancarios se encriptan en reposo usando AES-256
// La key se almacena en variable de entorno, NUNCA en código
public class EncryptionService : IEncryptionService
{
    // Encriptar antes de guardar en DB: BankName, AccountNumber, Rut, Email
    // Desencriptar solo al servir al participante autorizado (por token)
}
```

**Reglas:**
- Encriptar en BD: `AccountNumber`, `Rut`, `Email`, `HolderName`
- `BankName` y `AccountType` pueden ir en texto plano (no son sensibles)
- La `EncryptionKey` se configura como env var en Render (nunca en appsettings.json)
- Los datos bancarios NUNCA aparecen en logs

### 2. Tokens y Códigos Seguros

```csharp
// AdminCode: 8 caracteres alfanuméricos criptográficamente aleatorios
// UniqueToken: 22 caracteres URL-safe (base64url de 16 bytes random)
using System.Security.Cryptography;

public static string GenerateAdminCode()
    => Convert.ToHexString(RandomNumberGenerator.GetBytes(4)); // 8 hex chars

public static string GenerateUniqueToken()
    => Convert.ToBase64String(RandomNumberGenerator.GetBytes(16))
        .Replace("+", "-").Replace("/", "_").TrimEnd('='); // URL-safe
```

**Reglas:**
- NUNCA usar `Random` o `Guid.NewGuid()` para tokens de seguridad
- AdminCode de 8 chars hex = 4.294.967.296 combinaciones posibles
- UniqueToken de 22 chars base64url = 2^128 combinaciones

### 3. Rate Limiting

```csharp
// En Program.cs — usar el rate limiter nativo de .NET 8+
builder.Services.AddRateLimiter(options =>
{
    // Global: máximo 100 requests por minuto por IP
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
        RateLimitPartition.GetFixedWindowLimiter(
            context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 100,
                Window = TimeSpan.FromMinutes(1)
            }));

    // Específico para endpoints sensibles
    options.AddFixedWindowLimiter("admin", opt =>
    {
        opt.PermitLimit = 10;          // 10 intentos
        opt.Window = TimeSpan.FromMinutes(5);  // por 5 minutos
    });

    options.AddFixedWindowLimiter("create", opt =>
    {
        opt.PermitLimit = 5;           // 5 eventos
        opt.Window = TimeSpan.FromHours(1);    // por hora por IP
    });
});
```

**Aplicar por endpoint:**
- `POST /api/events` → política `create` (anti-spam)
- `GET /api/events/{id}?adminCode=` → política `admin` (anti brute-force)
- `PATCH /api/participants/{id}/confirm` → política `admin`
- Resto → política global

### 4. Validación de Input

```csharp
// Usar FluentValidation o Data Annotations en cada DTO
public class CreateEventRequestValidator : AbstractValidator<CreateEventRequest>
{
    public CreateEventRequestValidator()
    {
        RuleFor(x => x.EventName)
            .NotEmpty().MaximumLength(100)
            .Matches(@"^[\w\s\-áéíóúñÁÉÍÓÚÑ]+$"); // Solo alfanumérico + acentos

        RuleFor(x => x.TotalAmount)
            .GreaterThan(0).LessThanOrEqualTo(99_999_999); // Límite razonable

        RuleFor(x => x.PaymentInfo.Rut)
            .Matches(@"^\d{1,2}\.\d{3}\.\d{3}-[\dkK]$") // Formato RUT chileno
            .When(x => x.PaymentInfo != null);

        RuleFor(x => x.Participants)
            .NotEmpty().Must(p => p.Count <= 50); // Máximo 50 participantes
    }
}
```

**Validar siempre:**
- Longitudes máximas en todos los campos string
- Formatos específicos: RUT, email, teléfono chileno
- Rangos numéricos: montos > 0 y con tope
- Cantidad máxima de participantes (50) e items por participante (100)
- Sanitizar HTML/scripts en campos de texto (descripción de items)

### 5. Security Headers (Middleware)

```csharp
// Middleware de headers de seguridad
app.Use(async (context, next) =>
{
    var headers = context.Response.Headers;
    headers["X-Content-Type-Options"] = "nosniff";
    headers["X-Frame-Options"] = "DENY";
    headers["X-XSS-Protection"] = "0"; // Deshabilitado, usar CSP en su lugar
    headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
    headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()";
    headers["Content-Security-Policy"] = string.Join("; ",
        "default-src 'self'",
        "script-src 'self'",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: blob:",
        "connect-src 'self'",
        "frame-ancestors 'none'"
    );
    await next();
});
```

### 6. Protección contra Enumeración

```csharp
// NUNCA revelar si un evento/token existe o no
// Siempre devolver el mismo mensaje genérico

// MAL:
if (event == null) return Results.NotFound("Evento no encontrado");
if (adminCode != event.AdminCode) return Results.Unauthorized("Código incorrecto");

// BIEN:
if (event == null || adminCode != event.AdminCode)
    return Results.Unauthorized(new { message = "Evento no encontrado o código incorrecto" });
```

**Reglas:**
- Misma respuesta para "no existe" y "código incorrecto" → impide saber si un ID de evento es válido
- Misma respuesta para token inválido y token expirado
- No incluir IDs internos en mensajes de error
- AdminCode se envía en header `X-Admin-Code` en vez de query string (no queda en logs de servidor/proxy)

### 7. Protección de AdminCode

```csharp
// Mover AdminCode de query string a header para que no quede en:
// - Logs de Render/proxy
// - Historial del browser
// - Referer headers

// Endpoint:
app.MapGet("/api/events/{id}", async (Guid id, HttpContext ctx, IEventService svc) =>
{
    var adminCode = ctx.Request.Headers["X-Admin-Code"].FirstOrDefault();
    if (string.IsNullOrEmpty(adminCode)) return Results.Unauthorized();
    // ...
});

// Frontend:
fetch(`/api/events/${id}`, {
    headers: { "X-Admin-Code": adminCode }
});
```

### 8. CORS (solo si se separa frontend)

```csharp
// Si frontend y backend están en el mismo contenedor, NO se necesita CORS.
// Si se separan, configurar estrictamente:
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("https://vaquita.onrender.com") // SOLO el dominio exacto
              .AllowAnyHeader()
              .WithMethods("GET", "POST", "PATCH", "DELETE");
    });
});
```

### 9. Protección contra CSRF y Abuse

```csharp
// Anti-forgery para mutaciones desde el frontend
builder.Services.AddAntiforgery();
app.UseAntiforgery();

// Limitar tamaño de request body
builder.WebHost.ConfigureKestrel(options =>
{
    options.Limits.MaxRequestBodySize = 1 * 1024 * 1024; // 1 MB máximo
});
```

### 10. Logging Seguro

```csharp
// NUNCA loguear datos sensibles
// Configurar destructuring seguro en Serilog
Log.Information("Evento creado: {EventId} por {OrganizerName}", event.Id, event.OrganizerName);

// NUNCA:
// Log.Information("Evento creado: {@Event}", event); ← loguearía RUT, cuenta, etc.

// Enmascarar en caso de necesidad:
public static string MaskRut(string rut) => $"****{rut[^4..]}"; // Solo últimos 4 chars
```

### 11. Expiración y Limpieza

```csharp
// Background service que elimina eventos expirados y sus datos
public class CleanupService : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        while (!ct.IsCancellationRequested)
        {
            await _eventService.DeleteExpiredEvents(); // Elimina eventos > 7 días
            await Task.Delay(TimeSpan.FromHours(6), ct);
        }
    }
}
```

### 12. Checklist de Seguridad Pre-Deploy

- [ ] EncryptionKey configurada como env var en Render (mínimo 32 bytes)
- [ ] HTTPS forzado (`app.UseHttpsRedirection()` + Render lo maneja)
- [ ] Rate limiting habilitado en todos los endpoints
- [ ] Validación de input en todos los DTOs
- [ ] Security headers configurados
- [ ] Datos bancarios encriptados en BD
- [ ] AdminCode enviado por header, no query string
- [ ] Logs no contienen datos sensibles (revisar manualmente)
- [ ] Respuestas genéricas para auth failures (anti-enumeración)
- [ ] MaxRequestBodySize configurado
- [ ] Eventos expiran y se eliminan automáticamente
- [ ] CORS deshabilitado (contenedor único) o restringido a dominio exacto
- [ ] Swagger deshabilitado en producción
- [ ] `ASPNETCORE_ENVIRONMENT=Production` en Render

---

## Convenciones de Código

- **C#**: Seguir convenciones de Microsoft, nullable reference types habilitados
- **Naming**: PascalCase para público, _camelCase para campos privados
- **API responses**: Siempre devolver DTOs, nunca entidades directamente
- **Errores**: Usar Result pattern o excepciones tipadas, no devolver strings
- **Frontend**: Functional components, hooks, nombrar archivos en PascalCase
- **Commits**: Conventional commits (feat:, fix:, refactor:, etc.)

---

## Notas Importantes

- **No manejar dinero**: La app solo muestra datos de transferencia. El dinero se mueve banco a banco entre las personas.
- **Privacidad**: Los datos bancarios solo son visibles a través de los links únicos por participante. No hay listado público.
- **Expiración**: Los eventos y todos sus datos se eliminan automáticamente tras 7 días.
- **Nombre "Vaquita"**: Referencia al chilenismo "hacer una vaquita" (juntar plata entre varios). Nombre de trabajo, puede cambiar.