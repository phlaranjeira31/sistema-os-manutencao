"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function BotaoExcluirPreventiva({ id }: { id: string }) {
  const router = useRouter();

  async function excluir() {
    const confirmar = confirm("Tem certeza que deseja excluir esta preventiva?");

    if (!confirmar) return;

    const res = await fetch(`/api/admin/os/preventivas/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      alert("Erro ao excluir preventiva.");
      return;
    }

    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={excluir}
      className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 text-sm font-black text-red-300 transition hover:bg-red-500 hover:text-white"
    >
      <Trash2 size={16} />
      Excluir
    </button>
  );
}