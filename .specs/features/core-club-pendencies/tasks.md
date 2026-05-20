# Core Club Pendencies Tasks

**Status**: Draft  
**Escopo**: pre-implementacao

## Gate Check Commands

| Gate | Command | Notes |
| --- | --- | --- |
| contracts | `pnpm --filter @pong-ping/contracts build` | Necessaario se contrato novo for criado. |
| unit | `pnpm --filter @pong-ping/api test` | Controllers, query provider e serializer. |
| build | `pnpm --filter @pong-ping/api build` | Wiring do Nest. |

## Tarefas

### T1: Registrar Decisao De Ownership

**What**: Documentar se `core.club` permanece sincronizado por `identity` ou ganha API administrativa praApria.  
**Where**: `.specs/features/core-club-pendencies/design.md`, `.notebook/core-api-status.md` se a decisao alterar o status.  
**Requirement**: CORE-CLUB-01

**Done when**:

- [ ] Ownership entre `identity.tenant` e `core.club` esta documentado.
- [ ] Alteracoes permitidas via Core estao explicitamente aceitas ou rejeitadas.
- [ ] Nenhuma tarefa de controller administrativo segue sem essa decisao.

### T2: Definir Contrato De Leitura Do Clube Atual

**What**: Confirmar se `ClubResponseContract` atende ao frontend ou criar contrato especifico.  
**Where**: `packages/contracts/src/core.ts` se houver contrato novo.  
**Requirement**: CORE-CLUB-02

**Done when**:

- [ ] Shape de resposta esta definido.
- [ ] Build de contratos passa se houver alteracao.

### T3: Planejar Read Query Do Clube Atual

**What**: Especificar query tenant-scoped para buscar o clube atual.  
**Where**: `apps/api/src/modules/core/club/presentation/http/queries/club-read.query.ts`  
**Requirement**: CORE-CLUB-02

**Done when**:

- [ ] Query filtra por `tenantId`.
- [ ] Query retorna DTO/contrato de leitura, sem reconstruir agregado para exibicao.
- [ ] Teste cobre sucesso e clube ausente.

### T4: Planejar Controller De Leitura

**What**: Expor `GET /core/club` se confirmado pelo frontend.  
**Where**: `apps/api/src/modules/core/club/club-read.controller.ts`, `club.module.ts`  
**Requirement**: CORE-CLUB-02

**Done when**:

- [ ] Controller usa `CurrentContextService` para obter tenant atual.
- [ ] Roles `MEMBER` e `ADMIN` sao aceitas.
- [ ] Controller esta registrado no `ClubModule`.
- [ ] Gates `unit` e `build` passam.

