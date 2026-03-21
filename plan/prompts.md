# prompts.md

Эти промпты рассчитаны на Cursor + Claude Code.
Не опирайся на Antigravity-специфику и не предполагай наличие MCP как обязательного канала работы.

## 1. Первая сессия

Read:
- /CLAUDE.md
- /plan/requirements.md
- /plan/strategy.md
- /plan/chunks.md
- /plan/n8n.md
- /plan/operating-rules.md

Then:
1. summarize the project
2. summarize the fixed constraints
3. identify the current chunk order
4. point out contradictions if any
5. stop before implementation

## 2. Реализация chunk

Read:
- /CLAUDE.md
- /plan/requirements.md
- /plan/strategy.md
- /plan/chunks.md
- /plan/n8n.md
- /plan/operating-rules.md

Implement only Chunk [NUMBER]: [TITLE].

Rules:
- stay inside the chunk boundary
- do not silently change architecture
- do not jump ahead
- keep the project working
- document important assumptions

After implementation:
1. verify done criteria
2. verify nothing older broke
3. report created/changed files
4. stop

## 3. Reliability review

Review current chunk.

Check:
- does the project still match CLAUDE.md?
- are done criteria satisfied?
- are docs and repo aligned?
- are there hidden manual steps?
- did anything drift toward premature infra decisions?

If issues exist:
- fix
- re-check
- report

## 4. Новая чистая сессия

Read all planning files again.
Summarize current state.
Continue only with the next approved chunk.
Do not re-open completed chunks unless necessary.
