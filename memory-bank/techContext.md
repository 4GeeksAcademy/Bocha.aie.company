# Contexto técnico

## Estado y alcance

Este documento registra el contexto técnico previsto para iniciar Brasaland Digital. La configuración del banco de memoria no crea aplicaciones ni declara funcionalidades como ya construidas. Las decisiones de diseño de `docs/ARCHITECTURE_PROPOSAL.md` son una propuesta; los requisitos de cada hito se aplican a su alcance.

## Límites del monorepo

- `uis/website`: sitio público corporativo.
- `uis/backoffice`: aplicación interna.
- `services/`: APIs y servicios backend.
- `packages/shared/`: ubicación propuesta para contratos y tipos compartidos si el producto los necesita.
- `agents/` y `skills/`: agentes y capacidades del producto.
- `.agents/`: instrucciones, reglas y skills del agente de desarrollo; no es un directorio de agentes de producto.

Mantén frontend y backend como capas separadas que se comunican mediante contratos HTTP/JSON cuando corresponda. No crees ubicaciones paralelas para las aplicaciones ni construyas apps en este hito de configuración.

## Stack descrito en la documentación

- Backend propuesto: Python y FastAPI, con schemas Pydantic y contrato OpenAPI.
- Autenticación propuesta en la arquitectura: JWT.
- Inventario del Hito 5: SQLModel y PostgreSQL/Supabase; el contexto del hito también especifica TinyDB para usuarios/autenticación.
- Arquitectura central propuesta en `docs/ARCHITECTURE_PROPOSAL.md`: MongoDB mediante Motor/Beanie.
- Frontend: la documentación menciona HTML/Tailwind/JavaScript para el sitio estático y Next.js para aplicaciones; no fija un stack único para los dos destinos definidos en este reto.
- TypeScript/JavaScript está descrito en la plantilla y sus paquetes; no hay una decisión documentada de workspace que deba imponerse a las apps futuras.

## Decisión pendiente: persistencia

Los documentos disponibles no coinciden: la propuesta de API central elige MongoDB/Motor/Beanie, mientras que el contexto y README del Hito 5 requieren SQLModel con PostgreSQL/Supabase y TinyDB. No combines ni elijas silenciosamente estas opciones. Antes de crear el servicio central o definir sus modelos, confirma con Tecnología qué almacenamiento corresponde al producto y cómo se relaciona el requisito particular de inventario con esa decisión.

La elección de framework frontend para `uis/website` y `uis/backoffice` también debe fijarse al iniciar cada aplicación si el hito aplicable no la determina.

## Restricciones técnicas

- Diseña para 14 locales, dos países y monedas COP/USD; aplica idioma español/inglés según las necesidades del dominio.
- Mantén los límites por dominio y evita que routers concentren reglas de negocio, de acuerdo con la propuesta de arquitectura.
- No guardes secretos en el repositorio. Usa configuración de entorno documentada y valida CORS explícitamente cuando exista una API consumida por un frontend.
- Trata datos de clientes, empleados y operaciones como información sensible; no uses datos reales en seeds o pruebas sin autorización.
- No cambies contratos, esquemas persistentes, dependencias o configuración de despliegue sin revisar el impacto y las reglas de autorización de `AGENTS.md`.

## Validación

La validación concreta depende del servicio o aplicación que se implemente. Consulta el README del área y ejecuta primero pruebas o verificaciones acotadas al cambio. No des por supuesto que existe un runner global del monorepo ni presentes una propuesta como una implementación probada.