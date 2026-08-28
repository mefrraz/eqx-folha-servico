# Servidor MCP — EQX Folha de Serviço

Servidor MCP (Model Context Protocol) que permite ao **Hermes Agent** (ou qualquer cliente MCP) ligar-se de forma **segura** à plataforma EQX Folha de Serviço.

```
Hermes Agent ──MCP (HTTPS, API key)──▶ Servidor MCP ──service role──▶ Supabase
   (só MCP, nunca Supabase direto)      (gatekeeper)                  (dados)
```

> **Regra de ouro:** o Hermes **não** tem acesso direto ao Supabase — só ao MCP. O MCP usa o service role internamente, mas expõe apenas as ferramentas permitidas, com permissões por role.

---

## 🔌 Endpoint

- **URL:** `https://eqx-folha-servico.vercel.app/api/mcp`
- **Transporte:** streamable HTTP (HTTPS), **não** stdio
- **Método:** `POST` (JSON-RPC 2.0)
- **Autenticação:** header `Authorization: Bearer <API_KEY>`

---

## 🔑 Autenticação

Cada pedido tem de incluir a API key no header:

```
Authorization: Bearer eqx_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

As chaves são criadas/revogadas no painel admin em **API Keys** (`/hr/api-keys`). A chave só é mostrada **uma vez** ao criar.

**Permissões por role:**

| Role | Pode ler | Pode validar folhas |
|---|---|---|
| `read` (Leitura) | ✅ | ❌ |
| `admin` (Admin/RH) | ✅ | ✅ |

---

## 🛠 Ferramentas

| Ferramenta | Descrição | Permissão |
|---|---|---|
| `listar_trabalhadores` | Lista todos os trabalhadores | leitura |
| `listar_folhas` | Lista folhas (filtro por `week_start` e `status`) | leitura |
| `detalhe_folha` | Detalhe completo de uma folha (entradas, turnos, horas) | leitura |
| `listar_clientes` | Lista todos os clientes | leitura |
| `listar_obras` | Lista todas as obras (projetos) | leitura |
| `exportar_folha` | Exporta uma folha (dados para Word) | leitura |
| `validar_folha` | Marca uma folha como validada | admin/RH |
| `criar_obra` | Cria uma obra | admin/RH |
| `apagar_obra` | Apaga uma obra | admin/RH |
| `criar_cliente` | Cria um cliente | admin/RH |
| `apagar_cliente` | Apaga um cliente | admin/RH |
| `apagar_trabalhador` | Apaga um trabalhador (conta) | admin/RH |
| `atribuir_obra_folha` | Atribui obra/cliente a uma folha | admin/RH |

**Todas as ferramentas de escrita exigem role admin/RH** — o role é verificado antes de executar (a chave de leitura não basta). Rate limiting aplica-se a todas as ferramentas.

---

## 📡 Protocolo (JSON-RPC 2.0)

### 1. Inicializar

```http
POST /api/mcp
Authorization: Bearer eqx_...
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": {
    "protocolVersion": "2024-11-05",
    "capabilities": {},
    "clientInfo": { "name": "hermes", "version": "1.0" }
  }
}
```

Resposta:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "protocolVersion": "2024-11-05",
    "capabilities": { "tools": {} },
    "serverInfo": { "name": "eqx-folha-servico-mcp", "version": "1.0.0" }
  }
}
```

### 2. Listar ferramentas

```json
{ "jsonrpc": "2.0", "id": 2, "method": "tools/list" }
```

### 3. Chamar uma ferramenta

```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "listar_folhas",
    "arguments": { "status": "submitted" }
  }
}
```

Resposta (o resultado vem em `content[0].text` como JSON):

```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "result": {
    "content": [ { "type": "text", "text": "{\"folhas\": [...]}" } ]
  }
}
```

---

## 🧪 Testar com curl

```bash
# Listar ferramentas
curl -X POST https://eqx-folha-servico.vercel.app/api/mcp \
  -H "Authorization: Bearer eqx_SUA_CHAVE" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'

# Listar trabalhadores
curl -X POST https://eqx-folha-servico.vercel.app/api/mcp \
  -H "Authorization: Bearer eqx_SUA_CHAVE" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"listar_trabalhadores","arguments":{}}}'
```

---

## ⚙️ Configuração (passo a passo)

1. **Aplicar a migração** no Supabase SQL Editor: `supabase/migrations/019_api_keys.sql`
2. **Criar uma API key** no painel admin → **API Keys** → "Criar chave" (escolhe o nome "Hermes Agent" e a permissão "Admin/RH")
3. **Guardar a chave** (só é mostrada uma vez)
4. **Configurar o Hermes** com:
   - URL do MCP: `https://eqx-folha-servico.vercel.app/api/mcp`
   - Transporte: streamable HTTP
   - API key: a chave criada no passo 2

---

## 🔒 Segurança

- O **service role** do Supabase fica **só** no servidor MCP (nunca exposto ao cliente)
- API keys **separadas por cliente** (Hermes, RH, etc.), revogáveis
- As chaves são guardadas em **hash SHA-256** (nunca em claro)
- Permissões por role: `read` (só consulta) vs `admin` (pode validar)
- **Rate limiting**: máximo de 60 pedidos por minuto por IP
