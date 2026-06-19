"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

export default function SignupPage() {
  const [fullName,setFullName]=useState("");const [email,setEmail]=useState("");const [password,setPassword]=useState("");const [loading,setLoading]=useState(false);
  const router=useRouter();const supabase=createClient();
  const handle=async(e:React.FormEvent)=>{e.preventDefault();setLoading(true);
    const{data,error}=await supabase.auth.signUp({email,password,options:{data:{full_name:fullName}}});
    if(error){toast.error(error.message?.includes("already registered")?"Este email já está registado.":"Erro: "+error.message);setLoading(false);return;}
    if(!data.user){toast.error("Erro ao criar conta.");setLoading(false);return;}
    if(data.session){await supabase.from("profiles").update({full_name:fullName}).eq("id",data.user.id);toast.success("Conta criada!");router.push("/");router.refresh();}
    else{toast.success("Conta criada! Verifique o email antes de entrar.");router.push("/auth/login");}
  };

  return(<div className="flex min-h-screen items-center justify-center bg-page px-4">
    <div className="w-full max-w-sm space-y-8">
      <div className="text-center"><img src="/eqx-logo.svg" alt="EQX" className="h-10 mx-auto mb-4"/><h2 className="text-lg font-semibold text-brand-dark">Criar conta</h2><p className="text-sm text-brand-soft mt-1">Registo de trabalhador</p></div>
      <form onSubmit={handle} className="card space-y-4">
        <div><label htmlFor="fullName" className="label-field">Nome completo</label><input id="fullName" type="text" required value={fullName} onChange={e=>setFullName(e.target.value)} className="input-field" placeholder="João Silva"/></div>
        <div><label htmlFor="email" className="label-field">Email</label><input id="email" type="email" required value={email} onChange={e=>setEmail(e.target.value)} className="input-field" placeholder="joao@eqx.pt"/></div>
        <div><label htmlFor="password" className="label-field">Password</label><input id="password" type="password" required minLength={6} value={password} onChange={e=>setPassword(e.target.value)} className="input-field" placeholder="Mínimo 6 caracteres"/></div>
        <button type="submit" disabled={loading} className="btn-primary w-full">{loading?"A criar conta…":"Criar conta"}</button>
        <p className="text-center text-xs text-brand-muted">Já tem conta? <Link href="/auth/login" className="font-semibold text-brand-dark hover:text-brand-gold transition-colors">Entrar</Link></p>
      </form>
    </div>
  </div>);
}
