"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  os: {
    id: string;
    titulo: string;
    descricao: string;
    setorId: string;
    status: string;
    prioridade: string;
    dataInicio: Date | string | null;
    dataPrevista: Date | string | null;
    dataConclusao: Date | string | null;
    anotacoes: string | null;
    registroFinal: string | null;
  };
};

function toInputDate(value: Date | string | null) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

export default function AlterarStatusRelatorio({ os }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState(os.status);
  const [loading, setLoading] = useState(false);

  async function alterarStatus(novoStatus: string) {
    setStatus(novoStatus);
    setLoading(true);

    const res = await fetch(`/api/admin/os/${os.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        titulo: os.titulo,
        descricao: os.descricao,
        setorId: os.setorId,
        status: novoStatus,
        prioridade: os.prioridade,
        dataInicio: toInputDate(os.dataInicio),
        dataPrevista: toInputDate(os.dataPrevista),
        dataConclusao: toInputDate(os.dataConclusao),
        anotacoes: os.anotacoes ?? "",
        registroFinal: os.registroFinal ?? "",
      }),
    });

    setLoading(false);

    if (!res.ok) {
      alert("Erro ao alterar status.");
      setStatus(os.status);
      return;
    }

    router.refresh();
  }

  return (
    <select
      value={status}
      onChange={(e) => alterarStatus(e.target.value)}
      disabled={loading}
      className="mt-1 w-full rounded-xl border border-white/10 bg-[#050816] px-3 py-2 text-sm font-bold text-white outline-none focus:border-cyan-400"
    >
      <option value="NAO_INICIADA">Não iniciada</option>
      <option value="EM_ANDAMENTO">Em andamento</option>
      <option value="CONCLUIDA">Concluída</option>
      <option value="CANCELADA">Cancelada</option>
    </select>
  );
}