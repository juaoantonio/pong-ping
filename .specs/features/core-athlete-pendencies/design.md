# Core Athlete Pendencies Design

## Direcao Implementada

Adotar a regra conservadora:

- Usuario tenant pode atualizar somente o proprio perfil.
- `ADMIN` nao possui privilegio para editar perfil de outro atleta.
- Qualquer usuario tentando editar terceiro recebe HTTP 403.
- Alvo inexistente ou fora do tenant atual recebe `athlete_not_found`.

## Componentes

- `AthleteCommandController`
  - Continua expondo `PATCH /core/athletes/:athleteId/profile`.
  - Usa `CurrentContextService` e `CoreIdentityTranslator` para identificar o ator.
  - Usa `AthleteRepository.findByUserId(actorId)` para descobrir o atleta atual.
  - Bloqueia quando o atleta atual nao e o atleta alvo.
- `UpdateAthleteProfileUseCase`
  - Recebe `clubId` obrigatorio.
  - Rejeita atleta fora do tenant atual antes de alterar o agregado.
  - Autorizacao de dono do perfil fica no controller.

## Politica

| Ator | Alvo | Resultado |
| --- | --- | --- |
| MEMBER | proprio atleta | Permitir |
| MEMBER | outro atleta | Forbidden |
| ADMIN | proprio atleta | Permitir |
| ADMIN | outro atleta | Forbidden |
| Sem atleta vinculado | qualquer alvo | Not found ou forbidden conforme padrao atual |

## Tenant Scope

O use case recebe `clubId` do tenant atual e compara com `athlete.clubId`. Isso impede edicao cross-tenant mesmo se algum caller contornar a policy do controller.
