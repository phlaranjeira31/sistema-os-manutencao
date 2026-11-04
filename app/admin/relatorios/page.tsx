import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  Building2,
  CalendarDays,
  CalendarRange,
  Eye,
  FileText,
  Filter,
  Search,
  User,
  Users,
  Wrench,
} from "lucide-react";

import { prisma } from "@/src/lib/prisma";
import { obterDataTerminoRelatorio } from "@/src/lib/kpiColaborador";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = {
  searchParams?: Promise<{
    os?: string;
    colaborador?: string;
    dataInicio?: string;
    dataFim?: string;
    setor?: string;
  }>;
};

function formatDate(
  date: Date | string | null | undefined
) {
  if (!date) {
    return "Data não identificada";
  }

  return new Intl.DateTimeFormat("pt-BR").format(
    new Date(date)
  );
}

function dentroDoPeriodo(
  data: Date | null,
  inicio: Date | null,
  fim: Date | null
) {
  if (!inicio && !fim) {
    return true;
  }

  if (!data) {
    return false;
  }

  if (inicio && data < inicio) {
    return false;
  }

  if (fim && data > fim) {
    return false;
  }

  return true;
}

function prioridadeClasse(
  prioridade: string
) {
  const classes: Record<string, string> = {
    BAIXA:
      "border-emerald-400/15 bg-emerald-400/[0.06] text-emerald-300",
    MEDIA:
      "border-yellow-400/15 bg-yellow-400/[0.06] text-yellow-300",
    ALTA:
      "border-orange-400/15 bg-orange-400/[0.06] text-orange-300",
    URGENTE:
      "border-red-400/15 bg-red-400/[0.06] text-red-300",
  };

  return (
    classes[prioridade] ??
    "border-white/10 bg-white/[0.04] text-slate-300"
  );
}

function prioridadeLabel(
  prioridade: string
) {
  const labels: Record<string, string> = {
    BAIXA: "Baixa",
    MEDIA: "Média",
    ALTA: "Alta",
    URGENTE: "Urgente",
  };

  return labels[prioridade] ?? prioridade;
}

export default async function RelatoriosPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;

  const osFiltro = String(
    params?.os ?? ""
  ).trim();

  const colaboradorFiltro = String(
    params?.colaborador ?? ""
  ).trim();

  const dataInicioFiltro = String(
    params?.dataInicio ?? ""
  ).trim();

  const dataFimFiltro = String(
    params?.dataFim ?? ""
  ).trim();

  const setorFiltro = String(
    params?.setor ?? ""
  ).trim();

  const dataInicio = dataInicioFiltro
    ? new Date(
        `${dataInicioFiltro}T00:00:00-03:00`
      )
    : null;

  const dataFim = dataFimFiltro
    ? new Date(
        `${dataFimFiltro}T23:59:59-03:00`
      )
    : null;

  const [
    relatoriosEncontrados,
    colaboradores,
    setores,
  ] = await Promise.all([
    prisma.ordemServico.findMany({
      where: {
        registroFinal: {
          not: null,
        },

        ...(osFiltro &&
        Number.isFinite(
          Number(osFiltro)
        )
          ? {
              numero:
                Number(
                  osFiltro
                ),
            }
          : {}),

        ...(colaboradorFiltro
          ? {
              responsaveis: {
                some: {
                  userId:
                    colaboradorFiltro,
                },
              },
            }
          : {}),

        ...(setorFiltro
          ? {
              setorId:
                setorFiltro,
            }
          : {}),
      },

      select: {
        id: true,
        numero: true,
        titulo: true,
        prioridade: true,
        registroFinal: true,

        setor: {
          select: {
            id: true,
            nome: true,
          },
        },

        maquina: {
          select: {
            id: true,
            nome: true,
          },
        },

        responsaveis: {
          select: {
            user: {
              select: {
                id: true,
                nome: true,
              },
            },
          },
        },
      },
    }),

    prisma.user.findMany({
      where: {
        ativo: true,
      },

      select: {
        id: true,
        nome: true,
      },

      orderBy: {
        nome: "asc",
      },
    }),

    prisma.setor.findMany({
      where: {
        ativo: true,
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

  const relatorios = relatoriosEncontrados
    .filter((os) =>
      Boolean(
        os.registroFinal?.trim()
      )
    )
    .map((os) => {
      const dataRelatorio =
        obterDataTerminoRelatorio(
          os.registroFinal
        );

      return {
        ...os,
        dataRelatorio,
      };
    })
    .filter((os) =>
      dentroDoPeriodo(
        os.dataRelatorio,
        dataInicio,
        dataFim
      )
    )
    .sort(
      (a, b) =>
        b.numero - a.numero
    );

  const agora = new Date();

  const totalMesAtual =
    relatorios.filter((os) => {
      if (!os.dataRelatorio) {
        return false;
      }

      return (
        os.dataRelatorio.getMonth() ===
          agora.getMonth() &&
        os.dataRelatorio.getFullYear() ===
          agora.getFullYear()
      );
    }).length;

  const colaboradoresUnicos =
    new Set(
      relatorios.flatMap((os) =>
        os.responsaveis.map(
          (item) => item.user.id
        )
      )
    ).size;

  const setoresUnicos =
    new Set(
      relatorios
        .map(
          (os) =>
            os.setor?.id
        )
        .filter(Boolean)
    ).size;

  const comDataValida =
    relatorios.filter(
      (os) =>
        Boolean(
          os.dataRelatorio
        )
    ).length;

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#020617] px-3 py-5 text-white sm:px-5 lg:px-8">
      <div className="mx-auto w-full max-w-[1700px] space-y-5">
        {/* =====================================================
            HERO
        ====================================================== */}
        <header className="relative overflow-hidden rounded-[28px] border border-cyan-400/15 bg-[linear-gradient(120deg,#07101f_0%,#071827_55%,#06101d_100%)] p-5 shadow-[0_18px_55px_rgba(0,0,0,.22)] sm:p-6">
          <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-cyan-400/[0.08] blur-3xl" />

          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.06] text-cyan-300">
                <FileText size={25} />
              </div>

              <div className="min-w-0">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-cyan-300">
                  Documentação técnica
                </p>

                <h1 className="mt-1 text-3xl font-black tracking-[-0.04em] text-white sm:text-4xl">
                  Relatórios
                </h1>

                <p className="mt-1 text-sm text-slate-400">
                  Consulte os documentos pela data real informada no relatório técnico.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 sm:flex-row">
              <Link
                href="/admin/relatorios/dashboard"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-cyan-400/25 bg-cyan-400/[0.07] px-5 text-sm font-black text-cyan-200 transition hover:bg-cyan-400 hover:text-slate-950"
              >
                <BarChart3 size={17} />
                Dashboard
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
            KPIS
        ====================================================== */}
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Kpi
            label="Relatórios encontrados"
            value={relatorios.length}
            helper="Documentos no filtro atual"
            icon={<FileText size={18} />}
            tone="cyan"
          />

          <Kpi
            label="Neste mês"
            value={totalMesAtual}
            helper="Pela data real do relatório"
            icon={<CalendarDays size={18} />}
            tone="green"
          />

          <Kpi
            label="Colaboradores"
            value={colaboradoresUnicos}
            helper="Responsáveis vinculados"
            icon={<Users size={18} />}
            tone="violet"
          />

          <Kpi
            label="Data técnica válida"
            value={`${comDataValida}/${relatorios.length}`}
            helper={`${setoresUnicos} setor(es) no resultado`}
            icon={<CalendarRange size={18} />}
            tone="blue"
          />
        </section>

        {/* =====================================================
            FILTROS
        ====================================================== */}
        <section className="rounded-[24px] border border-white/[0.07] bg-[#070c1b] p-4 shadow-[0_10px_35px_rgba(0,0,0,.16)] sm:p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-400/15 bg-cyan-400/[0.05] text-cyan-300">
              <Filter size={17} />
            </div>

            <div>
              <h2 className="text-base font-black text-white">
                Filtros dos relatórios
              </h2>

              <p className="text-xs text-slate-500">
                O período usa a data/hora de término preenchida no relatório técnico.
              </p>
            </div>
          </div>

          <form className="grid gap-3 md:grid-cols-2 xl:grid-cols-[180px_1fr_1.15fr_1fr_auto]">
            <CampoFiltro
              label="Número da OS"
              icon={<Search size={14} />}
            >
              <input
                name="os"
                defaultValue={osFiltro}
                type="number"
                placeholder="Ex.: 557"
                className={inputClass}
              />
            </CampoFiltro>

            <CampoFiltro
              label="Colaborador"
              icon={<User size={14} />}
            >
              <select
                name="colaborador"
                defaultValue={
                  colaboradorFiltro
                }
                className={inputClass}
              >
                <option value="">
                  Todos
                </option>

                {colaboradores.map(
                  (colaborador) => (
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
            </CampoFiltro>

            <div>
              <label className="mb-2 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.08em] text-slate-500">
                <CalendarDays size={14} />
                Período do relatório
              </label>

              <div className="grid grid-cols-2 gap-2">
                <input
                  name="dataInicio"
                  defaultValue={
                    dataInicioFiltro
                  }
                  type="date"
                  className={inputClass}
                />

                <input
                  name="dataFim"
                  defaultValue={
                    dataFimFiltro
                  }
                  type="date"
                  className={inputClass}
                />
              </div>
            </div>

            <CampoFiltro
              label="Setor"
              icon={<Building2 size={14} />}
            >
              <select
                name="setor"
                defaultValue={
                  setorFiltro
                }
                className={inputClass}
              >
                <option value="">
                  Todos
                </option>

                {setores.map(
                  (setor) => (
                    <option
                      key={
                        setor.id
                      }
                      value={
                        setor.id
                      }
                    >
                      {setor.nome}
                    </option>
                  )
                )}
              </select>
            </CampoFiltro>

            <div className="flex items-end gap-2">
              <button
                type="submit"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 text-sm font-black text-slate-950 transition hover:bg-cyan-300"
              >
                <Search size={16} />
                Filtrar
              </button>

              <Link
                href="/admin/relatorios"
                className="inline-flex h-11 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 text-sm font-black text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
              >
                Limpar
              </Link>
            </div>
          </form>
        </section>

        {/* =====================================================
            LISTA
        ====================================================== */}
        {relatorios.length === 0 ? (
          <section className="flex min-h-[280px] items-center justify-center rounded-[24px] border border-dashed border-white/10 bg-[#070c1b] p-6 text-center">
            <div>
              <FileText
                size={32}
                className="mx-auto text-slate-600"
              />

              <h2 className="mt-4 text-lg font-black text-slate-300">
                Nenhum relatório encontrado
              </h2>

              <p className="mt-2 text-sm text-slate-600">
                Ajuste os filtros ou verifique se o documento possui data de término válida.
              </p>
            </div>
          </section>
        ) : (
          <section>
            <div className="mb-3 flex items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.13em] text-cyan-300">
                  Documentos
                </p>

                <h2 className="mt-1 text-xl font-black text-white">
                  {relatorios.length} relatório(s)
                </h2>
              </div>

              <p className="hidden text-xs text-slate-600 sm:block">
                Ordenados pelo número da OS, da mais recente para a mais antiga.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {relatorios.map(
                (os) => (
                  <article
                    key={os.id}
                    className="group overflow-hidden rounded-[22px] border border-white/[0.07] bg-[#070c1b] shadow-[0_10px_30px_rgba(0,0,0,.15)] transition hover:-translate-y-0.5 hover:border-cyan-400/20"
                  >
                    <div className="border-b border-white/[0.06] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-black text-cyan-300">
                              OS #{os.numero}
                            </span>

                            <span
                              className={`rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.06em] ${prioridadeClasse(
                                os.prioridade
                              )}`}
                            >
                              {prioridadeLabel(
                                os.prioridade
                              )}
                            </span>
                          </div>

                          <h3 className="mt-1.5 line-clamp-2 text-[18px] font-black leading-tight tracking-[-0.02em] text-white">
                            {os.titulo}
                          </h3>
                        </div>

                        <Link
                          href={`/admin/relatorios/${os.id}`}
                          className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-cyan-400/20 bg-cyan-400/[0.06] px-3 text-[11px] font-black text-cyan-200 transition hover:bg-cyan-400 hover:text-slate-950"
                        >
                          <Eye size={14} />
                          Ver
                        </Link>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 p-4">
                      <Info
                        icon={<CalendarDays size={14} />}
                        label="Data do relatório"
                        value={formatDate(
                          os.dataRelatorio
                        )}
                        accent
                      />

                      <Info
                        icon={<Building2 size={14} />}
                        label="Setor"
                        value={
                          os.setor?.nome ??
                          "—"
                        }
                      />

                      <Info
                        icon={<Wrench size={14} />}
                        label="Máquina"
                        value={
                          os.maquina?.nome ??
                          "Sem máquina"
                        }
                      />

                      <Info
                        icon={<User size={14} />}
                        label="Responsável"
                        value={
                          os.responsaveis.length
                            ? os.responsaveis
                                .map(
                                  (item) =>
                                    item.user.nome
                                )
                                .join(", ")
                            : "Sem responsável"
                        }
                      />
                    </div>

                    <div className="border-t border-white/[0.06] bg-[#030817]/80 px-4 py-3">
                      <p className="line-clamp-2 whitespace-pre-line text-xs leading-5 text-slate-500">
                        {os.registroFinal}
                      </p>
                    </div>
                  </article>
                )
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

const inputClass =
  "h-11 w-full rounded-xl border border-white/[0.08] bg-[#030817] px-3 text-sm font-semibold text-white outline-none transition placeholder:text-slate-700 focus:border-cyan-400/40";

function CampoFiltro({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.08em] text-slate-500">
        {icon}
        {label}
      </label>

      {children}
    </div>
  );
}

function Kpi({
  label,
  value,
  helper,
  icon,
  tone,
}: {
  label: string;
  value: string | number;
  helper: string;
  icon: React.ReactNode;
  tone: "cyan" | "green" | "violet" | "blue";
}) {
  const tones = {
    cyan:
      "border-cyan-400/15 bg-cyan-400/[0.035] text-cyan-300",
    green:
      "border-emerald-400/15 bg-emerald-400/[0.035] text-emerald-300",
    violet:
      "border-violet-400/15 bg-violet-400/[0.035] text-violet-300",
    blue:
      "border-blue-400/15 bg-blue-400/[0.035] text-blue-300",
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

function Info({
  icon,
  label,
  value,
  accent = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-white/[0.055] bg-[#030817] p-3">
      <p
        className={`flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.07em] ${
          accent
            ? "text-cyan-300"
            : "text-slate-600"
        }`}
      >
        {icon}
        {label}
      </p>

      <p className="mt-1.5 line-clamp-2 text-[12px] font-bold leading-5 text-slate-200">
        {value}
      </p>
    </div>
  );
}
