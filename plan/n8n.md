# n8n.md

## 1. Жёсткие правила

- Используется только self-hosted / downloaded / free community n8n.
- Никакой платной n8n cloud.
- На этапе MVP n8n не должен становиться центром всей системы.
- Все workflow должны храниться в repo.
- n8n UI не является источником правды.

## 1A. Ограничение по инструментам

- План не должен зависеть от Antigravity.
- План не должен зависеть от MCP как обязательного слоя.
- Основной сценарий работы: Cursor + Claude Code + repo-managed files + local/self-hosted n8n.
- Если позже появится отдельный способ безопасного вызова workflow, он может быть добавлен как опция, но не как базовое требование MVP.

## 2. Когда подключаем n8n

Только после:
- foundation
- contracts
- registry
- базового UI shell
- core product flows
- scoring skeleton

До этого допустимо готовить только:
- workflow templates
- workflow JSON
- docs
- import/export notes
- deploy scripts

## 3. Workflow rules

Каждый workflow должен иметь:
- id
- name
- purpose
- trigger
- inputs
- outputs
- owner
- retry policy
- error handling
- linked agents/skills

Один workflow = одна ответственность.

## 4. Agent rules

Каждый агент обязан иметь карточку в registry.
Нельзя создавать "неявных" агентов.

## 5. Repo structure

/automation/n8n/workflows
/automation/n8n/docs
/automation/n8n/agents

Если появятся helper scripts:
/scripts

## 6. Export/import rule

Любое изменение workflow должно быть отражено в repo.

Если workflow менялся в live/local n8n:
1. экспортировать
2. сохранить в repo
3. обновить docs
4. провести smoke-check

## 7. Если live access нет

Claude не должен писать, что n8n уже настроен.

Разрешённый результат:
- workflow JSON
- import instructions
- setup docs
- deploy scripts
- test instructions

## 8. Smoke-check для n8n

Минимум:
- workflow importable
- trigger contract valid
- expected input accepted
- expected output shape returned
- error path described

## 9. Что не делаем сейчас

- enterprise scopes
- продовый HA setup
- продовый secret store design
- продовую monitoring strategy
- complex multi-environment topology
