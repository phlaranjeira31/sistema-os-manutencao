"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Trash2, Pencil } from "lucide-react";

type Setor = {
  id: string;
  nome: string;
  ativo: boolean;
};

export default function EditarSetorInline({ setor }: { setor: Setor }) {
  const router = useRouter();

  const [nome, setNome] = useState(setor.nome);
  const [ativo, setAtivo] = useState(setor.ativo);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function salvar() {
    if (!nome.trim()) return alert("Informe o nome do setor.");

    setLoading(true);

    const res = await fetch(`/api/admin/setores/${setor.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ nome, ativo }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      alert(data?.error || "Erro ao editar setor.");
      return;
    }

    router.refresh();
  }

  async function excluir() {
    const confirmar = confirm(
      `Tem certeza que deseja excluir o setor "${setor.nome}"?`
    );

    if (!confirmar) return;

    setDeleting(true);

    const res = await fetch(`/api/admin/setores/${setor.id}`, {
      method: "DELETE",
    });

    setDeleting(false);

    if (!res.ok) {
      const data = await res.json();
      alert(data?.error || "Erro ao excluir setor.");
      return;
    }

    router.refresh();
  }

  return (
    <div className="w-full rounded-3xl border border-white/10 bg-[#050816] p-4 shadow-lg">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300">
          <Pencil size={16} />
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
            Editar setor
          </p>
          <p className="text-sm text-slate-500">Atualize nome e status</p>
        </div>
      </div>

      <input
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        className="h-12 w-full rounded-xl border border-white/10 bg-[#080d1f] px-4 text-sm font-semibold text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
      />

      <label className="mt-4 flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-slate-300">
        <span>Setor ativo</span>

        <input
          type="checkbox"
          checked={ativo}
          onChange={(e) => setAtivo(e.target.checked)}
          className="h-4 w-4 accent-cyan-400"
        />
      </label>

      <button
        type="button"
        onClick={salvar}
        disabled={loading || deleting}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-black text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:scale-[1.02] hover:bg-cyan-300 disabled:opacity-60"
      >
        <Save size={17} />
        {loading ? "Salvando..." : "Salvar setor"}
      </button>

      <button
        type="button"
        onClick={excluir}
        disabled={loading || deleting}
        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-black text-red-300 transition hover:bg-red-500 hover:text-white disabled:opacity-60"
      >
        <Trash2 size={17} />
        {deleting ? "Excluindo..." : "Excluir setor"}
      </button>
    </div>
  );
}