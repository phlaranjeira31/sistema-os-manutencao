"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";

type Setor = {
  id: string;
  nome: string;
};

type OrdemServico = {
  id: string;
  numero: number;
  titulo: string;
  descricao: string;
  status: string;
  prioridade: string;
  dataInicio: Date | string | null;
  dataPrevista: Date | string | null;
  dataConclusao: Date | string | null;
  anotacoes: string | null;
  registroFinal: string | null;
  setorId: string;
};

function toInputDate(value: Date | string | null) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

export default function EditarOSForm({
  os,
  setores,
}: {
  os: OrdemServico;
  setores: Setor[];
}) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  const [titulo, setTitulo] = useState(os.titulo);
  const [descricao, setDescricao] = useState(os.descricao);
  const [setorId, setSetorId] = useState(os.setorId);
  const [status, setStatus] = useState(os.status);
  const [prioridade, setPrioridade] = useState(os.prioridade);
  const [dataInicio, setDataInicio] = useState(toInputDate(os.dataInicio));
  const [dataPrevista, setDataPrevista] = useState(
    toInputDate(os.dataPrevista)
  );
  const [dataConclusao, setDataConclusao] = useState(
    toInputDate(os.dataConclusao)
  );
  const [anotacoes, setAnotacoes] = useState(os.anotacoes ?? "");
  const [registroFinal, setRegistroFinal] = useState(os.registroFinal ?? "");

  async function salvar() {
    if (!titulo.trim()) return alert("Informe o título.");
    if (!descricao.trim()) return alert("Informe a descrição.");
    if (!setorId) return alert("Selecione o setor.");

    setLoading(true);

    const res = await fetch(`/api/admin/os/${os.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        titulo,
        descricao,
        setorId,
        status,
        prioridade,
        dataInicio,
        dataPrevista,
        dataConclusao,
        anotacoes,
        registroFinal,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      alert(data?.error || "Erro ao salvar OS.");
      return;
    }

    alert("OS atualizada com sucesso.");
    router.push("/admin/os/editar");
    router.refresh();
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-[#080d1f] p-6 shadow-2xl shadow-black/30">
      <div className="grid gap-5 md:grid-cols-2">
        
        {/* TÍTULO */}
        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-bold text-slate-400">
            Título
          </label>
          <input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            className="h-12 w-full rounded-xl border border-white/10 bg-[#050816] px-4 text-sm font-semibold text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
          />
        </div>

        {/* SETOR */}
        <div>
          <label className="mb-2 block text-sm font-bold text-slate-400">
            Setor
          </label>
          <select
            value={setorId}
            onChange={(e) => setSetorId(e.target.value)}
            className="h-12 w-full rounded-xl border border-white/10 bg-[#050816] px-4 text-sm font-semibold text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
          >
            <option value="">Selecione...</option>
            {setores.map((setor) => (
              <option key={setor.id} value={setor.id}>
                {setor.nome}
              </option>
            ))}
          </select>
        </div>

        {/* PRIORIDADE */}
        <div>
          <label className="mb-2 block text-sm font-bold text-slate-400">
            Prioridade
          </label>
          <select
            value={prioridade}
            onChange={(e) => setPrioridade(e.target.value)}
            className="h-12 w-full rounded-xl border border-white/10 bg-[#050816] px-4 text-sm font-semibold text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
          >
            <option value="BAIXA">Baixa</option>
            <option value="MEDIA">Média</option>
            <option value="ALTA">Alta</option>
            <option value="URGENTE">Urgente</option>
          </select>
        </div>

        {/* STATUS */}
        <div>
          <label className="mb-2 block text-sm font-bold text-slate-400">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="h-12 w-full rounded-xl border border-white/10 bg-[#050816] px-4 text-sm font-semibold text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
          >
            <option value="NAO_INICIADA">Não iniciada</option>
            <option value="EM_ANDAMENTO">Em andamento</option>
            <option value="CONCLUIDA">Concluída</option>
            <option value="CANCELADA">Cancelada</option>
          </select>
        </div>

        {/* DATAS */}
        <div>
          <label className="mb-2 block text-sm font-bold text-slate-400">
            Data de início
          </label>
          <input
            type="date"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
            className="h-12 w-full rounded-xl border border-white/10 bg-[#050816] px-4 text-sm font-semibold text-white outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-slate-400">
            Data prevista
          </label>
          <input
            type="date"
            value={dataPrevista}
            onChange={(e) => setDataPrevista(e.target.value)}
            className="h-12 w-full rounded-xl border border-white/10 bg-[#050816] px-4 text-sm font-semibold text-white outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-slate-400">
            Data de conclusão
          </label>
          <input
            type="date"
            value={dataConclusao}
            onChange={(e) => setDataConclusao(e.target.value)}
            className="h-12 w-full rounded-xl border border-white/10 bg-[#050816] px-4 text-sm font-semibold text-white outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
          />
        </div>

        {/* DESCRIÇÃO */}
        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-bold text-slate-400">
            Descrição
          </label>
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            rows={5}
            className="w-full resize-none rounded-xl border border-white/10 bg-[#050816] px-4 py-3 text-sm font-semibold text-white outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
          />
        </div>

        {/* ANOTAÇÕES */}
        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-bold text-slate-400">
            Anotações
          </label>
          <textarea
            value={anotacoes}
            onChange={(e) => setAnotacoes(e.target.value)}
            rows={4}
            className="w-full resize-none rounded-xl border border-white/10 bg-[#050816] px-4 py-3 text-sm font-semibold text-white outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
          />
        </div>

        {/* REGISTRO FINAL */}
        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-bold text-slate-400">
            Registro final
          </label>
          <textarea
            value={registroFinal}
            onChange={(e) => setRegistroFinal(e.target.value)}
            rows={4}
            className="w-full resize-none rounded-xl border border-white/10 bg-[#050816] px-4 py-3 text-sm font-semibold text-white outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
          />
        </div>
      </div>

      {/* BOTÃO */}
      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={salvar}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-2xl bg-cyan-400 px-6 py-3 text-sm font-black text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:scale-[1.03] hover:bg-cyan-300 disabled:opacity-60"
        >
          <Save size={18} />
          {loading ? "Salvando..." : "Salvar alterações"}
        </button>
      </div>
    </section>
  );
}