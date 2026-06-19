# EQX Folha de Serviço — Plataforma de Gestão Semanal

Plataforma web para trabalhadores preencherem a **folha de serviço semanal** e o RH consultar as horas e trabalhos de todos os trabalhadores.

## 🛠 Stack

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript + TailwindCSS |
| Autenticação | Supabase Auth (Email + Password) |
| Base de Dados | Supabase PostgreSQL |
| Deploy | Vercel (automático via GitHub) |
| PWA | next-pwa (instalável no telemóvel) |

## 📋 Funcionalidades

### Trabalhador
- **Login / Registo** com email e password
- **Dashboard pessoal** com lista das folhas anteriores
- **Nova folha de serviço** com formulário completo (Seg–Sáb)
- Campos: cliente, nº obra, descrição do trabalho, tipo de trabalho, data, hora início/fim, avaliação, rubrica, observações
- Guardar rascunho ou submeter folha

### RH / Admin
- **Dashboard geral** com estatísticas (total trabalhadores, folhas submetidas, horas totais)
- **Lista de todos os trabalhadores** com as suas folhas
- Detalhe dia-a-dia de cada folha (trabalho, tipo, horas)

## 🚀 Setup

### 1. Clonar e preparar

```bash
git clone https://github.com/mefrraz/eqx-folha-servico.git
cd eqx-folha-servico
```

### 2. Supabase

1. Ir ao teu projeto Supabase → **SQL Editor**
2. Executar o ficheiro **`supabase/migrations/001_schema.sql`** (abrir, copiar, colar, Run)
3. Em **Authentication → Settings**, confirmar que "Email/Password" está ativado
4. (Dev) Desativar "Confirm email" para testes sem email real
5. Copiar `URL` e `anon key` de **Settings → API**

### 3. Variáveis de Ambiente

Editar `.env.local` com os valores reais:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
```

### 4. Instalar e Correr

```bash
npm install
npm run dev
```
Abrir [http://localhost:3000](http://localhost:3000)

### 5. Criar conta Admin (RH)

1. Registar uma conta normal na app
2. No **Supabase SQL Editor**, promover a admin:
```sql
UPDATE profiles SET role = 'admin' WHERE email = 'admin@eqx.pt';
```

### 6. Deploy no Vercel

1. [vercel.com](https://vercel.com) → Add New → Import `mefrraz/eqx-folha-servico`
2. Settings → Environment Variables → adicionar `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Deploy automático a cada push

## 📱 PWA

Depois do deploy, o site pode ser instalado como app no telemóvel:
- **Android**: Chrome → "Adicionar ao ecrã inicial"
- **iOS**: Safari → Partilhar → "Adicionar ao ecrã principal"

## 📂 Estrutura

```
src/
├── app/
│   ├── worker/              # Rotas do trabalhador
│   │   ├── dashboard/       # Dashboard do trabalhador
│   │   └── sheet/
│   │       ├── new/         # Nova folha
│   │       └── [id]/        # Editar folha existente
│   ├── hr/                  # Rotas do RH
│   │   └── dashboard/       # Dashboard RH/admin
│   ├── auth/
│   │   ├── login/          # Página de login
│   │   ├── signup/         # Página de registo
│   │   └── callback/       # Callback OAuth
│   ├── layout.tsx          # Layout raiz
│   └── page.tsx            # Redireciona baseado no role
├── components/
│   └── SheetForm.tsx       # Formulário reutilizável da folha
├── lib/
│   └── supabase/
│       ├── client.ts       # Cliente browser
│       ├── server.ts       # Cliente servidor
│       └── middleware.ts   # Proteção de rotas
└── middleware.ts           # Middleware Next.js
```
