import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import {
  BarChart3,
  Building2,
  ClipboardList,
  Gauge,
  LayoutDashboard,
  Plus,
  Users,
  ArrowRight,
  Activity,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { authOptions } from "@/src/lib/auth";
import HeaderUsuario from "@/components/HeaderUsuario";
import AdminMenu from "@/components/AdminMenu";
import AssistenteSistema from "@/components/AssistenteSistema";
import { prisma } from "@/src/lib/prisma";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session) redirect("/login");

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
   * Atualmente são considerados serviços externos:
   *
   * - EMPREITEIRA
   * - Zeze serralheiro
   *
   * Uma OS atribuída a qualquer um desses usuários será
   * contabilizada como serviço externo no indicador de eficiência.
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

  const idsServicoExterno =
    usuariosServicoExterno.map(
      (usuario) => usuario.id
    );

  const hrefOrdensSequoia = (
    filtros?: Record<string, string>
  ) => {
    const parametros = new URLSearchParams();

    if (empresaSequoiaId) {
      parametros.set("empresaId", empresaSequoiaId);
    }

    Object.entries(filtros ?? {}).forEach(
      ([chave, valor]) => {
        parametros.set(chave, valor);
      }
    );

    const consulta = parametros.toString();

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
  ] = await Promise.all([
    prisma.ordemServico.count({
      where: {
        empresaId: empresaSequoiaId,
      },
    }),

    prisma.ordemServico.count({
      where: {
        empresaId: empresaSequoiaId,
        status: "NAO_INICIADA",
      },
    }),

    prisma.ordemServico.count({
      where: {
        empresaId: empresaSequoiaId,
        status: "EM_ANDAMENTO",
      },
    }),

    prisma.ordemServico.count({
      where: {
        empresaId: empresaSequoiaId,
        status: "CONCLUIDA",
      },
    }),

    prisma.ordemServico.count({
      where: {
        empresaId: empresaSequoiaId,
        status: "CANCELADA",
      },
    }),

    prisma.ordemServico.count({
      where: {
        empresaId: empresaSequoiaId,
        prioridade: "BAIXA",
      },
    }),

    prisma.ordemServico.count({
      where: {
        empresaId: empresaSequoiaId,
        prioridade: "MEDIA",
      },
    }),

    prisma.ordemServico.count({
      where: {
        empresaId: empresaSequoiaId,
        prioridade: "ALTA",
      },
    }),

    prisma.ordemServico.count({
      where: {
        empresaId: empresaSequoiaId,
        prioridade: "URGENTE",
      },
    }),

    prisma.user.count({
      where: {
        ativo: true,
        perfil: "COLABORADOR",
        empresaOrigemId: empresaSequoiaId,
      },
    }),

    prisma.setor.count({
      where: {
        ativo: true,
        empresaId: empresaSequoiaId,
      },
    }),

    /*
     * Total de OS consideradas serviços externos.
     */
    prisma.ordemServico.count({
      where: {
        empresaId: empresaSequoiaId,

        responsaveis: {
          some: {
            userId: {
              in: idsServicoExterno,
            },
          },
        },
      },
    }),

    /*
     * Total de OS externas concluídas.
     */
    prisma.ordemServico.count({
      where: {
        empresaId: empresaSequoiaId,
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
  ]);

  const eficienciaPercentual =
    totalOS > 0
      ? Math.round((concluidas / totalOS) * 100)
      : 0;

  /*
   * ============================================================
   * EFICIÊNCIA INTERNA X EXTERNA
   * ============================================================
   */

  const totalInternas =
    totalOS - totalExternas;

  const concluidasInternas =
    concluidas - concluidasExternas;

  const eficienciaInterna =
    totalInternas > 0
      ? Math.round(
          (concluidasInternas / totalInternas) * 100
        )
      : 0;

  const eficienciaExterna =
    totalExternas > 0
      ? Math.round(
          (concluidasExternas / totalExternas) * 100
        )
      : 0;

  return (
    <main className="h-screen overflow-hidden bg-[#020617] text-white">
      <div className="flex h-full min-w-0">
        <aside className="hidden h-full w-72 shrink-0 flex-col border-r border-white/10 bg-[#020617] text-white lg:flex">
          <div className="shrink-0 p-6">
            <h1 className="text-2xl font-extrabold">
              Sistema de OS
            </h1>

            <p className="mt-1 text-sm text-slate-400">
              Painel de manutenção
            </p>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto pb-4">
            <AdminMenu />
          </div>

          <footer className="shrink-0 border-t border-white/10 bg-[#020617] px-6 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
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

        <section className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden">
          <HeaderUsuario />

          <div className="px-4 py-6 sm:px-6 lg:px-8">
            <div className="mb-8 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-[#020617] via-[#0f172a] to-[#020617] p-6 text-white shadow-[0_0_40px_rgba(59,130,246,0.14)] md:p-8">
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-sm font-semibold text-cyan-300">
                    <Activity size={16} />
                    Visão geral
                  </p>

                  <h1 className="mt-3 break-words text-2xl font-extrabold sm:text-3xl">
                    Controle de Ordens de Serviço
                  </h1>

                  <p className="mt-2 max-w-2xl break-words text-sm text-slate-300 sm:text-base">
                    Painel BI para acompanhar chamados,
                    prioridades e andamento das manutenções.
                  </p>
                </div>

                <Link
                  href={hrefOrdensSequoia()}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-400/30 bg-white px-5 py-3 text-sm font-bold text-slate-950 shadow-[0_0_24px_rgba(34,211,238,0.16)] transition hover:bg-cyan-50 sm:w-fit"
                >
                  Ver ordens
                  <ArrowRight size={17} />
                </Link>
              </div>
            </div>

            <div className="grid min-w-0 gap-5 xl:grid-cols-3">
              <div className="min-w-0 rounded-2xl border border-white/10 bg-white/5 p-4 shadow-sm backdrop-blur-xl sm:p-6 xl:col-span-2">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="break-words text-lg font-bold text-white">
                      Painel BI por status
                    </h3>

                    <p className="mt-1 break-words text-sm text-slate-400">
                      Distribuição visual das ordens por etapa.
                    </p>
                  </div>

                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white shadow-[0_0_24px_rgba(34,211,238,0.12)]">
                    <BarChart3 size={20} />
                  </div>
                </div>

                <div className="mt-6 grid min-w-0 gap-4 md:grid-cols-2">
                  <BIStatusCard
                    label="Não iniciadas"
                    value={naoIniciadas}
                    total={totalOS}
                    href={hrefOrdensSequoia({
                      status: "NAO_INICIADA",
                    })}
                    color="red"
                  />

                  <BIStatusCard
                    label="Em andamento"
                    value={emAndamento}
                    total={totalOS}
                    href={hrefOrdensSequoia({
                      status: "EM_ANDAMENTO",
                    })}
                    color="blue"
                  />

                  <BIStatusCard
                    label="Concluídas"
                    value={concluidas}
                    total={totalOS}
                    href={hrefOrdensSequoia({
                      status: "CONCLUIDA",
                    })}
                    color="green"
                  />

                  <BIStatusCard
                    label="Canceladas"
                    value={canceladas}
                    total={totalOS}
                    href={hrefOrdensSequoia({
                      status: "CANCELADA",
                    })}
                    color="slate"
                  />
                </div>
              </div>

              {/* =================================================
                  EFICIÊNCIA GERAL
              ================================================== */}

              <div className="min-w-0 rounded-2xl border border-white/10 bg-white/5 p-4 shadow-sm backdrop-blur-xl sm:p-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="break-words text-lg font-bold text-white">
                      Eficiência geral
                    </h3>

                    <p className="mt-1 break-words text-sm text-slate-400">
                      Eficiência interna e serviços externos.
                    </p>
                  </div>

                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white shadow-[0_0_24px_rgba(34,211,238,0.12)]">
                    <Gauge size={20} />
                  </div>
                </div>

                {/* EFICIÊNCIA TOTAL */}

                <div className="mt-5 flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-[#020617] px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Eficiência total
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      {concluidas}/{totalOS} ordens concluídas
                    </p>
                  </div>

                  <p className="shrink-0 text-2xl font-extrabold text-white">
                    {eficienciaPercentual}%
                  </p>
                </div>

                {/* INTERNA X EXTERNA */}

                <div className="mt-6 grid grid-cols-2 gap-4">
                  <EfficiencyRing
                    titulo="Equipe interna"
                    percentual={eficienciaInterna}
                    concluidas={concluidasInternas}
                    total={totalInternas}
                    cor="#22c55e"
                    textoClasse="text-green-400"
                  />

                  <EfficiencyRing
                    titulo="Serviço externo"
                    percentual={eficienciaExterna}
                    concluidas={concluidasExternas}
                    total={totalExternas}
                    cor="#f59e0b"
                    textoClasse="text-amber-400"
                  />
                </div>

                <div className="mt-5 rounded-xl border border-amber-400/10 bg-amber-500/[0.04] px-3 py-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-amber-300/70">
                    Serviços externos
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    EMPREITEIRA • Zeze Serralheiro
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 grid min-w-0 gap-5 lg:grid-cols-3">
              <div className="min-w-0 rounded-2xl border border-white/10 bg-white/5 p-4 shadow-sm backdrop-blur-xl sm:p-6 lg:col-span-2">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="break-words text-lg font-bold text-white">
                      Prioridades
                    </h3>

                    <p className="mt-1 break-words text-sm text-slate-400">
                      Distribuição das OS por nível de urgência.
                    </p>
                  </div>

                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white shadow-[0_0_24px_rgba(34,211,238,0.12)]">
                    <TrendingUp size={20} />
                  </div>
                </div>

                <div className="mt-6 grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <PriorityBox
                    label="Baixa"
                    value={baixa}
                    color="green"
                    href={hrefOrdensSequoia({
                      prioridade: "BAIXA",
                    })}
                  />

                  <PriorityBox
                    label="Média"
                    value={media}
                    color="yellow"
                    href={hrefOrdensSequoia({
                      prioridade: "MEDIA",
                    })}
                  />

                  <PriorityBox
                    label="Alta"
                    value={alta}
                    color="orange"
                    href={hrefOrdensSequoia({
                      prioridade: "ALTA",
                    })}
                  />

                  <PriorityBox
                    label="Urgente"
                    value={urgente}
                    color="red"
                    href={hrefOrdensSequoia({
                      prioridade: "URGENTE",
                    })}
                  />
                </div>
              </div>

              <div className="min-w-0 rounded-2xl border border-white/10 bg-white/5 p-4 shadow-sm backdrop-blur-xl sm:p-6">
                <h3 className="text-lg font-bold text-white">
                  Cadastros
                </h3>

                <div className="mt-5 space-y-4">
                  <MiniCard
                    title="Colaboradores ativos"
                    value={colaboradores}
                    icon={<Users />}
                    href="/admin/colaboradores"
                  />

                  <MiniCard
                    title="Setores cadastrados"
                    value={setores}
                    icon={<Building2 />}
                    href="/admin/setores"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <AssistenteSistema />
    </main>
  );
}

function MenuItem({
  icon,
  label,
  active,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  href?: string;
}) {
  const content = (
    <div
      className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
        active
          ? "border border-cyan-400/30 bg-cyan-400/10 text-cyan-200 shadow-[0_0_24px_rgba(34,211,238,0.12)]"
          : "text-slate-400 hover:bg-white/5 hover:text-white"
      }`}
    >
      {icon}
      {label}
    </div>
  );

  if (href) return <Link href={href}>{content}</Link>;
  return content;
}

function BIStatusCard({
  label,
  value,
  total,
  href,
  color,
}: {
  label: string;
  value: number;
  total: number;
  href: string;
  color: "red" | "blue" | "green" | "slate";
}) {
  const percentage =
    total > 0
      ? Math.round((value / total) * 100)
      : 0;

  const colors = {
    red: {
      bg: "bg-red-500/10",
      border: "border-red-400/20",
      text: "text-red-300",
      bar: "bg-red-400",
    },

    blue: {
      bg: "bg-blue-500/10",
      border: "border-blue-400/20",
      text: "text-blue-300",
      bar: "bg-blue-400",
    },

    green: {
      bg: "bg-green-500/10",
      border: "border-green-400/20",
      text: "text-green-300",
      bar: "bg-green-400",
    },

    slate: {
      bg: "bg-slate-500/10",
      border: "border-slate-400/20",
      text: "text-slate-300",
      bar: "bg-slate-400",
    },
  };

  const current = colors[color];

  return (
    <Link
      href={href}
      className={`block min-w-0 rounded-2xl border ${current.border} ${current.bg} p-5 transition hover:-translate-y-0.5 hover:shadow-[0_0_24px_rgba(34,211,238,0.10)]`}
    >
      <div className="flex items-center justify-between gap-3">
        <span
          className={`min-w-0 break-words text-sm font-bold ${current.text}`}
        >
          {label}
        </span>

        <span
          className={`shrink-0 rounded-full bg-white/10 px-3 py-1 text-xs font-black ${current.text}`}
        >
          {percentage}%
        </span>
      </div>

      <p className="mt-5 text-4xl font-extrabold text-white">
        {value}
      </p>

      <p className="text-xs font-semibold text-slate-400">
        ordens
      </p>

      <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full ${current.bar}`}
          style={{
            width: `${percentage}%`,
          }}
        />
      </div>
    </Link>
  );
}

/*
 * ============================================================
 * EFICIÊNCIA INTERNA / EXTERNA
 * ============================================================
 */

function EfficiencyRing({
  titulo,
  percentual,
  concluidas,
  total,
  cor,
  textoClasse,
}: {
  titulo: string;
  percentual: number;
  concluidas: number;
  total: number;
  cor: string;
  textoClasse: string;
}) {
  return (
    <div className="min-w-0 text-center">
      <div className="relative mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-slate-900">
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `conic-gradient(${cor} ${percentual}%, #1e293b 0)`,
          }}
        />

        <div className="relative flex h-20 w-20 flex-col items-center justify-center rounded-full bg-[#020617]">
          <span className="text-xl font-extrabold text-white">
            {percentual}%
          </span>

          <span
            className={`text-[9px] font-bold ${textoClasse}`}
          >
            concluídas
          </span>
        </div>
      </div>

      <p className="mt-3 break-words text-xs font-extrabold text-white">
        {titulo}
      </p>

      <p className="mt-1 text-[10px] text-slate-500">
        {concluidas}/{total} OS
      </p>
    </div>
  );
}

function PriorityBox({
  label,
  value,
  color,
  href,
}: {
  label: string;
  value: number;
  color: "green" | "yellow" | "orange" | "red";
  href: string;
}) {
  const colors = {
    green:
      "border-green-400/20 bg-green-500/10 text-green-300",

    yellow:
      "border-yellow-400/20 bg-yellow-500/10 text-yellow-300",

    orange:
      "border-orange-400/20 bg-orange-500/10 text-orange-300",

    red:
      "border-red-400/20 bg-red-500/10 text-red-300",
  };

  return (
    <Link
      href={href}
      className={`min-w-0 rounded-2xl border p-5 transition hover:-translate-y-0.5 hover:shadow-[0_0_24px_rgba(34,211,238,0.10)] ${colors[color]}`}
    >
      <p className="break-words text-sm font-bold">
        {label}
      </p>

      <p className="mt-3 text-3xl font-extrabold">
        {value}
      </p>
    </Link>
  );
}

function MiniCard({
  title,
  value,
  icon,
  href,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  href: string;
}) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="min-w-0">
        <p className="break-words text-sm text-slate-400">
          {title}
        </p>

        <p className="text-2xl font-extrabold text-white">
          {value}
        </p>
      </div>

      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-white">
        {icon}
      </div>
    </div>
  );
}