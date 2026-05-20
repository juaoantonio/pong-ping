# Core Club Pendencies Design

## Direcao Proposta

Manter `identity.tenant` como fonte administrativa primaaria. Tratar `core.club` como boundary de domaAnio do jogo, sincronizado por eventos de identity. Expor apenas leitura tenant-scoped do clube atual se houver necessidade do frontend do clube.

## Componentes

- `apps/api/src/modules/core/club/presentation/http/queries/club-read.query.ts`
  - Read side pragmaatica com TypeORM.
  - Busca `ClubSchema` por `id = tenantId`.
- `apps/api/src/modules/core/club/club-read.controller.ts`
  - `GET /core/club`
  - Requer tenant member/admin.
  - Retorna contrato de leitura do clube atual.
- `packages/contracts/src/core.ts`
  - Reutilizar `ClubResponseContract` se os campos atuais forem suficientes.

## Autorizacao

- Leitura: `MEMBER` ou `ADMIN`.
- Comandos administrativos Core: naeo implementar atao a decisaeo de ownership confirmar necessidade. Hoje essas alteraaCaEes jaa chegam pela integraaCaeo com `identity`.

## Contratos

Preferauncia:

- `ClubResponseContract` para `id`, `name`, `slug`, `active`, `createdAt`.

Criar contrato novo apenas se o frontend precisar de um shape mais restrito, por exemplo `CurrentClubReadContract`.

## Riscos

- Duplicar administraaCaeo de tenant e club pode gerar divergauncia.
- Expor comandos Core para clube atual sem resolver ownership pode burlar regras do system admin.
- Falha de sincronizaaCaeo identity -> core deve aparecer como 404/estado inconsistente, naeo como criaaCaeo implaAcita pela read API.

