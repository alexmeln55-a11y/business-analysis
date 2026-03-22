# Текущее состояние проекта

Обновлено: 2026-03-22

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

---

## Текущее состояние

- Приложение запускается: `cd app && npm install && npm run dev`
- Работает на `http://localhost:3000`
- 5 маршрутов: `/` `/profile` `/discovery` `/signals` `/opportunities` `/opportunities/[id]`
- Данные — из seed-файла (`app/lib/seed.ts`) + mock-details (`app/lib/mock-details.ts`), SQLite ещё не подключён
- Detail-страница `/opportunities/[id]` показывает все 4 фильтра с разбором, foreign patterns, shortlist_reason
- Список `/opportunities` показывает shortlist_reason под заголовком карточки
- `/assessment` — обзор 6 блоков диагностики, блок 1 активен
- `/assessment/founder-intake` — форма блока 1 (4 секции × 4 вопроса), autosave в localStorage
- `/assessment/overview` — итог блока 1 с 5 derived insights, CTA
- Формы и кнопки отрисованы, но задизейблены (логика в следующем chunk)

---

## Следующий chunk: SQLite + реальные data models (был запланирован ранее)

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
