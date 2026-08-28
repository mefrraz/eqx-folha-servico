"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import toast from "react-hot-toast";
import { brand } from "@/lib/brand";

export default function LoginPage() {
  const [email,setEmail]=useState("");const [password,setPassword]=useState("");const [loading,setLoading]=useState(false);
  const router=useRouter();const supabase=createClient();
  const handle=async(e:React.FormEvent)=>{e.preventDefault();setLoading(true);const{error}=await supabase.auth.signInWithPassword({email,password});if(error){toast.error("Email ou password incorretos.");setLoading(false);return;}toast.success("Autenticado.");router.push("/");router.refresh();};

  return(<div className="flex min-h-screen items-center justify-center bg-page px-4">
    <div className="w-full max-w-sm space-y-8">
      <div className="text-center"><Image src={brand.logoUrl} alt="logo" width={134} height={40} className="h-10 w-auto mx-auto mb-4"/><p className="text-sm text-brand-soft mt-1">Inicie sessão para continuar</p></div>
      <form onSubmit={handle} className="card space-y-4">
        <div><label htmlFor="email" className="label-field">Email</label><input id="email" type="email" required value={email} onChange={e=>setEmail(e.target.value)} className="input-field" placeholder="nome@eqx.pt"/></div>
        <div><label htmlFor="password" className="label-field">Password</label><input id="password" type="password" required value={password} onChange={e=>setPassword(e.target.value)} className="input-field" placeholder="••••••••"/></div>
        <button type="submit" disabled={loading} className="btn-primary w-full">{loading?"A entrar…":"Entrar"}</button>
        <p className="text-center text-xs text-brand-muted">Sem conta? <Link href="/auth/signup" className="font-semibold text-brand-dark hover:text-brand-gold transition-colors">Criar conta</Link></p>
        <p className="text-center"><Link href="/auth/reset-password" className="text-xs text-brand-muted hover:text-brand-gold transition-colors">Esqueci a password</Link></p>
      </form>
      <p className="text-center text-[10px] text-brand-muted/60">Supabase: me.frraz+eqx@gmail.com</p>
    </div>
  </div>);
}
