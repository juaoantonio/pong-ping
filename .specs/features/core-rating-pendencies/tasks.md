# Core Rating Pendencies Tasks

**Status**: Draft  
**Escopo**: pre-implementacao

## Gate Check Commands

| Gate | Command | Notes |
| --- | --- | --- |
| contracts | `pnpm --filter @pong-ping/contracts build` | Necessario se houver contrato novo. |
| unit | `pnpm --filter @pong-ping/api test` | Query/controller/rating algorithm. |
| build | `pnpm --filter @pong-ping/api build` | Wiring. |

## Tarefas

### T1: Definir Rating Ausente

**What**: Escolher entre 404 e rating default para atleta sem partidas.  
**Where**: `.specs/features/core-rating-pendencies/design.md`  
**Requirement**: CORE-RATING-01

**Done when**:

- [ ] Comportamento esta documentado.
- [ ] Teste esperado para atleta sem rating esta definido.

### T2: Planejar Query De Rating Por Atleta

**What**: Adicionar metodo de leitura por atleta.  
**Where**: `apps/api/src/modules/core/rating/presentation/http/queries/rating-read.query.ts`  
**Requirement**: CORE-RATING-01

**Done when**:

- [ ] Query filtra por tenant e atleta.
- [ ] Retorno usa `RatingReadContract` ou contrato aprovado.
- [ ] Testes cobrem sucesso, ausente e cross-tenant.

### T3: Planejar Endpoint De Rating Por Atleta

**What**: Expor rota HTTP para consulta individual.  
**Where**: `apps/api/src/modules/core/rating/rating-read.controller.ts`  
**Requirement**: CORE-RATING-01

**Done when**:

- [ ] Rota e documentada em Swagger.
- [ ] Roles member/admin sao aplicadas.
- [ ] Gate `unit` passa.

### T4: Decidir Algoritmo De Doubles

**What**: Validar regra de calculo de deltas em doubles.  
**Where**: `.specs/features/core-rating-pendencies/design.md`  
**Requirement**: CORE-RATING-02

**Done when**:

- [ ] Algoritmo escolhido esta registrado.
- [ ] Exemplos de entrada/saida estao definidos.

### T5: Planejar Implementacao Do Algoritmo

**What**: Criar ou ajustar policy/servico usado por `RecordGameUseCase`.  
**Where**: `apps/api/src/modules/core/rating/domain`, `apps/api/src/modules/core/competition/application/use-cases/record-game.use-case.ts`  
**Requirement**: CORE-RATING-02

**Done when**:

- [ ] Singles continuam com comportamento atual.
- [ ] Doubles possuem testes com ordem de atletas relevante.
- [ ] Gates `unit` e `build` passam.

