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

### ✅ Corrección: pantalla atascada en "Cargando sistema..."
- **Problema:** al abrir la app, la pantalla de carga podía quedarse indefinidamente cuando Firestore tardaba o no respondía (lentitud de red, reglas de seguridad o bloqueos). La razón era que `appReady` solo se activaba **después** de que las consultas iniciales a Firebase (`getDocs` de usuarios y `getSettings`) terminaban; si alguna nunca resolvía, la app se quedaba en "Cargando sistema..." para siempre.
- **Solución:** se agregó un **timeout de seguridad** en `App.svelte` que activa `appReady` a los 400 ms de forma independiente a Firebase. Las cargas iniciales (estado de configuración y settings) ahora corren **en paralelo** sin bloquear la pantalla. Así, si Firebase falla o tarda, la app muestra su contenido (login/inicio) en lugar de quedarse cargando.
- **Archivos:** `src/App.svelte`.

---

### ✅ Corrección: página en blanco al cargar la app
- **Problema:** al entrar al sitio, los botones del Home (Iniciar Sesión / Conócenos) aparecían brevemente y desaparecían, quedando solo el Navbar (logo) y el Footer. La causa era que `App.svelte` usaba **tres `<Router>` separados** dentro de bloques `{#if needsSetup}...{:else if canAccessAuth}...{:else}`. Cuando `canAccessAuth` o `needsSetup` cambiaban (al resolver la autenticación de Firebase o la consulta de usuarios), Svelte **destruía** el Router activo y **creaba uno nuevo**. Durante ese ciclo de destrucción/recreación, el contenido del Router quedaba en `null` (vacío), produciendo la pantalla en blanco.
- **Solución:** se reemplazaron los tres Routers condicionales por **un solo `<Router>`** con todas las rutas combinadas (públicas + autenticadas + setup + fallback `'*'`). Las redirecciones según el estado de autenticación ahora se manejan en un bloque reactivo `$:` con `push()`, sin destruir/recrear el Router. Esto garantiza que el Router siempre renderiza un componente y nunca queda vacío.
- **Archivos:** `src/App.svelte`.

---

### ✅ Corrección: crash al cargar la app con sesión activa (`Cannot read properties of undefined (reading 'startsWith')`)
- **Problema:** en consola aparecía `TypeError: Cannot read properties of undefined (reading 'startsWith')` dentro de `Array.some`. El Navbar calculaba la ruta activa con `$: path = $location.path`, pero el store `location` de `svelte-spa-router` devuelve **un string** (ej: `'/'`, `'/admin/ventas'`), no un objeto. Por eso `path` era **siempre `undefined`** y, en cuanto el usuario autenticado se renderizaba el menú de administración, `isSectionActive()` ejecutaba `path.startsWith(...)` sobre `undefined` y **crasheaba toda la aplicación** (los botones aparecían brevemente y desaparecían).
- **Solución:** `$: path = $location || '/'` (el store ya es el string de la ruta). Se agregó el fix en `src/components/common/Navbar.svelte`.
- **Archivos:** `src/components/common/Navbar.svelte`.

---

### ✅ Corrección: menús desplegables del Navbar no abrían al hacer clic
- **Problema:** al hacer clic en los títulos de sección (General, Inventario, Operaciones, Contabilidad, Administración, Cuenta), el menú desplegable **no se abría** (tampoco con hover en escritorio). La flecha de caret tampoco rotaba. Los enlaces del Dashboard sí funcionaban.
- **Causa raíz:** Svelte **no rastrea dependencias a través de llamadas a funciones** en el markup. Las clases usaban `class:open={shouldShow('general')}` y `class:active={isSectionActive('general')}`: el compilador calculaba esas clases **una sola vez al montar** y jamás las volvía a evaluar cuando cambiaban `pinned`/`hovered`/`path` (verificado en el bundle compilado: el update `p()` del Navbar no actualizaba las clases `open`).
- **Solución:** los estados derivados se computan ahora con variables reactivas que referencian directamente a sus dependencias: `$: openMap = { general: pinned.general || hovered === 'general', ... }` y `$: activeMap = Object.fromEntries(...)` con el path. El markup usa `class:open={openMap.general}`, `class:rotated={openMap.general}` y `class:active={activeMap.general}`.
- **Archivos:** `src/components/common/Navbar.svelte`.

---

### ✅ Seguridad: la sesión ya no persiste al cerrar el navegador
- **Problema:** al volver a abrir la página, la app **iniciaba sesión automáticamente** con la cuenta de admin sin pedir credenciales.
- **Causa:** Firebase guardaba la sesión en `localStorage` (persistencia por defecto) y `onAuthStateChanged` la restauraba en cada visita. No había código de auto-login.
- **Solución:** `setPersistence(auth, browserSessionPersistence)` al iniciar el listener de autenticación: la sesión vive solo mientras el navegador está abierto. Al abrir la página de nuevo se exige iniciar sesión.
- **Archivos:** `src/services/authService.js`.

---

### ✅ Corrección: cajero sin permisos (no podía vender) y botón de factura
- **Problema:** el usuario con rol Cajero **no podía registrar ventas, clientes ni fiados** (veía "Vista previa — No tienes permiso para registrar ventas").
- **Causa raíz:** al editar un usuario en **Usuarios** sin seleccionar rol en el modal, `saveUser` escribía `roleName: ''` y **borraba el rol del usuario**. Sin `roleName` ningún permiso aplica (`canView`/`canCreate` devuelven `false`). Se verificó en Firestore: el documento del usuario cajero existía pero sin `roleName`.
- **Soluciones aplicadas:**
  - `Users.svelte`: al guardar sin rol seleccionado se **conserva el rol actual** en vez de borrarlo.
  - `authService.js`: al iniciar sesión, si el documento no tiene rol, se **restaura el rol por defecto** (`Administrador` para `admin@cinar.com`, `Cajero` en el resto) — el cajero recupera sus permisos automáticamente en el próximo ingreso.
  - `Sales.svelte`: el botón de factura en "Últimas Ventas" ahora dice **"Ver Factura"** (antes era solo un icono poco visible).
- **Archivos:** `src/routes/Users.svelte`, `src/services/authService.js`, `src/routes/Sales.svelte`.

### ✅ Corrección: la factura no abría (crash silencioso al hacer clic)
- **Problema:** al hacer clic en "Ver Factura" (o al terminar una venta) **no pasaba nada**: el modal nunca aparecía.
- **Causa raíz (verificada con CDP):** al crear el `InvoiceModal` se lanzaba `TypeError: Cannot read properties of undefined (reading 'name')`. El documento `settings/config` en Firestore **no tenía el campo `store`** (solo `alertThresholds` e `ivaPercentage`), por lo que `$storeInfo` valía `undefined` y la factura hacía `$storeInfo.name` → excepción durante el render → modal invisible.
- **Soluciones aplicadas:**
  - `stores/app.js`: `storeInfo` ahora **nunca es `undefined`** — mezcla los valores por defecto con los del documento (`{...DEFAULT, ...(settings.store || {})}`); lo mismo para `alertThresholds` e `ivaPercentage`.
  - `settingsService.js`: `getSettings()` **repara el documento** — si faltan campos (`store`, etc.), los rellena con los valores por defecto y los persiste una sola vez (`merge`).
- **Verificado:** clic en "Ver Factura" → modal abre con nombre, dirección, teléfono y NIT de la tienda; **cero errores de consola**.
- **Archivos:** `src/stores/app.js`, `src/services/settingsService.js`.

### ✅ Mejora: buscador de cliente en Ventas (por nombre o cédula)
- El campo de cliente ahora es un **buscador en vivo**: escribe nombre o cédula y aparece la lista de coincidencias; al elegir, se muestra el cliente seleccionado con su cédula (botón para quitarlo).
- **Obligatorio en todas las ventas** (no solo fiado): aparece como primer campo del formulario ("Cliente * — ¿a quién le vendes?") y la venta no se registra sin cliente seleccionado — muestra "Vendiendo a: Nombre — CC cédula".
- Al guardar la venta se registra `clientId`, `clientName` y `clientCedula` en el documento de la venta, y el **nombre del cliente aparece en el historial** de "Últimas Ventas".
- **Archivo:** `src/routes/Sales.svelte`.

### ✅ Mejora: precio automático e inmutable en Ventas + rediseño del panel
- El **precio se autocompleta automáticamente** al seleccionar el producto (desde `salePrice` del inventario que configura el administrador) y queda **bloqueado con candado** (`readonly`): el cajero ya no digita precios.
- Cada fila muestra el **subtotal en vivo** (cantidad × precio) y el total se actualiza al instante.
- El panel de Ventas ahora tiene **tarjetas de resumen**: ventas de hoy, ventas del mes y fiado por cobrar (monto + número de tickets).
- El historial de "Últimas Ventas" usa **etiquetas de color por método de pago** (Efectivo, Tarjeta, Nequi, Daviplata, Fiado).
- **Archivo:** `src/routes/Sales.svelte`.

### ✅ Restricción de registro: producto + cliente obligatorios
- **No se puede registrar una venta sin** (1) al menos un producto seleccionado ("Agrega al menos un producto") y (2) un cliente seleccionado ("Selecciona el cliente para la venta"). En ambos casos se bloquea el registro y se muestra la notificación correspondiente.

### ✅ Rediseño: formulario a la izquierda + vista previa de factura en vivo
- La página de Ventas ahora usa **dos columnas**: a la izquierda el formulario de registro (más angosto) y a la derecha la **vista previa de la factura en vivo**, que se actualiza mientras se llena: productos, cantidades, precios automáticos, cliente, método de pago (si es fiado muestra "RECIBO / FIADO"), subtotal, IVA y total.
- **Responsiva**: en pantallas menores a 1100 px las dos columnas se apilan (formulario arriba, factura debajo).
- **Archivo:** `src/routes/Sales.svelte`.

### ✅ Fiados: se crean solo desde la venta
- Se eliminó el botón **"Nuevo Fiado"** y su modal de creación manual: el crédito se genera **automáticamente** al registrar una venta con método de pago **Fiado (Crédito)** desde Ventas.
- La página de Fiados ahora muestra un **aviso informativo** explicando este flujo, y conserva todo lo demás: cobro (marca pagado + movimiento de caja), filtros (todos/pendientes/vencidos/pagados), detalle con productos, exportar y eliminar.
- **Archivo:** `src/routes/Credits.svelte`.

### ✅ Seguridad: reglas de Firestore + protección de /setup y Roles
- Se agregó el archivo **`firestore.rules`** (raíz del proyecto) que cierra la base de datos al público:
  - `settings/config` se puede **leer** sin sesión (la app lo necesita para el login), pero **escribir** solo con sesión (o la primera vez, durante la instalación).
  - El **resto de colecciones** (usuarios, productos, ventas, fiados, caja, etc.) solo se leen/escriben **con sesión iniciada**. Mientras la tienda no esté instalada (no existe `settings/config`) el acceso queda abierto para completar el asistente `/setup`.
- **`/setup` protegido**: si la tienda ya está configurada, la ruta redirige a `/login` (antes cualquiera podía re-ejecutar la instalación). El chequeo de instalación ahora usa `settings/config` en lugar de la colección `users` (compatible con las reglas).
- **`/admin/roles` solo Administrador**: los cajeros/inspectores que intenten entrar son redirigidos a `/admin` (en `App.svelte`), con respaldo de pantalla "Acceso restringido" dentro de `Roles.svelte`.
- `getSettings()` ya no crea el documento de configuración sin sesión (respeta las reglas); la persistencia inicial la hace el asistente `/setup`.
- **Archivos:** `firestore.rules`, `src/App.svelte`, `src/routes/Roles.svelte`, `src/services/settingsService.js`.
- **Importante:** las reglas se activan publicándolas en la consola de Firebase (Firestore → Reglas) — ver sección *Seguridad* más abajo.

### ✅ Fix: contador "vence pronto" del Dashboard
- El Dashboard contaba productos por vencer calculando `new Date(p.expiryDate)` directamente sobre un Timestamp de Firestore, lo que producía `NaN` y el contador no mostraba un número válido.
- Ahora convierte el Timestamp correctamente (`.toDate()` cuando existe) y descarta fechas inválidas o vacías.
- **Archivo:** `src/routes/Dashboard.svelte`.

### ✅ Renombrada la sección "Contabilidad" → "Caja y Reportes"
- El menú del panel ahora muestra **Caja y Reportes** con un icono de gráfico de barras (`fa-chart-column`), más alusivo al contenido real (caja, gastos, reportes y movimientos).
- Los mensajes de permisos y la descripción del rol **Cajero** se actualizaron para usar el nuevo nombre.
- **Archivos:** `src/components/common/Navbar.svelte`, páginas de `src/routes/` y `src/routes/Roles.svelte`.

### ✅ Transacciones atómicas: el stock nunca queda mal
- **Ventas** (`saleService.js`): registrar una venta ahora ocurre en **una transacción de Firestore** — la venta y el descuento de stock de todos sus productos se guardan juntos, o no se guarda nada. Si el stock real no alcanza, se muestra "Stock insuficiente" y **no se crea la venta**.
- **Compras** (`purchaseService.js`): la compra, el aumento de stock y la actualización del precio de compra ocurren en una sola transacción. `deletePurchase` también es transaccional (resta el stock de los productos al eliminar la compra).
- **Concurrencia**: si dos cajeros venden el mismo producto al mismo tiempo, Firestore reintenta la transacción automáticamente — las dos ventas descuentan su stock sin perderse (verificado con prueba de carrera en 2 pestañas: 2 ventas simultáneas → stock baja 2 veces).
- **Archivos:** `src/services/saleService.js`, `src/services/purchaseService.js`, `src/routes/Sales.svelte`, `src/routes/Purchases.svelte`.

---

## 🔒 Seguridad: publicar las reglas de Firestore

Las reglas están en el archivo **`firestore.rules`** (raíz del proyecto) pero **deben publicarse en la consola de Firebase** para que entren en vigencia. Pasos:

1. Entra a la consola de Firebase → selecciona el proyecto de la tienda.
2. Menú **Firestore Database** → pestaña **Reglas** (o Rules).
3. Borra el contenido actual y pega el contenido de `firestore.rules`.
4. Clic en **Publicar**.

Antes de publicar, verifica que ya exista el documento `settings/config` en Firestore (lo crea el asistente `/setup` al instalar; si tu tienda ya está en uso, ya existe y la app lo mantiene). Con las reglas activas:

- **Sin sesión**: solo se puede leer `settings/config` (lo que necesita la app para mostrar el login). Todo lo demás queda bloqueado.
- **Con sesión**: se puede leer/escribir todo normalmente.
- **Reinstalación**: `/setup` ya no es accesible si la tienda está configurada (redirige a `/login`).

---

## ❗ Problemas conocidos y soluciones

| Problema | Causa | Solución aplicada |
| --- | --- | --- |
| **Pantalla atascada en "Cargando sistema..."** | `appReady` dependía de las respuestas de Firestore | Timeout de seguridad de 400 ms en `App.svelte`; las cargas iniciales corren en paralelo sin bloquear la UI |
| **Página en blanco en `/admin` o rutas desconocidas** | `svelte-spa-router` no encontraba match para la ruta (sin sesión, `/admin` no está en las rutas públicas) y renderizaba vacío | Rutas catch-all (`'*'`) en `App.svelte`: públicas → Home, autenticadas → Dashboard, setup → Setup |
| **Página en blanco al cargar la app** | `App.svelte` usaba múltiples `<Router>` en bloques `{#if}`; al cambiar `canAccessAuth` o `needsSetup`, Svelte destruía/recreaba el Router, dejando el contenido en `null` | Un solo `<Router>` con todas las rutas combinadas + redirecciones reactivas sin destruir el Router |
| **Crash con sesión activa (`startsWith` de undefined)** | `Navbar.svelte` usaba `$location.path`, pero `$location` es un string (no objeto) → `path` siempre `undefined` → `isSectionActive()` crasheaba al renderizar el menú de admin | `$: path = $location || '/'` en `src/components/common/Navbar.svelte` |
| **Menús del Navbar no se despliegan al hacer clic** | Svelte no rastrea dependencias a través de llamadas a funciones: `class:open={shouldShow(...)}` se calculaba una sola vez | Estados derivados `openMap`/`activeMap` con referencias directas a `pinned`/`hovered`/`path` en `src/components/common/Navbar.svelte` |
| **Inicia sesión automáticamente al abrir la página** | Firebase guardaba la sesión en `localStorage` y la restauraba en cada visita | `setPersistence(auth, browserSessionPersistence)` en `src/services/authService.js`: la sesión expira al cerrar el navegador |
| **Cajero sin permisos para vender** | Al editar un usuario en Usuarios sin seleccionar rol, `roleName` se guardaba vacío y el usuario perdía todos los permisos | Conservar el rol actual si no se selecciona uno (`Users.svelte`) + restaurar rol por defecto al iniciar sesión (`authService.js`) |
| **La factura no abre al hacer clic (no pasa nada)** | `settings/config` en Firestore sin el campo `store` → `$storeInfo` = `undefined` → `$storeInfo.name` lanzaba una excepción al renderizar el modal | `storeInfo` defensivo con valores por defecto (`stores/app.js`) + reparación automática del documento (`settingsService.js`) |
| **Factura sin datos de la tienda** | Datos no configurados | Configurarlos en **Configuración → Datos de la Tienda** (nombre, dirección, teléfono, NIT) |
| **No se puede vender a fiado** | No hay clientes registrados | Registrar clientes primero en **Clientes** |

---

##  Despliegue

- Repositorio: `https://github.com/mariajose2025/Tienda_la_cigarra_proyecto_final_MariaJoseBucheli`
- Sitio (Vercel): `https://tienda-la-cigarra-proyecto-final-maria-jose-bucheli-jlmn3pek8.vercel.app/#/`
- Rama de producción: `main`
- Despliegue automático en **Vercel** (antes Netlify): cada push a `main` publica el sitio.
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
