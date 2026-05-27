"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AtualizarStatusOS({
  osId,
  statusAtual,
}: {
  osId: string;
  statusAtual: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(statusAtual);
  const [loading, setLoading] = useState(false);

  async function atualizarStatus(novoStatus: string) {
    setStatus(novoStatus);
    setLoading(true);

    const res = await fetch(`/api/admin/os/${osId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: novoStatus }),
    });

    setLoading(false);

    if (!res.ok) {
      alert("Erro ao atualizar status.");
      return;
    }

    router.refresh();
  }

  return (
    <select
      value={status}
      disabled={loading}
      onChange={(e) => atualizarStatus(e.target.value)}
      className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 font-bold text-slate-950 outline-none focus:ring-2 focus:ring-slate-950"
    >
      <option value="NAO_INICIADA">Não iniciada</option>
      <option value="EM_ANDAMENTO">Em andamento</option>
      <option value="CONCLUIDA">Concluída</option>
      <option value="CANCELADA">Cancelada</option>
    </select>
  );
}