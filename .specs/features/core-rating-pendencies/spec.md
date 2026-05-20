# Core Rating Pendencies Specification

## Fonte

- `PENDENCIAS_BACKEND.md` atualizado em 2026-05-20.
- TaApico: `Pendencias Do Core` > `Rating`.

## Estado Atual

- Ranking do clube existe.
- `RatingReadQuery` lista ratings paginados por clube.
- `RecordGameUseCase` atualiza ratings.
- Em doubles, o calculo atual pareia vencedor e perdedor por indice entre os lados.

## Problema

Falta consulta de rating por atleta e falta validar se o pareamento por indice em doubles representa a regra desejada de pontuacao. Sem isso, o frontend nao tem detalhe individual simples e partidas doubles podem atualizar rating com semantica incorreta.

## Objetivos

- [ ] Criar consulta de rating por atleta.
- [ ] Validar comportamento de doubles no calculo de deltas.
- [ ] Documentar algoritmo escolhido para doubles.
- [ ] Preservar ranking existente.

## Fora De Escopo

- Criar seasons/temporadas.
- Criar tiers reais, salvo se necessario para contrato existente.
- Reprocessar historico antigo.

## Requisitos

### CORE-RATING-01: Consulta De Rating Por Atleta

**Como** atleta, **quero** consultar meu rating individual, **para** ver pontos, vitorias, partidas e win rate.

**Critaorios de aceite**:

1. Endpoint retorna rating do atleta no tenant atual.
2. Endpoint impede consulta cross-tenant.
3. Retorno reutiliza `RatingReadContract` quando possivel.
4. Quando rating ainda nao existir, comportamento e definido: criar leitura default ou retornar 404.

### CORE-RATING-02: Regra De Doubles

**Como** mantenedor do ranking, **quero** definir como doubles afeta ratings, **para** calcular deltas justos e previsiveis.

**Critaorios de aceite**:

1. A decisao confirma pareamento por indice ou define outro algoritmo.
2. A decisao cobre times de dois atletas por lado.
3. Testes unitarios cobrem doubles com ordem diferente de atletas.
4. `GameRecordResponseContract` continua representando deltas por atleta.

## Traceabilidade

| ID | Origem em `PENDENCIAS_BACKEND.md` | Status inicial |
| --- | --- | --- |
| CORE-RATING-01 | Criar consulta de rating por atleta | Pendente |
| CORE-RATING-02 | Validar comportamento de doubles: pareamento atual calcula deltas por indice entre lados | Pendente |

