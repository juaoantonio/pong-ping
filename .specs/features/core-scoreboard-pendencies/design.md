# Core Scoreboard Pendencies Design

## Opcoes De Estado

### Opcao A: Transiente No Frontend

- Backend nao persiste nem opera placar.
- Scoreboard domain pode ser removido ou mantido para futuro.
- Menor custo agora.
- Nao sincroniza multiplos dispositivos.

### Opcao B: Transiente No Backend

- Backend mantem estado em memoria/cache por mesa.
- Exige estrategia para restart e expiracao.
- Pode suportar sincronizacao simples.

### Opcao C: Persistido

- Criar schema/repository para placar atual por mesa/jogo ativo.
- Melhor para recuperacao e auditoria simples.
- Exige concorrencia e lifecycle claros.

Preferencia tecnica: nao persistir ate haver necessidade de sincronizacao multi-dispositivo. Se o frontend precisa operar placar compartilhado, preferir persistencia simples por mesa para evitar perda em restart.

## Componentes Se Backend Controlar

- `scoreboard/application/use-cases/get-current-scoreboard.use-case.ts`
- `scoreboard/application/use-cases/point-scoreboard.use-case.ts`
- `scoreboard/application/use-cases/undo-scoreboard-point.use-case.ts`
- `scoreboard/application/use-cases/reset-scoreboard.use-case.ts`
- `scoreboard/infrastructure/typeorm/schemas/scoreboard.schema.ts` se persistido.
- `scoreboard/scoreboard.controller.ts`
- Contratos em `packages/contracts/src/core.ts`.

## Rotas Possiveis

- `GET /core/tables/:tableId/scoreboard`
- `POST /core/tables/:tableId/scoreboard/first-side/point`
- `POST /core/tables/:tableId/scoreboard/second-side/point`
- `POST /core/tables/:tableId/scoreboard/first-side/undo`
- `POST /core/tables/:tableId/scoreboard/second-side/undo`
- `POST /core/tables/:tableId/scoreboard/reset`

## Riscos

- Sem realtime, dois clientes podem operar com estado visual defasado.
- Com estado persistido, comandos precisam lock/versionamento como mesa.
- O placar nao deve registrar resultado de jogo por si so; registro continua em `Competition`.

