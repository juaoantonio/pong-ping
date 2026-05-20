# Core Table Pendencies Specification

## Fonte

- `PENDENCIAS_BACKEND.md` atualizado em 2026-05-20.
- TaApico: `Pendencias Do Core` > `Table`.

## Estado Atual

- Queries de listagem e detalhe existem.
- Comandos existem para criar/renomear mesa, entrar/remover da fila, formar jogo ativo, remover do jogo ativo e rotacionar winner-stays.
- `TableCommandController` exige admin para criar/renomear, mas comandos de fila/jogo ativo aceitam member/admin.
- `TableRepository` usa `findOneBy` e `save` simples, sem lock explicito.

## Problema

Operacoes de fila e jogo ativo podem sofrer race conditions se dois comandos modificarem a mesma mesa simultaneamente. Alem disso, a autorizacao de remover outro atleta da fila ou do jogo ativo ainda nao esta revisada.

## Objetivos

- [ ] Avaliar concorrencia em operacoes de fila e jogo ativo.
- [ ] Definir estrategia de lock/transacao/versionamento para comandos de mesa.
- [ ] Revisar autorizacao para remover atleta da fila.
- [ ] Revisar autorizacao para remover atleta do jogo ativo.

## Fora De Escopo

- Alterar regra de formacao de jogo sem bug confirmado.
- Reescrever o agregado `Table`.
- Criar realtime/websocket para fila.

## Requisitos

### CORE-TABLE-01: Concorrencia Em Comandos De Mesa

**Como** backend, **quero** serializar ou detectar atualizacoes concorrentes na mesa, **para** preservar fila e jogo ativo consistentes.

**Critaorios de aceite**:

1. A estrategia cobre enqueue, remove queue, form active game, remove active game e rotate winner-stays.
2. A estrategia define se usa transacao com lock pessimista, optimistic lock/version column ou retry.
3. Testes cobrem pelo menos um conflito representativo.

### CORE-TABLE-02: Autorizacao De Remocao Da Fila

**Como** atleta, **quero** que somente eu ou um admin possa me remover da fila, **para** impedir remocoes indevidas por outros membros.

**Critaorios de aceite**:

1. Membro pode remover a si mesmo da fila.
2. Membro nao pode remover outro atleta.
3. Admin pode remover qualquer atleta do tenant atual.

### CORE-TABLE-03: Autorizacao De Remocao Do Jogo Ativo

**Como** operador do clube, **quero** controlar remocao de atleta do jogo ativo, **para** evitar manipulacao indevida de partidas em andamento.

**Critaorios de aceite**:

1. A regra define se jogador pode remover a si mesmo do jogo ativo.
2. A regra define se apenas admin pode remover terceiros.
3. A implementacao preserva tenant scope.

## Traceabilidade

| ID | Origem em `PENDENCIAS_BACKEND.md` | Status inicial |
| --- | --- | --- |
| CORE-TABLE-01 | Avaliar concorrencia em operacoes de fila/jogo ativo | Pendente |
| CORE-TABLE-02 | Revisar autorizacao de remocao de atleta da fila | Pendente |
| CORE-TABLE-03 | Revisar autorizacao de remocao de atleta do jogo ativo | Pendente |

