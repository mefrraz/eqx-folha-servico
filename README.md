# EQX Folha de Serviço — Plataforma de Gestão Semanal

Plataforma web desenvolvida para a **[EQX](https://eqx.pt)** gerir as folhas de serviço semanais dos seus colaboradores. Os trabalhadores preenchem as horas e trabalhos realizados; o RH consulta, valida e exporta tudo.

---

## 🛠 Stack

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript + TailwindCSS |
| Autenticação | Supabase Auth (Email + Password) |
| Base de Dados | Supabase PostgreSQL + Row Level Security |
| Deploy | Vercel (automático via GitHub) |
| PWA | next-pwa (instalável no telemóvel) |
| Emails | Resend (notificações) + pg_net (triggers em tempo real) |

---

## 📋 Funcionalidades

### 👷 Trabalhador

| Feature | Descrição |
|---|---|
| **Login / Registo** | Email + password |
| **Dashboard** | Semana atual + histórico de folhas anteriores |
| **Nova folha de serviço** | Formulário Seg–Sáb com dropdown de obras atribuídas |
| **Campos por dia** | Trabalho a executar, tipo, data, hora início/fim, avaliação, rubrica, observações |
| **Dropdown de obras** | Seleciona a obra atribuída → preenche cliente e nº obra automaticamente |
| **Rascunho / Submeter** | Guarda rascunho ou submete folha final |
| **Definições** | Alterar nome e password |
| **Navegação mobile** | Barra inferior fixa com ícones (🏠 📝 ⚙️) |
| **PWA** | Instalável no ecrã inicial do telemóvel |

### 👔 RH / Admin

| Feature | Descrição |
|---|---|
| **Dashboard** | Estatísticas: total trabalhadores, horas semanais/totais, obras ativas, submissões |
| **Lista de trabalhadores** | Nome, email, última folha, horas, data de registo, pesquisa por nome/obra |
| **Perfil do trabalhador** | Calendário de folhas, detalhe compacto, modal "Ver folha" com tabela completa (8 colunas) |
| **Exportar Word** | Gera documento .doc com a folha formatada |
| **Validar folhas** | Marca folhas submetidas como validadas |
| **Notificações** | Badge vermelho em tempo real, limpar individual/todas, link para o trabalhador |
| **Email notifications** | Envio automático para admin quando uma folha é submetida (via Resend + pg_net) |
| **Gestão de clientes** | CRUD com nome e logotipo |
| **Gestão de obras** | CRUD com nome, número, cliente e localização |
| **Atribuir obras** | Atribuir/remover trabalhadores a obras (individual no perfil ou em massa na lista) |
| **Transferir em massa** | Selecionar vários trabalhadores e atribuir a uma obra de uma vez |
| **Criar utilizadores** | Modal no admin (sem sair da sessão) |
| **Editar utilizadores** | Nome, email, password |
| **Eliminar utilizadores** | Com confirmação de credenciais admin |

---

## 🗄️ Base de Dados

| Tabela | Descrição |
|---|---|
| `profiles` | Perfis dos utilizadores (nome, email, role, empresa) |
| `work_sheets` | Folhas de serviço (uma por trabalhador por semana) |
| `work_entries` | Entradas diárias (até 6 por folha: Seg–Sáb) |
| `clients` | Clientes |
| `projects` | Obras (nome, número, cliente, localização) |
| `worker_projects` | Atribuição trabalhador ↔ obra (junction table) |
| `notifications` | Notificações para admin |

**Segurança:** Row Level Security em todas as tabelas. Trabalhadores só veem os seus dados. Admins veem tudo.

---

## 🚀 Setup

### 1. Clonar

```bash
git clone https://github.com/mefrraz/eqx-folha-servico.git
cd eqx-folha-servico
npm install
```

### 2. Supabase

1. Criar projeto em [supabase.com](https://supabase.com)
2. SQL Editor → abrir e executar `supabase/complete-schema-seed.sql`
   - Cria todas as tabelas, triggers, RLS, políticas
   - Cria 3 clientes, 5 obras de exemplo
3. Authentication → Settings:
   - Ativar **Email/Password**
   - (Dev) Desativar **Confirm email**
4. Copiar `URL` e `anon key` de Settings → API

### 3. Variáveis de Ambiente

Criar `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
ADMIN_EMAIL=admin@eqx.pt
RESEND_API_KEY=re_xxxxxxxx    # opcional — para emails
```

### 4. Correr

```bash
npm run dev
# → http://localhost:3000
```

### 5. Criar Admin

```bash
# No Supabase SQL Editor, correr:
# supabase/create-admin.sql
# ou via UI: Authentication → Add User → depois:
UPDATE profiles SET role = 'admin' WHERE email = 'admin@eqx.pt';
```

### 6. Deploy Vercel

1. [vercel.com](https://vercel.com) → Import repo
2. Settings → Environment Variables → adicionar as mesmas vars do `.env.local`
3. Deploy automático a cada push

---

## 📱 PWA

Instalar no telemóvel:
- **Android**: Chrome → ⋮ → "Adicionar ao ecrã inicial"
- **iOS**: Safari → Partilhar → "Adicionar ao ecrã principal"

A app funciona offline e tem barra de navegação inferior otimizada para polegar.

---

## 📧 Notificações por Email

Opcional. Requer conta gratuita em [resend.com](https://resend.com).

1. Criar conta Resend → API Keys
2. Adicionar `RESEND_API_KEY` e `ADMIN_EMAIL` ao Vercel
3. Executar `supabase/migrations/008_email_realtime.sql`

**Como funciona:** Quando um trabalhador submete uma folha, o trigger `pg_net` chama a API do Vercel em tempo real, que envia o email via Resend. Adicionalmente, um Vercel Cron Job dispara 1x/dia como fallback.

---

## 📂 Estrutura do Projeto

```
src/
├── app/
│   ├── api/
│   │   ├── create-user/          # Criar utilizador (admin)
│   │   ├── export-sheet/[id]/    # Exportar folha para Word
│   │   ├── update-profile/       # Atualizar perfil
│   │   ├── update-user/          # Atualizar credenciais (admin)
│   │   ├── users/[id]/           # Eliminar utilizador (admin)
│   │   └── cron/notify-emails/   # Envio de emails (cron + pg_net)
│   ├── auth/
│   │   ├── login/                # Página de login
│   │   └── signup/               # Página de registo
│   ├── hr/                       # Painel Admin / RH
│   │   ├── clients/              # Gestão de clientes
│   │   ├── notifications/        # Notificações
│   │   ├── projects/             # Gestão de obras
│   │   ├── reports/              # Relatórios
│   │   ├── settings/             # Definições do admin
│   │   └── users/                # Gestão de trabalhadores
│   ├── worker/                   # Área do trabalhador
│   │   ├── dashboard/            # Dashboard pessoal
│   │   ├── settings/             # Definições pessoais
│   │   └── sheet/                # Folha de serviço (nova/editar)
│   ├── layout.tsx                # Layout raiz
│   └── page.tsx                  # Redireciona baseado no role
├── components/
│   ├── SheetForm.tsx             # Formulário principal da folha
│   ├── SheetTable.tsx            # Tabela desktop
│   ├── SheetMobileCards.tsx      # Cards mobile
│   └── MonthCalendar.tsx         # Calendário mensal
├── lib/
│   ├── types.ts                  # Tipos TypeScript partilhados
│   ├── utils.ts                  # Funções utilitárias (cálculo de horas, etc.)
│   └── supabase/
│       ├── client.ts             # Cliente Supabase (browser)
│       ├── server.ts             # Cliente Supabase (servidor)
│       └── middleware.ts         # Proteção de rotas
└── middleware.ts                 # Middleware Next.js
supabase/
├── complete-schema-seed.sql      # Schema completo + seed (executar 1x)
├── reset-admin.sql               # Limpar tudo + criar admin
├── create-admin.sql              # Criar admin sem apagar dados
├── cleanup.sql                   # Limpar schema (projeto errado)
└── migrations/                   # Migrações individuais
```

---

## 🔐 Segurança

- **Row Level Security** em todas as tabelas
- **SECURITY DEFINER** para funções que precisam de bypass de RLS
- **Service role key** usada apenas em server actions/API routes (nunca exposta ao cliente)
- **Middleware** protege rotas `/worker` e `/hr` com verificação de role
- **Políticas de storage** para upload de rubricas (só authenticated, só imagens)

---

## 🧪 Testes

```bash
npm test          # vitest run
npm run test:watch  # vitest em modo watch
```

Testes cobrem: `calcMinutes`, `formatMinutes`, `STATUS_LABELS`, `DAY_LABELS`, `WORK_TYPE_LABELS`.

---

## 📄 Licença

Desenvolvido para **EQX — eqx.pt**. Todos os direitos reservados.
