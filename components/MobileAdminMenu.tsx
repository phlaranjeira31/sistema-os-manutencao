"use client";

import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import AdminMenu from "@/components/AdminMenu";

export default function MobileAdminMenu() {
  const [aberto, setAberto] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function carregar() {
      const res = await fetch("/api/auth/session");
      const data = await res.json();

      setIsAdmin(data?.user?.role === "ADMIN");
    }

    carregar();
  }, []);

  if (!isAdmin) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-500/15 text-cyan-100 lg:hidden"
      >
        <Menu size={22} />
      </button>

      {aberto && (
        <div className="fixed inset-0 z-[999999] lg:hidden">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setAberto(false)}
          />

          <aside className="absolute left-0 top-0 h-full w-80 max-w-[85vw] overflow-y-auto border-r border-white/10 bg-[#020617] py-5 text-white shadow-2xl">
            <div className="mb-5 flex items-center justify-between px-5">
              <div>
                <h2 className="text-xl font-extrabold">Sistema de OS</h2>
                <p className="text-sm text-slate-400">Menu administrador</p>
              </div>

              <button
                type="button"
                onClick={() => setAberto(false)}
                className="rounded-xl border border-white/10 bg-white/5 p-2"
              >
                <X size={20} />
              </button>
            </div>

            <AdminMenu />
          </aside>
        </div>
      )}
    </>
  );
}