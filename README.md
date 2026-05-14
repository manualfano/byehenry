# Bye Henry Dashboard — Tablero Financiero

Dashboard de gestión financiera para **Bye Henry Craft Bar** (La Plata, Argentina).
Muestra el Estado de Resultados mensual leyendo datos directamente desde Google Sheets.

## Stack

- **Next.js 14** (App Router) + TypeScript
- **Tailwind CSS** + shadcn/ui
- **Google Sheets API** — solo lectura (scope `spreadsheets.readonly`)
- **NextAuth.js** — autenticación por usuario/contraseña
- **Recharts** — gráficos
- **Vercel** — deploy

---

## Setup paso a paso

### 1. Crear proyecto en Google Cloud Console

1. Ir a [console.cloud.google.com](https://console.cloud.google.com)
2. Crear un nuevo proyecto (ej: `bye-henry-dashboard`)
3. En el menú lateral: **APIs y servicios → Biblioteca**
4. Buscar "Google Sheets API" y hacer clic en **Habilitar**

### 2. Crear Service Account (cuenta de servicio)

1. En **APIs y servicios → Credenciales**, clic en **Crear credenciales → Cuenta de servicio**
2. Nombre: `bye-henry-sheets-reader` (o cualquier nombre descriptivo)
3. En "Rol", seleccionar **Sin rol** (los permisos se dan directamente en la planilla)
4. Hacer clic en **Listo**

### 3. Generar clave JSON de la Service Account

1. En la lista de cuentas de servicio, clic en la que creaste
2. Ir a la pestaña **Claves**
3. Clic en **Agregar clave → Crear clave nueva → JSON**
4. Se descarga un archivo `.json` — **guardarlo de forma segura, nunca commitear**
5. Del archivo JSON necesitás:
   - `client_email` → valor de `GOOGLE_SHEETS_CLIENT_EMAIL`
   - `private_key` → valor de `GOOGLE_SHEETS_PRIVATE_KEY`

### 4. Compartir las planillas con la Service Account

> ⚠️ **IMPORTANTE**: Compartir solo como **Visualizador (Viewer)**, nunca como Editor.

Para cada una de las dos planillas:

1. Abrir la planilla en Google Sheets
2. Clic en **Compartir** (botón arriba a la derecha)
3. En "Agregar personas", pegar el email de la Service Account
   (ejemplo: `bye-henry-sheets-reader@tu-proyecto.iam.gserviceaccount.com`)
4. Cambiar el rol a **Visualizador**
5. Clic en **Enviar**

Repetir para:
- `Admin 2026 Henry` (hojas: Egresos, Impagas)
- `Analisis y Base de datos APP Bye Henry` (hoja: EERR )

### 5. Obtener los IDs de las planillas

El ID de cada planilla está en su URL:
```
https://docs.google.com/spreadsheets/d/[ESTE_ES_EL_ID]/edit
```

### 6. Configurar variables de entorno localmente

```bash
cp .env.example .env.local
```

Editar `.env.local` con los valores reales:

```env
ADMIN_USER=admin
ADMIN_PASSWORD=tu_contraseña
NEXTAUTH_SECRET=secreto_generado_con_openssl
NEXTAUTH_URL=http://localhost:3000

GOOGLE_SHEETS_CLIENT_EMAIL=tu-service-account@proyecto.iam.gserviceaccount.com
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----\n"

SHEET_ID_ADMIN=id_de_admin_2026_henry
SHEET_ID_EERR=id_de_analisis_y_base_de_datos
```

> **Nota sobre `GOOGLE_SHEETS_PRIVATE_KEY`**: Copiar el valor completo del campo `private_key` del JSON.
> Reemplazar los saltos de línea reales (`\n` literales del JSON) dejándolos como `\n` en el `.env`.
> En Vercel, pegar el valor tal cual sin reemplazar (Vercel lo maneja automáticamente).

Para generar `NEXTAUTH_SECRET`:
```bash
openssl rand -base64 32
```

### 7. Instalar dependencias y correr localmente

```bash
npm install
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000)

### 8. Deploy en Vercel

1. Crear repositorio en GitHub: `bye-henry-dashboard`
2. Hacer push del código
3. En [vercel.com](https://vercel.com), importar el repositorio
4. En **Settings → Environment Variables**, agregar todas las variables del `.env.example`
5. Deploy automático

---

## Estructura del proyecto

```
app/
  (auth)/login/          → Página de login
  (dashboard)/
    layout.tsx            → Layout con navbar (protegido por sesión)
    eerr/page.tsx         → Vista principal del EERR
    config/page.tsx       → Configuración y estado de conexión
  api/
    auth/[...nextauth]/   → Handler de NextAuth
    sheets/               → API route para datos de Google Sheets

components/
  eerr/
    EERRTable.tsx         → Tabla principal del EERR con colapso
    KPICards.tsx          → 4 cards de KPIs superiores
    MonthSelector.tsx     → Selector de mes
  DashboardNav.tsx        → Navbar del dashboard
  ui/                     → Componentes base (Button, Card, Select...)

lib/
  google-sheets.ts        → Cliente Sheets API (solo lectura)
  eerr-calculator.ts      → Lógica de cálculo del EERR
  cache.ts                → Caché en memoria (30 min TTL)
  auth.ts                 → Configuración NextAuth
  format.ts               → Formateo de números argentinos
  utils.ts                → Utilidades (cn)

types/
  eerr.ts                 → Interfaces TypeScript
```

---

## Datos y cálculos

### Formato de números
Todos los montos se muestran en formato argentino: `$38.665.706` (punto para miles, coma para decimales si aplica).

### Caché
Los datos de Google Sheets se cachean en memoria por **30 minutos**. El botón "Actualizar datos" en el header invalida el caché manualmente.

### Seguridad
- La app usa **scope `spreadsheets.readonly`** — imposible escribir datos
- La Service Account tiene rol **Viewer** en las planillas
- Las credenciales se almacenan en variables de entorno, nunca en código
- La sesión de usuario es JWT, sin base de datos

---

## Troubleshooting

**Error: "The caller does not have permission"**
→ Verificar que la Service Account está compartida como Viewer en ambas planillas.

**Los números salen en 0**
→ Verificar que los nombres de mes en `mesExtr` e `mesImpagas` coinciden exactamente con los valores en las hojas (ej: "abril 2026" y "Abr 26").

**Error de private key**
→ En `.env.local`, la clave debe tener `\n` literales (no saltos de línea reales). En Vercel, pegar el valor completo con saltos reales y Vercel lo maneja.
