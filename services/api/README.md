# Brasaland Incidents API

Backend FastAPI para analizar archivos CSV de incidencias de Brasaland.

## Requisitos

Ejecutar con el entorno virtual del monorepo activado.

## Ejecutar

Desde la raíz del monorepo:

```bash
source .venv/bin/activate
python -m uvicorn services.api.main:app --host 0.0.0.0 --port 8000 --reload
```

## Instalar dependencias de la API

Desde la raíz del monorepo:

```bash
source .venv/bin/activate
python -m pip install -r services/api/requirements.txt
```
## Variables de entorno

El archivo `services/api/.env` debe existir con al menos estas variables:

```env
JWT_SECRET=tu_clave_secreta
ACCESS_TOKEN_EXPIRE_MINUTES=30
```