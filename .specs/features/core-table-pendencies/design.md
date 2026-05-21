# Core Table Pendencies Design

## Concorrencia

### Opcao Preferida

Executar comandos de mesa que alteram fila/jogo ativo dentro de transacao com lock pessimista na linha da mesa e nas relacoes carregadas.

Motivo: o agregado `Table` concentra fila e jogo ativo; comandos concorrentes precisam observar um unico estado serializado antes de salvar.

### Componentes Provaveis

- `TableRepository.withLockedTable(clubId, tableId, callback)`.
- `TableRepository.findByIdForClub(...)` para consultas tenant-scoped de comando.
- Use cases de mesa executam dentro dessa unidade transacional quando alteram ou dependem da fila/jogo ativo.

### Implementado

- Estrategia selecionada: transacao TypeORM com `pessimistic_write` na linha de `tables`.
- Comandos cobertos: renomear, entrar na fila, remover da fila, formar jogo ativo, remover do jogo ativo e rotacionar winner-stays.
- Resposta para concorrencia: comandos concorrentes sobre a mesma mesa sao serializados pelo banco; conflitos de regra apos o lock retornam erro de dominio existente.

### Alternativa

Adicionar coluna de versao e tratar conflito por optimistic locking. Menos bloqueante, mas exige retry ou resposta de conflito para UX.

## Autorizacao

Regra proposta:

- Remocao da fila:
  - Membro remove somente a si mesmo.
  - Admin remove qualquer atleta do tenant atual.
- Remocao do jogo ativo:
  - Membro remove somente a si mesmo.
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
