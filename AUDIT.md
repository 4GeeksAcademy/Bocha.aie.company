# AUDIT — Auditoría inicial

## Entorno de medición
- Fecha de las capturas: 20 de octubre de 2026 (entre 14:44 y 15:28 UTC, según los metadatos Lighthouse).
- Navegador: Chrome 155.0.0.0 en Windows 10 x64; Lighthouse 13.4.1.
- Modo de ejecución (dev o producción): no queda registrado en los reportes exportados; confirmar antes de comparar mediciones futuras.
- URLs medidas: `http://localhost:3000/` (Backoffice) y `http://localhost:3001/` (Centro de incidencias / Tracker).
- Dispositivos simulados: Mobile y Desktop, según `formFactor` de cada reporte.
- Capturas de origen: [audit/before](audit/before/).

## Puntuaciones iniciales

| Aplicación | Dispositivo | Hora UTC | Performance | Accessibility | Best Practices | SEO | FCP | LCP | TBT | CLS | Speed Index |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Backoffice | Mobile | 14:46 | 67 | 95 | 100 | 100 | 0.8 s | 5.8 s | 350 ms | 0.115 | 2.0 s |
| Backoffice | Desktop | 14:44 | 94 | 95 | 100 | 100 | 0.4 s | 1.6 s | 30 ms | 0.057 | 0.7 s |
| Tracker | Mobile | 15:27 | 67 | 94 | 100 | 100 | 0.8 s | 6.3 s | 420 ms | 0 | 2.0 s |
| Tracker | Desktop | 15:28 | 97 | 94 | 96 | 100 | 0.2 s | 1.3 s | 30 ms | 0 | 0.8 s |

## Problemas detectados

### Problema 1 — Rendimiento móvil del Tracker
- Frontend y URL: Centro de incidencias / Tracker, `http://localhost:3001/`, perfil Mobile.
- Indicador afectado: Performance 67, LCP 6.3 s y TBT 420 ms.
- Evidencia de Lighthouse: el reporte enumera 1.6 s de ejecución de JavaScript, 2.5 s de trabajo del hilo principal, 303 KiB de JavaScript no utilizado y 10 tareas largas.
- Archivo o componente involucrado: `uis/talent-pipeline-tracker/app/page.tsx` monta `IncidentManagerPage`; `uis/talent-pipeline-tracker/components/incident-manager-page.tsx` es un componente cliente que carga incidencias y resumen desde efectos separados.
- Causa raíz comprobada (o hipótesis a verificar): **hipótesis pendiente de validar**. La pantalla cliente y sus cargas son candidatas a contribuir al trabajo de JavaScript, pero el reporte exportado no identifica qué elemento fue el LCP ni demuestra que esas peticiones lo causaran.
- Solución propuesta: obtener un trace de Performance y el desglose del LCP en producción; después, reducir el JavaScript inicial y diferir datos o secciones que no sean necesarios para el primer render, midiendo de nuevo en las mismas condiciones.

### Problema 2 — Rendimiento móvil y contaminación potencial de Backoffice
- Frontend y URL: Backoffice, `http://localhost:3000/`, perfiles Mobile y Desktop.
- Indicador afectado: Performance móvil 67 (LCP 5.8 s, TBT 350 ms, CLS 0.115); en Desktop, Performance 94 y LCP 1.6 s.
- Evidencia de Lighthouse: ambos reportes advierten que datos almacenados en IndexedDB podrían afectar la carga y recomiendan repetir la auditoría en una ventana privada.
- Archivo o componente involucrado: `uis/backoffice/src/app/page.tsx` sirve una página de inicio sencilla; `uis/backoffice/src/components/auth-guard.tsx` se monta desde el layout global.
- Causa raíz comprobada (o hipótesis a verificar): **hipótesis pendiente de validar**. La propia herramienta marca posible contaminación de la ejecución; el reporte no prueba que IndexedDB ni un componente concreto causaran las métricas.
- Solución propuesta: repetir Mobile y Desktop en una ventana privada con el mismo modo de ejecución; comparar los resultados y revisar un trace del LCP/CLS antes de atribuir el problema al código.

### Problema 3 — Selectores sin etiqueta accesible en Tracker
- Frontend y URL: Centro de incidencias / Tracker, `http://localhost:3001/`, perfil Mobile.
- Indicador afectado: Accessibility 94.
- Evidencia de Lighthouse: “Select elements do not have associated label elements.”
- Archivo o componente involucrado: `uis/talent-pipeline-tracker/components/incident-manager-page.tsx`; `SelectField` y `Filter` renderizan el texto de etiqueta separado del `<select>`, sin asociación `htmlFor`/`id` ni etiqueta envolvente.
- Causa raíz comprobada (o hipótesis a verificar): comprobada por inspección del JSX: el nombre visible no está asociado programáticamente con el control.
- Solución propuesta: dar un `id` estable a cada selector y asociar su etiqueta con `htmlFor`, o envolver el control con `<label>`; validar después con Lighthouse y una prueba manual con lector de pantalla.

## Código duplicado

### Caso 1 — Tono visual del estado de candidatura
- Archivos: `uis/talent-pipeline-tracker/components/candidate-list-page.tsx` y `uis/talent-pipeline-tracker/components/candidate-detail-page.tsx`.
- Código repetido: ambas páginas traducían `selected`, `discarded` e `in_progress` al mismo tono de `StatusPill`, con el estado restante como neutral.
- Abstracción propuesta: función tipada `candidateStatusTone` junto a `CandidateStatus` en `uis/talent-pipeline-tracker/types/tracker.ts`.
- Implementación: realizada; ambas páginas ahora usan la misma función. No cambia etiquetas, colores ni transiciones.

### Caso 2 — Inicio de sesión duplicado entre aplicaciones
- Archivos: `uis/backoffice/src/app/login/page.tsx` y `uis/talent-pipeline-tracker/app/login/page.tsx`.
- Código repetido: construcción del formulario `application/x-www-form-urlencoded`, llamada a `/backend/auth/login`, almacenamiento del token, navegación posterior y presentación de errores.
- Abstracción propuesta: contrato o helper de autenticación compartido, conservando los componentes visuales de cada aplicación. `packages/shared` hoy solo declara tipos y el monorepo no configura workspaces npm, por lo que no se implementa una dependencia compartida sin preparar esa infraestructura.

## Verificación
- ESLint focalizado después de extraer `candidateStatusTone`: correcto en `types/tracker.ts`, `components/candidate-list-page.tsx` y `components/candidate-detail-page.tsx`.
- Build de producción y nuevas capturas Lighthouse posteriores: pendientes de ejecutar.
- No hay suite de pruebas propia del Tracker en el repositorio; la búsqueda solo encontró pruebas frontend de Backoffice.
