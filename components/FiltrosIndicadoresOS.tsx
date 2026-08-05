"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  Building2,
  CalendarDays,
  ClipboardList,
  Factory,
  Search,
  Users,
  Wrench,
} from "lucide-react";
import { useMemo, useState } from "react";

type Empresa = {
  id: string;
  nome: string;
  sigla: string;
};

type Setor = {
  id: string;
  nome: string;
  empresaId: string;
};

type Maquina = {
  id: string;
  nome: string;
  setorId: string;
};

type Colaborador = {
  id: string;
  nome: string;
};

type FiltrosIniciais = {
  dataInicio: string;
  dataFim: string;
  empresa: string;
  status: string;
  setor: string;
  maquina: string;
  colaborador: string;
};

type Props = {
  empresas: Empresa[];
  setores: Setor[];
  maquinas: Maquina[];
  colaboradores: Colaborador[];
  filtrosIniciais: FiltrosIniciais;
  acoesExportacao?: ReactNode;
};

const STATUS_OPTIONS = [
  {
    value: "NAO_INICIADA",
    label: "Não iniciada",
  },
  {
    value: "EM_ANDAMENTO",
    label: "Em andamento",
  },
  {
    value: "CONCLUIDA",
    label: "Concluída",
  },
  {
    value: "CANCELADA",
    label: "Cancelada",
  },
];

export default function FiltrosIndicadoresOS({
  empresas,
  setores,
  maquinas,
  colaboradores,
  filtrosIniciais,
  acoesExportacao,
}: Props) {
  const [empresaSelecionada, setEmpresaSelecionada] =
    useState(filtrosIniciais.empresa);

  const [setorSelecionado, setSetorSelecionado] =
    useState(filtrosIniciais.setor);

  const [maquinaSelecionada, setMaquinaSelecionada] =
    useState(filtrosIniciais.maquina);

  const setoresFiltrados = useMemo(() => {
    if (!empresaSelecionada) {
      return [];
    }

    return setores.filter(
      (setor) =>
        setor.empresaId === empresaSelecionada
    );
  }, [empresaSelecionada, setores]);

  const maquinasFiltradas = useMemo(() => {
    if (!setorSelecionado) {
      return [];
    }

    return maquinas.filter(
      (maquina) =>
        maquina.setorId === setorSelecionado
    );
  }, [maquinas, setorSelecionado]);

  function alterarEmpresa(
    event: React.ChangeEvent<HTMLSelectElement>
  ) {
    const novaEmpresa = event.target.value;

    setEmpresaSelecionada(novaEmpresa);
    setSetorSelecionado("");
    setMaquinaSelecionada("");
  }

  function alterarSetor(
    event: React.ChangeEvent<HTMLSelectElement>
  ) {
    const novoSetor = event.target.value;

    setSetorSelecionado(novoSetor);
    setMaquinaSelecionada("");
  }

  return (
    <form
      action="/admin/os/indicadores"
      method="GET"
      className="space-y-5"
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
        {/* DATA INICIAL */}
        <div>
          <label className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-400">
            <CalendarDays size={16} />
            Data inicial
          </label>

          <input
            name="dataInicio"
            defaultValue={filtrosIniciais.dataInicio}
            type="date"
            className="h-14 w-full rounded-2xl border border-white/10 bg-[#050816] px-4 text-sm font-semibold text-white outline-none transition focus:border-cyan-400"
          />
        </div>

        {/* DATA FINAL */}
        <div>
          <label className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-400">
            <CalendarDays size={16} />
            Data final
          </label>

          <input
            name="dataFim"
            defaultValue={filtrosIniciais.dataFim}
            type="date"
            className="h-14 w-full rounded-2xl border border-white/10 bg-[#050816] px-4 text-sm font-semibold text-white outline-none transition focus:border-cyan-400"
          />
        </div>

        {/* EMPRESA */}
        <div>
          <label className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-400">
            <Factory size={16} />
            Empresa
          </label>

          <select
            name="empresa"
            value={empresaSelecionada}
            onChange={alterarEmpresa}
            className="h-14 w-full rounded-2xl border border-white/10 bg-[#050816] px-4 text-sm font-semibold text-white outline-none transition focus:border-cyan-400"
          >
            <option value="">
              Todas as empresas
            </option>

            {empresas.map((empresa) => (
              <option
                key={empresa.id}
                value={empresa.id}
              >
                {empresa.nome} — {empresa.sigla}
              </option>
            ))}
          </select>
        </div>

        {/* SETOR */}
        <div>
          <label className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-400">
            <Building2 size={16} />
            Setor
          </label>

          <select
            name="setor"
            value={setorSelecionado}
            onChange={alterarSetor}
            disabled={!empresaSelecionada}
            className="h-14 w-full rounded-2xl border border-white/10 bg-[#050816] px-4 text-sm font-semibold text-white outline-none transition focus:border-cyan-400 disabled:cursor-not-allowed disabled:opacity-45"
          >
            <option value="">
              {empresaSelecionada
                ? "Todos os setores"
                : "Selecione uma empresa"}
            </option>

            {setoresFiltrados.map((setor) => (
              <option
                key={setor.id}
                value={setor.id}
              >
                {setor.nome}
              </option>
            ))}
          </select>
        </div>

        {/* MÁQUINA OU EQUIPAMENTO */}
        <div>
          <label className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-400">
            <Wrench size={16} />
            Máquina/equipamento
          </label>

          <select
            name="maquina"
            value={maquinaSelecionada}
            onChange={(event) =>
              setMaquinaSelecionada(
                event.target.value
              )
            }
            disabled={!setorSelecionado}
            className="h-14 w-full rounded-2xl border border-white/10 bg-[#050816] px-4 text-sm font-semibold text-white outline-none transition focus:border-cyan-400 disabled:cursor-not-allowed disabled:opacity-45"
          >
            <option value="">
              {setorSelecionado
                ? "Todas as máquinas"
                : "Selecione um setor"}
            </option>

            {maquinasFiltradas.map((maquina) => (
              <option
                key={maquina.id}
                value={maquina.id}
              >
                {maquina.nome}
              </option>
            ))}
          </select>
        </div>

        {/* STATUS */}
        <div>
          <label className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-400">
            <ClipboardList size={16} />
            Status
          </label>

          <select
            name="status"
            defaultValue={filtrosIniciais.status}
            className="h-14 w-full rounded-2xl border border-white/10 bg-[#050816] px-4 text-sm font-semibold text-white outline-none transition focus:border-cyan-400"
          >
            <option value="">
              Todos os status
            </option>

            {STATUS_OPTIONS.map((status) => (
              <option
                key={status.value}
                value={status.value}
              >
                {status.label}
              </option>
            ))}
          </select>
        </div>

        {/* COLABORADOR */}
        <div>
          <label className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-400">
            <Users size={16} />
            Colaborador
          </label>

          <select
            name="colaborador"
            defaultValue={
              filtrosIniciais.colaborador
            }
            className="h-14 w-full rounded-2xl border border-white/10 bg-[#050816] px-4 text-sm font-semibold text-white outline-none transition focus:border-cyan-400"
          >
            <option value="">
              Todos os colaboradores
            </option>

            {colaboradores.map(
              (colaborador) => (
                <option
                  key={colaborador.id}
                  value={colaborador.id}
                >
                  {colaborador.nome}
                </option>
              )
            )}
          </select>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <button
          type="submit"
          className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-4 text-sm font-black text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-300"
        >
          <Search size={17} />
          Filtrar
        </button>

        <Link
          href="/admin/os/indicadores"
          className="inline-flex h-14 w-full items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-black text-white transition hover:bg-white/10"
        >
          Limpar filtros
        </Link>

        {acoesExportacao}
      </div>
    </form>
  );
}