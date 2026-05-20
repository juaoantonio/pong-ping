# Core Table Pendencies Design

## Concorrencia

### Opcao Preferida

Executar comandos de mesa que alteram fila/jogo ativo dentro de transacao com lock pessimista na linha da mesa e nas relacoes carregadas.

Motivo: o agregado `Table` concentra fila e jogo ativo; comandos concorrentes precisam observar um unico estado serializado antes de salvar.

### Componentes Provaveis

- `TableRepository.transaction(...)` ou metodo especifico como `withLockedTable(tableId, callback)`.
- `TableRepository.findByIdForUpdate(...)`.
- Use cases de mesa passam a executar dentro dessa unidade transacional.

### Alternativa

Adicionar coluna de versao e tratar conflito por optimistic locking. Menos bloqueante, mas exige retry ou resposta de conflito para UX.

## Autorizacao

Regra proposta:

- Remocao da fila:
  - Membro remove somente a si mesmo.
  - Admin remove qualquer atleta do tenant atual.
- Remocao do jogo ativo:
  - Membro remove somente a si mesmo, se produto aceitar abandono.
  - Admin remove qualquer atleta.

## Tenant Scope

Os comandos atuais recebem `tableId` e `athleteId`. Para evitar cross-tenant:

- O controller deve obter `tenant.id`.
- O repositorio/use case deve garantir que a mesa pertence ao tenant atual.
- A autorizacao de admin/membro deve ser aplicada antes da mutacao.

## Testes De Risco

- Dois enqueues simultaneos do mesmo atleta.
- Formar jogo enquanto outro comando remove atleta da fila.
- Rotacionar winner-stays enquanto outro comando remove atleta do jogo ativo.
- Membro tentando remover outro atleta.

