# Core Competition Pendencies Specification

## Fonte

- `PENDENCIAS_BACKEND.md` atualizado em 2026-05-20.
- TaApico: `Pendencias Do Core` > `Competition`.

## Estado Atual

- Historico de jogos existe.
- Consulta de detalhe de jogo existe.
- Correcoes aparecem no historico.
- Comandos de registrar e corrigir jogo existem e atualizam ratings.

## Problema

As pendencias explicitamente listadas para `Competition` estao marcadas como concluidas. Ainda assim, antes de implementar proximos itens que dependem de competicao, o backend precisa preservar os contratos atuais e registrar que nao ha pendencia funcional aberta nesse topico.

## Objetivos

- [x] Registrar status de conclusao das pendencias de `Competition`.
- [ ] Manter uma trilha de verificacao para evitar regressao em historico, detalhe e correcoes.
- [ ] Documentar dependencia com `Rating`, pois o comportamento de doubles ainda esta pendente no topico de ratings.

## Fora De Escopo

- Criar novas regras de competicao.
- Alterar calculo de rating.
- Criar filtros adicionais de historico sem demanda de produto.

## Requisitos

### CORE-COMPETITION-01: Preservar Historico E Detalhe

**Como** frontend do clube, **quero** continuar consultando historico e detalhe de jogos, **para** exibir partidas e correcoes sem regressao.

**Critaorios de aceite**:

1. `GET /core/games` permanece tenant-scoped e paginado.
2. `GET /core/games/:gameRecordId` permanece tenant-scoped.
3. Correcoes continuam representadas no retorno de historico/detalhe.

### CORE-COMPETITION-02: Registrar Dependencia De Rating

**Como** mantenedor, **quero** explicitar que doubles depende de decisao de rating, **para** evitar corrigir competicao no lugar errado.

**Critaorios de aceite**:

1. O spec aponta `core-rating-pendencies` como dono da decisao de pareamento/delta.
2. Tarefas de competicao so mudam se a decisao de rating exigir ajuste no registro de jogo.

## Traceabilidade

| ID | Origem em `PENDENCIAS_BACKEND.md` | Status inicial |
| --- | --- | --- |
| CORE-COMPETITION-01 | Criar historico, detalhe e expor correcoes | Concluido, manter verificacao |
| CORE-COMPETITION-02 | Dependencia com comportamento de doubles em Rating | Derivado |

