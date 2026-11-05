"use client";

import type {
  ReactNode,
} from "react";
import Link from "next/link";
import {
  Activity,
  Building2,
  CalendarDays,
  Factory,
  Filter,
  Gauge,
  RotateCcw,
  Search,
  UserRound,
  Users,
  Wrench,
} from "lucide-react";
import {
  useMemo,
  useState,
} from "react";

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
  prioridade: string;
  setor: string;
  maquina: string;
  colaborador: string;
  criadoPor: string;
};

type Props = {
  empresas: Empresa[];
  setores: Setor[];
  maquinas: Maquina[];
  colaboradores: Colaborador[];
  criadores: Colaborador[];
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

const PRIORIDADE_OPTIONS = [
  {
    value: "BAIXA",
    label: "Baixa",
  },
  {
    value: "MEDIA",
    label: "Média",
  },
  {
    value: "ALTA",
    label: "Alta",
  },
  {
    value: "URGENTE",
    label: "Urgente",
  },
];

const inputClass =
  "h-11 w-full rounded-xl border border-white/[0.08] bg-[#030817] px-3 text-sm font-semibold text-white outline-none transition focus:border-cyan-400/40 disabled:cursor-not-allowed disabled:opacity-45";

export default function FiltrosIndicadoresOS({
  empresas,
  setores,
  maquinas,
  colaboradores,
  criadores,
  filtrosIniciais,
  acoesExportacao,
}: Props) {
  const [
    empresaSelecionada,
    setEmpresaSelecionada,
  ] =
    useState(
      filtrosIniciais.empresa
    );

  const [
    setorSelecionado,
    setSetorSelecionado,
  ] =
    useState(
      filtrosIniciais.setor
    );

  const [
    maquinaSelecionada,
    setMaquinaSelecionada,
  ] =
    useState(
      filtrosIniciais.maquina
    );

  const setoresFiltrados =
    useMemo(() => {
      if (
        !empresaSelecionada
      ) {
        return [];
      }

      return setores.filter(
        (setor) =>
          setor.empresaId ===
          empresaSelecionada
      );
    }, [
      empresaSelecionada,
      setores,
    ]);

  const maquinasFiltradas =
    useMemo(() => {
      if (
        !setorSelecionado
      ) {
        return [];
      }

      return maquinas.filter(
        (maquina) =>
          maquina.setorId ===
          setorSelecionado
      );
    }, [
      maquinas,
      setorSelecionado,
    ]);

  function alterarEmpresa(
    event: React.ChangeEvent<HTMLSelectElement>
  ) {
    const novaEmpresa =
      event.target.value;

    setEmpresaSelecionada(
      novaEmpresa
    );

    setSetorSelecionado(
      ""
    );

    setMaquinaSelecionada(
      ""
    );
  }

  function alterarSetor(
    event: React.ChangeEvent<HTMLSelectElement>
  ) {
    const novoSetor =
      event.target.value;

    setSetorSelecionado(
      novoSetor
    );

    setMaquinaSelecionada(
      ""
    );
  }

  return (
    <form
      action="/admin/os/indicadores"
      method="GET"
      className="space-y-4"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-400/15 bg-cyan-400/[0.05] text-cyan-300">
            <Filter size={18} />
          </div>

          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.12em] text-cyan-300">
              Refinar análise
            </p>

            <h2 className="mt-0.5 text-base font-black text-white">
              Filtros dos indicadores
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              O período filtra pela data de abertura da OS.
            </p>
          </div>
        </div>

        <p className="hidden text-[10px] font-bold uppercase tracking-[0.08em] text-slate-700 lg:block">
          Empresa → Setor → Máquina
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
        <Campo
          label="Data inicial"
          icon={
            <CalendarDays
              size={14}
            />
          }
        >
          <input
            name="dataInicio"
            defaultValue={
              filtrosIniciais.dataInicio
            }
            type="date"
            className={
              inputClass
            }
          />
        </Campo>

        <Campo
          label="Data final"
          icon={
            <CalendarDays
              size={14}
            />
          }
        >
          <input
            name="dataFim"
            defaultValue={
              filtrosIniciais.dataFim
            }
            type="date"
            className={
              inputClass
            }
          />
        </Campo>

        <Campo
          label="Empresa"
          icon={
            <Factory
              size={14}
            />
          }
        >
          <select
            name="empresa"
            value={
              empresaSelecionada
            }
            onChange={
              alterarEmpresa
            }
            className={
              inputClass
            }
          >
            <option value="">
              Todas as empresas
            </option>

            {empresas.map(
              (empresa) => (
                <option
                  key={
                    empresa.id
                  }
                  value={
                    empresa.id
                  }
                >
                  {empresa.nome} —{" "}
                  {
                    empresa.sigla
                  }
                </option>
              )
            )}
          </select>
        </Campo>

        <Campo
          label="Setor"
          icon={
            <Building2
              size={14}
            />
          }
        >
          <select
            name="setor"
            value={
              setorSelecionado
            }
            onChange={
              alterarSetor
            }
            disabled={
              !empresaSelecionada
            }
            className={
              inputClass
            }
          >
            <option value="">
              {empresaSelecionada
                ? "Todos os setores"
                : "Selecione uma empresa"}
            </option>

            {setoresFiltrados.map(
              (setor) => (
                <option
                  key={
                    setor.id
                  }
                  value={
                    setor.id
                  }
                >
                  {
                    setor.nome
                  }
                </option>
              )
            )}
          </select>
        </Campo>

        <Campo
          label="Máquina / equipamento"
          icon={
            <Wrench
              size={14}
            />
          }
        >
          <select
            name="maquina"
            value={
              maquinaSelecionada
            }
            onChange={(
              event
            ) =>
              setMaquinaSelecionada(
                event
                  .target
                  .value
              )
            }
            disabled={
              !setorSelecionado
            }
            className={
              inputClass
            }
          >
            <option value="">
              {setorSelecionado
                ? "Todas as máquinas"
                : "Selecione um setor"}
            </option>

            {maquinasFiltradas.map(
              (maquina) => (
                <option
                  key={
                    maquina.id
                  }
                  value={
                    maquina.id
                  }
                >
                  {
                    maquina.nome
                  }
                </option>
              )
            )}
          </select>
        </Campo>

        <Campo
          label="Status"
          icon={
            <Activity
              size={14}
            />
          }
        >
          <select
            name="status"
            defaultValue={
              filtrosIniciais.status
            }
            className={
              inputClass
            }
          >
            <option value="">
              Todos os status
            </option>

            {STATUS_OPTIONS.map(
              (status) => (
                <option
                  key={
                    status.value
                  }
                  value={
                    status.value
                  }
                >
                  {
                    status.label
                  }
                </option>
              )
            )}
          </select>
        </Campo>

        <Campo
          label="Prioridade"
          icon={
            <Gauge
              size={14}
            />
          }
        >
          <select
            name="prioridade"
            defaultValue={
              filtrosIniciais.prioridade
            }
            className={
              inputClass
            }
          >
            <option value="">
              Todas as prioridades
            </option>

            {PRIORIDADE_OPTIONS.map(
              (
                prioridade
              ) => (
                <option
                  key={
                    prioridade.value
                  }
                  value={
                    prioridade.value
                  }
                >
                  {
                    prioridade.label
                  }
                </option>
              )
            )}
          </select>
        </Campo>

        <Campo
          label="Colaborador"
          icon={
            <Users
              size={14}
            />
          }
        >
          <select
            name="colaborador"
            defaultValue={
              filtrosIniciais.colaborador
            }
            className={
              inputClass
            }
          >
            <option value="">
              Todos os colaboradores
            </option>

            {colaboradores.map(
              (
                colaborador
              ) => (
                <option
                  key={
                    colaborador.id
                  }
                  value={
                    colaborador.id
                  }
                >
                  {
                    colaborador.nome
                  }
                </option>
              )
            )}
          </select>
        </Campo>

        <Campo
          label="Criada por"
          icon={
            <UserRound
              size={14}
            />
          }
        >
          <select
            name="criadoPor"
            defaultValue={
              filtrosIniciais.criadoPor
            }
            className={
              inputClass
            }
          >
            <option value="">
              Todos os criadores
            </option>

            {criadores.map(
              (criador) => (
                <option
                  key={
                    criador.id
                  }
                  value={
                    criador.id
                  }
                >
                  {
                    criador.nome
                  }
                </option>
              )
            )}
          </select>
        </Campo>

        <div className="flex items-end">
          <button
            type="submit"
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 text-sm font-black text-slate-950 shadow-[0_8px_24px_rgba(34,211,238,.12)] transition hover:bg-cyan-300"
          >
            <Search
              size={16}
            />
            Aplicar filtros
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-white/[0.055] pt-4 lg:flex-row lg:items-center lg:justify-between">
        <Link
          href="/admin/os/indicadores"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 text-xs font-black text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
        >
          <RotateCcw
            size={15}
          />
          Limpar filtros
        </Link>

        {acoesExportacao && (
          <div className="grid gap-2 sm:grid-cols-2 lg:min-w-[360px] [&_button]:!h-10 [&_button]:!rounded-xl [&_button]:!text-xs">
            {acoesExportacao}
          </div>
        )}
      </div>
    </form>
  );
}

function Campo({
  label,
  icon,
  children,
}: {
  label: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.07em] text-slate-500">
        {icon}
        {label}
      </label>

      {children}
    </div>
  );
}
