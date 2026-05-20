# Core Scoreboard Pendencies Tasks

**Status**: Draft  
**Escopo**: pre-implementacao

## Gate Check Commands

| Gate | Command | Notes |
| --- | --- | --- |
| contracts | `pnpm --filter @pong-ping/contracts build` | Se API/contratos forem criados. |
| unit | `pnpm --filter @pong-ping/api test` | Dominio, use cases e controller. |
| build | `pnpm --filter @pong-ping/api build` | Wiring. |

## Tarefas

### T1: Decidir Fonte De Estado

**What**: Escolher entre frontend transiente, backend transiente ou persistido.  
**Where**: `.specs/features/core-scoreboard-pendencies/design.md`  
**Requirement**: CORE-SCOREBOARD-01

**Done when**:

- [ ] Decisao esta documentada.
- [ ] Lifecycle ao formar/encerrar jogo ativo esta definido.
- [ ] Necessidade de realtime esta marcada como dentro ou fora do escopo.

### T2: Definir Contratos Se Houver API

**What**: Criar shape de leitura e comandos do placar.  
**Where**: `packages/contracts/src/core.ts`  
**Requirement**: CORE-SCOREBOARD-03

**Done when**:

- [ ] Contratos representam lados e pontos.
- [ ] Contratos nao expaEem objetos de dominio.
- [ ] Gate `contracts` passa.

### T3: Planejar Application Layer

**What**: Definir use cases para get, point, undo e reset.  
**Where**: `apps/api/src/modules/core/scoreboard/application/use-cases`  
**Requirement**: CORE-SCOREBOARD-02

**Done when**:

- [ ] Use cases validam mesa/jogo ativo.
- [ ] Tenant scope esta definido.
- [ ] Concorrencia esta alinhada com estrategia de mesa.

### T4: Planejar Persistencia Se Necessaria

**What**: Criar schema/repository apenas se estado persistido for escolhido.  
**Where**: `apps/api/src/modules/core/scoreboard/infrastructure/typeorm`  
**Requirement**: CORE-SCOREBOARD-01

**Done when**:

- [ ] Schema identifica club, table e active game.
- [ ] Repository suporta update atomico ou lock.

### T5: Planejar API Se Backend Operar Placar

**What**: Expor endpoints de leitura e comandos.  
**Where**: `apps/api/src/modules/core/scoreboard/scoreboard.controller.ts`  
**Requirement**: CORE-SCOREBOARD-03

**Done when**:

- [ ] Roles member/admin estao definidas.
- [ ] Testes cobrem point, undo, reset e jogo ativo ausente.
- [ ] Gates `unit` e `build` passam.

