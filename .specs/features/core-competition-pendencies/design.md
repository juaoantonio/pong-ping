# Core Competition Pendencies Design

## Direcao

Nao criar nova implementacao para `Competition` neste momento. O topico atua como artefato de controle: preservar comportamento concluido e isolar mudancas futuras que venham da decisao de `Rating`.

## Componentes Existentes

- `CompetitionCommandController`
- `CompetitionReadController`
- `GameReadQuery`
- `RecordGameUseCase`
- `CorrectGameUseCase`
- `GameRecordRepository`
- `GameRecordSchema`

## Dependencia Com Rating

`RecordGameUseCase` calcula deltas com base em pares de indices entre lado vencedor e perdedor. A decisao sobre doubles deve acontecer em `.specs/features/core-rating-pendencies`.

Se a decisao exigir novo algoritmo:

- Ajustar o calculo em `RecordGameUseCase` ou extrair policy/servico de pareamento.
- Preservar contrato de `GameRecordResponseContract`.
- Atualizar testes de competicao e rating juntos.

## Verificacao Recomendada

- Historico inclui registros originais e correcoes.
- Detalhe por id respeita tenant atual.
- Correcao cria registro compensatorio sem sobrescrever historico.

