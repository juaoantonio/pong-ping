# Core Table Pendencies Tasks

**Status**: Draft  
**Escopo**: pre-implementacao

## Gate Check Commands

| Gate | Command | Notes |
| --- | --- | --- |
| unit | `pnpm --filter @pong-ping/api test` | Use cases, repository doubles e controller. |
| build | `pnpm --filter @pong-ping/api build` | TypeORM/Nest wiring. |
| e2e | `pnpm --filter @pong-ping/api test:e2e` | Rodar quando Docker/Testcontainers estiver disponivel. |

## Tarefas

### T1: Escolher Estrategia De Concorrencia

**What**: Decidir entre lock pessimista transacional e optimistic locking.  
**Where**: `.specs/features/core-table-pendencies/design.md`  
**Requirement**: CORE-TABLE-01

**Done when**:

- [ ] Estrategia selecionada esta documentada.
- [ ] Comandos impactados estao listados.
- [ ] Resposta esperada para conflito esta definida.

### T2: Planejar Repositorio Transacional

**What**: Definir API do `TableRepository` para carregar/salvar mesa sob lock.  
**Where**: `apps/api/src/modules/core/table/infrastructure/typeorm/repositories/table.repository.ts`  
**Requirement**: CORE-TABLE-01

**Done when**:

- [ ] API transacional cobre os comandos mutaveis de mesa.
- [ ] Testes conseguem simular conflito ou verificar uso de transaction manager.

### T3: Planejar Tenant Scope Dos Comandos

**What**: Fazer comandos de mesa receberem `clubId`/`tenantId` quando acionados por HTTP.  
**Where**: `apps/api/src/modules/core/table/application/use-cases/*.use-case.ts`  
**Requirement**: CORE-TABLE-01

**Done when**:

- [ ] Mesa de outro tenant nao pode ser alterada pelo endpoint.
- [ ] Teste cobre tentativa cross-tenant.

### T4: Planejar Autorizacao De Remocao

**What**: Aplicar policy para remove queue e remove active game.  
**Where**: `apps/api/src/modules/core/table/table-command.controller.ts` ou policy dedicada.  
**Requirement**: CORE-TABLE-02, CORE-TABLE-03

**Done when**:

- [ ] Membro remove a si mesmo.
- [ ] Membro nao remove outro atleta.
- [ ] Admin remove outro atleta no mesmo tenant.
- [ ] Gates `unit` e `build` passam.

