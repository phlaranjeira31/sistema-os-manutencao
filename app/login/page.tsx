"use client";

import {
  ClipboardList,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  TrendingUp,
  Users,
  Wrench,
} from "lucide-react";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault();

  setCarregando(true);

  try {
    const { signIn } = await import("next-auth/react");

    const result = await signIn("credentials", {
      email,
      senha,
      redirect: false,
    });

    if (!result || result.error) {
      alert("Email ou senha inválidos");
      setCarregando(false);
      return;
    }

    const callbackUrl = searchParams.get("callbackUrl") || "/admin";

    window.location.href = callbackUrl;
  } catch (error) {
    console.error(error);
    alert("Erro ao conectar com o servidor");
  }

  setCarregando(false);
}

  return (
    <main className="relative min-h-dvh w-full overflow-hidden bg-slate-950">
      <div
        className="absolute inset-0 opacity-45"
        style={{
          backgroundImage: "url('/sequoia-bg.jpeg')",
          backgroundSize: "cover",
          backgroundPosition: "center 62%",
          backgroundRepeat: "no-repeat",
        }}
      />

      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[1.5px]" />

      <section className="relative z-10 flex min-h-dvh items-center justify-center px-4 py-6 sm:px-6">
        <div className="grid w-full max-w-[950px] grid-cols-1 items-stretch gap-8 lg:grid-cols-2">
          <aside className="hidden flex-col justify-between rounded-[24px] border border-white/15 bg-slate-950/68 p-7 text-white shadow-2xl backdrop-blur-md lg:flex">
            <div>
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/5">
                <Wrench size={26} />
              </div>

              <h1 className="text-[30px] font-extrabold leading-tight">
                Sistema de OS
                <br />
                Manutenção
              </h1>

              <p className="mt-4 text-[14px] leading-6 text-slate-300">
                Gerencie ordens de serviço, equipes, setores e manutenções com
                mais agilidade e controle.
              </p>

              <div className="mt-6 space-y-4">
                <Feature
                  icon={<ClipboardList size={18} />}
                  title="Ordens de serviço"
                  text="Acompanhe e gerencie todas as OS"
                />

                <Feature
                  icon={<Users size={18} />}
                  title="Equipes e setores"
                  text="Organize colaboradores e setores"
                />

                <Feature
                  icon={<TrendingUp size={18} />}
                  title="Relatórios"
                  text="Indicadores e histórico completo"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3 rounded-2xl bg-slate-800/70 p-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900">
                <ShieldCheck size={18} />
              </div>

              <div>
                <p className="text-sm font-bold">Acesso seguro e restrito</p>

                <p className="text-xs text-slate-300">
                  Somente usuários autorizados
                </p>
              </div>
            </div>
          </aside>

          <section className="mx-auto flex w-full max-w-[460px] flex-col justify-center rounded-[24px] bg-white px-5 py-6 shadow-2xl sm:px-8 sm:py-8 lg:max-w-none">
            <div className="mb-5 text-center sm:mb-6">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-xl sm:h-16 sm:w-16">
                <Lock size={24} />
              </div>

              <h2 className="text-[24px] font-extrabold text-slate-950 sm:text-[25px]">
                Entrar no sistema
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Informe seu email e senha para acessar
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-900">
                  Email
                </label>

                <div className="flex items-center rounded-xl border border-slate-300 bg-white px-3 focus-within:ring-2 focus-within:ring-slate-900/15">
                  <Mail size={18} className="text-slate-500" />

                  <input
                    type="email"
                    placeholder="Digite seu email"
                    className="w-full bg-transparent px-3 py-3 text-slate-900 outline-none placeholder:text-slate-500"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-900">
                  Senha
                </label>

                <div className="flex items-center rounded-xl border border-slate-300 bg-white px-3 focus-within:ring-2 focus-within:ring-slate-900/15">
                  <Lock size={18} className="text-slate-500" />

                  <input
                    type={mostrarSenha ? "text" : "password"}
                    placeholder="Digite sua senha"
                    className="w-full bg-transparent px-3 py-3 text-slate-900 outline-none placeholder:text-slate-500"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                  />

                  <button
                    type="button"
                    onClick={() => setMostrarSenha(!mostrarSenha)}
                    className="text-slate-500 hover:text-slate-900"
                  >
                    {mostrarSenha ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={carregando}
                className="w-full rounded-xl bg-slate-950 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:opacity-70"
              >
                {carregando ? "Entrando..." : "Entrar"}
              </button>
            </form>
          </section>
        </div>
      </section>
    </main>
  );
}

function Feature({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-white">
        {icon}
      </div>

      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-slate-300">{text}</p>
      </div>
    </div>
  );
}