# REPORT — Mejoras de rendimiento

## Resumen
- Frontends auditados: **Tracker** (`uis/talent-pipeline-tracker`, Centro de incidencias; es el “website” de la consigna) y **Backoffice** (`uis/backoffice`).
- Páginas medidas: Tracker `/` (incidencias, home) y `/account/profile` (otra vista); Backoffice `/` (dashboard). Mobile y Desktop: 6 combinaciones.
- Cambios principales (2 correcciones priorizadas por impacto):
  1. `AuthGuard` ya no redirige a `/login` durante la hidratación (ambos frontends).
  2. Etiquetas asociadas a los controles de formulario del Tracker.
- Componente o función extraída: `candidateStatusTone` (Tracker), compartida por el listado y el detalle de candidatos.
- Detalle de causas y evidencia: [AUDIT.md](AUDIT.md). Capturas: [audit/before](audit/before/), [audit/after](audit/after/). Datos crudos y scripts: [audit/runs](audit/runs/).

### Procedimiento de medición
- Lighthouse 13.4.1 (la misma versión que las capturas iniciales), Chrome headless, perfil limpio y caché vacía por corrida, sesión autenticada con usuario de prueba.
- Mismo modo y puertos que las capturas iniciales: `next dev`, Backoffice `:3000`, Tracker `:3001`, backend en Docker.
- **3 corridas por caso; se informa mediana (rango).**
- Durante la sesión la carga de la máquina varió: Backoffice subió de Performance sin cambios de código entre dos tandas. Por eso la comparación principal usa una **línea base repetida justo antes de la medición final** (`baseline2` contra `fix2`), y no la primera tanda.
- Serie adicional en producción (`next build && next start`) para separar el efecto del modo dev.

## Correcciones aplicadas

### Corrección 1 — `AuthGuard` redirigía a `/login` durante la hidratación
- Problema original: con sesión válida, cada carga hidratada hacía `/` → `/login` → `/`. Remontaba la página, repetía las peticiones a la API (un 500 en consola en la captura original del Tracker) y mandaba los deep links autenticados a `/`. En Backoffice producía CLS 0.115 (Mobile) y 0.050 (Desktop).
- Causa raíz: el snapshot de servidor de `useSyncExternalStore` era `null`, el mismo valor que “sin sesión”. El efecto del commit de hidratación ejecutaba `router.replace('/login')` antes del re-render con el token real.
- Archivos modificados: `uis/talent-pipeline-tracker/components/auth-guard.tsx`, `uis/backoffice/src/components/auth-guard.tsx`.
- Cambio realizado: el snapshot de servidor es `undefined` (“sesión aún no leída”); el efecto no redirige hasta conocer el estado real y, mientras tanto, se muestra el splash. `subscribe` pasó a nivel de módulo.
- Verificación funcional (dev y producción, Puppeteer): home con sesión se queda en `/` y carga datos; `/account/profile`, `/inventory/products` y `/candidates/1` con sesión se quedan en su ruta; sin sesión redirige a `/login?next=…`; con sesión, `/login` lleva a `/`; sin errores de consola. `next build`, ESLint y `tsc` correctos.
- Commits: `e3798cf` (Tracker), `eaea065` (Backoffice).
- Medición intermedia (dev, primera tanda `baseline` → `fix1`, mediana de 3):
  - Navegaciones RSC de redirección: 2–3 → **0**. Llamadas API del Tracker por carga: 4 → **2**.
  - Backoffice `/`: CLS **0.115 → 0** (Mobile) y **0.050 → 0** (Desktop); Performance Desktop 92 → 97.
  - Tracker `/` Desktop: 83 → 86. `/account/profile` deja de terminar en `/`.
- Medición antes/después aislada para Backoffice (`baseline2` → `fix2`; Backoffice solo cambia por esta corrección): Mobile 54 → 61, Speed Index 2.37 s → 0.99 s, CLS 0.115 → 0; Desktop 96 → 97, CLS 0.050 → 0.

### Corrección 2 — Controles de formulario sin etiqueta asociada (Tracker)
- Problema original: Accessibility 94 en `/` (`select-name`: 6 `<select>` sin nombre accesible) y 89 en `/account/profile` (`label`: 3 inputs). La segunda vista se pudo medir recién después de la corrección 1; antes rebotaba a `/`.
- Causa raíz: el `<label>` se renderizaba como hermano del control, sin `htmlFor`/`id`.
- Archivos modificados: `uis/talent-pipeline-tracker/components/incident-manager-page.tsx`, `uis/talent-pipeline-tracker/components/ui.tsx`, `uis/talent-pipeline-tracker/app/account/profile/page.tsx`.
- Cambio realizado: `useId()` en `SelectField` (cubre `Filter`), ids estables en Título/Descripción/Estado inicial y en los campos del perfil, y prop `htmlFor` opcional en `FieldLabel`, compatible con los otros usos.
- Verificación funcional: todos los controles de `main` tienen etiqueta asociada (`el.labels.length > 0`); el filtro por estado sigue disparando la carga; el perfil carga los datos del usuario en los inputs. ESLint, `tsc` y `next build` correctos.
- Commit: `cdc7bf6`.
- Medición antes: Accessibility 94 (`/`) y 94/89 (`/account/profile`, antes y después de la corrección 1).
- Medición después: Accessibility **100** en `/` y **96** en `/account/profile`. Queda un `color-contrast` en el botón del perfil, problema 5 de AUDIT.md, no aplicado.

## Refactorización
- Casos de duplicación identificados: 2 (ver [AUDIT.md](AUDIT.md#código-duplicado)):
  1. Tono de estado de candidatura repetido en listado y detalle.
  2. Login, `AuthGuard` y `lib/auth.ts` duplicados entre Tracker y Backoffice; documentado, no implementado porque requiere preparar workspaces para `packages/shared`.
- Abstracción implementada: función tipada `candidateStatusTone(status): CandidateStatusTone` en `uis/talent-pipeline-tracker/types/tracker.ts`, con `switch` exhaustivo sobre `CandidateStatus`.
- Archivos que ahora la reutilizan: `uis/talent-pipeline-tracker/components/candidate-list-page.tsx` y `uis/talent-pipeline-tracker/components/candidate-detail-page.tsx`.
- Prueba de que sigue funcionando: mismo mapeo que las dos funciones eliminadas (`selected`→success, `discarded`→danger, `in_progress`→warning, `received`→neutral); ESLint, `tsc --noEmit` y `next build` correctos. Commit: `45e75be`.
- Es un cambio de mantenibilidad: no se le atribuye ninguna mejora de Lighthouse.

## Comparación Lighthouse

### Comparación principal: misma configuración, mediana de 3 (`next dev`, `baseline2` → `fix2`)
Capturas “después”: [audit/after](audit/after/) (corrida mediana de cada caso). Diferencia = puntos absolutos.

| Frontend / URL / Modo | Perf. antes | Perf. después | Diferencia | LCP antes | LCP después | TBT antes | TBT después | CLS antes | CLS después |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Tracker / `/` / Mobile | 53 (52–57) | 55 (55–57) | +2 | 6.95 s | 6.82 s | 1153 ms | 954 ms | 0 | 0 |
| Tracker / `/` / Desktop | 94 (91–94) | 96 (93–96) | +2 | 1.45 s | 1.39 s | 116 ms | 89 ms | 0 | 0 |
| Tracker / `/account/profile` / Mobile ¹ | 51 (50–53) | 57 (56–57) | +6 | 7.12 s | 6.82 s | 1385 ms | 856 ms | 0 | 0 |
| Tracker / `/account/profile` / Desktop ¹ | 93 (91–94) | 96 (95–97) | +3 | 1.53 s | 1.37 s | 110 ms | 66 ms | 0 | 0 |
| Backoffice / dashboard `/` / Mobile | 54 (51–57) | 61 (58–63) | +7 | 6.29 s | 6.00 s | 809 ms | 687 ms | **0.115** | **0** |
| Backoffice / dashboard `/` / Desktop | 96 (96–97) | 97 (97–98) | +1 | 1.30 s | 1.21 s | 37 ms | 28 ms | **0.050** | **0** |

¹ Antes de la corrección 1 esta URL rebotaba y terminaba midiendo `/`; los valores “antes” corresponden a esa navegación.

| Frontend / URL / Modo | Accessibility antes → después | Best Practices antes → después | SEO antes → después | Speed Index antes → después |
|---|---|---|---|---|
| Tracker / `/` / Mobile | 94 → **100** | 100 → 100 | 100 → 100 | 2.62 s → 1.24 s |
| Tracker / `/` / Desktop | 94 → **100** | 100 → 100 | 100 → 100 | 0.93 s → 0.60 s |
| Tracker / `/account/profile` / Mobile | 94 → **96** | 100 → 100 | 100 → 100 | 2.92 s → 1.29 s |
| Tracker / `/account/profile` / Desktop | 94 → **96** | 100 → 100 | 100 → 100 | 0.98 s → 0.45 s |
| Backoffice / dashboard `/` / Mobile | 95 → 95 | 100 → 100 | 100 → 100 | 2.37 s → 0.99 s |
| Backoffice / dashboard `/` / Desktop | 95 → 95 | 100 → 100 | 100 → 100 | 0.59 s → 0.30 s |

**Lectura honesta:**
- Las mejoras sostenidas son Accessibility del Tracker (+6/+2), CLS de Backoffice (a 0), Speed Index en todas las vistas y la desaparición de las redirecciones.
- Los cambios de Performance del Tracker `/` (+2) caen dentro del rango de variación. La mejora de Backoffice Mobile (+7) tiene rangos que no se solapan (51–57 contra 58–63) y coincide con la eliminación del CLS.

### Referencia: capturas originales (`audit/before/`, una ejecución desde DevTools)
No son estrictamente comparables: otra forma de ejecución, perfil con IndexedDB y una sola corrida.

| Frontend / URL / Modo | Perf. | A11y | BP | SEO | LCP | TBT | CLS | Después (mediana) Perf. / A11y / BP / SEO |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| Tracker / `/` / Mobile | 67 | 94 | 100 | 100 | 6.3 s | 420 ms | 0 | 55 / 100 / 100 / 100 |
| Tracker / `/` / Desktop | 97 | 94 | 96 | 100 | 1.3 s | 30 ms | 0 | 96 / 100 / 100 / 100 |
| Backoffice / `/` / Mobile | 67 | 95 | 100 | 100 | 5.8 s | 350 ms | 0.115 | 61 / 95 / 100 / 100 |
| Backoffice / `/inventory/products`→`/` / Desktop | 94 | 95 | 100 | 100 | 1.6 s | 30 ms | 0.057 | 97 / 95 / 100 / 100 |

Best Practices del Tracker Desktop pasa de 96 a 100: el error 500 en consola venía de la petición duplicada que eliminó la corrección 1. La Performance Mobile absoluta de esas capturas es más alta que en nuestras corridas por diferencias del entorno (TBT de 350–420 ms contra más de 800 ms con el mismo código); por eso la comparación válida es la tabla principal.

### Producción (`next build && next start`, home, mediana de 3)

| Frontend / Modo | Perf. antes → después | A11y antes → después | LCP antes → después | TBT antes → después | CLS |
|---|---|---|---|---|---|
| Tracker `/` Mobile | 90 → 89 | 94 → **100** | 2.98 s → 3.04 s | 231 → 268 ms | 0 → 0 |
| Tracker `/` Desktop | 100 → 100 | 94 → **100** | 0.66 s → 0.65 s | 15 → 8 ms | 0 → 0 |
| Backoffice `/` Mobile | 96 → 96 | 95 → 95 | 2.24 s → 2.24 s | 176 → 196 ms | 0 → 0 |
| Backoffice `/` Desktop | 100 → 100 | 95 → 95 | 0.52 s → 0.53 s | 2 → 10 ms | 0 → 0 |

En producción las homes son estáticas y el guard no se hidrata, así que la corrección 1 no cambia su Performance (diferencias dentro del ruido). Su efecto en producción es funcional y de carga en rutas dinámicas: `/candidates/1` antes pedía `/login?next=…` y terminaba en `/`; ahora se queda en su ruta sin peticiones extra.

## Uso del agente
- Skill utilizada: `performance` (addyosmani/web-quality-skills, instalada en `.agents/skills/performance`), con su flujo `references/MEASUREMENT.md`: separar tipos de evidencia, mediana de 3 corridas, registrar condiciones y tratar el análisis estático como hipótesis.
- Hallazgos comprobados:
  1. Redirección de `AuthGuard` en la hidratación, confirmada en la red de las capturas originales, en las corridas controladas y en una ruta dinámica en producción.
  2. Medición original en modo dev: los 303 KiB de JS sin usar son chunks de devtools y framework.
  3. Etiquetas sin asociar (Tracker) y contraste de `.eyebrow` (Backoffice).
- Cambios que propuso: corregir el guard; medir en producción; corregir etiquetas y contraste; quitar `setTimeout(0)` en las cargas del Tracker; reservar espacio para el total del resumen; no precargar IBM Plex Mono; quitar un `Suspense` vacío.
- Cambios que realmente aplicamos: solo los 2 de mayor impacto con evidencia (corrección 1 en ambos frontends y corrección 2). Se descartaron como causa el “CLS por fuente web” (era la fuente del overlay de dev) y la hipótesis de que las cargas separadas del Tracker causaban su LCP. El resto quedó documentado en AUDIT.md sin aplicar.

## Conclusión
- **Mejora de mayor impacto:** la corrección 1. Es la única que movió métricas de rendimiento y comportamiento en ambos frontends:
  - Elimina una navegación completa y el remontaje en cada carga hidratada.
  - Lleva el CLS de Backoffice de 0.115 a 0, reduce a la mitad las llamadas a la API del Tracker y baja el Speed Index (Backoffice Mobile 2.37 s → 0.99 s).
  - Arregla los deep links autenticados, incluida la ruta dinámica `/candidates/[id]` en producción.

  En puntuación pura, el mayor salto lo dio la corrección 2 (Accessibility del Tracker 94 → 100).
- **Lo que no mejoró o quedó pendiente:**
  - El LCP Mobile sigue alto: unos 6–7 s en dev y 3.0 s (Tracker) / 2.2 s (Backoffice) en producción. El contenido depende de JS porque la sesión vive en `localStorage`; resolverlo requiere un cambio de arquitectura que no se propuso.
  - La Performance de producción de las homes no cambió.
  - Accessibility de Backoffice sigue en 95 (contraste de `.eyebrow`, no aplicado por la regla de 2 correcciones), al igual que el contraste del botón del perfil del Tracker.
  - Jest de Backoffice no se pudo ejecutar (dependencias faltantes).
- **Qué aprendimos de medir antes de corregir:**
  - La mayor diferencia de rendimiento no estaba en el código: el mismo build pasa de 55 a 89 (Tracker Mobile) solo por medir en producción en lugar de dev.
  - Una sola corrida engaña: la deriva del entorno movió Backoffice +11 puntos sin tocar su código. Hizo falta repetir la línea base y usar medianas.
  - Leer la red de los reportes, y no solo las puntuaciones, reveló un bug funcional (deep links) que ninguna sugerencia genérica habría detectado.
