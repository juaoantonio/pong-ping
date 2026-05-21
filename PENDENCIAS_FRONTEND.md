# Pendencias Frontend

Atualizado em: 2026-05-21

Escopo vigente: `apps/frontend`

Nota: Next.js e qualquer app Next legado nao devem guiar novas implementacoes. O frontend atual do produto e `apps/frontend`, com React, Vite, TanStack Router e TanStack Query.

## Estado Funcional

- App React/Vite compila.
- Rotas principais existem:
  - `/login`
  - `/admin/tenants`
  - `/admin/tenants/$tenantId/memberships`
  - `/club/login`
  - `/club`
- Area system admin funcional com API real:
  - Login Google admin.
  - Verificacao de sessao admin.
  - Logout admin.
  - Listagem de tenants.
  - Criacao de tenant.
  - Edicao de tenant.
  - Listagem de memberships.
  - Criacao/reativacao de membership.
  - Edicao de roles/status de membership.
  - Desativacao de membership.
- Area club possui:
  - Login Google tenant.
  - Verificacao de sessao tenant.
  - Logout tenant.
  - Layout autenticado.
  - Dashboard integrado ao `core`.
- Testes e build do frontend passam.

## Pendencias Prioritarias

- [x] Integrar a area club com o `core` da API.
  - [x] Criar client de API para core.
  - [x] Criar query keys separadas para mesas, atletas, ratings e jogos.
  - [x] Usar TanStack Query para leituras.
  - [x] Usar mutations para comandos.
- [x] Construir tela real de dashboard do clube.
  - [x] Resumo de mesas.
  - [x] Mesas com fila e jogo ativo.
  - [x] Jogos recentes.
  - [x] Ranking resumido.
  - [x] Estado vazio para clube sem dados.
- [x] Criar fluxo de mesas.
  - [x] Listar mesas.
  - [x] Criar mesa para admin do tenant.
  - [x] Renomear mesa para admin do tenant.
  - [x] Entrar na fila.
  - [x] Sair da fila.
  - [x] Formar jogo ativo.
  - [x] Remover atleta do jogo ativo.
  - [x] Rotacionar winner-stays.
- [x] Criar fluxo de jogos.
  - [x] Registrar vencedor.
  - [x] Mostrar confirmacao antes de gravar resultado.
  - [x] Exibir mudancas de rating apos registro.
  - [x] Permitir correcao para admins.
  - [x] Exibir historico.
- [x] Criar fluxo de atletas.
  - [x] Ver perfil do atleta atual.
  - [x] Editar perfil do atleta atual.
  - [x] Listar atletas do clube.
  - [x] Exibir dados tecnicos/equipamentos.
- [x] Criar ranking.
  - [x] Listar ratings do clube.
  - [x] Ordenar por pontos.
  - [x] Exibir vitorias, total de partidas e win rate.
  - [x] Estado vazio para atletas sem partidas.
  - [x] Backend cria rating padrao para novos atletas.

## Dependencias Do Backend

Estas telas dependem de read APIs ainda pendentes no backend:

- [x] `GET /core/tables`
- [x] `GET /core/tables/:tableId`
- [x] `GET /core/athletes/me`
- [x] `GET /core/athletes`
- [x] `GET /core/ratings`
- [x] `GET /core/games`
- [x] `GET /core/games/:gameRecordId`
- [x] `GET /core/dashboard`

Comandos ja existem no backend para varias acoes, mas ainda precisam ser consumidos pelo frontend:

- [x] `PATCH /core/athletes/:athleteId/profile`
- [x] `POST /core/tables`
- [x] `PATCH /core/tables/:tableId/name`
- [x] `POST /core/tables/:tableId/queue`
- [x] `DELETE /core/tables/:tableId/queue/:athleteId`
- [x] `DELETE /core/tables/:tableId/active-game/:athleteId`
- [x] `POST /core/tables/:tableId/active-game`
- [x] `POST /core/tables/:tableId/rotate-winner-stays`
- [x] `POST /core/tables/:tableId/games`
- [x] `POST /core/games/:gameRecordId/corrections`

## Produto E UX

- [x] Definir navegacao da area club alem do dashboard.
  - [x] Mesas.
  - [x] Ranking.
  - [x] Jogos.
  - [x] Atletas.
  - [x] Perfil.
- [x] Diferenciar permissoes no UI.
  - [x] Membro.
  - [x] Admin do tenant.
- [x] Tratar estados de carregamento, erro e vazio por fluxo.
- [ ] Padronizar mensagens de erro vindas da API.
- [ ] Validar responsividade das tabelas operacionais em mobile.
- [ ] Revisar bundle splitting.
  - Build atual passa, mas emite aviso de chunk JS maior que 500 kB.

## Fora De Escopo Atual

- [ ] Nao iniciar novas telas no Next.js legado.
- [ ] Nao duplicar fluxo entre Next.js legado e `apps/frontend`.
- [ ] Migrar ou remover referencias ao legado somente quando houver decisao explicita.

## Verificacao Atual

- [x] `pnpm --filter @pong-ping/frontend test`
- [x] `pnpm --filter @pong-ping/frontend build`
