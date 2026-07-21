"use client";

import {
  Save,
  ShieldAlert,
  Users,
  Wrench,
} from "lucide-react";
import { useMemo, useState } from "react";

type Maquina = {
  id: string;
  nome: string;
};

type Setor = {
  id: string;
  nome: string;
  maquinas: Maquina[];
};

type Colaborador = {
  id: string;
  nome: string;
  email: string;
};

type FormularioPreventivaProps = {
  setores: Setor[];
  colaboradores: Colaborador[];
};

export default function FormularioPreventiva({
  setores,
  colaboradores,
}: FormularioPreventivaProps) {
  const [setorId, setSetorId] = useState("");
  const [maquinaId, setMaquinaId] = useState("");

  const maquinasDisponiveis = useMemo(() => {
    return (
      setores.find((setor) => setor.id === setorId)?.maquinas ?? []
    );
  }, [setorId, setores]);

  function alterarSetor(novoSetorId: string) {
    setSetorId(novoSetorId);
    setMaquinaId("");
  }

  return (
    <form
      action="/api/admin/os/preventivas"
      method="POST"
      className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/30"
    >
      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-bold text-slate-300">
            Título
          </label>

          <input
            type="text"
            name="titulo"
            required
            placeholder="Ex: Troca de rolamento"
            className="h-14 w-full rounded-2xl border border-white/10 bg-[#050816] px-4 text-white outline-none focus:border-cyan-400"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-slate-300">
            Setor
          </label>

          <select
            name="setorId"
            required
            value={setorId}
            onChange={(event) => alterarSetor(event.target.value)}
            className="h-14 w-full rounded-2xl border border-white/10 bg-[#050816] px-4 text-white outline-none focus:border-cyan-400"
          >
            <option value="">
              Selecione o setor
            </option>

            {setores.map((setor) => (
              <option key={setor.id} value={setor.id}>
                {setor.nome}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-300">
            <Wrench size={16} />
            Máquina
            <span className="font-normal text-slate-500">
              (opcional)
            </span>
          </label>

          <select
            name="maquinaId"
            value={maquinaId}
            onChange={(event) => setMaquinaId(event.target.value)}
            disabled={!setorId || maquinasDisponiveis.length === 0}
            className="h-14 w-full rounded-2xl border border-white/10 bg-[#050816] px-4 text-white outline-none disabled:cursor-not-allowed disabled:opacity-50 focus:border-cyan-400"
          >
            <option value="">
              {!setorId
                ? "Selecione primeiro o setor"
                : maquinasDisponiveis.length === 0
                  ? "Nenhuma máquina cadastrada neste setor"
                  : "Nenhuma máquina selecionada"}
            </option>

            {maquinasDisponiveis.map((maquina) => (
              <option key={maquina.id} value={maquina.id}>
                {maquina.nome}
              </option>
            ))}
          </select>

          <p className="mt-2 text-xs text-slate-500">
            A preventiva pode ser salva sem selecionar uma máquina.
          </p>
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-bold text-slate-300">
            Descrição
          </label>

          <textarea
            name="descricao"
            required
            rows={5}
            placeholder="Detalhes da preventiva..."
            className="w-full rounded-2xl border border-white/10 bg-[#050816] p-4 text-white outline-none focus:border-cyan-400"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-slate-300">
            Prioridade
          </label>

          <select
            name="prioridade"
            className="h-14 w-full rounded-2xl border border-white/10 bg-[#050816] px-4 text-white outline-none focus:border-cyan-400"
          >
            <option value="BAIXA">Baixa</option>
            <option value="MEDIA">Média</option>
            <option value="ALTA">Alta</option>
            <option value="URGENTE">Urgente</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-slate-300">
            Data agendada
          </label>

          <input
            type="date"
            name="dataAgendada"
            required
            className="h-14 w-full rounded-2xl border border-white/10 bg-[#050816] px-4 text-white outline-none focus:border-cyan-400"
          />
        </div>

        <div>
          <label className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-300">
            <ShieldAlert size={16} />
            Avisar admins antes
          </label>

          <select
            name="diasAntesAviso"
            className="h-14 w-full rounded-2xl border border-white/10 bg-[#050816] px-4 text-white outline-none focus:border-cyan-400"
          >
            <option value="1">1 dia antes</option>
            <option value="2">2 dias antes</option>
            <option value="3">3 dias antes</option>
            <option value="7">7 dias antes</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <div className="mb-3">
            <label className="flex items-center gap-2 text-sm font-bold text-slate-300">
              <Users size={17} />
              Colaboradores responsáveis
              <span className="font-normal text-slate-500">
                (opcional)
              </span>
            </label>

            <p className="mt-1 text-xs text-slate-500">
              É possível selecionar mais de um colaborador.
            </p>
          </div>

          {colaboradores.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-[#050816] p-5 text-sm text-slate-400">
              Nenhum colaborador ativo disponível.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {colaboradores.map((colaborador) => (
                <label
                  key={colaborador.id}
                  className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-[#050816] p-4 transition hover:border-cyan-400/40 hover:bg-cyan-400/5"
                >
                  <input
                    type="checkbox"
                    name="responsavelIds"
                    value={colaborador.id}
                    className="mt-1 h-4 w-4 shrink-0 accent-cyan-400"
                  />

                  <span className="min-w-0">
                    <span className="block break-words text-sm font-bold text-white">
                      {colaborador.nome}
                    </span>

                    <span className="mt-1 block break-all text-xs text-slate-500">
                      {colaborador.email}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      <button
        type="submit"
        className="mt-8 inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-8 font-black text-slate-950 transition hover:scale-[1.02] hover:bg-cyan-300"
      >
        <Save size={18} />
        Salvar preventiva
      </button>
    </form>
  );
}