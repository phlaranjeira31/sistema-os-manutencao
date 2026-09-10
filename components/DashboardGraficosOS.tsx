"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  Filter,
  Gauge,
  PieChart as PieChartIcon,
  RotateCcw,
  TrendingUp,
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

type Setor = {
  id: string;
  nome: string;
};

type Colaborador = {
  id: string;
  nome: string;
};

type Maquina = {
  id: string;
  nome: string;
  setorId: string;
};

type OrdemServico = {
  id: string;
  numero: number;
  titulo: string;
  descricao: string;
  status: string;
  prioridade: string;
  createdAt: string;
  updatedAt: string;
  dataPrevista: string | null;
  dataConclusao: string | null;
  setor: Setor | null;
  maquina: Maquina | null;
  responsaveis: Colaborador[];
};

type Filtros = {
  dataInicio: string;
  dataFim: string;
  status: string;
  colaborador: string;
  setor: string;
  prioridade: string;
  maquina: string;
};

type Props = {
  ordens: OrdemServico[];
  setores: Setor[];
  colaboradores: Colaborador[];
  maquinas: Maquina[];
  filtrosIniciais: Filtros;
};

const STATUS_OPTIONS = [
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

const PRIORIDADE_OPTIONS = [
  {
    value: "BAIXA",
    label: "Baixa",
  },
  {
    value: "MEDIA",
    label: "Média",
  },
  {
    value: "ALTA",
    label: "Alta",
  },
  {
    value: "URGENTE",
    label: "Urgente",
  },
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

const tooltipStyle = {
  backgroundColor: "#080d1f",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: "14px",
  color: "#ffffff",
  boxShadow: "0 18px 45px rgba(0,0,0,0.35)",
};

function statusLabel(status: string) {
  return (
    STATUS_OPTIONS.find((item) => item.value === status)?.label ??
    status
  );
}

function prioridadeLabel(prioridade: string) {
  return (
    PRIORIDADE_OPTIONS.find(
      (item) => item.value === prioridade
    )?.label ?? prioridade
  );
}

function formatarDataInput(value: string) {
  if (!value) return "Todas";

  return new Intl.DateTimeFormat("pt-BR").format(
    new Date(`${value}T00:00:00`)
  );
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

function chaveMes(value: string) {
  const date = new Date(value);

  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}`;
}

function formatarDuracaoMedia(ms: number) {
  if (!ms || ms <= 0) return "0h";

  const horas = ms / (1000 * 60 * 60);

  if (horas < 24) {
    return `${horas.toFixed(1).replace(".", ",")}h`;
  }

  const dias = horas / 24;

  return `${dias.toFixed(1).replace(".", ",")} dias`;
}

export default function DashboardGraficosOS({
  ordens,
  setores,
  colaboradores,
  maquinas,
  filtrosIniciais,
}: Props) {
  const relatorioRef = useRef<HTMLDivElement>(null);

  const [gerandoPDF, setGerandoPDF] = useState(false);
  const [filtrosEdicao, setFiltrosEdicao] =
    useState<Filtros>(filtrosIniciais);
  const [filtrosAplicados, setFiltrosAplicados] =
    useState<Filtros>(filtrosIniciais);

  const maquinasDisponiveis = useMemo(() => {
    if (!filtrosEdicao.setor) {
      return maquinas;
    }

    return maquinas.filter(
      (maquina) => maquina.setorId === filtrosEdicao.setor
    );
  }, [maquinas, filtrosEdicao.setor]);

  useEffect(() => {
    if (
      filtrosEdicao.maquina &&
      !maquinasDisponiveis.some(
        (maquina) => maquina.id === filtrosEdicao.maquina
      )
    ) {
      setFiltrosEdicao((anterior) => ({
        ...anterior,
        maquina: "",
      }));
    }
  }, [filtrosEdicao.maquina, maquinasDisponiveis]);

  const ordensFiltradas = useMemo(() => {
    const inicio = filtrosAplicados.dataInicio
      ? new Date(`${filtrosAplicados.dataInicio}T00:00:00`)
      : null;

    const fim = filtrosAplicados.dataFim
      ? new Date(`${filtrosAplicados.dataFim}T23:59:59`)
      : null;

    return ordens.filter((os) => {
      const criadaEm = new Date(os.createdAt);

      if (inicio && criadaEm < inicio) return false;
      if (fim && criadaEm > fim) return false;

      if (
        filtrosAplicados.status &&
        os.status !== filtrosAplicados.status
      ) {
        return false;
      }

      if (
        filtrosAplicados.prioridade &&
        os.prioridade !== filtrosAplicados.prioridade
      ) {
        return false;
      }

      if (
        filtrosAplicados.setor &&
        os.setor?.id !== filtrosAplicados.setor
      ) {
        return false;
      }

      if (
        filtrosAplicados.maquina &&
        os.maquina?.id !== filtrosAplicados.maquina
      ) {
        return false;
      }

      if (
        filtrosAplicados.colaborador &&
        !os.responsaveis.some(
          (responsavel) =>
            responsavel.id === filtrosAplicados.colaborador
        )
      ) {
        return false;
      }

      return true;
    });
  }, [ordens, filtrosAplicados]);

  const metricas = useMemo(() => {
    const total = ordensFiltradas.length;

    const concluidas = ordensFiltradas.filter(
      (os) => os.status === "CONCLUIDA"
    ).length;

    const pendentes = ordensFiltradas.filter(
      (os) =>
        os.status === "NAO_INICIADA" ||
        os.status === "EM_ANDAMENTO"
    ).length;

    const canceladas = ordensFiltradas.filter(
      (os) => os.status === "CANCELADA"
    ).length;

    const agora = new Date();

    const atrasadas = ordensFiltradas.filter((os) => {
      if (
        os.status === "CONCLUIDA" ||
        os.status === "CANCELADA" ||
        !os.dataPrevista
      ) {
        return false;
      }

      return new Date(os.dataPrevista) < agora;
    }).length;

    const concluidasComTempo = ordensFiltradas
      .filter((os) => os.status === "CONCLUIDA")
      .map((os) => {
        const inicio = new Date(os.createdAt).getTime();

        const fim = new Date(
          os.dataConclusao ?? os.updatedAt
        ).getTime();

        return Math.max(fim - inicio, 0);
      })
      .filter((tempo) => tempo > 0);

    const tempoMedio =
      concluidasComTempo.length > 0
        ? concluidasComTempo.reduce(
            (totalTempo, tempo) => totalTempo + tempo,
            0
          ) / concluidasComTempo.length
        : 0;

    return {
      total,
      concluidas,
      pendentes,
      canceladas,
      atrasadas,
      taxaConclusao:
        total > 0 ? Math.round((concluidas / total) * 100) : 0,
      tempoMedio,
    };
  }, [ordensFiltradas]);

  const dadosStatus = useMemo(
    () =>
      STATUS_OPTIONS.map((status) => ({
        nome: status.label,
        valor: ordensFiltradas.filter(
          (os) => os.status === status.value
        ).length,
        cor: CORES_STATUS[status.value],
      })),
    [ordensFiltradas]
  );

  const dadosPrioridades = useMemo(
    () =>
      PRIORIDADE_OPTIONS.map((prioridade) => ({
        nome: prioridade.label,
        quantidade: ordensFiltradas.filter(
          (os) => os.prioridade === prioridade.value
        ).length,
        cor: CORES_PRIORIDADE[prioridade.value],
      })),
    [ordensFiltradas]
  );

  const dadosSetores = useMemo(() => {
    const mapa = new Map<
      string,
      {
        setor: string;
        concluidas: number;
        pendentes: number;
        canceladas: number;
        total: number;
      }
    >();

    ordensFiltradas.forEach((os) => {
      const nome = os.setor?.nome ?? "Sem setor";

      const atual = mapa.get(nome) ?? {
        setor: nome,
        concluidas: 0,
        pendentes: 0,
        canceladas: 0,
        total: 0,
      };

      atual.total += 1;

      if (os.status === "CONCLUIDA") {
        atual.concluidas += 1;
      } else if (os.status === "CANCELADA") {
        atual.canceladas += 1;
      } else {
        atual.pendentes += 1;
      }

      mapa.set(nome, atual);
    });

    return Array.from(mapa.values()).sort(
      (a, b) => b.total - a.total
    );
  }, [ordensFiltradas]);

  const dadosEvolucao = useMemo(() => {
    const mapa = new Map<
      string,
      {
        chave: string;
        criadas: number;
        concluidas: number;
      }
    >();

    ordensFiltradas.forEach((os) => {
      const chaveCriacao = chaveMes(os.createdAt);

      const criacao = mapa.get(chaveCriacao) ?? {
        chave: chaveCriacao,
        criadas: 0,
        concluidas: 0,
      };

      criacao.criadas += 1;
      mapa.set(chaveCriacao, criacao);

      if (os.status === "CONCLUIDA") {
        const chaveConclusao = chaveMes(
          os.dataConclusao ?? os.updatedAt
        );

        const conclusao = mapa.get(chaveConclusao) ?? {
          chave: chaveConclusao,
          criadas: 0,
          concluidas: 0,
        };

        conclusao.concluidas += 1;
        mapa.set(chaveConclusao, conclusao);
      }
    });

    return Array.from(mapa.values())
      .sort((a, b) => a.chave.localeCompare(b.chave))
      .map((item) => ({
        mes: formatarMes(item.chave),
        criadas: item.criadas,
        concluidas: item.concluidas,
      }));
  }, [ordensFiltradas]);

  const dadosColaboradores = useMemo(() => {
    const mapa = new Map<
      string,
      {
        colaborador: string;
        atribuidas: number;
        concluidas: number;
        pendentes: number;
      }
    >();

    ordensFiltradas.forEach((os) => {
      os.responsaveis.forEach((responsavel) => {
        const atual = mapa.get(responsavel.id) ?? {
          colaborador: responsavel.nome,
          atribuidas: 0,
          concluidas: 0,
          pendentes: 0,
        };

        atual.atribuidas += 1;

        if (os.status === "CONCLUIDA") {
          atual.concluidas += 1;
        } else if (os.status !== "CANCELADA") {
          atual.pendentes += 1;
        }

        mapa.set(responsavel.id, atual);
      });
    });

    return Array.from(mapa.values())
      .sort((a, b) => b.atribuidas - a.atribuidas)
      .slice(0, 12);
  }, [ordensFiltradas]);

  const dadosMaquinas = useMemo(() => {
    const mapa = new Map<
      string,
      {
        maquina: string;
        ocorrencias: number;
        concluidas: number;
      }
    >();

    ordensFiltradas.forEach((os) => {
      if (!os.maquina) return;

      const atual = mapa.get(os.maquina.id) ?? {
        maquina: os.maquina.nome,
        ocorrencias: 0,
        concluidas: 0,
      };

      atual.ocorrencias += 1;

      if (os.status === "CONCLUIDA") {
        atual.concluidas += 1;
      }

      mapa.set(os.maquina.id, atual);
    });

    return Array.from(mapa.values())
      .sort((a, b) => b.ocorrencias - a.ocorrencias)
      .slice(0, 10);
  }, [ordensFiltradas]);

  const dadosPrazos = useMemo(() => {
    const agora = new Date();

    let concluidasNoPrazo = 0;
    let concluidasAtrasadas = 0;
    let abertasNoPrazo = 0;
    let abertasAtrasadas = 0;
    let semPrazo = 0;

    ordensFiltradas.forEach((os) => {
      if (!os.dataPrevista) {
        semPrazo += 1;
        return;
      }

      const prevista = new Date(os.dataPrevista);

      if (os.status === "CONCLUIDA") {
        const conclusao = new Date(
          os.dataConclusao ?? os.updatedAt
        );

        if (conclusao <= prevista) {
          concluidasNoPrazo += 1;
        } else {
          concluidasAtrasadas += 1;
        }

        return;
      }

      if (os.status === "CANCELADA") {
        return;
      }

      if (agora > prevista) {
        abertasAtrasadas += 1;
      } else {
        abertasNoPrazo += 1;
      }
    });

    return [
      {
        nome: "Concluídas no prazo",
        quantidade: concluidasNoPrazo,
      },
      {
        nome: "Concluídas atrasadas",
        quantidade: concluidasAtrasadas,
      },
      {
        nome: "Abertas no prazo",
        quantidade: abertasNoPrazo,
      },
      {
        nome: "Abertas atrasadas",
        quantidade: abertasAtrasadas,
      },
      {
        nome: "Sem prazo",
        quantidade: semPrazo,
      },
    ];
  }, [ordensFiltradas]);

  const resumoFiltros = useMemo(() => {
    const setor =
      setores.find(
        (item) => item.id === filtrosAplicados.setor
      )?.nome ?? "Todos";

    const colaborador =
      colaboradores.find(
        (item) => item.id === filtrosAplicados.colaborador
      )?.nome ?? "Todos";

    const maquina =
      maquinas.find(
        (item) => item.id === filtrosAplicados.maquina
      )?.nome ?? "Todas";

    return {
      periodo: `${formatarDataInput(
        filtrosAplicados.dataInicio
      )} até ${formatarDataInput(filtrosAplicados.dataFim)}`,
      setor,
      colaborador,
      maquina,
      status: filtrosAplicados.status
        ? statusLabel(filtrosAplicados.status)
        : "Todos",
      prioridade: filtrosAplicados.prioridade
        ? prioridadeLabel(filtrosAplicados.prioridade)
        : "Todas",
    };
  }, [
    colaboradores,
    filtrosAplicados,
    maquinas,
    setores,
  ]);

  function aplicarFiltros(event: React.FormEvent) {
    event.preventDefault();
    setFiltrosAplicados({ ...filtrosEdicao });
  }

  function limparFiltros() {
    const filtrosVazios: Filtros = {
      dataInicio: "",
      dataFim: "",
      status: "",
      colaborador: "",
      setor: "",
      prioridade: "",
      maquina: "",
    };

    setFiltrosEdicao(filtrosVazios);
    setFiltrosAplicados(filtrosVazios);
  }

  async function gerarPDF() {
    if (gerandoPDF) return;

    try {
      setGerandoPDF(true);

      const [{ jsPDF }, { default: autoTable }] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
      ]);

      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const larguraPagina = pdf.internal.pageSize.getWidth();
      const alturaPagina = pdf.internal.pageSize.getHeight();
      const margem = 12;
      const larguraUtil = larguraPagina - margem * 2;

      const CORES_PDF = {
        fundo: [5, 8, 22] as [number, number, number],
        painel: [8, 13, 31] as [number, number, number],
        painel2: [11, 18, 38] as [number, number, number],
        borda: [30, 41, 59] as [number, number, number],
        branco: [255, 255, 255] as [number, number, number],
        texto: [226, 232, 240] as [number, number, number],
        textoFraco: [148, 163, 184] as [number, number, number],
        textoMuitoFraco: [100, 116, 139] as [number, number, number],
        ciano: [34, 211, 238] as [number, number, number],
        verde: [16, 185, 129] as [number, number, number],
        azul: [59, 130, 246] as [number, number, number],
        laranja: [249, 115, 22] as [number, number, number],
        vermelho: [239, 68, 68] as [number, number, number],
        violeta: [139, 92, 246] as [number, number, number],
        cinza: [100, 116, 139] as [number, number, number],
      };

      function hexParaRgb(hex: string): [number, number, number] {
        const limpo = hex.replace("#", "");
        const numero = Number.parseInt(limpo, 16);

        return [
          (numero >> 16) & 255,
          (numero >> 8) & 255,
          numero & 255,
        ];
      }

      async function carregarLogo(): Promise<string | null> {
        try {
          const resposta = await fetch("/logo.sequoia.png");
          if (!resposta.ok) return null;

          const blob = await resposta.blob();

          return await new Promise<string | null>((resolve) => {
            const reader = new FileReader();

            reader.onloadend = () => {
              resolve(
                typeof reader.result === "string"
                  ? reader.result
                  : null
              );
            };

            reader.onerror = () => resolve(null);
            reader.readAsDataURL(blob);
          });
        } catch {
          return null;
        }
      }

      const logoBase64 = await carregarLogo();

      function fundoPagina() {
        pdf.setFillColor(...CORES_PDF.fundo);
        pdf.rect(0, 0, larguraPagina, alturaPagina, "F");
      }

      function cabecalho(
        titulo: string,
        subtitulo: string,
        numeroPagina: number
      ) {
        fundoPagina();

        pdf.setFillColor(...CORES_PDF.painel2);
        pdf.roundedRect(
          margem,
          9,
          larguraUtil,
          28,
          4,
          4,
          "F"
        );

        pdf.setDrawColor(...CORES_PDF.borda);
        pdf.roundedRect(
          margem,
          9,
          larguraUtil,
          28,
          4,
          4,
          "S"
        );

        if (logoBase64) {
          try {
            pdf.addImage(
              logoBase64,
              "PNG",
              margem + 4,
              14,
              24,
              16
            );
          } catch {
            // Mantém o relatório funcionando mesmo se a logo falhar.
          }
        }

        const inicioTexto = logoBase64 ? margem + 34 : margem + 5;

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(7.5);
        pdf.setTextColor(...CORES_PDF.ciano);
        pdf.text(
          "SISTEMA DE MANUTENÇÃO • SEQUOIA",
          inicioTexto,
          17
        );

        pdf.setFontSize(17);
        pdf.setTextColor(...CORES_PDF.branco);
        pdf.text(titulo, inicioTexto, 25);

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(7.5);
        pdf.setTextColor(...CORES_PDF.textoFraco);
        pdf.text(subtitulo, inicioTexto, 31.5);

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(7.5);
        pdf.setTextColor(...CORES_PDF.textoFraco);
        pdf.text(
          `PÁGINA ${numeroPagina}`,
          larguraPagina - margem - 5,
          17,
          { align: "right" }
        );

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(7);
        pdf.setTextColor(...CORES_PDF.textoMuitoFraco);
        pdf.text(
          new Date().toLocaleString("pt-BR"),
          larguraPagina - margem - 5,
          24,
          { align: "right" }
        );
      }

      function rodape() {
        pdf.setDrawColor(...CORES_PDF.borda);
        pdf.line(
          margem,
          alturaPagina - 10,
          larguraPagina - margem,
          alturaPagina - 10
        );

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(7);
        pdf.setTextColor(...CORES_PDF.textoMuitoFraco);

        pdf.text(
          "Sistema de OS - Sequoia",
          margem,
          alturaPagina - 5
        );

        pdf.text(
          "Relatório gerencial de indicadores de manutenção",
          larguraPagina / 2,
          alturaPagina - 5,
          { align: "center" }
        );

        pdf.text(
          "Desenvolvido por Pedro H. Laranjeira",
          larguraPagina - margem,
          alturaPagina - 5,
          { align: "right" }
        );
      }

      function tituloSecao(
        titulo: string,
        subtitulo: string,
        x: number,
        y: number,
        largura: number
      ) {
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(10.5);
        pdf.setTextColor(...CORES_PDF.branco);
        pdf.text(titulo, x, y);

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(7);
        pdf.setTextColor(...CORES_PDF.textoFraco);
        pdf.text(subtitulo, x, y + 5);

        pdf.setDrawColor(...CORES_PDF.borda);
        pdf.line(x, y + 8, x + largura, y + 8);
      }

      function chipFiltro(
        x: number,
        y: number,
        largura: number,
        label: string,
        valor: string
      ) {
        pdf.setFillColor(...CORES_PDF.painel);
        pdf.roundedRect(x, y, largura, 14, 3, 3, "F");

        pdf.setDrawColor(...CORES_PDF.borda);
        pdf.roundedRect(x, y, largura, 14, 3, 3, "S");

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(5.8);
        pdf.setTextColor(...CORES_PDF.textoMuitoFraco);
        pdf.text(label.toUpperCase(), x + 3, y + 4.3);

        pdf.setFontSize(7.2);
        pdf.setTextColor(...CORES_PDF.branco);

        const linhas = pdf.splitTextToSize(valor || "-", largura - 6);
        pdf.text(String(linhas[0] ?? "-"), x + 3, y + 9.7);
      }

      function cardMetricaPDF(
        x: number,
        y: number,
        largura: number,
        titulo: string,
        valor: string,
        descricao: string,
        cor: [number, number, number]
      ) {
        pdf.setFillColor(...CORES_PDF.painel);
        pdf.roundedRect(x, y, largura, 27, 4, 4, "F");

        pdf.setDrawColor(...CORES_PDF.borda);
        pdf.roundedRect(x, y, largura, 27, 4, 4, "S");

        pdf.setFillColor(...cor);
        pdf.roundedRect(x + 4, y + 4, 2.2, 19, 1, 1, "F");

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(7);
        pdf.setTextColor(...CORES_PDF.textoFraco);
        pdf.text(titulo, x + 10, y + 7);

        pdf.setFontSize(15.5);
        pdf.setTextColor(...CORES_PDF.branco);
        pdf.text(valor, x + 10, y + 16.5);

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(6.3);
        pdf.setTextColor(...CORES_PDF.textoMuitoFraco);
        pdf.text(descricao, x + 10, y + 22.2);
      }

      function barrasHorizontais(
        itens: Array<{
          label: string;
          valor: number;
          cor: [number, number, number];
        }>,
        x: number,
        y: number,
        largura: number,
        altura: number
      ) {
        pdf.setFillColor(...CORES_PDF.painel);
        pdf.roundedRect(x, y, largura, altura, 4, 4, "F");
        pdf.setDrawColor(...CORES_PDF.borda);
        pdf.roundedRect(x, y, largura, altura, 4, 4, "S");

        const maior = Math.max(...itens.map((item) => item.valor), 1);
        const alturaLinha = (altura - 11) / Math.max(itens.length, 1);

        itens.forEach((item, indice) => {
          const linhaY = y + 7 + indice * alturaLinha;
          const larguraBarra = Math.max(
            0,
            ((largura - 58) * item.valor) / maior
          );

          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(6.8);
          pdf.setTextColor(...CORES_PDF.texto);
          pdf.text(item.label, x + 4, linhaY + 3.2);

          pdf.setFillColor(20, 29, 49);
          pdf.roundedRect(
            x + 44,
            linhaY,
            largura - 55,
            4.3,
            2,
            2,
            "F"
          );

          if (item.valor > 0) {
            pdf.setFillColor(...item.cor);
            pdf.roundedRect(
              x + 44,
              linhaY,
              larguraBarra,
              4.3,
              2,
              2,
              "F"
            );
          }

          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(7);
          pdf.setTextColor(...item.cor);
          pdf.text(
            String(item.valor),
            x + largura - 5,
            linhaY + 3.2,
            { align: "right" }
          );
        });
      }

      function graficoLinha(
        x: number,
        y: number,
        largura: number,
        altura: number
      ) {
        pdf.setFillColor(...CORES_PDF.painel);
        pdf.roundedRect(x, y, largura, altura, 4, 4, "F");
        pdf.setDrawColor(...CORES_PDF.borda);
        pdf.roundedRect(x, y, largura, altura, 4, 4, "S");

        if (dadosEvolucao.length === 0) {
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(8);
          pdf.setTextColor(...CORES_PDF.textoFraco);
          pdf.text(
            "Sem dados para evolução no período.",
            x + largura / 2,
            y + altura / 2,
            { align: "center" }
          );
          return;
        }

        const padLeft = 12;
        const padRight = 7;
        const padTop = 9;
        const padBottom = 16;
        const chartX = x + padLeft;
        const chartY = y + padTop;
        const chartW = largura - padLeft - padRight;
        const chartH = altura - padTop - padBottom;

        const maxValor = Math.max(
          ...dadosEvolucao.flatMap((item) => [
            item.criadas,
            item.concluidas,
          ]),
          1
        );

        pdf.setDrawColor(39, 50, 72);
        pdf.setLineWidth(0.2);

        for (let i = 0; i <= 4; i += 1) {
          const gridY = chartY + (chartH / 4) * i;
          pdf.line(chartX, gridY, chartX + chartW, gridY);

          const valor = Math.round(maxValor - (maxValor / 4) * i);
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(5.8);
          pdf.setTextColor(...CORES_PDF.textoMuitoFraco);
          pdf.text(String(valor), chartX - 2, gridY + 1.8, {
            align: "right",
          });
        }

        const passoX =
          dadosEvolucao.length > 1
            ? chartW / (dadosEvolucao.length - 1)
            : 0;

        const pontosCriadas: Array<[number, number]> = [];
        const pontosConcluidas: Array<[number, number]> = [];

        dadosEvolucao.forEach((item, indice) => {
          const px =
            dadosEvolucao.length > 1
              ? chartX + passoX * indice
              : chartX + chartW / 2;

          const pyCriadas =
            chartY + chartH - (item.criadas / maxValor) * chartH;

          const pyConcluidas =
            chartY +
            chartH -
            (item.concluidas / maxValor) * chartH;

          pontosCriadas.push([px, pyCriadas]);
          pontosConcluidas.push([px, pyConcluidas]);

          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(5.5);
          pdf.setTextColor(...CORES_PDF.textoMuitoFraco);
          pdf.text(item.mes, px, chartY + chartH + 7, {
            align: "center",
          });
        });

        function desenharSerie(
          pontos: Array<[number, number]>,
          cor: [number, number, number]
        ) {
          pdf.setDrawColor(...cor);
          pdf.setLineWidth(0.7);

          for (let i = 1; i < pontos.length; i += 1) {
            pdf.line(
              pontos[i - 1][0],
              pontos[i - 1][1],
              pontos[i][0],
              pontos[i][1]
            );
          }

          pontos.forEach(([px, py]) => {
            pdf.setFillColor(...cor);
            pdf.circle(px, py, 1.1, "F");
          });
        }

        desenharSerie(pontosCriadas, CORES_PDF.ciano);
        desenharSerie(pontosConcluidas, CORES_PDF.verde);

        pdf.setFillColor(...CORES_PDF.ciano);
        pdf.circle(x + 6, y + altura - 5, 1.2, "F");
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(6.2);
        pdf.setTextColor(...CORES_PDF.textoFraco);
        pdf.text("Criadas", x + 9, y + altura - 3.2);

        pdf.setFillColor(...CORES_PDF.verde);
        pdf.circle(x + 30, y + altura - 5, 1.2, "F");
        pdf.text("Concluídas", x + 33, y + altura - 3.2);
      }

      const statusPDF = dadosStatus.map((item) => ({
        label: item.nome,
        valor: item.valor,
        cor: hexParaRgb(item.cor),
      }));

      const prioridadesPDF = dadosPrioridades.map((item) => ({
        label: item.nome,
        valor: item.quantidade,
        cor: hexParaRgb(item.cor),
      }));

      // =========================================================
      // PÁGINA 1 — RESUMO EXECUTIVO
      // =========================================================
      cabecalho(
        "Relatório Executivo de Ordens de Serviço",
        "Visão consolidada dos principais indicadores operacionais e gerenciais",
        1
      );

      const chipW = 43;
      const chipGap = 3.2;
      const chipY = 43;

      [
        ["Período", resumoFiltros.periodo],
        ["Setor", resumoFiltros.setor],
        ["Máquina", resumoFiltros.maquina],
        ["Colaborador", resumoFiltros.colaborador],
        ["Status", resumoFiltros.status],
        ["Prioridade", resumoFiltros.prioridade],
      ].forEach(([label, valor], indice) => {
        chipFiltro(
          margem + indice * (chipW + chipGap),
          chipY,
          chipW,
          label,
          valor
        );
      });

      const cardGap = 4;
      const cardW = (larguraUtil - cardGap * 2) / 3;

      cardMetricaPDF(
        margem,
        64,
        cardW,
        "Total de OS",
        String(metricas.total),
        "Ordens encontradas",
        CORES_PDF.ciano
      );

      cardMetricaPDF(
        margem + cardW + cardGap,
        64,
        cardW,
        "Concluídas",
        String(metricas.concluidas),
        "Serviços finalizados",
        CORES_PDF.verde
      );

      cardMetricaPDF(
        margem + (cardW + cardGap) * 2,
        64,
        cardW,
        "Pendentes",
        String(metricas.pendentes),
        "Não iniciadas ou em andamento",
        CORES_PDF.azul
      );

      cardMetricaPDF(
        margem,
        95,
        cardW,
        "OS atrasadas",
        String(metricas.atrasadas),
        "Abertas fora do prazo",
        CORES_PDF.vermelho
      );

      cardMetricaPDF(
        margem + cardW + cardGap,
        95,
        cardW,
        "Taxa de conclusão",
        `${metricas.taxaConclusao}%`,
        "Percentual de OS concluídas",
        CORES_PDF.violeta
      );

      cardMetricaPDF(
        margem + (cardW + cardGap) * 2,
        95,
        cardW,
        "Tempo médio",
        formatarDuracaoMedia(metricas.tempoMedio),
        "Da criação até a conclusão",
        CORES_PDF.laranja
      );

      tituloSecao(
        "Distribuição operacional",
        "Situação atual das ordens e níveis de prioridade",
        margem,
        134,
        larguraUtil
      );

      const graficoGap = 6;
      const graficoW = (larguraUtil - graficoGap) / 2;

      barrasHorizontais(
        statusPDF,
        margem,
        145,
        graficoW,
        48
      );

      barrasHorizontais(
        prioridadesPDF,
        margem + graficoW + graficoGap,
        145,
        graficoW,
        48
      );

      rodape();

      // =========================================================
      // PÁGINA 2 — SETORES E EVOLUÇÃO
      // =========================================================
      pdf.addPage();

      cabecalho(
        "Análise Operacional por Setor",
        "Distribuição de volume, conclusão, pendências e evolução ao longo do período",
        2
      );

      tituloSecao(
        "Desempenho por setor",
        "Ranking dos setores com maior volume de ordens",
        margem,
        48,
        128
      );

      autoTable(pdf, {
        startY: 59,
        margin: {
          left: margem,
          right: larguraPagina - margem - 128,
        },
        tableWidth: 128,
        head: [
          [
            "Setor",
            "Total",
            "Concl.",
            "Pend.",
            "Canc.",
            "Eficiência",
          ],
        ],
        body:
          dadosSetores.length > 0
            ? dadosSetores.slice(0, 12).map((item) => [
                item.setor,
                String(item.total),
                String(item.concluidas),
                String(item.pendentes),
                String(item.canceladas),
                item.total > 0
                  ? `${Math.round(
                      (item.concluidas / item.total) * 100
                    )}%`
                  : "0%",
              ])
            : [["Sem dados", "0", "0", "0", "0", "0%"]],
        theme: "grid",
        styles: {
          font: "helvetica",
          fontSize: 6.7,
          cellPadding: 2.1,
          textColor: CORES_PDF.texto,
          fillColor: CORES_PDF.painel,
          lineColor: CORES_PDF.borda,
          lineWidth: 0.15,
          valign: "middle",
        },
        headStyles: {
          fillColor: CORES_PDF.ciano,
          textColor: CORES_PDF.fundo,
          fontStyle: "bold",
        },
        alternateRowStyles: {
          fillColor: CORES_PDF.painel2,
        },
        columnStyles: {
          0: { cellWidth: 48 },
          1: { halign: "center" },
          2: { halign: "center" },
          3: { halign: "center" },
          4: { halign: "center" },
          5: { halign: "center", fontStyle: "bold" },
        },
      });

      tituloSecao(
        "Evolução das ordens",
        "Comparativo mensal entre OS criadas e concluídas",
        153,
        48,
        132
      );

      graficoLinha(153, 59, 132, 73);

      tituloSecao(
        "Cumprimento dos prazos",
        "Situação das ordens em relação às datas previstas",
        153,
        145,
        132
      );

      barrasHorizontais(
        dadosPrazos.map((item, indice) => ({
          label: item.nome,
          valor: item.quantidade,
          cor: [
            CORES_PDF.verde,
            CORES_PDF.laranja,
            CORES_PDF.azul,
            CORES_PDF.vermelho,
            CORES_PDF.cinza,
          ][indice] ?? CORES_PDF.ciano,
        })),
        153,
        156,
        132,
        37
      );

      rodape();

      // =========================================================
      // PÁGINA 3 — COLABORADORES E MÁQUINAS
      // =========================================================
      pdf.addPage();

      cabecalho(
        "Desempenho de Equipe e Equipamentos",
        "Visão comparativa de responsáveis e máquinas com maior volume de ocorrências",
        3
      );

      tituloSecao(
        "Desempenho por colaborador",
        "OS atribuídas, concluídas e pendentes",
        margem,
        48,
        128
      );

      autoTable(pdf, {
        startY: 59,
        margin: {
          left: margem,
          right: larguraPagina - margem - 128,
        },
        tableWidth: 128,
        head: [
          [
            "Colaborador",
            "Atribuídas",
            "Concluídas",
            "Pendentes",
            "Eficiência",
          ],
        ],
        body:
          dadosColaboradores.length > 0
            ? dadosColaboradores.map((item) => [
                item.colaborador,
                String(item.atribuidas),
                String(item.concluidas),
                String(item.pendentes),
                item.atribuidas > 0
                  ? `${Math.round(
                      (item.concluidas / item.atribuidas) * 100
                    )}%`
                  : "0%",
              ])
            : [["Sem dados", "0", "0", "0", "0%"]],
        theme: "grid",
        styles: {
          font: "helvetica",
          fontSize: 6.7,
          cellPadding: 2.1,
          textColor: CORES_PDF.texto,
          fillColor: CORES_PDF.painel,
          lineColor: CORES_PDF.borda,
          lineWidth: 0.15,
          valign: "middle",
        },
        headStyles: {
          fillColor: CORES_PDF.violeta,
          textColor: CORES_PDF.branco,
          fontStyle: "bold",
        },
        alternateRowStyles: {
          fillColor: CORES_PDF.painel2,
        },
        columnStyles: {
          0: { cellWidth: 54 },
          1: { halign: "center" },
          2: { halign: "center" },
          3: { halign: "center" },
          4: { halign: "center", fontStyle: "bold" },
        },
      });

      tituloSecao(
        "Máquinas com mais ocorrências",
        "Ranking dos equipamentos com maior número de OS",
        153,
        48,
        132
      );

      autoTable(pdf, {
        startY: 59,
        margin: {
          left: 153,
          right: margem,
        },
        tableWidth: 132,
        head: [
          [
            "Máquina / equipamento",
            "Ocorrências",
            "Concluídas",
            "Eficiência",
          ],
        ],
        body:
          dadosMaquinas.length > 0
            ? dadosMaquinas.map((item) => [
                item.maquina,
                String(item.ocorrencias),
                String(item.concluidas),
                item.ocorrencias > 0
                  ? `${Math.round(
                      (item.concluidas / item.ocorrencias) * 100
                    )}%`
                  : "0%",
              ])
            : [["Sem dados", "0", "0", "0%"]],
        theme: "grid",
        styles: {
          font: "helvetica",
          fontSize: 6.7,
          cellPadding: 2.1,
          textColor: CORES_PDF.texto,
          fillColor: CORES_PDF.painel,
          lineColor: CORES_PDF.borda,
          lineWidth: 0.15,
          valign: "middle",
        },
        headStyles: {
          fillColor: CORES_PDF.laranja,
          textColor: CORES_PDF.branco,
          fontStyle: "bold",
        },
        alternateRowStyles: {
          fillColor: CORES_PDF.painel2,
        },
        columnStyles: {
          0: { cellWidth: 70 },
          1: { halign: "center" },
          2: { halign: "center" },
          3: { halign: "center", fontStyle: "bold" },
        },
      });

      const resumoY = 150;

      pdf.setFillColor(...CORES_PDF.painel2);
      pdf.roundedRect(
        margem,
        resumoY,
        larguraUtil,
        42,
        4,
        4,
        "F"
      );

      pdf.setDrawColor(...CORES_PDF.borda);
      pdf.roundedRect(
        margem,
        resumoY,
        larguraUtil,
        42,
        4,
        4,
        "S"
      );

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      pdf.setTextColor(...CORES_PDF.ciano);
      pdf.text("RESUMO EXECUTIVO", margem + 5, resumoY + 8);

      const principalSetor = dadosSetores[0];
      const principalMaquina = dadosMaquinas[0];
      const principalColaborador = dadosColaboradores[0];

      const frases = [
        `Foram analisadas ${metricas.total} OS. ${metricas.concluidas} estão concluídas, ${metricas.pendentes} permanecem pendentes e ${metricas.canceladas} foram canceladas.`,
        `A taxa geral de conclusão é de ${metricas.taxaConclusao}% e o tempo médio entre criação e conclusão é ${formatarDuracaoMedia(metricas.tempoMedio)}.`,
        principalSetor
          ? `O setor com maior volume é ${principalSetor.setor}, com ${principalSetor.total} OS no período.`
          : "Não há dados suficientes para destacar um setor.",
        principalMaquina
          ? `A máquina com maior número de ocorrências é ${principalMaquina.maquina}, com ${principalMaquina.ocorrencias} OS.`
          : "Não há dados suficientes para destacar uma máquina.",
        principalColaborador
          ? `O colaborador com maior volume de atribuições é ${principalColaborador.colaborador}, com ${principalColaborador.atribuidas} OS atribuídas.`
          : "Não há dados suficientes para destacar um colaborador.",
      ];

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7.3);
      pdf.setTextColor(...CORES_PDF.texto);

      let textoY = resumoY + 15;

      frases.forEach((frase) => {
        const linhas = pdf.splitTextToSize(frase, larguraUtil - 12);
        pdf.text(linhas, margem + 5, textoY);
        textoY += linhas.length * 4.1 + 1.7;
      });

      rodape();

      const dataArquivo = new Date()
        .toLocaleDateString("pt-BR")
        .replaceAll("/", "-");

      pdf.save(`dashboard-os-${dataArquivo}.pdf`);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      alert("Não foi possível gerar o PDF dos gráficos.");
    } finally {
      setGerandoPDF(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-black/30 backdrop-blur sm:p-6">
        <form
          onSubmit={aplicarFiltros}
          className="space-y-5"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300">
              <Filter size={21} />
            </div>

            <div>
              <h2 className="text-xl font-black">
                Filtros do dashboard
              </h2>

              <p className="text-sm text-slate-400">
                Os gráficos serão recalculados com os filtros aplicados.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
              label="Status"
              icon={<Activity size={16} />}
            >
              <select
                value={filtrosEdicao.status}
                onChange={(event) =>
                  setFiltrosEdicao((anterior) => ({
                    ...anterior,
                    status: event.target.value,
                  }))
                }
                className={inputClass}
              >
                <option value="">Todos os status</option>

                {STATUS_OPTIONS.map((status) => (
                  <option
                    key={status.value}
                    value={status.value}
                  >
                    {status.label}
                  </option>
                ))}
              </select>
            </CampoFiltro>

            <CampoFiltro
              label="Prioridade"
              icon={<AlertTriangle size={16} />}
            >
              <select
                value={filtrosEdicao.prioridade}
                onChange={(event) =>
                  setFiltrosEdicao((anterior) => ({
                    ...anterior,
                    prioridade: event.target.value,
                  }))
                }
                className={inputClass}
              >
                <option value="">Todas as prioridades</option>

                {PRIORIDADE_OPTIONS.map((prioridade) => (
                  <option
                    key={prioridade.value}
                    value={prioridade.value}
                  >
                    {prioridade.label}
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

            <CampoFiltro
              label="Colaborador"
              icon={<Users size={16} />}
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
                <option value="">
                  Todos os colaboradores
                </option>

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
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
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
              className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-5 text-sm font-black text-emerald-300 transition hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Download size={17} />

              {gerandoPDF
                ? "Gerando PDF..."
                : "Gerar PDF dos gráficos"}
            </button>
          </div>
        </form>
      </section>

      <div ref={relatorioRef} className="space-y-6 bg-[#050816]">
        <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-cyan-400/10 via-white/[0.04] to-blue-500/10 p-5 sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-300">
                Sistema de manutenção
              </p>

              <h2 className="mt-2 text-2xl font-black sm:text-3xl">
                Relatório gráfico geral de OS
              </h2>

              <p className="mt-2 text-sm text-slate-400">
                Emitido em{" "}
                {new Intl.DateTimeFormat("pt-BR", {
                  dateStyle: "short",
                  timeStyle: "short",
                }).format(new Date())}
              </p>
            </div>

            <div className="grid gap-2 text-sm sm:grid-cols-2 lg:max-w-3xl lg:grid-cols-3">
              <ResumoFiltro
                label="Período"
                value={resumoFiltros.periodo}
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
                label="Colaborador"
                value={resumoFiltros.colaborador}
              />
              <ResumoFiltro
                label="Status"
                value={resumoFiltros.status}
              />
              <ResumoFiltro
                label="Prioridade"
                value={resumoFiltros.prioridade}
              />
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <CardMetrica
            titulo="Total de OS"
            valor={metricas.total}
            descricao="Ordens encontradas"
            icon={<BarChart3 size={23} />}
            destaque="cyan"
          />

          <CardMetrica
            titulo="Concluídas"
            valor={metricas.concluidas}
            descricao="Serviços finalizados"
            icon={<CheckCircle2 size={23} />}
            destaque="emerald"
          />

          <CardMetrica
            titulo="Pendentes"
            valor={metricas.pendentes}
            descricao="Não iniciadas ou em andamento"
            icon={<Clock3 size={23} />}
            destaque="blue"
          />

          <CardMetrica
            titulo="OS atrasadas"
            valor={metricas.atrasadas}
            descricao="Abertas fora do prazo"
            icon={<AlertTriangle size={23} />}
            destaque="red"
          />

          <CardMetrica
            titulo="Taxa de conclusão"
            valor={`${metricas.taxaConclusao}%`}
            descricao="Percentual concluído"
            icon={<Gauge size={23} />}
            destaque="violet"
          />

          <CardMetrica
            titulo="Tempo médio"
            valor={formatarDuracaoMedia(metricas.tempoMedio)}
            descricao="Da criação até a conclusão"
            icon={<TrendingUp size={23} />}
            destaque="orange"
          />
        </section>

        {ordensFiltradas.length === 0 ? (
          <section className="rounded-3xl border border-dashed border-white/10 bg-white/[0.03] px-6 py-20 text-center">
            <BarChart3
              size={44}
              className="mx-auto text-slate-600"
            />

            <h2 className="mt-4 text-xl font-black">
              Nenhum dado encontrado
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              Altere os filtros para visualizar os gráficos.
            </p>
          </section>
        ) : (
          <>
            <section className="grid gap-6 xl:grid-cols-2">
              <CardGrafico
                titulo="Distribuição por status"
                descricao="Visão geral da situação atual das ordens."
                icon={<PieChartIcon size={21} />}
              >
                <ResponsiveContainer width="100%" height={340}>
                  <PieChart>
                    <Pie
                      data={dadosStatus}
                      dataKey="valor"
                      nameKey="nome"
                      cx="50%"
                      cy="48%"
                      innerRadius={74}
                      outerRadius={118}
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
                descricao="Quantidade de OS em cada nível de urgência."
                icon={<AlertTriangle size={21} />}
              >
                <ResponsiveContainer width="100%" height={340}>
                  <BarChart data={dadosPrioridades}>
                    <CartesianGrid
                      stroke="rgba(255,255,255,0.08)"
                      vertical={false}
                    />

                    <XAxis
                      dataKey="nome"
                      tick={{
                        fill: "#94a3b8",
                        fontSize: 12,
                      }}
                      axisLine={false}
                      tickLine={false}
                    />

                    <YAxis
                      allowDecimals={false}
                      tick={{
                        fill: "#94a3b8",
                        fontSize: 12,
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
                      dataKey="quantidade"
                      name="Quantidade"
                      radius={[10, 10, 0, 0]}
                    >
                      {dadosPrioridades.map((item) => (
                        <Cell
                          key={item.nome}
                          fill={item.cor}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardGrafico>
            </section>

            <CardGrafico
              titulo="OS por setor"
              descricao="Comparativo de concluídas, pendentes e canceladas."
              icon={<Building2 size={21} />}
            >
              <ResponsiveContainer width="100%" height={390}>
                <BarChart
                  data={dadosSetores}
                  margin={{
                    top: 10,
                    right: 15,
                    left: 0,
                    bottom: 45,
                  }}
                >
                  <CartesianGrid
                    stroke="rgba(255,255,255,0.08)"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="setor"
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                    height={70}
                    tick={{
                      fill: "#94a3b8",
                      fontSize: 11,
                    }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    allowDecimals={false}
                    tick={{
                      fill: "#94a3b8",
                      fontSize: 12,
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

                  <Legend />

                  <Bar
                    dataKey="concluidas"
                    name="Concluídas"
                    stackId="status"
                    fill="#10b981"
                  />

                  <Bar
                    dataKey="pendentes"
                    name="Pendentes"
                    stackId="status"
                    fill="#3b82f6"
                  />

                  <Bar
                    dataKey="canceladas"
                    name="Canceladas"
                    stackId="status"
                    fill="#64748b"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardGrafico>

            <CardGrafico
              titulo="Evolução das ordens"
              descricao="OS criadas e concluídas ao longo dos meses."
              icon={<TrendingUp size={21} />}
            >
              <ResponsiveContainer width="100%" height={380}>
                <LineChart
                  data={dadosEvolucao}
                  margin={{
                    top: 15,
                    right: 20,
                    left: 0,
                    bottom: 10,
                  }}
                >
                  <CartesianGrid
                    stroke="rgba(255,255,255,0.08)"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="mes"
                    tick={{
                      fill: "#94a3b8",
                      fontSize: 12,
                    }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    allowDecimals={false}
                    tick={{
                      fill: "#94a3b8",
                      fontSize: 12,
                    }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend />

                  <Line
                    type="monotone"
                    dataKey="criadas"
                    name="Criadas"
                    stroke="#22d3ee"
                    strokeWidth={4}
                    dot={{
                      r: 4,
                      fill: "#22d3ee",
                    }}
                    activeDot={{ r: 7 }}
                  />

                  <Line
                    type="monotone"
                    dataKey="concluidas"
                    name="Concluídas"
                    stroke="#10b981"
                    strokeWidth={4}
                    dot={{
                      r: 4,
                      fill: "#10b981",
                    }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardGrafico>

            <section className="grid gap-6 xl:grid-cols-2">
              <CardGrafico
                titulo="Desempenho por colaborador"
                descricao="OS atribuídas, concluídas e pendentes."
                icon={<Users size={21} />}
              >
                {dadosColaboradores.length === 0 ? (
                  <MensagemSemDados text="Nenhuma OS possui responsável nos filtros aplicados." />
                ) : (
                  <ResponsiveContainer width="100%" height={390}>
                    <BarChart
                      data={dadosColaboradores}
                      layout="vertical"
                      margin={{
                        top: 5,
                        right: 20,
                        left: 35,
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
                        width={120}
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

                      <Legend />

                      <Bar
                        dataKey="atribuidas"
                        name="Atribuídas"
                        fill="#22d3ee"
                        radius={[0, 7, 7, 0]}
                      />

                      <Bar
                        dataKey="concluidas"
                        name="Concluídas"
                        fill="#10b981"
                        radius={[0, 7, 7, 0]}
                      />

                      <Bar
                        dataKey="pendentes"
                        name="Pendentes"
                        fill="#f97316"
                        radius={[0, 7, 7, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardGrafico>

              <CardGrafico
                titulo="Máquinas com mais ocorrências"
                descricao="Ranking dos equipamentos com maior número de OS."
                icon={<Wrench size={21} />}
              >
                {dadosMaquinas.length === 0 ? (
                  <MensagemSemDados text="Nenhuma máquina encontrada nos filtros aplicados." />
                ) : (
                  <ResponsiveContainer width="100%" height={390}>
                    <BarChart
                      data={dadosMaquinas}
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
                        dataKey="maquina"
                        width={150}
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

                      <Legend />

                      <Bar
                        dataKey="ocorrencias"
                        name="Ocorrências"
                        fill="#8b5cf6"
                        radius={[0, 7, 7, 0]}
                      />

                      <Bar
                        dataKey="concluidas"
                        name="Concluídas"
                        fill="#10b981"
                        radius={[0, 7, 7, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardGrafico>
            </section>

            <CardGrafico
              titulo="Cumprimento dos prazos"
              descricao="Situação das ordens em relação às datas previstas."
              icon={<Clock3 size={21} />}
            >
              <ResponsiveContainer width="100%" height={360}>
                <BarChart data={dadosPrazos}>
                  <CartesianGrid
                    stroke="rgba(255,255,255,0.08)"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="nome"
                    interval={0}
                    tick={{
                      fill: "#94a3b8",
                      fontSize: 11,
                    }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    allowDecimals={false}
                    tick={{
                      fill: "#94a3b8",
                      fontSize: 12,
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
                    dataKey="quantidade"
                    name="Quantidade"
                    fill="#22d3ee"
                    radius={[10, 10, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardGrafico>
          </>
        )}
      </div>
    </div>
  );
}

const inputClass =
  "h-14 w-full rounded-2xl border border-white/10 bg-[#050816] px-4 text-sm font-semibold text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20";

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
  destaque,
}: {
  titulo: string;
  valor: number | string;
  descricao: string;
  icon: ReactNode;
  destaque:
    | "cyan"
    | "emerald"
    | "blue"
    | "red"
    | "violet"
    | "orange";
}) {
  const estilos = {
    cyan: "border-cyan-400/20 bg-cyan-400/10 text-cyan-300",
    emerald:
      "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
    blue: "border-blue-400/20 bg-blue-400/10 text-blue-300",
    red: "border-red-400/20 bg-red-400/10 text-red-300",
    violet:
      "border-violet-400/20 bg-violet-400/10 text-violet-300",
    orange:
      "border-orange-400/20 bg-orange-400/10 text-orange-300",
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-[#080d1f] p-5 shadow-xl shadow-black/20">
      <div className="flex items-start justify-between gap-4">
        <div>
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

        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${estilos[destaque]}`}
        >
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

function MensagemSemDados({ text }: { text: string }) {
  return (
    <div className="flex h-[390px] items-center justify-center rounded-2xl border border-dashed border-white/10 bg-[#050816] px-6 text-center text-sm text-slate-500">
      {text}
    </div>
  );
}