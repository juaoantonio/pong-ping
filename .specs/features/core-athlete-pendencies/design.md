# Core Athlete Pendencies Design

## Direcao Proposta

Adotar a regra conservadora:

- `MEMBER`: pode atualizar somente o proprio perfil.
- `ADMIN`: pode atualizar qualquer atleta do tenant atual.

A decisao final ainda precisa ser confirmada antes da implementacao, mas esse desenho reduz risco de alteracao indevida.

## Componentes

- `AthleteCommandController`
  - Continua expondo `PATCH /core/athletes/:athleteId/profile`.
  - Usa `CurrentContextService` e `CoreIdentityTranslator` para identificar o ator.
  - Usa `AthleteRepository.findByUserId(actorId)` para descobrir o atleta atual.
  - Verifica role tenant atual antes de permitir edicao de terceiros.
- `UpdateAthleteProfileUseCase`
  - Pode continuar focado na alteracao do agregado.
  - Autorizacao fica no delivery/application policy, nao no dominio.

## Politica

| Ator | Alvo | Resultado |
| --- | --- | --- |
| MEMBER | proprio atleta | Permitir |
| MEMBER | outro atleta | Forbidden |
| ADMIN | atleta do tenant atual | Permitir |
| Sem atleta vinculado | qualquer alvo | Not found ou forbidden conforme padrao atual |

## Risco De Tenant Scope

O use case atual busca por `athleteId` sem receber `clubId`. Para impedir cross-tenant, a camada de autorizacao precisa validar que o atleta alvo pertence ao tenant atual antes de chamar ou antes de retornar sucesso. Alternativas:

- Adicionar metodo de read/check no `AthleteRepository` para buscar por id e club.
- Carregar alvo no controller e comparar `clubId`.
- Evoluir o use case para receber `clubId` e rejeitar alvo fora do clube.

Preferencia: evoluir o use case para aceitar `clubId` opcional/obrigatorio em comandos HTTP, mantendo regra proxima da operacao.

