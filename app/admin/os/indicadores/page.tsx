import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  ChartNoAxesCombined,
  ClipboardList,
} from "lucide-react";
import { Prisma, StatusOS } from "@prisma/client";
import { prisma } from "@/src/lib/prisma";
import BotaoPDFIndicadoresOS from "@/components/BotaoPDFIndicadoresOS";
import BotaoExcelIndicadoresOS from "@/components/BotaoExcelIndicadoresOS";
import FiltrosIndicadoresOS from "@/components/FiltrosIndicadoresOS";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{
    dataInicio?: string;
    dataFim?: string;
    status?: string;
    colaborador?: string;
    setor?: string;
    empresa?: string;
    maquina?: string;
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

const ORDEM_EMPRESAS: Record<string, number> = {
  SEQ: 1,
  SHA: 2,
  OCO: 3,
};

function formatDate(date: Date | string | null | undefined) {
  if (!date) return "-";

  return new Intl.DateTimeFormat("pt-BR").format(new Date(date));
}

function formatDateInput(value: string) {
  if (!value) return "Todas";

  return new Intl.DateTimeFormat("pt-BR").format(
    new Date(`${value}T00:00:00`)
  );
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    NAO_INICIADA: "Não iniciada",
    EM_ANDAMENTO: "Em andamento",
    CONCLUIDA: "Concluída",
    CANCELADA: "Cancelada",
  };

  return map[status] ?? status;
}

export default async function IndicadoresOSPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;

  const dataInicioFiltro = String(params?.dataInicio ?? "").trim();
  const dataFimFiltro = String(params?.dataFim ?? "").trim();
  const statusFiltro = String(params?.status ?? "").trim();
  const colaboradorFiltro = String(params?.colaborador ?? "").trim();
  const setorFiltro = String(params?.setor ?? "").trim();
  const empresaFiltro = String(params?.empresa ?? "").trim();
  const maquinaFiltro = String(params?.maquina ?? "").trim();

  const statusSelecionado = STATUS_OPTIONS.some(
    (item) => item.value === statusFiltro
  )
    ? (statusFiltro as StatusOS)
    : undefined;

  const dataInicio = dataInicioFiltro
    ? new Date(`${dataInicioFiltro}T00:00:00`)
    : null;

  const dataFim = dataFimFiltro
    ? new Date(`${dataFimFiltro}T23:59:59`)
    : null;

  const [
    empresasEncontradas,
    setoresEncontrados,
    maquinasEncontradas,
    colaboradoresDisponiveis,
  ] = await Promise.all([
    prisma.empresa.findMany({
      where: {
        ativo: true,
        sigla: {
          in: ["SEQ", "SHA", "OCO"],
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
        perfil: "COLABORADOR",
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

  const empresasDisponiveis = empresasEncontradas.sort(
    (empresaA, empresaB) =>
      (ORDEM_EMPRESAS[empresaA.sigla] ?? 99) -
      (ORDEM_EMPRESAS[empresaB.sigla] ?? 99)
  );

  const empresaSelecionada =
    empresasDisponiveis.find(
      (empresa) => empresa.id === empresaFiltro
    ) ?? null;

  const empresaIdFiltro = empresaSelecionada?.id ?? "";

  const setoresDisponiveis = setoresEncontrados.map((setor) => ({
    id: setor.id,
    nome: setor.nome,
    empresaId: setor.empresaId ?? "",
  }));

  const setorIdFiltro = setoresDisponiveis.some(
    (setor) =>
      setor.id === setorFiltro &&
      setor.empresaId === empresaIdFiltro
  )
    ? setorFiltro
    : "";

  const maquinasDisponiveis = maquinasEncontradas.filter((maquina) =>
    setoresDisponiveis.some(
      (setor) => setor.id === maquina.setorId
    )
  );

  const maquinaIdFiltro = maquinasDisponiveis.some(
    (maquina) =>
      maquina.id === maquinaFiltro &&
      maquina.setorId === setorIdFiltro
  )
    ? maquinaFiltro
    : "";

  const colaboradorIdFiltro = colaboradoresDisponiveis.some(
    (colaborador) => colaborador.id === colaboradorFiltro
  )
    ? colaboradorFiltro
    : "";

  const where: Prisma.OrdemServicoWhereInput = {
    ...(empresaIdFiltro
      ? {
          empresaId: empresaIdFiltro,
        }
      : {}),
    ...(dataInicio || dataFim
      ? {
          createdAt: {
            ...(dataInicio ? { gte: dataInicio } : {}),
            ...(dataFim ? { lte: dataFim } : {}),
          },
        }
      : {}),
    ...(statusSelecionado
      ? {
          status: statusSelecionado,
        }
      : {}),
    ...(setorIdFiltro
      ? {
          setorId: setorIdFiltro,
        }
      : {}),
    ...(maquinaIdFiltro
      ? {
          maquinaId: maquinaIdFiltro,
        }
      : {}),
    ...(colaboradorIdFiltro
      ? {
          responsaveis: {
            some: {
              userId: colaboradorIdFiltro,
            },
          },
        }
      : {}),
  };

  const ordens = await prisma.ordemServico.findMany({
    where,
    include: {
      empresa: true,
      setor: true,
      maquina: true,
      responsaveis: {
        include: {
          user: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  const setores = Array.from(
    new Set(ordens.map((os) => os.setor?.nome ?? "Sem setor"))
  );

  const dadosPorSetor = setores.map((setor) => {
    const ordensSetor = ordens.filter(
      (os) => (os.setor?.nome ?? "Sem setor") === setor
    );

    const concluidas = ordensSetor.filter(
      (os) => os.status === "CONCLUIDA"
    ).length;

    const pendentes = ordensSetor.filter(
      (os) =>
        os.status === "NAO_INICIADA" ||
        os.status === "EM_ANDAMENTO"
    ).length;

    const canceladas = ordensSetor.filter(
      (os) => os.status === "CANCELADA"
    ).length;

    return {
      setor,
      total: ordensSetor.length,
      concluidas,
      pendentes,
      canceladas,
    };
  });

  const maiorTotal = Math.max(
    ...dadosPorSetor.map((item) =>
      Math.max(
        item.concluidas,
        item.pendentes,
        item.canceladas
      )
    ),
    1
  );

  const totalOS = ordens.length;

  const totalConcluidas = ordens.filter(
    (os) => os.status === "CONCLUIDA"
  ).length;

  const totalPendentes = ordens.filter(
    (os) =>
      os.status === "NAO_INICIADA" ||
      os.status === "EM_ANDAMENTO"
  ).length;

  const totalCanceladas = ordens.filter(
    (os) => os.status === "CANCELADA"
  ).length;

  const setorSelecionado =
    setoresDisponiveis.find((setor) => setor.id === setorIdFiltro)
      ?.nome ?? "Todos";

  const maquinaSelecionada =
    maquinasDisponiveis.find(
      (maquina) => maquina.id === maquinaIdFiltro
    )?.nome ?? "Todas";

  const colaboradorSelecionado =
    colaboradoresDisponiveis.find(
      (colaborador) => colaborador.id === colaboradorIdFiltro
    )?.nome ?? "Todos";

  const statusSelecionadoLabel = statusSelecionado
    ? statusLabel(statusSelecionado)
    : "Todos";

  const empresaSelecionadaLabel =
    empresaSelecionada?.nome ?? "Todas";

  const ordensExportacao = ordens.map((os) => ({
    numero: os.numero,
    setor: os.setor?.nome ?? "-",
    maquina: os.maquina?.nome ?? "-",
    titulo: os.titulo,
    descricao: os.descricao?.trim() || "-",
    status: statusLabel(os.status),
    geradaEm: formatDate(os.createdAt),
    concluidaEm:
      os.status === "CONCLUIDA"
        ? formatDate(os.updatedAt)
        : "-",
    responsavel: os.responsaveis.length
      ? os.responsaveis
          .map((responsavel) => responsavel.user.nome)
          .join(", ")
      : "-",
  }));

  const filtrosExportacao = {
    dataInicio: formatDateInput(dataInicioFiltro),
    dataFim: formatDateInput(dataFimFiltro),
    status: statusSelecionadoLabel,
    colaborador: colaboradorSelecionado,
    setor: setorSelecionado,
    maquina: maquinaSelecionada,
    empresa: empresaSelecionadaLabel,
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#050816] px-3 py-6 text-white sm:px-4 md:px-10">
      <div className="mx-auto w-full max-w-[1600px] space-y-6">
        <header className="flex flex-col gap-5 border-b border-white/10 pb-6 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10 text-cyan-300">
              <BarChart3 size={26} />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-bold text-cyan-300">
                Indicadores
              </p>

              <h1 className="break-words text-3xl font-black md:text-4xl">
                Indicadores de OS
              </h1>

              <p className="break-words text-slate-400">
                Filtre os dados e visualize a planilha e os gráficos.
              </p>
            </div>
          </div>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
  <Link
    href="/admin/os/indicadores/graficos"
    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-cyan-400/30 bg-cyan-400/10 px-5 py-3 text-sm font-black text-cyan-300 transition hover:bg-cyan-400/20 sm:w-fit"
  >
    <ChartNoAxesCombined size={18} />
    Dashboard Gráfico
  </Link>

  <Link
    href="/admin"
    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white px-5 py-3 text-sm font-black text-slate-950 sm:w-fit"
  >
    <ArrowLeft size={17} />
    Voltar
  </Link>
</div>
        </header>

        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-black/30 backdrop-blur sm:p-6">
          <FiltrosIndicadoresOS
            empresas={empresasDisponiveis}
            setores={setoresDisponiveis}
            maquinas={maquinasDisponiveis}
            colaboradores={colaboradoresDisponiveis}
            filtrosIniciais={{
              dataInicio: dataInicioFiltro,
              dataFim: dataFimFiltro,
              empresa: empresaIdFiltro,
              status: statusSelecionado ?? "",
              setor: setorIdFiltro,
              maquina: maquinaIdFiltro,
              colaborador: colaboradorIdFiltro,
            }}
            acoesExportacao={
              <>
                <BotaoPDFIndicadoresOS
                  ordens={ordensExportacao}
                  filtros={filtrosExportacao}
                />

                <BotaoExcelIndicadoresOS
                  ordens={ordensExportacao}
                  filtros={filtrosExportacao}
                />
              </>
            }
          />
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <ResumoCard title="Total OS" value={totalOS} />

          <ResumoCard
            title="Concluídas"
            value={totalConcluidas}
          />

          <ResumoCard
            title="Pendentes"
            value={totalPendentes}
          />

          <ResumoCard
            title="Canceladas"
            value={totalCanceladas}
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="min-w-0 rounded-3xl border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-black/30 sm:p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300">
                <ClipboardList size={22} />
              </div>

              <div className="min-w-0">
                <h2 className="break-words text-xl font-black">
                  Planilha de OS
                </h2>

                <p className="break-words text-sm text-slate-400">
                  Todas as OS encontradas com os filtros selecionados.
                </p>
              </div>
            </div>

            <div className="w-full overflow-x-auto rounded-2xl border border-white/10">
              <table className="w-full min-w-[1550px] border-collapse text-sm">
                <thead className="bg-cyan-400 text-slate-950">
                  <tr>
                    <th className="border border-slate-900 px-3 py-3 text-left">
                      Nº
                    </th>

                    <th className="border border-slate-900 px-3 py-3 text-left">
                      Setor
                    </th>

                    <th className="border border-slate-900 px-3 py-3 text-left">
                      Máquina/equipamento
                    </th>

                    <th className="border border-slate-900 px-3 py-3 text-left">
                      Título
                    </th>

                    <th className="border border-slate-900 px-3 py-3 text-left">
                      Descrição
                    </th>

                    <th className="border border-slate-900 px-3 py-3 text-left">
                      Status
                    </th>

                    <th className="border border-slate-900 px-3 py-3 text-left">
                      Gerada em
                    </th>

                    <th className="border border-slate-900 px-3 py-3 text-left">
                      Concluída em
                    </th>

                    <th className="border border-slate-900 px-3 py-3 text-left">
                      Responsável
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {ordens.length === 0 ? (
                    <tr>
                      <td
                        colSpan={9}
                        className="px-4 py-8 text-center text-slate-400"
                      >
                        Nenhuma OS encontrada com os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    ordens.map((os) => (
                      <tr
                        key={os.id}
                        className={
                          os.status === "CONCLUIDA"
                            ? "bg-emerald-500/15"
                            : os.status === "CANCELADA"
                              ? "bg-slate-500/15"
                              : os.status === "EM_ANDAMENTO"
                                ? "bg-blue-500/15"
                                : "bg-red-500/25"
                        }
                      >
                        <td className="border border-white/10 px-3 py-3 font-black">
                          {os.numero}
                        </td>

                        <td className="border border-white/10 px-3 py-3 font-bold">
                          {os.setor?.nome ?? "-"}
                        </td>

                        <td className="border border-white/10 px-3 py-3 font-bold">
                          {os.maquina?.nome ?? "-"}
                        </td>

                        <td className="border border-white/10 px-3 py-3 font-bold">
                          {os.titulo}
                        </td>

                        <td className="min-w-[360px] whitespace-pre-wrap break-words border border-white/10 px-3 py-3 align-top text-slate-200">
                          {os.descricao?.trim() || "-"}
                        </td>

                        <td className="border border-white/10 px-3 py-3 font-black">
                          {statusLabel(os.status)}
                        </td>

                        <td className="border border-white/10 px-3 py-3">
                          {formatDate(os.createdAt)}
                        </td>

                        <td className="border border-white/10 px-3 py-3">
                          {os.status === "CONCLUIDA"
                            ? formatDate(os.updatedAt)
                            : "-"}
                        </td>

                        <td className="border border-white/10 px-3 py-3">
                          {os.responsaveis.length
                            ? os.responsaveis
                                .map(
                                  (responsavel) =>
                                    responsavel.user.nome
                                )
                                .join(", ")
                            : "-"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="min-w-0 rounded-3xl border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-black/30 sm:p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300">
                <BarChart3 size={22} />
              </div>

              <div className="min-w-0">
                <h2 className="break-words text-xl font-black">
                  OS por setor
                </h2>

                <p className="break-words text-sm text-slate-400">
                  Comparativo de concluídas, pendentes e canceladas.
                </p>
              </div>
            </div>

            <div className="space-y-5">
              {dadosPorSetor.length === 0 ? (
                <p className="text-sm text-slate-400">
                  Nenhum dado para gerar gráfico.
                </p>
              ) : (
                dadosPorSetor.map((item) => (
                  <div
                    key={item.setor}
                    className="rounded-2xl border border-white/10 bg-[#050816] p-4"
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <h3 className="break-words font-black text-white">
                        {item.setor}
                      </h3>

                      <span className="shrink-0 text-xs font-bold text-slate-400">
                        {item.total} OS
                      </span>
                    </div>

                    <GraficoLinha
                      label="Concluídas"
                      value={item.concluidas}
                      total={maiorTotal}
                      color="bg-emerald-400"
                    />

                    <GraficoLinha
                      label="Pendentes"
                      value={item.pendentes}
                      total={maiorTotal}
                      color="bg-red-500"
                    />

                    <GraficoLinha
                      label="Canceladas"
                      value={item.canceladas}
                      total={maiorTotal}
                      color="bg-slate-400"
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function ResumoCard({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#080d1f] p-5 shadow-lg">
      <p className="text-sm text-slate-400">{title}</p>

      <p className="mt-2 text-3xl font-black text-white">
        {value}
      </p>
    </div>
  );
}

function GraficoLinha({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const percent =
    total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div className="mb-3 last:mb-0">
      <div className="mb-1 flex items-center justify-between gap-3 text-xs font-bold text-slate-400">
        <span className="break-words">{label}</span>

        <span className="shrink-0">{value}</span>
      </div>

      <div className="h-3 overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full ${color}`}
          style={{
            width: `${percent}%`,
          }}
        />
      </div>
    </div>
  );
}