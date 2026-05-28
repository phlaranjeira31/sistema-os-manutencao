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

  if (!isAdmin) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-500/15 text-cyan-100 shadow-[0_0_24px_rgba(34,211,238,0.12)] lg:hidden"
        aria-label="Abrir menu"
      >
        <Menu size={22} />
      </button>

      {aberto && (
        <div className="fixed inset-0 z-[999999] lg:hidden">
          <div
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            onClick={() => setAberto(false)}
          />

          <aside className="absolute left-0 top-0 flex h-dvh w-[86vw] max-w-[330px] flex-col overflow-hidden border-r border-white/10 bg-[#020617] text-white shadow-2xl">
            <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-5 py-5">
              <div>
                <h2 className="text-xl font-extrabold leading-tight">
                  Sistema de OS
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                  Menu administrador
                </p>
              </div>

              <button
                type="button"
                onClick={() => setAberto(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
                aria-label="Fechar menu"
              >
                <X size={20} />
              </button>
            </div>

            <div
              className="min-h-0 flex-1 overflow-y-auto py-4"
              onClick={() => setAberto(false)}
            >
              <AdminMenu />
            </div>
          </aside>
        </div>
      )}
    </>
  );
}