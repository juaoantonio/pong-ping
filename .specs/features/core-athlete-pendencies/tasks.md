# Core Athlete Pendencies Tasks

**Status**: Implementado  
**Escopo**: implementacao concluida

## Gate Check Commands

| Gate | Command | Notes |
| --- | --- | --- |
| unit | `pnpm --filter @pong-ping/api test` | Politica, controller e use case. |
| build | `pnpm --filter @pong-ping/api build` | Wiring e tipos. |

## Tarefas

### T1: Confirmar Politica De Perfil

**What**: Registrar a regra final para edicao de perfil por membro/admin.  
**Where**: `.specs/features/core-athlete-pendencies/spec.md`  
**Requirement**: CORE-ATHLETE-01

**Done when**:

- [x] Regra de membro comum esta definida.
- [x] Regra de admin esta definida.
- [x] Resposta esperada para tentativa proibida esta definida.

### T2: Planejar Tenant Scope Do Use Case

**What**: Definir se `UpdateAthleteProfileUseCase` recebe `clubId` ou se controller valida tenant do alvo.  
**Where**: `apps/api/src/modules/core/athlete/application/use-cases/update-athlete-profile.use-case.ts`  
**Requirement**: CORE-ATHLETE-02

**Done when**:

- [x] Nao ha caminho para editar atleta de outro tenant pelo endpoint HTTP.
- [x] Teste cobre atleta alvo fora do tenant atual.

### T3: Planejar Enforcement No Controller

**What**: Identificar atleta atual e role para permitir ou negar edicao.  
**Where**: `apps/api/src/modules/core/athlete/athlete-command.controller.ts`  
**Requirement**: CORE-ATHLETE-02

**Done when**:

- [x] Membro edita proprio perfil com sucesso.
- [x] Membro editando terceiro recebe forbidden.
- [x] Admin editando terceiro recebe forbidden.
- [x] Gates `unit` e `build` passam.
