import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Clock3,
  Download,
  FileSpreadsheet,
  Gauge,
  Search,
  ShieldCheck,
  Target,
  TimerReset,
  TrendingUp,
  UserRound,
  Users,
  Wrench,
  XCircle,
  Zap,
} from "lucide-react";

import { authOptions } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import {
  fimDoDia,
  formatarDuracaoMinutos,
  obterDataConclusaoKpi,
  obterDuracaoKpiMinutos,
} from "@/src/lib/kpiColaborador";

export const dynamic =
  "force-dynamic";

export const revalidate = 0;

type PageProps = {
  searchParams?: Promise<{
    colaborador?: string;
  }>;
};

function limitarPercentual(
  valor: number
) {
  return Math.min(
    100,
    Math.max(0, valor)
  );
}

export default async function DashboardColaboradoresPage({
  searchParams,
}: PageProps) {
  const session =
    await getServerSession(
      authOptions
    );

  if (!session) {
    redirect("/login");
  }

  const params =
    await searchParams;

  const filtroColaborador =
    params?.colaborador?.trim() ??
    "";

  const agora = new Date();

  const inicioHoje =
    new Date(agora);

  inicioHoje.setHours(
    0,
    0,
    0,
    0
  );

  const inicio30Dias =
    new Date(agora);

  inicio30Dias.setDate(
    inicio30Dias.getDate() -
      30
  );

  inicio30Dias.setHours(
    0,
    0,
    0,
    0
  );

  const colaboradores =
    await prisma.user.findMany({
      where: {
        ativo: true,

        /*
         * Só entra no painel quem realmente atua nas OS:
         * usuário ativo + pelo menos uma OS vinculada.
         */
        ordensResponsavel: {
          some: {},
        },

        nome:
          filtroColaborador
            ? {
                contains:
                  filtroColaborador,
                mode:
                  "insensitive",
              }
            : undefined,
      },

      orderBy: {
        nome: "asc",
      },

      include: {
        setor: {
          select: {
            id: true,
            nome: true,
            tipo: true,
          },
        },

        funcao: {
          select: {
            id: true,
            nome: true,
          },
        },

        ordensResponsavel: {
          include: {
            os: {
              select: {
                id: true,
                numero: true,
                status: true,
                prioridade: true,
                dataPrevista: true,
                dataConclusao: true,
                duracaoExecucaoMinutos:
                  true,
                registroFinal: true,
                createdAt: true,
              },
            },
          },
        },

        execucoesPreventivasResponsavel:
          {
            include: {
              execucao: {
                select: {
                  id: true,
                  status: true,
                  dataProgramada:
                    true,
                  dataConclusao:
                    true,
                  duracaoEstimadaMinutos:
                    true,
                  duracaoRealMinutos:
                    true,
                },
              },
            },
          },
      },
    });

  const dadosColaboradores =
    colaboradores.map(
      (colaborador) => {
        const ordens =
          colaborador.ordensResponsavel.map(
            (item) => item.os
          );

        const total =
          ordens.length;

        const canceladas =
          ordens.filter(
            (os) =>
              os.status ===
              "CANCELADA"
          ).length;

        const validas =
          ordens.filter(
            (os) =>
              os.status !==
              "CANCELADA"
          );

        const naoIniciadas =
          ordens.filter(
            (os) =>
              os.status ===
              "NAO_INICIADA"
          ).length;

        const emAndamento =
          ordens.filter(
            (os) =>
              os.status ===
              "EM_ANDAMENTO"
          ).length;

        const concluidas =
          ordens.filter(
            (os) =>
              os.status ===
              "CONCLUIDA"
          ).length;

        const abertas =
          naoIniciadas +
          emAndamento;

        const atrasadas =
          ordens.filter(
            (os) => {
              if (
                os.status ===
                  "CONCLUIDA" ||
                os.status ===
                  "CANCELADA" ||
                !os.dataPrevista
              ) {
                return false;
              }

              return (
                fimDoDia(
                  os.dataPrevista
                ) < agora
              );
            }
          ).length;

        const urgentesAbertas =
          ordens.filter(
            (os) =>
              os.status !==
                "CONCLUIDA" &&
              os.status !==
                "CANCELADA" &&
              os.prioridade ===
                "URGENTE"
          ).length;

        const concluidas30Dias =
          ordens.filter(
            (os) => {
              if (
                os.status !==
                "CONCLUIDA"
              ) {
                return false;
              }

              const dataConclusaoKpi =
                obterDataConclusaoKpi(
                  os
                );

              return Boolean(
                dataConclusaoKpi &&
                  dataConclusaoKpi >=
                    inicio30Dias &&
                  dataConclusaoKpi <=
                    agora
              );
            }
          ).length;

        /*
         * Canceladas não entram no denominador.
         */
        const eficiencia =
          validas.length > 0
            ? Math.round(
                (concluidas /
                  validas.length) *
                  100
              )
            : 0;

        const concluidasComPrazo =
          ordens.filter(
            (os) =>
              os.status ===
                "CONCLUIDA" &&
              os.dataPrevista &&
              os.dataConclusao
          );

        const concluidasNoPrazo =
          concluidasComPrazo.filter(
            (os) =>
              os.dataConclusao &&
              os.dataPrevista &&
              new Date(
                os.dataConclusao
              ) <=
                fimDoDia(
                  os.dataPrevista
                )
          ).length;

        const cumprimentoPrazo =
          concluidasComPrazo.length >
          0
            ? Math.round(
                (concluidasNoPrazo /
                  concluidasComPrazo.length) *
                  100
              )
            : null;

        /*
         * MTTR:
         * fonte principal = horário informado no relatório.
         */
        const duracoes =
          ordens
            .filter(
              (os) =>
                os.status ===
                "CONCLUIDA"
            )
            .map((os) =>
              obterDuracaoKpiMinutos(
                os
              )
            )
            .filter(
              (
                valor
              ): valor is number =>
                typeof valor ===
                  "number" &&
                valor > 0
            );

        const mttrMinutos =
          duracoes.length > 0
            ? Math.round(
                duracoes.reduce(
                  (
                    soma,
                    valor
                  ) =>
                    soma +
                    valor,
                  0
                ) /
                  duracoes.length
              )
            : 0;

        const execucoesPreventivas =
          colaborador.execucoesPreventivasResponsavel.map(
            (item) =>
              item.execucao
          );

        const preventivasAtivas =
          execucoesPreventivas.filter(
            (execucao) =>
              execucao.status ===
                "PROGRAMADA" ||
              execucao.status ===
                "PENDENTE" ||
              execucao.status ===
                "EM_EXECUCAO"
          );

        const preventivasConcluidas =
          execucoesPreventivas.filter(
            (execucao) =>
              execucao.status ===
              "CONCLUIDA"
          ).length;

        const preventivasAtrasadas =
          execucoesPreventivas.filter(
            (execucao) =>
              (execucao.status ===
                "PROGRAMADA" ||
                execucao.status ===
                  "PENDENTE") &&
              new Date(
                execucao.dataProgramada
              ) <
                inicioHoje
          ).length;

        const preventivasConcluidas30Dias =
          execucoesPreventivas.filter(
            (execucao) =>
              execucao.status ===
                "CONCLUIDA" &&
              execucao.dataConclusao &&
              new Date(
                execucao.dataConclusao
              ) >=
                inicio30Dias
          ).length;

        return {
          colaborador,
          ordens,
          total,
          naoIniciadas,
          emAndamento,
          concluidas,
          canceladas,
          abertas,
          atrasadas,
          urgentesAbertas,
          concluidas30Dias,
          eficiencia,
          cumprimentoPrazo,
          mttrMinutos,
          amostraMttr:
            duracoes.length,
          preventivasTotal:
            execucoesPreventivas.length,
          preventivasAtivas:
            preventivasAtivas.length,
          preventivasConcluidas,
          preventivasAtrasadas,
          preventivasConcluidas30Dias,
        };
      }
    );

  /*
   * Indicadores gerais:
   * deduplicamos OS pelo ID.
   */
  const mapaOrdensEquipe =
    new Map<
      string,
      (typeof dadosColaboradores)[number]["ordens"][number]
    >();

  dadosColaboradores.forEach(
    (item) => {
      item.ordens.forEach(
        (os) => {
          mapaOrdensEquipe.set(
            os.id,
            os
          );
        }
      );
    }
  );

  const ordensEquipe =
    Array.from(
      mapaOrdensEquipe.values()
    );

  const validasEquipe =
    ordensEquipe.filter(
      (os) =>
        os.status !==
        "CANCELADA"
    );

  const concluidasEquipe =
    ordensEquipe.filter(
      (os) =>
        os.status ===
        "CONCLUIDA"
    ).length;

  const backlogEquipe =
    ordensEquipe.filter(
      (os) =>
        os.status ===
          "NAO_INICIADA" ||
        os.status ===
          "EM_ANDAMENTO"
    ).length;

  const atrasadasEquipe =
    ordensEquipe.filter(
      (os) => {
        if (
          os.status ===
            "CONCLUIDA" ||
          os.status ===
            "CANCELADA" ||
          !os.dataPrevista
        ) {
          return false;
        }

        return (
          fimDoDia(
            os.dataPrevista
          ) <
          agora
        );
      }
    ).length;

  const concluidas30DiasEquipe =
    ordensEquipe.filter(
      (os) => {
        if (
          os.status !==
          "CONCLUIDA"
        ) {
          return false;
        }

        const dataConclusaoKpi =
          obterDataConclusaoKpi(
            os
          );

        return Boolean(
          dataConclusaoKpi &&
            dataConclusaoKpi >=
              inicio30Dias &&
            dataConclusaoKpi <=
              agora
        );
      }
    ).length;

  const eficienciaEquipe =
    validasEquipe.length > 0
      ? Math.round(
          (concluidasEquipe /
            validasEquipe.length) *
            100
        )
      : 0;

  return (
    <main className="min-h-screen bg-[#050816] font-sans text-slate-100 antialiased">
      {/* =====================================================
          HEADER FULL PAGE
      ====================================================== */}
      <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-[#050816]/95 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-[1680px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-4">
            <Link
              href="/admin"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.025] text-slate-400 transition hover:border-cyan-400/30 hover:bg-cyan-400/[0.06] hover:text-cyan-200"
              aria-label="Voltar"
            >
              <ArrowLeft
                size={18}
              />
            </Link>

            <div className="flex h-11 w-[68px] shrink-0 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.03]">
              <Image
                src="/logo.sequoia.png"
                alt="Sequoia"
                width={58}
                height={34}
                priority
                className="h-auto w-auto max-h-9"
              />
            </div>

            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-300">
                Sistema OS
              </p>

              <h1 className="truncate text-[17px] font-bold tracking-[-0.02em] text-white sm:text-[19px]">
                Performance da Manutenção
              </h1>
            </div>
          </div>

          <div className="hidden items-center gap-3 sm:flex">
            <Link
              href="/admin/os"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.025] px-4 text-[13px] font-semibold text-slate-300 transition hover:border-cyan-400/30 hover:text-cyan-200"
            >
              <ClipboardList
                size={16}
              />
              Ordens
            </Link>

            <Link
              href="/admin"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-cyan-400 px-4 text-[13px] font-bold text-slate-950 transition hover:bg-cyan-300"
            >
              Página principal
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1680px] px-4 py-7 sm:px-6 lg:px-8">
        {/* =====================================================
            HERO
        ====================================================== */}
        <section className="relative overflow-hidden rounded-[28px] border border-white/[0.075] bg-[#080d1b] p-6 sm:p-7 lg:p-8">
          <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-cyan-400/[0.055] blur-3xl" />

          <div className="relative flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-cyan-300">
                <Gauge size={16} />
                Indicadores operacionais
              </div>

              <h2 className="mt-3 text-[34px] font-bold tracking-[-0.045em] text-white sm:text-[42px]">
                KPI da Equipe
              </h2>

              <p className="mt-2 max-w-3xl text-[14px] font-normal leading-6 text-slate-400">
                Produtividade, prazo, backlog, MTTR baseado no relatório técnico e participação nas preventivas.
              </p>
            </div>

            <div className="flex h-14 items-center gap-3 rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.04] px-5">
              <ShieldCheck
                size={18}
                className="text-emerald-300"
              />

              <div>
                <p className="text-[12px] font-semibold text-slate-200">
                  Equipe monitorada
                </p>

                <p className="mt-0.5 text-[11px] text-slate-500">
                  {dadosColaboradores.length} colaborador(es) com OS vinculadas
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================
            KPI GERAL
        ====================================================== */}
        <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <KpiEquipe
            titulo="Equipe"
            valor={String(
              dadosColaboradores.length
            )}
            descricao="Com OS vinculadas"
            icon={
              <Users size={19} />
            }
            tone="cyan"
          />

          <KpiEquipe
            titulo="Backlog atual"
            valor={String(
              backlogEquipe
            )}
            descricao="OS abertas da equipe"
            icon={
              <ClipboardList
                size={19}
              />
            }
            tone="orange"
          />

          <KpiEquipe
            titulo="OS atrasadas"
            valor={String(
              atrasadasEquipe
            )}
            descricao="Abertas fora do prazo"
            icon={
              <AlertTriangle
                size={19}
              />
            }
            tone={
              atrasadasEquipe > 0
                ? "red"
                : "green"
            }
          />

          <KpiEquipe
            titulo="Concluídas 30d"
            valor={String(
              concluidas30DiasEquipe
            )}
            descricao="Entregas recentes"
            icon={
              <CheckCircle2
                size={19}
              />
            }
            tone="green"
          />

          <KpiEquipe
            titulo="Eficiência"
            valor={`${eficienciaEquipe}%`}
            descricao="Canceladas fora do cálculo"
            icon={
              <TrendingUp
                size={19}
              />
            }
            tone="violet"
          />
        </section>

        {/* =====================================================
            FILTRO
        ====================================================== */}
        <form className="mt-5 rounded-2xl border border-white/[0.07] bg-[#080d1b] p-4 sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <label className="min-w-0 flex-1">
              <span className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.13em] text-slate-500">
                <Search size={15} />
                Colaborador
              </span>

              <input
                name="colaborador"
                defaultValue={
                  filtroColaborador
                }
                placeholder="Digite o nome do colaborador..."
                className="h-12 w-full rounded-xl border border-white/[0.08] bg-[#050816] px-4 text-[14px] font-medium text-white outline-none transition placeholder:text-slate-700 focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/5"
              />
            </label>

            <button className="h-12 rounded-xl bg-cyan-400 px-6 text-[13px] font-bold text-slate-950 transition hover:bg-cyan-300">
              Filtrar
            </button>

            <Link
              href="/admin/dashboard-colaboradores"
              className="inline-flex h-12 items-center justify-center rounded-xl border border-white/[0.08] px-6 text-[13px] font-semibold text-slate-300 transition hover:bg-white/[0.04] hover:text-white"
            >
              Limpar
            </Link>
          </div>
        </form>

        {/* =====================================================
            COLABORADORES
        ====================================================== */}
        {dadosColaboradores.length ===
        0 ? (
          <div className="mt-6 flex min-h-[300px] items-center justify-center rounded-3xl border border-dashed border-white/10 bg-[#080d1b] p-6 text-center">
            <div>
              <UserRound
                size={32}
                className="mx-auto text-slate-600"
              />

              <p className="mt-4 text-base font-semibold text-slate-300">
                Nenhum colaborador encontrado
              </p>

              <p className="mt-2 text-sm text-slate-600">
                Ajuste o filtro e tente novamente.
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-6 grid gap-5 2xl:grid-cols-2">
            {dadosColaboradores.map(
              (item) => (
                <ColaboradorCard
                  key={
                    item.colaborador.id
                  }
                  item={item}
                />
              )
            )}
          </div>
        )}
      </div>
    </main>
  );
}

function KpiEquipe({
  titulo,
  valor,
  descricao,
  icon,
  tone,
}: {
  titulo: string;
  valor: string;
  descricao: string;
  icon: ReactNode;
  tone:
    | "cyan"
    | "orange"
    | "red"
    | "green"
    | "violet";
}) {
  const estilos = {
    cyan: {
      box: "border-cyan-400/15 bg-cyan-400/[0.03]",
      icon: "text-cyan-300",
    },
    orange: {
      box: "border-orange-400/15 bg-orange-400/[0.03]",
      icon: "text-orange-300",
    },
    red: {
      box: "border-red-400/15 bg-red-400/[0.03]",
      icon: "text-red-300",
    },
    green: {
      box: "border-emerald-400/15 bg-emerald-400/[0.03]",
      icon: "text-emerald-300",
    },
    violet: {
      box: "border-violet-400/15 bg-violet-400/[0.03]",
      icon: "text-violet-300",
    },
  };

  return (
    <div
      className={`rounded-2xl border p-4 sm:p-5 ${estilos[tone].box}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-slate-500">
            {titulo}
          </p>

          <p className="mt-2 text-[30px] font-bold tracking-[-0.045em] text-white">
            {valor}
          </p>

          <p className="mt-1 text-[11px] font-normal text-slate-600">
            {descricao}
          </p>
        </div>

        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.06] bg-black/10 ${estilos[tone].icon}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function ColaboradorCard({
  item,
}: {
  item: any;
}) {
  const {
    colaborador,
    total,
    naoIniciadas,
    emAndamento,
    concluidas,
    canceladas,
    abertas,
    atrasadas,
    urgentesAbertas,
    concluidas30Dias,
    eficiencia,
    cumprimentoPrazo,
    mttrMinutos,
    amostraMttr,
    preventivasTotal,
    preventivasAtivas,
    preventivasConcluidas,
    preventivasAtrasadas,
    preventivasConcluidas30Dias,
  } = item;

  const iniciais =
    colaborador.nome
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map(
        (nome: string) =>
          nome[0]?.toUpperCase()
      )
      .join("");

  return (
    <article className="overflow-hidden rounded-[26px] border border-white/[0.075] bg-[#080d1b]">
      <div className="border-b border-white/[0.06] p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.06] text-sm font-bold text-cyan-200">
              {iniciais ||
                "US"}
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate text-[20px] font-bold tracking-[-0.025em] text-white">
                  {
                    colaborador.nome
                  }
                </h3>

                <span className="rounded-full border border-emerald-400/15 bg-emerald-400/[0.07] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.08em] text-emerald-300">
                  Ativo
                </span>
              </div>

              <p className="mt-1 truncate text-[12px] font-normal text-slate-500">
                {colaborador.funcao
                  ?.nome ??
                  "Função não definida"}
                <span className="mx-2 text-slate-700">
                  •
                </span>
                {colaborador.setor
                  ?.nome ??
                  "Setor não definido"}
              </p>

              <p className="mt-1 truncate text-[11px] text-slate-700">
                {
                  colaborador.email
                }
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href={`/api/admin/dashboard-colaboradores/${colaborador.id}/pdf`}
              target="_blank"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-400/[0.05] px-4 text-xs font-semibold text-cyan-200 transition hover:border-cyan-400/40 hover:bg-cyan-400/[0.1]"
            >
              <Download size={15} />
              PDF
            </Link>

            <Link
              href={`/api/admin/dashboard-colaboradores/${colaborador.id}/excel`}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.05] px-4 text-xs font-semibold text-emerald-200 transition hover:border-emerald-400/40 hover:bg-emerald-400/[0.1]"
            >
              <FileSpreadsheet
                size={15}
              />
              Excel
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-px bg-white/[0.05] sm:grid-cols-4">
        <KpiIndividual
          label="Eficiência"
          value={`${eficiencia}%`}
          helper="OS válidas concluídas"
          icon={
            <TrendingUp
              size={15}
            />
          }
          tone="cyan"
        />

        <KpiIndividual
          label="No prazo"
          value={
            cumprimentoPrazo ===
            null
              ? "—"
              : `${cumprimentoPrazo}%`
          }
          helper="Conclusões com prazo"
          icon={
            <Target size={15} />
          }
          tone="green"
        />

        <KpiIndividual
          label="MTTR relatório"
          value={formatarDuracaoMinutos(
            mttrMinutos
          )}
          helper={
            amostraMttr > 0
              ? `${amostraMttr} relatório(s) medido(s)`
              : "Sem horário medido"
          }
          icon={
            <TimerReset
              size={15}
            />
          }
          tone="violet"
        />

        <KpiIndividual
          label="Concluídas 30d"
          value={String(
            concluidas30Dias
          )}
          helper="Entrega recente"
          icon={
            <CheckCircle2
              size={15}
            />
          }
          tone="green"
        />
      </div>

      <div className="p-5 sm:p-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatusCard
            label="Em carteira"
            value={abertas}
            helper={`${naoIniciadas} não iniciada(s)`}
            tone="orange"
          />

          <StatusCard
            label="Em andamento"
            value={emAndamento}
            helper="Em execução agora"
            tone="cyan"
          />

          <StatusCard
            label="Atrasadas"
            value={atrasadas}
            helper="Fora da data prevista"
            tone={
              atrasadas > 0
                ? "red"
                : "green"
            }
          />

          <StatusCard
            label="Urgentes"
            value={
              urgentesAbertas
            }
            helper="Urgentes ainda abertas"
            tone={
              urgentesAbertas >
              0
                ? "red"
                : "neutral"
            }
          />
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-2xl border border-white/[0.06] bg-[#050816] p-4">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <p className="flex items-center gap-2 text-[13px] font-semibold text-slate-200">
                  <Activity
                    size={16}
                    className="text-cyan-300"
                  />
                  Distribuição das OS
                </p>

                <p className="mt-1 text-[10px] text-slate-600">
                  {total} atribuição(ões) no histórico
                </p>
              </div>

              <span className="rounded-lg border border-white/[0.06] bg-white/[0.025] px-2.5 py-1 text-[10px] font-semibold text-slate-500">
                {concluidas} concluída(s)
              </span>
            </div>

            <Barra
              label="Concluídas"
              value={concluidas}
              total={Math.max(
                total,
                1
              )}
              color="green"
              icon={
                <CheckCircle2
                  size={14}
                />
              }
            />

            <Barra
              label="Em andamento"
              value={emAndamento}
              total={Math.max(
                total,
                1
              )}
              color="cyan"
              icon={
                <Zap size={14} />
              }
            />

            <Barra
              label="Não iniciadas"
              value={naoIniciadas}
              total={Math.max(
                total,
                1
              )}
              color="yellow"
              icon={
                <Clock3
                  size={14}
                />
              }
            />

            <Barra
              label="Canceladas"
              value={canceladas}
              total={Math.max(
                total,
                1
              )}
              color="red"
              icon={
                <XCircle
                  size={14}
                />
              }
            />
          </section>

          <section className="rounded-2xl border border-white/[0.06] bg-[#050816] p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="flex items-center gap-2 text-[13px] font-semibold text-slate-200">
                  <Wrench
                    size={16}
                    className="text-violet-300"
                  />
                  Preventivas
                </p>

                <p className="mt-1 text-[10px] text-slate-600">
                  Execuções atribuídas no sistema recorrente
                </p>
              </div>

              <span className="rounded-lg border border-violet-400/10 bg-violet-400/[0.05] px-2.5 py-1 text-[10px] font-semibold text-violet-300">
                {preventivasTotal} total
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <MiniPreventiva
                label="Em agenda"
                value={
                  preventivasAtivas
                }
                tone="cyan"
                icon={
                  <ClipboardCheck
                    size={15}
                  />
                }
              />

              <MiniPreventiva
                label="Concluídas"
                value={
                  preventivasConcluidas
                }
                tone="green"
                icon={
                  <CheckCircle2
                    size={15}
                  />
                }
              />

              <MiniPreventiva
                label="Atrasadas"
                value={
                  preventivasAtrasadas
                }
                tone={
                  preventivasAtrasadas >
                  0
                    ? "red"
                    : "neutral"
                }
                icon={
                  <AlertTriangle
                    size={15}
                  />
                }
              />

              <MiniPreventiva
                label="Concl. 30d"
                value={
                  preventivasConcluidas30Dias
                }
                tone="violet"
                icon={
                  <Activity
                    size={15}
                  />
                }
              />
            </div>
          </section>
        </div>

        <div className="mt-5 flex flex-col gap-3 border-t border-white/[0.06] pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[10px] font-normal text-slate-600">
            MTTR usa o horário informado no relatório técnico. Eficiência exclui OS canceladas.
          </p>

          <Link
            href="/admin/os"
            className="inline-flex items-center gap-2 text-xs font-semibold text-cyan-300 transition hover:text-cyan-200"
          >
            Ver ordens
            <ArrowRight
              size={14}
            />
          </Link>
        </div>
      </div>
    </article>
  );
}

function KpiIndividual({
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
    | "cyan"
    | "green"
    | "violet";
}) {
  const cores = {
    cyan: "text-cyan-300",
    green:
      "text-emerald-300",
    violet:
      "text-violet-300",
  };

  return (
    <div className="bg-[#0a1020] p-4 sm:p-5">
      <div
        className={`flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.1em] ${cores[tone]}`}
      >
        {icon}
        {label}
      </div>

      <p className="mt-2 text-[23px] font-bold tracking-[-0.035em] text-white">
        {value}
      </p>

      <p className="mt-1 text-[9px] font-normal text-slate-600">
        {helper}
      </p>
    </div>
  );
}

function StatusCard({
  label,
  value,
  helper,
  tone,
}: {
  label: string;
  value: number;
  helper: string;
  tone:
    | "cyan"
    | "orange"
    | "red"
    | "green"
    | "neutral";
}) {
  const estilos = {
    cyan:
      "border-cyan-400/15 bg-cyan-400/[0.03] text-cyan-300",
    orange:
      "border-orange-400/15 bg-orange-400/[0.03] text-orange-300",
    red:
      "border-red-400/15 bg-red-400/[0.03] text-red-300",
    green:
      "border-emerald-400/15 bg-emerald-400/[0.03] text-emerald-300",
    neutral:
      "border-white/[0.07] bg-white/[0.02] text-slate-300",
  };

  return (
    <div
      className={`rounded-xl border p-3.5 ${estilos[tone]}`}
    >
      <p className="text-[9px] font-bold uppercase tracking-[0.1em] opacity-80">
        {label}
      </p>

      <p className="mt-1.5 text-2xl font-bold text-white">
        {value}
      </p>

      <p className="mt-1 text-[9px] font-normal text-slate-600">
        {helper}
      </p>
    </div>
  );
}

function MiniPreventiva({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: number;
  tone:
    | "cyan"
    | "green"
    | "red"
    | "violet"
    | "neutral";
  icon: ReactNode;
}) {
  const cores = {
    cyan: "text-cyan-300",
    green:
      "text-emerald-300",
    red: "text-red-300",
    violet:
      "text-violet-300",
    neutral:
      "text-slate-500",
  };

  return (
    <div className="rounded-xl border border-white/[0.055] bg-white/[0.018] p-3">
      <div
        className={`flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.08em] ${cores[tone]}`}
      >
        {icon}
        {label}
      </div>

      <p className="mt-2 text-xl font-bold text-white">
        {value}
      </p>
    </div>
  );
}

function Barra({
  label,
  value,
  total,
  color,
  icon,
}: {
  label: string;
  value: number;
  total: number;
  color:
    | "yellow"
    | "cyan"
    | "green"
    | "red";
  icon: ReactNode;
}) {
  const porcentagem =
    total > 0
      ? limitarPercentual(
          Math.round(
            (value /
              total) *
              100
          )
        )
      : 0;

  const styles = {
    yellow: {
      bar: "bg-amber-400",
      text: "text-amber-300",
    },
    cyan: {
      bar: "bg-cyan-400",
      text: "text-cyan-300",
    },
    green: {
      bar: "bg-emerald-400",
      text: "text-emerald-300",
    },
    red: {
      bar: "bg-red-400",
      text: "text-red-300",
    },
  };

  return (
    <div className="mb-3 last:mb-0">
      <div className="mb-1.5 flex items-center justify-between gap-3 text-[11px]">
        <div
          className={`flex items-center gap-2 font-medium ${styles[color].text}`}
        >
          {icon}
          {label}
        </div>

        <span className="font-semibold text-slate-300">
          {value}
          <span className="ml-1 font-normal text-slate-600">
            · {porcentagem}%
          </span>
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-white/[0.07]">
        <div
          className={`h-full rounded-full ${styles[color].bar}`}
          style={{
            width: `${porcentagem}%`,
          }}
        />
      </div>
    </div>
  );
}
