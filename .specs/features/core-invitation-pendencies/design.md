# Core Invitation Pendencies Design

## Modelo

Manter dominio puro existente e adicionar camadas ao redor:

- `invitation/application/use-cases`
- `invitation/infrastructure/typeorm`
- `invitation/presentation/http`
- `invitation/invitation.controller.ts`
- `invitation/invitation.module.ts`

## Tipos De Convite

- `ClubInvite`: entrada no clube.
- `TableInvite`: entrada em uma mesa, possivelmente criando membership/queue conforme regra futura.

Decisao pendente: `TableInvite` deve apenas abrir mesa para usuario ja membro ou tambem conceder entrada no clube.

## Use Cases Propostos

- `CreateClubInviteUseCase`
- `CreateTableInviteUseCase`
- `ValidateInvitationUseCase`
- `ConsumeInvitationUseCase`

## Persistencia

Opcoes:

1. Tabela unica `invitations` com coluna `type` e campos opcionais `club_id`, `table_id`.
2. Tabela `invitations` + tabela `invitation_claims`.

Preferencia: duas tabelas. Claims crescem independentemente e tornam reutilizacao/auditoria mais claras.

## Rotas Propostas

- `POST /core/invitations/club`
- `POST /core/tables/:tableId/invitations`
- `GET /core/invitations/:token`
- `POST /core/invitations/:token/consume`

## Autorizacao

- Gerar convite: `ADMIN`.
- Validar convite: autenticado ou publico, a definir conforme tela de entrada.
- Consumir convite: usuario autenticado. Se consumo deve criar membership identity, precisa integrar com modulo `identity`.

## Integracao Com Identity

Consumo de convite de clube provavelmente pertence a uma fronteira entre identity membership e core athlete. Antes de implementar, definir se:

- Convite core apenas valida e identity cria membership.
- Convite core consome e dispara comando/evento para identity.
- Convite fica em identity, e core remove esse subdominio.

