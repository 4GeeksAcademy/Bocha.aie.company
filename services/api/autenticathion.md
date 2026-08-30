JWT Authentication — Reto AUTH-01

Tu reto

La API de tu empresa está creciendo. Has construido endpoints que sirven datos al frontend, consultan la base de datos y procesan registros — pero en este momento, cualquier persona que conozca una URL puede llamarlos. Antes de que la plataforma pase a su siguiente fase, la CTO ha sido clara: ninguna ruta que modifique o exponga datos sensibles debe ser accesible sin una sesión válida.

Tu tech lead acaba de dejarte un ticket en la cola:

AUTH-01 — Implementar autenticación y protección de rutas

La API actualmente no tiene capa de autenticación. Esta tarea incluye:

Un módulo users con CRUD completo (crear, leer, actualizar, eliminar) solo para credenciales — email y contraseña.

Un módulo profiles con enlace uno a uno a cada usuario — el nombre visible y los datos de contacto viven en Profile, no en User.

Un endpoint de login que valide credenciales y devuelva un token JWT firmado.

Una dependencia reutilizable get_current_user que decodifique el token e identifique al usuario.

Aplicación de esa dependencia a todas las rutas que no deben ser de acceso público.

Almacenar User y Profile solo en TinyDB — el JWT debe llevar el id del usuario en TinyDB; otros módulos lo referencian como user_uuid.

Usa OAuth2PasswordBearer de FastAPI y python-jose para la firma del token. Las contraseñas deben estar hasheadas — nunca almacenadas ni comparadas en texto plano. El token debe llevar como mínimo el ID del usuario y expirar tras una ventana configurable.

Todas las rutas relacionadas con autenticación deben vivir bajo /auth. Las rutas de gestión de usuarios bajo /users. Las rutas de perfil bajo /profiles.

Esto es una cuestión de seguridad, no una feature: el trabajo que hagas aquí protege todo lo que se construyó antes y todo lo que vendrá después.

Nota: Una vez que protejas tus rutas, puede que algunas llamadas del frontend dejen de funcionar temporalmente — es algo esperado. El frontend se actualizará para enviar el token en una fase posterior. Por ahora, el foco está en asegurar la API para evitar fuga de datos y accesos indebidos.

Conocimiento complementario: cómo funciona la autenticación JWT en FastAPI

Cuando un usuario hace login, el servidor firma un pequeño payload JSON (los "claims") usando una clave secreta y devuelve el resultado como una cadena de token.

En las solicitudes siguientes, el cliente envía ese token en la cabecera Authorization. El servidor lo decodifica — si la firma es válida y el token no ha expirado, la solicitud continúa; si no, recibe un 401.

En FastAPI, este flujo se implementa como una dependencia: una función que extrae el token, lo valida y devuelve el usuario. Cualquier ruta que declare esa función como dependencia requerirá autenticación automáticamente.

Qué Debes Hacer

Modelo de usuario y CRUD

☑ Crea un modelo User en TinyDB con al menos: id, email, hashed_password, is_active, role, created_at. No almacenes nombre visible ni datos de contacto en User.

☑ El campo role debe aceptar únicamente admin, manager o user. Usa un Enum o validador de campo para rechazar cualquier otro valor. Los registros nuevos vía POST /users usan user por defecto.

☑ Implementa una capa de servicios con funciones para: crear usuario, obtener usuario por ID, obtener usuario por email, actualizar usuario, eliminar usuario.☑ Expón esos servicios como endpoints REST bajo /users:

POST /users — registrar un nuevo usuario (hashear la contraseña antes de guardar). Acepta campos opcionales de perfil inicial (name, phone, address) y crea el Profile vinculado.

GET /users — listar todos los usuarios (protegida).

GET /users/{id} — obtener un usuario por ID (protegida).

PUT /users/{id} — actualizar credenciales como email y role (solo admin o el propio usuario).

DELETE /users/{id} — eliminar un usuario (protegida). También elimina el perfil vinculado.

Modelo de perfil y endpoints☑ Crea un modelo Profile en TinyDB, vinculado uno a uno a User mediante user_id, con al menos: id, user_id, name, phone, address.☑ Expón rutas de perfil bajo /profiles:

GET /profiles/me (protegida) — devuelve el perfil del usuario autenticado.

PUT /profiles/me (protegida) — actualiza name, phone y address. Solo el dueño del perfil puede modificarlo.

Endpoints de autenticación

POST /auth/login — acepta email y password, valida credenciales y devuelve un token JWT.

GET /auth/me (protegida) — devuelve email, role y el Profile vinculado.

Token y dependencia

Crea una dependencia get_current_user que:

extraiga Authorization: Bearer <token>

decodifique y valide el JWT

recupere el usuario de TinyDB

lance HTTPException(401) si algo falla

Configura la expiración del token mediante una variable de entorno (ACCESS_TOKEN_EXPIRE_MINUTES).

Guarda la clave de firma en .env — nunca la hardcodees.

Protección de rutas

Aplica get_current_user a cada ruta que no deba ser pública.

Como mínimo:

todos los endpoints de /users excepto POST /users

/auth/me

al menos 5 rutas existentes fuera de /users y /auth que expongan o modifiquen datos sensibles

Devuelve:

401 Unauthorized para solicitudes sin token válido

403 Forbidden cuando un usuario intenta acceder a recursos ajenos

Verificación

Probar el flujo completo en /docs:

registro → login → copiar token → usar token en ruta protegida

Confirmar que:

sin token → 401

token expirado o mal formado → 401

Advertencias importantes⚠️ User y Profile viven solo en TinyDB — incluso después de añadir Supabase.⚠️ No uses sesiones ni cookies — este proyecto es JWT stateless.⚠️ Nunca almacenes contraseñas en texto plano — usa libpass[bcrypt].

SugerenciasAUTH-01 — Autenticación JWT en FastAPIVamos a usar:

FastAPI

TinyDB

JWT

OAuth2PasswordBearer

libpass[bcrypt]

uv

services/api/
├── main.py
├── database.py
├── services.py
├── auth.py
├── users.py
├── profiles.py
├── .env
└── data/

Inicializá el proyecto con uvuv init --no-packageInstalá dependencias:uv add fastapi "uvicorn[standard]" tinydb "python-jose[cryptography]" "libpass[bcrypt]" python-dotenv python-multipart

Creá la carpeta dataTinyDB creará db.json automáticamente.data/

Creá .envGenerá una clave secreta:uv run python -c "import secrets; print(secrets.token_hex(32))"Escribí:JWT_SECRET=PEGA_ACA_LA_CLAVE_GENERADA