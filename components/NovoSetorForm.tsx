"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

export default function NovoSetorForm() {
  const router = useRouter();

  const [nome, setNome] = useState("");
  const [loading, setLoading] = useState(false);

  async function criarSetor() {
    if (!nome.trim()) return alert("Informe o nome do setor.");

    setLoading(true);

    const res = await fetch("/api/admin/setores", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ nome }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      alert(data?.error || "Erro ao criar setor.");
      return;
    }

    setNome("");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3 md:flex-row">
      <input
  type="text"
  value={nome}
  onChange={(e) => setNome(e.target.value)}
  placeholder="Ex: Administrativo, Manutenção, TI..."
  className="
    h-14
    w-full
    rounded-2xl
    border
    border-white/10
    bg-[#020617]
    px-5
    text-base
    font-medium
    text-white
    placeholder:text-slate-500
    outline-none
    transition
    focus:border-cyan-400
    focus:ring-2
    focus:ring-cyan-400/20
  "
/>

      <button
        type="button"
        onClick={criarSetor}
        disabled={loading}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-60"
      >
        <Plus size={18} />
        {loading ? "Adicionando..." : "Adicionar setor"}
      </button>
    </div>
  );
}