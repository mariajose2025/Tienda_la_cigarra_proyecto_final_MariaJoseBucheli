#  Tienda La Cigarra — Sistema de Gestión de Tienda de Barrio

Sistema web de gestión para tienda de barrio desarrollado con **Svelte + Vite + Firebase** (Firestore) y desplegado en **Netlify**.

---

##  Cómo ejecutar el proyecto

```bash
npm install        # instala las dependencias
npm run dev        # modo desarrollo (Vite dev server)
npm run build      # build de producción (genera la carpeta /dist)
npm run preview    # previsualiza el build de producción
```

### Variables de entorno

Crea un archivo `.env` en la raíz con la configuración de Firebase:

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

---

##  Arquitectura del proyecto

```
src/
├── components/
│   └── common/          # Componentes reutilizables
│       ├── Navbar.svelte        # Menú de navegación por secciones
│       ├── Footer.svelte
│       ├── Button.svelte        # Botón con variantes
│       ├── Modal.svelte         # Ventana modal
│       ├── FormField.svelte     # Campo de formulario
│       ├── Toast.svelte         # Notificación individual (páginas públicas)
│       ├── ToastContainer.svelte# Contenedor global de notificaciones
│       ├── ExportButton.svelte  # Exportación a Excel
│       └── InvoiceModal.svelte  # Factura imprimible / PDF
├── routes/              # Páginas del sistema (una por módulo)
├── services/            # Capa de acceso a Firebase
├── stores/              # Stores de Svelte (estado global)
│   ├── app.js           # Configuración del sistema (IVA, tienda, umbrales)
│   ├── auth.js          # Sesión y usuario actual
│   └── toast.js         # Sistema global de notificaciones
└── utils/               # Utilidades
    ├── iva.js           # Cálculo de IVA y moneda (COP)
    ├── permissions.js   # Permisos por rol
    ├── exportUtils.js   # Exportación a Excel/JSON
    └── alerts.js        # Alertas de stock y vencimiento
```

---

##  Roles y permisos

| Rol | Acceso |
| --- | --- |
| **Administrador** | Acceso total: inventario, operaciones, contabilidad, usuarios, roles, configuración y backup |
| **Cajero** | Registro de ventas, compras, caja, clientes y fiados |
| **Inspector** | Vista de reportes, inventario y consultas (sin crear/editar) |

- El rol se guarda en el documento del usuario como campo `roleName` (texto) y se expone en `$currentUser.roleName`.
- La verificación de permisos está centralizada en `src/utils/permissions.js`.
- El correo `admin@cinar.com` funciona como administrador global independiente del rol asignado.

---

##  Módulos del sistema

### General
- **Dashboard** — Resumen general con métricas, tarjetas y accesos rápidos según el rol.

### Inventario
- **Productos** — CRUD de productos con stock, precio de venta, vencimiento y semáforo de alertas (stock/vencimiento).
- **Clasificación** — Categorías de productos.
- **Proveedores** — CRUD de proveedores.

### Operaciones
- **Compras** — Registro de compras a proveedores con actualización automática de stock.
- **Ventas** — Registro de ventas con detalle de productos, IVA, métodos de pago (Efectivo, Tarjeta, Nequi, Daviplata, **Fiado**) y **generación de factura**.
- **Clientes** — CRUD de clientes con cédula y días máximos de pago.
- **Fiados** — Créditos a clientes (pendiente, pagado, vencido).

### Contabilidad
- **Caja** — Apertura/cierre de caja y movimientos de ingreso/egreso.
- **Movimientos** — Historial de movimientos de caja.
- **Ganancias** — Reporte de utilidades por período.
- **Cuentas por Cobrar** — Fiados pendientes de cobro.
- **Gastos** — Registro de gastos.
- **Valor del Inventario** — Costo del inventario en bodega.
- **Flujo de Caja** — Resumen de entradas y salidas.
- **Ventas (reporte)** — Reporte de ventas por rango de fechas.

### Administración
- **Usuarios** — Gestión de usuarios y asignación de roles.
- **Roles** — Asignación/remoción de roles.
- **Configuración** — Umbrales de alerta, IVA y **datos de la tienda para la factura**.
- **Copia de Seguridad** — Exportación completa a Excel/JSON e importación/restauración.

---

##  Factura de venta

Al registrar una venta se genera automáticamente una **factura** con:

- Logo, nombre, dirección, teléfono y NIT de la tienda (configurables en **Configuración → Datos de la Tienda**).
- Número de factura, fecha y hora, atendido por (cajero).
- Cliente (solo en ventas a **fiado**).
- Detalle de productos (cantidad, precio, subtotal).
- Subtotal, IVA y total.
- Método de pago.
- En ventas a fiado: etiqueta **"SALDO PENDIENTE POR PAGAR"**.
- Botones **Imprimir** y **Descargar PDF** (usa el diálogo de impresión del navegador).

Las ventas a fiado además:
- Crean automáticamente el crédito en el módulo de **Fiados**.
- La factura queda registrada en **Ventas → Ver factura** (botón 🧾 en el historial).

---

##  Sistema de notificaciones (toasts)

Todas las páginas usan el sistema global de notificaciones (`src/stores/toast.js` + `ToastContainer.svelte`):

| Tipo | Color | Ejemplo |
| --- | --- | --- |
| `success` | Verde | "Venta registrada exitosamente", "Categoría creada" |
| `warning` | Amarillo | "Completa todos los campos", "Selecciona un cliente" |
| `error` | Terracota | "Stock insuficiente", "Error al guardar" |
| `info` | Azul | "Configurando usuario administrador..." |

---

##  Exportación a Excel

Todos los módulos de listado/reportes tienen botón **Exportar** que genera un archivo `.xlsx` con los datos de ese módulo (productos, ventas, compras, fiados, caja, gastos, reportes, etc.). Además existe un **backup completo** en Copia de Seguridad.

---

##  Correcciones y funcionalidades agregadas

> Historial de cambios del proyecto.

### ✅ Sistema de roles y permisos
- Creación de roles **Administrador / Cajero / Inspector** con permisos granulares por módulo.
- Control de acceso por ruta según el rol.
- Usuario administrador global (`admin@cinar.com`).
- Página de **Roles** para asignar/quitar rol a usuarios.

### ✅ Contabilidad y reportes
- **Caja** con apertura/cierre y movimientos automáticos (venta en efectivo, cobro de fiado).
- **Movimientos** de caja con tipo (ingreso/egreso) y origen (venta, compra, gasto, fiado).
- Reportes de **Ganancias, Flujo de Caja, Ventas, Cuentas por Cobrar, Gastos y Valor del Inventario** con filtros por rango de fechas.
- Registro de **Gastos** con categoría y actualización del flujo de caja.

### ✅ Copia de seguridad
- **Exportación completa** de todas las colecciones a un único Excel con una hoja por módulo.
- Exportación a **JSON**.
- **Importación/restauración** desde el archivo de respaldo.

### ✅ Exportación a Excel por módulo
- Botón **Exportar** en cada módulo de listado y reporte usando `SheetJS`.
- Normalización de filas según el módulo para un formato consistente.

### ✅ Rediseño de interfaz (UX/UI)
- **Navbar** rediseñado con menú desplegable por secciones, estable en escritorio (hover + clic) y acordeón en móvil.
- **Dashboard** con tarjetas, badge de rol y accesos rápidos.
- **Tokens CSS globales** (`--green`, `--gold`, `--shadow-sm/md`, `--radius`, etc.) en `src/app.css`.
- Tarjetas con borde superior de color, sombras con tokens y hover con elevación.
- Estados vacíos con borde punteado.
- Botones de icono consistentes (editar verde, eliminar terracota).
- Foco accesible en verde en todos los campos.

### ✅ Unificación de estilos
- Unificación de los estilos de todas las páginas de listado/reportes a los tokens globales:
  - Cabeceras de página en verde oscuro con icono.
  - Tablas con `border` + `shadow` token.
  - KPIs con borde superior de 3px.
  - Estados vacíos y focus consistentes.

### ✅ Sistema global de notificaciones (toasts)
- Creación del store `src/stores/toast.js` y `ToastContainer.svelte` montado en `App.svelte`.
- Migración de **todas las páginas del panel** del toast local al sistema global.

### ✅ Correcciones de accesibilidad (A11y)
- Etiquetas `Desde`/`Hasta` de los reportes con `for`/`id`.
- Tarjeta de fiado clickeable accesible (role="button", Enter/Espacio, tabindex).
- Secciones del Navbar con `role="group"`.

### ✅ Optimización de rendimiento
- **Code-splitting** con `manualChunks` en `vite.config.js`: el bundle principal bajó de **~1193 KB a ~335 KB** separando Firebase, SheetJS (Excel) y dependencias comunes en chunks independientes.

### ✅ Factura de venta (nuevo)
- Componente `InvoiceModal.svelte` con factura imprimible y descargable.
- Integración del **fiado** dentro del registro de ventas (método de pago "Fiado" + cliente).
- Datos de la tienda configurables (nombre, dirección, teléfono, NIT).

---

##  Despliegue

- Repositorio: `https://github.com/mariajose2025/Tienda_la_cigarra_proyecto_final_MariaJoseBucheli`
- Sitio: `https://phenomenal-moxie-1a6ac0.netlify.app/#/`
- Rama de producción: `main`
- El proyecto usa SPA (`svelte-spa-router`), por lo que la URL de la tienda usa `/#/`.

---

##  Dependencias principales

| Paquete | Uso |
| --- | --- |
| `svelte` | Framework de UI |
| `vite` | Bundler y dev server |
| `svelte-spa-router` | Enrutamiento de SPA |
| `firebase` | Autenticación y Firestore |
| `xlsx` (SheetJS) | Exportación a Excel |
