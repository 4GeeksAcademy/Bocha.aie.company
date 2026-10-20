# AUDIT — Auditoría de rendimiento y calidad

Auditoría de los dos frontends del monorepo: **Tracker** (`uis/talent-pipeline-tracker`, Centro de incidencias) y **Backoffice** (`uis/backoffice`). Este documento recoge solo hallazgos **verificados** con evidencia; las recomendaciones genéricas que no se confirmaron se listan como hipótesis. Las correcciones aplicadas y su medición están en [REPORT.md](REPORT.md).

## Entorno de medición

### Capturas iniciales (`audit/before/`, tomadas por el equipo)
- Fecha: 20 de octubre de 2026 (14:44–15:28 UTC). Chrome 155, Lighthouse 13.4.1 desde el panel de DevTools, una ejecución por caso.
- **Modo de ejecución: desarrollo (`next dev`)**. Se confirmó al inspeccionar el JSON de los reportes: cargan `next-devtools`, `hmr-client`, chunks de Turbopack dev y `react-dom` sin minificar (1 MB descomprimido).
- Puertos: Backoffice en `:3000`, Tracker en `:3001`. `uis/start.sh` (Docker) usa los puertos al revés, por lo que estas capturas no salieron del setup Docker.
- **Corrección de datos:** el reporte “Backoffice Desktop” pidió `/inventory/products` (su LCP es `p.inventoryGuide`) y terminó en `/` por el problema 1. No mide la misma página que el reporte Mobile.
- Ambos reportes de Backoffice advierten datos en IndexedDB (perfil de navegador con estado).

### Mediciones controladas (agregadas en esta auditoría)
- Lighthouse 13.4.1 por Node (CLI programática) sobre Chrome headless, perfil limpio por corrida, caché HTTP vaciada, sesión autenticada con un usuario de prueba (token sembrado en `localStorage`, `disableStorageReset`).
- Mismos puertos y modo (`next dev`) que las capturas iniciales; además, una serie en producción (`next build && next start`).
- **3 corridas por caso, se informa la mediana y el rango.** Scripts y datos crudos en [audit/runs/](audit/runs/).
- Vistas: Tracker `/` (incidencias) y `/account/profile` (otra vista); Backoffice `/` (dashboard). Mobile y Desktop: 6 combinaciones.

## Puntuaciones iniciales (capturas originales, una ejecución, modo dev)

| Aplicación | URL | Dispositivo | Performance | Accessibility | Best Practices | SEO | FCP | LCP | TBT | CLS | Speed Index |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Backoffice | `/` | Mobile | 67 | 95 | 100 | 100 | 0.8 s | 5.8 s | 350 ms | 0.115 | 2.0 s |
| Backoffice | `/inventory/products` → `/` | Desktop | 94 | 95 | 100 | 100 | 0.4 s | 1.6 s | 30 ms | 0.057 | 0.7 s |
| Tracker | `/` | Mobile | 67 | 94 | 100 | 100 | 0.8 s | 6.3 s | 420 ms | 0 | 2.0 s |
| Tracker | `/` | Desktop | 97 | 94 | 96 | 100 | 0.2 s | 1.3 s | 30 ms | 0 | 0.8 s |

La línea base controlada (mediana de 3) está en [REPORT.md](REPORT.md#comparación-lighthouse).

## Problemas verificados (por impacto)

### Problema 1 — `AuthGuard` redirige a `/login` durante la hidratación aunque haya sesión · **APLICADO**
- Frontends: ambos. Archivos: `uis/talent-pipeline-tracker/components/auth-guard.tsx` y `uis/backoffice/src/components/auth-guard.tsx` (código idéntico).
- Métricas afectadas: LCP/Speed Index (re-render y remontaje), CLS (Backoffice), cargas duplicadas, hidratación; además un **bug funcional**: los deep links autenticados terminan en `/`.
- Causa raíz (comprobada): `useSyncExternalStore(subscribe, getAccessToken, () => null)` usa el snapshot de servidor `null` durante la hidratación, y `null` también significa “sin sesión”. El `useEffect` del commit de hidratación corre con `authenticated=false` y ejecuta `router.replace('/login')` antes de que React re-renderice con el token real. Al llegar a `/login`, el guard ve sesión en una ruta pública y hace `router.replace('/')`, ignorando `next`.
- Evidencia:
  - Capturas originales del Tracker: `incidents` + `summary` → `/login?_rsc` + chunks de `login/page` → `/?_rsc` → `incidents` + `summary` **otra vez**. En Desktop, la segunda petición devolvió **500** (es el único fallo de Best Practices, 96).
  - Captura original Backoffice Desktop: `/inventory/products` → `/login?next=%2Finventory%2Fproducts` → `/`.
  - Línea base controlada: `/account/profile` terminó en `/` en las 6 corridas; 2–3 navegaciones RSC de redirección y 4 llamadas API (en lugar de 2) por carga.
  - Producción: las páginas estáticas (`/`) **no** reproducen el bug, porque `useSearchParams` en el layout raíz hace que el guard se renderice en cliente sin hidratar. La ruta dinámica `/candidates/[id]` **sí** lo reproduce: `/candidates/1` → `/login?next=%2Fcandidates%2F1` → `/` ([audit/runs/dynamic-route.mjs](audit/runs/dynamic-route.mjs)).
- Corrección mínima: el snapshot de servidor devuelve `undefined` (“sesión aún no leída”); el efecto no redirige mientras `token === undefined` y se muestra el splash. `subscribe` se movió a nivel de módulo para no re-suscribirse en cada render.
- Riesgo de regresión: medio (flujo de autenticación). Verificado con pruebas de navegador: sesión en home, deep link con sesión, sin sesión → `/login?next=…`, sesión en `/login` → `/`.

### Problema 2 — La línea base se midió en modo desarrollo · **DOCUMENTADO (sin cambio de código)**
- Archivo: `uis/start.sh` ejecuta `npm run dev` en ambas apps.
- Causa raíz (comprobada): en dev, el JS de framework y de las herramientas de desarrollo domina el arranque. Los **303 KiB de “JavaScript no utilizado”** del reporte original son 100 % chunks de Next/devtools, ningún chunk de la app; las 10 tareas largas son de `react-dom`, `next-devtools` y el cliente de Next.
- Evidencia: con el mismo código, Tracker `/` Mobile da Performance **55** en dev y **89** en producción (LCP 6.8 s → 3.0 s); Backoffice `/` Mobile, **61** y **96** (LCP 6.0 s → 2.2 s).
- Recomendación: medir siempre con `next build && next start`. Cambiar `start.sh` o el Dockerfile toca infraestructura y queda **pendiente de decisión**.
- Riesgo: ninguno en código.

### Problema 3 — Controles de formulario sin etiqueta asociada en el Tracker · **APLICADO**
- Archivos: `uis/talent-pipeline-tracker/components/incident-manager-page.tsx` (`SelectField`, `Filter`, Título, Descripción, Estado inicial), `uis/talent-pipeline-tracker/app/account/profile/page.tsx` y `uis/talent-pipeline-tracker/components/ui.tsx` (`FieldLabel`).
- Métrica: Accessibility 94 en `/` (`select-name`, 6 selects) y 89 en `/account/profile` (`label`, 3 inputs).
- Causa raíz (comprobada en JSX): el `<label>` es hermano del control, sin `htmlFor`/`id`.
- Corrección mínima: `useId()` en `SelectField`, ids estables en el formulario y prop `htmlFor` opcional en `FieldLabel` (compatible con los usos existentes).
- Riesgo: bajo. Verificado: todos los controles de `main` tienen `labels.length > 0`; el filtro sigue cargando datos.

### Problema 4 — Contraste insuficiente de `.eyebrow` en Backoffice · NO APLICADO (fuera de las 2 correcciones priorizadas)
- Archivo: `uis/backoffice/src/app/globals.css` (`.eyebrow`, `color: #777f89` sobre `#f4f5f7`, aprox. 3.7:1 para texto de 12 px; requiere 4.5:1).
- Evidencia: `color-contrast` es el único fallo de Accessibility (95) en Backoffice, en todos los reportes.
- Corrección mínima propuesta: usar `#656d76`, el color que ya usa `.hero p` (aprox. 4.8:1). Riesgo: muy bajo (solo estilo visual en 10 páginas).

### Problema 5 — Contraste del botón “Guardar” en el perfil del Tracker · NO APLICADO
- Archivo: `uis/talent-pipeline-tracker/app/account/profile/page.tsx` (botón con `bg-[color:var(--accent…])`).
- Evidencia: `color-contrast` en `/account/profile` (Accessibility 96 después de la corrección 3). Causa exacta pendiente de confirmar (posible estado `disabled` con `opacity`).

### Hipótesis no confirmadas o descartadas
- **LCP dependiente de JS en ambas apps (hipótesis estructural).** El HTML del servidor solo contiene el splash (“Cargando aplicación…”/“Verificando sesión…”), así que el LCP es texto que aparece tras descargar JS e hidratar. En producción el LCP Mobile es 3.0 s (Tracker) y 2.2 s (Backoffice). Resolverlo exige autenticación verificable en el servidor (cookie + middleware): es un cambio de arquitectura y **no se propone** en esta entrega.
- **CLS 0.115 de Backoffice por fuente web.** El reporte atribuía un shift a `/__nextjs_font/geist-latin.woff2`, que es la fuente del overlay de desarrollo de Next, no de la app (Backoffice usa Arial). El CLS desapareció con la corrección 1 y no existe en producción, por lo que no requiere cambio adicional.
- **“Cargas separadas de incidencias y resumen” como causa del LCP del Tracker** (hipótesis anterior del problema 1): descartada como causa principal. La duplicación venía del problema 1, y el peso de JS venía del modo dev (problema 2).
- **IndexedDB contaminando la medición de Backoffice:** las mediciones controladas usan un perfil limpio y reproducen los mismos valores de CLS en la línea base, así que no fue determinante.

## Código duplicado

### Caso 1 — Tono visual del estado de candidatura · **IMPLEMENTADO**
- Archivos: `uis/talent-pipeline-tracker/components/candidate-list-page.tsx` y `uis/talent-pipeline-tracker/components/candidate-detail-page.tsx`.
- Código repetido: ambas páginas traducían `selected`, `discarded` e `in_progress` al mismo tono de `StatusPill`, con el estado restante como neutral.
- Abstracción: función tipada `candidateStatusTone` junto a `CandidateStatus` en `uis/talent-pipeline-tracker/types/tracker.ts` (el `switch` exhaustivo hace que TypeScript avise si se agrega un estado).
- Implementación: ambas páginas usan la misma función. No cambia etiquetas, colores ni transiciones.

### Caso 2 — Inicio de sesión y `AuthGuard` duplicados entre aplicaciones · DOCUMENTADO
- Archivos: `uis/backoffice/src/app/login/page.tsx` y `uis/talent-pipeline-tracker/app/login/page.tsx`; además `auth-guard.tsx` y `lib/auth.ts` de ambas apps.
- Código repetido: construcción del formulario `application/x-www-form-urlencoded`, llamada a `/backend/auth/login`, almacenamiento del token y navegación posterior; el guard y el parseo del JWT son prácticamente idénticos. El problema 1 tuvo que corregirse dos veces por esta duplicación.
- Abstracción propuesta: helper de autenticación y hook `useAuthSession` compartidos, conservando los componentes visuales de cada app. `packages/shared` hoy solo declara tipos y el monorepo no configura workspaces npm, por lo que no se implementa una dependencia compartida sin preparar esa infraestructura.

## Discrepancias a resolver
- `uis/talent-pipeline-tracker` no figura en el mapa del monorepo de `AGENTS.md` ni en `.agents/rules/monorepo-boundaries.md`.
- `uis/start.sh` corre ambas apps en modo dev y asigna puertos al revés que las capturas de esta auditoría.
- Backoffice declara `"test": "jest"` pero no tiene `jest`/`ts-jest` en su `package.json`; con las dependencias de la raíz, `ts-jest` no se resuelve, así que la suite no se pudo ejecutar.
- `uis/backoffice/build.log` (31/08) registra un error de `useSearchParams` sin `Suspense` que ya no ocurre: la build actual compila.

## Verificación
- ESLint y `tsc --noEmit`: correctos en los archivos modificados de ambas apps.
- `next build`: correcto en ambas apps (Tracker 10 rutas, Backoffice 16 rutas).
- Pruebas de navegador (Puppeteer, [audit/runs/functional.mjs](audit/runs/functional.mjs)), en dev y en producción: flujos de sesión, deep links, carga de datos, etiquetas y consola sin errores. En dev pasan las 17 comprobaciones. En producción pasan 15: las 2 restantes (“sin navegación RSC extra”) no aplican, porque `<Link>` precarga los enlaces visibles de la navegación; se comprobó en su lugar que no hay ninguna petición a `/login`.
- Jest de Backoffice: **no ejecutado** (ver discrepancias). El Tracker no tiene suite de pruebas.
