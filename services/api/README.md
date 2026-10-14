# Brasaland Incidents API

Backend FastAPI para analizar archivos CSV de incidencias de Brasaland.

## Requisitos

Ejecutar con el entorno virtual del monorepo activado.

En este monorepo se está usando `myenv/`, no `.venv`.

## Ejecutar

Desde la raíz del monorepo:

```bash
PYTHONPATH=/workspaces/Bocha.aie.company myenv/bin/python -m uvicorn services.api.main:app --host 0.0.0.0 --port 8000 --reload
```

## Instalar dependencias de la API

Desde la raíz del monorepo:

```bash
myenv/bin/pip install -r services/api/requirements.txt
```
## Variables de entorno

El archivo `services/api/.env` debe existir con al menos estas variables:

```env
JWT_SECRET=tu_clave_secreta
ACCESS_TOKEN_EXPIRE_MINUTES=30
DATABASE_URL=postgresql+psycopg://usuario:password@host:6543/postgres
SUPPLIERS_DB_PATH=services/api/suppliers_db.json

# Recuperación de contraseña (AUTH-03)
RESEND_API_KEY=re_tu_api_key
EMAIL_FROM="Brasaland <onboarding@resend.dev>"
FRONTEND_RESET_URL=http://localhost:3000/reset-password
RESET_TOKEN_EXPIRE_MINUTES=30
PASSWORD_RESET_RATE_LIMIT_MAX=3
PASSWORD_RESET_RATE_LIMIT_WINDOW_MINUTES=15
```

Ver [`.env.example`](.env.example) como referencia. `RESEND_API_KEY` se obtiene en [resend.com](https://resend.com);
`FRONTEND_RESET_URL` debe apuntar a la página `/reset-password` del frontend que esté corriendo.

## Milestone 5: inventario con SQLModel + Supabase

El hito 5 quedó integrado en el backend existente de `services/api` con doble base de datos:

- TinyDB sigue manejando autenticación, usuarios, perfiles, reset de contraseña, suppliers e incidents.
- SQLModel + Supabase/PostgreSQL manejan `Ingredient`, `IngredientEntry` y `IngredientExit`.
- Todos los endpoints nuevos viven bajo `/inventory`.

### Preparar el entorno

1. Completa `services/api/.env` con `DATABASE_URL`, `JWT_SECRET` y el resto de variables del bloque anterior.
2. Instala dependencias:

```bash
myenv/bin/pip install -r services/api/requirements.txt
```

3. Asegúrate de tener al menos un usuario en TinyDB, porque el seed de inventario reutiliza un `user_uuid` existente.

### Ejecutar el seed del inventario

Desde la raíz del monorepo:

```bash
PYTHONPATH=/workspaces/Bocha.aie.company myenv/bin/python -m services.api.seed_inventory
```

El seed crea:

- 6 ingredientes
- 4 entradas
- 3 salidas

Stock neto esperado tras el seed:

- `BRS-BEEF-001` → `60.0`
- `BRS-SAUCE-001` → `35.0`
- `BRS-PROD-001` → `75.0`

### Levantar la API

```bash
PYTHONPATH=/workspaces/Bocha.aie.company myenv/bin/python -m uvicorn services.api.main:app --host 0.0.0.0 --port 8000 --reload
```

### Probar los endpoints del milestone 5

1. Obtener token:

```bash
curl -X POST http://127.0.0.1:8000/auth/login \
	-H 'Content-Type: application/x-www-form-urlencoded' \
	-d 'username=tu-email@example.com&password=tu-password'
```

2. Listar productos con stock calculado:

```bash
curl http://127.0.0.1:8000/inventory/products
```

3. Crear ingrediente:

```bash
curl -X POST http://127.0.0.1:8000/inventory/products \
	-H 'Content-Type: application/json' \
	-H 'Authorization: Bearer TU_TOKEN' \
	-d '{
		"name": "Sal marina",
		"sku": "BRS-SAUCE-010",
		"unit": "kg",
		"category": "sauce",
		"country": "CO"
	}'
```

4. Registrar entrada:

```bash
curl -X POST http://127.0.0.1:8000/inventory/orders/inbound \
	-H 'Content-Type: application/json' \
	-H 'Authorization: Bearer TU_TOKEN' \
	-d '{
		"ingredient_id": 1,
		"quantity": 10,
		"supplier_name": "Carnes del Valle S.A.",
		"location_id": 1
	}'
```

5. Registrar salida:

```bash
curl -X POST http://127.0.0.1:8000/inventory/orders/outbound \
	-H 'Content-Type: application/json' \
	-H 'Authorization: Bearer TU_TOKEN' \
	-d '{
		"ingredient_id": 1,
		"quantity": 4,
		"reason": "consumption",
		"location_id": 1
	}'
```

6. Listar órdenes:

```bash
curl http://127.0.0.1:8000/inventory/orders
```

### Validación local

```bash
PYTHONPATH=/workspaces/Bocha.aie.company myenv/bin/pytest tests/test_inventory.py -q
PYTHONPATH=/workspaces/Bocha.aie.company myenv/bin/pytest tests/test_auth.py -q
```