import type { ReactNode } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowLeft,
  BarChart3,
  ChartNoAxesCombined,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FileCheck2,
  Gauge,
  Layers3,
  XCircle,
} from "lucide-react";
import {
  Prisma,
  PrioridadeOS,
  StatusOS,
} from "@prisma/client";

import { prisma } from "@/src/lib/prisma";
import {
  obterDataTerminoRelatorio,
} from "@/src/lib/kpiColaborador";
import BotaoPDFIndicadoresOS from "@/components/BotaoPDFIndicadoresOS";
import BotaoExcelIndicadoresOS from "@/components/BotaoExcelIndicadoresOS";
import FiltrosIndicadoresOS from "@/components/FiltrosIndicadoresOS";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = {
  searchParams?: Promise<{
    dataInicio?: string;
    dataFim?: string;
    status?: string;
    prioridade?: string;
    colaborador?: string;
    setor?: string;
    empresa?: string;
    maquina?: string;
    criadoPor?: string;
  }>;
};

const STATUS_OPTIONS: Array<{
  value: StatusOS;
  label: string;
}> = [
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

const PRIORIDADE_OPTIONS: Array<{
  value: PrioridadeOS;
  label: string;
}> = [
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

const ORDEM_EMPRESAS: Record<
  string,
  number
> = {
  SEQ: 1,
  SHA: 2,
  OCO: 3,
};

function formatDate(
  date:
    | Date
    | string
    | null
    | undefined
) {
  if (!date) return "—";

  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      timeZone:
        "America/Sao_Paulo",
    }
  ).format(
    new Date(date)
  );
}

function formatDateInput(
  value: string
) {
  if (!value) {
    return "Todas";
  }

  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      timeZone:
        "America/Sao_Paulo",
    }
  ).format(
    new Date(
      `${value}T12:00:00-03:00`
    )
  );
}

function statusLabel(
  status: string
) {
  const map: Record<
    string,
    string
  > = {
    NAO_INICIADA:
      "Não iniciada",
    EM_ANDAMENTO:
      "Em andamento",
    CONCLUIDA:
      "Concluída",
    CANCELADA:
      "Cancelada",
  };

  return map[status] ?? status;
}

function prioridadeLabel(
  prioridade: string
) {
  const map: Record<
    string,
    string
  > = {
    BAIXA: "Baixa",
    MEDIA: "Média",
    ALTA: "Alta",
    URGENTE: "Urgente",
  };

  return (
    map[prioridade] ??
    prioridade
  );
}

function percentual(
  parte: number,
  total: number
) {
  if (total <= 0) {
    return 0;
  }

  return Math.round(
    (parte / total) * 100
  );
}

function formatarDuracaoTotal(
  ms: number
) {
  if (
    !Number.isFinite(ms) ||
    ms <= 0
  ) {
    return "—";
  }

  const minutos =
    Math.round(
      ms / 60000
    );

  if (minutos < 60) {
    return `${minutos}min`;
  }

  const horas =
    Math.floor(
      minutos / 60
    );

  const minutosRestantes =
    minutos % 60;

  if (horas < 24) {
    return minutosRestantes
      ? `${horas}h ${minutosRestantes}min`
      : `${horas}h`;
  }

  const dias =
    Math.floor(
      horas / 24
    );

  const horasRestantes =
    horas % 24;

  return horasRestantes
    ? `${dias}d ${horasRestantes}h`
    : `${dias}d`;
}

function statusClasses(
  status: StatusOS
) {
  const map: Record<
    StatusOS,
    string
  > = {
    NAO_INICIADA:
      "border-amber-400/20 bg-amber-400/[0.07] text-amber-300",
    EM_ANDAMENTO:
      "border-blue-400/20 bg-blue-400/[0.07] text-blue-300",
    CONCLUIDA:
      "border-emerald-400/20 bg-emerald-400/[0.07] text-emerald-300",
    CANCELADA:
      "border-slate-400/20 bg-slate-400/[0.07] text-slate-300",
  };

  return map[status];
}

function prioridadeClasses(
  prioridade: PrioridadeOS
) {
  const map: Record<
    PrioridadeOS,
    string
  > = {
    BAIXA:
      "border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-300",
    MEDIA:
      "border-yellow-400/20 bg-yellow-400/[0.06] text-yellow-300",
    ALTA:
      "border-orange-400/20 bg-orange-400/[0.06] text-orange-300",
    URGENTE:
      "border-red-400/20 bg-red-400/[0.06] text-red-300",
  };

  return map[prioridade];
}

export default async function IndicadoresOSPage({
  searchParams,
}: PageProps) {
  const params =
    await searchParams;

  const dataInicioFiltro =
    String(
      params?.dataInicio ??
        ""
    ).trim();

  const dataFimFiltro =
    String(
      params?.dataFim ??
        ""
    ).trim();

  const statusFiltro =
    String(
      params?.status ?? ""
    ).trim();

  const prioridadeFiltro =
    String(
      params?.prioridade ??
        ""
    ).trim();

  const colaboradorFiltro =
    String(
      params?.colaborador ??
        ""
    ).trim();

  const setorFiltro =
    String(
      params?.setor ?? ""
    ).trim();

  const empresaFiltro =
    String(
      params?.empresa ?? ""
    ).trim();

  const maquinaFiltro =
    String(
      params?.maquina ?? ""
    ).trim();

  const criadoPorFiltro =
    String(
      params?.criadoPor ??
        ""
    ).trim();

  const statusSelecionado =
    STATUS_OPTIONS.some(
      (item) =>
        item.value ===
        statusFiltro
    )
      ? (statusFiltro as StatusOS)
      : undefined;

  const prioridadeSelecionada =
    PRIORIDADE_OPTIONS.some(
      (item) =>
        item.value ===
        prioridadeFiltro
    )
      ? (prioridadeFiltro as PrioridadeOS)
      : undefined;

  const dataInicio =
    dataInicioFiltro
      ? new Date(
          `${dataInicioFiltro}T00:00:00-03:00`
        )
      : null;

  const dataFim =
    dataFimFiltro
      ? new Date(
          `${dataFimFiltro}T23:59:59-03:00`
        )
      : null;

  const [
    empresasEncontradas,
    setoresEncontrados,
    maquinasEncontradas,
    colaboradoresDisponiveis,
    criadoresDisponiveis,
  ] =
    await Promise.all([
      prisma.empresa.findMany({
        where: {
          ativo: true,
          sigla: {
            in: [
              "SEQ",
              "SHA",
              "OCO",
            ],
          },
        },

        select: {
          id: true,
          nome: true,
          sigla: true,
        },
      }),

      prisma.setor.findMany({
        where: {
          ativo: true,
        },

        select: {
          id: true,
          nome: true,
          empresaId: true,
        },

        orderBy: {
          nome: "asc",
        },
      }),

      prisma.maquina.findMany({
        where: {
          ativo: true,
        },

        select: {
          id: true,
          nome: true,
          setorId: true,
        },

        orderBy: {
          nome: "asc",
        },
      }),

      prisma.user.findMany({
        where: {
          ativo: true,
          perfil:
            "COLABORADOR",
        },

        select: {
          id: true,
          nome: true,
        },

        orderBy: {
          nome: "asc",
        },
      }),

      prisma.user.findMany({
        where: {
          ordensCriadas: {
            some: {},
          },
        },

        select: {
          id: true,
          nome: true,
        },

        orderBy: {
          nome: "asc",
        },
      }),
    ]);

  const empresasDisponiveis =
    empresasEncontradas.sort(
      (
        empresaA,
        empresaB
      ) =>
        (ORDEM_EMPRESAS[
          empresaA.sigla
        ] ?? 99) -
        (ORDEM_EMPRESAS[
          empresaB.sigla
        ] ?? 99)
    );

  const empresaSelecionada =
    empresasDisponiveis.find(
      (empresa) =>
        empresa.id ===
        empresaFiltro
    ) ?? null;

  const empresaIdFiltro =
    empresaSelecionada?.id ??
    "";

  const setoresDisponiveis =
    setoresEncontrados.map(
      (setor) => ({
        id: setor.id,
        nome: setor.nome,
        empresaId:
          setor.empresaId ??
          "",
      })
    );

  const setorIdFiltro =
    setoresDisponiveis.some(
      (setor) =>
        setor.id ===
          setorFiltro &&
        setor.empresaId ===
          empresaIdFiltro
    )
      ? setorFiltro
      : "";

  const maquinasDisponiveis =
    maquinasEncontradas.filter(
      (maquina) =>
        setoresDisponiveis.some(
          (setor) =>
            setor.id ===
            maquina.setorId
        )
    );

  const maquinaIdFiltro =
    maquinasDisponiveis.some(
      (maquina) =>
        maquina.id ===
          maquinaFiltro &&
        maquina.setorId ===
          setorIdFiltro
    )
      ? maquinaFiltro
      : "";

  const colaboradorIdFiltro =
    colaboradoresDisponiveis.some(
      (colaborador) =>
        colaborador.id ===
        colaboradorFiltro
    )
      ? colaboradorFiltro
      : "";

  const criadoPorIdFiltro =
    criadoresDisponiveis.some(
      (criador) =>
        criador.id ===
        criadoPorFiltro
    )
      ? criadoPorFiltro
      : "";

  const where: Prisma.OrdemServicoWhereInput =
    {
      ...(empresaIdFiltro
        ? {
            empresaId:
              empresaIdFiltro,
          }
        : {}),

      ...(dataInicio ||
      dataFim
        ? {
            createdAt: {
              ...(dataInicio
                ? {
                    gte:
                      dataInicio,
                  }
                : {}),
              ...(dataFim
                ? {
                    lte:
                      dataFim,
                  }
                : {}),
            },
          }
        : {}),

      ...(statusSelecionado
        ? {
            status:
              statusSelecionado,
          }
        : {}),

      ...(prioridadeSelecionada
        ? {
            prioridade:
              prioridadeSelecionada,
          }
        : {}),

      ...(setorIdFiltro
        ? {
            setorId:
              setorIdFiltro,
          }
        : {}),

      ...(maquinaIdFiltro
        ? {
            maquinaId:
              maquinaIdFiltro,
          }
        : {}),

      ...(colaboradorIdFiltro
        ? {
            responsaveis: {
              some: {
                userId:
                  colaboradorIdFiltro,
              },
            },
          }
        : {}),

      ...(criadoPorIdFiltro
        ? {
            criadoPorId:
              criadoPorIdFiltro,
          }
        : {}),
    };

  const ordens =
    await prisma.ordemServico.findMany({
      where,

      include: {
        empresa: true,
        setor: true,
        maquina: true,
        criadoPor: true,

        responsaveis: {
          include: {
            user: true,
          },
        },
      },

      orderBy: {
        numero: "desc",
      },
    });

  const ordensComDataReal =
    ordens.map((os) => ({
      ...os,

      dataConclusaoRelatorio:
        os.status ===
          "CONCLUIDA" &&
        os.registroFinal
          ? obterDataTerminoRelatorio(
              os.registroFinal
            )
          : null,
    }));

  const totalOS =
    ordensComDataReal.length;

  const totalConcluidas =
    ordensComDataReal.filter(
      (os) =>
        os.status ===
        "CONCLUIDA"
    ).length;

  const totalPendentes =
    ordensComDataReal.filter(
      (os) =>
        os.status ===
          "NAO_INICIADA" ||
        os.status ===
          "EM_ANDAMENTO"
    ).length;

  const totalCanceladas =
    ordensComDataReal.filter(
      (os) =>
        os.status ===
        "CANCELADA"
    ).length;

  const baseTaxa =
    Math.max(
      0,
      totalOS -
        totalCanceladas
    );

  const taxaConclusao =
    percentual(
      totalConcluidas,
      baseTaxa
    );

  const concluidasComDataReal =
    ordensComDataReal.filter(
      (os) =>
        os.status ===
          "CONCLUIDA" &&
        Boolean(
          os.dataConclusaoRelatorio
        )
    );

  const coberturaTecnica =
    percentual(
      concluidasComDataReal.length,
      totalConcluidas
    );

  const temposTotais =
    concluidasComDataReal
      .map((os) => {
        const inicio =
          os.createdAt.getTime();

        const fim =
          os.dataConclusaoRelatorio!.getTime();

        const tempo =
          fim - inicio;

        return tempo > 0
          ? tempo
          : null;
      })
      .filter(
        (
          tempo
        ): tempo is number =>
          tempo !== null
      );

  const tempoMedioTotal =
    temposTotais.length > 0
      ? temposTotais.reduce(
          (
            total,
            tempo
          ) =>
            total + tempo,
          0
        ) /
        temposTotais.length
      : 0;

  const setores =
    Array.from(
      new Set(
        ordensComDataReal.map(
          (os) =>
            os.setor?.nome ??
            "Sem setor"
        )
      )
    );

  const dadosPorSetor =
    setores
      .map((setor) => {
        const ordensSetor =
          ordensComDataReal.filter(
            (os) =>
              (os.setor?.nome ??
                "Sem setor") ===
              setor
          );

        const concluidas =
          ordensSetor.filter(
            (os) =>
              os.status ===
              "CONCLUIDA"
          ).length;

        const pendentes =
          ordensSetor.filter(
            (os) =>
              os.status ===
                "NAO_INICIADA" ||
              os.status ===
                "EM_ANDAMENTO"
          ).length;

        const canceladas =
          ordensSetor.filter(
            (os) =>
              os.status ===
              "CANCELADA"
          ).length;

        const baseValida =
          concluidas +
          pendentes;

        return {
          setor,
          total:
            ordensSetor.length,
          concluidas,
          pendentes,
          canceladas,
          baseValida,
          eficiencia:
            percentual(
              concluidas,
              baseValida
            ),
        };
      })
      .sort(
        (a, b) =>
          b.total -
          a.total
      );

  const setorSelecionado =
    setoresDisponiveis.find(
      (setor) =>
        setor.id ===
        setorIdFiltro
    )?.nome ?? "Todos";

  const maquinaSelecionada =
    maquinasDisponiveis.find(
      (maquina) =>
        maquina.id ===
        maquinaIdFiltro
    )?.nome ?? "Todas";

  const colaboradorSelecionado =
    colaboradoresDisponiveis.find(
      (colaborador) =>
        colaborador.id ===
        colaboradorIdFiltro
    )?.nome ?? "Todos";

  const criadoPorSelecionado =
    criadoresDisponiveis.find(
      (criador) =>
        criador.id ===
        criadoPorIdFiltro
    )?.nome ?? "Todos";

  const statusSelecionadoLabel =
    statusSelecionado
      ? statusLabel(
          statusSelecionado
        )
      : "Todos";

  const prioridadeSelecionadaLabel =
    prioridadeSelecionada
      ? prioridadeLabel(
          prioridadeSelecionada
        )
      : "Todas";

  const empresaSelecionadaLabel =
    empresaSelecionada?.nome ??
    "Todas";

  const ordensExportacao =
    ordensComDataReal.map(
      (os) => ({
        numero: os.numero,
        empresa:
          os.empresa?.nome ??
          "-",
        setor:
          os.setor?.nome ??
          "-",
        maquina:
          os.maquina?.nome ??
          "-",
        titulo: os.titulo,
        descricao:
          os.descricao?.trim() ||
          "-",
        prioridade:
          prioridadeLabel(
            os.prioridade
          ),
        status:
          statusLabel(
            os.status
          ),
        criadoPor:
          os.criadoPor?.nome ??
          "-",
        geradaEm:
          formatDate(
            os.createdAt
          ),
        concluidaEm:
          os.status ===
            "CONCLUIDA"
            ? formatDate(
                os.dataConclusaoRelatorio
              )
            : "-",
        responsavel:
          os.responsaveis.length
            ? os.responsaveis
                .map(
                  (
                    responsavel
                  ) =>
                    responsavel
                      .user.nome
                )
                .join(", ")
            : "-",
      })
    );

  const filtrosExportacao =
    {
      dataInicio:
        formatDateInput(
          dataInicioFiltro
        ),
      dataFim:
        formatDateInput(
          dataFimFiltro
        ),
      status:
        statusSelecionadoLabel,
      prioridade:
        prioridadeSelecionadaLabel,
      colaborador:
        colaboradorSelecionado,
      criadoPor:
        criadoPorSelecionado,
      setor:
        setorSelecionado,
      maquina:
        maquinaSelecionada,
      empresa:
        empresaSelecionadaLabel,
    };

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#020617] px-3 py-5 text-white sm:px-5 lg:px-8">
      <div className="mx-auto w-full max-w-[1700px] space-y-5">
        {/* =====================================================
            HERO
        ====================================================== */}
        <header className="relative overflow-hidden rounded-[28px] border border-cyan-400/15 bg-[linear-gradient(120deg,#07101f_0%,#071827_55%,#06101d_100%)] p-5 shadow-[0_18px_55px_rgba(0,0,0,.22)] sm:p-6">
          <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-cyan-400/[0.08] blur-3xl" />

          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.06] text-cyan-300">
                <BarChart3 size={26} />
              </div>

              <div className="min-w-0">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-cyan-300">
                  Centro de indicadores
                </p>

                <h1 className="mt-1 text-3xl font-black tracking-[-0.04em] text-white sm:text-4xl">
                  Indicadores de OS
                </h1>

                <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-400">
                  Consulte, filtre e exporte as ordens com indicadores técnicos padronizados pelo relatório de manutenção.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 sm:flex-row">
              <Link
                href="/admin/os/indicadores/graficos"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-400/[0.06] px-5 text-sm font-black text-cyan-200 transition hover:bg-cyan-400 hover:text-slate-950"
              >
                <ChartNoAxesCombined size={17} />
                Dashboard gráfico
              </Link>

              <Link
                href="/admin"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-black text-slate-950 transition hover:bg-cyan-50"
              >
                <ArrowLeft size={17} />
                Voltar
              </Link>
            </div>
          </div>
        </header>

        {/* =====================================================
            FILTROS
        ====================================================== */}
        <section className="rounded-[24px] border border-white/[0.07] bg-[#070c1b] p-4 shadow-[0_12px_35px_rgba(0,0,0,.16)] sm:p-5">
          <FiltrosIndicadoresOS
            empresas={
              empresasDisponiveis
            }
            setores={
              setoresDisponiveis
            }
            maquinas={
              maquinasDisponiveis
            }
            colaboradores={
              colaboradoresDisponiveis
            }
            criadores={
              criadoresDisponiveis
            }
            filtrosIniciais={{
              dataInicio:
                dataInicioFiltro,
              dataFim:
                dataFimFiltro,
              empresa:
                empresaIdFiltro,
              status:
                statusSelecionado ??
                "",
              prioridade:
                prioridadeSelecionada ??
                "",
              setor:
                setorIdFiltro,
              maquina:
                maquinaIdFiltro,
              colaborador:
                colaboradorIdFiltro,
              criadoPor:
                criadoPorIdFiltro,
            }}
            acoesExportacao={
              <>
                <BotaoPDFIndicadoresOS
                  ordens={
                    ordensExportacao
                  }
                  filtros={
                    filtrosExportacao
                  }
                />

                <BotaoExcelIndicadoresOS
                  ordens={
                    ordensExportacao
                  }
                  filtros={
                    filtrosExportacao
                  }
                />
              </>
            }
          />
        </section>

        {/* =====================================================
            STATUS GERAL
        ====================================================== */}
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <ResumoCard
            label="Total de OS"
            value={totalOS}
            helper="Ordens no filtro atual"
            icon={
              <ClipboardList
                size={19}
              />
            }
            tone="cyan"
          />

          <ResumoCard
            label="Concluídas"
            value={
              totalConcluidas
            }
            helper="Serviços finalizados"
            icon={
              <CheckCircle2
                size={19}
              />
            }
            tone="green"
          />

          <ResumoCard
            label="Pendentes"
            value={
              totalPendentes
            }
            helper="Não iniciadas + em andamento"
            icon={
              <Clock3
                size={19}
              />
            }
            tone="blue"
          />

          <ResumoCard
            label="Canceladas"
            value={
              totalCanceladas
            }
            helper="Fora da taxa de conclusão"
            icon={
              <XCircle
                size={19}
              />
            }
            tone="slate"
          />
        </section>

        {/* =====================================================
            QUALIDADE DOS INDICADORES
        ====================================================== */}
        <section className="rounded-[24px] border border-cyan-400/10 bg-[linear-gradient(120deg,rgba(6,182,212,.035),rgba(7,12,27,1)_42%)] p-4 shadow-[0_12px_35px_rgba(0,0,0,.16)] sm:p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/15 bg-cyan-400/[0.05] text-cyan-300">
              <Activity size={18} />
            </div>

            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.12em] text-cyan-300">
                Leitura técnica
              </p>

              <h2 className="mt-0.5 text-lg font-black text-white">
                Qualidade operacional
              </h2>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <InsightCard
              label="Taxa de conclusão"
              value={`${taxaConclusao}%`}
              helper={`${totalConcluidas}/${baseTaxa} OS válidas • canceladas excluídas`}
              icon={
                <Gauge
                  size={20}
                />
              }
              tone="violet"
            />

            <InsightCard
              label="Tempo médio total"
              value={formatarDuracaoTotal(
                tempoMedioTotal
              )}
              helper={`Abertura → término real do relatório • ${temposTotais.length} OS`}
              icon={
                <Clock3
                  size={20}
                />
              }
              tone="orange"
            />

            <InsightCard
              label="Cobertura técnica"
              value={`${coberturaTecnica}%`}
              helper={`${concluidasComDataReal.length}/${totalConcluidas} concluídas com data técnica válida`}
              icon={
                <FileCheck2
                  size={20}
                />
              }
              tone="green"
            />
          </div>
        </section>

        {/* =====================================================
            PLANILHA + SETORES
        ====================================================== */}
        <section className="grid gap-5 2xl:grid-cols-[1.45fr_0.55fr]">
          {/* PLANILHA */}
          <div className="min-w-0 overflow-hidden rounded-[24px] border border-white/[0.07] bg-[#070c1b] shadow-[0_12px_35px_rgba(0,0,0,.18)]">
            <div className="flex flex-col gap-3 border-b border-white/[0.06] p-4 sm:flex-row sm:items-end sm:justify-between sm:p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-400/15 bg-cyan-400/[0.05] text-cyan-300">
                  <ClipboardList size={18} />
                </div>

                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.12em] text-cyan-300">
                    Base operacional
                  </p>

                  <h2 className="mt-0.5 text-lg font-black text-white">
                    Planilha de OS
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Ordenada pela OS mais recente. “Concluída em” usa a data real do relatório.
                  </p>
                </div>
              </div>

              <span className="inline-flex w-fit rounded-full border border-white/[0.07] bg-[#030817] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.08em] text-slate-400">
                {totalOS} registro(s)
              </span>
            </div>

            <div className="max-h-[720px] overflow-auto">
              <table className="w-full min-w-[1320px] border-collapse">
                <thead className="sticky top-0 z-20 bg-[#080f20] shadow-[0_1px_0_rgba(255,255,255,.08)]">
                  <tr>
                    {[
                      "OS",
                      "Setor / Máquina",
                      "Título",
                      "Descrição",
                      "Prioridade",
                      "Status",
                      "Criada em",
                      "Concluída em",
                      "Responsável",
                    ].map(
                      (
                        titulo
                      ) => (
                        <th
                          key={
                            titulo
                          }
                          className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.08em] text-slate-500"
                        >
                          {
                            titulo
                          }
                        </th>
                      )
                    )}
                  </tr>
                </thead>

                <tbody>
                  {ordensComDataReal.length ===
                  0 ? (
                    <tr>
                      <td
                        colSpan={9}
                        className="px-5 py-14 text-center text-sm text-slate-500"
                      >
                        Nenhuma OS encontrada com os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    ordensComDataReal.map(
                      (os) => (
                        <tr
                          key={
                            os.id
                          }
                          className="border-b border-white/[0.055] transition hover:bg-white/[0.025]"
                        >
                          <td className="px-4 py-3 align-top">
                            <span className="text-sm font-black text-cyan-300">
                              #
                              {
                                os.numero
                              }
                            </span>
                          </td>

                          <td className="px-4 py-3 align-top">
                            <p className="text-xs font-black text-slate-200">
                              {os.setor?.nome ??
                                "—"}
                            </p>

                            <p className="mt-1 text-[10px] font-semibold text-slate-600">
                              {os.maquina?.nome ??
                                "Sem máquina"}
                            </p>
                          </td>

                          <td className="max-w-[210px] px-4 py-3 align-top">
                            <p className="line-clamp-2 text-xs font-black leading-5 text-white">
                              {
                                os.titulo
                              }
                            </p>
                          </td>

                          <td className="max-w-[320px] px-4 py-3 align-top">
                            <p className="line-clamp-3 text-xs leading-5 text-slate-400">
                              {os.descricao?.trim() ||
                                "—"}
                            </p>
                          </td>

                          <td className="px-4 py-3 align-top">
                            <span
                              className={`inline-flex rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.06em] ${prioridadeClasses(
                                os.prioridade
                              )}`}
                            >
                              {prioridadeLabel(
                                os.prioridade
                              )}
                            </span>
                          </td>

                          <td className="px-4 py-3 align-top">
                            <span
                              className={`inline-flex rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.06em] ${statusClasses(
                                os.status
                              )}`}
                            >
                              {statusLabel(
                                os.status
                              )}
                            </span>
                          </td>

                          <td className="whitespace-nowrap px-4 py-3 align-top text-xs font-semibold text-slate-400">
                            {formatDate(
                              os.createdAt
                            )}
                          </td>

                          <td className="whitespace-nowrap px-4 py-3 align-top">
                            {os.status ===
                            "CONCLUIDA" ? (
                              os.dataConclusaoRelatorio ? (
                                <div>
                                  <p className="text-xs font-black text-emerald-300">
                                    {formatDate(
                                      os.dataConclusaoRelatorio
                                    )}
                                  </p>

                                  <p className="mt-1 text-[9px] font-semibold text-slate-600">
                                    relatório técnico
                                  </p>
                                </div>
                              ) : (
                                <span className="text-[10px] font-bold text-amber-300">
                                  Sem data técnica
                                </span>
                              )
                            ) : (
                              <span className="text-xs text-slate-700">
                                —
                              </span>
                            )}
                          </td>

                          <td className="max-w-[190px] px-4 py-3 align-top text-xs font-semibold leading-5 text-slate-300">
                            {os.responsaveis.length
                              ? os.responsaveis
                                  .map(
                                    (
                                      responsavel
                                    ) =>
                                      responsavel
                                        .user
                                        .nome
                                  )
                                  .join(
                                    ", "
                                  )
                              : "—"}
                          </td>
                        </tr>
                      )
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* SETORES */}
          <aside className="min-w-0 rounded-[24px] border border-white/[0.07] bg-[#070c1b] p-4 shadow-[0_12px_35px_rgba(0,0,0,.18)] sm:p-5">
            <div className="mb-4 flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-400/15 bg-cyan-400/[0.05] text-cyan-300">
                <Layers3 size={18} />
              </div>

              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.12em] text-cyan-300">
                  Ranking operacional
                </p>

                <h2 className="mt-0.5 text-lg font-black text-white">
                  OS por setor
                </h2>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Volume e eficiência. Canceladas não entram no cálculo de eficiência.
                </p>
              </div>
            </div>

            {dadosPorSetor.length ===
            0 ? (
              <div className="rounded-2xl border border-dashed border-white/[0.08] bg-[#030817] p-6 text-center text-sm text-slate-500">
                Nenhum dado para exibir.
              </div>
            ) : (
              <div className="max-h-[720px] space-y-3 overflow-y-auto pr-1">
                {dadosPorSetor.map(
                  (
                    item,
                    index
                  ) => (
                    <SetorCard
                      key={
                        item.setor
                      }
                      index={
                        index + 1
                      }
                      {...item}
                    />
                  )
                )}
              </div>
            )}
          </aside>
        </section>

        {/* =====================================================
            NOTA METODOLÓGICA
        ====================================================== */}
        <section className="rounded-[20px] border border-cyan-400/10 bg-cyan-400/[0.025] px-4 py-3">
          <p className="text-xs leading-5 text-slate-500">
            <strong className="text-cyan-300">
              Regra dos indicadores:
            </strong>{" "}
            a conclusão e o tempo médio utilizam a Data/Hora de término preenchida no relatório técnico. OS canceladas permanecem visíveis para rastreabilidade, mas não entram no denominador da taxa de conclusão nem da eficiência por setor.
          </p>
        </section>
      </div>
    </main>
  );
}

function ResumoCard({
  label,
  value,
  helper,
  icon,
  tone,
}: {
  label: string;
  value: number;
  helper: string;
  icon: ReactNode;
  tone:
    | "cyan"
    | "green"
    | "blue"
    | "slate";
}) {
  const tones = {
    cyan:
      "border-cyan-400/15 bg-cyan-400/[0.035] text-cyan-300",
    green:
      "border-emerald-400/15 bg-emerald-400/[0.035] text-emerald-300",
    blue:
      "border-blue-400/15 bg-blue-400/[0.035] text-blue-300",
    slate:
      "border-white/[0.08] bg-white/[0.025] text-slate-300",
  };

  return (
    <div
      className={`rounded-[20px] border p-4 ${tones[tone]}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-500">
            {label}
          </p>

          <p className="mt-2 text-3xl font-black tracking-[-0.04em] text-white">
            {value}
          </p>

          <p className="mt-1 text-[11px] text-slate-600">
            {helper}
          </p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.06] bg-black/10">
          {icon}
        </div>
      </div>
    </div>
  );
}

function InsightCard({
  label,
  value,
  helper,
  icon,
  tone,
}: {
  label: string;
  value: string;
  helper: string;
  icon: ReactNode;
  tone:
    | "violet"
    | "orange"
    | "green";
}) {
  const tones = {
    violet:
      "border-violet-400/15 bg-violet-400/[0.035] text-violet-300",
    orange:
      "border-orange-400/15 bg-orange-400/[0.035] text-orange-300",
    green:
      "border-emerald-400/15 bg-emerald-400/[0.035] text-emerald-300",
  };

  return (
    <div
      className={`rounded-[18px] border p-4 ${tones[tone]}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.09em] text-slate-500">
            {label}
          </p>

          <p className="mt-2 text-2xl font-black tracking-[-0.04em] text-white">
            {value}
          </p>

          <p className="mt-1 max-w-sm text-[11px] leading-5 text-slate-600">
            {helper}
          </p>
        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.06] bg-black/10">
          {icon}
        </div>
      </div>
    </div>
  );
}

function SetorCard({
  index,
  setor,
  total,
  concluidas,
  pendentes,
  canceladas,
  baseValida,
  eficiencia,
}: {
  index: number;
  setor: string;
  total: number;
  concluidas: number;
  pendentes: number;
  canceladas: number;
  baseValida: number;
  eficiencia: number;
}) {
  const concluidaPct =
    percentual(
      concluidas,
      Math.max(1, total)
    );

  const pendentePct =
    percentual(
      pendentes,
      Math.max(1, total)
    );

  const canceladaPct =
    Math.max(
      0,
      100 -
        concluidaPct -
        pendentePct
    );

  return (
    <article className="rounded-2xl border border-white/[0.06] bg-[#030817] p-4 transition hover:border-cyan-400/15">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/[0.07] bg-white/[0.03] text-[10px] font-black text-slate-500">
            {index}
          </span>

          <div className="min-w-0">
            <h3 className="truncate text-sm font-black text-white">
              {setor}
            </h3>

            <p className="mt-0.5 text-[10px] text-slate-600">
              {total} OS no filtro
            </p>
          </div>
        </div>

        <div className="text-right">
          <p className="text-lg font-black text-emerald-300">
            {eficiencia}%
          </p>

          <p className="text-[9px] font-bold uppercase tracking-[0.06em] text-slate-600">
            eficiência
          </p>
        </div>
      </div>

      <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-white/[0.05]">
        <div
          className="bg-emerald-400"
          style={{
            width: `${concluidaPct}%`,
          }}
        />

        <div
          className="bg-blue-400"
          style={{
            width: `${pendentePct}%`,
          }}
        />

        <div
          className="bg-slate-500"
          style={{
            width: `${canceladaPct}%`,
          }}
        />
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <MiniStatus
          label="Concl."
          value={concluidas}
          className="text-emerald-300"
        />

        <MiniStatus
          label="Pend."
          value={pendentes}
          className="text-blue-300"
        />

        <MiniStatus
          label="Canc."
          value={canceladas}
          className="text-slate-400"
        />
      </div>

      <p className="mt-2 text-[9px] text-slate-700">
        Eficiência: {concluidas}/{baseValida} OS válidas
      </p>
    </article>
  );
}

function MiniStatus({
  label,
  value,
  className,
}: {
  label: string;
  value: number;
  className: string;
}) {
  return (
    <div className="rounded-lg border border-white/[0.05] bg-white/[0.02] px-2 py-1.5 text-center">
      <p className="text-[9px] font-bold uppercase text-slate-600">
        {label}
      </p>

      <p
        className={`mt-0.5 text-sm font-black ${className}`}
      >
        {value}
      </p>
    </div>
  );
}
