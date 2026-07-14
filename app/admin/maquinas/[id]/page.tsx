import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Cpu,
  Search,
  XCircle,
} from "lucide-react";
import { prisma } from "@/src/lib/prisma";
import BotaoPDFMaquina from "@/components/BotaoPDFMaquina";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = {
  params: Promise<{
    id: string;
  }>;

  searchParams?: Promise<{
    dataInicio?: string;
    dataFim?: string;
  }>;
};

function formatDate(date: Date | string | null | undefined) {
  if (!date) return "-";

  return new Intl.DateTimeFormat("pt-BR").format(new Date(date));
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

function diferencaEmHoras(
  inicio: Date | string,
  fim: Date | string | null | undefined
) {
  if (!fim) return 0;

  const inicioMs = new Date(inicio).getTime();
  const fimMs = new Date(fim).getTime();

  if (Number.isNaN(inicioMs) || Number.isNaN(fimMs)) return 0;

  return Math.max(0, (fimMs - inicioMs) / (1000 * 60 * 60));
}

export default async function DashboardMaquinaPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const filtros = await searchParams;

  const dataInicioFiltro = String(filtros?.dataInicio ?? "").trim();
  const dataFimFiltro = String(filtros?.dataFim ?? "").trim();

  const dataInicio = dataInicioFiltro
    ? new Date(`${dataInicioFiltro}T00:00:00`)
    : null;

  const dataFim = dataFimFiltro
    ? new Date(`${dataFimFiltro}T23:59:59`)
    : null;

  const maquina = await prisma.maquina.findUnique({
    where: {
      id,
    },
    include: {
      setor: true,
      ordens: {
        where:
          dataInicio || dataFim
            ? {
                createdAt: {
                  ...(dataInicio ? { gte: dataInicio } : {}),
                  ...(dataFim ? { lte: dataFim } : {}),
                },
              }
            : {},
        include: {
          responsaveis: {
            include: {
              user: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!maquina) {
    notFound();
  }

  const ordens = maquina.ordens;

  const total = ordens.length;

  const naoIniciadas = ordens.filter(
    (os) => os.status === "NAO_INICIADA"
  ).length;

  const emAndamento = ordens.filter(
    (os) => os.status === "EM_ANDAMENTO"
  ).length;

  const concluidas = ordens.filter(
    (os) => os.status === "CONCLUIDA"
  ).length;

  const canceladas = ordens.filter(
    (os) => os.status === "CANCELADA"
  ).length;

  const abertas = naoIniciadas + emAndamento;

  const taxaResolucao =
    total > 0 ? Math.round((concluidas / total) * 100) : 0;

  const ordensConcluidas = ordens.filter(
    (os) => os.status === "CONCLUIDA"
  );

  const totalHorasConclusao = ordensConcluidas.reduce(
    (acumulado, os) =>
      acumulado +
      diferencaEmHoras(
        os.dataInicio ?? os.createdAt,
        os.dataConclusao ?? os.updatedAt
      ),
    0
  );

  const tempoMedioHoras =
    ordensConcluidas.length > 0
      ? totalHorasConclusao / ordensConcluidas.length
      : 0;

  const dadosMensais = Array.from({ length: 6 }).map((_, index) => {
    const data = new Date();
    data.setMonth(data.getMonth() - (5 - index));

    const mes = data.getMonth();
    const ano = data.getFullYear();

    const quantidade = ordens.filter((os) => {
      const criadaEm = new Date(os.createdAt);

      return (
        criadaEm.getMonth() === mes &&
        criadaEm.getFullYear() === ano
      );
    }).length;

    return {
      label: new Intl.DateTimeFormat("pt-BR", {
        month: "short",
      })
        .format(data)
        .replace(".", ""),
      quantidade,
    };
  });

  const maiorValorMensal = Math.max(
    ...dadosMensais.map((item) => item.quantidade),
    1
  );

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#050816] px-3 py-6 text-white sm:px-4 md:px-8 lg:px-10">
      <div className="mx-auto w-full max-w-[1500px] space-y-6">
        <header className="flex flex-col gap-5 border-b border-white/10 pb-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10 text-cyan-300">
              <Cpu size={27} />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-bold text-cyan-300">
                Dashboard da máquina
              </p>

              <h1 className="break-words text-3xl font-black sm:text-4xl">
                {maquina.nome}
              </h1>

              <p className="break-words text-slate-400">
                Setor: {maquina.setor.nome}
              </p>
            </div>
          </div>

          <div className="grid w-full gap-3 sm:grid-cols-2 lg:flex lg:w-auto">
            <BotaoPDFMaquina
              maquina={maquina.nome}
              setor={maquina.setor.nome}
              dataInicio={dataInicioFiltro}
              dataFim={dataFimFiltro}
              total={total}
              naoIniciadas={naoIniciadas}
              emAndamento={emAndamento}
              concluidas={concluidas}
              canceladas={canceladas}
              taxaResolucao={taxaResolucao}
              tempoMedioHoras={tempoMedioHoras}
              ordens={ordens.map((os) => ({
                numero: os.numero,
                descricao: os.descricao,
                status: statusLabel(os.status),
                prioridade: prioridadeLabel(os.prioridade),
                criadaEm: formatDate(os.createdAt),
                concluidaEm:
                  os.status === "CONCLUIDA"
                    ? formatDate(os.dataConclusao ?? os.updatedAt)
                    : "-",
                responsavel: os.responsaveis.length
                  ? os.responsaveis
                      .map((responsavel) => responsavel.user.nome)
                      .join(", ")
                  : "-",
              }))}
            />

            <Link
              href="/admin/setores"
              className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white px-5 text-sm font-black text-slate-950 transition hover:bg-cyan-50 lg:w-auto"
            >
              <ArrowLeft size={17} />
              Voltar
            </Link>
          </div>
        </header>

        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-black/30 sm:p-6">
          <form className="grid gap-4 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_160px_140px]">
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-400">
                <CalendarDays size={16} />
                Data inicial
              </label>

              <input
                name="dataInicio"
                defaultValue={dataInicioFiltro}
                type="date"
                className="h-14 w-full rounded-2xl border border-white/10 bg-[#050816] px-4 text-sm font-semibold text-white outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-400">
                <CalendarDays size={16} />
                Data final
              </label>

              <input
                name="dataFim"
                defaultValue={dataFimFiltro}
                type="date"
                className="h-14 w-full rounded-2xl border border-white/10 bg-[#050816] px-4 text-sm font-semibold text-white outline-none focus:border-cyan-400"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-5 text-sm font-black text-slate-950 transition hover:bg-cyan-300"
              >
                <Search size={17} />
                Filtrar
              </button>
            </div>

            <div className="flex items-end">
              <Link
                href={`/admin/maquinas/${maquina.id}`}
                className="inline-flex h-14 w-full items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-5 text-sm font-black text-white transition hover:bg-white/10"
              >
                Limpar
              </Link>
            </div>
          </form>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <ResumoCard
            titulo="Total de OS"
            valor={total}
            icon={<BarChart3 size={21} />}
            estilo="cyan"
          />

          <ResumoCard
            titulo="Não iniciadas"
            valor={naoIniciadas}
            icon={<AlertTriangle size={21} />}
            estilo="yellow"
          />

          <ResumoCard
            titulo="Em andamento"
            valor={emAndamento}
            icon={<Activity size={21} />}
            estilo="orange"
          />

          <ResumoCard
            titulo="Concluídas"
            valor={concluidas}
            icon={<CheckCircle2 size={21} />}
            estilo="green"
          />

          <ResumoCard
            titulo="Canceladas"
            valor={canceladas}
            icon={<XCircle size={21} />}
            estilo="red"
          />

          <ResumoCard
            titulo="OS abertas"
            valor={abertas}
            icon={<AlertTriangle size={21} />}
            estilo="orange"
          />

          <ResumoCard
            titulo="Taxa de resolução"
            valor={`${taxaResolucao}%`}
            icon={<CheckCircle2 size={21} />}
            estilo="green"
          />

          <ResumoCard
            titulo="Tempo médio"
            valor={`${tempoMedioHoras.toFixed(1)}h`}
            icon={<Clock3 size={21} />}
            estilo="cyan"
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/30">
            <div className="mb-6">
              <h2 className="text-xl font-black">
                Distribuição por status
              </h2>

              <p className="text-sm text-slate-400">
                Situação atual das OS da máquina.
              </p>
            </div>

            <div className="space-y-5">
              <BarraStatus
                label="Não iniciadas"
                value={naoIniciadas}
                total={total}
                classe="bg-yellow-400"
              />

              <BarraStatus
                label="Em andamento"
                value={emAndamento}
                total={total}
                classe="bg-cyan-400"
              />

              <BarraStatus
                label="Concluídas"
                value={concluidas}
                total={total}
                classe="bg-emerald-400"
              />

              <BarraStatus
                label="Canceladas"
                value={canceladas}
                total={total}
                classe="bg-red-400"
              />
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/30">
            <div className="mb-6">
              <h2 className="text-xl font-black">
                OS nos últimos 6 meses
              </h2>

              <p className="text-sm text-slate-400">
                Quantidade de chamados registrados por mês.
              </p>
            </div>

            <div className="flex h-64 items-end gap-3 rounded-2xl border border-white/10 bg-[#050816] p-4">
              {dadosMensais.map((item) => {
                const altura =
                  item.quantidade > 0
                    ? Math.max(
                        12,
                        Math.round(
                          (item.quantidade / maiorValorMensal) * 100
                        )
                      )
                    : 2;

                return (
                  <div
                    key={item.label}
                    className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2"
                  >
                    <span className="text-xs font-black text-white">
                      {item.quantidade}
                    </span>

                    <div className="flex h-44 w-full items-end overflow-hidden rounded-xl bg-white/5">
                      <div
                        className="w-full rounded-xl bg-cyan-400 transition-all"
                        style={{
                          height: `${altura}%`,
                        }}
                      />
                    </div>

                    <span className="text-xs font-bold capitalize text-slate-400">
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-black/30 sm:p-6">
          <div className="mb-6">
            <h2 className="text-xl font-black">
              Histórico de ordens de serviço
            </h2>

            <p className="text-sm text-slate-400">
              Todas as OS da máquina no período selecionado.
            </p>
          </div>

          <div className="w-full overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full min-w-[1050px] border-collapse text-sm">
              <thead className="bg-cyan-400 text-slate-950">
                <tr>
                  <th className="px-4 py-3 text-left">Nº</th>
                  <th className="px-4 py-3 text-left">Descrição</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Prioridade</th>
                  <th className="px-4 py-3 text-left">Criada em</th>
                  <th className="px-4 py-3 text-left">Concluída em</th>
                  <th className="px-4 py-3 text-left">Responsável</th>
                  <th className="px-4 py-3 text-left">Ação</th>
                </tr>
              </thead>

              <tbody>
                {ordens.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-10 text-center text-slate-400"
                    >
                      Nenhuma OS encontrada para esta máquina.
                    </td>
                  </tr>
                ) : (
                  ordens.map((os) => (
                    <tr
                      key={os.id}
                      className="border-t border-white/10 bg-[#080d1f]"
                    >
                      <td className="px-4 py-3 font-black">
                        #{os.numero}
                      </td>

                      <td className="max-w-[350px] px-4 py-3">
                        <p className="line-clamp-2 font-semibold">
                          {os.descricao}
                        </p>
                      </td>

                      <td className="px-4 py-3 font-bold">
                        {statusLabel(os.status)}
                      </td>

                      <td className="px-4 py-3 font-bold">
                        {prioridadeLabel(os.prioridade)}
                      </td>

                      <td className="px-4 py-3">
                        {formatDate(os.createdAt)}
                      </td>

                      <td className="px-4 py-3">
                        {os.status === "CONCLUIDA"
                          ? formatDate(
                              os.dataConclusao ?? os.updatedAt
                            )
                          : "-"}
                      </td>

                      <td className="px-4 py-3">
                        {os.responsaveis.length
                          ? os.responsaveis
                              .map(
                                (responsavel) =>
                                  responsavel.user.nome
                              )
                              .join(", ")
                          : "-"}
                      </td>

                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/os/${os.id}`}
                          className="inline-flex rounded-xl bg-cyan-400 px-4 py-2 text-xs font-black text-slate-950 transition hover:bg-cyan-300"
                        >
                          Ver OS
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

function ResumoCard({
  titulo,
  valor,
  icon,
  estilo,
}: {
  titulo: string;
  valor: number | string;
  icon: React.ReactNode;
  estilo: "cyan" | "yellow" | "orange" | "green" | "red";
}) {
  const estilos = {
    cyan: "border-cyan-400/20 bg-cyan-500/10 text-cyan-300",
    yellow: "border-yellow-400/20 bg-yellow-500/10 text-yellow-300",
    orange: "border-orange-400/20 bg-orange-500/10 text-orange-300",
    green: "border-emerald-400/20 bg-emerald-500/10 text-emerald-300",
    red: "border-red-400/20 bg-red-500/10 text-red-300",
  };

  return (
    <div
      className={`rounded-2xl border p-5 shadow-lg ${estilos[estilo]}`}
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold opacity-80">{titulo}</p>
          <p className="mt-2 text-3xl font-black">{valor}</p>
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-black/20">
          {icon}
        </div>
      </div>
    </div>
  );
}

function BarraStatus({
  label,
  value,
  total,
  classe,
}: {
  label: string;
  value: number;
  total: number;
  classe: string;
}) {
  const percentual =
    total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-sm font-bold text-slate-300">
          {label}
        </span>

        <span className="text-sm font-black text-white">
          {value} ({percentual}%)
        </span>
      </div>

      <div className="h-3 overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full ${classe}`}
          style={{
            width: `${percentual}%`,
          }}
        />
      </div>
    </div>
  );
}