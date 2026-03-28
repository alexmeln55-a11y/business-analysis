# Текущее состояние проекта

Обновлено: 2026-03-29

---

## Что уже сделано

| Chunk | Что | Статус |
|-------|-----|--------|
| 01 | Repo foundation: CLAUDE.md, plan/*, docs/repo-map.md | ✅ |
| 02 | Contracts + registry skeleton | ✅ |
| 03 | UI kit: принципы, токены, шаблоны экранов, типографика | ✅ |
| 04 | Core product contracts (все 13 контрактов в contracts/) | ✅ |
| 05 | Пользовательские сценарии MVP (docs/user-flows.md) | ✅ |
| 06 | Scoring v1 specification (docs/scoring-v1.md) | ✅ |
| 07 | Workflow templates (3 JSON + docs в automation/n8n/) | ✅ |
| 08 | n8n setup docs, deploy/smoke-test скрипты | ✅ |
| 09 | Consistency pass: repo-map, core-entities, README | ✅ |
| 10 | Post-MVP infra plan (plan/post-mvp-infra.md) | ✅ |
| UI-01 | Next.js скелет: 4 экрана + навигация + UI-токены + seed | ✅ |
| UI-02 | Маршруты исправлены: / — dashboard, /discovery — запрос | ✅ |
| UI-03 | Смысловой слой: 4 фильтра на detail-странице, shortlist_reason в списке | ✅ |
| UI-04 | Диагностика основателя: /assessment + /assessment/founder-intake + /assessment/overview | ✅ |
| Assessment-02 | Блок 2 ESE: /assessment/ese, динамический статус блоков, ESE summary в overview | ✅ |
| Assessment-03 | Блок 3 HEXACO: /assessment/hexaco, 6 факторов × 4 вопроса, шкала 1–5, reverse scoring q8, HEXACO summary в overview | ✅ |
| Assessment-04 | Блок 4 Values: /assessment/values, 6 кластеров × 3 вопроса, шкала 1–6, reverse q12/q15, Values summary в overview | ✅ |
| Assessment-05 | Блок 5 Identity: /assessment/identity, 3 типа × 5 вопросов (Fauchart & Gruber), шкала 1–5, dominant+secondary, Identity summary в overview | ✅ |
| Assessment-06 | Блок 6 EntreComp: /assessment/entrecomp, 3 компетенции × 3 вопроса, шкала 1–5, EntreComp summary в overview | ✅ |
| Assessment-07 | Финальный overview: buildFounderSummary, 4 синтетических секции (сильные стороны, риски, стиль запуска, fit), completion status, условный CTA | ✅ |
| Assessment-01 | Блок 1 переделан в AI-распаковку: свободный текст, AI-уточнения (макс. 2 раунда), finalTag из whitelist, server-only prompts, защита от prompt injection | ✅ |
| Assessment-08 | Rule-based ядро + AI-слой + единый профиль: FounderProfile (6 секций), buildFounderProfile, /api/assessment/profile (AI-синтез с валидацией), overview переписан (профиль → блоки), шкалы исправлены (max=5) | ✅ |
| Pipeline-09 | Critic-gate для signal→topic: topic_critic_verdict/reason/checked_at, checkTopicPromotion(), critic-pass в dedup | ✅ |
| Rules-01 | Единый источник правил статусов: status-rules.ts (3 активных статуса), recalculate-statuses.ts для DB rescore, сигнатуры signals.ts / semantic-checker.ts / confirm-megatrends.ts приведены к новым правилам | ✅ |
| Sources-01 | Удалён Telegram-слой (auth/client/ingestion + скрипты), добавлено 20+ иностранных RSS-источников в seed, is_active флаг, default source_type=rss | ✅ |

---

## Текущее состояние

- Приложение запускается: `cd app && npm install && npm run dev`
- Работает на `http://localhost:3000`
- 5 маршрутов: `/` `/profile` `/discovery` `/signals` `/opportunities` `/opportunities/[id]`
- Данные — из seed-файла (`app/lib/seed.ts`) + mock-details (`app/lib/mock-details.ts`), SQLite ещё не подключён
- Detail-страница `/opportunities/[id]` показывает все 4 фильтра с разбором, foreign patterns, shortlist_reason
- Список `/opportunities` показывает shortlist_reason под заголовком карточки
- `/assessment` — обзор 6 блоков диагностики, все 6 блоков активны
- `/assessment/founder-intake` — блок 1 AI-распаковка: 8 вопросов, свободный текст, AI-уточнения, finalTag из whitelist, сохранение в localStorage (BLOCK1_AI_STORAGE_KEY)
- `/assessment/overview` — итог блока 1 с 5 derived insights, CTA
- Формы и кнопки отрисованы, но задизейблены (логика в следующем chunk)

---

## Важно: перед запуском блока 1

Нужна переменная `ANTHROPIC_API_KEY` в `app/.env.local`:
```
ANTHROPIC_API_KEY=sk-ant-...
```

---

## Следующий chunk: SQLite + реальные data models (или другое по приоритету)

**Цель:** заменить seed-данные на реальную БД. Профиль основателя сохраняется и читается из SQLite.

**Что делать:**
1. Добавить `better-sqlite3` в зависимости
2. Создать `app/lib/db.ts` — инициализация SQLite, создание таблиц
3. Создать таблицу `founder_profiles` по контракту `founder-profile.v1`
4. Создать API route: `POST /api/profile` — сохранение, `GET /api/profile` — чтение
5. Подключить форму на `/profile` к API
6. Убрать зависимость `/profile` от seed-данных

**Файлы, которые будут затронуты:**
- `app/package.json` — добавить better-sqlite3
- `app/lib/db.ts` — новый файл, инициализация БД
- `app/app/api/profile/route.ts` — новый API route
- `app/app/profile/page.tsx` — форма становится рабочей

**Файлы, которые не трогать:**
- Все файлы в `contracts/`, `registry/`, `plan/`, `docs/` (кроме этого файла)
- `automation/n8n/` — не трогать
- `app/app/signals/page.tsx` — пока остаётся на seed
- `app/app/opportunities/` — пока остаётся на seed

---

## Важные договорённости

| Правило | Детали |
|---------|--------|
| Стек MVP | Next.js + SQLite (better-sqlite3) |
| Язык кода | TypeScript |
| Стили | Inline styles + Tailwind; токены из tailwind.config.ts и globals.css |
| Данные | seed.ts — временно, заменяем по очереди на SQLite |
| n8n | Не подключать до готового MVP-ядра |
| Формат ответов | По-русски, коротко |
| До/после chunk | Строгий формат (см. CLAUDE.md memory) |

---

## Как проверить без чтения кода

```bash
cd app
npm install
npm run dev
# открыть http://localhost:3000
```

- `/` — dashboard с именем основателя и 4 шагами
- `/profile` — профиль с полями (пока read-only)
- `/discovery` — форма запроса (пока задизейблена)
- `/signals` — список сигналов с деталями при клике
- `/opportunities` — карточки с баллами
- `/opportunities/opp-001` — полная карточка возможности

---

## Что нельзя трогать без обсуждения

- Архитектуру маршрутов (уже согласована)
- Контракты в `contracts/` — только добавлять, не менять существующие поля
- `plan/` файлы — только добавлять/обновлять current-status.md
- Стиль UI — только через токены, без произвольных цветов
- n8n до команды "подключаем n8n"
