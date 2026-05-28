"use client";

import { useEffect, useState } from "react";
import { Bell, LogOut, Plus, User } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

type Usuario = {
  id?: string;
  nome?: string;
  email?: string;
  fotoUrl?: string | null;
};

type Notificacao = {
  id: string;
  enviadaEm: string;
  osId: string;
  numero: number;
  titulo: string;
  descricao: string;
  setor: string;
};

function formatDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(date));
}

export default function HeaderUsuario() {
  const [usuario, setUsuario] = useState<Usuario>({});
  const [menuAberto, setMenuAberto] = useState(false);
  const [notificacoesAberto, setNotificacoesAberto] = useState(false);
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);

  useEffect(() => {
    const user = localStorage.getItem("user");

    if (user) {
      const parsed = JSON.parse(user);
      setUsuario(parsed);

      if (parsed.id) {
        fetch(`/api/admin/notificacoes?userId=${parsed.id}`)
          .then((res) => res.json())
          .then((data) => setNotificacoes(data))
          .catch(() => setNotificacoes([]));
      }
    }
  }, []);

  function logout() {
    localStorage.removeItem("user");
    window.location.href = "/login";
  }

  const inicial = usuario.nome?.charAt(0).toUpperCase() || "U";

  return (
    <header className="relative z-[9999] border-b border-white/10 bg-[#020617]/80 backdrop-blur-xl">
      <div className="flex flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:py-6">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex shrink-0 items-center justify-center">
  <Image
  src="/logo.sequoia.png?v=2"
  alt="Sequoia"
  width={110}
  height={40}
  className="h-10 w-auto object-contain"
  priority
/>
</div>

          <div className="min-w-0">
            <h2 className="truncate text-xl font-extrabold tracking-tight text-white sm:text-2xl">
              Dashboard
            </h2>

            <p className="mt-1 truncate text-sm text-slate-400">
              Bem-vindo, {usuario.nome || "Administrador"}
            </p>
          </div>
        </div>

        <div className="flex w-full flex-wrap items-center gap-3 lg:w-auto lg:justify-end">
          <div className="relative">
            <button
              type="button"
              onClick={() => setNotificacoesAberto(!notificacoesAberto)}
              className="relative flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-200 transition hover:border-cyan-400/40 hover:bg-cyan-400/10 hover:text-cyan-200"
            >
              <Bell size={19} />

              {notificacoes.length > 0 && (
                <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-[0_0_18px_rgba(239,68,68,0.6)]">
                  {notificacoes.length}
                </span>
              )}
            </button>

            {notificacoesAberto && (
              <div className="absolute left-0 z-[99999] mt-2 flex max-h-[360px] w-[320px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#020617]/95 p-3 shadow-2xl shadow-cyan-950/30 backdrop-blur-xl sm:left-auto sm:right-0 sm:w-[340px]">
                <h3 className="px-2 py-2 text-sm font-black text-white">
                  Notificações
                </h3>

                {notificacoes.length === 0 ? (
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-400">
                    Nenhuma OS enviada para você.
                  </div>
                ) : (
                  <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-2 pb-3">
                    {notificacoes.map((notificacao) => (
                      <Link
                        key={notificacao.id}
                        href={`/admin/os/${notificacao.osId}`}
                        className="block rounded-xl border border-white/10 bg-white/5 p-3 text-sm transition hover:border-cyan-400/40 hover:bg-cyan-400/10"
                      >
                        <p className="text-xs font-bold text-cyan-300">
                          OS #{notificacao.numero}
                        </p>

                        <h4 className="mt-1 break-words text-sm font-black text-white">
                          {notificacao.titulo}
                        </h4>

                        <p className="mt-1 line-clamp-2 break-words text-xs text-slate-400">
                          {notificacao.descricao}
                        </p>

                        <p className="mt-2 text-xs text-slate-400">
                          <strong className="text-slate-300">Setor:</strong>{" "}
                          {notificacao.setor}
                        </p>

                        <p className="mt-3 text-xs font-semibold text-slate-500">
                          Enviada em {formatDate(notificacao.enviadaEm)}
                        </p>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <Link
            href="/admin/os/nova"
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-500/15 px-4 py-3 text-sm font-bold text-cyan-100 shadow-[0_0_30px_rgba(34,211,238,0.14)] transition hover:bg-cyan-400/20 sm:flex-none sm:px-5"
          >
            <Plus size={18} />
            Nova OS
          </Link>

          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuAberto(!menuAberto)}
              className="flex max-w-full cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 transition hover:border-cyan-400/40 hover:bg-white/10"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-cyan-400/30 bg-[#020617] text-sm font-bold text-cyan-200">
                {usuario.fotoUrl ? (
                  <img
                    src={usuario.fotoUrl}
                    alt={usuario.nome || "Usuário"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  inicial
                )}
              </div>

              <div className="hidden min-w-0 text-left md:block">
                <p className="max-w-56 truncate text-sm font-bold text-white">
                  {usuario.nome || "Usuário"}
                </p>
                <p className="max-w-56 truncate text-xs text-slate-400">
                  {usuario.email || "Online"}
                </p>
              </div>
            </button>

            {menuAberto && (
              <div className="absolute right-0 z-50 mt-2 w-56 rounded-2xl border border-white/10 bg-[#020617]/95 p-2 shadow-2xl shadow-cyan-950/30 backdrop-blur-xl">
                <Link
                  href="/admin/perfil"
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
                >
                  <User size={16} />
                  Perfil
                </Link>

                <button
                  type="button"
                  onClick={logout}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-red-400 transition hover:bg-red-500/10 hover:text-red-300"
                >
                  <LogOut size={16} />
                  Sair
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}