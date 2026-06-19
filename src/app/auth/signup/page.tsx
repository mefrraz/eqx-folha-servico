"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // 1. Create auth user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      // Profile is auto-created by DB trigger — upsert to ensure full_name is set
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({ id: data.user.id, full_name: fullName, role: "worker" });

      if (profileError) {
        toast.error("Erro ao criar perfil: " + profileError.message);
        setLoading(false);
        return;
      }
    }

    toast.success("Conta criada com sucesso! Verifique o seu email para confirmar.");
    router.push("/auth/login");
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary-700">
            EQX Folha de Serviço
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Criar nova conta de trabalhador
          </p>
        </div>

        <form onSubmit={handleSignup} className="card space-y-5">
          <h2 className="text-xl font-semibold text-gray-900 text-center">
            Registo
          </h2>

          <div>
            <label htmlFor="fullName" className="label-field">
              Nome completo
            </label>
            <input
              id="fullName"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="input-field"
              placeholder="João Silva"
            />
          </div>

          <div>
            <label htmlFor="email" className="label-field">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="joao@empresa.pt"
            />
          </div>

          <div>
            <label htmlFor="password" className="label-field">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "A criar conta..." : "Criar conta"}
          </button>

          <p className="text-center text-sm text-gray-500">
            Já tem conta?{" "}
            <Link href="/auth/login" className="font-medium text-primary-600 hover:text-primary-500">
              Entrar
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
