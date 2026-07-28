"use client";

import type { FormEvent, ReactNode } from "react";
import { useMemo, useRef, useState } from "react";
import {
  BarChart3,
  Building2,
  CalendarDays,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  RotateCcw,
  Search,
  TrendingUp,
  UserRound,
  Users,
  Wrench,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Colaborador = {
  id: string;
  nome: string;
};

type Setor = {
  id: string;
  nome: string;
};

type Maquina = {
  id: string;
  nome: string;
  setorId: string;
};

type Relatorio = {
  id: string;
  numero: number;
  titulo: string;
  status: string;
  prioridade: string;
  registroFinal: string;
  updatedAt: string;
  dataConclusao: string | null;
  setor: Setor | null;
  maquina: Maquina | null;
  responsaveis: Colaborador[];
};

type Filtros = {
  busca: string;
  dataInicio: string;
  dataFim: string;
  colaborador: string;
  setor: string;
  maquina: string;
};

type Props = {
  relatorios: Relatorio[];
  colaboradores: Colaborador[];
  setores: Setor[];
  maquinas: Maquina[];
  geradoEm: string;
};

const CORES = [
  "#22d3ee",
  "#10b981",
  "#8b5cf6",
  "#f97316",
  "#3b82f6",
  "#eab308",
  "#ec4899",
  "#14b8a6",
  "#ef4444",
  "#64748b",
];

const CORES_STATUS: Record<string, string> = {
  NAO_INICIADA: "#f97316",
  EM_ANDAMENTO: "#3b82f6",
  CONCLUIDA: "#10b981",
  CANCELADA: "#64748b",
};

const CORES_PRIORIDADE: Record<string, string> = {
  BAIXA: "#22c55e",
  MEDIA: "#eab308",
  ALTA: "#f97316",
  URGENTE: "#ef4444",
};

const STATUS_LABELS: Record<string, string> = {
  NAO_INICIADA: "Não iniciada",
  EM_ANDAMENTO: "Em andamento",
  CONCLUIDA: "Concluída",
  CANCELADA: "Cancelada",
};

const PRIORIDADE_LABELS: Record<string, string> = {
  BAIXA: "Baixa",
  MEDIA: "Média",
  ALTA: "Alta",
  URGENTE: "Urgente",
};

const inputClass =
  "h-14 w-full rounded-2xl border border-white/10 bg-[#050816] px-4 text-sm font-semibold text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20";

const tooltipStyle = {
  backgroundColor: "#080d1f",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: "14px",
  color: "#ffffff",
  boxShadow: "0 18px 45px rgba(0,0,0,0.35)",
};

function formatarData(value: string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("pt-BR").format(new Date(value));
}

function formatarDataInput(value: string) {
  if (!value) return "Todas";

  return new Intl.DateTimeFormat("pt-BR").format(
    new Date(`${value}T00:00:00`)
  );
}

function chaveMes(value: string) {
  const data = new Date(value);

  return `${data.getUTCFullYear()}-${String(
    data.getUTCMonth() + 1
  ).padStart(2, "0")}`;
}

function formatarMes(chave: string) {
  const [ano, mes] = chave.split("-").map(Number);

  return new Intl.DateTimeFormat("pt-BR", {
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  })
    .format(new Date(Date.UTC(ano, mes - 1, 1)))
    .replace(".", "");
}

export default function DashboardRelatorios({
  relatorios,
  colaboradores,
  setores,
  maquinas,
  geradoEm,
}: Props) {
  const dashboardRef = useRef<HTMLDivElement>(null);

  const filtrosVazios: Filtros = {
    busca: "",
    dataInicio: "",
    dataFim: "",
    colaborador: "",
    setor: "",
    maquina: "",
  };

  const [filtrosEdicao, setFiltrosEdicao] =
    useState<Filtros>(filtrosVazios);

  const [filtrosAplicados, setFiltrosAplicados] =
    useState<Filtros>(filtrosVazios);

  const [gerandoPDF, setGerandoPDF] = useState(false);
  const [gerandoExcel, setGerandoExcel] = useState(false);

  const maquinasDisponiveis = useMemo(() => {
    if (!filtrosEdicao.setor) return maquinas;

    return maquinas.filter(
      (maquina) => maquina.setorId === filtrosEdicao.setor
    );
  }, [filtrosEdicao.setor, maquinas]);

  const relatoriosFiltrados = useMemo(() => {
    const inicio = filtrosAplicados.dataInicio
      ? new Date(`${filtrosAplicados.dataInicio}T00:00:00`)
      : null;

    const fim = filtrosAplicados.dataFim
      ? new Date(`${filtrosAplicados.dataFim}T23:59:59`)
      : null;

    const busca = filtrosAplicados.busca
      .trim()
      .toLocaleLowerCase("pt-BR");

    return relatorios.filter((relatorio) => {
      const dataRelatorio = new Date(relatorio.updatedAt);

      if (inicio && dataRelatorio < inicio) return false;
      if (fim && dataRelatorio > fim) return false;

      if (
        filtrosAplicados.colaborador &&
        !relatorio.responsaveis.some(
          (responsavel) =>
            responsavel.id === filtrosAplicados.colaborador
        )
      ) {
        return false;
      }

      if (
        filtrosAplicados.setor &&
        relatorio.setor?.id !== filtrosAplicados.setor
      ) {
        return false;
      }

      if (
        filtrosAplicados.maquina &&
        relatorio.maquina?.id !== filtrosAplicados.maquina
      ) {
        return false;
      }

      if (busca) {
        const conteudo = [
          String(relatorio.numero),
          relatorio.titulo,
          relatorio.registroFinal,
          relatorio.setor?.nome ?? "",
          relatorio.maquina?.nome ?? "",
          relatorio.responsaveis
            .map((responsavel) => responsavel.nome)
            .join(" "),
        ]
          .join(" ")
          .toLocaleLowerCase("pt-BR");

        if (!conteudo.includes(busca)) return false;
      }

      return true;
    });
  }, [filtrosAplicados, relatorios]);

  const dadosColaboradores = useMemo(() => {
    const mapa = new Map<
      string,
      {
        colaborador: string;
        relatorios: number;
      }
    >();

    relatoriosFiltrados.forEach((relatorio) => {
      if (relatorio.responsaveis.length === 0) {
        const atual = mapa.get("sem-responsavel") ?? {
          colaborador: "Sem responsável",
          relatorios: 0,
        };

        atual.relatorios += 1;
        mapa.set("sem-responsavel", atual);
        return;
      }

      relatorio.responsaveis.forEach((responsavel) => {
        const atual = mapa.get(responsavel.id) ?? {
          colaborador: responsavel.nome,
          relatorios: 0,
        };

        atual.relatorios += 1;
        mapa.set(responsavel.id, atual);
      });
    });

    return Array.from(mapa.values()).sort(
      (a, b) => b.relatorios - a.relatorios
    );
  }, [relatoriosFiltrados]);

  const dadosSetores = useMemo(() => {
    const mapa = new Map<
      string,
      {
        setor: string;
        relatorios: number;
      }
    >();

    relatoriosFiltrados.forEach((relatorio) => {
      const id = relatorio.setor?.id ?? "sem-setor";
      const nome = relatorio.setor?.nome ?? "Sem setor";

      const atual = mapa.get(id) ?? {
        setor: nome,
        relatorios: 0,
      };

      atual.relatorios += 1;
      mapa.set(id, atual);
    });

    return Array.from(mapa.values()).sort(
      (a, b) => b.relatorios - a.relatorios
    );
  }, [relatoriosFiltrados]);

  const dadosMaquinas = useMemo(() => {
    const mapa = new Map<
      string,
      {
        maquina: string;
        relatorios: number;
      }
    >();

    relatoriosFiltrados.forEach((relatorio) => {
      if (!relatorio.maquina) return;

      const atual = mapa.get(relatorio.maquina.id) ?? {
        maquina: relatorio.maquina.nome,
        relatorios: 0,
      };

      atual.relatorios += 1;
      mapa.set(relatorio.maquina.id, atual);
    });

    return Array.from(mapa.values())
      .sort((a, b) => b.relatorios - a.relatorios)
      .slice(0, 12);
  }, [relatoriosFiltrados]);

  const dadosEvolucao = useMemo(() => {
    const mapa = new Map<
      string,
      {
        chave: string;
        quantidade: number;
      }
    >();

    relatoriosFiltrados.forEach((relatorio) => {
      const chave = chaveMes(relatorio.updatedAt);

      const atual = mapa.get(chave) ?? {
        chave,
        quantidade: 0,
      };

      atual.quantidade += 1;
      mapa.set(chave, atual);
    });

    return Array.from(mapa.values())
      .sort((a, b) => a.chave.localeCompare(b.chave))
      .map((item) => ({
        mes: formatarMes(item.chave),
        quantidade: item.quantidade,
      }));
  }, [relatoriosFiltrados]);

  const dadosStatus = useMemo(() => {
    return Object.keys(STATUS_LABELS).map((status) => ({
      nome: STATUS_LABELS[status],
      quantidade: relatoriosFiltrados.filter(
        (relatorio) => relatorio.status === status
      ).length,
      cor: CORES_STATUS[status],
    }));
  }, [relatoriosFiltrados]);

  const dadosPrioridades = useMemo(() => {
    return Object.keys(PRIORIDADE_LABELS).map((prioridade) => ({
      nome: PRIORIDADE_LABELS[prioridade],
      quantidade: relatoriosFiltrados.filter(
        (relatorio) => relatorio.prioridade === prioridade
      ).length,
      cor: CORES_PRIORIDADE[prioridade],
    }));
  }, [relatoriosFiltrados]);

  const metricas = useMemo(() => {
    const dataReferencia = new Date(geradoEm);

    const totalMesAtual = relatoriosFiltrados.filter((relatorio) => {
      const data = new Date(relatorio.updatedAt);

      return (
        data.getMonth() === dataReferencia.getMonth() &&
        data.getFullYear() === dataReferencia.getFullYear()
      );
    }).length;

    const colaboradoresUnicos = new Set(
      relatoriosFiltrados.flatMap((relatorio) =>
        relatorio.responsaveis.map((responsavel) => responsavel.id)
      )
    ).size;

    const setoresUnicos = new Set(
      relatoriosFiltrados
        .map((relatorio) => relatorio.setor?.id)
        .filter(Boolean)
    ).size;

    const maquinasUnicas = new Set(
      relatoriosFiltrados
        .map((relatorio) => relatorio.maquina?.id)
        .filter(Boolean)
    ).size;

    return {
      total: relatoriosFiltrados.length,
      totalMesAtual,
      colaboradoresUnicos,
      setoresUnicos,
      maquinasUnicas,
    };
  }, [geradoEm, relatoriosFiltrados]);

  const resumoFiltros = useMemo(() => {
    const colaborador =
      colaboradores.find(
        (item) => item.id === filtrosAplicados.colaborador
      )?.nome ?? "Todos";

    const setor =
      setores.find((item) => item.id === filtrosAplicados.setor)
        ?.nome ?? "Todos";

    const maquina =
      maquinas.find((item) => item.id === filtrosAplicados.maquina)
        ?.nome ?? "Todas";

    return {
      busca: filtrosAplicados.busca || "Sem busca",
      colaborador,
      setor,
      maquina,
      periodo: `${formatarDataInput(
        filtrosAplicados.dataInicio
      )} até ${formatarDataInput(filtrosAplicados.dataFim)}`,
    };
  }, [
    colaboradores,
    filtrosAplicados,
    maquinas,
    setores,
  ]);

  function aplicarFiltros(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFiltrosAplicados({ ...filtrosEdicao });
  }

  function limparFiltros() {
    setFiltrosEdicao(filtrosVazios);
    setFiltrosAplicados(filtrosVazios);
  }

  async function gerarPDF() {
    if (!dashboardRef.current || gerandoPDF) return;

    try {
      setGerandoPDF(true);

      await document.fonts.ready;

      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => resolve());
        });
      });

      const [{ default: html2canvas }, { jsPDF }] =
        await Promise.all([
          import("html2canvas-pro"),
          import("jspdf"),
        ]);

      const elemento = dashboardRef.current;

      const canvas = await html2canvas(elemento, {
        scale: 1.5,
        useCORS: true,
        allowTaint: false,
        backgroundColor: "#050816",
        logging: false,
        scrollX: 0,
        scrollY: -window.scrollY,
        windowWidth: Math.max(
          document.documentElement.clientWidth,
          elemento.scrollWidth
        ),
        windowHeight: Math.max(
          document.documentElement.clientHeight,
          elemento.scrollHeight
        ),
      });

      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const larguraPagina = pdf.internal.pageSize.getWidth();
      const alturaPagina = pdf.internal.pageSize.getHeight();

      const margem = 7;
      const larguraUtil = larguraPagina - margem * 2;
      const alturaUtil = alturaPagina - margem * 2;

      const pixelsPorMilimetro = canvas.width / larguraUtil;
      const alturaPaginaEmPixels = Math.floor(
        alturaUtil * pixelsPorMilimetro
      );

      let posicaoY = 0;
      let numeroPagina = 0;

      while (posicaoY < canvas.height) {
        const alturaRecorte = Math.min(
          alturaPaginaEmPixels,
          canvas.height - posicaoY
        );

        const canvasPagina = document.createElement("canvas");

        canvasPagina.width = canvas.width;
        canvasPagina.height = alturaRecorte;

        const contexto = canvasPagina.getContext("2d");

        if (!contexto) {
          throw new Error(
            "Não foi possível preparar as páginas do PDF."
          );
        }

        contexto.fillStyle = "#050816";
        contexto.fillRect(
          0,
          0,
          canvasPagina.width,
          canvasPagina.height
        );

        contexto.drawImage(
          canvas,
          0,
          posicaoY,
          canvas.width,
          alturaRecorte,
          0,
          0,
          canvas.width,
          alturaRecorte
        );

        const imagemPagina = canvasPagina.toDataURL(
          "image/jpeg",
          0.92
        );

        const alturaImagem =
          alturaRecorte / pixelsPorMilimetro;

        if (numeroPagina > 0) {
          pdf.addPage();
        }

        pdf.addImage(
          imagemPagina,
          "JPEG",
          margem,
          margem,
          larguraUtil,
          alturaImagem,
          undefined,
          "FAST"
        );

        posicaoY += alturaRecorte;
        numeroPagina += 1;
      }

      const dataArquivo = new Date()
        .toLocaleDateString("pt-BR")
        .replaceAll("/", "-");

      pdf.save(`dashboard-relatorios-${dataArquivo}.pdf`);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);

      alert(
        error instanceof Error
          ? `Não foi possível gerar o PDF: ${error.message}`
          : "Não foi possível gerar o PDF."
      );
    } finally {
      setGerandoPDF(false);
    }
  }

  async function gerarExcel() {
    if (gerandoExcel) return;

    try {
      setGerandoExcel(true);

      const XLSX = await import("xlsx");

      const detalhes = relatoriosFiltrados.map((relatorio) => ({
        "Número da OS": relatorio.numero,
        Título: relatorio.titulo,
        Setor: relatorio.setor?.nome ?? "-",
        Máquina: relatorio.maquina?.nome ?? "-",
        Responsáveis:
          relatorio.responsaveis
            .map((responsavel) => responsavel.nome)
            .join(", ") || "-",
        Status:
          STATUS_LABELS[relatorio.status] ?? relatorio.status,
        Prioridade:
          PRIORIDADE_LABELS[relatorio.prioridade] ??
          relatorio.prioridade,
        "Data do relatório": formatarData(relatorio.updatedAt),
        Relatório: relatorio.registroFinal,
      }));

      const resumo = [
        {
          Indicador: "Total de relatórios",
          Valor: metricas.total,
        },
        {
          Indicador: "Relatórios no mês atual",
          Valor: metricas.totalMesAtual,
        },
        {
          Indicador: "Colaboradores envolvidos",
          Valor: metricas.colaboradoresUnicos,
        },
        {
          Indicador: "Setores envolvidos",
          Valor: metricas.setoresUnicos,
        },
        {
          Indicador: "Máquinas envolvidas",
          Valor: metricas.maquinasUnicas,
        },
      ];

      const planilha = XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(
        planilha,
        XLSX.utils.json_to_sheet(resumo),
        "Resumo"
      );

      XLSX.utils.book_append_sheet(
        planilha,
        XLSX.utils.json_to_sheet(detalhes),
        "Relatórios"
      );

      XLSX.utils.book_append_sheet(
        planilha,
        XLSX.utils.json_to_sheet(dadosColaboradores),
        "Por colaborador"
      );

      XLSX.utils.book_append_sheet(
        planilha,
        XLSX.utils.json_to_sheet(dadosSetores),
        "Por setor"
      );

      XLSX.utils.book_append_sheet(
        planilha,
        XLSX.utils.json_to_sheet(dadosMaquinas),
        "Por máquina"
      );

      XLSX.utils.book_append_sheet(
        planilha,
        XLSX.utils.json_to_sheet(dadosEvolucao),
        "Evolução mensal"
      );

      const dataArquivo = new Date()
        .toLocaleDateString("pt-BR")
        .replaceAll("/", "-");

      XLSX.writeFile(
        planilha,
        `dashboard-relatorios-${dataArquivo}.xlsx`
      );
    } catch (error) {
      console.error("Erro ao gerar Excel:", error);
      alert("Não foi possível gerar a planilha Excel.");
    } finally {
      setGerandoExcel(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-black/30 backdrop-blur sm:p-6">
        <form onSubmit={aplicarFiltros} className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300">
              <Filter size={21} />
            </div>

            <div>
              <h2 className="text-xl font-black">
                Filtros do dashboard
              </h2>

              <p className="text-sm text-slate-400">
                Os indicadores e gráficos serão recalculados.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <CampoFiltro
              label="Pesquisar"
              icon={<Search size={16} />}
            >
              <input
                value={filtrosEdicao.busca}
                onChange={(event) =>
                  setFiltrosEdicao((anterior) => ({
                    ...anterior,
                    busca: event.target.value,
                  }))
                }
                placeholder="Número, título ou relatório..."
                className={inputClass}
              />
            </CampoFiltro>

            <CampoFiltro
              label="Data inicial"
              icon={<CalendarDays size={16} />}
            >
              <input
                type="date"
                value={filtrosEdicao.dataInicio}
                onChange={(event) =>
                  setFiltrosEdicao((anterior) => ({
                    ...anterior,
                    dataInicio: event.target.value,
                  }))
                }
                className={inputClass}
              />
            </CampoFiltro>

            <CampoFiltro
              label="Data final"
              icon={<CalendarDays size={16} />}
            >
              <input
                type="date"
                value={filtrosEdicao.dataFim}
                onChange={(event) =>
                  setFiltrosEdicao((anterior) => ({
                    ...anterior,
                    dataFim: event.target.value,
                  }))
                }
                className={inputClass}
              />
            </CampoFiltro>

            <CampoFiltro
              label="Colaborador"
              icon={<UserRound size={16} />}
            >
              <select
                value={filtrosEdicao.colaborador}
                onChange={(event) =>
                  setFiltrosEdicao((anterior) => ({
                    ...anterior,
                    colaborador: event.target.value,
                  }))
                }
                className={inputClass}
              >
                <option value="">Todos os colaboradores</option>

                {colaboradores.map((colaborador) => (
                  <option
                    key={colaborador.id}
                    value={colaborador.id}
                  >
                    {colaborador.nome}
                  </option>
                ))}
              </select>
            </CampoFiltro>

            <CampoFiltro
              label="Setor"
              icon={<Building2 size={16} />}
            >
              <select
                value={filtrosEdicao.setor}
                onChange={(event) =>
                  setFiltrosEdicao((anterior) => ({
                    ...anterior,
                    setor: event.target.value,
                    maquina: "",
                  }))
                }
                className={inputClass}
              >
                <option value="">Todos os setores</option>

                {setores.map((setor) => (
                  <option key={setor.id} value={setor.id}>
                    {setor.nome}
                  </option>
                ))}
              </select>
            </CampoFiltro>

            <CampoFiltro
              label="Máquina"
              icon={<Wrench size={16} />}
            >
              <select
                value={filtrosEdicao.maquina}
                onChange={(event) =>
                  setFiltrosEdicao((anterior) => ({
                    ...anterior,
                    maquina: event.target.value,
                  }))
                }
                className={inputClass}
              >
                <option value="">Todas as máquinas</option>

                {maquinasDisponiveis.map((maquina) => (
                  <option
                    key={maquina.id}
                    value={maquina.id}
                  >
                    {maquina.nome}
                  </option>
                ))}
              </select>
            </CampoFiltro>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <button
              type="submit"
              className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-5 text-sm font-black text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-300"
            >
              <Filter size={17} />
              Aplicar filtros
            </button>

            <button
              type="button"
              onClick={limparFiltros}
              className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 text-sm font-black text-white transition hover:bg-white/10"
            >
              <RotateCcw size={17} />
              Limpar filtros
            </button>

            <button
              type="button"
              onClick={gerarPDF}
              disabled={gerandoPDF}
              className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl border border-cyan-400/30 bg-cyan-400/10 px-5 text-sm font-black text-cyan-300 transition hover:bg-cyan-400/20 disabled:opacity-60"
            >
              <Download size={17} />
              {gerandoPDF ? "Gerando PDF..." : "Gerar PDF"}
            </button>

            <button
              type="button"
              onClick={gerarExcel}
              disabled={gerandoExcel}
              className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-5 text-sm font-black text-emerald-300 transition hover:bg-emerald-400/20 disabled:opacity-60"
            >
              <FileSpreadsheet size={17} />
              {gerandoExcel ? "Gerando Excel..." : "Gerar Excel"}
            </button>
          </div>
        </form>
      </section>

      <div ref={dashboardRef} className="space-y-6 bg-[#050816]">
        <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-cyan-400/10 via-white/[0.04] to-blue-500/10 p-5 sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-300">
                Sistema de manutenção
              </p>

              <h2 className="mt-2 text-2xl font-black sm:text-3xl">
                Relatório geral dos documentos
              </h2>

              <p className="mt-2 text-sm text-slate-400">
                Gerado em{" "}
                {new Intl.DateTimeFormat("pt-BR", {
                  dateStyle: "short",
                  timeStyle: "short",
                }).format(new Date(geradoEm))}
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 lg:max-w-3xl lg:grid-cols-3">
              <ResumoFiltro
                label="Período"
                value={resumoFiltros.periodo}
              />

              <ResumoFiltro
                label="Colaborador"
                value={resumoFiltros.colaborador}
              />

              <ResumoFiltro
                label="Setor"
                value={resumoFiltros.setor}
              />

              <ResumoFiltro
                label="Máquina"
                value={resumoFiltros.maquina}
              />

              <ResumoFiltro
                label="Pesquisa"
                value={resumoFiltros.busca}
              />
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <CardMetrica
            titulo="Total de relatórios"
            valor={metricas.total}
            descricao="Documentos encontrados"
            icon={<FileText size={23} />}
          />

          <CardMetrica
            titulo="Relatórios neste mês"
            valor={metricas.totalMesAtual}
            descricao="Registros no mês atual"
            icon={<CalendarDays size={23} />}
          />

          <CardMetrica
            titulo="Colaboradores"
            valor={metricas.colaboradoresUnicos}
            descricao="Profissionais envolvidos"
            icon={<Users size={23} />}
          />

          <CardMetrica
            titulo="Setores"
            valor={metricas.setoresUnicos}
            descricao="Setores com relatórios"
            icon={<Building2 size={23} />}
          />

          <CardMetrica
            titulo="Máquinas"
            valor={metricas.maquinasUnicas}
            descricao="Equipamentos registrados"
            icon={<Wrench size={23} />}
          />

          <CardMetrica
            titulo="Maior responsável"
            valor={
              dadosColaboradores[0]?.colaborador ?? "-"
            }
            descricao={
              dadosColaboradores[0]
                ? `${dadosColaboradores[0].relatorios} relatórios vinculados`
                : "Nenhum dado"
            }
            icon={<TrendingUp size={23} />}
          />
        </section>

        {relatoriosFiltrados.length === 0 ? (
          <section className="rounded-3xl border border-dashed border-white/10 bg-white/[0.03] px-6 py-20 text-center">
            <BarChart3
              size={44}
              className="mx-auto text-slate-600"
            />

            <h2 className="mt-4 text-xl font-black">
              Nenhum relatório encontrado
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              Altere os filtros para visualizar os gráficos.
            </p>
          </section>
        ) : (
          <>
            <CardGrafico
              titulo="Evolução mensal dos relatórios"
              descricao="Quantidade de relatórios registrados em cada mês."
              icon={<TrendingUp size={21} />}
            >
              <ResponsiveContainer width="100%" height={370}>
                <LineChart data={dadosEvolucao}>
                  <CartesianGrid
                    stroke="rgba(255,255,255,0.08)"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="mes"
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <Tooltip contentStyle={tooltipStyle} />

                  <Line
                    type="monotone"
                    dataKey="quantidade"
                    name="Relatórios"
                    stroke="#22d3ee"
                    strokeWidth={4}
                    dot={{
                      r: 5,
                      fill: "#22d3ee",
                    }}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardGrafico>

            <section className="grid gap-6 xl:grid-cols-2">
              <CardGrafico
                titulo="Relatórios por colaborador"
                descricao="Um relatório pode aparecer para mais de um responsável."
                icon={<Users size={21} />}
              >
                <ResponsiveContainer width="100%" height={420}>
                  <BarChart
                    data={dadosColaboradores.slice(0, 12)}
                    layout="vertical"
                    margin={{
                      top: 5,
                      right: 20,
                      left: 55,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid
                      stroke="rgba(255,255,255,0.08)"
                      horizontal={false}
                    />

                    <XAxis
                      type="number"
                      allowDecimals={false}
                      tick={{
                        fill: "#94a3b8",
                        fontSize: 11,
                      }}
                      axisLine={false}
                      tickLine={false}
                    />

                    <YAxis
                      type="category"
                      dataKey="colaborador"
                      width={145}
                      tick={{
                        fill: "#cbd5e1",
                        fontSize: 11,
                      }}
                      axisLine={false}
                      tickLine={false}
                    />

                    <Tooltip
                      contentStyle={tooltipStyle}
                      cursor={{
                        fill: "rgba(255,255,255,0.04)",
                      }}
                    />

                    <Bar
                      dataKey="relatorios"
                      name="Relatórios"
                      fill="#22d3ee"
                      radius={[0, 9, 9, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardGrafico>

              <CardGrafico
                titulo="Relatórios por setor"
                descricao="Setores com maior volume de documentos."
                icon={<Building2 size={21} />}
              >
                <ResponsiveContainer width="100%" height={420}>
                  <BarChart
                    data={dadosSetores.slice(0, 12)}
                    layout="vertical"
                    margin={{
                      top: 5,
                      right: 20,
                      left: 55,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid
                      stroke="rgba(255,255,255,0.08)"
                      horizontal={false}
                    />

                    <XAxis
                      type="number"
                      allowDecimals={false}
                      tick={{
                        fill: "#94a3b8",
                        fontSize: 11,
                      }}
                      axisLine={false}
                      tickLine={false}
                    />

                    <YAxis
                      type="category"
                      dataKey="setor"
                      width={145}
                      tick={{
                        fill: "#cbd5e1",
                        fontSize: 11,
                      }}
                      axisLine={false}
                      tickLine={false}
                    />

                    <Tooltip
                      contentStyle={tooltipStyle}
                      cursor={{
                        fill: "rgba(255,255,255,0.04)",
                      }}
                    />

                    <Bar
                      dataKey="relatorios"
                      name="Relatórios"
                      fill="#10b981"
                      radius={[0, 9, 9, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardGrafico>
            </section>

            <section className="grid gap-6 xl:grid-cols-2">
              <CardGrafico
                titulo="Distribuição por status"
                descricao="Situação das OS que possuem relatório."
                icon={<BarChart3 size={21} />}
              >
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={dadosStatus}
                      dataKey="quantidade"
                      nameKey="nome"
                      cx="50%"
                      cy="47%"
                      innerRadius={70}
                      outerRadius={115}
                      paddingAngle={4}
                    >
                      {dadosStatus.map((item) => (
                        <Cell
                          key={item.nome}
                          fill={item.cor}
                        />
                      ))}
                    </Pie>

                    <Tooltip
                      contentStyle={tooltipStyle}
                      itemStyle={{ color: "#ffffff" }}
                    />

                    <Legend
                      verticalAlign="bottom"
                      iconType="circle"
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardGrafico>

              <CardGrafico
                titulo="Distribuição por prioridade"
                descricao="Nível de prioridade das OS relatadas."
                icon={<FileText size={21} />}
              >
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={dadosPrioridades}
                      dataKey="quantidade"
                      nameKey="nome"
                      cx="50%"
                      cy="47%"
                      innerRadius={70}
                      outerRadius={115}
                      paddingAngle={4}
                    >
                      {dadosPrioridades.map((item) => (
                        <Cell
                          key={item.nome}
                          fill={item.cor}
                        />
                      ))}
                    </Pie>

                    <Tooltip
                      contentStyle={tooltipStyle}
                      itemStyle={{ color: "#ffffff" }}
                    />

                    <Legend
                      verticalAlign="bottom"
                      iconType="circle"
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardGrafico>
            </section>

            <CardGrafico
              titulo="Máquinas com mais relatórios"
              descricao="Equipamentos com maior quantidade de registros."
              icon={<Wrench size={21} />}
            >
              {dadosMaquinas.length === 0 ? (
                <div className="flex h-[360px] items-center justify-center rounded-2xl border border-dashed border-white/10 text-sm text-slate-500">
                  Nenhum relatório possui máquina vinculada.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart
                    data={dadosMaquinas}
                    layout="vertical"
                    margin={{
                      top: 5,
                      right: 20,
                      left: 70,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid
                      stroke="rgba(255,255,255,0.08)"
                      horizontal={false}
                    />

                    <XAxis
                      type="number"
                      allowDecimals={false}
                      tick={{
                        fill: "#94a3b8",
                        fontSize: 11,
                      }}
                      axisLine={false}
                      tickLine={false}
                    />

                    <YAxis
                      type="category"
                      dataKey="maquina"
                      width={180}
                      tick={{
                        fill: "#cbd5e1",
                        fontSize: 11,
                      }}
                      axisLine={false}
                      tickLine={false}
                    />

                    <Tooltip
                      contentStyle={tooltipStyle}
                      cursor={{
                        fill: "rgba(255,255,255,0.04)",
                      }}
                    />

                    <Bar
                      dataKey="relatorios"
                      name="Relatórios"
                      fill="#8b5cf6"
                      radius={[0, 9, 9, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardGrafico>
          </>
        )}
      </div>

      <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/25">
        <div className="border-b border-white/10 p-5 sm:p-6">
          <h2 className="text-xl font-black">
            Dados detalhados
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            {relatoriosFiltrados.length} relatório(s) encontrado(s).
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[1100px] w-full">
            <thead className="bg-cyan-400 text-slate-950">
              <tr>
                <th className="px-4 py-4 text-left text-xs font-black uppercase">
                  OS
                </th>

                <th className="px-4 py-4 text-left text-xs font-black uppercase">
                  Título
                </th>

                <th className="px-4 py-4 text-left text-xs font-black uppercase">
                  Setor
                </th>

                <th className="px-4 py-4 text-left text-xs font-black uppercase">
                  Máquina
                </th>

                <th className="px-4 py-4 text-left text-xs font-black uppercase">
                  Responsáveis
                </th>

                <th className="px-4 py-4 text-left text-xs font-black uppercase">
                  Data
                </th>

                <th className="px-4 py-4 text-left text-xs font-black uppercase">
                  Relatório
                </th>
              </tr>
            </thead>

            <tbody>
              {relatoriosFiltrados.map((relatorio) => (
                <tr
                  key={relatorio.id}
                  className="border-t border-white/10 transition hover:bg-white/[0.04]"
                >
                  <td className="px-4 py-4 text-sm font-black text-cyan-300">
                    #{relatorio.numero}
                  </td>

                  <td className="max-w-[220px] px-4 py-4 text-sm font-bold text-white">
                    {relatorio.titulo}
                  </td>

                  <td className="px-4 py-4 text-sm text-slate-300">
                    {relatorio.setor?.nome ?? "-"}
                  </td>

                  <td className="px-4 py-4 text-sm text-slate-300">
                    {relatorio.maquina?.nome ?? "-"}
                  </td>

                  <td className="max-w-[230px] px-4 py-4 text-sm text-slate-300">
                    {relatorio.responsaveis
                      .map((responsavel) => responsavel.nome)
                      .join(", ") || "-"}
                  </td>

                  <td className="px-4 py-4 text-sm text-slate-300">
                    {formatarData(relatorio.updatedAt)}
                  </td>

                  <td className="max-w-[360px] px-4 py-4 text-sm leading-relaxed text-slate-300">
                    <p className="line-clamp-3 whitespace-pre-line">
                      {relatorio.registroFinal}
                    </p>
                  </td>
                </tr>
              ))}

              {relatoriosFiltrados.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-sm text-slate-500"
                  >
                    Nenhum relatório encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function CampoFiltro({
  label,
  icon,
  children,
}: {
  label: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-400">
        {icon}
        {label}
      </label>

      {children}
    </div>
  );
}

function ResumoFiltro({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#050816]/80 px-3 py-2">
      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="mt-1 break-words text-xs font-black text-white">
        {value}
      </p>
    </div>
  );
}

function CardMetrica({
  titulo,
  valor,
  descricao,
  icon,
}: {
  titulo: string;
  valor: number | string;
  descricao: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-[#080d1f] p-5 shadow-xl shadow-black/20">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-400">
            {titulo}
          </p>

          <p className="mt-3 break-words text-3xl font-black text-white">
            {valor}
          </p>

          <p className="mt-2 text-xs font-medium text-slate-500">
            {descricao}
          </p>
        </div>

        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
          {icon}
        </div>
      </div>
    </div>
  );
}

function CardGrafico({
  titulo,
  descricao,
  icon,
  children,
}: {
  titulo: string;
  descricao: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="min-w-0 rounded-3xl border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-black/25 sm:p-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
          {icon}
        </div>

        <div className="min-w-0">
          <h2 className="break-words text-xl font-black">
            {titulo}
          </h2>

          <p className="break-words text-sm text-slate-400">
            {descricao}
          </p>
        </div>
      </div>

      <div className="min-w-0">{children}</div>
    </section>
  );
}