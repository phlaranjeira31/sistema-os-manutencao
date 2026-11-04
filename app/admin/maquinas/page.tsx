import type { ReactNode } from "react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Boxes,
  CheckCircle2,
  ClipboardList,
  Factory,
  Filter,
  Gauge,
  LayoutGrid,
  Map as MapIcon,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Wrench,
  Zap,
} from "lucide-react";

import { authOptions } from "@/src/lib/auth";
import HeaderUsuario from "@/components/HeaderUsuario";
import { prisma } from "@/src/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = {
  searchParams?: Promise<{
    q?: string;
    setorId?: string;
    status?: string;
  }>;
};

function formatarData(
  data: Date | string | null | undefined
) {
  if (!data) {
    return "—";
  }

  return new Intl.DateTimeFormat("pt-BR").format(
    new Date(data)
  );
}

function hrefCentral(params: {
  q?: string;
  setorId?: string;
  status?: string;
}) {
  const query = new URLSearchParams();

  if (params.q) {
    query.set("q", params.q);
  }

  if (params.setorId) {
    query.set("setorId", params.setorId);
  }

  if (
    params.status &&
    params.status !== "ativos"
  ) {
    query.set("status", params.status);
  }

  const texto = query.toString();

  return texto
    ? `/admin/maquinas?${texto}`
    : "/admin/maquinas";
}

export default async function MaquinasPage({
  searchParams,
}: PageProps) {
  const session =
    await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const params = await searchParams;

  const busca = String(
    params?.q ?? ""
  ).trim();

  const setorId = String(
    params?.setorId ?? ""
  ).trim();

  const status = String(
    params?.status ?? "ativos"
  ).trim();

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
        nome: true,
      },
    });

  const empresaId =
    empresaSequoia?.id ?? "";

  const setores = empresaId
    ? await prisma.setor.findMany({
        where: {
          empresaId,
          ativo: true,

          maquinas: {
            some: {},
          },
        },

        orderBy: {
          nome: "asc",
        },

        select: {
          id: true,
          nome: true,

          maquinas: {
            select: {
              id: true,
              ativo: true,
            },
          },
        },
      })
    : [];

  const setorIds = setores.map(
    (setor) => setor.id
  );

  const maquinasBase =
    setorIds.length > 0
      ? await prisma.maquina.findMany({
          where: {
            setorId: {
              in: setorIds,
            },
          },

          orderBy: [
            {
              setor: {
                nome: "asc",
              },
            },
            {
              nome: "asc",
            },
          ],

          select: {
            id: true,
            nome: true,
            ativo: true,
            createdAt: true,
            updatedAt: true,

            setor: {
              select: {
                id: true,
                nome: true,
              },
            },

            ordens: {
              select: {
                id: true,
                numero: true,
                status: true,
                prioridade: true,
                createdAt: true,
              },

              orderBy: {
                createdAt: "desc",
              },
            },

            planosPreventivos: {
              where: {
                ativo: true,
              },

              select: {
                id: true,
                proximaExecucao: true,
              },
            },
          },
        })
      : [];

  const maquinasFiltradas =
    maquinasBase.filter((maquina) => {
      const combinaBusca =
        !busca ||
        maquina.nome
          .toLowerCase()
          .includes(
            busca.toLowerCase()
          ) ||
        maquina.setor.nome
          .toLowerCase()
          .includes(
            busca.toLowerCase()
          );

      const combinaSetor =
        !setorId ||
        maquina.setor.id ===
          setorId;

      const combinaStatus =
        status === "todos"
          ? true
          : status === "inativos"
            ? !maquina.ativo
            : maquina.ativo;

      return (
        combinaBusca &&
        combinaSetor &&
        combinaStatus
      );
    });

  const maquinasAtivas =
    maquinasBase.filter(
      (maquina) => maquina.ativo
    );

  const maquinasComAbertas =
    maquinasAtivas.filter((maquina) =>
      maquina.ordens.some(
        (os) =>
          os.status ===
            "NAO_INICIADA" ||
          os.status ===
            "EM_ANDAMENTO"
      )
    ).length;

  const maquinasComUrgente =
    maquinasAtivas.filter((maquina) =>
      maquina.ordens.some(
        (os) =>
          os.prioridade ===
            "URGENTE" &&
          os.status !==
            "CONCLUIDA" &&
          os.status !==
            "CANCELADA"
      )
    ).length;

  const planosAtivos =
    maquinasAtivas.reduce(
      (total, maquina) =>
        total +
        maquina.planosPreventivos.length,
      0
    );

  const grupos = setores
    .map((setor) => ({
      ...setor,

      maquinas:
        maquinasFiltradas.filter(
          (maquina) =>
            maquina.setor.id ===
            setor.id
        ),
    }))
    .filter(
      (setor) =>
        setor.maquinas.length > 0
    );

  return (
    <main className="min-h-screen bg-[#020617] text-white">
      <HeaderUsuario />

      <div className="mx-auto w-full max-w-[1700px] px-4 py-6 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-[32px] border border-white/[0.08] bg-[linear-gradient(135deg,#07101f_0%,#071627_55%,#0a1630_100%)] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.22)] sm:p-7 lg:p-8">
          <div className="pointer-events-none absolute -left-24 top-0 h-48 w-48 rounded-full bg-cyan-400/[0.05] blur-3xl" />
          <div className="pointer-events-none absolute -right-20 -top-12 h-56 w-56 rounded-full bg-blue-500/[0.06] blur-3xl" />

          <div className="relative flex flex-col gap-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="min-w-0">
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs font-black text-slate-300 transition hover:border-cyan-400/30 hover:text-cyan-200"
                >
                  <ArrowLeft size={14} />
                  Voltar ao painel
                </Link>

                <div className="mt-5 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.16em] text-cyan-300">
                  <Factory size={16} />
                  Central de ativos
                </div>

                <h1 className="mt-3 text-3xl font-black tracking-[-0.04em] text-white sm:text-4xl">
                  Máquinas & Ativos
                </h1>

                <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300/90">
                  Hub operacional para localizar máquinas com rapidez, acessar dashboards individuais,
                  acompanhar OS abertas e visualizar a saúde preventiva dos equipamentos.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/admin/mapa-fabrica"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.04] px-5 text-sm font-black text-slate-200 transition hover:border-cyan-400/30 hover:bg-cyan-400/[0.07] hover:text-cyan-200"
                >
                  <MapIcon size={17} />
                  Mapa da fábrica
                </Link>

                <Link
                  href="/admin/os"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-5 text-sm font-black text-slate-950 transition hover:bg-cyan-300"
                >
                  <ClipboardList size={17} />
                  Ver ordens
                </Link>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
              <HeroMiniInfo
                label="Empresa"
                value={
                  empresaSequoia?.nome ??
                  "Sequoia"
                }
              />
              <HeroMiniInfo
                label="Base"
                value={`${maquinasBase.length} ativos`}
              />
              <HeroMiniInfo
                label="Filtro atual"
                value={`${maquinasFiltradas.length} exibidas`}
              />
              <HeroMiniInfo
                label="Setores"
                value={`${setores.length} áreas`}
              />
              <HeroMiniInfo
                label="OS em aberto"
                value={`${maquinasComAbertas}`}
              />
              <HeroMiniInfo
                label="Preventivas"
                value={`${planosAtivos} planos`}
              />
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <KpiCard
            label="Máquinas ativas"
            value={String(
              maquinasAtivas.length
            )}
            helper={`${maquinasBase.length} cadastrada(s)`}
            icon={<Factory size={18} />}
            tone="cyan"
          />

          <KpiCard
            label="Setores"
            value={String(setores.length)}
            helper="Com ativos cadastrados"
            icon={<LayoutGrid size={18} />}
            tone="violet"
          />

          <KpiCard
            label="Com OS abertas"
            value={String(
              maquinasComAbertas
            )}
            helper="Exigem acompanhamento"
            icon={<Activity size={18} />}
            tone="orange"
          />

          <KpiCard
            label="Com urgência"
            value={String(
              maquinasComUrgente
            )}
            helper="OS urgente ainda aberta"
            icon={
              <AlertTriangle size={18} />
            }
            tone={
              maquinasComUrgente > 0
                ? "red"
                : "green"
            }
          />

          <KpiCard
            label="Planos preventivos"
            value={String(planosAtivos)}
            helper="Planos ativos nas máquinas"
            icon={<ShieldCheck size={18} />}
            tone="green"
          />
        </section>

        <section className="mt-5 overflow-hidden rounded-[28px] border border-white/[0.07] bg-[#070c1b] shadow-[0_10px_35px_rgba(0,0,0,0.20)]">
          <div className="border-b border-white/[0.06] p-5 sm:p-6">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.14em] text-cyan-300">
                  <SlidersHorizontal size={14} />
                  Pesquisa operacional
                </p>

                <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-white">
                  Localize qualquer máquina com agilidade
                </h2>

                <p className="mt-2 text-sm text-slate-400">
                  Filtros rápidos por nome, setor e status, mantendo a navegação mais objetiva.
                </p>
              </div>

              <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.05] px-4 py-3 text-right">
                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-cyan-300">
                  Resultado do filtro
                </p>
                <p className="mt-1 text-2xl font-black tracking-[-0.03em] text-white">
                  {maquinasFiltradas.length}
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-6">
            <form className="grid gap-3 xl:grid-cols-[1.4fr_280px_180px_130px]">
              <label className="min-w-0">
                <span className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
                  <Search size={14} />
                  Buscar máquina
                </span>

                <input
                  name="q"
                  defaultValue={busca}
                  placeholder="Ex.: fritadeira, proofer, esteira..."
                  className="h-12 w-full rounded-2xl border border-white/[0.08] bg-[#020617] px-4 text-sm font-semibold text-white outline-none transition placeholder:text-slate-700 focus:border-cyan-400/40"
                />
              </label>

              <label>
                <span className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
                  <Filter size={14} />
                  Setor
                </span>

                <select
                  name="setorId"
                  defaultValue={setorId}
                  className="h-12 w-full rounded-2xl border border-white/[0.08] bg-[#020617] px-4 text-sm font-semibold text-white outline-none transition focus:border-cyan-400/40"
                >
                  <option value="">
                    Todos os setores
                  </option>

                  {setores.map((setor) => (
                    <option
                      key={setor.id}
                      value={setor.id}
                    >
                      {setor.nome}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
                  Status
                </span>

                <select
                  name="status"
                  defaultValue={status}
                  className="h-12 w-full rounded-2xl border border-white/[0.08] bg-[#020617] px-4 text-sm font-semibold text-white outline-none transition focus:border-cyan-400/40"
                >
                  <option value="ativos">
                    Ativas
                  </option>
                  <option value="inativos">
                    Inativas
                  </option>
                  <option value="todos">
                    Todas
                  </option>
                </select>
              </label>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="h-12 w-full rounded-2xl bg-cyan-400 px-5 text-sm font-black text-slate-950 transition hover:bg-cyan-300"
                >
                  Filtrar
                </button>
              </div>
            </form>

            <div className="mt-5 rounded-2xl border border-white/[0.06] bg-[#030817] p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
                  Acesso rápido por setor
                </p>

                {(busca ||
                  setorId ||
                  status !==
                    "ativos") && (
                  <Link
                    href="/admin/maquinas"
                    className="text-xs font-black text-cyan-300 transition hover:text-cyan-200"
                  >
                    Limpar filtros
                  </Link>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <Link
                  href={hrefCentral({
                    q: busca,
                    status,
                  })}
                  className={`rounded-full border px-4 py-2 text-xs font-black transition ${
                    !setorId
                      ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-200"
                      : "border-white/[0.08] bg-white/[0.02] text-slate-400 hover:border-white/15 hover:text-white"
                  }`}
                >
                  Todos
                </Link>

                {setores.map((setor) => (
                  <Link
                    key={setor.id}
                    href={hrefCentral({
                      q: busca,
                      setorId: setor.id,
                      status,
                    })}
                    className={`rounded-full border px-4 py-2 text-xs font-black transition ${
                      setorId === setor.id
                        ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-200"
                        : "border-white/[0.08] bg-white/[0.02] text-slate-400 hover:border-white/15 hover:text-white"
                    }`}
                  >
                    {setor.nome}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-cyan-300">
                Equipamentos
              </p>

              <h2 className="mt-1 text-2xl font-black tracking-[-0.03em] text-white">
                {maquinasFiltradas.length} máquina(s) encontrada(s)
              </h2>
            </div>

            <p className="text-xs text-slate-500">
              Clique no equipamento para abrir o dashboard operacional individual.
            </p>
          </div>

          {grupos.length === 0 ? (
            <div className="flex min-h-[280px] items-center justify-center rounded-[28px] border border-dashed border-white/10 bg-[#070c1b] p-6 text-center">
              <div>
                <Search
                  size={32}
                  className="mx-auto text-slate-600"
                />

                <p className="mt-4 text-base font-black text-slate-300">
                  Nenhuma máquina encontrada
                </p>

                <p className="mt-2 text-sm text-slate-600">
                  Ajuste os filtros ou limpe a busca.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {grupos.map((setor) => (
                <section
                  key={setor.id}
                  className="overflow-hidden rounded-[28px] border border-white/[0.07] bg-[#070c1b]"
                >
                  <div className="border-b border-white/[0.06] px-5 py-5 sm:px-6">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.05] text-cyan-300">
                          <Boxes size={20} />
                        </div>

                        <div>
                          <h3 className="text-xl font-black tracking-[-0.02em] text-white">
                            {setor.nome}
                          </h3>

                          <p className="mt-1 text-sm text-slate-500">
                            {setor.maquinas.length} equipamento(s) neste setor
                          </p>
                        </div>
                      </div>

                      <Link
                        href={hrefCentral({
                          setorId: setor.id,
                          status,
                        })}
                        className="inline-flex items-center gap-2 text-sm font-black text-cyan-300 transition hover:text-cyan-200"
                      >
                        Fixar setor
                        <ArrowRight size={15} />
                      </Link>
                    </div>
                  </div>

                  <div className="p-5 sm:p-6">
                    <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                      {setor.maquinas.map(
                        (maquina) => (
                          <MaquinaCard
                            key={maquina.id}
                            maquina={maquina}
                          />
                        )
                      )}
                    </div>
                  </div>
                </section>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function HeroMiniInfo({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3">
      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-bold text-white">
        {value}
      </p>
    </div>
  );
}

function KpiCard({
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
      className={`rounded-[24px] border p-4 shadow-[0_8px_25px_rgba(0,0,0,0.16)] ${estilos[tone].box}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
            {label}
          </p>

          <p className="mt-2 text-3xl font-black tracking-[-0.04em] text-white">
            {value}
          </p>

          <p className="mt-1 text-[11px] text-slate-600">
            {helper}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-2xl border border-white/[0.06] bg-black/10 ${estilos[tone].icon}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function MaquinaCard({
  maquina,
}: {
  maquina: {
    id: string;
    nome: string;
    ativo: boolean;
    createdAt: Date;
    updatedAt: Date;

    setor: {
      id: string;
      nome: string;
    };

    ordens: {
      id: string;
      numero: number;
      status: string;
      prioridade: string;
      createdAt: Date;
    }[];

    planosPreventivos: {
      id: string;
      proximaExecucao: Date;
    }[];
  };
}) {
  const total =
    maquina.ordens.length;

  const abertas =
    maquina.ordens.filter(
      (os) =>
        os.status ===
          "NAO_INICIADA" ||
        os.status ===
          "EM_ANDAMENTO"
    ).length;

  const concluidas =
    maquina.ordens.filter(
      (os) =>
        os.status ===
        "CONCLUIDA"
    ).length;

  const urgentes =
    maquina.ordens.filter(
      (os) =>
        os.prioridade ===
          "URGENTE" &&
        os.status !==
          "CONCLUIDA" &&
        os.status !==
          "CANCELADA"
    ).length;

  const planosAtivos =
    maquina.planosPreventivos.length;

  const proximaPreventiva =
    maquina.planosPreventivos
      .map(
        (plano) =>
          plano.proximaExecucao
      )
      .sort(
        (a, b) =>
          new Date(a).getTime() -
          new Date(b).getTime()
      )[0] ?? null;

  const ultimaOS =
    maquina.ordens[0] ?? null;

  return (
    <article className="group overflow-hidden rounded-[24px] border border-white/[0.075] bg-[#050b18] transition duration-200 hover:-translate-y-0.5 hover:border-cyan-400/20 hover:shadow-[0_18px_45px_rgba(0,0,0,0.28)]">
      <div className="border-b border-white/[0.06] p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.05] text-cyan-300">
              <Wrench size={20} />
            </div>

            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.11em] text-cyan-400/80">
                {maquina.setor.nome}
              </p>

              <h4 className="mt-1 break-words text-[20px] font-black leading-tight tracking-[-0.02em] text-white">
                {maquina.nome}
              </h4>

              <p className="mt-2 text-[11px] text-slate-500">
                Atualizado em{" "}
                {formatarData(
                  maquina.updatedAt
                )}
              </p>
            </div>
          </div>

          <span
            className={`shrink-0 rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.08em] ${
              maquina.ativo
                ? "border-emerald-400/15 bg-emerald-400/[0.07] text-emerald-300"
                : "border-red-400/15 bg-red-400/[0.07] text-red-300"
            }`}
          >
            {maquina.ativo
              ? "Ativa"
              : "Inativa"}
          </span>
        </div>
      </div>

      <div className="p-5">
        <div className="grid grid-cols-4 gap-2">
          <MiniStat
            label="Total OS"
            value={total}
            tone="neutral"
          />

          <MiniStat
            label="Abertas"
            value={abertas}
            tone={
              abertas > 0
                ? "orange"
                : "neutral"
            }
          />

          <MiniStat
            label="Concluídas"
            value={concluidas}
            tone="green"
          />

          <MiniStat
            label="Urgentes"
            value={urgentes}
            tone={
              urgentes > 0
                ? "red"
                : "neutral"
            }
          />
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <InfoBloco
            icon={<ShieldCheck size={13} />}
            title="Preventivas"
            color="text-violet-300"
            value={`${planosAtivos} plano(s) ativo(s)`}
            helper={
              proximaPreventiva
                ? `Próxima: ${formatarData(
                    proximaPreventiva
                  )}`
                : "Sem próxima preventiva"
            }
          />

          <InfoBloco
            icon={<Gauge size={13} />}
            title="Última OS"
            color="text-cyan-300"
            value={
              ultimaOS
                ? `#${ultimaOS.numero}`
                : "Nenhuma"
            }
            helper={
              ultimaOS
                ? formatarData(
                    ultimaOS.createdAt
                  )
                : "Sem histórico"
            }
          />
        </div>

        {urgentes > 0 && (
          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-red-400/15 bg-red-400/[0.04] px-3 py-3 text-[11px] font-bold text-red-300">
            <Zap size={14} />
            {urgentes} OS urgente(s) exigindo atenção
          </div>
        )}

        <Link
          href={`/admin/maquinas/${maquina.id}`}
          className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-cyan-400/25 bg-cyan-400/[0.06] text-sm font-black text-cyan-200 transition group-hover:bg-cyan-400 group-hover:text-slate-950"
        >
          Abrir dashboard
          <ArrowRight size={15} />
        </Link>
      </div>
    </article>
  );
}

function InfoBloco({
  icon,
  title,
  color,
  value,
  helper,
}: {
  icon: ReactNode;
  title: string;
  color: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.055] bg-[#030817] p-3">
      <p
        className={`flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.08em] ${color}`}
      >
        {icon}
        {title}
      </p>

      <p className="mt-2 text-sm font-black text-white">
        {value}
      </p>

      <p className="mt-1 text-[10px] text-slate-600">
        {helper}
      </p>
    </div>
  );
}

function MiniStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone:
    | "neutral"
    | "orange"
    | "green"
    | "red";
}) {
  const estilos = {
    neutral:
      "border-white/[0.06] bg-white/[0.018] text-slate-300",

    orange:
      "border-orange-400/15 bg-orange-400/[0.035] text-orange-300",

    green:
      "border-emerald-400/15 bg-emerald-400/[0.035] text-emerald-300",

    red:
      "border-red-400/15 bg-red-400/[0.035] text-red-300",
  };

  return (
    <div
      className={`rounded-2xl border p-2.5 text-center ${estilos[tone]}`}
    >
      <p className="text-[8px] font-black uppercase tracking-[0.08em] opacity-75">
        {label}
      </p>

      <p className="mt-1 text-lg font-black text-white">
        {value}
      </p>
    </div>
  );
}