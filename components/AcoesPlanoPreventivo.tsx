"use client";

import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  planoId: string;
  titulo: string;
};

export default function AcoesPlanoPreventivo({
  planoId,
  titulo,
}: Props) {
  const router = useRouter();

  const [excluindo, setExcluindo] =
    useState(false);

  async function excluirPlano() {
    const confirmar = window.confirm(
      `Deseja realmente excluir o plano "${titulo}"?\n\n` +
        "Essa ação também excluirá as execuções programadas vinculadas a este plano."
    );

    if (!confirmar) {
      return;
    }

    try {
      setExcluindo(true);

      const resposta = await fetch(
        `/api/admin/os/preventivas/planos/${planoId}`,
        {
          method: "DELETE",
        }
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        alert(
          dados?.error ??
            "Erro ao excluir plano preventivo."
        );

        return;
      }

      router.refresh();
    } catch (error) {
      console.error(
        "Erro ao excluir plano:",
        error
      );

      alert(
        "Erro ao excluir plano preventivo."
      );
    } finally {
      setExcluindo(false);
    }
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      <Link
        href={`/admin/os/preventivas/planos/${planoId}/editar`}
        className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-cyan-400/30 bg-cyan-500/10 px-4 text-sm font-black text-cyan-300 transition hover:bg-cyan-400 hover:text-slate-950"
      >
        <Pencil size={17} />

        Editar
      </Link>

      <button
        type="button"
        onClick={excluirPlano}
        disabled={excluindo}
        className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 text-sm font-black text-red-300 transition hover:bg-red-400 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Trash2 size={17} />

        {excluindo
          ? "Excluindo..."
          : "Excluir"}
      </button>
    </div>
  );
}