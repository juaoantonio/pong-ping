# Core Club Pendencies Specification

## Fonte

- `PENDENCIAS_BACKEND.md` atualizado em 2026-05-20.
- TaApico: `Pendencias Do Core` > `Club`.

## Estado Atual

- `Club` possui domaAnio, repositaArio TypeORM, DTOs/serializador de comando e use cases para criar, renomear, alterar slug, ativar e desativar.
- `ClubModule` exporta use cases e repositaArio, mas naeo registra controller HTTP.
- A sincronizaaCaeo principal vem de `identity`: criaaCaeo/atualizaaCaeo de tenant reflete em `core.club`.
- As read APIs atuais cobrem dashboard e recursos do clube, mas naeo haa endpoint explaAcito para consultar dados do clube atual.

## Problema

O Core ainda naeo decidiu se `Club` precisa de uma superfaAcie administrativa/leitura praApria ou se deve continuar sendo apenas um reflexo operacional de `identity`. Sem essa decisaeo, o frontend pode depender indiretamente de dados de tenant ou duplicar laAgica para exibir o clube atual.

## Objetivos

- [ ] Decidir se `Club` teraa API administrativa praApria no Core.
- [ ] Definir se a leitura do clube atual ao interna, externa ou desnecessaaria.
- [ ] Se necessaaria, especificar consulta tenant-scoped para dados do clube atual.
- [ ] Evitar duplicidade de ownership entre `identity.tenant` e `core.club`.

## Fora De Escopo

- Reestruturar sincronizaaCaeo `identity` -> `core`.
- Criar CRUD completo de clube fora das necessidades jaa existentes.
- Alterar contratos de system admin sem necessidade confirmada.

## Requisitos

### CORE-CLUB-01: Decisao De Ownership

**Como** mantenedor do backend, **quero** definir o papel de `Club` frente a `Tenant`, **para** evitar duas fontes de verdade para o mesmo dado operacional.

**Critaorios de aceite**:

1. A decisaeo documenta se `Club` ao somente projeaCaeo/sincronizaaCaeo de `identity` ou se teraa API administrativa praApria.
2. A decisaeo identifica quais campos pertencem ao `identity.tenant` e quais pertencem ao `core.club`.
3. A decisaeo define quem pode alterar nome, slug e status quando a alteraaCaeo for exposta por API Core.

### CORE-CLUB-02: Consulta Do Clube Atual

**Como** usuaario autenticado no tenant, **quero** consultar os dados do clube atual, **para** exibir identidade do clube sem depender de endpoints administrativos do identity.

**Critaorios de aceite**:

1. A consulta usa tenant atual como `clubId`.
2. A resposta naeo reconstraAi agregado rico para leitura simples.
3. A resposta reutiliza `ClubResponseContract` ou cria contrato especaAfico se a leitura precisar esconder campos.
4. A consulta retorna 404 quando o clube sincronizado naeo existir.

## Traceabilidade

| ID | Origem em `PENDENCIAS_BACKEND.md` | Status inicial |
| --- | --- | --- |
| CORE-CLUB-01 | Decidir se precisa API de leitura administrativa ou se continua somente sincronizado por identity | Pendente |
| CORE-CLUB-02 | Criar consulta interna/externa para dados do clube atual, se o frontend precisar | Pendente |

