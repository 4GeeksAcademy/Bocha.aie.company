# Plan y ejecución de pruebas

## Backend (pytest)

Ejecutar desde la raíz:

```bash
uv run pytest --cov=services/api --cov-report=term-missing
```

La suite usa una base TinyDB temporal por prueba y llama a las funciones de negocio, sin probar la serialización HTTP ni los detalles internos de FastAPI.

### Casos previstos para autenticación

| Área | Camino feliz | Caso límite | Modo de fallo |
| --- | --- | --- | --- |
| Login | Credenciales válidas generan token bearer | Contraseña vacía | Usuario inexistente o contraseña incorrecta |
| Token y sesión | Token válido resuelve el usuario activo | Usuario válido sin perfil opcional | Token expirado, malformado o usuario inexistente |
| Registro | Crea usuario y perfil | Registro sin perfil opcional | Email duplicado y contraseña vacía/corta |
| Recuperación | Usuario existente recibe un token y la respuesta es genérica | Email inexistente o límite de solicitudes alcanzado | Token malformado o reutilizado |
| Cambio de contraseña | Contraseña actual correcta actualiza el hash | Contraseña nueva con exactamente 8 caracteres | Contraseña actual incorrecta |
| Usuarios/perfiles | Admin lista y modifica usuarios | Usuario consulta su propio recurso | Usuario intenta acceder al recurso de otro |

### Backoffice adicional

Se cubren dos grupos no relacionados con autenticación: incidentes y proveedores. Para ambos se prueban creación/consulta, validaciones de frontera y recursos inexistentes o payloads inválidos.

## Frontend (Jest)

Ejecutar desde `uis/backoffice`:

```bash
npm test -- --coverage
```

La suite cubre utilidades usadas por el frontend:

- `auth.ts`: token válido, token expirado/malformado, rutas públicas y redirección segura.
- `api.ts`: extracción de errores de validación, errores de red y respuestas válidas.
- `apiFetch`: cabeceras de autenticación y rechazo cuando falta la sesión.

## Flujo asistido por IA

La revisión asistida por IA señaló dos casos fáciles de omitir: no revelar si un correo existe en `forgot-password` y rechazar tokens de reseteo reutilizados. Ambos están cubiertos en `tests/test_auth.py`; además, la batería verifica que el hash cambia realmente después de `change-password`.

## Resultados verificados

- Backend: `25 passed`; 74% total con `pytest-cov`, 83% en `services/api/auth.py` y 95% en `services/api/routes/auth.py`.
- Autenticación: 19 pruebas en `tests/test_auth.py`, incluyendo los cinco endpoints de `routes/auth.py` y la validación del token de sesión.
- Backoffice: 6 pruebas para incidentes y proveedores.
- Frontend: `7 passed`; 71.42% total, 82% en `auth.ts` y 65.55% en `api.ts`.
- En este entorno `uv` no está instalado; el resultado backend fue verificado con `./myenv/bin/python -m pytest --cov=services/api`. En un entorno con `uv`, el comando equivalente requerido es `uv run pytest --cov=services/api`.