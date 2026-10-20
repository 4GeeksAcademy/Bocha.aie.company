# Estado del proyecto

## Fase actual

Configuración inicial de contexto y reglas del agente para Brasaland Digital. Esta fase prepara el repositorio para trabajo futuro y no implementa funcionalidades de producto.

## Completado en esta entrega

- Banco de memoria inicial con brief de negocio, contexto técnico y progreso.
- Instrucciones raíz para lectura de contexto, estructura del monorepo y flujo previo a commits.
- Regla de límites de arquitectura y skill para mantener el banco de memoria.
- Rutas de destino documentadas: `uis/website`, `uis/backoffice` y `services/`.

No se crean aplicaciones, APIs ni agentes de producto en esta fase.

## Decisiones pendientes

- Resolver el conflicto entre MongoDB/Motor/Beanie para la API central y SQLModel/PostgreSQL/Supabase más TinyDB descritos para el Hito 5 de inventario.
- Confirmar el framework frontend de cada aplicación, salvo que lo determine un hito posterior.
- Acordar los límites y contratos iniciales de los dominios antes de implementar la API central.
- Registrar `uis/talent-pipeline-tracker` (Centro de incidencias, Next.js) en el mapa del monorepo; hoy existe pero no figura en `AGENTS.md` ni en las reglas.
- Decidir si `uis/start.sh` debe servir builds de producción: hoy ejecuta `next dev`, lo que invalida las mediciones de rendimiento (ver `AUDIT.md`, problema 2).

## Auditoría de rendimiento (20/10/2026)

- Rama `perf/auditoria-lighthouse`: `AUDIT.md`, `REPORT.md` y evidencias en `audit/`.
- Aplicado: corrección de la redirección de `AuthGuard` en la hidratación (ambos frontends) y etiquetas de formulario del Tracker. Documentado sin aplicar: contraste de `.eyebrow` (Backoffice) y del botón del perfil (Tracker).
- Jest de Backoffice no corre: falta `jest`/`ts-jest` en `uis/backoffice/package.json`.

## Próximos pasos

1. Validar las decisiones pendientes con Tecnología y registrar la decisión aprobada.
2. Definir el alcance y criterios de aceptación del primer dominio de producto.
3. Crear cada aplicación únicamente en su ruta asignada y documentar su ejecución y validaciones.
4. Actualizar este archivo cuando cambien el estado, las decisiones o los siguientes hitos.