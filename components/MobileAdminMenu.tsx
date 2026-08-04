"use client";

import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import AdminMenu from "@/components/AdminMenu";

export default function MobileAdminMenu() {
  const [aberto, setAberto] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function carregar() {
      try {
        const res = await fetch("/api/auth/session");
        const data = await res.json();

        setIsAdmin(data?.user?.role === "ADMIN");
      } catch {
        setIsAdmin(false);
      }
    }

    carregar();
  }, []);

  useEffect(() => {
    if (!aberto) return;

    const overflowBodyAnterior =
      document.body.style.overflow;

    const overflowHtmlAnterior =
      document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    function fecharComEscape(
      event: globalThis.KeyboardEvent
    ) {
      if (event.key === "Escape") {
        setAberto(false);
      }
    }

    window.addEventListener(
      "keydown",
      fecharComEscape
    );

    return () => {
      document.body.style.overflow =
        overflowBodyAnterior;

      document.documentElement.style.overflow =
        overflowHtmlAnterior;

      window.removeEventListener(
        "keydown",
        fecharComEscape
      );
    };
  }, [aberto]);

  if (!isAdmin) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-500/15 text-cyan-100 shadow-[0_0_24px_rgba(34,211,238,0.12)] lg:hidden"
        aria-label="Abrir menu"
        aria-expanded={aberto}
        aria-controls="menu-administrador-mobile"
      >
        <Menu size={22} />
      </button>

      {aberto && (
        <div className="fixed inset-0 z-[2147483647] lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setAberto(false)}
            aria-label="Fechar menu"
          />

          <aside
            id="menu-administrador-mobile"
            className="absolute left-0 top-0 flex h-[100dvh] w-[88vw] max-w-[360px] flex-col overflow-hidden border-r border-white/10 bg-[#020617] text-white shadow-2xl"
          >
            <header className="flex shrink-0 items-center justify-between border-b border-white/10 px-5 pb-4 pt-[max(20px,env(safe-area-inset-top))]">
              <div className="min-w-0">
                <h2 className="truncate text-2xl font-extrabold leading-tight">
                  Sistema de OS
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  Menu administrador
                </p>
              </div>

              <button
                type="button"
                onClick={() => setAberto(false)}
                className="ml-4 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-200 transition hover:bg-white/10"
                aria-label="Fechar menu"
              >
                <X size={22} />
              </button>
            </header>

            <div
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-3 [&_nav]:space-y-0.5 [&_nav]:px-3 [&_nav_a>div]:!gap-3 [&_nav_a>div]:!px-3.5 [&_nav_a>div]:!py-2.5 [&_nav_a>div]:!text-[15px] [&_nav_svg]:!h-[18px] [&_nav_svg]:!w-[18px]"
              onClick={() => setAberto(false)}
            >
              <AdminMenu />
            </div>

            <footer className="shrink-0 border-t border-white/10 bg-[#020617] px-5 pb-[max(16px,env(safe-area-inset-bottom))] pt-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Desenvolvido por
              </p>

              <p className="mt-1 text-sm font-bold text-slate-200">
                Pedro H. Laranjeira
              </p>

              <p className="mt-1.5 text-xs font-semibold text-cyan-300">
                Versão 1.0.0
              </p>
            </footer>
          </aside>
        </div>
      )}
    </>
  );
}