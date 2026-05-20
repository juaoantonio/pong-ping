# Core Athlete Pendencies Specification

## Fonte

- `PENDENCIAS_BACKEND.md` atualizado em 2026-05-20.
- TaApico: `Pendencias Do Core` > `Athlete`.

## Estado Atual

- Endpoint de atleta atual e listagem de atletas do clube ja existem.
- `AthleteCommandController` permite `PATCH /core/athletes/:athleteId/profile` para `MEMBER` e `ADMIN`.
- O use case `UpdateAthleteProfileUseCase` recebe apenas `athleteId`, `displayName` e `profile`; ele nao recebe ator atual nem role.

## Problema

A atualizacao de perfil ainda nao define se qualquer membro pode editar qualquer atleta, se somente admins podem editar terceiros, ou se membro comum so pode editar o proprio perfil. O endpoint atual aceita `athleteId` arbitrario para qualquer membro autenticado.

## Objetivos

- [ ] Definir politica de autorizacao para edicao de perfil.
- [ ] Garantir que membro comum edite somente o proprio atleta, se essa for a regra escolhida.
- [ ] Preservar capacidade administrativa para editar atletas de terceiros, se confirmada.
- [ ] Cobrir a politica com testes unitarios de controller/use case.

## Fora De Escopo

- Criar novos campos de perfil.
- Alterar o registro automatico de atleta no login tenant.
- Criar fluxo de moderacao de perfis.

## Requisitos

### CORE-ATHLETE-01: Politica De Edicao De Perfil

**Como** mantenedor do clube, **quero** uma regra clara de quem pode editar perfis, **para** impedir alteracoes indevidas de atletas.

**Critaorios de aceite**:

1. A politica distingue membro comum e admin.
2. A politica define se membro comum pode editar somente o proprio atleta.
3. A politica define se admin pode editar qualquer atleta do tenant atual.
4. A decisao aparece no spec/design antes da implementacao.

### CORE-ATHLETE-02: Enforcement No Endpoint

**Como** usuario do clube, **quero** que a API bloqueie edicoes sem permissao, **para** manter integridade dos perfis.

**Critaorios de aceite**:

1. O controller identifica o atleta atual pelo principal autenticado quando necessario.
2. Edicao de terceiro por membro comum retorna forbidden.
3. Edicao administrativa continua tenant-scoped.
4. Os testes cobrem proprio perfil, terceiro como membro e terceiro como admin.

## Traceabilidade

| ID | Origem em `PENDENCIAS_BACKEND.md` | Status inicial |
| --- | --- | --- |
| CORE-ATHLETE-01 | Validar se atualizacao de perfil deve restringir edicao ao proprio atleta ou admins | Pendente |
| CORE-ATHLETE-02 | Validar enforcement correspondente no endpoint | Derivado |

