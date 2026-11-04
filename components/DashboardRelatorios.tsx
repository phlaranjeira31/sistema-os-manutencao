"use client";

import Link from "next/link";
import type { FormEvent, ReactNode } from "react";
import { useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
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
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
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
  temRelatorio: boolean;
  dataRelatorio: string | null;
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

  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value));
}

function formatarDataInput(value: string) {
  if (!value) return "Todas";

  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
  }).format(
    new Date(`${value}T12:00:00-03:00`)
  );
}

function chaveMes(value: string) {
  const partes =
    new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Sao_Paulo",
      year: "numeric",
      month: "2-digit",
    }).formatToParts(new Date(value));

  const ano =
    partes.find((parte) => parte.type === "year")?.value ?? "";

  const mes =
    partes.find((parte) => parte.type === "month")?.value ?? "";

  return `${ano}-${mes}`;
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
      ? new Date(
          `${filtrosAplicados.dataInicio}T00:00:00-03:00`
        )
      : null;

    const fim = filtrosAplicados.dataFim
      ? new Date(
          `${filtrosAplicados.dataFim}T23:59:59-03:00`
        )
      : null;

    const busca = filtrosAplicados.busca
      .trim()
      .toLocaleLowerCase("pt-BR");

    return relatorios.filter((relatorio) => {
      /*
       * Período oficial:
       * - relatório preenchido -> data/hora de término do relatório técnico;
       * - pendência sem relatório -> dataConclusao apenas para organizar a pendência.
       *
       * updatedAt NÃO é referência temporal de negócio.
       */
      const dataBase =
        relatorio.temRelatorio
          ? relatorio.dataRelatorio
          : relatorio.dataConclusao;

      if ((inicio || fim) && !dataBase) {
        return false;
      }

      if (dataBase) {
        const dataReferencia =
          new Date(dataBase);

        if (inicio && dataReferencia < inicio) return false;
        if (fim && dataReferencia > fim) return false;
      }

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
          relatorio.temRelatorio
            ? "com relatório"
            : "sem relatório relatório pendente",
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

  const relatoriosComDocumentoFiltrados = useMemo(
    () =>
      relatoriosFiltrados.filter(
        (relatorio) => relatorio.temRelatorio
      ),
    [relatoriosFiltrados]
  );

  const semRelatorioFiltrados = useMemo(
    () =>
      relatoriosFiltrados.filter(
        (relatorio) =>
          !relatorio.temRelatorio &&
          relatorio.status === "CONCLUIDA"
      ),
    [relatoriosFiltrados]
  );

  const dadosColaboradores = useMemo(() => {
    const mapa = new Map<
      string,
      {
        colaborador: string;
        relatorios: number;
      }
    >();

    relatoriosComDocumentoFiltrados.forEach((relatorio) => {
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
  }, [relatoriosComDocumentoFiltrados]);

  const dadosSetores = useMemo(() => {
    const mapa = new Map<
      string,
      {
        setor: string;
        relatorios: number;
      }
    >();

    relatoriosComDocumentoFiltrados.forEach((relatorio) => {
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
  }, [relatoriosComDocumentoFiltrados]);

  const dadosMaquinas = useMemo(() => {
    const mapa = new Map<
      string,
      {
        maquina: string;
        relatorios: number;
      }
    >();

    relatoriosComDocumentoFiltrados.forEach((relatorio) => {
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
  }, [relatoriosComDocumentoFiltrados]);

  const dadosEvolucao = useMemo(() => {
    /*
     * EVOLUÇÃO MENSAL DOS RELATÓRIOS
     *
     * Fonte exclusiva: dataRelatorio, extraída da Data/Hora de término
     * preenchida no registroFinal. A data em que o documento foi salvo
     * ou editado (updatedAt) não participa deste gráfico.
     */
    const referenciaFim =
      filtrosAplicados.dataFim
        ? new Date(
            `${filtrosAplicados.dataFim}T12:00:00-03:00`
          )
        : new Date(geradoEm);

    let referenciaInicio =
      filtrosAplicados.dataInicio
        ? new Date(
            `${filtrosAplicados.dataInicio}T12:00:00-03:00`
          )
        : new Date(
            referenciaFim.getFullYear(),
            referenciaFim.getMonth() - 11,
            1,
            12,
            0,
            0
          );

    referenciaInicio = new Date(
      referenciaInicio.getFullYear(),
      referenciaInicio.getMonth(),
      1,
      12,
      0,
      0
    );

    const fimMes = new Date(
      referenciaFim.getFullYear(),
      referenciaFim.getMonth(),
      1,
      12,
      0,
      0
    );

    /*
     * Proteção visual: mesmo em um período muito longo, o gráfico
     * mostra no máximo 24 meses para manter leitura profissional.
     */
    const limite24Meses = new Date(
      fimMes.getFullYear(),
      fimMes.getMonth() - 23,
      1,
      12,
      0,
      0
    );

    if (referenciaInicio < limite24Meses) {
      referenciaInicio = limite24Meses;
    }

    const mapa = new Map<
      string,
      {
        chave: string;
        quantidade: number;
      }
    >();

    const cursor = new Date(
      referenciaInicio
    );

    while (cursor <= fimMes) {
      const chave = `${cursor.getFullYear()}-${String(
        cursor.getMonth() + 1
      ).padStart(2, "0")}`;

      mapa.set(chave, {
        chave,
        quantidade: 0,
      });

      cursor.setMonth(
        cursor.getMonth() + 1
      );
    }

    relatoriosComDocumentoFiltrados.forEach(
      (relatorio) => {
        if (!relatorio.dataRelatorio) {
          return;
        }

        const chave =
          chaveMes(
            relatorio.dataRelatorio
          );

        const atual =
          mapa.get(chave);

        if (!atual) {
          return;
        }

        atual.quantidade += 1;
      }
    );

    return Array.from(
      mapa.values()
    ).map((item) => ({
      mes:
        formatarMes(
          item.chave
        ),
      quantidade:
        item.quantidade,
    }));
  }, [
    filtrosAplicados.dataFim,
    filtrosAplicados.dataInicio,
    geradoEm,
    relatoriosComDocumentoFiltrados,
  ]);

  const resumoEvolucao = useMemo(() => {
    const total =
      dadosEvolucao.reduce(
        (soma, item) =>
          soma +
          item.quantidade,
        0
      );

    const mesesComDados =
      dadosEvolucao.filter(
        (item) =>
          item.quantidade > 0
      );

    const media =
      mesesComDados.length > 0
        ? Math.round(
            (total /
              mesesComDados.length) *
              10
          ) / 10
        : 0;

    const pico =
      dadosEvolucao.reduce(
        (
          melhor,
          item
        ) =>
          item.quantidade >
          melhor.quantidade
            ? item
            : melhor,
        {
          mes: "-",
          quantidade: 0,
        }
      );

    return {
      total,
      media,
      pico,
    };
  }, [dadosEvolucao]);

  const dadosStatus = useMemo(() => {
    return Object.keys(STATUS_LABELS).map((status) => ({
      nome: STATUS_LABELS[status],
      quantidade: relatoriosComDocumentoFiltrados.filter(
        (relatorio) => relatorio.status === status
      ).length,
      cor: CORES_STATUS[status],
    }));
  }, [relatoriosComDocumentoFiltrados]);

  const dadosPrioridades = useMemo(() => {
    return Object.keys(PRIORIDADE_LABELS).map((prioridade) => ({
      nome: PRIORIDADE_LABELS[prioridade],
      quantidade: relatoriosComDocumentoFiltrados.filter(
        (relatorio) => relatorio.prioridade === prioridade
      ).length,
      cor: CORES_PRIORIDADE[prioridade],
    }));
  }, [relatoriosComDocumentoFiltrados]);

  const metricas = useMemo(() => {
    const dataReferencia = new Date(geradoEm);

    const totalMesAtual =
      relatoriosComDocumentoFiltrados.filter(
        (relatorio) => {
          if (!relatorio.dataRelatorio) {
            return false;
          }

          const data =
            new Date(
              relatorio.dataRelatorio
            );

          const chaveData =
            chaveMes(
              data.toISOString()
            );

          const chaveReferencia =
            chaveMes(
              dataReferencia.toISOString()
            );

          return (
            chaveData ===
            chaveReferencia
          );
        }
      ).length;

    const datasValidas =
      relatoriosComDocumentoFiltrados.filter(
        (relatorio) =>
          Boolean(
            relatorio.dataRelatorio
          )
      ).length;

    const colaboradoresUnicos = new Set(
      relatoriosComDocumentoFiltrados.flatMap((relatorio) =>
        relatorio.responsaveis.map((responsavel) => responsavel.id)
      )
    ).size;

    const setoresUnicos = new Set(
      relatoriosComDocumentoFiltrados
        .map((relatorio) => relatorio.setor?.id)
        .filter(Boolean)
    ).size;

    const maquinasUnicas = new Set(
      relatoriosComDocumentoFiltrados
        .map((relatorio) => relatorio.maquina?.id)
        .filter(Boolean)
    ).size;

    return {
      total: relatoriosComDocumentoFiltrados.length,
      totalMesAtual,
      colaboradoresUnicos,
      setoresUnicos,
      maquinasUnicas,
      datasValidas,
      semRelatorio: semRelatorioFiltrados.length,
    };
  }, [
    geradoEm,
    relatoriosComDocumentoFiltrados,
    semRelatorioFiltrados,
  ]);

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
        "Situação do relatório": relatorio.temRelatorio
          ? "Preenchido"
          : "Pendente",
        "Data de conclusão": formatarData(relatorio.dataConclusao),
        "Data real do relatório": relatorio.temRelatorio
          ? formatarData(relatorio.dataRelatorio)
          : "-",
        Relatório: relatorio.temRelatorio
          ? relatorio.registroFinal
          : "RELATÓRIO PENDENTE",
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
          Indicador: "OS concluídas sem relatório",
          Valor: metricas.semRelatorio,
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
                O período usa a data/hora de término preenchida no relatório técnico.
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

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <CardMetrica
            titulo="Total de relatórios"
            valor={metricas.total}
            descricao="Documentos encontrados"
            icon={<FileText size={23} />}
          />

          <CardMetrica
            titulo="Relatórios neste mês"
            valor={metricas.totalMesAtual}
            descricao="Pela data real do relatório"
            icon={<CalendarDays size={23} />}
          />

          <CardMetrica
            titulo="Data técnica válida"
            valor={`${metricas.datasValidas}/${metricas.total}`}
            descricao="Documentos com término identificável"
            icon={<CalendarDays size={23} />}
          />

          <CardMetrica
            titulo="Sem relatório"
            valor={metricas.semRelatorio}
            descricao="OS concluídas sem documentação"
            icon={<AlertTriangle size={23} />}
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

        {semRelatorioFiltrados.length > 0 && (
          <section className="overflow-hidden rounded-3xl border border-amber-400/25 bg-amber-400/[0.06] shadow-2xl shadow-black/25">
            <div className="flex flex-col gap-4 border-b border-amber-400/15 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber-400/30 bg-amber-400/10 text-amber-300">
                  <AlertTriangle size={21} />
                </div>

                <div>
                  <h2 className="text-xl font-black text-white">
                    OS concluídas sem relatório
                  </h2>

                  <p className="mt-1 text-sm text-slate-400">
                    Estas ordens já foram concluídas, mas ainda precisam do
                    relatório de manutenção.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-amber-400/25 bg-[#050816] px-4 py-3 text-center">
                <p className="text-2xl font-black text-amber-300">
                  {semRelatorioFiltrados.length}
                </p>
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  pendente(s)
                </p>
              </div>
            </div>

            <div className="divide-y divide-white/10">
              {semRelatorioFiltrados.map((relatorio) => (
                <div
                  key={relatorio.id}
                  className="grid gap-4 p-5 lg:grid-cols-[120px_minmax(0,1fr)_180px] lg:items-center sm:p-6"
                >
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Ordem de serviço
                    </p>
                    <p className="mt-1 text-lg font-black text-amber-300">
                      #{relatorio.numero}
                    </p>
                  </div>

                  <div className="min-w-0">
                    <h3 className="break-words font-black text-white">
                      {relatorio.titulo}
                    </h3>

                    <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-400">
                      <span>
                        Setor: {relatorio.setor?.nome ?? "-"}
                      </span>
                      <span>
                        Máquina: {relatorio.maquina?.nome ?? "-"}
                      </span>
                      <span>
                        Concluída em:{" "}
                        {formatarData(relatorio.dataConclusao)}
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-slate-400">
                      Responsáveis:{" "}
                      {relatorio.responsaveis
                        .map((responsavel) => responsavel.nome)
                        .join(", ") || "-"}
                    </p>
                  </div>

                  <Link
                    href={`/admin/relatorios/${relatorio.id}`}
                    className="inline-flex h-12 items-center justify-center rounded-2xl bg-amber-300 px-5 text-sm font-black text-slate-950 transition hover:bg-amber-200"
                  >
                    Preencher relatório
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}

        {relatoriosComDocumentoFiltrados.length === 0 ? (
          <section className="rounded-3xl border border-dashed border-white/10 bg-white/[0.03] px-6 py-20 text-center">
            <BarChart3
              size={44}
              className="mx-auto text-slate-600"
            />

            <h2 className="mt-4 text-xl font-black">
              Nenhum relatório preenchido encontrado
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              Altere os filtros para visualizar os gráficos.
            </p>
          </section>
        ) : (
          <>
            <CardGrafico
              titulo="Evolução real dos relatórios"
              descricao="Quantidade de serviços por mês, usando exclusivamente a data/hora de término preenchida no relatório técnico."
              icon={<TrendingUp size={21} />}
            >
              <div className="mb-4 grid gap-3 sm:grid-cols-3">
                <ResumoGrafico
                  label="No período"
                  value={resumoEvolucao.total}
                  helper="relatórios com data válida"
                  tone="cyan"
                />

                <ResumoGrafico
                  label="Média mensal"
                  value={resumoEvolucao.media}
                  helper="considerando meses com dados"
                  tone="blue"
                />

                <ResumoGrafico
                  label="Pico"
                  value={resumoEvolucao.pico.quantidade}
                  helper={
                    resumoEvolucao.pico.quantidade > 0
                      ? resumoEvolucao.pico.mes
                      : "sem movimento"
                  }
                  tone="green"
                />
              </div>

              <div className="h-[360px] overflow-hidden rounded-2xl border border-white/[0.06] bg-[linear-gradient(180deg,rgba(34,211,238,.025),rgba(2,6,23,.20))] p-2 sm:h-[410px]">
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <AreaChart
                    data={dadosEvolucao}
                    margin={{
                      top: 18,
                      right: 18,
                      left: 0,
                      bottom: 4,
                    }}
                  >
                    <defs>
                      <linearGradient
                        id="relatoriosArea"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#22d3ee"
                          stopOpacity={0.30}
                        />

                        <stop
                          offset="72%"
                          stopColor="#22d3ee"
                          stopOpacity={0.035}
                        />

                        <stop
                          offset="100%"
                          stopColor="#22d3ee"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>

                    <CartesianGrid
                      stroke="rgba(148,163,184,.10)"
                      strokeDasharray="4 6"
                      vertical={false}
                    />

                    <XAxis
                      dataKey="mes"
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fill: "#94a3b8",
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                      tickMargin={12}
                    />

                    <YAxis
                      allowDecimals={false}
                      axisLine={false}
                      tickLine={false}
                      width={42}
                      tick={{
                        fill: "#64748b",
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                      domain={[
                        0,
                        (dataMax: number) =>
                          Math.max(
                            4,
                            Math.ceil(
                              dataMax * 1.12
                            )
                          ),
                      ]}
                    />

                    <Tooltip
                      contentStyle={{
                        ...tooltipStyle,
                        backgroundColor:
                          "rgba(5,11,24,.96)",
                      }}
                      labelStyle={{
                        color: "#cbd5e1",
                        fontWeight: 800,
                        marginBottom: 4,
                      }}
                      formatter={(value) => [
                        `${value} relatório(s)`,
                        "Data real do relatório",
                      ]}
                    />

                    <Area
                      type="monotone"
                      dataKey="quantidade"
                      name="Relatórios"
                      stroke="#22d3ee"
                      strokeWidth={4}
                      fill="url(#relatoriosArea)"
                      dot={{
                        r: 4,
                        fill: "#07101f",
                        stroke: "#22d3ee",
                        strokeWidth: 2.5,
                      }}
                      activeDot={{
                        r: 7,
                        fill: "#22d3ee",
                        stroke: "#cffafe",
                        strokeWidth: 2,
                      }}
                      isAnimationActive
                      animationDuration={700}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-3 flex items-center gap-2 rounded-xl border border-cyan-400/10 bg-cyan-400/[0.025] px-3 py-2.5">
                <CalendarDays
                  size={15}
                  className="shrink-0 text-cyan-300"
                />

                <p className="text-xs leading-5 text-slate-500">
                  Uma OS salva ou encerrada administrativamente neste mês será contabilizada em outro mês se a data de término do relatório técnico indicar isso.
                </p>
              </div>
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
            {relatoriosComDocumentoFiltrados.length} relatório(s) preenchido(s)
            {" • "}
            {semRelatorioFiltrados.length} OS concluída(s) sem relatório.
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
                  Data do relatório
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
                    {formatarData(
                      relatorio.temRelatorio
                        ? relatorio.dataRelatorio
                        : relatorio.dataConclusao
                    )}
                  </td>

                  <td className="max-w-[360px] px-4 py-4 text-sm leading-relaxed text-slate-300">
                    {relatorio.temRelatorio ? (
                      <p className="line-clamp-3 whitespace-pre-line">
                        {relatorio.registroFinal}
                      </p>
                    ) : (
                      <div className="flex flex-col items-start gap-2">
                        <span className="inline-flex rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-black text-amber-300">
                          Relatório pendente
                        </span>

                        <Link
                          href={`/admin/relatorios/${relatorio.id}`}
                          className="text-xs font-black text-cyan-300 transition hover:text-cyan-200"
                        >
                          Preencher relatório
                        </Link>
                      </div>
                    )}
                  </td>
                </tr>
              ))}

              {relatoriosFiltrados.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-sm text-slate-500"
                  >
                    Nenhuma OS encontrada.
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
    <div className="rounded-[22px] border border-white/[0.07] bg-[#070c1b] p-5 shadow-[0_10px_30px_rgba(0,0,0,.16)]">
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

function ResumoGrafico({
  label,
  value,
  helper,
  tone,
}: {
  label: string;
  value: number | string;
  helper: string;
  tone: "cyan" | "blue" | "green";
}) {
  const classes = {
    cyan:
      "border-cyan-400/12 bg-cyan-400/[0.035] text-cyan-300",
    blue:
      "border-blue-400/12 bg-blue-400/[0.035] text-blue-300",
    green:
      "border-emerald-400/12 bg-emerald-400/[0.035] text-emerald-300",
  };

  return (
    <div
      className={`rounded-xl border px-4 py-3 ${classes[tone]}`}
    >
      <p className="text-[10px] font-black uppercase tracking-[0.09em] opacity-75">
        {label}
      </p>

      <p className="mt-1 text-2xl font-black tracking-[-0.04em] text-white">
        {value}
      </p>

      <p className="mt-1 text-[10px] text-slate-600">
        {helper}
      </p>
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
    <section className="min-w-0 rounded-[24px] border border-white/[0.07] bg-[#070c1b] p-4 shadow-[0_12px_35px_rgba(0,0,0,.18)] sm:p-6">
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