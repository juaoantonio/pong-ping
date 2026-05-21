# Pendencias Backend

Atualizado em: 2026-05-21

Escopo: `apps/api`

## Regra Obrigatoria Para Leitura De Dados

Consultas de leitura nao devem carregar as restricoes do dominio rico.

Para comandos, manter o padrao atual:

- Controller fino.
- DTO de comando.
- Use case de aplicacao.
- Agregado/value objects.
- Repository orientado ao dominio.
- Regras de negocio dentro do dominio.

Para consultas, adotar read side pragmatica:

- Queries podem ser altamente acopladas ao NestJS, TypeORM, SQL, QueryBuilder ou projections.
- Paginacao, filtros, ordenacao, joins, agregacoes e consultas simples podem retornar DTOs de leitura diretamente.
- Nao reconstruir agregados apenas para exibir dados.
- Nao forcar value objects em listagens, dashboards, rankings ou historicos.
- Garantir tenant scope, autorizacao e contrato de resposta, mesmo quando a query for acoplada ao ORM.
- Preferir arquivos separados para queries/read models quando a consulta crescer.

Esse padrao deve ser usado para liberar telas do frontend sem contaminar comandos com necessidades de exibicao.

## Estado Funcional

- API NestJS compila e roda com `AppModule`, config, logging, TypeORM, auth, tenancy, envelopes, Swagger/Scalar e health check.
- Identity system admin funciona no backend:
  - Login Google system admin.
  - Sessao system admin.
  - Logout system admin.
  - CRUD operacional de tenants.
  - CRUD operacional de memberships.
- Identity tenant funciona no backend:
  - Login Google tenant.
  - Sessao tenant.
  - Logout tenant.
  - Resolucao de tenant por host/slug.
- Integracao `identity` -> `core` existe:
  - Tenant criado/atualizado sincroniza `Club`.
  - Login de usuario tenant registra `Athlete` e cria `Rating` padrao.
- APIs tenant-scoped do modulo esportivo nao usam mais o prefixo publico `/core`; o prefixo global `/v1` permanece.
- `core` possui leitura implementada para:
  - Clube atual (`GET /club`).
  - Dashboard (`GET /dashboard`).
  - Mesas (`GET /tables`, `GET /tables/:tableId`).
  - Atletas (`GET /athletes/me`, `GET /athletes`).
  - Ratings (`GET /ratings`).
  - Jogos (`GET /games`, `GET /games/:gameRecordId`).
- `core` possui comandos implementados para:
  - Atualizar perfil de atleta.
  - Criar/renomear mesa.
  - Entrar/remover da fila.
  - Formar jogo ativo.
  - Rotacionar fila no modo winner-stays.
  - Registrar jogo.
  - Corrigir jogo.
  - Atualizar ratings ao registrar/corrigir jogo.
- Build e testes unitarios passam depois de buildar `packages/contracts`.

## Pendencias Prioritarias

- [x] Criar read APIs do `core` para a area do clube.
  - [x] Consultar dados do clube atual.
  - [x] Listar mesas do tenant atual.
  - [x] Consultar detalhe de mesa.
  - [x] Expor fila da mesa.
  - [x] Expor jogo ativo da mesa.
  - [x] Listar atletas do clube.
  - [x] Consultar perfil do atleta atual.
  - [x] Listar ranking/ratings do clube.
  - [x] Listar historico de jogos.
- [x] Definir padrao de pastas para read side.
  - Sugestao: `presentation/http/queries`, `presentation/http/read-models` ou `application/queries`, mantendo liberdade para TypeORM/SQL.
- [x] Implementar DTOs de resposta para consultas core.
  - [x] Reutilizar `packages/contracts` quando fizer sentido.
  - [x] Criar novos contratos para listagens, pagina e filtros.
- [x] Adicionar paginacao padrao para listagens.
  - [x] Mesas.
  - [x] Atletas.
  - [x] Jogos.
  - [x] Ranking.
- [x] Garantir tenant scope em todas as consultas core.
  - [x] Queries devem filtrar pelo tenant/clube atual.
  - [x] Evitar vazamento cross-tenant.
- [x] Criar endpoints de leitura para suportar o dashboard do clube.
  - [x] Resumo de mesas.
  - [x] Atletas ativos.
  - [x] Jogos recentes.
  - [x] Ranking resumido.

## Pendencias Do Core

- [x] `Club`
  - [x] Decidir se precisa API de leitura administrativa ou se continua somente sincronizado por identity.
    - Decisao: `identity.tenant` continua fonte administrativa; `core.club` permanece sincronizado para o dominio esportivo.
  - [x] Criar consulta interna/externa para dados do clube atual.
    - Implementado como `GET /club`, tenant-scoped, usando `ClubResponseContract`.
- [ ] `Athlete`
  - [x] Criar endpoint para atleta atual.
  - [x] Criar listagem de atletas do clube.
  - [ ] Validar se atualizacao de perfil deve restringir edicao ao proprio atleta ou admins.
- [ ] `Table`
  - [x] Criar queries para listagem e detalhe.
  - [ ] Avaliar concorrencia em operacoes de fila/jogo ativo.
  - [ ] Revisar autorizacao de remocao de atleta da fila e jogo ativo.
- [x] `Competition`
  - [x] Criar historico de jogos.
  - [x] Criar consulta de detalhe de jogo.
  - [x] Expor correcoes no historico.
- [ ] `Rating`
  - [x] Criar ranking do clube.
  - [x] Criar rating padrao ao registrar atleta.
  - [ ] Criar consulta de rating por atleta.
  - [ ] Validar comportamento de doubles: pareamento atual calcula deltas por indice entre lados.
- [ ] `Scoreboard`
  - [ ] Decidir persistencia ou estado transiente.
  - [ ] Criar application/use cases se entrar no fluxo real.
  - [ ] Criar API se o placar for operado pelo frontend.
- [ ] `Invitation`
  - [ ] Criar application layer.
  - [ ] Criar persistencia.
  - [ ] Criar endpoints para gerar/validar/consumir convites.

## Persistencia E Operacao

- [ ] Gerar migrations TypeORM reais.
- [ ] Definir politica para `DB_SYNCHRONIZE`.
  - Desenvolvimento local pode usar.
  - Ambientes compartilhados/producao devem usar migrations.
- [ ] Rodar e2e com Testcontainers em ambiente com Docker/runtime disponivel.
- [ ] Avaliar indices para read side.
  - `club_id` em mesas, atletas, ratings e jogos.
  - `table_id` e `finished_at` em historico de jogos.
  - campos usados em ordenacao de ranking.
- [ ] Resolver ergonomia do build de `@pong-ping/contracts`.
  - Hoje os testes da API dependem de `packages/contracts/dist`.
  - Avaliar build em pipeline ou alias para fonte em testes.

## Verificacao Atual

- [x] `pnpm --filter @pong-ping/contracts build`
- [x] `pnpm --filter @pong-ping/api test`
- [x] `pnpm --filter @pong-ping/api build`
- [x] `apps/frontend`: `vitest run`
- [x] `apps/frontend`: `vite build && tsc -b`
- [ ] `pnpm --filter @pong-ping/api test:e2e`
  - Bloqueado no ambiente atual por falta de runtime Docker/Testcontainers.
