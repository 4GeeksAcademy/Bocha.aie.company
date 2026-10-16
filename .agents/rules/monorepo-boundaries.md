# Límites del monorepo Brasaland

**Alcance:** planificación, documentación y cambios de frontend, backend, agentes e infraestructura en este repositorio.

## Ubicaciones de producto

- Sitio público corporativo: `uis/website`.
- Aplicación interna: `uis/backoffice`.
- APIs y servicios backend: `services/`.
- Agentes de producto: `agents/`.
- Skills de producto: `skills/`.
- Configuración del agente de desarrollo: `.agents/`.

No dupliques estas capas en carpetas nuevas con otro nombre. Antes de añadir una aplicación, comprueba el alcance del hito y su ruta asignada.

## Reglas de interpretación

- `CONTEXT.md` define el negocio. Los contextos de hitos y las propuestas arquitectónicas lo complementan dentro de su alcance.
- Distingue requisitos, propuestas y decisiones aprobadas. No describas una capacidad futura como si estuviera implementada.
- Si las fuentes discrepan, registra la cuestión y espera una decisión de Tecnología antes de fijar contratos, persistencia o estructura de un servicio.
- `.agents/` contiene configuración del agente de desarrollo; `agents/` y `skills/` contienen artefactos de producto.
- El setup de infraestructura de agentes no requiere cambios en código de aplicaciones, servicios ni dependencias.