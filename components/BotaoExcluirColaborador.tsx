"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function BotaoExcluirColaborador({
  colaboradorId,
}: {
  colaboradorId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function excluirColaborador() {
    const confirmar = window.confirm(
      "Tem certeza que deseja excluir este colaborador? Ele será inativado no sistema."
    );

    if (!confirmar) return;

    try {
      setLoading(true);

      const res = await fetch(`/api/admin/colaboradores/${colaboradorId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data?.error || "Erro ao excluir colaborador.");
        return;
      }

      router.push("/admin");

      setTimeout(() => {
        window.location.href = "/admin/colaboradores";
      }, 300);
    } catch {
      alert("Erro ao excluir colaborador.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={excluirColaborador}
      disabled={loading}
      className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-black text-red-300 shadow-[0_0_22px_rgba(239,68,68,0.08)] transition hover:border-red-400/60 hover:bg-red-500/20 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <Trash2 size={16} />
      {loading ? "Excluindo..." : "Excluir colaborador"}
    </button>
  );
}