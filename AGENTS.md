# Instrucciones para agentes

Brasaland Digital es un monorepo de producto. Antes de cualquier tarea, lee el contexto de negocio y el banco de memoria; no deduzcas que una propuesta o un hito futuro ya está implementado.

## Contexto obligatorio

Lee estos archivos al inicio de cada sesión y antes de tomar decisiones de arquitectura:

1. `CONTEXT.md` — contexto de negocio principal.
2. `memory-bank/projectbrief.md` — objetivos, usuarios y problema.
3. `memory-bank/techContext.md` — arquitectura prevista, stack y restricciones.
4. `memory-bank/progress.md` — decisiones pendientes y estado del trabajo.
5. La documentación específica del área que vayas a modificar, incluida la regla aplicable de `.agents/rules/`.

Si hay contradicciones, no inventes una decisión: registra la discrepancia y solicita resolución antes de construir sobre ella. Actualiza el banco de memoria cuando cambie una decisión, una restricción o el estado del proyecto.

## Mapa del monorepo

- `uis/website`: sitio público corporativo.
- `uis/backoffice`: aplicación interna.
- `services/`: APIs y servicios backend.
- `agents/`: agentes de producto de Brasaland.
- `skills/`: capacidades reutilizables para agentes de producto.
- `.agents/`: reglas y skills para el agente que desarrolla este monorepo.

No crees árboles paralelos para estas capas. Este setup documenta destinos futuros; no requiere crear aplicaciones ni afirma que estén implementadas.

## Flujo previo a cada commit

1. Lee el contexto obligatorio y comprueba `git status`; identifica cambios ajenos antes de tocar archivos.
2. Revisa el diff y confirma que cada archivo modificado pertenece al alcance solicitado.
3. Ejecuta las pruebas, validaciones o comprobaciones documentales pertinentes, siguiendo el README del área; informa de cualquier validación que no pueda ejecutarse.
4. Inspecciona el diff staged con `git diff --cached --check` y revisa que no incluya secretos, datos locales ni cambios ajenos.
5. Crea el commit solo con autorización explícita y con los archivos del alcance; nunca incluyas ni reviertas cambios preexistentes del usuario.

## Límites que requieren confirmación

Solicita confirmación antes de modificar:

- Secretos, credenciales o configuración local, incluidos archivos `.env` y datos de autenticación.
- Datos reales, bases de datos, archivos de respaldo o cualquier operación destructiva o irreversible.
- Configuración de despliegue/infraestructura, permisos o políticas de seguridad.
- Manifiestos o lockfiles de dependencias y migraciones/esquemas persistentes, cuando el cambio no sea parte explícita de la tarea.
- Archivos fuera del alcance solicitado o cambios preexistentes de otra persona.

No añadas dependencias ni cambies contratos públicos por conveniencia. Expón el impacto y pide confirmación cuando un cambio protegido sea necesario.