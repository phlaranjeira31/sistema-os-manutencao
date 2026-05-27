"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";

type Colaborador = {
  id: string;
  nome: string;
  email: string;
};

export default function AtribuirOSForm({
  osId,
  colaboradores,
}: {
  osId: string;
  colaboradores: Colaborador[];
}) {
  const router = useRouter();

  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(false);

  async function atribuir() {
    if (!userId) return alert("Selecione um colaborador.");

    setLoading(true);

    const res = await fetch(`/api/admin/os/${osId}/atribuir`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      alert(data?.error || "Erro ao atribuir OS.");
      return;
    }

    router.refresh();
  }

  return (
    <div className="mt-4 flex w-full flex-col gap-3 sm:flex-row">
      
      {/* SELECT PADRÃO DO SISTEMA */}
      <div className="relative w-full flex-1">
        <select
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          className="
            w-full
            appearance-none
            rounded-xl
            border border-white/10
            bg-[#050816]
            px-4 py-2.5
            pr-10
            text-sm font-semibold text-white
            outline-none
            transition
            focus:border-cyan-400
          "
        >
          <option value="" className="bg-[#050816] text-slate-400">
            Enviar para colaborador:
          </option>

          {colaboradores.map((colaborador) => (
            <option
              key={colaborador.id}
              value={colaborador.id}
              className="bg-[#050816] text-white"
            >
              {colaborador.nome}
            </option>
          ))}
        </select>

        {/* SETA CUSTOM */}
        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
          ▼
        </div>
      </div>

      {/* BOTÃO */}
      <button
        type="button"
        onClick={atribuir}
        disabled={loading}
        className="
          flex w-full items-center justify-center gap-2
          rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white
          hover:bg-slate-800 disabled:opacity-60
          sm:w-auto
        "
      >
        <Send size={16} />
        {loading ? "Enviando..." : "Enviar"}
      </button>
    </div>
  );
}