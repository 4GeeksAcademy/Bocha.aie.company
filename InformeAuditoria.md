# Informe de auditoría de gestión de errores

Alcance revisado: backend Python en services/api, scripts Python en scripts, librerías compartidas en packages y UIs en uis/backoffice y uis/talent-pipeline-tracker.

Nota de criterio: este informe solo incluye hallazgos confirmados. No se hicieron cambios de código. No se confirmaron casos claros de ESTADOS DE CARGA/ERROR AUSENTES EN LA UI; la mayoría de vistas sí renderiza un estado de carga o error, aunque varias carecen de una salida útil para el usuario cuando falla la operación.

## CRÍTICO

### 1. services/api/main.py:162-175
- Categoría: EXPOSICIÓN DE ERRORES EN CRUDO
- Problema: el endpoint de análisis convierte directamente ValueError en detail=str(error), por lo que mensajes internos del analizador CSV terminan expuestos en la respuesta HTTP.
- Corrección sugerida: mapear errores del dominio a códigos y mensajes públicos controlados, registrando el detalle técnico solo en logs internos.

### 2. uis/backoffice/src/lib/api.ts:64-102
- Categoría: EXPOSICIÓN DE ERRORES EN CRUDO
- Problema: el helper central de red propaga apiPayload.detail, apiPayload.error y apiPayload.message como texto final de ApiRequestError, de modo que cualquier mensaje devuelto por backend puede llegar intacto a la UI.
- Corrección sugerida: normalizar errores en el cliente con mensajes públicos por caso y limitar el uso de payloads remotos a códigos tipados o errores de campo seguros.

### 3. uis/talent-pipeline-tracker/lib/auth.ts:74-112
- Categoría: EXPOSICIÓN DE ERRORES EN CRUDO
- Problema: el helper de autenticación del tracker repite el mismo patrón de propagación directa de detail, error y message a la UI en todas las rutas auth.
- Corrección sugerida: encapsular el payload remoto en errores tipados con mensajes sanitizados y usar códigos de error para decidir el texto mostrado.

## ALTO

### 4. services/api/routes/auth.py:85-93
- Categoría: CATCH DEMASIADO AMPLIO
- Problema: except Exception envuelve toda la entrega de correo de reseteo y mezcla fallos de configuración, red, proveedor y lógica sin distinguir su causa real.
- Corrección sugerida: capturar solo excepciones esperadas del proveedor de correo o de configuración y manejar cada caso con una política explícita.

### 5. services/api/routes/auth.py:85-95
- Categoría: FALLOS SILENCIOSOS
- Problema: si falla el envío del email de recuperación, el sistema lo registra pero devuelve igualmente 200 con mensaje de éxito genérico, dejando el fallo oculto para el flujo de soporte y operación.
- Corrección sugerida: registrar un estado auditable de entrega fallida y decidir si el flujo debe reintentar, marcar la solicitud como pendiente o responder con un error controlado.

### 6. uis/talent-pipeline-tracker/lib/tracker-api.ts:47-70
- Categoría: EXPOSICIÓN DE ERRORES EN CRUDO
- Problema: el cliente del tracker devuelve directamente error, message, detail o el primer msg de la API externa como texto de ApiRequestError para toda la aplicación.
- Corrección sugerida: traducir respuestas remotas a un contrato interno de errores y mostrar textos genéricos o específicos solo cuando estén aprobados para UI.

### 7. uis/backoffice/src/app/register/page.tsx:53-100
- Categoría: CATCH DEMASIADO AMPLIO
- Problema: un único try/catch cubre tanto la creación de usuario como el login automático, por lo que un fallo posterior puede ocultar que la cuenta ya fue creada y deja el estado parcial mal explicado.
- Corrección sugerida: separar la creación de cuenta y el login automático en bloques independientes con mensajes y recuperación distintas.

### 8. uis/talent-pipeline-tracker/app/register/page.tsx:53-100
- Categoría: CATCH DEMASIADO AMPLIO
- Problema: el registro del tracker repite el mismo patrón y trata como un solo error un flujo con dos operaciones remotas diferentes y estados parciales distintos.
- Corrección sugerida: aislar cada await crítico en su propio manejo de error para poder informar si la cuenta se creó pero la autenticación automática falló.

### 9. uis/backoffice/src/app/suppliers/page.tsx:479-484
- Categoría: SIN LLAMADA A LA ACCIÓN PARA EL USUARIO
- Problema: cuando falla la carga del listado de proveedores, la pantalla solo muestra el texto de error y no ofrece reintento, navegación alternativa ni canal de soporte.
- Corrección sugerida: añadir una acción explícita de reintentar y, si aplica, un enlace de navegación o contacto para incidencias persistentes.

### 10. uis/talent-pipeline-tracker/components/candidate-list-page.tsx:216-220
- Categoría: SIN LLAMADA A LA ACCIÓN PARA EL USUARIO
- Problema: el error del listado de candidaturas bloquea la vista y solo muestra un mensaje estático sin botón de reintento ni salida alternativa.
- Corrección sugerida: incorporar una CTA de reintento y una opción de volver al estado inicial o limpiar filtros.

### 11. uis/talent-pipeline-tracker/components/incident-manager-page.tsx:197
- Categoría: SIN LLAMADA A LA ACCIÓN PARA EL USUARIO
- Problema: el fallo al cargar el resumen operativo se presenta como texto sin ninguna acción para refrescar el bloque ni recuperar el panel parcial.
- Corrección sugerida: añadir un botón de recarga del resumen y una degradación visual que permita seguir operando en el resto de la pantalla.

## MEDIO

### 12. services/api/main.py:130
- Categoría: TRY/CATCH AUSENTE
- Problema: await file.read() realiza I/O sobre el upload sin manejo local; si falla la lectura, el endpoint cae en el handler genérico sin contexto funcional del caso.
- Corrección sugerida: envolver la lectura del archivo en un bloque acotado que traduzca errores de I/O a una respuesta 4xx o 5xx controlada.

### 13. services/api/email_service.py:48-63
- Categoría: TRY/CATCH AUSENTE
- Problema: resend.Emails.send() se ejecuta sin manejo propio en la integración de correo, dejando al llamador la carga de distinguir errores operativos de proveedor, red o configuración.
- Corrección sugerida: capturar las excepciones de la librería de correo en este módulo y devolver errores tipados del dominio de notificaciones.

### 14. scripts/analyze.py:121-132
- Categoría: TRY/CATCH AUSENTE
- Problema: la exportación con result_path.write_text() ocurre fuera del bloque try/except principal, por lo que errores de escritura acaban en traceback crudo y sin mensaje de salida controlado.
- Corrección sugerida: envolver la escritura del CSV en un bloque específico que informe el fallo y termine con código distinto de cero.

### 15. scripts/seed_incidents.py:94-102
- Categoría: CATCH DEMASIADO AMPLIO
- Problema: el except por fila cubre transformación, búsqueda e inserción en base de datos, así que un fallo de persistencia puede terminar reportado como fila inválida.
- Corrección sugerida: separar validación y persistencia en bloques distintos y dejar que los fallos de infraestructura aborten el script con contexto claro.

### 16. scripts/seed_incidents.py:107-114
- Categoría: SIN sys.exit EN FALLO DE SCRIPT
- Problema: el script informa filas inválidas pero finaliza sin sys.exit no cero, lo que permite que pipelines o automatizaciones interpreten la ejecución como exitosa.
- Corrección sugerida: devolver un código de salida no cero cuando existan errores críticos de importación o un umbral configurable de filas inválidas.

### 17. uis/backoffice/src/lib/api.ts:50-61
- Categoría: FALLOS SILENCIOSOS
- Problema: parseJsonSafely traga cualquier fallo de JSON.parse y devuelve texto plano, ocultando errores de contrato o respuestas corruptas entre cliente y servidor.
- Corrección sugerida: diferenciar explícitamente entre respuesta no JSON esperada y payload malformado, registrando este último como error técnico.

### 18. uis/talent-pipeline-tracker/lib/incidents-api.ts:34-39
- Categoría: FALLOS SILENCIOSOS
- Problema: response.json().catch(() => null) suprime errores de parseo y degrada la respuesta a null, ocultando fallos de protocolo justo en el cliente de incidencias.
- Corrección sugerida: validar response.ok antes del parseo y tratar el parseo inválido como un error técnico explícito.

## BAJO

### 19. uis/backoffice/src/app/incidents/page.tsx:220-297
- Categoría: CATCH DEMASIADO AMPLIO
- Problema: downloadResults agrupa fetch autenticado, lectura de blob y manipulación del DOM en un solo try/catch, dificultando distinguir si falló la API, el archivo o la descarga en cliente.
- Corrección sugerida: separar la petición remota de la fase de descarga local y manejar cada fallo con mensajes específicos.

### 20. uis/backoffice/src/app/incidents/page.tsx:184-205
- Categoría: EXPOSICIÓN DE ERRORES EN CRUDO
- Problema: la vista de análisis coloca error.message directamente en el estado visual; combinada con el helper central, cualquier mensaje del backend puede verse sin sanitizar.
- Corrección sugerida: mostrar mensajes públicos predefinidos en la pantalla y usar códigos de error para los casos recuperables.

### 21. uis/backoffice/src/app/login/page.tsx:50-52
- Categoría: EXPOSICIÓN DE ERRORES EN CRUDO
- Problema: el formulario de login vuelca requestError.message directamente a la UI, heredando cualquier detalle textual devuelto por el backend.
- Corrección sugerida: limitar el login a un conjunto pequeño de mensajes públicos y registrar el detalle técnico fuera de la interfaz.

### 22. uis/backoffice/src/app/forgot-password/page.tsx:38-40
- Categoría: EXPOSICIÓN DE ERRORES EN CRUDO
- Problema: el formulario de recuperación muestra requestError.message sin sanitización, lo que rompe la política de mensajes controlados en un flujo sensible.
- Corrección sugerida: sustituir el mensaje remoto por estados públicos fijos para validación, límite de intentos y error temporal.

### 23. uis/backoffice/src/app/reset-password/page.tsx:51-53
- Categoría: EXPOSICIÓN DE ERRORES EN CRUDO
- Problema: el reset de contraseña también envía requestError.message directo a la UI y puede exponer detalles innecesarios del backend.
- Corrección sugerida: mapear errores de token inválido, expiración y fallo temporal a textos locales predefinidos.

### 24. uis/backoffice/src/app/account/profile/page.tsx:72-80
- Categoría: SIN LLAMADA A LA ACCIÓN PARA EL USUARIO
- Problema: si falla la carga inicial del perfil, la pantalla muestra el error pero no ofrece reintentar explícitamente la lectura remota.
- Corrección sugerida: añadir una CTA de recarga del perfil o una recuperación automática con opción manual.

### 25. uis/talent-pipeline-tracker/app/login/page.tsx:50-52
- Categoría: EXPOSICIÓN DE ERRORES EN CRUDO
- Problema: el login del tracker renderiza requestError.message en bruto y queda expuesto al mismo problema del helper auth central.
- Corrección sugerida: restringir los textos de fallo del login a mensajes públicos definidos en cliente.

### 26. uis/talent-pipeline-tracker/app/forgot-password/page.tsx:39-41
- Categoría: EXPOSICIÓN DE ERRORES EN CRUDO
- Problema: la pantalla de recuperación del tracker muestra el mensaje textual de la excepción sin normalización previa.
- Corrección sugerida: reemplazar el mensaje remoto por respuestas locales estables y seguras para el usuario final.

### 27. uis/talent-pipeline-tracker/app/reset-password/page.tsx:52-54
- Categoría: EXPOSICIÓN DE ERRORES EN CRUDO
- Problema: el flujo de restablecimiento del tracker propaga requestError.message directamente a la interfaz.
- Corrección sugerida: traducir los errores remotos a un conjunto de estados de UI controlados.

### 28. uis/talent-pipeline-tracker/components/candidate-detail-page.tsx:149-154
- Categoría: EXPOSICIÓN DE ERRORES EN CRUDO
- Problema: el cambio de estado del expediente muestra updateError.message como feedback visible, reutilizando texto técnico remoto sin sanitización.
- Corrección sugerida: usar mensajes públicos por acción y registrar por separado el detalle técnico del fallo.

### 29. uis/talent-pipeline-tracker/components/candidate-detail-page.tsx:211-214
- Categoría: EXPOSICIÓN DE ERRORES EN CRUDO
- Problema: el guardado de notas usa noteError.message como mensaje de interfaz, con el mismo riesgo de exponer respuestas crudas de la API.
- Corrección sugerida: sustituir el mensaje técnico por textos controlados y distinguir validación, permisos y error temporal.

### 30. uis/talent-pipeline-tracker/components/candidate-detail-page.tsx:250-259
- Categoría: SIN LLAMADA A LA ACCIÓN PARA EL USUARIO
- Problema: el error de carga del expediente solo ofrece volver al tablero, pero no reintentar la carga del registro fallido.
- Corrección sugerida: añadir una acción de reintento del detalle además de la navegación de regreso.

## Observaciones de cierre

- No se confirmaron bloques catch vacíos ni except: pass literales durante la revisión.
- No se confirmaron filtraciones directas de secretos en logs o respuestas, pero las exposiciones de errores en crudo elevan ese riesgo si backend o APIs externas empiezan a devolver detalles sensibles.
