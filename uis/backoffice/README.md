# Brasaland Backoffice

Panel interno realizado con Next.js, React y TypeScript para las operaciones de Brasaland.

Actualmente incluye estas secciones funcionales:

- autenticación de usuarios
- análisis de incidencias CSV
- gestión de proveedores
- gestión de inventario de ingredientes

## Requisitos

- Node.js y npm instalados
- API de FastAPI disponible en el puerto 8000
- entorno Python del monorepo en `myenv/`

En este repositorio el backend no se ejecuta con `.venv`; se usa `myenv/`.

## Instalar dependencias del backoffice

Desde esta carpeta:

```bash
npm install
```

## Variables de entorno

Crea un archivo `.env.local` en esta carpeta con al menos esta variable:

```env

```

El backoffice usa el prefijo `/backend/*` y `next.config.ts` reescribe esas llamadas hacia la URL configurada en `NEXT_PUBLIC_INVENTORY_API_URL`.

## Levantar el backend

Desde la raíz del monorepo:

```bash
myenv/bin/pip install -r services/api/requirements.txt
PYTHONPATH=/workspaces/Bocha.aie.company myenv/bin/python -m uvicorn services.api.main:app --host 0.0.0.0 --port 8000 --reload
```

Si vas a probar la sección de inventario, asegúrate también de tener configurado `services/api/.env` y de ejecutar el seed de inventario:

```bash
PYTHONPATH=/workspaces/Bocha.aie.company myenv/bin/python -m services.api.seed_inventory
```

Consulta [services/api/README.md](../../services/api/README.md) para el detalle completo de variables de entorno y seed.

## Levantar el backoffice

Desde esta carpeta:

```bash
npm run dev -- --hostname 0.0.0.0
```

La aplicación quedará disponible en [http://localhost:3000](http://localhost:3000).

## Flujo mínimo de uso

1. Inicia la API en el puerto 8000.
2. Inicia el backoffice en el puerto 3000.
3. Abre `/register` para crear un usuario si todavía no tienes credenciales.
4. Inicia sesión en `/login`.
5. Usa las secciones del menú superior: Inicio, Incidencias, Proveedores, Inventario y Movimientos.

## Rutas principales

- `/login`: acceso al backoffice
- `/register`: registro de usuario
- `/incidents`: análisis de incidencias CSV
- `/suppliers`: gestión de proveedores
- `/inventory/products`: consulta de ingredientes y stock actual
- `/inventory/orders/inbound`: registro de entradas de ingredientes
- `/inventory/orders/outbound`: registro de consumo o merma
- `/inventory/orders`: historial de movimientos de inventario

## Validación local

Desde esta carpeta:

```bash
npm run lint
npm run build
```

Desde la raíz del monorepo, para validar el backend de inventario con `myenv`:

```bash
PYTHONPATH=/workspaces/Bocha.aie.company myenv/bin/pytest tests/test_inventory.py -q
```