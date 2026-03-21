# chunks.md

## Chunk 01 — Repo foundation and project rules
Цель:
- зафиксировать структуру проекта и правила работы

Scope:
- CLAUDE.md
- plan/*
- docs/repo-map.md
- registry/README.md

Done criteria:
- все основные плановые файлы существуют
- репо-структура понятна
- правила проекта зафиксированы

## Chunk 02 — Contracts and registry skeleton
Цель:
- зафиксировать contracts и registry каркас

Scope:
- contracts/README.md
- registry/hooks/*
- registry/scripts/*
- registry/skills/*
- registry/instructions/*
- registry/prompts/*
- registry/agents/*

Done criteria:
- есть шаблоны сущностей
- naming rules понятны
- у сущностей есть структура

## Chunk 03 — UI kit foundation
Цель:
- собрать tokens и базовые UI principles без привязки к финальному стеку

Scope:
- docs/ui-principles.md
- docs/ui-tokens.md
- docs/page-templates.md

Done criteria:
- стиль зафиксирован
- базовые компоненты и шаблоны экранов описаны

## Chunk 04 — Core product contracts
Цель:
- описать core data shapes

Scope:
- FounderProfile contract
- MarketSignal contract
- BusinessPattern contract
- OpportunityCard contract
- ScoringRun contract

Done criteria:
- все core сущности описаны
- поля и версии согласованы

## Chunk 05 — MVP user flows
Цель:
- описать пользовательские сценарии MVP

Scope:
- founder intake
- signal review
- shortlist
- detail page

Done criteria:
- flows описаны
- понятно, какие экраны и какие данные нужны

## Chunk 06 — Scoring v1 specification
Цель:
- зафиксировать scoring logic v1

Scope:
- scoring components
- penalties
- decision thresholds

Done criteria:
- scoring v1 описан
- структура расчёта понятна

## Chunk 07 — Workflow templates for later automation
Цель:
- подготовить repo-managed шаблоны workflow до live n8n

Scope:
- automation/n8n/workflows/*.json templates
- automation/n8n/docs/*.md

Done criteria:
- шаблоны существуют
- naming и import rules описаны

## Chunk 08 — Local/self-hosted free n8n integration
Цель:
- подключить n8n после готового MVP-каркаса

Scope:
- import/export process
- smoke-checks
- runtime notes

Done criteria:
- есть рабочая схема интеграции
- repo не расходится с n8n

## Chunk 09 — MVP polish and consistency pass
Цель:
- устранить противоречия, улучшить связность

Done criteria:
- docs не расходятся
- naming consistent
- chunk outputs согласованы

## Chunk 10 — Post-MVP infra planning
Цель:
- только после MVP описать РФ-инфраструктуру и продовый контур

Done criteria:
- есть отдельный post-MVP infra plan
- MVP при этом не перепутан с production design
