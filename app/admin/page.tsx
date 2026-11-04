import type { ReactNode } from "react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Building2,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Factory,
  Gauge,
  Layers3,
  PlayCircle,
  ShieldCheck,
  TrendingUp,
  Users,
  Wrench,
  XCircle,
} from "lucide-react";

import { authOptions } from "@/src/lib/auth";
import HeaderUsuario from "@/components/HeaderUsuario";
import AdminMenu from "@/components/AdminMenu";
import AssistenteSistema from "@/components/AssistenteSistema";
import { prisma } from "@/src/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const empresaSequoia = await prisma.empresa.findFirst({
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

  const empresaSequoiaId = empresaSequoia?.id ?? "";

  /*
   * ============================================================
   * SERVIÇOS EXTERNOS
   * ============================================================
   *
   * Mantemos a mesma regra já utilizada pela Home:
   *
   * - EMPREITEIRA
   * - Zeze Serralheiro
   */
  const usuariosServicoExterno = await prisma.user.findMany({
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
            equals: "Zeze serralheiro",
            mode: "insensitive",
          },
        },
      ],
    },
    select: {
      id: true,
    },
  });

  const idsServicoExterno = usuariosServicoExterno.map(
    (usuario) => usuario.id
  );

  const hrefOrdensSequoia = (
    filtros?: Record<string, string>
  ) => {
    const parametros = new URLSearchParams();

    if (empresaSequoiaId) {
      parametros.set(
        "empresaId",
        empresaSequoiaId
      );
    }

    Object.entries(
      filtros ?? {}
    ).forEach(([chave, valor]) => {
      parametros.set(chave, valor);
    });

    const consulta =
      parametros.toString();

    return consulta
      ? `/admin/os?${consulta}`
      : "/admin/os";
  };

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
    colaboradores,
    setores,
    totalExternas,
    concluidasExternas,
    maquinasAtivas,
    planosPreventivosAtivos,
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
        status: "NAO_INICIADA",
      },
    }),

    prisma.ordemServico.count({
      where: {
        empresaId:
          empresaSequoiaId,
        status: "EM_ANDAMENTO",
      },
    }),

    prisma.ordemServico.count({
      where: {
        empresaId:
          empresaSequoiaId,
        status: "CONCLUIDA",
      },
    }),

    prisma.ordemServico.count({
      where: {
        empresaId:
          empresaSequoiaId,
        status: "CANCELADA",
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
        prioridade: "URGENTE",
      },
    }),

    prisma.user.count({
      where: {
        ativo: true,
        perfil: "COLABORADOR",
        empresaOrigemId:
          empresaSequoiaId,
      },
    }),

    prisma.setor.count({
      where: {
        ativo: true,
        empresaId:
          empresaSequoiaId,
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

    prisma.maquina.count({
      where: {
        ativo: true,
        setor: {
          is: {
            empresaId:
              empresaSequoiaId,
          },
        },
      },
    }),

    prisma.planoPreventivo.count({
      where: {
        empresaId:
          empresaSequoiaId,
        ativo: true,
      },
    }),
  ]);

  const totalOSConsideradas =
    Math.max(
      0,
      totalOS - canceladas
    );

  const abertas =
    naoIniciadas + emAndamento;

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

  return (
    <main className="h-screen overflow-hidden bg-[#020617] text-white">
      <div className="flex h-full min-w-0">
        {/* ======================================================
            SIDEBAR
        ======================================================= */}
        <aside className="hidden h-full w-72 shrink-0 flex-col border-r border-white/[0.08] bg-[#020617] text-white lg:flex">
          <div className="shrink-0 px-6 pb-5 pt-6">
            <h1 className="text-2xl font-extrabold tracking-[-0.03em]">
              Sistema de OS
            </h1>

            <p className="mt-1 text-sm text-slate-400">
              Painel de manutenção
            </p>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto pb-4">
            <AdminMenu />
          </div>

          <footer className="shrink-0 border-t border-white/[0.08] bg-[#020617] px-6 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-600">
              Desenvolvido por
            </p>

            <p className="mt-1 text-sm font-bold text-slate-200">
              Pedro H. Laranjeira
            </p>

            <p className="mt-2 text-xs font-semibold text-cyan-300">
              Versão 1.0.0
            </p>
          </footer>
        </aside>

        {/* ======================================================
            CONTEÚDO
        ======================================================= */}
        <section className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden">
          <HeaderUsuario />

          <div className="mx-auto w-full max-w-[1700px] px-4 py-5 sm:px-6 lg:px-8">
            {/* ==================================================
                HERO / EXECUTIVE OVERVIEW
            ================================================== */}
            <section className="relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-[linear-gradient(135deg,#07101f_0%,#081526_54%,#06101f_100%)] shadow-[0_18px_60px_rgba(0,0,0,0.24)]">
              <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-cyan-400/[0.08] blur-3xl" />
              <div className="pointer-events-none absolute bottom-0 left-[38%] h-32 w-80 rounded-full bg-blue-500/[0.05] blur-3xl" />

              <div className="relative p-5 sm:p-6 lg:p-7">
                <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.15em] text-cyan-300">
                      <Activity size={15} />
                      Visão operacional
                    </p>

                    <h1 className="mt-3 text-3xl font-black tracking-[-0.045em] text-white sm:text-[34px]">
                      Controle de Ordens de Serviço
                    </h1>

                    <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
                      Acompanhe o fluxo de manutenção, prioridades, capacidade operacional e eficiência da equipe em uma única visão.
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Link
                      href="/admin/maquinas"
                      className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/[0.09] bg-white/[0.04] px-5 text-sm font-black text-slate-200 transition hover:border-cyan-400/30 hover:bg-cyan-400/[0.07] hover:text-cyan-200"
                    >
                      <Factory size={17} />
                      Máquinas
                    </Link>

                    <Link
                      href={hrefOrdensSequoia()}
                      className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-black text-slate-950 transition hover:bg-cyan-50"
                    >
                      Ver ordens
                      <ArrowRight size={17} />
                    </Link>
                  </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                  <ExecutiveMetric
                    label="Total de OS"
                    value={totalOS}
                    helper="Base histórica"
                    icon={
                      <ClipboardList
                        size={17}
                      />
                    }
                    tone="cyan"
                  />

                  <ExecutiveMetric
                    label="OS abertas"
                    value={abertas}
                    helper="Fila operacional"
                    icon={
                      <Activity
                        size={17}
                      />
                    }
                    tone="blue"
                  />

                  <ExecutiveMetric
                    label="Concluídas"
                    value={concluidas}
                    helper={`${eficienciaPercentual}% de eficiência`}
                    icon={
                      <CheckCircle2
                        size={17}
                      />
                    }
                    tone="green"
                  />

                  <ExecutiveMetric
                    label="Urgentes"
                    value={urgente}
                    helper="Nível máximo"
                    icon={
                      <AlertTriangle
                        size={17}
                      />
                    }
                    tone="red"
                  />

                  <ExecutiveMetric
                    label="Máquinas ativas"
                    value={maquinasAtivas}
                    helper={`${planosPreventivosAtivos} planos preventivos`}
                    icon={
                      <Factory size={17} />
                    }
                    tone="violet"
                  />
                </div>
              </div>
            </section>

            {/* ==================================================
                STATUS + EFICIÊNCIA
            ================================================== */}
            <section className="mt-5 grid min-w-0 gap-5 xl:grid-cols-[1.65fr_1fr]">
              {/* STATUS */}
              <DashboardPanel
                eyebrow="Fluxo operacional"
                title="Status das ordens"
                description="Distribuição atual das OS por etapa do processo."
                icon={
                  <BarChart3 size={20} />
                }
              >
                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  <StatusCard
                    label="Não iniciadas"
                    value={naoIniciadas}
                    total={totalOS}
                    href={hrefOrdensSequoia({
                      status: "NAO_INICIADA",
                    })}
                    tone="red"
                    icon={
                      <AlertTriangle
                        size={18}
                      />
                    }
                  />

                  <StatusCard
                    label="Em andamento"
                    value={emAndamento}
                    total={totalOS}
                    href={hrefOrdensSequoia({
                      status: "EM_ANDAMENTO",
                    })}
                    tone="blue"
                    icon={
                      <PlayCircle
                        size={18}
                      />
                    }
                  />

                  <StatusCard
                    label="Concluídas"
                    value={concluidas}
                    total={totalOS}
                    href={hrefOrdensSequoia({
                      status: "CONCLUIDA",
                    })}
                    tone="green"
                    icon={
                      <CheckCircle2
                        size={18}
                      />
                    }
                  />

                  <StatusCard
                    label="Canceladas"
                    value={canceladas}
                    total={totalOS}
                    href={hrefOrdensSequoia({
                      status: "CANCELADA",
                    })}
                    tone="slate"
                    icon={
                      <XCircle size={18} />
                    }
                  />
                </div>
              </DashboardPanel>

              {/* EFICIÊNCIA */}
              <DashboardPanel
                eyebrow="Performance"
                title="Eficiência operacional"
                description="Conclusão geral, equipe interna e serviços externos."
                icon={<Gauge size={20} />}
              >
                <div className="mt-5 rounded-2xl border border-white/[0.07] bg-[#030817] p-4">
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                    <div className="shrink-0">
                      <EfficiencyRingLarge
                        percentual={
                          eficienciaPercentual
                        }
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-cyan-300">
                        Eficiência total
                      </p>

                      <p className="mt-1 text-2xl font-black tracking-[-0.03em] text-white">
                        {concluidas}/
                        {
                          totalOSConsideradas
                        }{" "}
                        OS
                      </p>

                      <p className="mt-2 text-xs leading-5 text-slate-500">
                        OS canceladas não entram no cálculo da eficiência.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3">
                  <EfficiencyMini
                    titulo="Equipe interna"
                    percentual={
                      eficienciaInterna
                    }
                    concluidas={
                      concluidasInternas
                    }
                    total={totalInternas}
                    cor="#22c55e"
                    classe="text-emerald-300"
                  />

                  <EfficiencyMini
                    titulo="Serviço externo"
                    percentual={
                      eficienciaExterna
                    }
                    concluidas={
                      concluidasExternas
                    }
                    total={totalExternas}
                    cor="#f59e0b"
                    classe="text-amber-300"
                  />
                </div>

                <div className="mt-3 rounded-2xl border border-amber-400/10 bg-amber-500/[0.035] px-4 py-3">
                  <p className="text-[9px] font-black uppercase tracking-[0.12em] text-amber-300/80">
                    Classificação externa
                  </p>

                  <p className="mt-1 text-xs font-semibold text-slate-400">
                    EMPREITEIRA • Zeze Serralheiro
                  </p>
                </div>
              </DashboardPanel>
            </section>

            {/* ==================================================
                PRIORIDADES + OPERAÇÃO
            ================================================== */}
            <section className="mt-5 grid min-w-0 gap-5 xl:grid-cols-[1.5fr_1fr]">
              {/* PRIORIDADES */}
              <DashboardPanel
                eyebrow="Criticidade"
                title="Prioridades"
                description="Distribuição das OS pelo nível de urgência."
                icon={
                  <TrendingUp size={20} />
                }
              >
                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <PriorityCard
                    label="Baixa"
                    value={baixa}
                    href={hrefOrdensSequoia({
                      prioridade: "BAIXA",
                    })}
                    tone="green"
                  />

                  <PriorityCard
                    label="Média"
                    value={media}
                    href={hrefOrdensSequoia({
                      prioridade: "MEDIA",
                    })}
                    tone="yellow"
                  />

                  <PriorityCard
                    label="Alta"
                    value={alta}
                    href={hrefOrdensSequoia({
                      prioridade: "ALTA",
                    })}
                    tone="orange"
                  />

                  <PriorityCard
                    label="Urgente"
                    value={urgente}
                    href={hrefOrdensSequoia({
                      prioridade: "URGENTE",
                    })}
                    tone="red"
                  />
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/[0.06] pt-4">
                  <span className="text-[10px] font-black uppercase tracking-[0.11em] text-slate-600">
                    Total classificado
                  </span>

                  <span className="rounded-full border border-white/[0.08] bg-white/[0.025] px-3 py-1.5 text-xs font-black text-slate-300">
                    {baixa +
                      media +
                      alta +
                      urgente}{" "}
                    OS
                  </span>
                </div>
              </DashboardPanel>

              {/* OPERAÇÃO */}
              <DashboardPanel
                eyebrow="Navegação"
                title="Operação & cadastros"
                description="Acesso rápido aos módulos mais utilizados."
                icon={
                  <Layers3 size={20} />
                }
              >
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <OperationCard
                    title="Máquinas"
                    value={
                      maquinasAtivas
                    }
                    helper="Ativos monitorados"
                    href="/admin/maquinas"
                    icon={
                      <Factory size={18} />
                    }
                    tone="cyan"
                  />

                  <OperationCard
                    title="Preventivas"
                    value={
                      planosPreventivosAtivos
                    }
                    helper="Planos ativos"
                    href="/admin/os/preventivas"
                    icon={
                      <CalendarClock
                        size={18}
                      />
                    }
                    tone="violet"
                  />

                  <OperationCard
                    title="Colaboradores"
                    value={colaboradores}
                    helper="Usuários ativos"
                    href="/admin/colaboradores"
                    icon={
                      <Users size={18} />
                    }
                    tone="blue"
                  />

                  <OperationCard
                    title="Setores"
                    value={setores}
                    helper="Áreas cadastradas"
                    href="/admin/setores"
                    icon={
                      <Building2
                        size={18}
                      />
                    }
                    tone="slate"
                  />
                </div>
              </DashboardPanel>
            </section>

            {/* ==================================================
                AÇÕES RÁPIDAS
            ================================================== */}
            <section className="mt-5 rounded-[24px] border border-white/[0.07] bg-[#070c1b] p-4 shadow-[0_10px_35px_rgba(0,0,0,0.18)] sm:p-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
                <div className="flex min-w-[190px] items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/15 bg-cyan-400/[0.05] text-cyan-300">
                    <Wrench size={18} />
                  </div>

                  <div>
                    <p className="text-sm font-black text-white">
                      Ações rápidas
                    </p>

                    <p className="text-[11px] text-slate-600">
                      Rotinas principais
                    </p>
                  </div>
                </div>

                <div className="grid flex-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <QuickAction
                    href="/admin/os/nova"
                    label="Nova OS"
                    icon={
                      <ClipboardList
                        size={17}
                      />
                    }
                    primary
                  />

                  <QuickAction
                    href="/admin/maquinas"
                    label="Máquinas"
                    icon={
                      <Factory size={17} />
                    }
                  />

                  <QuickAction
                    href="/admin/os/preventivas"
                    label="Preventivas"
                    icon={
                      <ShieldCheck
                        size={17}
                      />
                    }
                  />

                  <QuickAction
                    href="/admin/os/indicadores"
                    label="Indicadores"
                    icon={
                      <BarChart3
                        size={17}
                      />
                    }
                  />
                </div>
              </div>
            </section>
          </div>
        </section>
      </div>

      <AssistenteSistema />
    </main>
  );
}

function DashboardPanel({
  eyebrow,
  title,
  description,
  icon,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0 rounded-[24px] border border-white/[0.07] bg-[#070c1b] p-5 shadow-[0_10px_35px_rgba(0,0,0,0.18)] sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-cyan-300/80">
            {eyebrow}
          </p>

          <h2 className="mt-1.5 text-xl font-black tracking-[-0.025em] text-white">
            {title}
          </h2>

          <p className="mt-1 text-sm leading-5 text-slate-500">
            {description}
          </p>
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/[0.07] bg-[#020617] text-slate-300">
          {icon}
        </div>
      </div>

      {children}
    </div>
  );
}

function ExecutiveMetric({
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
    | "blue"
    | "green"
    | "red"
    | "violet";
}) {
  const tones = {
    cyan: {
      box: "border-cyan-400/15 bg-cyan-400/[0.045]",
      icon: "text-cyan-300",
    },
    blue: {
      box: "border-blue-400/15 bg-blue-400/[0.045]",
      icon: "text-blue-300",
    },
    green: {
      box: "border-emerald-400/15 bg-emerald-400/[0.045]",
      icon: "text-emerald-300",
    },
    red: {
      box: "border-red-400/15 bg-red-400/[0.045]",
      icon: "text-red-300",
    },
    violet: {
      box: "border-violet-400/15 bg-violet-400/[0.045]",
      icon: "text-violet-300",
    },
  };

  const current =
    tones[tone];

  return (
    <div
      className={`rounded-2xl border p-3.5 ${current.box}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.1em] text-slate-500">
            {label}
          </p>

          <p className="mt-1.5 text-[26px] font-black leading-none tracking-[-0.04em] text-white">
            {value}
          </p>

          <p className="mt-1.5 text-[10px] font-medium text-slate-600">
            {helper}
          </p>
        </div>

        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.06] bg-black/10 ${current.icon}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function StatusCard({
  label,
  value,
  total,
  href,
  tone,
  icon,
}: {
  label: string;
  value: number;
  total: number;
  href: string;
  tone:
    | "red"
    | "blue"
    | "green"
    | "slate";
  icon: ReactNode;
}) {
  const percentage =
    total > 0
      ? Math.round(
          (value / total) * 100
        )
      : 0;

  const tones = {
    red: {
      box: "border-red-400/15 bg-red-500/[0.055]",
      text: "text-red-300",
      bar: "bg-red-400",
      chip: "bg-red-400/10",
    },

    blue: {
      box: "border-blue-400/15 bg-blue-500/[0.055]",
      text: "text-blue-300",
      bar: "bg-blue-400",
      chip: "bg-blue-400/10",
    },

    green: {
      box: "border-emerald-400/15 bg-emerald-500/[0.055]",
      text: "text-emerald-300",
      bar: "bg-emerald-400",
      chip: "bg-emerald-400/10",
    },

    slate: {
      box: "border-slate-400/15 bg-slate-500/[0.055]",
      text: "text-slate-300",
      bar: "bg-slate-400",
      chip: "bg-slate-400/10",
    },
  };

  const current =
    tones[tone];

  return (
    <Link
      href={href}
      className={`group rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:border-cyan-400/20 ${current.box}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-xl ${current.chip} ${current.text}`}
          >
            {icon}
          </div>

          <div>
            <p
              className={`text-sm font-black ${current.text}`}
            >
              {label}
            </p>

            <p className="mt-0.5 text-[10px] text-slate-600">
              {percentage}% do total
            </p>
          </div>
        </div>

        <ArrowRight
          size={15}
          className="mt-1 text-slate-700 transition group-hover:translate-x-0.5 group-hover:text-cyan-300"
        />
      </div>

      <div className="mt-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-3xl font-black tracking-[-0.04em] text-white">
            {value}
          </p>

          <p className="text-[10px] font-semibold text-slate-600">
            ordens
          </p>
        </div>

        <span
          className={`rounded-full px-2.5 py-1 text-[10px] font-black ${current.chip} ${current.text}`}
        >
          {percentage}%
        </span>
      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
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

function EfficiencyRingLarge({
  percentual,
}: {
  percentual: number;
}) {
  return (
    <div className="relative flex h-32 w-32 items-center justify-center rounded-full bg-slate-900">
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `conic-gradient(#22d3ee ${percentual}%, #162033 0)`,
        }}
      />

      <div className="relative flex h-[94px] w-[94px] flex-col items-center justify-center rounded-full bg-[#020617] shadow-[inset_0_0_24px_rgba(34,211,238,0.04)]">
        <span className="text-[30px] font-black leading-none tracking-[-0.05em] text-white">
          {percentual}%
        </span>

        <span className="mt-1 text-[9px] font-black uppercase tracking-[0.1em] text-cyan-300">
          eficiência
        </span>
      </div>
    </div>
  );
}

function EfficiencyMini({
  titulo,
  percentual,
  concluidas,
  total,
  cor,
  classe,
}: {
  titulo: string;
  percentual: number;
  concluidas: number;
  total: number;
  cor: string;
  classe: string;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-3">
      <div className="flex items-center gap-3">
        <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-slate-900">
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: `conic-gradient(${cor} ${percentual}%, #162033 0)`,
            }}
          />

          <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-[#020617]">
            <span className="text-[11px] font-black text-white">
              {percentual}%
            </span>
          </div>
        </div>

        <div className="min-w-0">
          <p
            className={`text-xs font-black ${classe}`}
          >
            {titulo}
          </p>

          <p className="mt-1 text-[10px] text-slate-600">
            {concluidas}/{total} OS
          </p>
        </div>
      </div>
    </div>
  );
}

function PriorityCard({
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
      "border-emerald-400/15 bg-emerald-500/[0.055] text-emerald-300",
    yellow:
      "border-yellow-400/15 bg-yellow-500/[0.055] text-yellow-300",
    orange:
      "border-orange-400/15 bg-orange-500/[0.055] text-orange-300",
    red:
      "border-red-400/15 bg-red-500/[0.055] text-red-300",
  };

  return (
    <Link
      href={href}
      className={`group rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:border-white/20 ${tones[tone]}`}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-black">
          {label}
        </p>

        <ArrowRight
          size={14}
          className="opacity-30 transition group-hover:translate-x-0.5 group-hover:opacity-100"
        />
      </div>

      <p className="mt-3 text-3xl font-black tracking-[-0.04em]">
        {value}
      </p>

      <p className="mt-1 text-[10px] font-semibold text-slate-600">
        ordens classificadas
      </p>
    </Link>
  );
}

function OperationCard({
  title,
  value,
  helper,
  href,
  icon,
  tone,
}: {
  title: string;
  value: number;
  helper: string;
  href: string;
  icon: ReactNode;
  tone:
    | "cyan"
    | "violet"
    | "blue"
    | "slate";
}) {
  const tones = {
    cyan: {
      box: "hover:border-cyan-400/20",
      icon: "border-cyan-400/15 bg-cyan-400/[0.05] text-cyan-300",
    },
    violet: {
      box: "hover:border-violet-400/20",
      icon: "border-violet-400/15 bg-violet-400/[0.05] text-violet-300",
    },
    blue: {
      box: "hover:border-blue-400/20",
      icon: "border-blue-400/15 bg-blue-400/[0.05] text-blue-300",
    },
    slate: {
      box: "hover:border-slate-300/20",
      icon: "border-white/[0.08] bg-white/[0.03] text-slate-300",
    },
  };

  const current =
    tones[tone];

  return (
    <Link
      href={href}
      className={`group rounded-2xl border border-white/[0.06] bg-[#030817] p-4 transition hover:-translate-y-0.5 ${current.box}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl border ${current.icon}`}
        >
          {icon}
        </div>

        <ArrowRight
          size={15}
          className="mt-1 text-slate-700 transition group-hover:translate-x-0.5 group-hover:text-cyan-300"
        />
      </div>

      <p className="mt-4 text-[10px] font-black uppercase tracking-[0.1em] text-slate-600">
        {title}
      </p>

      <p className="mt-1 text-2xl font-black tracking-[-0.04em] text-white">
        {value}
      </p>

      <p className="mt-1 text-[10px] text-slate-600">
        {helper}
      </p>
    </Link>
  );
}

function QuickAction({
  href,
  label,
  icon,
  primary = false,
}: {
  href: string;
  label: string;
  icon: ReactNode;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl border px-4 text-xs font-black transition ${
        primary
          ? "border-cyan-300 bg-cyan-400 text-slate-950 hover:bg-cyan-300"
          : "border-white/[0.08] bg-white/[0.03] text-slate-300 hover:border-cyan-400/25 hover:bg-cyan-400/[0.05] hover:text-cyan-200"
      }`}
    >
      {icon}
      {label}
    </Link>
  );
}
