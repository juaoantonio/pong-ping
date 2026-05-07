# Fundação DDD Rica Para apps/api

## Summary

Criar a fundação física dos contextos em apps/api/src/modules, sem controllers/endpoints e sem migration nesta etapa. O domínio será rico, persistível diretamente pelo TypeORM via EntitySchema, sem decorators nas entidades,
sem entidades ORM paralelas e sem interfaces de repositório.

## Key Changes

- Criar módulos NestJS por contexto:
    - identity: User, roles, email/autenticação pragmática; permitido ser mais framework-oriented por ser subdomínio genérico.
    - clubs: Club como limite de posse dos dados, com ClubName e ClubSlug.
    - athletes: Athlete como pessoa esportiva, separada de User, com perfil técnico/equipamento.
    - tables: Table, TableMember, TableQueue, QueueEntry, PlayMode, ActiveGame, GameSide.
    - competition: GameRecord e GameCorrection, com resultado por lados do jogo.
    - ratings: Rating, Tier, ClubLadder, cálculo Elo e ordenação escopada por clube.
    - invitations: ClubInvite e TableInvite, com política de expiração/uso único.
    - scoreboard: Scoreboard separado de GameRecord, apenas para pontos ao vivo.
- Cada contexto terá a estrutura:
    - domain/entities
    - domain/value-objects
    - domain/services
    - infra/typeorm/schemas
    - application/use-cases apenas como pasta preparada; sem portar fluxos completos agora.
- Registrar schemas com TypeOrmModule.forFeature([...Schemas]) em cada módulo e importar os módulos no AppModule.
- Ajustar apps/api/data-source.ts para localizar EntitySchema em src/modules/**/infra/typeorm/schemas/*.schema.ts, sem gerar migration.
- Remover dependência do BaseAuditEntity com decorators para novos domínios; criar um helper de schema para colunas comuns (id, createdAt, updatedAt) usando EntitySchemaColumnOptions.

## Domain Modeling

- Entidades terão identidade imutável, estado privado/protegido e métodos da linguagem ubíqua, como Club.rename, Table.enqueueAthlete, Table.removeFromQueue, Table.formActiveGame, Table.rotateWinnerStays, GameRecord.correct,
  Rating.recordWinAgainst, Scoreboard.pointForSide.
- VOs encapsularão primitivas importantes: ClubId, AthleteId, TableId, UserId, Email, ClubSlug, TableName, QueuePosition, RatingPoints, GameSide, ScorePoints, InvitationToken, ExpirationDate.
- Domain Services ficarão só onde há consulta externa ou coordenação entre agregados: unicidade de ClubSlug, tradução User -> Athlete, entrada em mesa com consulta de membro existente, finalização/correção de jogo envolvendo
  fila + ratings + registro.
- Agregados referenciam outros agregados por ID, não por objeto. User não vira jogador no domínio esportivo; use cases traduzirão para AthleteId.

## Test Plan

- Adicionar testes unitários de domínio para:
    - formação de ActiveGame em simples com duas primeiras entradas;
    - formato futuro de duplas com dois atletas por lado;
    - rotação “vencedor fica”;
    - bloqueio de atleta duplicado na fila;
    - GameCorrection compensatória sem apagar GameRecord;
    - Rating com Elo, vitórias, total de jogos e win rate;
    - ranking sempre escopado por Club;
    - Scoreboard não criando nem alterando GameRecord.
- Adicionar teste de wiring NestJS para compilar AppModule com os novos módulos e schemas.
- Rodar pnpm --filter @pong-ping/api test e pnpm --filter @pong-ping/api build.

## Assumptions

- Escopo escolhido: “Só fundação”.
- Persistência escolhida: “Schemas apenas”, então não será criada migration agora.
- Os contratos antigos em packages/api-contracts e endpoints do apps/web não serão portados nesta etapa.
- Nomes legados como Tenant, Participant, Round, Rollback, PlayerRanking não serão usados nos novos módulos de domínio esportivo.
- O domínio de identity pode ser mais orientado a framework, mas os outros domínios esportivos (tênis de mesa) devem ser ricos e expressivos.