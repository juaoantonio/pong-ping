# Core Athlete Pendencies Specification

## Fonte

- `PENDENCIAS_BACKEND.md` atualizado em 2026-05-20.
- TaApico: `Pendencias Do Core` > `Athlete`.

## Estado Atual

- Endpoint de atleta atual e listagem de atletas do clube ja existem.
- `AthleteCommandController` permite `PATCH /athletes/:athleteId/profile` para `MEMBER` e `ADMIN`.
- Usuario tenant pode editar somente o proprio atleta.
- `ADMIN` nao possui privilegio para editar perfil de outro atleta.
- `UpdateAthleteProfileUseCase` recebe `clubId` e rejeita alvo fora do tenant atual.

## Problema

A politica de atualizacao de perfil precisava impedir que qualquer usuario editasse atletas de terceiros e que o endpoint alterasse atleta de outro tenant.

## Objetivos

- [x] Definir politica de autorizacao para edicao de perfil.
- [x] Garantir que usuario tenant edite somente o proprio atleta.
- [x] Bloquear admin editando perfil de outro atleta.
- [x] Cobrir a politica com testes unitarios de controller/use case.

## Fora De Escopo

- Criar novos campos de perfil.
- Alterar o registro automatico de atleta no login tenant.
- Criar fluxo de moderacao de perfis.

## Requisitos

### CORE-ATHLETE-01: Politica De Edicao De Perfil

**Como** mantenedor do clube, **quero** uma regra clara de quem pode editar perfis, **para** impedir alteracoes indevidas de atletas.

**Critaorios de aceite**:

1. A politica permite que usuario tenant edite somente o proprio atleta.
2. A politica define que admin nao edita perfil de outro atleta.
3. Tentativas de editar terceiro retornam forbidden.
4. A decisao aparece no spec/design.

### CORE-ATHLETE-02: Enforcement No Endpoint

**Como** usuario do clube, **quero** que a API bloqueie edicoes sem permissao, **para** manter integridade dos perfis.

**Critaorios de aceite**:

1. O controller identifica o atleta atual pelo principal autenticado quando necessario.
2. Edicao de terceiro por membro comum retorna forbidden.
3. Edicao de terceiro por admin retorna forbidden.
4. Os testes cobrem proprio perfil, terceiro como membro e terceiro como admin.

## Traceabilidade

| ID | Origem em `PENDENCIAS_BACKEND.md` | Status inicial |
| --- | --- | --- |
| CORE-ATHLETE-01 | Validar se atualizacao de perfil deve restringir edicao ao proprio atleta ou admins | Concluido |
| CORE-ATHLETE-02 | Validar enforcement correspondente no endpoint | Concluido |
