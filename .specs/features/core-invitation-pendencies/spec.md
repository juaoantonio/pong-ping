# Core Invitation Pendencies Specification

## Fonte

- `PENDENCIAS_BACKEND.md` atualizado em 2026-05-20.
- TaApico: `Pendencias Do Core` > `Invitation`.

## Estado Atual

- Existe domaAnio puro para convites: `Invitation`, `ClubInvite`, `TableInvite`, token, expiraaCaeo, claims e policy.
- Nao existe application layer.
- Nao existe persistencia.
- Nao existem endpoints para gerar, validar ou consumir convites.

## Problema

Convites ainda estao somente no dominio. Para virar fluxo real, o backend precisa definir persistencia, contratos, use cases e endpoints, alem de integrar claim de convite com identity/core conforme o tipo de convite.

## Objetivos

- [ ] Criar application layer para gerar, validar e consumir convites.
- [ ] Criar persistencia TypeORM para convites e claims.
- [ ] Criar endpoints para gerar, validar e consumir convites.
- [ ] Definir autorizacao de emissao e consumo.

## Fora De Escopo

- Envio de email/WhatsApp.
- Deep links/mobile.
- UI frontend.
- Convites pagos ou campanhas.

## Requisitos

### CORE-INVITATION-01: Application Layer

**Como** admin do clube, **quero** gerar convites, **para** permitir entrada controlada no clube ou em mesa.

**Critaorios de aceite**:

1. Use case cria convite de clube.
2. Use case cria convite de mesa se `TableInvite` for mantido no escopo.
3. Use case valida token e expiracao.
4. Use case consome convite registrando claim.

### CORE-INVITATION-02: Persistencia

**Como** backend, **quero** persistir convites e claims, **para** validar consumo e evitar reutilizacao indevida.

**Critaorios de aceite**:

1. Convite persiste id, token, tipo, club/table alvo, expiracao, reutilizacao e claims.
2. Token tem indice unico.
3. Claims registram ator e data de consumo.
4. Convite nao reutilizavel nao pode ser consumido duas vezes.

### CORE-INVITATION-03: API De Convites

**Como** frontend, **quero** gerar, validar e consumir convites, **para** operar entrada no clube.

**Critaorios de aceite**:

1. Admin pode gerar convite.
2. Usuario autenticado pode consumir convite valido.
3. Validacao de token retorna dados suficientes para tela de confirmacao.
4. Respostas usam contratos compartilhados.

## Traceabilidade

| ID | Origem em `PENDENCIAS_BACKEND.md` | Status inicial |
| --- | --- | --- |
| CORE-INVITATION-01 | Criar application layer | Pendente |
| CORE-INVITATION-02 | Criar persistencia | Pendente |
| CORE-INVITATION-03 | Criar endpoints para gerar/validar/consumir convites | Pendente |

