"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error(error.message === "Invalid login credentials"
        ? "Email ou password incorretos."
        : error.message);
      setLoading(false);
      return;
    }

    toast.success("Login efetuado com sucesso!");
    router.push("/");
    router.refresh();
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary-700">
            EQX Folha de Serviço
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Plataforma de gestão de trabalhos semanais
          </p>
        </div>

        <form onSubmit={handleLogin} className="card space-y-5">
          <h2 className="text-xl font-semibold text-gray-900 text-center">
            Entrar
          </h2>

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
              placeholder="trabalhador@empresa.pt"
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder="••••••••"
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "A entrar..." : "Entrar"}
          </button>

          <p className="text-center text-sm text-gray-500">
            Não tem conta?{" "}
            <Link href="/auth/signup" className="font-medium text-primary-600 hover:text-primary-500">
              Criar conta
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
