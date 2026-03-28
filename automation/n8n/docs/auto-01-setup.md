# Auto-01: Daily Pipeline Ingest — Setup

## Что делает этот workflow

Каждый день в 08:00 UTC запускает три шага:
1. `pipeline:ingest-megatrends` — фетчит все активные RSS/web-источники, сохраняет новые записи в `raw_signals`
2. `pipeline:extract-megatrends` — прогоняет необработанные `raw_signals` через LLM, создаёт `megatrends`
3. `pipeline:dedup-megatrends` — семантический dedup + topic critic pass

Результат каждого ingest-запуска по источнику пишется в таблицу `source_runs`.

## Предварительные требования

- n8n community edition запущен локально или self-hosted
- Node.js и npm доступны в окружении n8n
- `.env` файл с `OPENAI_API_KEY` настроен в директории проекта
- Источники задом засеяны: `npm run pipeline:seed-megatrend-sources`

## Шаги установки

### 1. Настроить переменную окружения в n8n

В n8n UI → Settings → Variables → добавить:

| Name | Value |
|------|-------|
| `BUSINESS_AI_APP_DIR` | `/абсолютный/путь/до/business-ai/app` |

Например: `/Users/username/projects/business-ai/app`

### 2. Импортировать workflow

1. n8n UI → Workflows → Import from file
2. Выбрать файл: `automation/n8n/workflows/auto-01-daily-ingest.json`
3. Нажать Import

### 3. Проверить workflow

После импорта убедиться:
- Все три ноды `Execute Command` видны и соединены
- Триггер: Schedule → Daily 08:00 (cron: `0 8 * * *`)
- В каждой ноде команда использует `$vars.BUSINESS_AI_APP_DIR`

### 4. Тест-запуск (Manual)

1. Открыть workflow в редакторе
2. Нажать "Test workflow" (запускает вручную без ожидания расписания)
3. Проверить вывод каждой ноды — должен быть stdout от npm run

### 5. Активировать

После успешного теста: переключить workflow в `Active`.

## Проверка результатов

После первого успешного запуска:

```sql
-- Результаты по каждому источнику
SELECT s.source_name, sr.status, sr.new_found, sr.duplicates_found, sr.error_message, sr.started_at
FROM source_runs sr
JOIN sources s ON s.source_id = sr.source_id
ORDER BY sr.started_at DESC;

-- Статус источников
SELECT source_name, status, last_success_at FROM sources;
```

## Smoke-check

| Проверка | Ожидаемый результат |
|----------|-------------------|
| Workflow importable | Без ошибок при импорте |
| Trigger valid | cron `0 8 * * *` |
| Manual run | stdout от npm run pipeline:* |
| source_runs после запуска | Строки со status=success или error |
| Дубли | duplicates_found > 0 при повторном запуске |
| Ошибка источника | status=error в source_runs, остальные источники продолжают |

## Что НЕ делает этот workflow

- Не запускает `confirm-megatrends` (требует LLM, делается отдельно по необходимости)
- Не отправляет уведомления (нет настроенного канала)
- Не имеет retry при ошибке отдельного источника (источник помечается как error, следующий запуск попробует снова)
