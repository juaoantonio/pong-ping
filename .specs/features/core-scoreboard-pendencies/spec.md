# Core Scoreboard Pendencies Specification

## Fonte

- `PENDENCIAS_BACKEND.md` atualizado em 2026-05-20.
- TaApico: `Pendencias Do Core` > `Scoreboard`.

## Estado Atual

- Existe domaAnio puro de `Scoreboard`, com pontos por lado, undo e reset.
- Nao existe application layer, persistencia, controller ou contrato HTTP.
- O placar ainda nao esta integrado ao fluxo real de mesa/jogo.

## Problema

O projeto ainda nao decidiu se placar e estado transiente do frontend ou estado persistido/operado pelo backend. Essa decisao afeta modelagem, APIs, concorrencia, realtime e relacao com `ActiveGame`.

## Objetivos

- [ ] Decidir persistencia ou estado transiente.
- [ ] Criar application/use cases se o placar entrar no fluxo real.
- [ ] Criar API se o placar for operado pelo frontend via backend.
- [ ] Definir relacao entre placar, mesa e jogo ativo.

## Fora De Escopo

- Websocket/realtime completo, salvo se decisao de produto exigir.
- Historico ponto a ponto.
- Regras oficiais de sets/partidas alem do contador atual.

## Requisitos

### CORE-SCOREBOARD-01: Decisao De Estado

**Como** time de produto/engenharia, **quero** decidir onde o placar vive, **para** evitar persistencia desnecessaria ou perda de estado importante.

**Critaorios de aceite**:

1. A decisao escolhe transiente frontend, transiente backend ou persistido.
2. A decisao descreve o que acontece ao formar novo jogo ativo.
3. A decisao descreve o que acontece ao registrar jogo.

### CORE-SCOREBOARD-02: Use Cases Do Placar

**Como** operador do placar, **quero** pontuar, desfazer e resetar, **para** controlar o jogo em andamento.

**Critaorios de aceite**:

1. Use cases existem apenas se backend operar placar.
2. Use cases validam que o placar pertence ao jogo ativo da mesa.
3. Comandos respeitam tenant scope e autorizacao.

### CORE-SCOREBOARD-03: API Do Placar

**Como** frontend, **quero** uma API de placar se o backend for fonte de estado, **para** sincronizar operacoes entre usuarios.

**Critaorios de aceite**:

1. API expaEe leitura do placar atual por mesa.
2. API expaEe ponto, undo e reset se backend controlar comandos.
3. Respostas usam contratos JSON-safe.

## Traceabilidade

| ID | Origem em `PENDENCIAS_BACKEND.md` | Status inicial |
| --- | --- | --- |
| CORE-SCOREBOARD-01 | Decidir persistencia ou estado transiente | Pendente |
| CORE-SCOREBOARD-02 | Criar application/use cases se entrar no fluxo real | Pendente |
| CORE-SCOREBOARD-03 | Criar API se o placar for operado pelo frontend | Pendente |

