# strategy.md

## 1. Problem

Людям трудно найти жизнеспособную бизнес-возможность, потому что:
- они видят слишком много шума
- не умеют отличать сильную проблему от слабой идеи
- не понимают, что подходит именно им
- не знают, как быстро войти в рынок

## 2. Product thesis

MVP должен быть не генератором идей, а движком отбора бизнес-возможностей.

Формула:
- market pain
- founder fit
- foreign patterns
- entry feasibility

Результат:
- shortlist из сильных Opportunity Card
- scoring v1
- recommended entry mode
- first offer
- first test

## 3. Strategy principle

Сначала строим repo-managed MVP ядро.
Потом registry и contracts.
Потом UI surfaces.
Потом scoring and product flows.
Потом local/self-hosted free n8n integration.
Потом post-MVP infra plan.

## 4. Core entities

### FounderProfile
- experience
- skills
- distribution access
- preferred models
- time horizon
- manual work tolerance
- sales cycle tolerance

### MarketSignal
- raw signal
- audience
- problem
- current workaround
- evidence strength
- frequency
- urgency

### BusinessPattern
- problem type
- segment
- wedge
- monetization
- portability
- complexity

### OpportunityCard
- problem
- audience
- pain score
- willingness to pay
- founder fit score
- pattern score
- entry feasibility score
- risks
- entry mode
- first offer
- first test
- overall score
- confidence

### ScoringRun
- score inputs
- penalties
- scoring version
- final score

## 5. Registry model

### hooks
Точки входа в сценарии

### scripts
Детерминированные действия:
- normalize
- validate
- rank
- calculate
- classify
- deduplicate

### skills
Сборки сценариев анализа:
- profile assess
- problem extract
- opportunity score
- entry mode select

### instructions
Ограничители и политики:
- evidence first
- json only
- no invention
- validate required fields

### prompts
Шаблоны LLM для конкретных skill use cases

### agents
Связка:
- skills
- prompts
- instructions
- tools
- workflow binding

## 6. MVP architecture

На этапе MVP архитектура должна быть лёгкой.

Слои:
1. repo docs + rules
2. contracts + registry
3. UI kit + app shell
4. core product screens
5. scoring logic v1
6. local/mock data
7. workflow templates
8. n8n integration later

## 7. n8n strategy

n8n подключается не сразу.

Правильный порядок:
1. Описать workflow contracts в repo
2. Подготовить workflow templates
3. Подготовить docs и import/deploy rules
4. После этого подключать local/self-hosted free n8n
5. Проверять через smoke tests
6. Только после стабильного MVP обсуждать продовый РФ-контур

n8n нужен как orchestration/runtime layer, а не как место, где хранится единственная версия логики.

## 8. Scoring logic v1

Компоненты:
- market pain score
- founder fit score
- proven pattern score
- entry feasibility score
- penalties

Принцип:
final score = positives - penalties

На старте scoring v1 может быть rule-based + light LLM assist.

## 9. User flows

### Flow 1: Founder intake
Пользователь заполняет профиль

### Flow 2: Signal review
Пользователь или система просматривает problem signals

### Flow 3: Opportunity shortlist
Система строит shortlist возможностей

### Flow 4: Opportunity detail
Пользователь открывает Opportunity Card и видит:
- why this
- why now
- why fit / not fit
- first test

## 10. UI system approach

- единый UI kit
- warm dark editorial language
- layout first
- readability first
- minimal noise
- premium restrained visual system

## 11. Recommended implementation stance

Стек пока не фиксируется.
Нужно проектировать так, чтобы Claude не изобрёл преждевременно финальную инфраструктуру.

То есть:
- contracts отдельно
- registry отдельно
- UI kit отдельно
- automation отдельно
- no premature vendor lock-in

## 12. Repo structure

- /plan
- /registry
- /automation/n8n
- /contracts
- /docs
- /scripts

## 13. Risks

1. Слишком рано зафиксировать стек
2. Слишком рано потащить n8n в центр проекта
3. Разрешить ручные изменения вне repo
4. Смешать MVP и production infra
