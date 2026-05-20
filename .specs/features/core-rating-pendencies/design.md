# Core Rating Pendencies Design

## Consulta Por Atleta

### Rota Proposta

- `GET /core/ratings/:athleteId`
- Alternativa para perfil atual: `GET /core/athletes/me/rating`, se o frontend preferir acoplar ao perfil.

### Query

Adicionar metodo em `RatingReadQuery`:

- Entrada: `tenantId`, `athleteId`.
- Busca `RatingSchema` por `clubId = tenantId` e `athleteId`.
- Busca `AthleteSchema` para `athleteDisplayName`.
- Retorna `RatingReadContract`.

Decisao pendente: rating ausente deve retornar 404 ou leitura default. Preferencia: leitura default se o dominio ja usa `getOrCreate` para comandos; 404 se produto quiser diferenciar atleta sem partidas.

## Doubles

### Comportamento Atual

`RecordGameUseCase` pareia `winnerRatings[index]` com `loserRatings[index]`.

### Opcoes

1. **Manter pareamento por indice**
   - Simples e deterministico.
   - Exige que ordem dos lados represente pareamento real.
2. **Calcular media do time**
   - Cada vencedor ganha delta contra media do lado perdedor.
   - Mais natural para doubles sem pareamento individual.
3. **Aplicar todos contra todos**
   - Cada vencedor recebe deltas contra ambos perdedores.
   - Pode inflar impacto de doubles.

Preferencia a validar com produto: media do time, porque doubles e resultado de equipe.

## Impacto

- Se algoritmo mudar, criar servico/policy dedicado para rating de partidas.
- Atualizar testes de `RecordGameUseCase` e `EloRatingService`.
- Preservar contrato de resposta com delta por atleta.

