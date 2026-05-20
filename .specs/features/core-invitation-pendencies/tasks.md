# Core Invitation Pendencies Tasks

**Status**: Draft  
**Escopo**: pre-implementacao

## Gate Check Commands

| Gate | Command | Notes |
| --- | --- | --- |
| contracts | `pnpm --filter @pong-ping/contracts build` | Contratos de convite. |
| unit | `pnpm --filter @pong-ping/api test` | Dominio, use cases, repository e controller. |
| build | `pnpm --filter @pong-ping/api build` | Module wiring. |
| e2e | `pnpm --filter @pong-ping/api test:e2e` | Quando Docker/Testcontainers estiver disponivel. |

## Tarefas

### T1: Resolver Boundary Com Identity

**What**: Definir se convites pertencem ao Core, Identity ou fluxo compartilhado.  
**Where**: `.specs/features/core-invitation-pendencies/design.md`  
**Requirement**: CORE-INVITATION-01

**Done when**:

- [ ] Dono do fluxo de membership esta definido.
- [ ] Efeito do consumo de convite esta documentado.
- [ ] TableInvite tem regra clara para usuario nao membro.

### T2: Definir Contratos

**What**: Criar contratos para criar, validar e consumir convites.  
**Where**: `packages/contracts/src/core.ts` ou arquivo dedicado exportado.  
**Requirement**: CORE-INVITATION-03

**Done when**:

- [ ] Request/response contracts existem.
- [ ] Token e expiracao usam tipos JSON-safe.
- [ ] Gate `contracts` passa.

### T3: Planejar Persistencia

**What**: Criar schemas e repository para convites e claims.  
**Where**: `apps/api/src/modules/core/invitation/infrastructure/typeorm`  
**Requirement**: CORE-INVITATION-02

**Done when**:

- [ ] Token possui indice unico.
- [ ] Claims sao persistidos com ator e data.
- [ ] Testes cobrem expirado, reutilizavel e ja consumido.

### T4: Planejar Use Cases

**What**: Implementar criacao, validacao e consumo.  
**Where**: `apps/api/src/modules/core/invitation/application/use-cases`  
**Requirement**: CORE-INVITATION-01

**Done when**:

- [ ] Use cases usam dominio existente.
- [ ] Regras de expiracao/reuso estao cobertas.
- [ ] Consumo integra com membership conforme decisao T1.

### T5: Planejar Endpoints

**What**: Expor gerar, validar e consumir convites.  
**Where**: `apps/api/src/modules/core/invitation/invitation.controller.ts`, `invitation.module.ts`  
**Requirement**: CORE-INVITATION-03

**Done when**:

- [ ] Rotas e roles estao definidas.
- [ ] Swagger usa DTOs correspondentes.
- [ ] Gates `unit` e `build` passam.

