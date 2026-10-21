# Informe de caching — Brasaland Digital

Rama: `feature/caching-optimisation` · Fecha: 21/10/2026

## 0. Metodología y evidencia previa

**Instrumentación.** Middleware `timing_middleware` en `services/api/main.py`: una línea por petición (`GET /ruta?query -> status | ms`) en el logger `api.timing`, con handler propio porque uvicorn no lo configura.

**Carga realista.** Seeder `services/api/seed_inventory_bulk.py` (stdlib, semilla fija, SKU `BRS-BULK-*`, reversible con `--reset`): 6 categorías, mercados CO/US, 14 locales, proveedores por categoría, fechas repartidas en 365 días, usuarios reales; las salidas nunca superan las entradas. Ejecutado contra Supabase (PostgreSQL, `sa-east-1`) en 6,1 s.

| Tabla | Antes | Después |
|---|---|---|
| `ingredient` | 6 | 216 |
| `ingrediententry` | 4 | 9.493 |
| `ingredientexit` | 3 | 13.335 |

**Latencia (10 peticiones secuenciales, tiempo de servidor del middleware).**

| Endpoint | Antes del seed (mediana) | Después del seed (mediana) | Tamaño respuesta antes → después |
|---|---|---|---|
| `GET /inventory/products` | 211 ms | 248 ms | 743 B → 32 KB |
| `GET /inventory/products/{id}` | 206 ms | 203 ms | — |
| `GET /inventory/orders` | 212 ms | **2.459 ms** | 2,2 KB → **7,8 MB** |
| `GET /suppliers` (sin token) | 0,5 ms (401) | 0,5 ms (401) | — |

Lectura: el suelo de ~200 ms es la latencia de red a Supabase (2–3 consultas por petición). Con volumen, `/inventory/products` crece por las agregaciones `SUM … GROUP BY` sobre ~23 k filas y `/inventory/orders` se dispara por traer y serializar todas las órdenes.

## 1. Inventario de endpoints (coste × frecuencia × estabilidad)

| Endpoint | Coste | Frecuencia | Cambio de datos | Decisión |
|---|---|---|---|---|
| `GET /inventory/products` | Alto: 3 consultas remotas + 2 agregaciones (248 ms) | Alta: lo cargan Productos, Entrada y Salida | Medio: cambia con cada orden | **Cachear** |
| `GET /inventory/products/{id}` | Alto: 3 consultas remotas (203 ms) | Alta: la pantalla de Salida lo pide al elegir ingrediente | Medio | **Cachear** |
| `GET /inventory/orders` | Muy alto (2,5 s, 7,8 MB) | Media | Alto: cada orden nueva | No (ver §5) |
| `POST /inventory/products`, `POST /inventory/orders/inbound`, `POST /inventory/orders/outbound` | Escritura | Media | — | No; **invalidan** |
| `GET /suppliers`, `GET /suppliers/{id}` | Bajo: TinyDB local (<1 ms) | Media | Bajo | No (ver §5) |
| `POST/PATCH/DELETE /suppliers…` | Escritura | Baja | — | No |
| `GET /api/incidents`, `/summary`, `/{id}` | Bajo: TinyDB local | Media | Alto: cambios de estado | No |
| `POST /api/incidents`, `PATCH …/status` | Escritura | Media | — | No |
| `POST /api/incidents/analyze`, `GET …/results/export` | CPU sobre CSV subido | Baja | Por subida | No |
| `GET /auth/me`, `GET /profiles/me`, `GET /users/{id}` | Bajo-medio | Alta | Bajo | No: datos personales (ver §5) |
| `GET /users` | Medio | Baja | Bajo | No: datos sensibles |
| `POST /auth/*`, `POST/PUT/DELETE /users`, `PUT /profiles/me` | Escritura | Baja | — | No |
| `GET /` | Trivial | — | — | No |

## 2. Decisiones en el backend

Implementación: `services/api/cache.py` — `TTLCache` en memoria por proceso, con `threading.Lock` (los endpoints síncronos corren en el threadpool de FastAPI), TTL obligatorio en cada entrada y un contador de generación que evita guardar un valor cargado mientras se producía una invalidación. Sin dependencias nuevas.

| Endpoint | Clave | TTL | Invalidación | Medición |
|---|---|---|---|---|
| `GET /inventory/products` | `inventory:products:list` | 60 s | `invalidate_prefix("inventory:products")` tras `commit` en las tres escrituras de inventario | 323 ms (fallo) → **1,9 ms** mediana (acierto) |
| `GET /inventory/products/{id}` | `inventory:products:{id}` | 60 s | Igual (prefijo común) | 196 ms → **1,5 ms** |

- Ambos endpoints son públicos y su respuesta es idéntica para todos: la clave compartida no expone datos de usuario.
- Las respuestas 404 no se cachean (la excepción impide guardar el valor).
- La validación de stock de `POST /inventory/orders/outbound` sigue usando `_calculate_stock` sin caché: una decisión de escritura nunca se toma con datos potencialmente obsoletos.
- Verificado: aciertos, expiración por TTL (tras 61 s vuelve a ~230 ms), invalidación por prefijo y protección de carrera (pruebas aisladas de `TTLCache`). La invalidación vía HTTP no se ejecutó extremo a extremo para no escribir más datos en Supabase.
- `tests/test_inventory.py` limpia la caché en el fixture; `pytest` no está instalado en `myenv`, así que esa suite no se ejecutó.

## 3. Decisiones en el frontend

**Lazy loading (`next/dynamic`, `ssr: false`, con placeholder):**

1. `uis/backoffice` — `IncidentAnalysisResults` (`src/components/incident-analysis-results.tsx`), extraído de `incidents/page.tsx`. Solo se renderiza cuando existe `result`, es decir, después de subir y analizar un CSV. Antes su JSX (métricas, tres desgloses, satisfacción, descarga) viajaba en el bundle inicial de la ruta aunque la mayoría de visitas no llegue a analizar nada.
2. `uis/talent-pipeline-tracker` — `CandidateForm` en `candidate-detail-page.tsx`. Es un formulario de edición secundario que solo se pinta cuando la candidatura ya cargó; diferirlo permite que su chunk se descargue en paralelo con la petición de datos en lugar de bloquear la hidratación inicial de la ficha. En `candidate-list-page.tsx` se mantiene estático porque allí es visible desde el primer render.

Beneficio: **estimado**, no medido. Se recomienda verificar con `next build` (tamaño del chunk de la ruta) y la pestaña Network.

**`useMemo`:** `uis/backoffice/src/app/inventory/products/page.tsx`. Antes, en cada render se recorría la lista dos veces con `filter` para los contadores y otra vez en el `map` llamando a `getStockLevel`. Ahora una sola pasada memoizada sobre `[ingredients]` clasifica cada ingrediente y calcula los contadores; los renders por `loading`, `error` o `reloadKey` no recalculan. Con 216 ingredientes tras el seed, el ahorro por render es pequeño pero crece de forma lineal con el catálogo; beneficio estimado, no perfilado.

## 4. Intercambios reconocidos (frescura vs. rendimiento)

**TTL de 60 s en stock de inventario.** Dentro del mismo proceso, cualquier escritura vía API invalida al instante, así que el TTL solo acota la desactualización ante escrituras que no pasan por este proceso: otro worker de uvicorn, scripts de seed o ediciones directas en Supabase. El peor caso es mostrar en el backoffice un stock con hasta 60 s de retraso. Es aceptable porque:

- el stock se consulta para planificar, no para cobrar;
- la salida real de stock se valida en el servidor contra la base de datos sin caché, así que un dato viejo en pantalla nunca permite dejar stock negativo;
- a cambio se elimina un viaje de ~200–320 ms a Supabase en las pantallas más usadas de inventario.

Un TTL más largo (p. ej. 10 min) ahorraría poco más —la mayoría de lecturas ya aciertan— y alargaría la ventana de error con varios workers. Si se despliega con varios workers, el siguiente paso es Redis compartido para que la invalidación llegue a todos.

## 5. Qué no se cacheó y por qué

- **`GET /inventory/orders`** — es el endpoint más lento (2,5 s), pero cambia con cada orden, la respuesta pesa 7,8 MB (cachearla multiplica memoria por proceso) y el problema real es la falta de paginación. Cachear ocultaría el síntoma; la solución correcta es paginar o filtrar por fecha.
- **`GET /suppliers`** — TinyDB local responde en <1 ms; la caché no aportaría nada medible. Además requiere autenticación: si en el futuro se cacheara, la clave podría ser compartida (no es per-user), pero la comprobación de token debe seguir ejecutándose antes de servir el acierto.
- **`GET /auth/me`, `/profiles/me`, `/users/{id}`, `/users`** — datos personales o sensibles. Una clave compartida sería una fuga de datos; acotarla al usuario no compensa dado su bajo coste.
- **Incidencias** — lectura local barata y estados que cambian con frecuencia.
