import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Factory,
  Gauge,
  PlayCircle,
  Wrench,
  XCircle,
} from "lucide-react";
import { prisma } from "@/src/lib/prisma";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    sigla: string;
  }>;
};

const STATUS_LABEL: Record<string, string> = {
  NAO_INICIADA: "Não iniciada",
  EM_ANDAMENTO: "Em andamento",
  CONCLUIDA: "Concluída",
  CANCELADA: "Cancelada",
};

const PRIORIDADE_LABEL: Record<string, string> = {
  BAIXA: "Baixa",
  MEDIA: "Média",
  ALTA: "Alta",
  URGENTE: "Urgente",
};

export default async function DashboardEmpresaPage({
  params,
}: PageProps) {
  const { sigla } = await params;
  const siglaNormalizada = String(sigla).trim().toUpperCase();

  const empresa = await prisma.empresa.findFirst({
    where: {
      sigla: {
        equals: siglaNormalizada,
        mode: "insensitive",
      },
    },
    select: {
      id: true,
      nome: true,
      sigla: true,
      ativo: true,
      cor: true,

      _count: {
        select: {
          setores: true,
          ordens: true,
          preventivas: true,
        },
      },
    },
  });

  if (!empresa) {
    notFound();
  }

  const [
    agrupamentoStatus,
    totalMaquinas,
    setores,
    ordensRecentes,
  ] = await Promise.all([
    prisma.ordemServico.groupBy({
      by: ["status"],
      where: {
        empresaId: empresa.id,
      },
      _count: {
        _all: true,
      },
    }),

    prisma.maquina.count({
      where: {
        setor: {
          is: {
            empresaId: empresa.id,
          },
        },
      },
    }),

    prisma.setor.findMany({
      where: {
        empresaId: empresa.id,
      },
      select: {
        id: true,
        nome: true,
        ativo: true,

        _count: {
          select: {
            ordens: true,
            maquinas: true,
          },
        },
      },
      orderBy: {
        nome: "asc",
      },
    }),

    prisma.ordemServico.findMany({
      where: {
        empresaId: empresa.id,
      },
      select: {
        id: true,
        numero: true,
        titulo: true,
        status: true,
        prioridade: true,
        createdAt: true,

        setor: {
          select: {
            nome: true,
          },
        },

        maquina: {
          select: {
            nome: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 6,
    }),
  ]);

  const status = Object.fromEntries(
    agrupamentoStatus.map((item) => [
      item.status,
      item._count._all,
    ])
  ) as Record<string, number>;

  const naoIniciadas = status.NAO_INICIADA ?? 0;
  const emAndamento = status.EM_ANDAMENTO ?? 0;
  const concluidas = status.CONCLUIDA ?? 0;
  const canceladas = status.CANCELADA ?? 0;

  const abertas = naoIniciadas + emAndamento;
  const totalOS = empresa._count.ordens;

  const percentualConclusao =
    totalOS > 0
      ? Math.round((concluidas / totalOS) * 100)
      : 0;

  const corEmpresa = empresa.cor || "#22D3EE";

  return (
    <main className="min-h-screen bg-[#050816] px-4 py-8 text-white md:px-10">
      <div className="mx-auto max-w-7xl space-y-7">
        <header className="overflow-hidden rounded-3xl border border-white/10 bg-[#080d1f] shadow-2xl">
          <div
            className="h-2 w-full"
            style={{
              backgroundColor: corEmpresa,
            }}
          />

          <div className="flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between md:p-8">
            <div className="flex items-center gap-4">
              <div
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border"
                style={{
                  borderColor: `${corEmpresa}55`,
                  backgroundColor: `${corEmpresa}18`,
                  color: corEmpresa,
                }}
              >
                <Factory size={30} />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p
                    className="text-sm font-black"
                    style={{
                      color: corEmpresa,
                    }}
                  >
                    {empresa.sigla}
                  </p>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-black ${
                      empresa.ativo
                        ? "bg-emerald-500/15 text-emerald-300"
                        : "bg-red-500/15 text-red-300"
                    }`}
                  >
                    {empresa.ativo ? "Empresa ativa" : "Empresa inativa"}
                  </span>
                </div>

                <h1 className="mt-1 text-3xl font-black md:text-5xl">
                  {empresa.nome}
                </h1>

                <p className="mt-2 text-slate-400">
                  Dashboard de manutenção e ordens de serviço.
                </p>
              </div>
            </div>

            <Link
              href="/admin/empresas"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-50"
            >
              <ArrowLeft size={17} />
              Voltar às empresas
            </Link>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <ResumoCard
            titulo="Total de OS"
            valor={totalOS}
            icone={<ClipboardList size={21} />}
          />

          <ResumoCard
            titulo="OS abertas"
            valor={abertas}
            icone={<PlayCircle size={21} />}
            destaque={abertas > 0 ? "orange" : "default"}
          />

          <ResumoCard
            titulo="OS concluídas"
            valor={concluidas}
            icone={<CheckCircle2 size={21} />}
            destaque="green"
          />

          <ResumoCard
            titulo="Taxa de conclusão"
            valor={`${percentualConclusao}%`}
            icone={<Gauge size={21} />}
          />
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <ResumoCard
            titulo="Setores"
            valor={empresa._count.setores}
            icone={<Building2 size={21} />}
          />

          <ResumoCard
            titulo="Máquinas"
            valor={totalMaquinas}
            icone={<Wrench size={21} />}
          />

          <ResumoCard
            titulo="Preventivas"
            valor={empresa._count.preventivas}
            icone={<CalendarClock size={21} />}
          />

          <ResumoCard
            titulo="Canceladas"
            valor={canceladas}
            icone={<XCircle size={21} />}
            destaque={canceladas > 0 ? "red" : "default"}
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_420px]">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl md:p-6">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black">
                  Setores da empresa
                </h2>

                <p className="text-sm text-slate-400">
                  Máquinas e volume de OS de cada setor.
                </p>
              </div>

              <Building2 className="text-cyan-300" />
            </div>

            {setores.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/20 p-10 text-center">
                <Building2
                  size={34}
                  className="mx-auto mb-3 text-slate-500"
                />

                <p className="font-black">
                  Nenhum setor cadastrado
                </p>

                <p className="mt-1 text-sm text-slate-400">
                  Os setores adicionados para {empresa.nome} aparecerão
                  aqui.
                </p>
              </div>
            ) : (
              <div className="grid gap-3">
                {setores.map((setor) => (
                  <div
                    key={setor.id}
                    className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-[#050816] p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-black text-white">
                          {setor.nome}
                        </p>

                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-black ${
                            setor.ativo
                              ? "bg-emerald-500/15 text-emerald-300"
                              : "bg-red-500/15 text-red-300"
                          }`}
                        >
                          {setor.ativo ? "Ativo" : "Inativo"}
                        </span>
                      </div>

                      <p className="mt-1 text-sm text-slate-400">
                        {setor._count.maquinas} máquina(s) cadastrada(s)
                      </p>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-center">
                      <p className="text-xs font-bold uppercase text-slate-500">
                        Ordens
                      </p>

                      <p className="text-xl font-black">
                        {setor._count.ordens}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl md:p-6">
            <div className="mb-6">
              <h2 className="text-xl font-black">
                Distribuição das OS
              </h2>

              <p className="text-sm text-slate-400">
                Situação atual das ordens da empresa.
              </p>
            </div>

            <div className="space-y-3">
              <StatusLinha
                label="Não iniciadas"
                valor={naoIniciadas}
                cor="bg-yellow-400"
              />

              <StatusLinha
                label="Em andamento"
                valor={emAndamento}
                cor="bg-cyan-400"
              />

              <StatusLinha
                label="Concluídas"
                valor={concluidas}
                cor="bg-emerald-400"
              />

              <StatusLinha
                label="Canceladas"
                valor={canceladas}
                cor="bg-red-400"
              />
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-[#050816] p-5 text-center">
              <p className="text-sm font-bold text-slate-400">
                Percentual concluído
              </p>

              <p
                className="mt-2 text-5xl font-black"
                style={{
                  color: corEmpresa,
                }}
              >
                {percentualConclusao}%
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl md:p-6">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black">
                Ordens de serviço recentes
              </h2>

              <p className="text-sm text-slate-400">
                Últimas OS registradas para {empresa.nome}.
              </p>
            </div>

            <ClipboardList className="text-cyan-300" />
          </div>

          {ordensRecentes.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/20 p-10 text-center text-slate-400">
              Nenhuma ordem de serviço registrada para esta empresa.
            </div>
          ) : (
            <div className="grid gap-3">
              {ordensRecentes.map((os) => (
                <Link
                  key={os.id}
                  href={`/admin/os/${os.id}`}
                  className="group flex flex-col gap-4 rounded-2xl border border-white/10 bg-[#050816] p-4 transition hover:border-cyan-400/40 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-black text-cyan-300">
                        {empresa.sigla} • OS #{os.numero}
                      </p>

                      <span className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-black text-slate-300">
                        {STATUS_LABEL[os.status] ?? os.status}
                      </span>

                      <span className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-black text-slate-300">
                        {PRIORIDADE_LABEL[os.prioridade] ??
                          os.prioridade}
                      </span>
                    </div>

                    <p className="mt-2 truncate font-black text-white">
                      {os.titulo}
                    </p>

                    <p className="mt-1 text-sm text-slate-400">
                      {os.setor.nome}
                      {os.maquina?.nome
                        ? ` • ${os.maquina.nome}`
                        : ""}
                    </p>
                  </div>

                  <ChevronRight
                    size={20}
                    className="shrink-0 text-slate-500 transition group-hover:translate-x-1 group-hover:text-cyan-300"
                  />
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function ResumoCard({
  titulo,
  valor,
  icone,
  destaque = "default",
}: {
  titulo: string;
  valor: number | string;
  icone: React.ReactNode;
  destaque?: "default" | "green" | "orange" | "red";
}) {
  const estilos = {
    default: "bg-cyan-400 text-slate-950",
    green: "bg-emerald-400 text-slate-950",
    orange: "bg-orange-400 text-slate-950",
    red: "bg-red-400 text-slate-950",
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-[#080d1f] p-5 shadow-lg">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-400">{titulo}</p>

          <p className="mt-1 text-3xl font-black text-white">
            {valor}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${estilos[destaque]}`}
        >
          {icone}
        </div>
      </div>
    </div>
  );
}

function StatusLinha({
  label,
  valor,
  cor,
}: {
  label: string;
  valor: number;
  cor: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#050816] px-4 py-3">
      <div className="flex items-center gap-3">
        <span className={`h-3 w-3 rounded-full ${cor}`} />

        <p className="text-sm font-bold text-slate-300">
          {label}
        </p>
      </div>

      <p className="text-lg font-black text-white">{valor}</p>
    </div>
  );
}