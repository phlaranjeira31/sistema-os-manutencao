import type { ReactNode } from "react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Gauge,
  PlayCircle,
  ShieldCheck,
  TrendingUp,
  Wrench,
  XCircle,
} from "lucide-react";

import { authOptions } from "@/src/lib/auth";
import HeaderUsuario from "@/components/HeaderUsuario";
import AdminMenu from "@/components/AdminMenu";
import AssistenteSistema from "@/components/AssistenteSistema";
import DashboardAutoRefresh from "@/components/DashboardAutoRefresh";
import DashboardFluxoOS from "@/components/DashboardFluxoOS";
import { prisma } from "@/src/lib/prisma";
import { obterDataTerminoRelatorio } from "@/src/lib/kpiColaborador";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const TIME_ZONE = "America/Sao_Paulo";

type GraficoItem = {
  label: string;
  criadas: number;
  concluidas: number;
};

function chaveMes(data: Date | string) {
  const partes =
    new Intl.DateTimeFormat(
      "pt-BR",
      {
        timeZone:
          TIME_ZONE,
        year: "numeric",
        month: "2-digit",
      }
    ).formatToParts(
      new Date(data)
    );

  const ano =
    partes.find(
      (parte) =>
        parte.type ===
        "year"
    )?.value ?? "";

  const mes =
    partes.find(
      (parte) =>
        parte.type ===
        "month"
    )?.value ?? "";

  return `${ano}-${mes}`;
}

function rotuloMes(
  data: Date | string
) {
  const texto =
    new Intl.DateTimeFormat(
      "pt-BR",
      {
        timeZone:
          TIME_ZONE,
        month: "short",
      }
    )
      .format(
        new Date(data)
      )
      .replace(".", "");

  return (
    texto
      .charAt(0)
      .toUpperCase() +
    texto.slice(1)
  );
}

function construirGrafico6Meses(
  agora: Date,
  ordens: {
    createdAt: Date;
    status: string;
    registroFinal:
      string | null;
  }[]
): GraficoItem[] {
  const meses = Array.from(
    { length: 6 },
    (_, indice) => {
      const data = new Date(
        agora.getFullYear(),
        agora.getMonth() -
          (5 - indice),
        1,
        12,
        0,
        0,
        0
      );

      return {
        chave:
          chaveMes(data),
        label:
          rotuloMes(data),
        criadas: 0,
        concluidas: 0,
      };
    }
  );

  const indiceMeses =
    new Map(
      meses.map(
        (mes, indice) => [
          mes.chave,
          indice,
        ]
      )
    );

  ordens.forEach(
    (os) => {
      const chaveCriacao =
        chaveMes(
          os.createdAt
        );

      const indiceCriacao =
        indiceMeses.get(
          chaveCriacao
        );

      if (
        typeof indiceCriacao ===
        "number"
      ) {
        meses[
          indiceCriacao
        ].criadas += 1;
      }

      if (
        os.status ===
          "CONCLUIDA" &&
        os.registroFinal
      ) {
        const terminoReal =
          obterDataTerminoRelatorio(
            os.registroFinal
          );

        if (
          terminoReal
        ) {
          const chaveConclusao =
            chaveMes(
              terminoReal
            );

          const indiceConclusao =
            indiceMeses.get(
              chaveConclusao
            );

          if (
            typeof indiceConclusao ===
            "number"
          ) {
            meses[
              indiceConclusao
            ].concluidas += 1;
          }
        }
      }
    }
  );

  return meses.map(
    ({
      label,
      criadas,
      concluidas,
    }) => ({
      label,
      criadas,
      concluidas,
    })
  );
}

function rotuloDataCurta(data: Date | string) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: TIME_ZONE,
    day: "2-digit",
    month: "short",
  })
    .format(new Date(data))
    .replace(".", "");
}

function tempoRelativo(data: Date | string) {
  const diferencaMs =
    Date.now() - new Date(data).getTime();

  const minutos = Math.max(
    0,
    Math.floor(diferencaMs / 60000)
  );

  if (minutos < 1) return "agora";
  if (minutos < 60) return `há ${minutos} min`;

  const horas = Math.floor(minutos / 60);

  if (horas < 24) return `há ${horas} h`;

  const dias = Math.floor(horas / 24);

  if (dias === 1) return "há 1 dia";

  return `há ${dias} dias`;
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    NAO_INICIADA: "Não iniciada",
    EM_ANDAMENTO: "Em andamento",
    CONCLUIDA: "Concluída",
    CANCELADA: "Cancelada",
  };

  return labels[status] ?? status;
}

function prioridadeLabel(prioridade: string) {
  const labels: Record<string, string> = {
    BAIXA: "Baixa",
    MEDIA: "Média",
    ALTA: "Alta",
    URGENTE: "Urgente",
  };

  return labels[prioridade] ?? prioridade;
}

export default async function AdminPage() {
  const session =
    await getServerSession(
      authOptions
    );

  if (!session) {
    redirect("/login");
  }

  const empresaSequoia =
    await prisma.empresa.findFirst({
      where: {
        sigla: {
          equals: "SEQ",
          mode: "insensitive",
        },
      },

      select: {
        id: true,
      },
    });

  const empresaSequoiaId =
    empresaSequoia?.id ?? "";

  const usuariosServicoExterno =
    await prisma.user.findMany({
      where: {
        OR: [
          {
            nome: {
              equals: "EMPREITEIRA",
              mode: "insensitive",
            },
          },
          {
            nome: {
              equals:
                "Zeze serralheiro",
              mode: "insensitive",
            },
          },
        ],
      },

      select: {
        id: true,
      },
    });

  const idsServicoExterno =
    usuariosServicoExterno.map(
      (usuario) => usuario.id
    );

  const hrefOrdensSequoia = (
    filtros?: Record<
      string,
      string
    >
  ) => {
    const parametros =
      new URLSearchParams();

    if (empresaSequoiaId) {
      parametros.set(
        "empresaId",
        empresaSequoiaId
      );
    }

    Object.entries(
      filtros ?? {}
    ).forEach(
      ([chave, valor]) =>
        parametros.set(
          chave,
          valor
        )
    );

    const consulta =
      parametros.toString();

    return consulta
      ? `/admin/os?${consulta}`
      : "/admin/os";
  };

  const agora = new Date();

  const inicioHistorico =
    new Date(
      agora.getTime() -
        210 *
          24 *
          60 *
          60 *
          1000
    );

  const fimPreventivas =
    new Date(
      agora.getTime() +
        7 *
          24 *
          60 *
          60 *
          1000
    );

  const [
    totalOS,
    naoIniciadas,
    emAndamento,
    concluidas,
    canceladas,
    baixa,
    media,
    alta,
    urgente,
    totalExternas,
    concluidasExternas,
    ordensHistorico,
    atividadesRecentes,
    proximasPreventivas,
  ] = await Promise.all([
    prisma.ordemServico.count({
      where: {
        empresaId:
          empresaSequoiaId,
      },
    }),

    prisma.ordemServico.count({
      where: {
        empresaId:
          empresaSequoiaId,
        status:
          "NAO_INICIADA",
      },
    }),

    prisma.ordemServico.count({
      where: {
        empresaId:
          empresaSequoiaId,
        status:
          "EM_ANDAMENTO",
      },
    }),

    prisma.ordemServico.count({
      where: {
        empresaId:
          empresaSequoiaId,
        status:
          "CONCLUIDA",
      },
    }),

    prisma.ordemServico.count({
      where: {
        empresaId:
          empresaSequoiaId,
        status:
          "CANCELADA",
      },
    }),

    prisma.ordemServico.count({
      where: {
        empresaId:
          empresaSequoiaId,
        prioridade: "BAIXA",
      },
    }),

    prisma.ordemServico.count({
      where: {
        empresaId:
          empresaSequoiaId,
        prioridade: "MEDIA",
      },
    }),

    prisma.ordemServico.count({
      where: {
        empresaId:
          empresaSequoiaId,
        prioridade: "ALTA",
      },
    }),

    prisma.ordemServico.count({
      where: {
        empresaId:
          empresaSequoiaId,
        prioridade:
          "URGENTE",
      },
    }),

    prisma.ordemServico.count({
      where: {
        empresaId:
          empresaSequoiaId,

        status: {
          not: "CANCELADA",
        },

        responsaveis: {
          some: {
            userId: {
              in: idsServicoExterno,
            },
          },
        },
      },
    }),

    prisma.ordemServico.count({
      where: {
        empresaId:
          empresaSequoiaId,
        status: "CONCLUIDA",

        responsaveis: {
          some: {
            userId: {
              in: idsServicoExterno,
            },
          },
        },
      },
    }),

    prisma.ordemServico.findMany({
      where: {
        empresaId:
          empresaSequoiaId,

        OR: [
          {
            createdAt: {
              gte:
                inicioHistorico,
            },
          },
          {
            status:
              "CONCLUIDA",

            registroFinal: {
              not: null,
            },
          },
        ],
      },

      select: {
        createdAt: true,
        status: true,
        registroFinal: true,
      },
    }),

    prisma.ordemServico.findMany({
      where: {
        empresaId:
          empresaSequoiaId,
      },

      orderBy: {
        updatedAt: "desc",
      },

      take: 3,

      select: {
        id: true,
        numero: true,
        titulo: true,
        descricao: true,
        status: true,
        updatedAt: true,
      },
    }),

    prisma.execucaoPreventiva.findMany({
      where: {
        dataProgramada: {
          gte: agora,
          lte:
            fimPreventivas,
        },

        status: {
          in: [
            "PROGRAMADA",
            "PENDENTE",
            "EM_EXECUCAO",
          ],
        },

        plano: {
          empresaId:
            empresaSequoiaId,
        },
      },

      orderBy: {
        dataProgramada: "asc",
      },

      take: 3,

      select: {
        id: true,
        dataProgramada: true,

        plano: {
          select: {
            titulo: true,
            prioridade: true,

            maquina: {
              select: {
                nome: true,
              },
            },
          },
        },
      },
    }),
  ]);

  const totalOSConsideradas =
    Math.max(
      0,
      totalOS - canceladas
    );

  const abertas =
    naoIniciadas +
    emAndamento;

  const eficienciaPercentual =
    totalOSConsideradas > 0
      ? Math.round(
          (concluidas /
            totalOSConsideradas) *
            100
        )
      : 0;

  const totalInternas =
    Math.max(
      0,
      totalOSConsideradas -
        totalExternas
    );

  const concluidasInternas =
    Math.max(
      0,
      concluidas -
        concluidasExternas
    );

  const eficienciaInterna =
    totalInternas > 0
      ? Math.round(
          (concluidasInternas /
            totalInternas) *
            100
        )
      : 0;

  const eficienciaExterna =
    totalExternas > 0
      ? Math.round(
          (concluidasExternas /
            totalExternas) *
            100
        )
      : 0;

  const dadosGrafico =
    construirGrafico6Meses(
      agora,
      ordensHistorico
    );

  const mesAtual =
    dadosGrafico[
      dadosGrafico.length -
        1
    ] ?? {
      label: "",
      criadas: 0,
      concluidas: 0,
    };

  const saldoMesAtual =
    mesAtual.concluidas -
    mesAtual.criadas;

  return (
    <main className="min-h-screen bg-[#020617] text-white lg:h-screen lg:overflow-hidden">
      <DashboardAutoRefresh
        intervaloMs={30000}
      />

      <div className="flex min-h-screen min-w-0 lg:h-full lg:min-h-0">
        <aside className="hidden h-full w-[280px] shrink-0 flex-col border-r border-white/[0.07] bg-[linear-gradient(180deg,#020617_0%,#03081a_100%)] lg:flex">
          <div className="shrink-0 px-3 pb-2 pt-3">
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-3.5 shadow-[0_10px_30px_rgba(0,0,0,.14)]">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-400/15 bg-cyan-400/[0.06] text-cyan-300">
                  <Wrench size={18} />
                </div>

                <div className="min-w-0">
                  <h1 className="truncate text-[17px] font-black tracking-[-0.025em] text-white">
                    Sistema de OS
                  </h1>

                  <p className="mt-0.5 truncate text-[10px] font-semibold text-slate-500">
                    Manutenção industrial • Sequoia
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto pb-2">
            <AdminMenu />
          </div>

          <footer className="shrink-0 border-t border-white/[0.06] px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[8px] font-black uppercase tracking-[0.18em] text-slate-700">
                  Desenvolvido por
                </p>

                <p className="mt-0.5 truncate text-[11px] font-bold text-slate-400">
                  Pedro H. Laranjeira
                </p>
              </div>

              <span className="shrink-0 rounded-full border border-cyan-400/10 bg-cyan-400/[0.04] px-2 py-1 text-[8px] font-black text-cyan-400/80">
                v1.0.0
              </span>
            </div>
          </footer>
        </aside>

        <section className="flex min-h-screen min-w-0 flex-1 flex-col lg:min-h-0 lg:overflow-hidden">
          <HeaderUsuario />

          <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3 sm:px-4 sm:py-4 lg:overflow-hidden lg:px-5 lg:py-3 xl:px-6">
            <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-3 pb-5 lg:grid lg:h-full lg:min-h-0 lg:grid-rows-[102px_98px_minmax(190px,1fr)_154px] lg:pb-0">
              {/* ==================================================
                  HERO
              ================================================== */}
              <section className="relative overflow-hidden rounded-[22px] border border-cyan-400/25 bg-[linear-gradient(115deg,#06111e_0%,#07202d_44%,#071421_72%,#06101e_100%)] px-4 py-4 shadow-[0_0_34px_rgba(34,211,238,0.08)] sm:px-5 lg:py-3.5">
                <div
                  className="pointer-events-none absolute inset-0 opacity-35"
                  style={{
                    backgroundImage:
                      "linear-gradient(rgba(34,211,238,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,.05) 1px, transparent 1px)",
                    backgroundSize:
                      "34px 34px",
                  }}
                />

                <div className="pointer-events-none absolute -right-12 -top-20 h-56 w-80 rounded-full bg-cyan-400/[0.11] blur-3xl" />

                <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between lg:h-full lg:gap-5">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-cyan-300">
                      <Activity size={14} />
                      Centro de controle
                    </p>

                    <h1 className="mt-1.5 max-w-[760px] text-[22px] font-black leading-tight tracking-[-0.04em] text-white sm:text-[25px] xl:text-[28px]">
                      Controle de Ordens de Serviço
                    </h1>

                    <p className="mt-2 max-w-3xl text-[11px] leading-5 text-slate-300 sm:mt-1 xl:text-xs">
                      Visão executiva das manutenções, prioridades, eficiência e fluxo operacional da Sequoia.
                    </p>
                  </div>

                  <div className="flex w-full shrink-0 items-center gap-2.5 sm:w-auto">
                    <div className="hidden min-w-[105px] rounded-xl border border-blue-400/10 bg-blue-400/[0.04] px-3 py-2 xl:block">
                      <p className="text-[8px] font-black uppercase tracking-[0.1em] text-slate-500">
                        OS abertas
                      </p>

                      <p className="mt-0.5 text-lg font-black leading-none tracking-[-0.04em] text-blue-300">
                        {abertas}
                      </p>
                    </div>

                    <div className="hidden min-w-[105px] rounded-xl border border-emerald-400/10 bg-emerald-400/[0.04] px-3 py-2 xl:block">
                      <p className="text-[8px] font-black uppercase tracking-[0.1em] text-slate-500">
                        Eficiência
                      </p>

                      <p className="mt-0.5 text-lg font-black leading-none tracking-[-0.04em] text-emerald-300">
                        {eficienciaPercentual}%
                      </p>
                    </div>

                    <Link
                      href={
                        hrefOrdensSequoia()
                      }
                      className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-white px-5 text-[11px] font-black text-slate-950 transition hover:bg-cyan-50 sm:w-auto"
                    >
                      Ver ordens
                      <ArrowRight
                        size={14}
                      />
                    </Link>
                  </div>
                </div>
              </section>

              {/* ==================================================
                  STATUS
              ================================================== */}
              <section className="grid grid-cols-2 gap-2.5 sm:gap-3 xl:grid-cols-4">
                <StatusKpi
                  label="Não iniciadas"
                  value={naoIniciadas}
                  total={totalOS}
                  href={hrefOrdensSequoia(
                    {
                      status:
                        "NAO_INICIADA",
                    }
                  )}
                  icon={
                    <ClipboardList
                      size={16}
                    />
                  }
                  tone="red"
                />

                <StatusKpi
                  label="Em andamento"
                  value={emAndamento}
                  total={totalOS}
                  href={hrefOrdensSequoia(
                    {
                      status:
                        "EM_ANDAMENTO",
                    }
                  )}
                  icon={
                    <PlayCircle
                      size={16}
                    />
                  }
                  tone="blue"
                />

                <StatusKpi
                  label="Concluídas"
                  value={concluidas}
                  total={totalOS}
                  href={hrefOrdensSequoia(
                    {
                      status:
                        "CONCLUIDA",
                    }
                  )}
                  icon={
                    <CheckCircle2
                      size={16}
                    />
                  }
                  tone="green"
                />

                <StatusKpi
                  label="Canceladas"
                  value={canceladas}
                  total={totalOS}
                  href={hrefOrdensSequoia(
                    {
                      status:
                        "CANCELADA",
                    }
                  )}
                  icon={
                    <XCircle
                      size={16}
                    />
                  }
                  tone="slate"
                />
              </section>

              {/* ==================================================
                  MIDDLE
              ================================================== */}
              <section className="grid min-h-0 gap-3 xl:grid-cols-[0.92fr_1.78fr_0.82fr]">
                {/* EFICIÊNCIA */}
                <Panel
                  title="Eficiência geral"
                  subtitle="Interna e serviços externos"
                  icon={
                    <Gauge size={17} />
                  }
                >
                  <div className="grid h-full min-h-0 gap-3 sm:grid-cols-[0.92fr_1.08fr]">
                    <div className="flex min-h-[150px] flex-col items-center justify-center rounded-2xl border border-white/[0.06] bg-[#030817] p-3 sm:min-h-0 sm:p-2">
                      <EfficiencyRing
                        percentual={
                          eficienciaPercentual
                        }
                        color="#22d3ee"
                        size="large"
                      />

                      <p className="mt-1 text-[9px] font-black uppercase tracking-[0.09em] text-cyan-300">
                        Eficiência total
                      </p>

                      <p className="mt-0.5 text-[8px] text-slate-600">
                        {concluidas}/
                        {
                          totalOSConsideradas
                        }{" "}
                        OS
                      </p>
                    </div>

                    <div className="grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-1 sm:grid-rows-2">
                      <EfficiencyCompact
                        title="Equipe interna"
                        percentual={
                          eficienciaInterna
                        }
                        concluidas={
                          concluidasInternas
                        }
                        total={
                          totalInternas
                        }
                        color="#22c55e"
                        className="text-emerald-300"
                      />

                      <EfficiencyCompact
                        title="Serviço externo"
                        percentual={
                          eficienciaExterna
                        }
                        concluidas={
                          concluidasExternas
                        }
                        total={
                          totalExternas
                        }
                        color="#f59e0b"
                        className="text-amber-300"
                      />
                    </div>
                  </div>
                </Panel>

                {/* GRÁFICO */}
                <Panel
                  title="Evolução das OS"
                  subtitle="Abertura da OS x término real do relatório • 6 meses"
                  icon={
                    <BarChart3
                      size={17}
                    />
                  }
                  right={
                    <span className="hidden rounded-full border border-white/[0.07] bg-white/[0.025] px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.08em] text-slate-500 2xl:inline-flex">
                      Tendência mensal
                    </span>
                  }
                >
                  <DashboardFluxoOS
                    data={
                      dadosGrafico
                    }
                    criadasMes={
                      mesAtual.criadas
                    }
                    concluidasMes={
                      mesAtual.concluidas
                    }
                    saldoMes={
                      saldoMesAtual
                    }
                  />
                </Panel>

                {/* PRIORIDADES */}
                <Panel
                  title="Prioridades"
                  subtitle="Distribuição por criticidade"
                  icon={
                    <TrendingUp
                      size={17}
                    />
                  }
                >
                  <div className="grid h-full min-h-0 grid-cols-2 grid-rows-2 gap-2">
                    <PriorityKpi
                      label="Baixa"
                      value={baixa}
                      href={hrefOrdensSequoia(
                        {
                          prioridade:
                            "BAIXA",
                        }
                      )}
                      tone="green"
                    />

                    <PriorityKpi
                      label="Média"
                      value={media}
                      href={hrefOrdensSequoia(
                        {
                          prioridade:
                            "MEDIA",
                        }
                      )}
                      tone="yellow"
                    />

                    <PriorityKpi
                      label="Alta"
                      value={alta}
                      href={hrefOrdensSequoia(
                        {
                          prioridade:
                            "ALTA",
                        }
                      )}
                      tone="orange"
                    />

                    <PriorityKpi
                      label="Urgente"
                      value={urgente}
                      href={hrefOrdensSequoia(
                        {
                          prioridade:
                            "URGENTE",
                        }
                      )}
                      tone="red"
                    />
                  </div>
                </Panel>
              </section>

              {/* ==================================================
                  BOTTOM
              ================================================== */}
              <section className="grid min-h-0 gap-3 xl:grid-cols-[1.08fr_0.92fr]">
                <Panel
                  title="Atividades recentes"
                  subtitle="Últimas movimentações das ordens"
                  icon={
                    <Clock3 size={17} />
                  }
                  right={
                    <Link
                      href={
                        hrefOrdensSequoia()
                      }
                      className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.025] px-2.5 py-1.5 text-[8px] font-black text-slate-500 transition hover:text-cyan-300"
                    >
                      Ver todas
                      <ArrowRight
                        size={11}
                      />
                    </Link>
                  }
                >
                  <div className="grid h-full min-h-0 grid-rows-3 gap-1.5">
                    {atividadesRecentes.map(
                      (os) => (
                        <RecentActivity
                          key={os.id}
                          numero={
                            os.numero
                          }
                          titulo={
                            os.titulo ||
                            os.descricao
                          }
                          status={
                            os.status
                          }
                          updatedAt={
                            os.updatedAt
                          }
                          href={`/admin/os/${os.id}`}
                        />
                      )
                    )}
                  </div>
                </Panel>

                <Panel
                  title="Próximas preventivas"
                  subtitle="Programações dos próximos 7 dias"
                  icon={
                    <CalendarClock
                      size={17}
                    />
                  }
                  right={
                    <Link
                      href="/admin/os/preventivas"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.025] px-2.5 py-1.5 text-[8px] font-black text-slate-500 transition hover:text-cyan-300"
                    >
                      Ver cronograma
                      <ArrowRight
                        size={11}
                      />
                    </Link>
                  }
                >
                  {proximasPreventivas.length >
                  0 ? (
                    <div className="grid h-full min-h-0 grid-rows-3 gap-1.5">
                      {proximasPreventivas.map(
                        (execucao) => (
                          <PreventiveRow
                            key={
                              execucao.id
                            }
                            date={
                              execucao.dataProgramada
                            }
                            title={
                              execucao
                                .plano
                                .titulo
                            }
                            machine={
                              execucao
                                .plano
                                .maquina
                                ?.nome ??
                              "Sem máquina"
                            }
                            priority={
                              execucao
                                .plano
                                .prioridade
                            }
                          />
                        )
                      )}
                    </div>
                  ) : (
                    <div className="flex h-full min-h-0 items-center justify-center rounded-xl border border-dashed border-white/[0.07] bg-white/[0.015] text-center">
                      <div>
                        <CheckCircle2
                          size={22}
                          className="mx-auto text-emerald-400"
                        />

                        <p className="mt-1.5 text-[11px] font-black text-slate-300">
                          Agenda preventiva livre
                        </p>

                        <p className="mt-1 text-[8px] text-slate-600">
                          Nenhuma execução nos próximos 7 dias.
                        </p>
                      </div>
                    </div>
                  )}
                </Panel>
              </section>
            </div>
          </div>
        </section>
      </div>

      <AssistenteSistema />
    </main>
  );
}

function Panel({
  title,
  subtitle,
  icon,
  right,
  children,
}: {
  title: string;
  subtitle: string;
  icon: ReactNode;
  right?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-[20px] border border-white/[0.07] bg-[#070c1b] p-4 shadow-[0_8px_28px_rgba(0,0,0,.16)] lg:p-3">
      <div className="flex shrink-0 items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2 sm:gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-cyan-400/12 bg-cyan-400/[0.04] text-cyan-300">
            {icon}
          </div>

          <div className="min-w-0">
            <h2 className="truncate text-[15px] font-black tracking-[-0.02em] text-white lg:text-[14px]">
              {title}
            </h2>

            <p className="mt-0.5 truncate text-[9px] text-slate-600 lg:text-[8px]">
              {subtitle}
            </p>
          </div>
        </div>

        {right}
      </div>

      <div className="mt-2.5 min-h-0 flex-1">
        {children}
      </div>
    </div>
  );
}

function StatusKpi({
  label,
  value,
  total,
  href,
  icon,
  tone,
}: {
  label: string;
  value: number;
  total: number;
  href: string;
  icon: ReactNode;
  tone:
    | "red"
    | "blue"
    | "green"
    | "slate";
}) {
  const percentage =
    total > 0
      ? Math.round(
          (value / total) * 100
        )
      : 0;

  const tones = {
    red: {
      box: "border-red-400/25 bg-[linear-gradient(135deg,rgba(239,68,68,.14),rgba(239,68,68,.04))]",
      text: "text-red-300",
      bar: "bg-red-400",
      icon: "border-red-400/15 bg-red-400/[0.06]",
    },

    blue: {
      box: "border-blue-400/25 bg-[linear-gradient(135deg,rgba(59,130,246,.16),rgba(59,130,246,.04))]",
      text: "text-blue-300",
      bar: "bg-blue-400",
      icon: "border-blue-400/15 bg-blue-400/[0.06]",
    },

    green: {
      box: "border-emerald-400/25 bg-[linear-gradient(135deg,rgba(16,185,129,.16),rgba(16,185,129,.04))]",
      text: "text-emerald-300",
      bar: "bg-emerald-400",
      icon: "border-emerald-400/15 bg-emerald-400/[0.06]",
    },

    slate: {
      box: "border-slate-400/20 bg-[linear-gradient(135deg,rgba(148,163,184,.11),rgba(148,163,184,.03))]",
      text: "text-slate-300",
      bar: "bg-slate-400",
      icon: "border-slate-400/12 bg-slate-400/[0.05]",
    },
  };

  const current =
    tones[tone];

  return (
    <Link
      href={href}
      className={`group rounded-[18px] border px-3 py-3 transition hover:-translate-y-0.5 sm:px-4 ${current.box}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border ${current.icon} ${current.text}`}
          >
            {icon}
          </div>

          <p
            className={`min-w-0 text-[10px] font-black leading-tight sm:truncate sm:text-[11px] ${current.text}`}
          >
            {label}
          </p>
        </div>

        <span
          className={`hidden rounded-full bg-white/[0.07] px-2 py-0.5 text-[9px] font-black sm:inline-flex ${current.text}`}
        >
          {percentage}%
        </span>
      </div>

      <div className="mt-1.5 flex items-end gap-2">
        <p className="text-[26px] font-black leading-none tracking-[-0.045em] text-white">
          {value}
        </p>

        <p className="pb-0.5 text-[8px] font-semibold text-slate-600">
          ordens
        </p>
      </div>

      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
        <div
          className={`h-full rounded-full ${current.bar}`}
          style={{
            width: `${Math.min(
              100,
              Math.max(
                0,
                percentage
              )
            )}%`,
          }}
        />
      </div>
    </Link>
  );
}

function EfficiencyRing({
  percentual,
  color,
  size,
}: {
  percentual: number;
  color: string;
  size: "large" | "small";
}) {
  const outer =
    size === "large"
      ? "h-[100px] w-[100px]"
      : "h-12 w-12";

  const inner =
    size === "large"
      ? "h-[73px] w-[73px]"
      : "h-[34px] w-[34px]";

  return (
    <div
      className={`relative flex items-center justify-center rounded-full bg-slate-900 ${outer}`}
    >
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `conic-gradient(${color} ${percentual}%, #162033 0)`,
        }}
      />

      <div
        className={`relative flex items-center justify-center rounded-full bg-[#020617] ${inner}`}
      >
        <span
          className={
            size === "large"
              ? "text-[24px] font-black tracking-[-0.05em] text-white"
              : "text-[9px] font-black text-white"
          }
        >
          {percentual}%
        </span>
      </div>
    </div>
  );
}

function EfficiencyCompact({
  title,
  percentual,
  concluidas,
  total,
  color,
  className,
}: {
  title: string;
  percentual: number;
  concluidas: number;
  total: number;
  color: string;
  className: string;
}) {
  return (
    <div className="flex min-h-0 items-center gap-2 rounded-xl border border-white/[0.06] bg-[#030817] px-2 py-2">
      <EfficiencyRing
        percentual={percentual}
        color={color}
        size="small"
      />

      <div className="min-w-0">
        <p
          className={`truncate text-[9px] font-black ${className}`}
        >
          {title}
        </p>

        <p className="mt-0.5 text-[8px] text-slate-600">
          {concluidas}/{total} OS
        </p>
      </div>
    </div>
  );
}

function PriorityKpi({
  label,
  value,
  href,
  tone,
}: {
  label: string;
  value: number;
  href: string;
  tone:
    | "green"
    | "yellow"
    | "orange"
    | "red";
}) {
  const tones = {
    green:
      "border-emerald-400/20 bg-emerald-500/[0.08] text-emerald-300",
    yellow:
      "border-yellow-400/20 bg-yellow-500/[0.08] text-yellow-300",
    orange:
      "border-orange-400/20 bg-orange-500/[0.08] text-orange-300",
    red:
      "border-red-400/20 bg-red-500/[0.08] text-red-300",
  };

  return (
    <Link
      href={href}
      className={`group flex min-h-0 flex-col justify-center rounded-xl border px-3 py-2 transition hover:-translate-y-0.5 ${tones[tone]}`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[9px] font-black">
          {label}
        </p>

        <ArrowRight
          size={11}
          className="opacity-30 transition group-hover:translate-x-0.5 group-hover:opacity-100"
        />
      </div>

      <div className="mt-1 flex items-end gap-1.5">
        <p className="text-[23px] font-black leading-none tracking-[-0.04em]">
          {value}
        </p>

        <span className="pb-0.5 text-[8px] font-black text-slate-600">
          OS
        </span>
      </div>
    </Link>
  );
}

function RecentActivity({
  numero,
  titulo,
  status,
  updatedAt,
  href,
}: {
  numero: number;
  titulo: string;
  status: string;
  updatedAt: Date;
  href: string;
}) {
  const config: Record<
    string,
    {
      dot: string;
      badge: string;
    }
  > = {
    NAO_INICIADA: {
      dot: "bg-yellow-400",
      badge:
        "bg-yellow-400/10 text-yellow-300",
    },

    EM_ANDAMENTO: {
      dot: "bg-blue-400",
      badge:
        "bg-blue-400/10 text-blue-300",
    },

    CONCLUIDA: {
      dot: "bg-emerald-400",
      badge:
        "bg-emerald-400/10 text-emerald-300",
    },

    CANCELADA: {
      dot: "bg-slate-400",
      badge:
        "bg-slate-400/10 text-slate-300",
    },
  };

  const current =
    config[status] ??
    config.NAO_INICIADA;

  return (
    <Link
      href={href}
      className="group flex min-h-[42px] items-center gap-2.5 rounded-xl border border-white/[0.055] bg-[#030817] px-3 py-2 transition hover:border-cyan-400/15 hover:bg-cyan-400/[0.025] lg:min-h-0 lg:py-1.5"
    >
      <span
        className={`h-2 w-2 shrink-0 rounded-full ${current.dot}`}
      />

      <p className="shrink-0 text-[9px] font-black text-white">
        OS #{numero}
      </p>

      <p className="min-w-0 flex-1 truncate text-[8px] text-slate-500">
        {statusLabel(status)} •{" "}
        {titulo}
      </p>

      <span
        className={`shrink-0 rounded-full px-2 py-0.5 text-[7px] font-black ${current.badge}`}
      >
        {tempoRelativo(
          updatedAt
        )}
      </span>
    </Link>
  );
}

function PreventiveRow({
  date,
  title,
  machine,
  priority,
}: {
  date: Date;
  title: string;
  machine: string;
  priority: string;
}) {
  const tones: Record<
    string,
    string
  > = {
    BAIXA:
      "bg-emerald-400/10 text-emerald-300",
    MEDIA:
      "bg-yellow-400/10 text-yellow-300",
    ALTA:
      "bg-orange-400/10 text-orange-300",
    URGENTE:
      "bg-red-400/10 text-red-300",
  };

  return (
    <div className="flex min-h-[42px] items-center gap-2.5 rounded-xl border border-white/[0.055] bg-[#030817] px-3 py-2 lg:min-h-0 lg:py-1.5">
      <div className="flex min-w-[52px] shrink-0 items-center justify-center rounded-lg border border-cyan-400/10 bg-cyan-400/[0.04] px-2 py-1 text-[8px] font-black text-cyan-300">
        {rotuloDataCurta(
          date
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[9px] font-black text-white">
          {title}
        </p>

        <p className="mt-0.5 truncate text-[8px] text-slate-600">
          {machine}
        </p>
      </div>

      <span
        className={`shrink-0 rounded-full px-2 py-0.5 text-[7px] font-black ${
          tones[
            priority
          ] ??
          "bg-slate-400/10 text-slate-300"
        }`}
      >
        {prioridadeLabel(
          priority
        )}
      </span>
    </div>
  );
}
