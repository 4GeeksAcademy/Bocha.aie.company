# Auditoría de serialización FastAPI

Estado del documento: **completo** (diagnóstico inicial en A–B; resultado final en A2–E).

## A. Resumen ejecutivo (diagnóstico inicial)

- Backend auditado: `services/api` (aplicación FastAPI en `services/api/main.py`, título «Brasaland Incidents API»). No hay otras aplicaciones FastAPI ni subaplicaciones montadas, ni WebSockets.
- Versiones instaladas en el entorno de auditoría: FastAPI 0.141.1, Pydantic 2.13.4 (v2), SQLModel 0.0.48, Starlette 1.6.0, Python 3.14. `requirements.txt` no fija versiones.
- Almacenamiento: TinyDB (JSON) para proveedores, usuarios, perfiles, incidencias y reseteos; SQLModel/SQL para inventario (`Ingredient`, `IngredientEntry`, `IngredientExit`).
- Routers registrados: `suppliers`, `auth`, `users`, `profiles`, `incidents`, `inventory` más 3 rutas definidas directamente en `main.py`.
- Método: lectura del código de cada router; el registro real se contrastó con `app.openapi()` (en FastAPI 0.141 `app.routes` agrupa los routers incluidos en `_IncludedRouter`, por eso se usó OpenAPI). Los 32 pares método+ruta del código coinciden con los 32 de OpenAPI.
- Exclusiones: `/docs`, `/docs/oauth2-redirect`, `/redoc`, `/openapi.json` (rutas automáticas del framework).
- Todo el diagnóstico inicial es **análisis estático** del código y de los consumidores en `uis/`; no se ejecutaron endpoints en esta etapa.

| Estado inicial | Rutas |
| -------------- | ----- |
| ✅ Ya serializado | 20 |
| ⚠️ Parcialmente serializado | 7 |
| ❌ Sin serializar | 4 |
| Excepción no JSON (CSV) | 1 |
| **Total** | **32** |

Consumidores rastreados: `uis/backoffice` (`/backend/...` vía `requestJson`) y `uis/talent-pipeline-tracker` (`lib/auth.ts`, `lib/incidents-api.ts`). No hay tests de backend en el repositorio.

## B. Inventario inicial (una fila por método y ruta)

| Método | Ruta | Archivo / handler | Estado inicial | `response_model` inicial | Problema identificado |
| ------ | ---- | ----------------- | -------------- | ------------------------ | --------------------- |
| GET | `/` | `main.py` / `root` | ❌ | ninguno | JSON sin contrato |
| POST | `/api/incidents/analyze` | `main.py` / `analyze_incidents` | ❌ | ninguno | Devuelve el `dict` del analizador sin contrato |
| GET | `/api/incidents/results/export` | `main.py` / `export_results` | Excepción CSV | ninguno | Contrato no JSON no declarado en OpenAPI |
| POST | `/suppliers` | `routes/suppliers.py` / `create_supplier` | ✅ | `Supplier` | Ninguno relevante |
| GET | `/suppliers` | `list_suppliers` | ✅ | `list[Supplier]` | Ninguno relevante |
| GET | `/suppliers/{supplier_id}` | `get_supplier` | ✅ | `Supplier` | Ninguno relevante |
| PATCH | `/suppliers/{supplier_id}/rate` | `update_supplier_rate` | ✅ | `Supplier` | Ninguno relevante |
| PATCH | `/suppliers/{supplier_id}/status` | `update_supplier_status` | ✅ | `Supplier` | Ninguno relevante |
| DELETE | `/suppliers/{supplier_id}` | `delete_supplier` | ❌ | ninguno (anotación `dict[str, str]`) | Contrato comodín `dict` |
| POST | `/auth/login` | `routes/auth.py` / `login` | ✅ | `LoginResponse` | Ninguno (el `access_token` es legítimo) |
| GET | `/auth/me` | `auth_me` | ⚠️ | `AuthMeResponse` | `profile` anidado expone `id` y `user_id` internos no usados |
| POST | `/auth/forgot-password` | `forgot_password` | ✅ | `PasswordActionResponse` | Ninguno (mensaje genérico) |
| POST | `/auth/reset-password` | `reset_password` | ✅ | `PasswordActionResponse` | Ninguno |
| POST | `/auth/change-password` | `change_password` | ✅ | `PasswordActionResponse` | Ninguno |
| POST | `/users` | `routes/users.py` / `register_user` | ⚠️ | `UserRead` | `profile` con ids internos; el registro no usa el cuerpo de la respuesta |
| GET | `/users` | `get_users` | ⚠️ | `list[UserRead]` | Cualquier usuario autenticado recibe perfiles (teléfono, dirección) de todos |
| GET | `/users/{user_id}` | `get_user` | ⚠️ | `UserRead` | `profile` con ids internos |
| PUT | `/users/{user_id}` | `put_user` | ⚠️ | `UserRead` | Ids internos; la entrada `UserUpdate` permite `role` a un usuario no admin |
| DELETE | `/users/{user_id}` | `remove_user` | ❌ | ninguno (anotación `dict[str, str]`) | Contrato comodín `dict` |
| GET | `/profiles/me` | `routes/profiles.py` / `get_my_profile` | ⚠️ | `Profile` | Expone `id` y `user_id` internos sin consumidor |
| PUT | `/profiles/me` | `update_my_profile` | ⚠️ | `Profile` | Ídem |
| POST | `/api/incidents` | `routes/incidents.py` / `create_incident` | ✅ | `Incident` | Ninguno relevante |
| GET | `/api/incidents` | `list_incidents` | ✅ | `list[Incident]` | Ninguno relevante |
| GET | `/api/incidents/summary` | `incident_summary` | ✅ | `IncidentSummary` | Ninguno relevante |
| GET | `/api/incidents/{incident_id}` | `get_incident` | ✅ | `Incident` | Ninguno relevante |
| PATCH | `/api/incidents/{incident_id}/status` | `update_incident_status` | ✅ | `Incident` | Ninguno relevante |
| GET | `/inventory/products` | `routes/inventory.py` / `list_products` | ✅ | `list[IngredientRead]` | Sin problema de datos; sin autenticación (ver D) |
| POST | `/inventory/products` | `create_product` | ✅ | `IngredientRead` | Ninguno |
| GET | `/inventory/products/{ingredient_id}` | `get_product` | ✅ | `IngredientRead` | Sin autenticación (ver D) |
| POST | `/inventory/orders/inbound` | `create_inbound_order` | ✅ | `InventoryOrderRead` | Ninguno |
| POST | `/inventory/orders/outbound` | `create_outbound_order` | ✅ | `InventoryOrderRead` | Ninguno |
| GET | `/inventory/orders` | `list_orders` | ✅ | `list[InventoryOrderRead]` | Sin autenticación; expone `user_uuid` (consumido por la UI) |

> El diagnóstico anterior (secciones A y B) es el estado **original** y se conserva tal cual. Lo que sigue es el resultado tras la implementación (Etapas 2–4).

## A2. Resumen final

- Rutas auditadas: **32** (31 JSON + 1 CSV). Comparación inicial/final con OpenAPI: 32 operaciones antes y 32 después; no desapareció ninguna.
- Necesitaban cambios: **11** (4 ❌ + 7 ⚠️). Corregidas: **11**. Ya correctas sin cambio de contrato: 20 (`IngredientRead` se desacopló de los validadores de entrada, ver abajo). Excepción CSV: 1, ahora declarada en OpenAPI.
- Validadas por tests automáticos (TestClient): **32/32** (el CSV por cabeceras y contenido). Validadas con ejecución real contra uvicorn: 7 rutas (ver E). Pendientes de verificación: ninguna de serialización; sí quedan **decisiones de autorización pendientes de confirmación** (ver D).
- Criterio: se inventarió cada método+ruta de negocio; se excluyen las rutas automáticas del framework; `GET /api/incidents/results/export` se trata como excepción técnica no JSON.

## B2. Inventario final

| Método | Ruta | Esquema final | Estado final |
| ------ | ---- | ------------- | ------------ |
| GET | `/` | `RootResponse` | Corregido y validado (test + ejecución real) |
| POST | `/api/incidents/analyze` | `IncidentAnalysisResult` | Corregido y validado (test) |
| GET | `/api/incidents/results/export` | `text/csv` (sin modelo) | Excepción técnica justificada, validada (test) |
| POST | `/suppliers` | `Supplier` | Validado (test) |
| GET | `/suppliers` | `list[Supplier]` | Validado (test) |
| GET | `/suppliers/{supplier_id}` | `Supplier` | Validado (test) |
| PATCH | `/suppliers/{supplier_id}/rate` | `Supplier` | Validado (test) |
| PATCH | `/suppliers/{supplier_id}/status` | `Supplier` | Validado (test) |
| DELETE | `/suppliers/{supplier_id}` | `MessageResponse` | Corregido y validado (test) |
| POST | `/auth/login` | `LoginResponse` | Validado (test + ejecución real) |
| GET | `/auth/me` | `AuthMeResponse` (con `ProfileRead`) | Corregido y validado (test + ejecución real) |
| POST | `/auth/forgot-password` | `PasswordActionResponse` | Validado (test) |
| POST | `/auth/reset-password` | `PasswordActionResponse` | Validado parcialmente (test del error 400; el éxito requiere un token real, no ejercido) |
| POST | `/auth/change-password` | `PasswordActionResponse` | Validado parcialmente (test del error 400; el éxito no se ejercitó) |
| POST | `/users` | `UserRead` (con `ProfileRead`) | Corregido y validado (test + ejecución real) |
| GET | `/users` | `list[UserListItem]` | Corregido y validado (test + ejecución real) |
| GET | `/users/{user_id}` | `UserRead` | Corregido y validado (test) |
| PUT | `/users/{user_id}` | `UserRead` | Corregido y validado (test); autorización pendiente (D) |
| DELETE | `/users/{user_id}` | `MessageResponse` | Corregido y validado (test) |
| GET | `/profiles/me` | `ProfileRead` | Corregido y validado (test + ejecución real) |
| PUT | `/profiles/me` | `ProfileRead` | Corregido y validado (test) |
| POST | `/api/incidents` | `Incident` | Validado (test) |
| GET | `/api/incidents` | `list[Incident]` | Validado (test) |
| GET | `/api/incidents/summary` | `IncidentSummary` | Validado (test) |
| GET | `/api/incidents/{incident_id}` | `Incident` | Validado (test) |
| PATCH | `/api/incidents/{incident_id}/status` | `Incident` | Validado (test) |
| GET | `/inventory/products` | `list[IngredientRead]` | Validado (test) |
| POST | `/inventory/products` | `IngredientRead` | Validado (test + ejecución real) |
| GET | `/inventory/products/{ingredient_id}` | `IngredientRead` | Validado (test) |
| POST | `/inventory/orders/inbound` | `InventoryOrderRead` | Validado (test) |
| POST | `/inventory/orders/outbound` | `InventoryOrderRead` | Validado (test) |
| GET | `/inventory/orders` | `list[InventoryOrderRead]` | Validado (test) |

## C. Fichas detalladas

Convenciones: «Estado inicial» = columna de la sección B. Todo el análisis de campos originales es **inferido por análisis estático** del código; el payload original no se ejecutó. Los códigos de éxito no cambiaron. Archivos: `M` = `services/api/models.py`, `S` = `services/api/schemas.py`, `U` = `services/api/users_service.py`, `main` = `services/api/main.py`.

### Raíz y análisis de incidencias (`main.py`)

**GET `/`** — `root`. Consumidor: ninguno rastreado (health check). Original: `dict` con `message` (200), sin `response_model` ❌. Final: `RootResponse{message: str}`. Cambios: `main`, `M`. Estado final: corregido, validado (test y ejecución real).

**POST `/api/incidents/analyze`** — `analyze_incidents`. Entrada: multipart `file` (CSV). Consumidor: `uis/backoffice/src/app/incidents/page.tsx` (tipo `AnalysisResult`). Original: `dict` de `analyze_csv_text` (200), sin modelo ❌. Campos originales (inferidos del analizador): `company`, `source_file`, `total_records`, `valid_records`, `invalid_records`, `invalid_breakdown`, `by_category`, `by_status`, `satisfaction`. Todos los usa la UI; ninguno es sensible. Final: `IncidentAnalysisResult` con `BreakdownValue{count:int, percentage:float}` y `SatisfactionResult{closed_cases:int, scored_cases:int, average:float|None, scores:dict[str,int]}`; `by_category`/`by_status` son `dict[str, BreakdownValue]` porque las claves son valores del dominio. `LAST_ANALYSIS` sigue guardando el `dict` original para el CSV. Cambios: `main`, `M`. Final: corregido, validado (test).

**GET `/api/incidents/results/export`** — `export_results`. Consumidor: botón de exportación del Backoffice. Original: `Response` CSV con `Content-Disposition: attachment; filename="results.csv"`, 200 o 404. Excepción no JSON: no se creó un modelo ficticio; se declaró `response_class=Response` y `responses={200: text/csv}` para que OpenAPI lo describa. Final: excepción técnica justificada; validada por test (content-type, cabecera de descarga).

### Proveedores (`routes/suppliers.py`)

**POST/GET/GET id/PATCH rate/PATCH status** — `create_supplier`, `list_suppliers`, `get_supplier`, `update_supplier_rate`, `update_supplier_status`. Consumidor: `uis/backoffice/src/app/suppliers/page.tsx` (tipo `Supplier`: usa `contact_email`, `notes`, `updated_at`, etc.). Original: `response_model=Supplier` / `list[Supplier]` (201/200) ✅; campos `id, name, country, categories, rate_per_unit, currency, status, contact_email, notes, updated_at`, todos consumidos o de negocio; sin datos sensibles. Entrada separada en `SupplierCreate`, `SupplierRateUpdate`, `SupplierStatusUpdate` (sin mass assignment: `id`/`updated_at` no se aceptan). Final: sin cambios; `Supplier` reutiliza `SupplierCreate` porque el contrato de salida es exactamente entrada + `id` + `updated_at`. Validado por test (conjunto exacto de claves, 201/200, filtro, 404 tras borrar).

**DELETE `/suppliers/{supplier_id}`** — `delete_supplier`. Original: `dict[str, str]` `{"message": ...}` ❌ (comodín). Final: `MessageResponse{message: str}`, mismo JSON. Cambios: `routes/suppliers.py`, `M`. Validado (test).

### Autenticación (`routes/auth.py`)

**POST `/auth/login`** — `login`. Entrada: formulario OAuth2. Consumidores: `login/page.tsx`, `register/page.tsx` de ambos frontends (`access_token`, `token_type`). Original y final: `LoginResponse{access_token, token_type: "bearer"}` ✅. El token se emite deliberadamente; no se expone el email ni el usuario. Sin cambios; validado (test y ejecución real).

**GET `/auth/me`** — `auth_me`. Consumidores: `account/profile/page.tsx` de ambos frontends (lee `email`, `role`, `profile.name/phone/address`). Original: `AuthMeResponse` con `profile: Profile` ⚠️ (incluía `id` y `user_id`, no consumidos). Final: `AuthMeResponse{email, role, profile: ProfileRead|None}`. El email se mantiene: es de la persona autenticada y la UI lo muestra. Cambios: `M`, `U`. Validado (test y ejecución real).

**POST `/auth/forgot-password`**, **POST `/auth/reset-password`**, **POST `/auth/change-password`** — consumidores: páginas homónimas. Original y final: `PasswordActionResponse{message}` ✅. Se preserva la respuesta genérica de recuperación (no revela si el email existe) y no se devuelve el email ni el token. Entradas separadas (`ForgotPasswordRequest`, `ResetPasswordRequest`, `ChangePasswordRequest`). Sin cambios. Validado por test: `forgot-password` con email inexistente (200 genérico) y los errores 400 de reset/change; **los caminos de éxito de reset y change no se ejercitaron** (requieren token real/envío de email; pendiente).

### Usuarios (`routes/users.py`)

**POST `/users`** — `register_user`. Consumidores: `register/page.tsx` de ambos frontends (no lee el cuerpo, solo el estado y luego hace login). Original: `UserRead` ⚠️ (perfil con ids internos). Final: `UserRead{id, email, is_active, role, created_at, profile: ProfileRead|None}`. Entrada `UserCreate` no admite `role` ni `is_active`. Validado (test y ejecución real; no aparecen `hashed_password`/`password`).

**GET `/users`** — `get_users`. Consumidor: ninguno rastreado en `uis/`. Original: `list[UserRead]` ⚠️: cualquier usuario autenticado recibía el perfil (teléfono, dirección) de todos. Final: `list[UserListItem{id, email, is_active, role, created_at}]` (sin perfil), y `list_users` ya no consulta un perfil por usuario. Compatibilidad: sin consumidor rastreado; el cambio es de reducción de datos privados. Validado (test y ejecución real). Pendiente de confirmación: quién debe poder listar (ver D).

**GET `/users/{user_id}`**, **PUT `/users/{user_id}`** — `get_user`, `put_user`. Consumidor: ninguno rastreado. Original: `UserRead` ⚠️ (ids del perfil). Final: `UserRead` con `ProfileRead`. Entrada `UserUpdate{email?, role?, password?}` sin cambios (ver D sobre `role`). Validado (test).

**DELETE `/users/{user_id}`** — `remove_user`. Original: `dict[str, str]` ❌. Final: `MessageResponse`. Validado (test).

### Perfiles (`routes/profiles.py`)

**GET `/profiles/me`**, **PUT `/profiles/me`** — `get_my_profile`, `update_my_profile`. Consumidores: `account/profile/page.tsx` de ambos frontends (el tipo TS declaraba `id` y `user_id`, pero el código solo usa `name`, `phone`, `address`). Original: `Profile{id, user_id, name, phone, address}` ⚠️ (ids internos sin consumidor). Final: `ProfileRead{name, phone, address}` (`from_attributes=True`, valores nulables). Entrada `ProfileUpdate` sin cambios (la semántica PUT existente reemplaza los tres campos). Cambios: `M`, `routes/profiles.py`; **consumidores**: se eliminaron `id`/`user_id` del tipo `ProfileResponse` en `uis/backoffice/src/app/account/profile/page.tsx` y `uis/talent-pipeline-tracker/app/account/profile/page.tsx` (solo tipos; no se leían). Validado (test y ejecución real para GET).

### Incidencias (`routes/incidents.py`)

**POST `/api/incidents`**, **GET `/api/incidents`**, **GET `/api/incidents/summary`**, **GET `/api/incidents/{incident_id}`**, **PATCH `/api/incidents/{incident_id}/status`** — consumidor: `uis/talent-pipeline-tracker/lib/incidents-api.ts` (tipos `Incident`, `IncidentSummary`). Original y final: `Incident` / `list[Incident]` / `IncidentSummary` ✅. Campos: `title, description, category, status, origin, branch, source_id, id, created_at, updated_at`, sin datos sensibles; `list_incidents` mantiene el formato de lista y sus filtros (no hay paginación). Entradas separadas (`IncidentCreate`, `IncidentStatusUpdate`); `id`, `created_at`, `updated_at` no son escribibles. Sin cambios. Validado por test (claves exactas, transición de estado, resumen). Nota: estas rutas no exigen autenticación (ver D).

### Inventario (`routes/inventory.py`)

**GET `/inventory/products`**, **POST `/inventory/products`**, **GET `/inventory/products/{ingredient_id}`** — consumidor: `uis/backoffice/src/lib/inventory.ts` (`Ingredient`). Original: `IngredientRead` (heredaba los validadores de entrada de `IngredientBase`) ✅. Final: `IngredientRead{id, name, sku, unit, category: Literal[...], country: Literal["CO","US"], current_stock: float}` independiente de la entrada, de modo que un dato histórico inválido no rompa la respuesta con 500 y OpenAPI muestre los enums. Mismo JSON. Cambios: `S`. Validado (test y ejecución real para POST). Entrada `IngredientCreate` sin `id` ni `current_stock`.

**POST `/inventory/orders/inbound`**, **POST `/inventory/orders/outbound`**, **GET `/inventory/orders`** — consumidor: `inventory.ts` (`InventoryOrder`) y `inventory/orders/page.tsx`, que muestra `user_uuid`, `supplier_name`, `created_at`. Original y final: `InventoryOrderRead{id, order_type, ingredient: IngredientSummary, quantity, location_id, created_at, user_uuid, supplier_name, reason}` ✅; el ingrediente se anida como proyección plana (`IngredientSummary`, sin stock), no como objeto ORM. Se conserva `user_uuid` porque la UI lo usa. Entradas separadas, `user_uuid` se toma del token, no del cuerpo. Sin cambios. Validado (test).

## D. Seguridad y decisiones de compatibilidad

Exposiciones corregidas:

- `id`/`user_id` internos del perfil en `/profiles/me`, `/auth/me` y `UserRead`: eliminados con `ProfileRead`; no tenían consumidor.
- `GET /users` entregaba teléfono y dirección de todos los usuarios a cualquier autenticado: ahora devuelve `UserListItem` sin perfil.
- Respuestas `dict[str,str]` y sin modelo (4 rutas JSON) sustituidas por modelos explícitos.
- No se encontró ninguna respuesta que devolviera `hashed_password`, contraseñas, tokens de reseteo ni secretos: `UserRecord` (con el hash) nunca sale de la capa de servicio y todas las respuestas pasan por modelos de salida. Los tests comprueban que esas claves no aparecen.

Decisiones de campos:

- `access_token` de `/auth/login`: legítimo. Login, registro, forgot/reset/change no devuelven el email. `GET /auth/me` y `UserRead` sí lo incluyen (persona autenticada / registro propio).
- `user_uuid` en órdenes: se mantiene por uso comprobado en la UI de movimientos.
- Se mantuvieron los IDs de recurso (`id` de usuario, proveedor, incidencia, ingrediente) por ser parte del contrato.
- `Supplier` e `Incident` reutilizan el esquema de entrada correspondiente: el contrato de salida coincide exactamente con entrada + `id` + marcas de tiempo.

**Pendientes que requieren confirmación (no modificados por regla del repositorio sobre permisos y políticas de seguridad):**

1. `PUT /users/{user_id}`: un usuario no admin puede enviar `role` en el cuerpo (`UserUpdate`) y escalar a `admin` (mass assignment de un campo interno). Recomendación: rechazar `role` si el solicitante no es admin.
2. `GET /users` sigue abierto a cualquier usuario autenticado (ahora con datos mínimos). Recomendación: limitar a admin.
3. `/inventory/products*`, `/inventory/orders` (lectura) y todas las rutas `/api/incidents*` no exigen autenticación, y las órdenes exponen `user_uuid`. Se preservó el comportamiento por ser autorización.

Consumidores modificados: solo los tipos `ProfileResponse` mencionados arriba.

## E. Verificaciones

Comandos realmente ejecutados:

- `pip install -r services/api/requirements-dev.txt` (faltaban dependencias del entorno; no se modificaron manifiestos).
- `python -m pytest services/api/tests -q`: **13 passed** (advertencias de deprecación preexistentes: `on_event`, `httpx` en TestClient).
- `app.openapi()` antes y después: 32 operaciones en ambos casos; los 31 endpoints JSON declaran esquema `$ref` (test `test_openapi_every_json_route_has_explicit_schema`); el export declara `text/csv`.
- Ejecución real con `uvicorn services.api.main:app --port 8765` sobre una base temporal (eliminada después) y `curl`: `GET /`, `POST /users`, `POST /auth/login`, `GET /auth/me`, `GET /profiles/me`, `GET /users`, `POST /inventory/products`. Los payloads coinciden con los esquemas (p. ej. `/auth/me` → `{"email","role","profile":{"name","phone","address"}}`).

Tests agregados (no existían tests de backend): `services/api/tests/conftest.py` (aísla TinyDB y SQLite en un directorio temporal; no toca `suppliers_db.json` ni `inventory.db`) y `services/api/tests/test_serialization.py`. Cubren las 32 rutas, claves exactas, ausencia de claves sensibles, códigos de éxito, 401 en rutas protegidas, relaciones (orden → ingrediente) y datos privados (perfil/lista de usuarios).

Pendientes y riesgos residuales:

- No se ejercitaron los caminos de éxito de `reset-password` y `change-password` (ni el envío de email, que depende de Resend).
- No se ejecutaron los tests de los frontends; el cambio en ellos es solo de tipos TypeScript. Jest de Backoffice ya no corría antes (ver `memory-bank/progress.md`).
- Se ejecutó con Python 3.14 y FastAPI 0.141.1 sin versiones fijadas en `requirements.txt`; otras versiones no se probaron.
- Los archivos `services/api/inventory.db`, `services/api/suppliers_db.json`, `docker-compose.yml`, `uis/start.sh` y `.gitignore` ya figuraban modificados antes de esta tarea y no fueron tocados por ella.

