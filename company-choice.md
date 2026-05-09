# Brasaland

## Por qué elegí esta empresa

Elegí Brasaland porque concentra en un solo caso de negocio la mayoría de los desafíos clásicos de la transformación digital empresarial: gestión de ventas, relación con proveedores, control de stock y fidelización de clientes. Todo esto en un modelo de negocio universalmente comprensible, lo cual permite enfocarse en la ingeniería sin necesidad de aprender una industria compleja.

A esto se suma una capa de complejidad técnica genuinamente interesante: la empresa opera en dos países, con dos monedas (COP y USD) y dos idiomas (español e inglés), lo que implica que cualquier sistema que se construya debe contemplar esa dualidad desde el diseño.

Otro factor determinante es el potencial en el área de marketing y fidelización. El programa actual —tarjetas físicas de sello— no genera datos y tiene una adopción del 40%. Reemplazarlo por una solución digital representa una oportunidad concreta de impacto: una app de fidelización integrada a un CRM permitiría conocer a los clientes reales, construir su historial de compras y activar campañas personalizadas —por comportamiento, por ranking de consumo o por fechas especiales como cumpleaños— que hoy son simplemente imposibles.

Por último, la interdependencia entre departamentos hace que una sola intervención bien diseñada (la API central) tenga un efecto multiplicador: los datos de ventas en tiempo real no solo sirven a Operaciones, sino que alimentan a Compras y Proveedores para anticipar la demanda estacional, y a Formación y Estándares para cruzar recetas con insumos disponibles.

---

## Departamentos que me interesan

### Departamento 1: Tecnología

El problema principal es la ausencia total de centralización de datos. Cada local opera de forma aislada, con sistemas de punto de venta distintos por país y sin ninguna integración. Mi prioridad sería el diseño y desarrollo de la **API central de Brasaland**: una capa unificada que exponga en tiempo real los datos de locales, menús, ventas, clientes y stock. Esta API no es un fin en sí misma, sino la infraestructura que hace posible todo lo demás. Sin ella, cualquier mejora en otros departamentos queda limitada a soluciones parciales y desconectadas.

### Departamento 2: Marketing y Experiencia Digital

El problema central es la invisibilidad del cliente: hoy Brasaland no sabe quiénes son las personas que consumen en sus locales, con qué frecuencia van ni qué piden. Sin esa información, no es posible ejecutar ninguna acción de marketing dirigida.

Para atacar este problema, el enfoque sería el desarrollo de una **app de fidelización y pedidos** donde cada cliente se registre, y la habilitación de un mecanismo de identificación en el punto de venta para capturar también a quienes compran de forma presencial. A partir de la información que fluye a través de la API central (desarrollada en Tecnología), se construiría un **CRM con historial de compras por cliente**, que permitiría generar rankings de consumo, segmentar la base y activar campañas personalizadas: promociones por comportamiento, llamados a la acción, e invitaciones especiales en fechas relevantes como cumpleaños u aniversarios.

---

## Reto de automatización elegido: Pipeline de fidelización inteligente

El reto elegido consiste en diseñar e implementar un pipeline end-to-end que transforme la experiencia de fidelización de Brasaland: desde la captura del cliente hasta la ejecución automatizada de campañas personalizadas basadas en su comportamiento real de compra.

El punto de partida del problema es concreto: el programa actual —tarjetas físicas de sello— no genera ningún dato, tiene una adopción del 40% y no permite identificar a los clientes ni actuar sobre ellos. El reto propone reemplazar ese sistema por un flujo digital completo que opere en los dos mercados de la empresa.

El pipeline se estructura en tres etapas:

### Etapa 1: Captura e identidad del cliente

Se desarrollará el mecanismo de registro a través de la app y de un punto de identificación en caja, de modo que cada compra —presencial o digital— quede vinculada a un perfil de cliente. Esta etapa resuelve el problema de raíz: pasar de anonimato total a una base de clientes identificados.

### Etapa 2: Centralización y enriquecimiento de datos

A través de la API central (responsabilidad del departamento de Tecnología), se consolidará el historial de compras de cada cliente en tiempo real: qué productos consume, con qué frecuencia visita, en qué local, y cuál es su ticket promedio. Sobre esa base se construirá el CRM y el sistema de scoring que permita segmentar y rankear la base de clientes.

### Etapa 3: Automatización de acciones personalizadas

Con el modelo de comportamiento disponible, el sistema disparará automáticamente campañas y acciones según reglas definidas: ofertas para clientes con inactividad reciente, recompensas para los de mayor consumo, e invitaciones especiales en fechas relevantes como cumpleaños. El componente de IA estará en la capa de personalización: determinar qué producto sugerir, qué incentivo activar y en qué momento, en función del perfil individual de cada cliente.

Este reto fue elegido por tres razones principales. Primero, porque resuelve el problema más urgente y medible de la empresa: la invisibilidad del cliente. Segundo, porque cubre de forma integral las competencias centrales de un proyecto de AI Engineering —diseño de pipeline de datos, integración vía API, modelado de comportamiento y automatización de acciones—. Tercero, porque el resultado es tangible y comprensible para cualquier stakeholder: el impacto de pasar de "no sabemos quién nos compra" a "le enviamos una oferta personalizada a cada cliente en el momento correcto" es inmediato y no requiere traducción técnica.

---

## Mi idea de Agente de IA

El agente propuesto es el **Agente de Fidelización Brasaland**: un agente autónomo que opera de forma continua sobre el flujo de datos generado por la API central y toma decisiones personalizadas sobre qué acción ejecutar para cada cliente, en qué momento y a través de qué canal.

### Qué haría

El agente monitoreará en tiempo real el comportamiento de cada cliente registrado y evaluará de forma continua su estado: cuándo fue su última visita, cuánto lleva sin comprar, si su consumo está creciendo o cayendo, y si se aproxima una fecha relevante como su cumpleaños. En función de ese análisis, decidirá autónomamente qué acción tomar para cada perfil: reactivar a un cliente inactivo, premiar a uno de alto consumo, o sorprender a uno en una fecha especial. No ejecuta una campaña única para todos: selecciona, para cada cliente, el mensaje, el incentivo y el momento óptimo, aprendiendo y ajustando sus criterios a partir de los resultados de cada acción anterior.

### Qué información necesitaría

Para operar, el agente consumirá datos provenientes de la API central de Brasaland. Necesitará:

- **Perfil del cliente**: nombre, canal de contacto, fecha de cumpleaños, país y local de preferencia.
- **Historial de compras**: productos, frecuencia, ticket promedio y última visita.
- **Catálogo de productos y promociones** disponibles por mercado, para garantizar que las sugerencias sean válidas tanto en Colombia como en Florida.
- **Score o ranking del cliente**, actualizado en tiempo real.
- **Historial de acciones previas del agente** sobre ese cliente (qué se le envió, cuándo y con qué resultado), para evitar saturación y mejorar la efectividad de cada intervención.

### Qué produciría o dispararía

Las salidas del agente son de tres tipos:

- **A nivel de cliente individual**: notificaciones push o emails personalizados con ofertas, recompensas o invitaciones especiales, generados con el nombre del cliente, el producto sugerido y el incentivo definido para su perfil.
- **A nivel operativo**: actualizaciones automáticas del score de fidelización en el CRM tras cada compra, y registros de cada acción ejecutada para trazabilidad y ajuste del modelo.
- **A nivel estratégico**: un reporte semanal para el equipo de Marketing con los resultados de las campañas disparadas —tasa de apertura, conversión y variación del ticket promedio por segmento—, que permita a Camila Ospina tomar decisiones informadas sobre la estrategia de fidelización sin necesidad de construir los análisis de forma manual.
