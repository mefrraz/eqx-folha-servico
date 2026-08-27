# API REST — EQX Folha de Serviço

API pública REST para integração com a plataforma EQX Folha de Serviço.

- **Base URL:** `https://eqx-folha-servico.vercel.app/api/v1`
- **Autenticação:** header `Authorization: Bearer <API_KEY>`
- **Formato:** JSON

> As API keys são criadas/revogadas no painel admin em **API Keys** (`/hr/api-keys`).

---

## 🔑 Autenticação

Todos os endpoints exigem a API key no header:

```
Authorization: Bearer eqx_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Permissões por role:**

| Role | Leitura | Validar folha |
|---|---|---|
| `read` | ✅ | ❌ |
| `admin` | ✅ | ✅ |

---

## 📋 Endpoints

### 1. Listar trabalhadores

```
GET /api/v1/trabalhadores
```

Resposta:

```json
{
  "trabalhadores": [
    { "id": "uuid", "full_name": "João Silva", "email": "joao@...", "role": "worker", "created_at": "..." }
  ]
}
```

### 2. Listar folhas

```
GET /api/v1/folhas?week_start=2025-01-06&status=submitted
```

Parâmetros (opcionais):
- `week_start` — segunda-feira da semana (YYYY-MM-DD)
- `status` — `draft` | `submitted` | `reviewed`

Resposta:

```json
{
  "folhas": [
    { "id": "uuid", "worker_id": "uuid", "week_start": "2025-01-06", "week_end": "2025-01-11", "client": "...", "work_number": "...", "status": "submitted", "worker": { "full_name": "...", "email": "..." } }
  ]
}
```

### 3. Detalhe de uma folha

```
GET /api/v1/folhas/:id
```

Resposta: a folha completa com `work_entries` (entradas diárias, turnos, horas).

### 4. Listar clientes

```
GET /api/v1/clientes
```

### 5. Listar obras

```
GET /api/v1/obras
```

### 6. Validar folha (admin/RH)

```
POST /api/v1/folhas/:id/validar
```

Marca a folha como `reviewed`. Requer role `admin`.

Resposta:

```json
{ "success": true, "message": "Folha validada." }
```

### 7. Exportar folha (Word)

```
GET /api/v1/folhas/:id/exportar
```

Devolve o documento Word (.doc) da folha.

---

## 🧪 Testar com curl

```bash
# Listar trabalhadores
curl -H "Authorization: Bearer eqx_SUA_CHAVE" \
  https://eqx-folha-servico.vercel.app/api/v1/trabalhadores

# Listar folhas submetidas
curl -H "Authorization: Bearer eqx_SUA_CHAVE" \
  "https://eqx-folha-servico.vercel.app/api/v1/folhas?status=submitted"

# Validar uma folha (admin)
curl -X POST -H "Authorization: Bearer eqx_SUA_CHAVE" \
  https://eqx-folha-servico.vercel.app/api/v1/folhas/UUID/validar
```

---

## 🔒 Segurança

- Service role do Supabase fica **só** no servidor (nunca exposto)
- API keys em **hash SHA-256**, revogáveis
- Permissões por role (`read` vs `admin`)
