# Ingressos PIX

Sistema simples de venda de ingressos para um evento pequeno:

- Valor único, pagamento **somente via PIX** (gateway **Asaas**)
- Gera **QR Code PIX + copia e cola** para o comprador pagar
- Confirmação **automática** do pagamento (webhook do Asaas)
- Após confirmado, gera um **QR Code de ingresso** para validar na entrada
- Painel do **gestor** (com login) com a lista de compradores e leitor de entrada

Stack: **Next.js (App Router) + TypeScript**, banco **libSQL/SQLite** (arquivo local em dev, [Turso](https://turso.tech) em produção), deploy na **Vercel**.

---

## 1. Instalar

```bash
npm install
cp .env.example .env   # no Windows (PowerShell): Copy-Item .env.example .env
```

Preencha o `.env` (veja a seção 2 e 3).

## 2. Configurar o evento e o gestor

No `.env`:

```
EVENT_NAME="Festa Junina 2026"
EVENT_PRICE="50.00"        # valor único do ingresso
EVENT_DATE="2026-08-15 20:00"
EVENT_LOCATION="Salão Central"
APP_URL="http://localhost:3000"

ADMIN_USER="admin"
ADMIN_PASSWORD="uma-senha-forte"
SESSION_SECRET="cole-aqui-uma-string-longa-e-aleatoria"
```

## 3. Configurar o Asaas (gateway PIX)

1. Crie uma conta em https://www.asaas.com (use o ambiente **sandbox** para testar).
2. Pegue a **chave de API**: painel Asaas → *Configurações → Integrações → API*.
3. No `.env`:
   ```
   ASAAS_ENV="sandbox"          # troque para "production" quando for pra valer
   ASAAS_API_KEY="sua_chave_aqui"
   ASAAS_WEBHOOK_TOKEN="um-token-secreto-qualquer"
   ```
4. Cadastre o **webhook** no Asaas (*Configurações → Integrações → Webhooks*):
   - URL: `https://SEU-DOMINIO/api/webhook`
   - Token de autenticação: o **mesmo** valor de `ASAAS_WEBHOOK_TOKEN`
   - Eventos: **Cobrança recebida** / **Cobrança confirmada**

> Mesmo sem webhook (ex.: em dev local sem URL pública), a tela de pagamento
> também consulta o Asaas por polling e confirma sozinha — o webhook só deixa
> a confirmação mais instantânea.

## 4. Rodar localmente

```bash
npm run dev
```

- Loja / compra: http://localhost:3000
- Painel do gestor: http://localhost:3000/admin

O banco (`local.db`) é criado automaticamente na primeira requisição.

## 5. Publicar na Vercel

1. Banco de produção com **Turso** (SQLite serverless):
   ```bash
   # instale a CLI do Turso, depois:
   turso db create ingressos
   turso db show ingressos --url            # -> DATABASE_URL (libsql://...)
   turso db tokens create ingressos         # -> DATABASE_AUTH_TOKEN
   ```
2. No projeto da Vercel, defina as variáveis de ambiente (as mesmas do `.env`),
   com:
   - `APP_URL` = URL pública da Vercel
   - `DATABASE_URL` / `DATABASE_AUTH_TOKEN` do Turso
   - `ASAAS_ENV=production` e a chave de API de produção
3. Faça o deploy. Depois, cadastre o webhook do Asaas apontando para
   `https://SEU-APP.vercel.app/api/webhook`.

---

## Como funciona (fluxo)

1. Comprador preenche nome, e-mail e CPF em `/`.
2. O sistema cria a cobrança PIX no Asaas e mostra o QR + copia e cola em `/pedido/[id]`.
3. Ao pagar, o Asaas notifica o webhook (`/api/webhook`) — a página detecta e
   redireciona para o ingresso `/ingresso/[token]` com o **QR de verificação**.
4. Na entrada, o gestor usa `/admin/validar` para escanear o QR e registrar a
   entrada (evita reentrada com o mesmo ingresso).
5. `/admin` mostra a lista de compradores, status de pagamento, entradas e total
   arrecadado.

## Estrutura

```
app/
  page.tsx + BuyForm.tsx        # loja / compra
  pedido/[id]/                  # pagamento PIX (QR + polling)
  ingresso/[token]/             # ingresso com QR de verificação
  admin/                        # login, lista de compradores, validar entrada
  api/
    checkout/                   # cria cobrança PIX no Asaas
    status/[id]/                # polling + reconciliação com o Asaas
    webhook/                    # confirmação automática do pagamento
    admin/                      # login, logout, check-in
lib/
  config.ts asaas.ts db.ts auth.ts ticket.ts
```
