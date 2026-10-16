---
name: maintain-project-memory
description: "Use when business context, architecture, constraints, decisions, or milestone status changes and the Brasaland memory bank must be updated."
---

# Mantener el banco de memoria de Brasaland

## Objetivo

Actualizar el banco de memoria para que describa fielmente el contexto, las decisiones y el estado vigente del proyecto, diferenciando hechos aprobados de propuestas y trabajo futuro.

## Inputs

- `CONTEXT.md` como fuente primaria del negocio.
- Documento(s) de contexto, arquitectura o requisito del hito relacionado con el cambio.
- Resumen del cambio y su estado: propuesto, aprobado, en curso o completado.
- Evidencia verificable para cambios completados, como rutas, pruebas o documentos actualizados.

Si falta el estado o hay fuentes contradictorias, conserva la incertidumbre en la memoria y señala qué decisión falta; no conviertas una suposición en hecho.

## Procedimiento

1. Lee `CONTEXT.md`, los tres documentos de `memory-bank/` y las fuentes específicas del cambio.
2. Identifica qué información cambió y si es negocio (`projectbrief.md`), arquitectura/restricciones (`techContext.md`) o estado y siguientes pasos (`progress.md`).
3. Actualiza únicamente los documentos pertinentes. Mantén las rutas de producto `uis/website`, `uis/backoffice` y `services/`.
4. Etiqueta las decisiones como propuestas o pendientes hasta que exista aprobación; conserva discrepancias con su fuente y alcance.
5. Comprueba los enlaces/rutas mencionados, revisa el diff y ejecuta `git diff --check` o una comprobación equivalente para los archivos documentales.

## Criterios de aceptación

- Cada afirmación nueva puede rastrearse a un contexto fuente o a una decisión explícitamente aprobada.
- La memoria diferencia con claridad lo existente, lo aprobado y lo futuro; no atribuye implementaciones sin evidencia.
- `projectbrief.md`, `techContext.md` y `progress.md` no se contradicen y reflejan las rutas oficiales del monorepo.
- Las discrepancias técnicas sin resolver aparecen como pendientes, no como decisiones tomadas.
- La revisión del diff confirma que solo se modificaron los documentos necesarios y que no se alteró código de producto como efecto de esta skill.