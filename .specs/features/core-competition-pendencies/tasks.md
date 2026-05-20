# Core Competition Pendencies Tasks

**Status**: Draft  
**Escopo**: pre-implementacao

## Gate Check Commands

| Gate | Command | Notes |
| --- | --- | --- |
| unit | `pnpm --filter @pong-ping/api test` | Queries, controllers e use cases existentes. |
| build | `pnpm --filter @pong-ping/api build` | Confirmar wiring. |

## Tarefas

### T1: Congelar Status Do Topico

**What**: Registrar que as pendencias funcionais de Competition estao concluidas.  
**Where**: `.specs/features/core-competition-pendencies/spec.md`, `.notebook/core-api-status.md` se necessario.  
**Requirement**: CORE-COMPETITION-01

**Done when**:

- [ ] Nao ha tarefa de nova feature para Competition sem demanda adicional.
- [ ] Itens concluidos continuam rastreados como verificacao.

### T2: Adicionar Teste De Regressao Se Faltar

**What**: Conferir se historico, detalhe e correcoes ja estao cobertos; criar teste somente se houver lacuna.  
**Where**: `apps/api/src/modules/core/core-read.queries.spec.ts`, `core-read.controllers.spec.ts`, `competition.use-cases.spec.ts`  
**Requirement**: CORE-COMPETITION-01

**Done when**:

- [ ] Historico paginado esta coberto.
- [ ] Detalhe tenant-scoped esta coberto.
- [ ] Correcao no historico esta coberta.

### T3: Sincronizar Com Decisao De Rating Doubles

**What**: Reavaliar `RecordGameUseCase` apos decisao de pareamento em doubles.  
**Where**: `apps/api/src/modules/core/competition/application/use-cases/record-game.use-case.ts`  
**Requirement**: CORE-COMPETITION-02

**Done when**:

- [ ] Se rating mudar, competicao aplica a policy nova.
- [ ] Se rating nao mudar, nenhuma alteracao em competicao e feita.

