# Scoring v1 — Спецификация

## Формула

```
final_score = (market_score * 0.35)
            + (founder_fit_score * 0.30)
            + (pattern_score * 0.20)
            + (entry_feasibility_score * 0.15)
            - penalty_score
```

Итоговый балл: от 0.0 до 1.0.

---

## Компоненты

### 1. Market Score (вес 35%)
Оценивает насколько реальна и острая боль рынка.

| Фактор | Баллы |
|--------|-------|
| evidence_strength = strong | +0.40 |
| evidence_strength = moderate | +0.25 |
| evidence_strength = weak | +0.10 |
| evidence_strength = anecdotal | +0.00 |
| urgency = critical | +0.35 |
| urgency = high | +0.25 |
| urgency = medium | +0.15 |
| urgency = low | +0.00 |
| frequency = pervasive | +0.25 |
| frequency = frequent | +0.15 |
| frequency = occasional | +0.05 |
| frequency = rare | +0.00 |

Сумма нормализуется к диапазону 0.0–1.0.

---

### 2. Founder Fit Score (вес 30%)
Оценивает, насколько профиль основателя подходит под эту возможность.

| Фактор | Баллы |
|--------|-------|
| domain_match_score ≥ 0.7 | +0.40 |
| domain_match_score 0.4–0.69 | +0.20 |
| domain_match_score < 0.4 | +0.00 |
| distribution_match_score ≥ 0.7 | +0.35 |
| distribution_match_score 0.4–0.69 | +0.15 |
| distribution_match_score < 0.4 | +0.00 |
| model_preference_match = true | +0.15 |
| time_horizon_feasible = true | +0.10 |

Сумма нормализуется к диапазону 0.0–1.0.

---

### 3. Pattern Score (вес 20%)
Оценивает, есть ли проверенные аналоги бизнес-паттерна.

| Фактор | Баллы |
|--------|-------|
| Нет matched patterns | 0.0 |
| portability_avg ≥ 4.0 | +0.50 |
| portability_avg 2.5–3.9 | +0.30 |
| portability_avg < 2.5 | +0.10 |
| complexity_avg ≤ 2.0 | +0.30 |
| complexity_avg 2.1–3.5 | +0.20 |
| complexity_avg > 3.5 | +0.00 |
| Количество matched patterns ≥ 2 | +0.20 |

Сумма нормализуется к диапазону 0.0–1.0.

---

### 4. Entry Feasibility Score (вес 15%)
Оценивает, реалистично ли войти в рынок с имеющимися ресурсами.

| Фактор | Баллы |
|--------|-------|
| manual_work_tolerance = high | +0.30 |
| manual_work_tolerance = medium | +0.15 |
| manual_work_tolerance = low | +0.00 |
| time_horizon_months ≥ 12 | +0.30 |
| time_horizon_months 6–11 | +0.20 |
| time_horizon_months < 6 | +0.05 |
| distribution_access имеет ≥ 2 канала | +0.25 |
| distribution_access имеет 1 канал | +0.10 |
| sales_cycle_tolerance подходит к entry mode | +0.15 |

Сумма нормализуется к диапазону 0.0–1.0.

---

## Штрафы (penalty_score)

Штрафы вычитаются из итогового балла. Суммируются.

| Условие | Штраф |
|---------|-------|
| confidence сигнала < 0.4 | -0.10 |
| Нет ни одного matched pattern | -0.08 |
| founder fit_flags содержит domain_gap_detected | -0.10 |
| founder fit_flags содержит sales_cycle_mismatch | -0.07 |
| entry_feasibility_score < 0.3 | -0.05 |
| Единственный источник сигнала = anecdotal | -0.05 |

Максимальный суммарный штраф: -0.25 (дальше не накапливается).

---

## Пороги принятия решения

| Итоговый балл | Статус |
|---------------|--------|
| ≥ 0.70 | Сильная возможность — включается в шортлист |
| 0.50–0.69 | Средняя — включается с пометкой низкой уверенности |
| < 0.50 | Слабая — не включается в шортлист |

---

## Уверенность (confidence)

Confidence — отдельное поле, не часть формулы.
Показывает, насколько можно доверять итоговому баллу.

Снижается, если:
- evidence_strength = anecdotal или weak
- Нет matched patterns
- Есть активные fit_flags
- Один или более компонентов scored < 0.3

Базовое значение: 1.0
Каждое из условий выше снижает на 0.10–0.15.
Минимум: 0.20 (балл есть, но доверять ему нужно осторожно).

---

## Версия

formula_version: scoring-v1
Изменения в формуле требуют создания новой версии (scoring-v2) и сохранения старой.
