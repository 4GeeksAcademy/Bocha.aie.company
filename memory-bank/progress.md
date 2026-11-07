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

## Auditoría de serialización (20/10/2026)

- Rama `feature/serialization-audit`: informe en `docs/serialization-audit.md`, tests en `services/api/tests`.
- Pendiente de confirmación (permisos): `PUT /users/{id}` permite a un no admin enviar `role`; `GET /users` abierto a cualquier autenticado; lecturas de inventario e incidencias sin autenticación.

## Caching (21/10/2026)

- Rama `feature/caching-optimisation`: informe en `CACHING_REPORT.md`.
- Backend: `services/api/cache.py` (TTL en memoria por proceso); cacheados `GET /inventory/products` y `/inventory/products/{id}` (TTL 60 s, invalidados en escrituras de inventario). Middleware de timing en `main.py`.
- Seed masivo `services/api/seed_inventory_bulk.py` ejecutado en Supabase (filas `BRS-BULK-*`, reversible con `--reset`).
- Pendiente: paginar `GET /inventory/orders` (2,5 s, 7,8 MB); `pytest` no instalado en `myenv`.

## Sitio estatico en Docker (05/11/2026)

- Dockerfile en la raiz para servir el `index.html` existente con Nginx en el puerto 80 del contenedor, junto con estilos, assets y formulario.
- Integrado en Docker Compose como servicio `website`, con el puerto `80:80`. Ejecucion: `docker compose up -d --build website`.
- Conserva los servicios existentes y no mueve el sitio a otra ruta.

## Puertos locales en Docker (06/11/2026)

- `docker-compose.yml`: puertos configurables con `WEBSITE_PORT` (8080), `TRACKER_PORT` (3002), `BACKOFFICE_PORT` (3003) y `API_PORT` (8000); sustituye el `80:80` indicado arriba.
- Retirado `extra_hosts`: `backend` resuelve al contenedor de FastAPI y no al host.
- Se mantiene el modo desarrollo (`next dev`, volúmenes y `--reload`); la configuración de producción del repo de deimian no se incorporó.
- En esta PC el 8080 lo ocupa `Tomcat9`: definir `WEBSITE_PORT=8081` en el `.env` de la raíz.
- Verificado: sitio, Tracker, Backoffice y `/docs` HTTP 200; `/backend/*` llega a FastAPI desde ambos frontends; `POST /backend/users` sin email HTTP 422, sin crear usuarios.
- Backoffice: `api.ts` prioriza `message` sobre `error`, y `tsconfig.json` excluye `__tests__` (los tests no tienen tipos de Jest instalados).

## Modo producción para el VPS (06/11/2026)

- Diagnóstico externo de `157.245.87.27`: sirve `next dev` en 3002/3003 y bloquea su JavaScript con 403 por origen no permitido; por eso el login no envía la petición. El 80 no responde. No se pudo revisar el servidor por SSH.
- `docker-compose.prod.yml`: `next start` compilado en la imagen, sitio en el 80, API sin publicar, sin `--reload` y con `inventory.db` y `suppliers_db.json` montados para conservar datos.
- `uis/Dockerfile` y `uis/start.sh` eligen el modo con `APP_ENV`; `docker-compose.yml` sigue siendo desarrollo local.
- Verificado en local con un stack aislado y un dominio simulado: login HTTP 200 en ambas apps. Pendiente: confirmar qué repo despliega el VPS y aplicarlo allí.

## Próximos pasos

1. Validar las decisiones pendientes con Tecnología y registrar la decisión aprobada.
2. Definir el alcance y criterios de aceptación del primer dominio de producto.
3. Crear cada aplicación únicamente en su ruta asignada y documentar su ejecución y validaciones.
4. Actualizar este archivo cuando cambien el estado, las decisiones o los siguientes hitos.