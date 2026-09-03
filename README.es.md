# Proyecto de Compañía - Ingeniería de IA — Plantilla para estudiantes

[![4Geeks Academy](https://img.shields.io/badge/4Geeks-Academy-blue)](https://4geeksacademy.com)
[![AI Engineering](https://img.shields.io/badge/track-AI%20Engineering-green)](https://4geeksacademy.com/es/programas-de-carrera/ingenieria-ia)

_Plantilla base para proyectos transversales del Programa de Carrera en Ingeniería de IA — 4Geeks Academy._

_Las instrucciones están [disponibles en inglés](./README.md)._

---

## Propósito

Este repositorio es la **plantilla de inicio** para los proyectos transversales. Trabajarás con escenarios de empresas reales (Brasaland, TrackFlow, Nexova) construyendo entregables que se corresponden con los hitos del curso (Web, Programación, Backend, Telemetría, RAG, Agentes, Workflows, Tiempo real).

- Crea una plantilla a partir de este repositorio.
- Reemplaza el `CONTEXT.md` placeholder por el contexto de tu empresa asignada.
- Usa `skills/` y los `README.md` por carpeta como guía de trabajo.

---

## Estado actual de la plantilla

Actualmente el repositorio ofrece una **estructura base de carpetas y documentación**, pero todavía no incluye aplicaciones ejecutables ni scripts globales en la raíz.

- `CONTEXT.md` es un placeholder y debe sustituirse por el contexto de la empresa asignada.
- No existe todavía un `AGENTS.md` en la raíz.
- Existe metadata del paquete compartido en `packages/shared/package.json` (`@repo/shared-types`), pero aún no hay runner de workspace en raíz.

---

## Estructura del repositorio

```text
ai-engineering-company-project-monorepo/
├── README.md
├── README.es.md
├── CONTEXT.md                # Placeholder a reemplazar con el contexto asignado
├── agents/                   # Patrones/plantillas de agentes y documentación de tools
├── data/                     # raw, process, pipelines, eval
├── docs/                     # Documentación de proyecto y arquitectura
├── infra/                    # Docker, Terraform, configuraciones de despliegue
├── internal/                 # CLIs, scripts de migración empaquetados, utilidades internas
├── mcps/                     # Servidores Model Context Protocol (MCP)
├── packages/
│   └── shared/               # Paquete compartido (@repo/shared-types)
├── scripts/                  # Convenciones/documentación de scripts
├── services/                 # APIs y workers en segundo plano
├── shared/                   # Recursos/convenciones compartidas a nivel repo
├── skills/                   # Skills reutilizables para agentes
├── uis/                      # Interfaces de usuario (React, Next.js, Streamlit, HTML)
└── workflows/                # Documentación de automatizaciones/orquestación
```

---

## Cómo empezar

1. **Usa este repositorio como plantilla** y crea tu propio repo de proyecto.
2. **Clona** tu repositorio (o ábrelo en Codespaces).
3. **Reemplaza** `CONTEXT.md` con el contexto completo de tu empresa asignada.
4. **Revisa** los `README.md` de cada carpeta raíz para entender responsabilidades (`uis/`, `services/`, `data/`, `skills/`, etc.).
5. **Empieza a implementar** entregables por hito en `uis/` y `services/`, reutilizando `packages/shared/` y `data/` según corresponda.

---

## Hitos (referencia)

| Hito | Enfoque       | Entregables típicos                              |
| ---- | ------------- | ------------------------------------------------ |
| 0    | Prework       | Configuración del entorno, primeros prompts      |
| 1    | Web           | Sitio corporativo, formularios, SEO              |
| 2    | Programación  | Lógica de negocio, puntuación, cálculos          |
| 3    | UI con IA     | Interfaces generadas con IA                      |
| 4    | Next.js       | Portales, app de fidelización, UI de operaciones |
| 5    | Backend       | API central (ubicaciones, menús, ventas, etc.)   |
| 6    | Telemetría    | Pipeline de datos, dashboards                    |
| 7    | RAG y memoria | Base de conocimiento semántica, búsqueda         |
| 8    | Agentes       | Agentes de soporte, onboarding, formación        |
| 9    | Workflows     | Automatizaciones con n8n                         |
| 10   | Tiempo real   | Dashboards en vivo, alertas, streaming           |

---

## Enlaces

- [4Geeks Academy — Ingeniería de IA](https://4geeksacademy.com/es/programas-de-carrera/ingenieria-ia)
- [Cómo empezar un proyecto de código](https://4geeks.com/lesson/how-to-start-a-project)

---

## Contribuidores

Esta plantilla fue creada como parte del Programa de Carrera de Ingeniería de IA de 4Geeks Academy por [@marcogonzalo](https://www.linkedin.com/in/marcogonzalo) y [@alezanchezr](https://x.com/alesanchezr), junto a otros muchos colaboradores. Descubre más sobre nuestro [Curso de Ingeniería de IA](https://4geeksacademy.com/es/programas-de-carrera/ingenieria-ia) y sobre [otros cursos](https://4geeksacademy.com/es/comparar-programas).

Puedes encontrar otras plantillas y recursos similares en la [página de GitHub de 4Geeks Academy](https://github.com/4geeksacademy).

_Esta plantilla la mantiene 4Geeks Academy para el track de Ingeniería de IA. Uso exclusivo del programa._



## Levantar backend y UIs para probar autenticación manualmente

Esta sección describe cómo levantar el backend y las dos apps internas del monorepo para probar manualmente los flujos de login, register, logout, profile y redirecciones.

### 1. Preparar el backend FastAPI

1. Sitúate en la raíz del monorepo.
2. Activa el entorno virtual.

Si ya existe el entorno de este workspace:

```bash
source myenv/bin/activate
```

Si tu entorno local usa otro nombre, por ejemplo el documentado en la API:

```bash
source .venv/bin/activate
```

3. Instala las dependencias del backend si todavía no están instaladas.

```bash
python -m pip install -r services/api/requirements.txt
```

4. Verifica que exista el archivo de entorno del backend en [services/api/.env](services/api/.env) con estas variables mínimas:

```env
JWT_SECRET=tu_clave_secreta
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

5. Levanta la API en el puerto 8000.

```bash
python -m uvicorn services.api.main:app --host 0.0.0.0 --port 8000 --reload
```

La API quedará disponible en http://127.0.0.1:8000.

### 2. Levantar Backoffice

1. Abre una segunda terminal.
2. Entra en [uis/backoffice](uis/backoffice).

```bash
cd uis/backoffice
```

3. Instala dependencias si todavía no lo hiciste.

```bash
npm install
```

4. Levanta la app en un puerto dedicado, por ejemplo 3000.

```bash
npm run dev -- --hostname 0.0.0.0 --port 3000
```

Accede a http://127.0.0.1:3000.

### 3. Levantar Talent Pipeline Tracker

1. Abre una tercera terminal.
2. Entra en [uis/talent-pipeline-tracker](uis/talent-pipeline-tracker).

```bash
cd uis/talent-pipeline-tracker
```

3. Instala dependencias si todavía no lo hiciste.

```bash
npm install
```

4. Levanta la app en otro puerto, por ejemplo 3001.

```bash
npm run dev -- --hostname 0.0.0.0 --port 3001
```

Accede a http://127.0.0.1:3001.

### 4. Flujo manual recomendado de prueba

#### Backoffice

1. Abre http://127.0.0.1:3000/login.
2. Intenta entrar con credenciales inválidas y confirma que aparece un mensaje de error.
3. Ve a http://127.0.0.1:3000/register.
4. Registra un usuario nuevo con email y password válidos. Puedes completar también nombre, teléfono y dirección.
5. Confirma que el registro hace login automático y redirige a la home privada.
6. Navega a la home, incidencias y proveedores y confirma que no hay redirección mientras exista sesión.
7. Abre http://127.0.0.1:3000/account/profile y verifica que carga email, role y datos de perfil.
8. Modifica nombre, teléfono o dirección y confirma que el guardado responde correctamente.
9. Pulsa Cerrar sesión y confirma que vuelves a /login.
10. Intenta abrir directamente una ruta privada como http://127.0.0.1:3000/suppliers sin sesión y verifica la redirección a /login.

#### Talent Pipeline Tracker

1. Abre http://127.0.0.1:3001/login.
2. Intenta entrar con credenciales inválidas y confirma el error.
3. Ve a http://127.0.0.1:3001/register.
4. Registra un usuario nuevo o entra con uno existente.
5. Confirma que, tras login o registro, la app redirige a la ruta principal.
6. Abre http://127.0.0.1:3001/account/profile y verifica lectura y edición del perfil autenticado.
7. Pulsa Cerrar sesión y confirma la vuelta a /login.
8. Intenta abrir directamente http://127.0.0.1:3001/ o una ruta privada como /candidates/123 sin sesión y verifica la redirección.

### 5. Qué validar exactamente

Durante las pruebas manuales conviene verificar estos puntos:

1. Login correcto guarda el token en localStorage.
2. Login incorrecto no crea sesión y muestra error.
3. Register crea usuario y luego inicia sesión automáticamente.
4. Logout elimina el token y bloquea el acceso posterior a rutas privadas.
5. /account/profile carga datos desde auth/me.
6. /account/profile actualiza datos con profiles/me.
7. Una ruta privada sin token redirige a /login.
8. Si una llamada protegida devuelve 401, la sesión se limpia y la app redirige a /login.

### 6. Notas importantes

1. Tanto Backoffice como Talent Pipeline Tracker usan el backend local de [services/api](services/api) para login, registro y perfil.
2. Backoffice además consume rutas protegidas del mismo backend para incidencias y proveedores.
3. Talent Pipeline Tracker ya envía JWT en su cliente frontend, pero su funcionamiento end-to-end depende también del servicio que responda sus rutas de records y notes.