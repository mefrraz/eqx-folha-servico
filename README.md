<p align="center">
  <img src="public/eqx-logo.png" alt="Ledger — Folha de Serviço" width="60%" />
</p>

> **v8.5** — 🕐 Folhas de serviço semanais · 👷 Turnos manhã/tarde · 🤖 API + MCP para IA · 🎨 White-label

---

## 🎯 Porquê a Ledger

As folhas de serviço semanais dos colaboradores são essenciais para o RH, mas preenchê-las e geri-las é muitas vezes manual, confuso e sem controlo. A **Ledger** nasceu para simplificar: o trabalhador preenche as horas e trabalhos no telemóvel em minutos, o RH consulta, valida e exporta tudo — com segurança e sem papel.

| Funcionalidade | Ledger | Excel/Manual |
|---|---|---|
| Preenchimento no telemóvel | ✅ | ❌ |
| Turnos manhã/tarde sem sobreposição | ✅ | ❌ |
| Validação em tempo real | ✅ | ❌ |
| Validação em massa | ✅ | ❌ |
| Exportar Word | ✅ | ⚠️ |
| Convites com permissões | ✅ | ❌ |
| Aprovação de obras | ✅ | ❌ |
| API + MCP para IA | ✅ | ❌ |
| PWA instalável | ✅ | ❌ |
| White-label (cores/nome/logo) | ✅ | ❌ |

---

## ✨ Funcionalidades

### 👷 Trabalhador
| Funcionalidade | v | Descrição |
|---|---|---|
| 📝 Folha semanal | 1.0 | Seg–Sáb, com turnos manhã/tarde |
| 🚫 "Não trabalhei" | 7.6 | Marca turno como não trabalhado (esbate campos) |
| ⚠️ Validação em tempo real | 7.7 | Aviso imediato de sobreposição de turnos |
| 📱 Cards mobile por dia | 7.9 | Agrupados por dia, menos scroll |
| 🏗️ Seleção de obras | 7.17 | Escolhe obras, com aprovação do admin |
| ⚙️ Definições | 1.0 | Nome, password, mudar obras |

### 👔 RH / Admin
| Funcionalidade | v | Descrição |
|---|---|---|
| 📊 Dashboard | 1.0 | Estatísticas, submissões, pendentes |
| 👥 Gestão de utilizadores | 1.0 | Criar, editar, eliminar, convites |
| 🔢 Ações em massa | 7.24 | Atribuir obra, eliminar, enviar email a vários |
| 🎟️ Convites de acesso | 7.15 | Códigos com prazo, cores, permissões |
| ✅ Validação em massa | 7.10 | Validar várias folhas de uma vez |
| 🏗️ Obras e clientes | 1.0 | CRUD completo |
| 📧 Emails | 6.31 | Templates, envio em massa, lembretes |
| 🔑 API Keys | 8.0 | Chaves para o MCP/API |

### 🤖 Integração (API + MCP)
| Funcionalidade | v | Descrição |
|---|---|---|
| 🌐 API REST | 8.0 | `/api/v1` — trabalhadores, folhas, clientes, obras |
| 🔌 Servidor MCP | 8.0 | `/api/mcp` — ferramentas tipadas para IA |
| 🔐 API keys | 8.0 | Hash SHA-256, revogáveis, por role |
| 🚦 Rate limiting | 8.2 | 60 pedidos/min por IP |

### 🎨 White-label
| Funcionalidade | v | Descrição |
|---|---|---|
| 🎨 Cores configuráveis | 8.4 | Env vars `NEXT_PUBLIC_BRAND_*` |
| 🏷️ Nome configurável | 8.4 | Env var `NEXT_PUBLIC_APP_NAME` |
| 🖼️ Logo | 8.5 | Horizontal na interface, quadrado no favicon |

---

## 🚀 Quick Start

```bash
git clone https://github.com/mefrraz/eqx-folha-servico.git
cd eqx-folha-servico
npm install
npm run dev        # → http://localhost:3000
```

Cria um ficheiro `.env.local` (ver `.env.local.example`):

```env
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon public key]
SUPABASE_SERVICE_ROLE_KEY=[service role key]
NEXT_PUBLIC_APP_URL=https://folhas.eqx.pt
```

```bash
npm test           # testes unitários
npm run build      # build de produção
```

---

## 🛠️ Stack

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript |
| Estilos | Tailwind CSS 3 |
| Auth | Supabase Auth (email/password) |
| Base de dados | Supabase PostgreSQL + RLS |
| Deploy | Vercel (auto-deploy) |
| PWA | next-pwa (instalável no telemóvel) |
| Emails | Nodemailer (Gmail) |
| Testes | Vitest + Playwright |

---

## ⚙️ Arquitetura

```
Browser (Next.js)
    │
    ├── Supabase SDK ──────────► Supabase (Auth + DB + RLS)
    │
    ├── /api/v1/* ─────────────► API REST pública (API keys)
    │
    ├── /api/mcp ───────────────► Servidor MCP (streamable HTTP)
    │
    └── Service Worker ────────► Cache local (PWA offline)
```

### Integração com IA (MCP)

```
Hermes Agent ──MCP (HTTPS, API key)──▶ Servidor MCP ──service role──▶ Supabase
   (só MCP, nunca Supabase direto)      (gatekeeper)                  (dados)
```

O Hermes (ou qualquer cliente MCP) liga-se ao `/api/mcp` com uma API key. O MCP usa o service role internamente, mas expõe só as ferramentas permitidas, com permissões por role. Ver [`docs/MCP.md`](docs/MCP.md).

---

## 🏗️ Estrutura do Projeto

```
src/
├── app/
│   ├── api/
│   │   ├── v1/                    # API REST pública (trabalhadores, folhas, clientes, obras, validar, exportar)
│   │   ├── mcp/                   # Servidor MCP (streamable HTTP)
│   │   └── ...                    # Outras API routes (auth, emails, users)
│   ├── auth/                      # Login, registo, reset/set password
│   ├── hr/                        # Painel admin/RH (dashboard, users, invites, projects, clients, emails, api-keys, mcp)
│   └── worker/                    # Área do trabalhador (dashboard, sheet, settings)
├── components/                    # Componentes reutilizáveis (SheetForm, SheetTable, SheetMobileCards, ProjectSelector)
├── lib/
│   ├── brand.ts                   # Configuração da marca (white-label)
│   ├── api-auth.ts                # Autenticação por API key
│   ├── types.ts                   # Tipos partilhados
│   └── utils.ts                   # Funções utilitárias (calcMinutes, validateSheet, formatName)
└── middleware.ts                  # Proteção de rotas
supabase/
├── complete-schema-seed.sql       # Schema completo + seed
└── migrations/                    # Migrações numeradas (001–019)
docs/
├── MCP.md                         # Como ligar o Hermes (MCP)
└── API.md                         # Referência da API REST
```

---

## 🧪 Testes

**23 testes unitários** (Vitest) + **14 testes e2e** (Playwright).

```bash
npm test                        # unitários (Vitest)
npx playwright test             # end-to-end (Playwright)
```

| Área | Testes |
|---|---|
| Utilitários (`calcMinutes`, `formatMinutes`, `validateSheet`, `formatName`) | 18 |
| Tipos (`STATUS_LABELS`, `DAY_LABELS`, `WORK_TYPE_LABELS`) | 5 |
| E2E (login, admin, convites, fluxo do trabalhador) | 14 |

---

## 🤝 Contribuir

PRs são bem-vindos! Resumo rápido:
1. **Escolhe uma issue** ou cria uma nova
2. **Faz fork, clone, branch** e mexe no que quiseres
3. **`npm run build`** tem de passar
4. **Adiciona testes** se mexeres em lógica
5. **Abre o PR**

---

## 📜 Licença

Desenvolvido para **EQX — eqx.pt**. Todos os direitos reservados.

---

<p align="center">
  <a href="https://folhas.eqx.pt">🌐 folhas.eqx.pt</a>
  &nbsp;·&nbsp;
  <a href="https://github.com/mefrraz/eqx-folha-servico">📦 GitHub</a>
</p>
