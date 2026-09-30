# Menú Digital

Aplicación web para publicar el menú de **un solo restaurante o negocio de comida**. El cliente lo consulta desde su teléfono mediante una URL pública o un código QR, y el restaurante lo administra desde un panel protegido sin tocar código.

El menú **no depende de fotografías**: la presentación se logra con tipografía, colores, iconos, separadores, etiquetas y estados de disponibilidad.

## Alcance

**Incluye:** categorías, platos, precios, horarios informativos, etiquetas, personalización de colores, usuarios con roles, dashboard, menú público con búsqueda y código QR.

**No incluye (a propósito):** multiempresa, múltiples restaurantes, sucursales, facturación, pedidos online, pagos ni delivery.

---

## Tecnologías

| Tecnología | Uso |
|---|---|
| Next.js 15 (App Router) | Framework, renderizado en servidor y Server Actions |
| TypeScript | Tipado estricto |
| Tailwind CSS v4 | Estilos, conectados a variables CSS para los temas |
| SQLite | Base de datos en un solo archivo |
| Prisma 6 | ORM y migraciones (fijado a la versión 6) |
| Zod | Validación de formularios y acciones |
| bcryptjs | Cifrado de contraseñas |
| jose | Sesiones firmadas (JWT en cookie `httpOnly`) |
| lucide-react | Iconos |
| qrcode | Generación del código QR |
| server-only | Evita que código del servidor llegue al navegador |
| next/font | Tipografías Inter y Playfair Display servidas desde el propio dominio |
| tsx | Ejecuta el script de semilla (`seed`) |

---

## Funciones

### Menú público (`/menu`)
- Pensado primero para móvil; funciona en Android, iPhone, tablet y escritorio.
- Cabecera con nombre y eslogan del negocio; pie con teléfono y dirección.
- Barra fija con buscador y categorías. Al tocar una categoría la página baja hasta ella, y la categoría activa se resalta al hacer scroll.
- Búsqueda por nombre, descripción y etiqueta, sin distinguir mayúsculas ni tildes.
- Estado **Agotado** (plato atenuado, precio tachado).
- Etiquetas con color e icono.
- Horario informativo: `Disponible de 11:00 AM hasta 3:00 PM`.
- Colores tomados de Configuración; el texto sobre el color principal y secundario se ajusta solo (blanco u oscuro) para que siempre se lea.

### Panel de administración (`/admin`)
- **Dashboard:** total de categorías y platos, platos visibles y ocultos, aviso de agotados y últimos 5 platos modificados.
- **Categorías:** crear, editar, ocultar/mostrar, reordenar con flechas, elegir icono y eliminar. No se puede eliminar una categoría que tenga platos.
- **Platos:** precio, categoría, descripción, etiquetas, horario informativo, visible/oculto, disponible/agotado, reordenar dentro de la categoría, buscador y filtro por categoría.
- **Etiquetas:** crear las propias, elegir color e icono, activar/desactivar, reordenar y eliminar. Son opcionales.
- **Código QR:** generar, descargar como PNG de 1024 px y copiar el enlace.
- **Configuración (solo ADMIN):** datos del negocio, moneda, interruptor global de horarios y 5 colores con vista previa en vivo, 4 paletas listas, restauración de valores predeterminados y avisos de bajo contraste.
- **Usuarios (solo ADMIN):** crear, editar, cambiar rol, activar/desactivar, restablecer contraseña y eliminar.
- Avisos (toasts): verde al crear/editar, rojo al eliminar o ante errores.

### Roles

| Sección | ADMIN | USER |
|---|:---:|:---:|
| Dashboard | ✅ | ✅ |
| Categorías | ✅ | ✅ |
| Platos | ✅ | ✅ |
| Etiquetas | ✅ | ✅ |
| Código QR | ✅ | ✅ |
| Configuración | ✅ | ❌ |
| Usuarios | ✅ | ❌ |

---

## Reglas de negocio importantes

- **El horario es solo informativo.** Nunca controla la visibilidad de un plato. Un plato muestra su horario únicamente si tiene el suyo activo **y** el interruptor global (`showSchedules`) está encendido.
- **Visibilidad en el menú público:** un plato se muestra si es visible **y** su categoría es visible. Una categoría sin platos visibles no aparece.
- **Agotado no es oculto:** un plato agotado sigue visible con su estado.
- **Precios en centavos** (`Int`) para evitar errores de decimales. Se aceptan `350`, `350.50` y `350,50`. Máximo 1,000,000.00.
- **Etiquetas desactivadas:** no se muestran ni se pueden asignar, pero los platos conservan la relación; al reactivarlas vuelven a aparecer.
- **Configuración de fila única** (`id = 1`): no existe multiempresa.

---

## Estructura del proyecto

```
menu-digital/
├─ prisma/
│  ├─ schema.prisma            Modelo de datos
│  ├─ seed.ts                  Datos iniciales
│  └─ migrations/
├─ public/
├─ src/
│  ├─ app/
│  │  ├─ login/                Inicio de sesión
│  │  ├─ admin/                Panel (dashboard, categorias, platos, etiquetas, qr, configuracion, usuarios)
│  │  ├─ menu/                 Menú público
│  │  ├─ api/health/           Comprobación de salud
│  │  ├─ icon.svg              Icono de la pestaña
│  │  ├─ robots.ts, sitemap.ts
│  │  ├─ layout.tsx, globals.css
│  │  └─ page.tsx              Redirige a /menu
│  ├─ components/              Toast, iconos, etiquetas, layout del panel
│  └─ lib/                     db, auth, session, roles, theme, price, time, menu-data, site-url, rate-limit...
├─ .env                        Variables locales (NO se sube a Git)
├─ .env.example
└─ next.config.ts
```

---

## Modelo de datos

| Modelo | Campos principales |
|---|---|
| `User` | name, email (único), passwordHash, role (`ADMIN`/`USER`), isActive, sessionVersion |
| `Category` | name, description, icon, sortOrder, isVisible |
| `Dish` | name, description, priceCents, categoryId, isVisible, isAvailable, showSchedule, scheduleFrom, scheduleTo, sortOrder |
| `Tag` | name (único), color, icon, isActive, sortOrder (relación muchos a muchos con `Dish`) |
| `Settings` | restaurantName, slogan, phone, address, currencySymbol, showSchedules, 5 colores |

---

## Requisitos

- Node.js 20 o superior (probado con Node 24)
- npm
- Git (opcional)

---

## Instalación en local

```powershell
# 1. Instalar dependencias
npm install

# 2. Crear el archivo de variables
copy .env.example .env      # Windows (PowerShell)
# cp .env.example .env      # macOS / Linux

# 3. Editar .env (ver la sección siguiente)

# 4. Crear la base de datos y aplicar migraciones
npx prisma migrate dev

# 5. Cargar los datos iniciales
npx prisma db seed

# 6. Arrancar
npm run dev
```

Abre `http://localhost:3000`. Te llevará a `/menu`. El panel está en `/login`.

### Variables de entorno (`.env`)

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | Ruta de SQLite. Local: `file:./dev.db` |
| `AUTH_SECRET` | Cadena aleatoria de **mínimo 32 caracteres** para firmar sesiones |
| `ADMIN_EMAIL` | Correo del administrador inicial (en minúsculas) |
| `ADMIN_PASSWORD` | Contraseña del administrador inicial |
| `NEXT_PUBLIC_SITE_URL` | Dirección pública del sitio (la usan el QR, `robots` y `sitemap`) |
| `DEMO_USER_EMAIL` / `DEMO_USER_PASSWORD` | Opcionales. Crean un usuario de prueba con rol USER. **No usar en producción** |

Generar un `AUTH_SECRET`:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Qué crea el seed

Configuración predeterminada, el administrador, el usuario de prueba (si está definido), 7 etiquetas (Popular, Nuevo, Picante, Vegetariano, Vegano, Especial, Recomendado) y una categoría y un plato de ejemplo. Es seguro ejecutarlo varias veces: no duplica datos.

---

## Comandos

### npm

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run dev -- -H 0.0.0.0` | Desarrollo accesible desde otros dispositivos de la red (para probar en el teléfono) |
| `npm run build` | Compila para producción |
| `npm run start` | Sirve la versión compilada |
| `npm run lint` | Revisa el código con ESLint |
| `npm run typecheck` | Comprueba los tipos de TypeScript |
| `npm run db:migrate` | Equivale a `prisma migrate dev` |
| `npm run db:seed` | Equivale a `prisma db seed` |
| `npm run db:studio` | Abre Prisma Studio (visor de la base de datos) |
| `npm audit --omit=dev` | Vulnerabilidades que afectan a producción |

### Prisma

| Comando | Qué hace |
|---|---|
| `npx prisma generate` | Regenera el cliente de Prisma |
| `npx prisma migrate dev --name nombre` | Crea y aplica una migración (solo desarrollo) |
| `npx prisma migrate deploy` | Aplica migraciones pendientes (producción) |
| `npx prisma migrate reset` | Borra la base y vuelve a crearla con el seed (**destruye los datos**) |
| `npx prisma db seed` | Ejecuta `prisma/seed.ts` |
| `npx prisma studio` | Visor de datos |
| `npx prisma --version` | Debe mostrar `6.x.x` |

### Instalación original del proyecto

```powershell
npx create-next-app@latest menu-digital --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
npm install @prisma/client@6 zod lucide-react bcryptjs jose qrcode server-only
npm install -D prisma@6 tsx @types/bcryptjs @types/qrcode
npx prisma init --datasource-provider sqlite
```

---

## Seguridad

- Contraseñas cifradas con bcrypt (coste 12). Longitud de 8 a 72 caracteres, con letra y número.
- Sesión en cookie `httpOnly`, `sameSite=lax` y `secure` en producción, válida 7 días.
- **El rol no viaja en la cookie:** se lee de la base de datos en cada petición. Un cambio de rol o una desactivación surte efecto al instante.
- **Cambiar la contraseña de un usuario cierra todas sus sesiones** (`sessionVersion`).
- Cada página y cada Server Action valida sesión y rol en el servidor, no solo se oculta el enlace.
- Nunca puede quedar el sistema sin un ADMIN activo, y nadie puede desactivarse, eliminarse ni quitarse el rol a sí mismo.
- Sin registro público: solo un ADMIN crea usuarios.
- Bloqueo de 15 minutos tras 5 intentos fallidos de login por correo (en memoria).
- La respuesta del login no revela si falló el correo o la contraseña.
- Cabeceras de seguridad: `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, HSTS en producción y una CSP limitada (`frame-ancestors`, `form-action`, `base-uri`, `object-src`).
- `/admin` y `/login` no se indexan en buscadores.

---

## Despliegue en producción

SQLite necesita **disco persistente**, por lo que no sirve un hosting sin estado como Vercel. Opciones válidas: un VPS con Ubuntu, o Railway, Render o Fly.io con volumen persistente.

### Resumen para un VPS con Ubuntu

```bash
sudo apt update && sudo apt install -y git sqlite3 caddy
sudo npm install -g pm2
sudo mkdir -p /var/lib/menu-digital /var/backups/menu-digital
sudo chown -R $USER /var/lib/menu-digital /var/backups/menu-digital

git clone TU-REPOSITORIO menu-digital && cd menu-digital
cp .env.example .env && nano .env
```

`.env` de producción:

```env
DATABASE_URL="file:/var/lib/menu-digital/prod.db"
AUTH_SECRET="(uno nuevo, distinto al local)"
ADMIN_EMAIL="correo-real@dominio.com"
ADMIN_PASSWORD="una-clave-larga-y-unica"
NEXT_PUBLIC_SITE_URL="https://midominio.com"
```

```bash
npm ci
npx prisma migrate deploy
npx prisma db seed
npm run build
pm2 start npm --name menu-digital -- start
pm2 save && pm2 startup
```

Caddy (`/etc/caddy/Caddyfile`) obtiene y renueva el certificado HTTPS solo:

```
midominio.com {
    reverse_proxy localhost:3000
}
```

Puntos a tener en cuenta:
- Ejecuta PM2 en **una sola instancia** (no cluster): el límite de intentos de login está en memoria.
- `NEXT_PUBLIC_SITE_URL` se incorpora al compilar; si cambia, vuelve a ejecutar `npm run build`.
- La base de datos debe existir **antes** de `npm run build`, porque `/menu` se genera en la compilación.
- Nunca uses `migrate dev` en producción, solo `migrate deploy`.
- Borra desde el panel la categoría y el plato de ejemplo, y cambia la contraseña del administrador.

### Actualizar

```bash
/opt/menu-digital/backup.sh
git pull && npm ci
npx prisma migrate deploy
npm run build && pm2 restart menu-digital
```

### Respaldos

Copiar el `.db` con la app en marcha puede dejarlo inconsistente; usa `.backup` de SQLite.

`/opt/menu-digital/backup.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail
DB="/var/lib/menu-digital/prod.db"
DIR="/var/backups/menu-digital"
sqlite3 "$DB" ".backup '$DIR/menu-$(date +%F-%H%M).db'"
find "$DIR" -name 'menu-*.db' -mtime +14 -delete
```

Programado a diario con `crontab`: `0 3 * * * /opt/menu-digital/backup.sh`. Copia además los respaldos fuera del servidor (por ejemplo con `scp`) al menos una vez por semana. Para restaurar: `pm2 stop menu-digital`, copia el respaldo sobre `prod.db` y `pm2 start menu-digital`.

### Comprobación de salud

`GET /api/health` responde `{"status":"ok"}` si el sitio y la base de datos funcionan (503 si no). Conéctalo a un monitor como UptimeRobot.

---

## Código QR

En `/admin/qr` escribe el dominio (por ejemplo `https://midominio.com`); el sistema agrega `/menu`. Antes de imprimir:

- Genera el QR con el **dominio definitivo**, no con `localhost` ni una IP local (la página avisa).
- Tamaño mínimo 3 × 3 cm; en mesas, 5 × 5 cm o más.
- Pruébalo con Android y con iPhone.
- Si cambias de dominio hay que generar y reimprimir el QR. Los platos, precios y colores se actualizan solos.

---

## Problemas frecuentes

| Problema | Solución |
|---|---|
| `PrismaClient` no exportado, o `migrate` no existe | Estás con Prisma 7 u 8. Usa `npm install @prisma/client@6` y `npm install -D prisma@6`. Borra `prisma.config.ts` y `src/generated` si existen. Ejecuta los comandos **dentro** de la carpeta del proyecto |
| `sessionVersion` no existe en el tipo | Ejecuta `npx prisma migrate dev` y `npx prisma generate`, y reinicia el servidor de TypeScript |
| `EPERM ... query_engine-windows.dll.node` | Cierra `npm run dev` y Prisma Studio; repite `npx prisma generate` |
| `Missing <html> and <body> tags` | `src/app/layout.tsx` debe contener `<html>` y `<body>` |
| `Top-level await` en el seed | Todo el código con `await` debe estar dentro de `main()` |
| `No se encuentra el módulo "@/lib/..."` | El archivo está en una carpeta equivocada. Debe estar en `src/lib/` |
| `Unknown at rule @theme` en VS Code | Es solo el validador CSS. Añade `{"css.lint.unknownAtRules": "ignore"}` en `.vscode/settings.json` |
| Error de "execution policy" en PowerShell | `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned` |
| Desde el teléfono los botones no responden en desarrollo | Añade `allowedDevOrigins: ["192.168.*.*"]` en `next.config.ts` y reinicia |
| Con `npm run start` no se mantiene el login desde el teléfono por `http://IP` | La cookie es `secure` en producción. Prueba el login desde la computadora o con HTTPS |
| El favicon no cambia | Borra `src/app/favicon.ico`, elimina `.next` y refresca con `Ctrl+F5` |
| Aviso `scroll-behavior: smooth` en consola | Añade `data-scroll-behavior="smooth"` a `<html>` en `layout.tsx` |
| Acciones del panel fallan con "origen no permitido" tras publicar | Añade `experimental: { serverActions: { allowedOrigins: ["midominio.com"] } }` en `next.config.ts` |

Regla práctica: todos los comandos `npm` y `npx` se ejecutan dentro de la carpeta que contiene `package.json`.

---

## Limitaciones conocidas

- El bloqueo por intentos fallidos está en memoria y se reinicia al reiniciar el servidor. Suficiente para un solo servidor.
- Sin logo del restaurante (subir imágenes exige decidir dónde almacenarlas).
- Las confirmaciones de eliminar usan el cuadro nativo del navegador.
- El orden se cambia con flechas, sin arrastrar y soltar.
- Sin registro de auditoría (quién cambió qué).
- No hay política CSP completa con `script-src`, porque exigiría *nonces* y quitaría la caché al menú público.
- El proyecto usa Prisma 6; la migración a Prisma 7 requiere un adaptador para SQLite y un archivo `prisma.config.ts`.

## Ideas futuras

Logo en la cabecera, diálogos de confirmación propios, arrastrar y soltar, registro de cambios, QR con colores de marca, migración a Prisma 7 y respaldos automáticos a almacenamiento externo.

---

## Etapas de desarrollo

1. Base del proyecto, Prisma, modelo de datos y temas
2. Login, roles y layout del panel
3. CRUD de categorías
4. CRUD de platos
5. Etiquetas configurables
6. Configuración (solo ADMIN)
6.5. Gestión de usuarios (solo ADMIN)
7. Menú público
8. Dashboard
9. Código QR
10. Optimización y producción
