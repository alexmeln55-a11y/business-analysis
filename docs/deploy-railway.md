# Deploy на Railway

## Требования

- Railway аккаунт
- GitHub репо подключён к Railway
- Env variables выставлены (см. ниже)

## Шаги

### 1. Создать сервис в Railway

1. Railway Dashboard → New Project → Deploy from GitHub repo
2. Выбрать репозиторий `business-ai`
3. В настройках сервиса: **Root Directory** → `app`
4. Railway автоматически подхватит `railway.json` и `nixpacks.toml`

### 2. Persistent Volume (обязательно — иначе данные теряются)

1. Railway Dashboard → сервис → **Volumes**
2. Add Volume:
   - Mount Path: `/data`
   - Size: 1 GB (достаточно для MVP)
3. Сохранить

### 3. Environment Variables

В Railway Dashboard → сервис → Variables добавить:

| Переменная | Значение |
|---|---|
| `DATA_DIR` | `/data` |
| `ANTHROPIC_API_KEY` | `sk-ant-...` |
| `NODE_ENV` | `production` |
| `PORT` | `3000` |

> `DATA_DIR=/data` — SQLite будет писать в volume, данные переживут redeploy.

### 4. Deploy

Railway сам запустит деплой после пуша в GitHub.

Build команда: `npm run build`
Start команда: `npm start`

### 5. После деплоя — инициализировать БД

Через Railway Shell (сервис → Shell):

```bash
npm run pipeline:setup
```

Это создаст таблицы в `/data/opportunity.db`.

## Важно про better-sqlite3

`better-sqlite3` — нативный модуль, компилируется при build.
`nixpacks.toml` добавляет `python3`, `gcc`, `gnumake` — это необходимо.

## Переменные, которые не нужны на Railway

- Telegram токены — только если используешь ingestion pipeline
- Все pipeline скрипты (`pipeline:ingest` и т.д.) — запускать вручную через Shell

## Структура URL

После деплоя Railway даст домен вида:
`https://business-ai-production-xxxx.up.railway.app`

Маршруты:
- `/` — dashboard
- `/discovery` — форма запроса
- `/assessment` — диагностика основателя
- `/opportunities` — карточки возможностей
