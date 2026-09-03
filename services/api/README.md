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