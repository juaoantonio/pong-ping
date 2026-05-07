# Contexto de Domínio

Este documento é a referência canônica de linguagem ubíqua do domínio de tênis de mesa do Pong Ping. A linguagem canônica é em português; o código pode usar nomes em inglês quando necessário, mas deve preservar o significado definido aqui.

Durante a migração para NestJS, estes termos têm prioridade sobre nomes antigos do app Next.js e sobre contratos públicos existentes. Se um contrato antigo usar uma palavra ambígua, prefira corrigir o nome para o termo preciso em vez de manter compatibilidade por conveniência.

## Princípios

- O domínio é organizado em torno de clubes, atletas, mesas, filas, jogos, registros, pontuações e rankings.
- `Usuário` pertence ao contexto de autenticação e identidade. No domínio esportivo, a pessoa que joga é sempre `Atleta`.
- `Clube` é o limite de posse dos dados do domínio. Não use `Tenant` na linguagem de domínio.
- `Mesa` é o contexto jogável onde atletas se reúnem e entram em ordem de jogo. Não use `Room`, `Court` ou `Arena` para esse conceito.
- `Placar` é somente a exibição e o controle ao vivo dos pontos. Ele não cria, possui nem substitui `Registro de Jogo`.

## Glossário

| Termo canônico | Nome em código | Definição | Evitar |
| --- | --- | --- | --- |
| Clube | `Club` | Dono e limite do domínio para atletas, mesas, convites, pontuações e ranking. | `Tenant` |
| Atleta | `Athlete` | Pessoa do domínio esportivo que joga partidas e aparece no ranking. | `Player`, `User` com sentido esportivo |
| Usuário | `User` | Identidade de autenticação e conta. Deve ser traduzido para `Atleta` ao entrar no domínio esportivo. | Usar `User` como jogador |
| Mesa | `Table` | Contexto jogável onde atletas se reúnem, entram na fila e formam jogos. | `Room`, `Court`, `Arena` |
| Membro da Mesa | `TableMember` | Relação persistente de acesso ou elenco entre um atleta e uma mesa. | Participante temporário |
| Fila da Mesa | `TableQueue` | Lista ordenada de atletas esperando ou jogando em uma mesa. | Lista genérica de participantes |
| Entrada na Fila | `QueueEntry` | A posição de um atleta na `Fila da Mesa`. | `Participant`, `PingPongTableParticipant` |
| Modo de Jogo | `PlayMode` | Configuração da mesa que determina a formação de simples ou duplas. | Modo implícito sem nome |
| Jogo Ativo | `ActiveGame` | Jogo jogável atual formado pelas primeiras entradas da fila. | Rodada como histórico |
| Lado do Jogo | `GameSide` | Um lado em um jogo; tem um atleta em simples e dois atletas em duplas. | Vencedor/perdedor direto como atleta |
| Registro de Jogo | `GameRecord` | Registro de resultado de um jogo, com lado vencedor e lado perdedor. | `MatchHistory`, `Round` |
| Correção de Jogo | `GameCorrection` | Registro compensatório que reverte um `Registro de Jogo` incorreto. | `Rollback`, exclusão do registro original |
| Placar | `Scoreboard` | Exibição e controle ao vivo dos pontos durante o jogo. | Histórico de jogo |
| Pontuação | `Rating` | Pontos de classificação de um atleta usados no ranking. | Score ao vivo |
| Ranking do Clube | `ClubLadder` | Ordenação dos atletas de um clube por `Pontuação`. | Ranking global sem clube |
| Nível | `Tier` | Faixa nomeada derivada de limites de `Pontuação`. | Categoria manual sem regra |
| Convite do Clube | `ClubInvite` | Convite que concede acesso a um clube. | Convite genérico |
| Convite da Mesa | `TableInvite` | Convite que concede acesso ou associação a uma mesa. | Convite genérico |

## Regras de Domínio

- Todo dado de domínio pertence a um `Clube`; acesso entre clubes para mesas, jogos, pontuações ou rankings é inválido.
- Uma `Mesa` possui membros persistentes e entradas transitórias na fila.
- Entrar na `Fila da Mesa` pode criar um `Membro da Mesa` quando o atleta ainda não for membro.
- A implementação atual considera toda `Mesa` como simples por padrão.
- Em simples, o `Jogo Ativo` é formado pelas duas primeiras `Entradas na Fila`.
- Em duplas, o modelo deve permitir formar o `Jogo Ativo` pelas quatro primeiras `Entradas na Fila`.
- Resultado de jogo pertence a `Lados do Jogo`, não diretamente a atletas, para manter o modelo pronto para duplas.
- A rotação "vencedor fica" preserva o `Lado do Jogo` vencedor; o lado perdedor volta para o fim da fila preservando sua ordem relativa.
- `Registro de Jogo` guarda lado vencedor, lado perdedor, deltas de pontuação, ator, mesa e horário.
- `Correção de Jogo` nunca apaga o registro original; ela cria um registro compensatório.
- Cada `Registro de Jogo` pode ter no máximo uma `Correção de Jogo`.
- O estado do `Placar` não cria nem possui `Registro de Jogo`; ele permanece separado como controle ao vivo.

## Mapeamento Para Implementação

Use os nomes abaixo nos módulos de domínio NestJS:

| Português | Inglês |
| --- | --- |
| Clube | `Club` |
| Atleta | `Athlete` |
| Mesa | `Table` |
| Membro da Mesa | `TableMember` |
| Fila da Mesa | `TableQueue` |
| Entrada na Fila | `QueueEntry` |
| Modo de Jogo | `PlayMode` |
| Jogo Ativo | `ActiveGame` |
| Lado do Jogo | `GameSide` |
| Registro de Jogo | `GameRecord` |
| Correção de Jogo | `GameCorrection` |
| Placar | `Scoreboard` |
| Pontuação | `Rating` |
| Ranking do Clube | `ClubLadder` |
| Nível | `Tier` |
| Convite do Clube | `ClubInvite` |
| Convite da Mesa | `TableInvite` |

Substituições esperadas durante a migração:

| Nome antigo ou ambíguo | Substituir por |
| --- | --- |
| `Tenant` | `Club` |
| `User` como jogador | `Athlete` |
| `PingPongTableParticipant` | `QueueEntry` |
| `Participant` | `QueueEntry` ou `TableMember`, conforme persistência |
| `MatchHistory` | `GameRecord` |
| `Round` como resultado registrado | `GameRecord` |
| `Round` como jogo em andamento | `ActiveGame` ou `Game` |
| `Rollback` | `GameCorrection` |
| `Score` como ranking | `Rating` |
| `Score` como pontos ao vivo | `Scoreboard` |

## Fronteiras

- Módulos de autenticação podem falar em `User`.
- Módulos esportivos devem falar em `Athlete`.
- A tradução de `User` para `Athlete` acontece na fronteira entre identidade e domínio esportivo.
- APIs públicas podem mudar para refletir a linguagem canônica.
- Não crie adaptadores de compatibilidade apenas para preservar nomes antigos quando o objetivo for alinhar a linguagem do domínio.

## Validação

Este documento é validado por revisão:

- Cada termo antigo ou ambíguo deve ter um substituto canônico.
- Toda nova entidade, serviço, DTO ou endpoint de domínio esportivo deve usar o vocabulário deste documento.
- Ao implementar as regras de domínio, adicione testes para formação do jogo ativo em simples, rotação "vencedor fica", correção compensatória de jogo, ranking escopado por clube, separação entre placar e registro de jogo, e formato futuro de duplas com dois atletas por lado.
