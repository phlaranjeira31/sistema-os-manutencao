"use client";

import Link from "next/link";
import { jsPDF } from "jspdf";

import AcoesPlanoPreventivo from "@/components/AcoesPlanoPreventivo";

import {
  Building2,
  CalendarClock,
  CalendarDays,
  Clock3,
  FileDown,
  Repeat2,
  ShieldAlert,
  Users,
  Wrench,
} from "lucide-react";

type Plano = {
  id: string;
  titulo: string;
  descricao: string;
  prioridade: string;
  frequencia: string;

  intervaloPersonalizadoDias?: number | null;

  dataInicio: Date | string;
  dataFim?: Date | string | null;

  duracaoEstimadaMinutos?: number | null;

  diasAntesAviso: number;

  ativo: boolean;
  gerarAutomaticamente: boolean;

  createdAt: Date | string;

  empresa?: {
    nome: string;
    sigla?: string | null;
  } | null;

  setor: {
    nome: string;
  };

  maquina?: {
    nome: string;
  } | null;

  criadoPor?: {
    nome: string;
    email?: string | null;
  } | null;

  responsaveis: Array<{
    user: {
      nome: string;
      email?: string | null;
    };
  }>;

  execucoes: Array<{
    id: string;

    dataProgramada: Date | string;

    status: string;

    duracaoEstimadaMinutos?: number | null;
  }>;

  _count?: {
    execucoes: number;
  };
};

function formatDate(
  date: Date | string | null | undefined
) {
  if (!date) {
    return "-";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
  }).format(new Date(date));
}

function formatarDuracao(
  minutos: number | null | undefined
) {
  if (!minutos || minutos <= 0) {
    return "Não informada";
  }

  const horas = Math.floor(minutos / 60);
  const restante = minutos % 60;

  if (horas > 0 && restante > 0) {
    return `${horas}h ${restante}min`;
  }

  if (horas > 0) {
    return `${horas}h`;
  }

  return `${restante}min`;
}

function frequenciaLabel(frequencia: string) {
  const map: Record<string, string> = {
    SEMANAL: "Semanal",
    QUINZENAL: "Quinzenal",
    MENSAL: "Mensal",
    BIMESTRAL: "Bimestral",
    TRIMESTRAL: "Trimestral",
    SEMESTRAL: "Semestral",
    ANUAL: "Anual",
    PERSONALIZADA: "Personalizada",
  };

  return map[frequencia] ?? frequencia;
}

function prioridadeLabel(prioridade: string) {
  const map: Record<string, string> = {
    BAIXA: "Baixa",
    MEDIA: "Média",
    ALTA: "Alta",
    URGENTE: "Urgente",
  };

  return map[prioridade] ?? prioridade;
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    PROGRAMADA: "Programada",
    PENDENTE: "Pendente",
    EM_EXECUCAO: "Em execução",
    CONCLUIDA: "Concluída",
    NAO_REALIZADA: "Não realizada",
    CANCELADA: "Cancelada",
  };

  return map[status] ?? status;
}

function limparNomeArquivo(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_ ]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();
}

function calcularSituacao(
  execucao: Plano["execucoes"][number] | undefined
) {
  if (!execucao) {
    return {
      texto: "Sem programação",
      classe:
        "border-slate-400/30 bg-slate-500/10 text-slate-300",
    };
  }

  if (execucao.status === "CONCLUIDA") {
    return {
      texto: "Concluída",
      classe:
        "border-emerald-400/30 bg-emerald-500/15 text-emerald-300",
    };
  }

  if (execucao.status === "CANCELADA") {
    return {
      texto: "Cancelada",
      classe:
        "border-slate-400/30 bg-slate-500/15 text-slate-300",
    };
  }

  if (execucao.status === "NAO_REALIZADA") {
    return {
      texto: "Não realizada",
      classe:
        "border-red-400/30 bg-red-500/15 text-red-300",
    };
  }

  if (execucao.status === "EM_EXECUCAO") {
    return {
      texto: "Em execução",
      classe:
        "border-violet-400/30 bg-violet-500/15 text-violet-300",
    };
  }

  const data = new Date(execucao.dataProgramada);

  const agora = new Date();

  const hoje = new Date(
    Date.UTC(
      agora.getUTCFullYear(),
      agora.getUTCMonth(),
      agora.getUTCDate()
    )
  );

  if (data < hoje) {
    return {
      texto: "Atrasada",
      classe:
        "border-red-400/40 bg-red-500/15 text-red-300",
    };
  }

  if (data.getTime() === hoje.getTime()) {
    return {
      texto: "Pendente",
      classe:
        "border-yellow-400/30 bg-yellow-500/15 text-yellow-300",
    };
  }

  return {
    texto: "Programada",
    classe:
      "border-cyan-400/30 bg-cyan-500/15 text-cyan-300",
  };
}

export default function CardPlanoPreventivo({
  plano,
}: {
  plano: Plano;
}) {
  const proxima = plano.execucoes[0];

  const situacao = calcularSituacao(proxima);

  const responsaveis =
    plano.responsaveis.length > 0
      ? plano.responsaveis
          .map((item) => item.user.nome)
          .join(", ")
      : "Não definido";

  function gerarPDF() {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const larguraPagina =
      doc.internal.pageSize.getWidth();

    const alturaPagina =
      doc.internal.pageSize.getHeight();

    const margemX = 10;
    const margemInferior = 9;
    const alturaCabecalho = 24;
    const inicioConteudo = 29;
    const larguraUtil =
      larguraPagina - margemX * 2;

    const img = new Image();

    img.src = "/logo.sequoia.png";

    type LinhaDescricao = {
      texto: string;
      vazia: boolean;
    };

    type CaixaMedida = {
      linhas: string[];
      altura: number;
    };

    type LayoutPDF = {
      fonteCorpo: number;
      fonteLabel: number;
      fonteSecao: number;
      alturaLinha: number;
      alturaSecao: number;
      espaco: number;
      padding: number;
      plano: CaixaMedida;
      empresa: CaixaMedida;
      setor: CaixaMedida;
      maquina: CaixaMedida;
      prioridade: CaixaMedida;
      periodicidade: CaixaMedida;
      duracao: CaixaMedida;
      linhasDescricao: LinhaDescricao[];
      alturaDescricao: number;
      responsaveisMedidos: string[][];
      alturaResponsaveis: number;
      alturaAssinatura: number;
      quantidadeLinhasAssinatura: number;
      alturaTotal: number;
    };

    function prepararDescricao(
      fonte: number,
      largura: number,
      alturaLinha: number
    ) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(fonte);

      const descricao =
        plano.descricao || "-";

      const originais = descricao
        .replace(/\r/g, "")
        .split("\n");

      const linhas: LinhaDescricao[] = [];
      let altura = 0;

      for (const original of originais) {
        if (original.trim().length === 0) {
          linhas.push({
            texto: "",
            vazia: true,
          });

          altura += alturaLinha * 0.58;
          continue;
        }

        const quebradas =
          doc.splitTextToSize(
            original,
            largura
          ) as string[];

        for (const texto of quebradas) {
          linhas.push({
            texto,
            vazia: false,
          });

          altura += alturaLinha;
        }
      }

      return {
        linhas,
        altura,
      };
    }

    function montarMedidas(
      fonteCorpo: number
    ): LayoutPDF {
      const fonteLabel = Math.max(
        4.2,
        fonteCorpo - 1.15
      );

      const fonteSecao = Math.max(
        5.2,
        fonteCorpo + 0.3
      );

      const alturaLinha =
        fonteCorpo * 0.405;

      const alturaLabel =
        fonteLabel * 0.38;

      const alturaSecao = Math.max(
        6,
        fonteSecao * 0.68
      );

      const espaco = Math.max(
        1.25,
        fonteCorpo * 0.12
      );

      const padding = Math.max(
        1.35,
        fonteCorpo * 0.13
      );

      const gapColunas = 3;

      const larguraMeia =
        (larguraUtil - gapColunas) / 2;

      function medirCaixa(
        valor: string,
        largura: number
      ): CaixaMedida {
        doc.setFont(
          "helvetica",
          "normal"
        );

        doc.setFontSize(
          fonteCorpo
        );

        const linhas =
          doc.splitTextToSize(
            valor || "-",
            largura - padding * 2
          ) as string[];

        const altura =
          padding +
          alturaLabel +
          0.7 +
          Math.max(1, linhas.length) *
            alturaLinha +
          padding;

        return {
          linhas,
          altura,
        };
      }

      const planoMedido = medirCaixa(
        plano.titulo,
        larguraUtil
      );

      const empresaMedida = medirCaixa(
        plano.empresa?.nome ??
          "Sequoia",
        larguraMeia
      );

      const setorMedido = medirCaixa(
        plano.setor.nome,
        larguraMeia
      );

      const maquinaMedida = medirCaixa(
        plano.maquina?.nome ??
          "Não definida",
        larguraMeia
      );

      const prioridadeMedida = medirCaixa(
        prioridadeLabel(
          plano.prioridade
        ),
        larguraMeia
      );

      const periodicidadeMedida = medirCaixa(
        frequenciaLabel(
          plano.frequencia
        ),
        larguraMeia
      );

      const duracaoMedida = medirCaixa(
        formatarDuracao(
          plano.duracaoEstimadaMinutos
        ),
        larguraMeia
      );

      const descricaoMedida =
        prepararDescricao(
          fonteCorpo,
          larguraUtil - padding * 2,
          alturaLinha
        );

      const nomesResponsaveis =
        plano.responsaveis.length > 0
          ? plano.responsaveis.map(
              (item) =>
                item.user.nome
            )
          : [
              "Responsável pela manutenção",
            ];

      const larguraResponsavel =
        larguraMeia - padding * 2;

      const responsaveisMedidos =
        nomesResponsaveis.map(
          (nome, index) => {
            doc.setFont(
              "helvetica",
              "normal"
            );

            doc.setFontSize(
              fonteCorpo
            );

            return doc.splitTextToSize(
              `${index + 1}. ${nome}`,
              larguraResponsavel
            ) as string[];
          }
        );

      let alturaResponsaveis = 0;

      for (
        let i = 0;
        i < responsaveisMedidos.length;
        i += 2
      ) {
        const esquerda =
          responsaveisMedidos[i]
            ?.length ?? 0;

        const direita =
          responsaveisMedidos[i + 1]
            ?.length ?? 0;

        alturaResponsaveis +=
          Math.max(
            1,
            esquerda,
            direita
          ) *
            alturaLinha +
          0.8;
      }

      const alturaAssinatura = Math.max(
        13.5,
        alturaLinha * 3.7
      );

      const quantidadeLinhasAssinatura =
        Math.max(
          1,
          Math.ceil(
            nomesResponsaveis.length / 2
          )
        );

      const alturaDados =
        alturaSecao +
        espaco +
        planoMedido.altura +
        espaco +
        Math.max(
          empresaMedida.altura,
          setorMedido.altura
        ) +
        espaco +
        Math.max(
          maquinaMedida.altura,
          prioridadeMedida.altura
        ) +
        espaco +
        Math.max(
          periodicidadeMedida.altura,
          duracaoMedida.altura
        );

      const alturaBlocoDescricao =
        espaco * 1.4 +
        alturaSecao +
        espaco +
        padding +
        descricaoMedida.altura +
        padding;

      const alturaBlocoResponsaveis =
        espaco * 1.4 +
        alturaSecao +
        espaco +
        padding +
        alturaResponsaveis +
        padding;

      const alturaBlocoAssinaturas =
        espaco * 1.4 +
        alturaSecao +
        espaco +
        quantidadeLinhasAssinatura *
          alturaAssinatura;

      const alturaTotal =
        alturaDados +
        alturaBlocoDescricao +
        alturaBlocoResponsaveis +
        alturaBlocoAssinaturas;

      return {
        fonteCorpo,
        fonteLabel,
        fonteSecao,
        alturaLinha,
        alturaSecao,
        espaco,
        padding,
        plano: planoMedido,
        empresa: empresaMedida,
        setor: setorMedido,
        maquina: maquinaMedida,
        prioridade: prioridadeMedida,
        periodicidade: periodicidadeMedida,
        duracao: duracaoMedida,
        linhasDescricao:
          descricaoMedida.linhas,
        alturaDescricao:
          descricaoMedida.altura,
        responsaveisMedidos,
        alturaResponsaveis,
        alturaAssinatura,
        quantidadeLinhasAssinatura,
        alturaTotal,
      };
    }

    function escolherLayout() {
      const alturaDisponivel =
        alturaPagina -
        inicioConteudo -
        margemInferior;

      for (
        let fonte = 10.5;
        fonte >= 3.5;
        fonte -= 0.25
      ) {
        const layout =
          montarMedidas(fonte);

        if (
          layout.alturaTotal <=
          alturaDisponivel
        ) {
          return layout;
        }
      }

      return montarMedidas(3.25);
    }

    function desenharPDF(
      comLogo: boolean
    ) {
      const layout =
        escolherLayout();

      const {
        fonteCorpo,
        fonteLabel,
        fonteSecao,
        alturaLinha,
        alturaSecao,
        espaco,
        padding,
      } = layout;

      const gapColunas = 3;

      const larguraMeia =
        (larguraUtil - gapColunas) / 2;

      let y = inicioConteudo;

      doc.setFillColor(5, 8, 22);
      doc.rect(
        0,
        0,
        larguraPagina,
        alturaCabecalho,
        "F"
      );

      if (comLogo) {
        doc.addImage(
          img,
          "PNG",
          margemX,
          4,
          17,
          17
        );
      }

      const inicioTexto =
        comLogo
          ? 32
          : margemX;

      doc.setFont(
        "helvetica",
        "bold"
      );

      doc.setFontSize(13.5);

      doc.setTextColor(
        255,
        255,
        255
      );

      doc.text(
        "PLANO DE MANUTENÇÃO PREVENTIVA",
        inicioTexto,
        11
      );

      doc.setFont(
        "helvetica",
        "normal"
      );

      doc.setFontSize(7.5);

      doc.setTextColor(
        190,
        200,
        215
      );

      doc.text(
        "Sistema de Manutenção - Sequoia",
        inicioTexto,
        17
      );

      doc.setDrawColor(
        34,
        211,
        238
      );

      doc.setLineWidth(0.8);

      doc.line(
        inicioTexto,
        20,
        larguraPagina - margemX,
        20
      );

      function secao(
        titulo: string
      ) {
        doc.setFillColor(
          225,
          247,
          250
        );

        doc.roundedRect(
          margemX,
          y,
          larguraUtil,
          alturaSecao,
          1.5,
          1.5,
          "F"
        );

        doc.setFont(
          "helvetica",
          "bold"
        );

        doc.setFontSize(
          fonteSecao
        );

        doc.setTextColor(
          8,
          100,
          120
        );

        doc.text(
          titulo.toUpperCase(),
          margemX + 3,
          y + alturaSecao * 0.68
        );

        y += alturaSecao + espaco;
      }

      function caixa(
        x: number,
        largura: number,
        label: string,
        medida: CaixaMedida
      ) {
        doc.setFillColor(
          248,
          250,
          252
        );

        doc.setDrawColor(
          226,
          232,
          240
        );

        doc.setLineWidth(0.2);

        doc.roundedRect(
          x,
          y,
          largura,
          medida.altura,
          1.5,
          1.5,
          "FD"
        );

        doc.setFont(
          "helvetica",
          "bold"
        );

        doc.setFontSize(
          fonteLabel
        );

        doc.setTextColor(
          100,
          116,
          139
        );

        doc.text(
          label.toUpperCase(),
          x + padding,
          y + padding +
            fonteLabel * 0.31
        );

        doc.setFont(
          "helvetica",
          "bold"
        );

        doc.setFontSize(
          fonteCorpo
        );

        doc.setTextColor(
          15,
          23,
          42
        );

        const yValor =
          y +
          padding +
          fonteLabel * 0.38 +
          1.2 +
          alturaLinha * 0.72;

        doc.text(
          medida.linhas,
          x + padding,
          yValor,
          {
            lineHeightFactor: 1.02,
          }
        );
      }

      secao("Dados do plano");

      caixa(
        margemX,
        larguraUtil,
        "Plano",
        layout.plano
      );

      y +=
        layout.plano.altura +
        espaco;

      caixa(
        margemX,
        larguraMeia,
        "Empresa",
        layout.empresa
      );

      caixa(
        margemX +
          larguraMeia +
          gapColunas,
        larguraMeia,
        "Setor",
        layout.setor
      );

      y +=
        Math.max(
          layout.empresa.altura,
          layout.setor.altura
        ) +
        espaco;

      caixa(
        margemX,
        larguraMeia,
        "Máquina",
        layout.maquina
      );

      caixa(
        margemX +
          larguraMeia +
          gapColunas,
        larguraMeia,
        "Prioridade",
        layout.prioridade
      );

      y +=
        Math.max(
          layout.maquina.altura,
          layout.prioridade.altura
        ) +
        espaco;

      caixa(
        margemX,
        larguraMeia,
        "Periodicidade",
        layout.periodicidade
      );

      caixa(
        margemX +
          larguraMeia +
          gapColunas,
        larguraMeia,
        "Duração estimada",
        layout.duracao
      );

      y +=
        Math.max(
          layout.periodicidade.altura,
          layout.duracao.altura
        ) +
        espaco * 1.4;

      secao(
        "Descrição da preventiva"
      );

      doc.setFont(
        "helvetica",
        "normal"
      );

      doc.setFontSize(
        fonteCorpo
      );

      doc.setTextColor(
        20,
        30,
        45
      );

      y += padding;

      for (
        const linha of layout.linhasDescricao
      ) {
        if (linha.vazia) {
          y += alturaLinha * 0.58;
          continue;
        }

        doc.text(
          linha.texto,
          margemX + padding,
          y + alturaLinha * 0.72
        );

        y += alturaLinha;
      }

      y +=
        padding +
        espaco * 1.4;

      secao(
        "Colaboradores responsáveis"
      );

      y += padding;

      const larguraResp =
        larguraMeia - padding * 2;

      for (
        let i = 0;
        i < layout.responsaveisMedidos.length;
        i += 2
      ) {
        const esquerda =
          layout.responsaveisMedidos[i];

        const direita =
          layout.responsaveisMedidos[i + 1];

        const alturaLinhaResp =
          Math.max(
            esquerda?.length ?? 0,
            direita?.length ?? 0,
            1
          ) *
            alturaLinha +
          0.8;

        doc.setFont(
          "helvetica",
          "normal"
        );

        doc.setFontSize(
          fonteCorpo
        );

        doc.setTextColor(
          20,
          30,
          45
        );

        if (esquerda) {
          doc.text(
            esquerda,
            margemX + padding,
            y + alturaLinha * 0.72,
            {
              maxWidth:
                larguraResp,
              lineHeightFactor: 1,
            }
          );
        }

        if (direita) {
          doc.text(
            direita,
            margemX +
              larguraMeia +
              gapColunas +
              padding,
            y + alturaLinha * 0.72,
            {
              maxWidth:
                larguraResp,
              lineHeightFactor: 1,
            }
          );
        }

        y += alturaLinhaResp;
      }

      y +=
        padding +
        espaco * 1.4;

      secao("Assinaturas");

      const nomes =
        plano.responsaveis.length > 0
          ? plano.responsaveis.map(
              (item) =>
                item.user.nome
            )
          : [
              "Responsável pela manutenção",
            ];

      const larguraAssinatura =
        (larguraUtil - gapColunas) / 2;

      for (
        let i = 0;
        i < nomes.length;
        i += 2
      ) {
        const nomesLinha =
          nomes.slice(i, i + 2);

        nomesLinha.forEach(
          (nome, coluna) => {
            const x =
              margemX +
              coluna *
                (larguraAssinatura +
                  gapColunas);

            const yLinha =
              y +
              layout.alturaAssinatura *
                0.52;

            doc.setDrawColor(
              90,
              100,
              115
            );

            doc.setLineWidth(0.35);

            doc.line(
              x,
              yLinha,
              x + larguraAssinatura,
              yLinha
            );

            doc.setFont(
              "helvetica",
              "bold"
            );

            doc.setFontSize(
              fonteCorpo
            );

            doc.setTextColor(
              20,
              30,
              45
            );

            const nomeQuebrado =
              doc.splitTextToSize(
                nome,
                larguraAssinatura - 4
              ) as string[];

            doc.text(
              nomeQuebrado,
              x +
                larguraAssinatura / 2,
              yLinha +
                alturaLinha * 1.15,
              {
                align: "center",
                lineHeightFactor: 1,
              }
            );

            doc.setFont(
              "helvetica",
              "normal"
            );

            doc.setFontSize(
              fonteLabel
            );

            doc.setTextColor(
              95,
              105,
              120
            );

            doc.text(
              "Assinatura / data",
              x +
                larguraAssinatura / 2,
              y +
                layout.alturaAssinatura -
                1.3,
              {
                align: "center",
              }
            );
          }
        );

        y +=
          layout.alturaAssinatura;
      }

      const nome =
        limparNomeArquivo(
          plano.titulo
        ) || plano.id;

      doc.save(
        `plano-preventivo-${nome}.pdf`
      );
    }

    img.onload = () =>
      desenharPDF(true);

    img.onerror = () =>
      desenharPDF(false);
  }
  return (
    <article className="flex flex-col rounded-2xl border border-cyan-400/20 bg-white/[0.04] p-3 shadow-lg shadow-black/15 transition hover:border-cyan-400/40">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="mb-1.5 inline-flex items-center gap-1.5 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-cyan-300">
            <Repeat2 size={10} />
            Plano recorrente
          </div>

          <h2 className="line-clamp-2 text-base font-black leading-tight text-white">
            {plano.titulo}
          </h2>
        </div>

        <span
          className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-black ${situacao.classe}`}
        >
          {situacao.texto}
        </span>
      </div>

      <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-400">
        {plano.descricao}
      </p>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Info
          icon={<CalendarDays size={12} />}
          label="Próxima execução"
          value={
            proxima
              ? formatDate(
                  proxima.dataProgramada
                )
              : "-"
          }
        />

        <Info
          icon={<Repeat2 size={12} />}
          label="Periodicidade"
          value={frequenciaLabel(
            plano.frequencia
          )}
        />

        <Info
          icon={<Clock3 size={12} />}
          label="Duração"
          value={formatarDuracao(
            plano.duracaoEstimadaMinutos
          )}
        />

        <Info
          icon={<CalendarClock size={12} />}
          label="Prioridade"
          value={prioridadeLabel(
            plano.prioridade
          )}
        />

        <Info
          icon={<Building2 size={12} />}
          label="Setor"
          value={plano.setor.nome}
        />

        <Info
          icon={<Wrench size={12} />}
          label="Máquina"
          value={
            plano.maquina?.nome ??
            "Não definida"
          }
        />

        <Info
          icon={<Users size={12} />}
          label="Responsáveis"
          value={responsaveis}
        />

        <Info
          icon={<ShieldAlert size={12} />}
          label="Aviso"
          value={`${plano.diasAntesAviso} dia(s) antes`}
        />
      </div>

      <div className="mt-2.5 rounded-xl border border-white/10 bg-[#050816] px-2.5 py-2">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">
              Programação
            </p>

            <p className="mt-0.5 text-xs font-black text-white">
              {plano._count?.execucoes ?? 0} execução(ões)
            </p>
          </div>

          <span
            className={
              plano.ativo
                ? "text-[10px] font-black text-emerald-300"
                : "text-[10px] font-black text-red-300"
            }
          >
            {plano.ativo
              ? "Plano ativo"
              : "Plano inativo"}
          </span>
        </div>
      </div>

      <div
        className={`mt-2.5 grid gap-2 ${
          proxima
            ? "grid-cols-2"
            : "grid-cols-1"
        }`}
      >
        <button
          type="button"
          onClick={gerarPDF}
          className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-2 text-[11px] font-black text-emerald-300 transition hover:bg-emerald-400 hover:text-slate-950"
        >
          <FileDown size={14} />
          Gerar PDF
        </button>

        {proxima && (
          <Link
            href={`/admin/os/preventivas/execucoes/${proxima.id}`}
            className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-2 text-[11px] font-black text-cyan-300 transition hover:bg-cyan-400 hover:text-slate-950"
          >
            <Wrench size={14} />
            Abrir execução
          </Link>
        )}
      </div>

      <div className="mt-2">
        <AcoesPlanoPreventivo
          planoId={plano.id}
          titulo={plano.titulo}
        />
      </div>
    </article>
  );
}

function Info({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-white/10 bg-[#050816] p-2">
      <div className="flex items-center gap-1.5 text-slate-500">
        {icon}

        <span className="truncate text-[9px] font-bold uppercase tracking-wide">
          {label}
        </span>
      </div>

      <p className="mt-0.5 line-clamp-1 break-words text-xs font-bold text-white">
        {value}
      </p>
    </div>
  );
}
