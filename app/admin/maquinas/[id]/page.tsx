import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Cpu,
  Gauge,
  Search,
  Timer,
  XCircle,
} from "lucide-react";
import { prisma } from "@/src/lib/prisma";
import BotaoPDFMaquina from "@/components/BotaoPDFMaquina";
import BotaoExcelMaquina from "./BotaoExcelMaquina";
import GraficosMaquina from "./GraficosMaquina";

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

function formatDateTime(date: Date | string | null | undefined) {
  if (!date) return "-";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(date));
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

function formatarHoras(valor: number) {
  if (!Number.isFinite(valor) || valor <= 0) return "0h";

  const horas = Math.floor(valor);
  const minutos = Math.round((valor - horas) * 60);

  if (horas === 0) return `${minutos}min`;
  if (minutos === 0) return `${horas}h`;

  return `${horas}h ${minutos}min`;
}

function obterDuracaoExecucaoMinutos(os: {
  duracaoExecucaoMinutos: number | null;
  registroFinal: string | null;
}) {
  if (
    typeof os.duracaoExecucaoMinutos === "number" &&
    os.duracaoExecucaoMinutos > 0
  ) {
    return os.duracaoExecucaoMinutos;
  }

  const relatorio = os.registroFinal ?? "";

  const dataInicio =
    relatorio.match(
      /Data de início:\s*\n?\s*(\d{4}-\d{2}-\d{2})/i
    )?.[1] ?? "";

  const horaInicio =
    relatorio.match(
      /Hora de início:\s*\n?\s*([0-2]\d:[0-5]\d)/i
    )?.[1] ?? "";

  const dataTermino =
    relatorio.match(
      /Data de término:\s*\n?\s*(\d{4}-\d{2}-\d{2})/i
    )?.[1] ?? "";

  const horaTermino =
    relatorio.match(
      /Hora de término:\s*\n?\s*([0-2]\d:[0-5]\d)/i
    )?.[1] ?? "";

  if (
    !dataInicio ||
    !horaInicio ||
    !dataTermino ||
    !horaTermino
  ) {
    return null;
  }

  const inicio = new Date(
    `${dataInicio}T${horaInicio}:00-03:00`
  );

  const fim = new Date(
    `${dataTermino}T${horaTermino}:00-03:00`
  );

  if (
    Number.isNaN(inicio.getTime()) ||
    Number.isNaN(fim.getTime()) ||
    fim.getTime() <= inicio.getTime()
  ) {
    return null;
  }

  return Math.round(
    (fim.getTime() - inicio.getTime()) / 60000
  );
}

function dateToInput(date: Date) {
  const ano = date.getFullYear();
  const mes = String(date.getMonth() + 1).padStart(2, "0");
  const dia = String(date.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function criarHrefPeriodo(id: string, dias: number | "ano") {
  const fim = new Date();
  const inicio = new Date();

  if (dias === "ano") {
    inicio.setMonth(0, 1);
  } else {
    inicio.setDate(inicio.getDate() - (dias - 1));
  }

  return `/admin/maquinas/${id}?dataInicio=${dateToInput(
    inicio
  )}&dataFim=${dateToInput(fim)}`;
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

  const duracoesExecucaoReal = ordens
    .map((os) => obterDuracaoExecucaoMinutos(os))
    .filter(
      (duracao): duracao is number =>
        typeof duracao === "number" && duracao > 0
    );

  const totalMinutosExecucaoReal =
    duracoesExecucaoReal.reduce(
      (acumulado, duracao) =>
        acumulado + duracao,
      0
    );

  const tempoMedioExecucaoRealHoras =
    duracoesExecucaoReal.length > 0
      ? totalMinutosExecucaoReal /
        duracoesExecucaoReal.length /
        60
      : 0;

  const agora = new Date();
  const inicioMesAtual = new Date(
    agora.getFullYear(),
    agora.getMonth(),
    1
  );
  const inicioMesAnterior = new Date(
    agora.getFullYear(),
    agora.getMonth() - 1,
    1
  );
  const fimMesAnterior = new Date(
    agora.getFullYear(),
    agora.getMonth(),
    0,
    23,
    59,
    59
  );

  const totalMesAtual = ordens.filter((os) => {
    const criadaEm = new Date(os.createdAt);
    return criadaEm >= inicioMesAtual;
  }).length;

  const totalMesAnterior = ordens.filter((os) => {
    const criadaEm = new Date(os.createdAt);

    return (
      criadaEm >= inicioMesAnterior &&
      criadaEm <= fimMesAnterior
    );
  }).length;

  const variacaoMensal =
    totalMesAnterior > 0
      ? Math.round(
          ((totalMesAtual - totalMesAnterior) / totalMesAnterior) * 100
        )
      : totalMesAtual > 0
        ? 100
        : 0;

  const dadosMensais = Array.from({ length: 12 }).map((_, index) => {
    const data = new Date();
    data.setDate(1);
    data.setMonth(data.getMonth() - (11 - index));

    const mes = data.getMonth();
    const ano = data.getFullYear();

    const ordensMes = ordens.filter((os) => {
      const criadaEm = new Date(os.createdAt);

      return (
        criadaEm.getMonth() === mes &&
        criadaEm.getFullYear() === ano
      );
    });

    return {
      label: new Intl.DateTimeFormat("pt-BR", {
        month: "short",
      })
        .format(data)
        .replace(".", ""),
      ano: String(ano).slice(-2),
      quantidade: ordensMes.length,
      concluidas: ordensMes.filter(
        (os) => os.status === "CONCLUIDA"
      ).length,
      abertas: ordensMes.filter(
        (os) =>
          os.status === "NAO_INICIADA" ||
          os.status === "EM_ANDAMENTO"
      ).length,
    };
  });

  const dadosPrioridade = [
    {
      label: "Urgente",
      valor: ordens.filter((os) => os.prioridade === "URGENTE").length,
      cor: "#f87171",
    },
    {
      label: "Alta",
      valor: ordens.filter((os) => os.prioridade === "ALTA").length,
      cor: "#fb923c",
    },
    {
      label: "Média",
      valor: ordens.filter((os) => os.prioridade === "MEDIA").length,
      cor: "#facc15",
    },
    {
      label: "Baixa",
      valor: ordens.filter((os) => os.prioridade === "BAIXA").length,
      cor: "#34d399",
    },
  ];

  const diasSemana = [
    { indice: 1, label: "Seg" },
    { indice: 2, label: "Ter" },
    { indice: 3, label: "Qua" },
    { indice: 4, label: "Qui" },
    { indice: 5, label: "Sex" },
    { indice: 6, label: "Sáb" },
    { indice: 0, label: "Dom" },
  ];

  const dadosSemana = diasSemana.map((dia) => ({
    label: dia.label,
    valor: ordens.filter(
      (os) => new Date(os.createdAt).getDay() === dia.indice
    ).length,
  }));

  const ultimaOS = ordens[0] ?? null;

  const dadosExcel = ordens.map((os) => ({
    numero: os.numero,
    setor: maquina.setor.nome,
    maquina: maquina.nome,
    descricao: os.descricao,
    status: statusLabel(os.status),
    prioridade: prioridadeLabel(os.prioridade),
    criadaEm: formatDateTime(os.createdAt),
    concluidaEm:
      os.status === "CONCLUIDA"
        ? formatDateTime(os.dataConclusao ?? os.updatedAt)
        : "-",
    responsavel: os.responsaveis.length
      ? os.responsaveis
          .map((responsavel) => responsavel.user.nome)
          .join(", ")
      : "-",
  }));

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#050816] px-3 py-6 text-white sm:px-4 md:px-8 lg:px-10">
      <div className="mx-auto w-full max-w-[1600px] space-y-6">
        <header className="flex flex-col gap-5 border-b border-white/10 pb-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10 text-cyan-300 shadow-lg shadow-cyan-950/30">
              <Cpu size={27} />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-bold text-cyan-300">
                Dashboard da máquina
              </p>

              <h1 className="break-words text-3xl font-black sm:text-4xl">
                {maquina.nome}
              </h1>

              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-400">
                <span>Setor: {maquina.setor.nome}</span>

                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-black ${
                    maquina.ativo
                      ? "bg-emerald-500/15 text-emerald-300"
                      : "bg-red-500/15 text-red-300"
                  }`}
                >
                  {maquina.ativo ? "Máquina ativa" : "Máquina inativa"}
                </span>
              </div>
            </div>
          </div>

          <div className="grid w-full gap-3 sm:grid-cols-3 lg:flex lg:w-auto">
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

            <BotaoExcelMaquina
              maquina={maquina.nome}
              setor={maquina.setor.nome}
              periodoInicio={dataInicioFiltro}
              periodoFim={dataFimFiltro}
              total={total}
              naoIniciadas={naoIniciadas}
              emAndamento={emAndamento}
              concluidas={concluidas}
              canceladas={canceladas}
              taxaResolucao={taxaResolucao}
              tempoMedio={formatarHoras(tempoMedioHoras)}
              ordens={dadosExcel}
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

        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-black/30 backdrop-blur sm:p-6">
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
                className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-5 text-sm font-black text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-300"
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

          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/10 pt-4">
            <span className="mr-1 text-xs font-bold uppercase tracking-wide text-slate-500">
              Períodos rápidos
            </span>

            <Link
              href={criarHrefPeriodo(maquina.id, 7)}
              className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold text-slate-300 transition hover:border-cyan-400/30 hover:text-cyan-300"
            >
              7 dias
            </Link>

            <Link
              href={criarHrefPeriodo(maquina.id, 30)}
              className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold text-slate-300 transition hover:border-cyan-400/30 hover:text-cyan-300"
            >
              30 dias
            </Link>

            <Link
              href={criarHrefPeriodo(maquina.id, 90)}
              className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold text-slate-300 transition hover:border-cyan-400/30 hover:text-cyan-300"
            >
              90 dias
            </Link>

            <Link
              href={criarHrefPeriodo(maquina.id, "ano")}
              className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold text-slate-300 transition hover:border-cyan-400/30 hover:text-cyan-300"
            >
              Este ano
            </Link>

            <span className="ml-auto text-xs font-semibold text-slate-500">
              {dataInicioFiltro || dataFimFiltro
                ? `Filtro: ${dataInicioFiltro || "início"} até ${
                    dataFimFiltro || "hoje"
                  }`
                : "Exibindo todos os registros"}
            </span>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <ResumoCard
            titulo="Total de OS"
            valor={total}
            descricao={`${totalMesAtual} criada(s) neste mês`}
            detalhe={
              variacaoMensal === 0
                ? "Sem variação"
                : `${variacaoMensal > 0 ? "+" : ""}${variacaoMensal}% vs. mês anterior`
            }
            icon={<BarChart3 size={21} />}
            estilo="cyan"
          />

          <ResumoCard
            titulo="Não iniciadas"
            valor={naoIniciadas}
            descricao="Aguardando início"
            progresso={total > 0 ? (naoIniciadas / total) * 100 : 0}
            icon={<AlertTriangle size={21} />}
            estilo="yellow"
          />

          <ResumoCard
            titulo="Em andamento"
            valor={emAndamento}
            descricao="Em execução agora"
            progresso={total > 0 ? (emAndamento / total) * 100 : 0}
            icon={<Activity size={21} />}
            estilo="orange"
          />

          <ResumoCard
            titulo="Concluídas"
            valor={concluidas}
            descricao={`${taxaResolucao}% do total`}
            progresso={taxaResolucao}
            icon={<CheckCircle2 size={21} />}
            estilo="green"
          />

          <ResumoCard
            titulo="Canceladas"
            valor={canceladas}
            descricao="Encerradas sem conclusão"
            progresso={total > 0 ? (canceladas / total) * 100 : 0}
            icon={<XCircle size={21} />}
            estilo="red"
          />

          <ResumoCard
            titulo="OS abertas"
            valor={abertas}
            descricao="Backlog atual da máquina"
            progresso={total > 0 ? (abertas / total) * 100 : 0}
            icon={<AlertTriangle size={21} />}
            estilo="orange"
          />

          <ResumoCard
            titulo="Taxa de resolução"
            valor={`${taxaResolucao}%`}
            descricao="Concluídas sobre o total"
            progresso={taxaResolucao}
            icon={<Gauge size={21} />}
            estilo="green"
          />

          <ResumoCard
            titulo="Tempo médio total"
            valor={formatarHoras(tempoMedioHoras)}
            descricao="Da abertura à conclusão"
            detalhe={
              ultimaOS
                ? `Última OS: #${ultimaOS.numero} em ${formatDate(
                    ultimaOS.createdAt
                  )}`
                : "Nenhuma OS registrada"
            }
            icon={<Clock3 size={21} />}
            estilo="cyan"
          />

          <ResumoCard
            titulo="Tempo médio em manutenção"
            valor={formatarHoras(
              tempoMedioExecucaoRealHoras
            )}
            descricao="Tempo real informado no relatório"
            detalhe={
              duracoesExecucaoReal.length > 0
                ? `Baseado em ${duracoesExecucaoReal.length} relatório(s) válido(s)`
                : "Nenhum relatório com duração válida"
            }
            icon={<Timer size={21} />}
            estilo="green"
          />
        </section>

        <GraficosMaquina
          status={{
            naoIniciadas,
            emAndamento,
            concluidas,
            canceladas,
          }}
          taxaResolucao={taxaResolucao}
          dadosMensais={dadosMensais}
          dadosPrioridade={dadosPrioridade}
          dadosSemana={dadosSemana}
        />

        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-black/30 sm:p-6">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-black">
                Histórico de ordens de serviço
              </h2>

              <p className="text-sm text-slate-400">
                Todas as OS da máquina no período selecionado.
              </p>
            </div>

            <span className="rounded-xl border border-white/10 bg-[#050816] px-3 py-2 text-xs font-bold text-slate-400">
              {ordens.length} registro(s)
            </span>
          </div>

          <div className="w-full overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full min-w-[1120px] border-collapse text-sm">
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
                      className="px-4 py-12 text-center text-slate-400"
                    >
                      Nenhuma OS encontrada para esta máquina.
                    </td>
                  </tr>
                ) : (
                  ordens.map((os, index) => (
                    <tr
                      key={os.id}
                      className={`border-t border-white/10 transition hover:bg-cyan-400/[0.05] ${
                        index % 2 === 0
                          ? "bg-[#080d1f]"
                          : "bg-[#060a18]"
                      }`}
                    >
                      <td className="px-4 py-4 font-black text-cyan-300">
                        #{os.numero}
                      </td>

                      <td className="max-w-[380px] px-4 py-4">
                        <p className="line-clamp-2 font-semibold text-slate-200">
                          {os.descricao}
                        </p>
                      </td>

                      <td className="px-4 py-4">
                        <StatusBadge status={os.status} />
                      </td>

                      <td className="px-4 py-4">
                        <PrioridadeBadge prioridade={os.prioridade} />
                      </td>

                      <td className="px-4 py-4 text-slate-300">
                        {formatDate(os.createdAt)}
                      </td>

                      <td className="px-4 py-4 text-slate-300">
                        {os.status === "CONCLUIDA"
                          ? formatDate(
                              os.dataConclusao ?? os.updatedAt
                            )
                          : "-"}
                      </td>

                      <td className="px-4 py-4 text-slate-300">
                        {os.responsaveis.length
                          ? os.responsaveis
                              .map(
                                (responsavel) =>
                                  responsavel.user.nome
                              )
                              .join(", ")
                          : "-"}
                      </td>

                      <td className="px-4 py-4">
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
  descricao,
  detalhe,
  progresso,
  icon,
  estilo,
}: {
  titulo: string;
  valor: number | string;
  descricao: string;
  detalhe?: string;
  progresso?: number;
  icon: ReactNode;
  estilo: "cyan" | "yellow" | "orange" | "green" | "red";
}) {
  const estilos = {
    cyan: {
      container:
        "border-cyan-400/20 bg-gradient-to-br from-cyan-500/15 to-cyan-500/[0.04] text-cyan-300",
      barra: "bg-cyan-400",
    },
    yellow: {
      container:
        "border-yellow-400/20 bg-gradient-to-br from-yellow-500/15 to-yellow-500/[0.04] text-yellow-300",
      barra: "bg-yellow-400",
    },
    orange: {
      container:
        "border-orange-400/20 bg-gradient-to-br from-orange-500/15 to-orange-500/[0.04] text-orange-300",
      barra: "bg-orange-400",
    },
    green: {
      container:
        "border-emerald-400/20 bg-gradient-to-br from-emerald-500/15 to-emerald-500/[0.04] text-emerald-300",
      barra: "bg-emerald-400",
    },
    red: {
      container:
        "border-red-400/20 bg-gradient-to-br from-red-500/15 to-red-500/[0.04] text-red-300",
      barra: "bg-red-400",
    },
  };

  return (
    <div
      className={`rounded-3xl border p-5 shadow-xl shadow-black/10 ${estilos[estilo].container}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-bold opacity-80">{titulo}</p>
          <p className="mt-2 break-words text-3xl font-black">{valor}</p>
          <p className="mt-1 text-xs font-semibold text-slate-400">
            {descricao}
          </p>
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-black/20">
          {icon}
        </div>
      </div>

      {typeof progresso === "number" && (
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className={`h-full rounded-full ${estilos[estilo].barra}`}
            style={{
              width: `${Math.min(100, Math.max(0, progresso))}%`,
            }}
          />
        </div>
      )}

      {detalhe && (
        <p className="mt-3 border-t border-white/10 pt-3 text-xs font-bold text-slate-400">
          {detalhe}
        </p>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const estilos: Record<string, string> = {
    NAO_INICIADA:
      "border-yellow-400/25 bg-yellow-500/10 text-yellow-300",
    EM_ANDAMENTO:
      "border-cyan-400/25 bg-cyan-500/10 text-cyan-300",
    CONCLUIDA:
      "border-emerald-400/25 bg-emerald-500/10 text-emerald-300",
    CANCELADA:
      "border-red-400/25 bg-red-500/10 text-red-300",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-black ${
        estilos[status] ??
        "border-white/10 bg-white/5 text-slate-300"
      }`}
    >
      {statusLabel(status)}
    </span>
  );
}

function PrioridadeBadge({ prioridade }: { prioridade: string }) {
  const estilos: Record<string, string> = {
    BAIXA:
      "border-emerald-400/25 bg-emerald-500/10 text-emerald-300",
    MEDIA:
      "border-yellow-400/25 bg-yellow-500/10 text-yellow-300",
    ALTA:
      "border-orange-400/25 bg-orange-500/10 text-orange-300",
    URGENTE:
      "border-red-400/25 bg-red-500/10 text-red-300",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-black ${
        estilos[prioridade] ??
        "border-white/10 bg-white/5 text-slate-300"
      }`}
    >
      {prioridadeLabel(prioridade)}
    </span>
  );
}