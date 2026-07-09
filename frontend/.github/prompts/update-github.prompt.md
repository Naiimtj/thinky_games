---
description: 'Antes de hacer commit: detecta todos los cambios git no commiteados (staged + unstaged), los compara con HEAD, y mantiene .github/ (skills, agents, memory) sincronizado con el estado real del código.'
name: 'update-github'
argument-hint: 'Opcional: ruta específica de archivo o patrón glob. Si se omite, analiza todos los cambios de `git status` (staged + unstaged vs HEAD).'
tools: [read, search, edit, run_in_terminal]
---

# /update-github — Sincronizar .github/ antes del commit

## Propósito

Antes de hacer `git commit`, el código ya cambió pero `.github/` (skills, agents, memory) aún refleja el estado anterior.
Este prompt detecta **todos los cambios no commiteados** vía `git diff HEAD`, analiza qué cambió estructuralmente, y mantiene `.github/` en sincronía.

**Diferencia vs `/sync-github`**: este prompt usa `git diff HEAD` como fuente (cambios reales del working tree), no el contexto de conversación.

---

## Step 0 — Obtener cambios actuales

Ejecutar en terminal:

```bash
git status --short
git diff HEAD --name-only
git diff HEAD --stat
```

Si el usuario pasó rutas específicas como argumento → filtrar solo esas.
Si no hay cambios (`nothing to commit`) → informar y salir.

Recopilar:

- **Archivos modificados** (`M`) — comparar con HEAD
- **Archivos nuevos** (`??` o `A`) — leer completo, sin HEAD de referencia
- **Archivos eliminados** (`D`) — verificar referencias en `.github/`

Excluir siempre: archivos dentro de `.github/` (son el destino, no la fuente).

---

## Step 1 — Leer y clasificar cada archivo cambiado

Para cada archivo cambiado, ejecutar `git diff HEAD -- <file>` y responder:

| Pregunta                                                                      | Por qué importa                         |
| ----------------------------------------------------------------------------- | --------------------------------------- |
| ¿Se eliminaron funciones/endpoints/clases?                                    | Referencias obsoletas en skills/agents  |
| ¿Se añadieron o renombraron funciones/endpoints/clases?                       | Skills pueden necesitar nuevos patrones |
| ¿Cambió el contrato de API (URL, método, request/response shape)?             | Precisión de agent y skill              |
| ¿Emergió o cambió un patrón (nueva abstracción, helper, anti-patrón)?         | Skills deben capturarlo                 |
| ¿Se tomó una decisión estructural (mantener X, rechazar Y, default a Z)?      | decisions.md                            |
| ¿Se encontró un gotcha no obvio (bug costoso, comportamiento env-específico)? | learnings.md                            |

Saltar archivos donde solo cambiaron detalles de implementación internos sin efecto estructural.

---

## Step 2 — Cross-reference con `.github/`

Para cada cambio estructural encontrado en Step 1, verificar los archivos `.github/` relevantes:

**Skills** (`skills/*/SKILL.md`, `skills/SKILLS-DIGEST.md`):

- ¿Algún skill referencia una **función/endpoint eliminado**? → marcar para eliminación
- ¿Algún skill describe un **patrón que cambió**? → marcar para actualización
- ¿Hay un **nuevo patrón reutilizable** aún no documentado? → marcar para adición

**Agents** (`agents/*.agent.md`):

- ¿Algún agent workflow referencia un **paso o endpoint eliminado**? → actualizar
- ¿El nuevo código introduce una **regla de comportamiento** para un agent específico? → añadir

**Memory** (`memory/learnings.md`, `decisions.md`, `conventions.md`, `glossary.md`):

- **Gotcha encontrado** → `learnings.md` (sección Gotchas)
- **Decisión arquitectónica tomada** → `decisions.md`
- **Nueva convención confirmada** → `conventions.md`
- **Nuevo término de dominio** → `glossary.md`

**Config** (`copilot-instructions.md`, `ROUTER.md`, `TOOLS.md`):

- Nueva dependencia, ruta, comando o dato de stack → `copilot-instructions.md` Project Profile
- Nuevo scope de agent o mapping de tool → `TOOLS.md`

---

## Step 3 — Construir propuesta (sin escribir aún)

```
# /update-github — Propuesta de actualización (YYYY-MM-DD)
Archivos git analizados: [N] | Con cambios estructurales: [N] | Sin impacto en .github/: [N]
Actualizaciones necesarias: [N]

| # | Archivo cambiado | Qué cambió | Target en .github/ | Acción | Stale/New |
|---|---|---|---|---|---|
| 1 | api/product/router.py | eliminado endpoint /all | skills/fastapi-backend/SKILL.md | eliminar referencia a /all | Stale |
| 2 | api/product/services.py | nuevo patrón _iter_page_dicts | skills/fastapi-backend/SKILL.md | añadir patrón streaming en §4 | New |
```

Para cada fila, mostrar el **texto exacto a insertar o eliminar** y la ubicación precisa (ruta + encabezado de sección).

Si no hay nada que actualizar → reportarlo claramente y salir.

---

## Step 4 — Aplicar

1. **Skills / agents / config** → aplicar directamente, ediciones quirúrgicas (sin reescrituras completas).
2. **Escrituras en memory** → per GUARDRAILS §2: mostrar entradas exactas, esperar confirmación explícita, luego escribir.
   Formato: `- **Título** — descripción en una línea. (YYYY-MM-DD)`
3. Preservar toda la estructura de secciones existente; no eliminar contenido no relacionado.

---

## Step 5 — Reporte final

```
# Sincronizado
- [archivo]: [qué cambió] (skill | agent | memory | config)

# Sin cambio necesario
- [archivo] — [razón: puramente interno, ya documentado, etc.]

# Sugerencias de seguimiento
- /refresh-overview  (si hay archivos nuevos o eliminados que afecten la estructura del proyecto)
- git add -p && git commit  (continuar con el commit)
```

---

## Reglas

1. **El código es la fuente de verdad** — si el código ya no lo tiene, la documentación tampoco debe.
2. **Ediciones quirúrgicas únicamente** — insertar/eliminar la línea o sección específica obsoleta; nunca reescribir archivos completos.
3. **Skills/agents primero, memory como fallback** — promover patrones reutilizables a skills; aparcar gotchas/decisiones en memory.
4. **Un hogar por ítem** — no duplicar el mismo dato en múltiples archivos.
5. **Escrituras en memory requieren confirmación** — mostrar entradas primero, esperar, luego escribir (GUARDRAILS §2).
6. **Saltar cambios puramente internos** — ¿función renombrada pero no referenciada en `.github/`? Saltar.
7. **Nunca eliminar archivos** — solo añadir o editar contenido quirúrgicamente.
8. **Siempre ejecutar git diff** — no asumir qué cambió; leer el diff real antes de cualquier decisión.
