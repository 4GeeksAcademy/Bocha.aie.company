# Propuesta de Arquitectura de Backend — Brasaland API
 
**Autor:** Equipo Brasaland Digital — Tecnología
**Milestone:** 5 — Backend
**Estado:** Borrador para revisión del CTO (Nicolás Park)
 
---
 
## 1. Contexto
 
Brasaland opera 14 locales en dos países (Colombia y Estados Unidos), con dos monedas (COP/USD), dos idiomas (ES/EN) y seis áreas de negocio que hoy funcionan de forma aislada: Operaciones, Compras y Proveedores, Marketing y Experiencia Digital, Personas y Cultura, Formación y Estándares, y Dirección Ejecutiva. El diagnóstico del CTO es claro: no existe API interna, no hay datos consolidados y cada país usa un punto de venta distinto.
 
El mandato de este milestone es construir la **API central de Brasaland**: la capa que unifica locales, menús, ventas, clientes/fidelización, proveedores y stock, y que además sirve de base al agente de fidelización descrito en el reto de automatización (`company-choice.md`). Esta propuesta cubre el razonamiento arquitectónico antes de escribir código, no la implementación en sí.
 
El frontend (`index.html`, `application.html`) ya existe como un sistema **separado** del backend — HTML/Tailwind/JS estático, sin framework — por lo que el backend debe exponerse como una API HTTP consumible de forma independiente, con CORS y variables de entorno bien definidas.
 
---
 
## 2. Patrón arquitectónico elegido: monolito modular por dominio (capas + feature-based)
 
### 2.1 Qué se propone
 
Un **monolito modular organizado por dominio de negocio**, con separación interna en capas (router → service → repository/model) dentro de cada dominio. No se propone microservicios ni serverless puro.
 
### 2.2 Por qué encaja con Brasaland (y no otra alternativa)
 
- **Tamaño de equipo y etapa del producto.** Tecnología es un equipo pequeño liderado por Nicolás Park, construyendo la plataforma "desde casi cero". Microservicios introducen sobrecarga operativa (orquestación, red, observabilidad distribuida) que no se justifica todavía: no hay tráfico ni equipos independientes que exijan escalar servicios por separado.
- **Fuerte interdependencia entre dominios.** El propio análisis de la empresa (`company-choice.md`) señala que la API central tiene "efecto multiplicador": ventas alimenta a Compras (demanda estacional) y a Formación (recetas vs. insumos). Un monolito modular permite que estos dominios compartan transacciones y consultas sin la complejidad de llamadas entre servicios ni consistencia eventual.
- **Múltiples dominios reales, no uno solo.** A diferencia de un CRUD simple, Brasaland necesita locales, menús, ventas, clientes/fidelización, proveedores, y (a futuro) RRHH y formación. Un layout "por tipo de archivo" (todos los routers juntos, todos los modelos juntos) se vuelve inmanejable con esta cantidad de dominios; por eso se organiza **por feature/dominio**, siguiendo el patrón que la documentación oficial de FastAPI presenta en su guía de aplicaciones grandes con múltiples archivos como estándar práctico para proyectos con varios dominios de negocio: cada dominio con su propio router, schemas, modelos y lógica de servicio.
- **Capas dentro de cada dominio.** Dentro de cada dominio se mantiene separación de responsabilidades (patrón en capas): los routers solo manejan HTTP, los services contienen las reglas de negocio (p. ej. cálculo de score de fidelización, conversión de moneda), y los repositories/models encapsulan el acceso a MongoDB. Esto evita que la lógica de negocio quede atrapada en los endpoints y facilita testear cada capa por separado.
- **Camino de evolución.** Si en el futuro un dominio (p. ej. Fidelización, por su componente de IA y volumen de eventos) necesita escalar o desplegarse de forma independiente, la separación por módulos hace esa extracción a microservicio mucho más simple que si el código estuviera entrelazado.
---
 
## 3. Estructura de carpetas y módulos propuesta
 
Se ubica dentro de `services/brasaland-api/` del monorepo (coherente con el README de `services/`, que indica que cada subcarpeta corresponde a un servicio backend específico):
 
```text
services/brasaland-api/
├── app/
│   ├── main.py                    # Punto de entrada, monta routers y middlewares
│   ├── core/
│   │   ├── config.py               # Settings (Pydantic BaseSettings) desde variables de entorno
│   │   ├── security.py             # JWT, hashing de contraseñas
│   │   ├── database.py             # Conexión a MongoDB (Motor/Beanie), gestión de ciclo de vida
│   │   └── i18n.py                 # Utilidades de idioma (ES/EN) y moneda (COP/USD)
│   ├── domains/
│   │   ├── locations/              # Locales (14 restaurantes, 2 países)
│   │   │   ├── router.py
│   │   │   ├── schemas.py          # Pydantic: request/response
│   │   │   ├── models.py           # Documentos MongoDB
│   │   │   ├── service.py          # Reglas de negocio
│   │   │   └── repository.py       # Acceso a datos
│   │   ├── menu/                   # Menús y productos por mercado
│   │   │   └── ...
│   │   ├── sales/                  # Ventas y telemetría en tiempo real
│   │   │   └── ...
│   │   ├── customers/              # Clientes, perfiles, autenticación de la app
│   │   │   └── ...
│   │   ├── loyalty/                # CRM de fidelización, scoring, historial de compras
│   │   │   └── ...
│   │   ├── suppliers/               # Proveedores, historial de precios
│   │   │   └── ...
│   │   ├── inventory/               # Stock por local
│   │   │   └── ...
│   │   └── agent_actions/           # Registro de acciones del Agente de Fidelización
│   │       └── ...
│   ├── shared/
│   │   ├── exceptions.py           # Excepciones y handlers globales
│   │   ├── pagination.py
│   │   └── currency.py             # Conversión COP/USD compartida entre dominios
│   └── api/
│       └── v1/
│           └── api_router.py       # Agrega todos los routers de dominio bajo /api/v1
├── tests/
│   └── domains/...                 # Tests espejo de la estructura de dominios
├── .env.example
├── Dockerfile
├── requirements.txt / pyproject.toml
└── README.md
```
 
**Criterio de separación:** cada carpeta bajo `domains/` corresponde a un límite de negocio real de Brasaland (los mismos que aparecen en `CONTEXT.md`), no a una entidad técnica aislada. `customers` y `loyalty` se separan porque el primero es identidad/autenticación (usado también por Marketing y potencialmente por RRHH) y el segundo es el motor de negocio de fidelización (scoring, campañas) descrito en el reto de automatización — mezclar ambos generaría un módulo sobrecargado y difícil de testear.
 
`packages/shared/` (ya existente en el monorepo, con `@repo/shared-types`) se usa para publicar los contratos de datos (tipos TypeScript) que el frontend y los futuros clientes (`uis/`) consumen, generados a partir de los `schemas.py` de cada dominio, evitando duplicar definiciones entre backend y frontend.
 
---
 
## 4. Organización de rutas y routers (FastAPI)
 
Cada dominio expone su propio `router.py` con su prefijo, y todos se agregan en `api/v1/api_router.py`:
 
```python
# api/v1/api_router.py
from fastapi import APIRouter
from app.domains.locations.router import router as locations_router
from app.domains.menu.router import router as menu_router
from app.domains.sales.router import router as sales_router
from app.domains.customers.router import router as customers_router
from app.domains.loyalty.router import router as loyalty_router
from app.domains.suppliers.router import router as suppliers_router
from app.domains.inventory.router import router as inventory_router
 
api_router = APIRouter(prefix="/api/v1")
api_router.include_router(locations_router, prefix="/locations", tags=["locations"])
api_router.include_router(menu_router, prefix="/menu", tags=["menu"])
api_router.include_router(sales_router, prefix="/sales", tags=["sales"])
api_router.include_router(customers_router, prefix="/customers", tags=["customers"])
api_router.include_router(loyalty_router, prefix="/loyalty", tags=["loyalty"])
api_router.include_router(suppliers_router, prefix="/suppliers", tags=["suppliers"])
api_router.include_router(inventory_router, prefix="/inventory", tags=["inventory"])
```
 
Convenciones:
 
- **Versionado desde el día uno** (`/api/v1/...`): dado que hay un frontend externo ya consumiéndola y un agente de IA que también la consumirá, romper contratos sin versión sería costoso.
- **Nombres de campos consistentes con el frontend ya construido.** El formulario `application.html` ya define el modelo de cliente (`first_name`, `last_name`, `email`, `phone`, `document_type`, `document_number`, `birthdate`, `address`, `city`, `country`, etc.). El dominio `customers` debe usar exactamente estos nombres en sus `schemas.py` para no duplicar mapeos innecesarios entre frontend y backend.
- **Routers "delgados".** Cada endpoint valida el request con un schema Pydantic, delega en el `service` correspondiente y devuelve un schema de respuesta. No hay lógica de negocio ni consultas directas a MongoDB dentro del router.
- **Multi-país y multi-moneda como parámetro transversal**, no como dominios separados: los endpoints de `sales`, `menu` e `inventory` aceptan un parámetro/campo `country` (`CO` / `US`) y devuelven montos en la moneda local, con conversión centralizada en `shared/currency.py`. Evita duplicar routers por país.
---
 
## 5. Separación Frontend/Backend
 
El frontend (HTML/Tailwind/JS estático hoy, y a futuro los proyectos en `uis/`) y el backend son **sistemas desplegados de forma independiente**, comunicados exclusivamente por HTTP/JSON:
 
- **CORS explícito y restrictivo por entorno.** En desarrollo se permite `http://localhost:*`; en producción solo los dominios reales del frontend de Brasaland (web corporativa y app de fidelización), nunca `allow_origins=["*"]` cuando se usan credenciales.
- **Variables de entorno separadas por lado.** El backend expone su configuración (URL de MongoDB, secreto JWT, orígenes permitidos) vía `.env` no versionado, siguiendo `pydantic-settings`. El frontend consume la URL pública de la API mediante una variable expuesta al cliente (equivalente a `NEXT_PUBLIC_API_URL` en los proyectos Next.js de `uis/`), nunca secretos del backend.
- **Autenticación basada en tokens (JWT).** El backend no gestiona sesiones de servidor; emite un access token (y refresh token) que el frontend/app de fidelización adjunta en cada request. Esto es indispensable porque el cliente se registra vía `application.html` y también existirá una futura app móvil/web de fidelización — ambos clientes deben poder autenticar contra la misma API sin estado compartido en el servidor.
- **Contratos versionados y explícitos.** Los `schemas.py` de cada dominio son el contrato público; cualquier cambio breaking requiere una nueva versión de API o un campo opcional, nunca un cambio silencioso sobre `v1`.
---
 
## 6. Decisiones técnicas iniciales
 
| Decisión | Elección | Justificación |
|---|---|---|
| Framework | FastAPI | Ya definido por el curso; tipado con Pydantic reduce errores de contrato entre frontend/backend/agente. |
| Base de datos | MongoDB (vía Motor/Beanie como ODM async) | El catálogo de menú, promociones y el perfil de comportamiento del cliente (historial de acciones del agente, scoring) varían en forma entre Colombia y Florida y evolucionan rápido durante el desarrollo del agente de fidelización; un esquema flexible por documento evita migraciones constantes en esta etapa temprana. Los dominios con relaciones más rígidas (locales, proveedores) se modelan igual como colecciones, con referencias por ID. |
| Autenticación | JWT (access + refresh) | Cliente desacoplado (web, futura app), sin estado en servidor, compatible con múltiples locales/países. |
| Despliegue | Contenedor Docker sobre VPS/EC2 | Coherente con el mandato de construir la plataforma desde cero con un equipo pequeño: control total de infraestructura sin acoplarse a un proveedor serverless, y reutilizable para los demás servicios del monorepo (`infra/`). Se define un `Dockerfile` por servicio en `services/` y la orquestación (docker-compose o similar) en `infra/`. |
| Idioma/moneda | Middleware/parámetro transversal (`Accept-Language`, `country`) | Evita duplicar dominios por país; centraliza la lógica de conversión e i18n en `shared/`. |
| Documentación de API | OpenAPI autogenerado por FastAPI (`/docs`) | Sirve como contrato vivo para el frontend, el agente de fidelización y equipos futuros, sin mantenimiento manual. |
 
---
 
## 7. Riesgos y puntos de atención
 
1. **Que el monolito modular degenere en un monolito acoplado.** Si los `services` de un dominio empiezan a importar directamente `models`/`repository` de otro dominio (en lugar de comunicarse a través de una interfaz de `service` explícita), se pierde el beneficio de la separación por dominio y una futura extracción a microservicio (p. ej. el dominio `loyalty` con el agente de IA) se vuelve muy costosa. Mitigación: revisar en code review que las importaciones cruzadas entre `domains/` solo ocurran a nivel de `service`, nunca de `repository` o `models`.
2. **Inconsistencia de moneda e idioma si cada dominio implementa su propia conversión.** Con ventas ocurriendo simultáneamente en COP y USD, un bug de conversión en `sales` que no coincida con el usado en `loyalty` (para calcular ticket promedio) generaría métricas contradictorias entre Operaciones y Marketing — justamente el problema que hoy sufre Mariana con los reportes en PDF. Mitigación: toda conversión de moneda pasa obligatoriamente por `shared/currency.py`; ningún dominio implementa su propia lógica de tasas.
3. **CORS mal configurado en producción.** Dado que el frontend y el backend se despliegan por separado, un `allow_origins` demasiado permisivo (o mal restringido, bloqueando el dominio real de producción) es un riesgo concreto de seguridad o de bloqueo funcional. Mitigación: configuración de CORS explícita por entorno (dev/staging/prod) leída desde variables de entorno, nunca hardcodeada, con pruebas de humo tras cada despliegue.
4. **El agente de fidelización como consumidor "invisible" de la API.** El reto de automatización elegido depende de que el Agente de Fidelización lea y escriba en `loyalty` y `agent_actions` con la misma consistencia que el resto de la API, pero al no ser un usuario humano es fácil que sus llamadas queden fuera del alcance de la autenticación/rate-limiting pensada para el frontend. Mitigación: tratar al agente como un cliente autenticado más (token de servicio con permisos acotados), no como un proceso con acceso directo a la base de datos.
---
 
## 8. Próximos pasos
 
- Validar esta propuesta con Nicolás Park (CTO) y el equipo de Tecnología antes de crear el scaffold del proyecto.
- Definir el modelo de datos detallado (colecciones y campos) por dominio como siguiente entregable técnico.
- Configurar `infra/` con el `Dockerfile` inicial y variables de entorno de ejemplo (`.env.example`) para `services/brasaland-api/`.