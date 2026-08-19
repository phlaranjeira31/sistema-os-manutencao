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

    const margem = 14;

    const larguraUtil =
      larguraPagina - margem * 2;

    let y = 48;

    const img = new Image();

    img.src = "/logo.sequoia.png";

    function novaPaginaSePrecisar(
      espaco: number
    ) {
      if (
        y + espaco >
        alturaPagina - 22
      ) {
        doc.addPage();

        doc.setFillColor(5, 8, 22);

        doc.rect(
          0,
          0,
          larguraPagina,
          18,
          "F"
        );

        doc.setTextColor(
          255,
          255,
          255
        );

        doc.setFont(
          "helvetica",
          "bold"
        );

        doc.setFontSize(10);

        doc.text(
          "PLANO PREVENTIVO - CONTINUAÇÃO",
          margem,
          12
        );

        y = 28;
      }
    }

    function tituloSecao(
      titulo: string
    ) {
      novaPaginaSePrecisar(16);

      doc.setFillColor(
        225,
        247,
        250
      );

      doc.roundedRect(
        margem,
        y,
        larguraUtil,
        9,
        2,
        2,
        "F"
      );

      doc.setFont(
        "helvetica",
        "bold"
      );

      doc.setFontSize(10);

      doc.setTextColor(
        8,
        100,
        120
      );

      doc.text(
        titulo.toUpperCase(),
        margem + 4,
        y + 6
      );

      y += 14;
    }

    function campo(
      label: string,
      value: string
    ) {
      const valor =
        value || "-";

      const linhas =
        doc.splitTextToSize(
          valor,
          larguraUtil - 55
        ) as string[];

      const altura =
        Math.max(
          8,
          linhas.length * 5 + 3
        );

      novaPaginaSePrecisar(
        altura
      );

      doc.setFont(
        "helvetica",
        "bold"
      );

      doc.setFontSize(9.5);

      doc.setTextColor(
        55,
        65,
        80
      );

      doc.text(
        `${label}:`,
        margem,
        y
      );

      doc.setFont(
        "helvetica",
        "normal"
      );

      doc.setTextColor(
        20,
        30,
        45
      );

      doc.text(
        linhas,
        margem + 52,
        y
      );

      y += altura;
    }

    function montarPDF(
      comLogo: boolean
    ) {
      doc.setFillColor(
        5,
        8,
        22
      );

      doc.rect(
        0,
        0,
        larguraPagina,
        38,
        "F"
      );

      if (comLogo) {
        doc.addImage(
          img,
          "PNG",
          margem,
          6,
          26,
          26
        );
      }

      const inicioTexto =
        comLogo
          ? 47
          : margem;

      doc.setFont(
        "helvetica",
        "bold"
      );

      doc.setFontSize(16);

      doc.setTextColor(
        255,
        255,
        255
      );

      doc.text(
        "PLANO DE MANUTENÇÃO PREVENTIVA",
        inicioTexto,
        16
      );

      doc.setFont(
        "helvetica",
        "normal"
      );

      doc.setFontSize(8.5);

      doc.setTextColor(
        190,
        200,
        215
      );

      doc.text(
        "Sistema de Manutenção - Sequoia",
        inicioTexto,
        23
      );

      doc.setDrawColor(
        34,
        211,
        238
      );

      doc.setLineWidth(1.1);

      doc.line(
        inicioTexto,
        29,
        larguraPagina -
          margem,
        29
      );

      doc.setTextColor(
        20,
        30,
        45
      );

      tituloSecao(
        "Identificação do plano"
      );

      campo(
        "Plano",
        plano.titulo
      );

      campo(
        "Empresa",
        plano.empresa?.nome ??
          "Sequoia"
      );

      campo(
        "Setor",
        plano.setor.nome
      );

      campo(
        "Máquina",
        plano.maquina?.nome ??
          "Não definida"
      );

      campo(
        "Prioridade",
        prioridadeLabel(
          plano.prioridade
        )
      );

      campo(
        "Periodicidade",
        frequenciaLabel(
          plano.frequencia
        )
      );

      campo(
        "Duração estimada",
        formatarDuracao(
          plano.duracaoEstimadaMinutos
        )
      );

      campo(
        "Primeira execução",
        formatDate(
          plano.dataInicio
        )
      );

      campo(
        "Encerramento",
        plano.dataFim
          ? formatDate(
              plano.dataFim
            )
          : "Sem data final"
      );

      campo(
        "Aviso",
        `${plano.diasAntesAviso} dia(s) antes`
      );

      campo(
        "Automação",
        plano.gerarAutomaticamente
          ? "Geração automática ativada"
          : "Geração automática desativada"
      );

      campo(
        "Status do plano",
        plano.ativo
          ? "Ativo"
          : "Inativo"
      );

      campo(
        "Criado por",
        plano.criadoPor?.nome ??
          "Não identificado"
      );

      campo(
        "Criado em",
        formatDate(
          plano.createdAt
        )
      );

      tituloSecao(
        "Descrição da preventiva"
      );

      const linhasDescricao =
        doc.splitTextToSize(
          plano.descricao ||
            "-",
          larguraUtil
        ) as string[];

      doc.setFont(
        "helvetica",
        "normal"
      );

      doc.setFontSize(10);

      doc.setTextColor(
        20,
        30,
        45
      );

      for (
        const linha of linhasDescricao
      ) {
        novaPaginaSePrecisar(
          7
        );

        doc.text(
          linha,
          margem,
          y
        );

        y += 6;
      }

      y += 5;

      tituloSecao(
        "Colaboradores responsáveis"
      );

      if (
        plano.responsaveis.length ===
        0
      ) {
        doc.setFont(
          "helvetica",
          "normal"
        );

        doc.setFontSize(10);

        doc.text(
          "Nenhum responsável definido.",
          margem,
          y
        );

        y += 10;
      } else {
        plano.responsaveis.forEach(
          (
            responsavel,
            index
          ) => {
            novaPaginaSePrecisar(
              8
            );

            const usuario =
              responsavel.user;

            const texto =
              usuario.email
                ? `${index + 1}. ${usuario.nome} - ${usuario.email}`
                : `${index + 1}. ${usuario.nome}`;

            const linhas =
              doc.splitTextToSize(
                texto,
                larguraUtil
              );

            doc.setFont(
              "helvetica",
              "normal"
            );

            doc.setFontSize(
              9.5
            );

            doc.text(
              linhas,
              margem,
              y
            );

            y +=
              linhas.length *
                5 +
              2;
          }
        );
      }

      y += 4;

      tituloSecao(
        "Cronograma programado"
      );

      if (
        plano.execucoes.length ===
        0
      ) {
        doc.text(
          "Nenhuma execução programada.",
          margem,
          y
        );

        y += 10;
      } else {
        plano.execucoes.forEach(
          (
            execucao,
            index
          ) => {
            novaPaginaSePrecisar(
              9
            );

            doc.setFont(
              "helvetica",
              "bold"
            );

            doc.setFontSize(9);

            doc.setTextColor(
              20,
              30,
              45
            );

            doc.text(
              `${index + 1}.`,
              margem,
              y
            );

            doc.setFont(
              "helvetica",
              "normal"
            );

            doc.text(
              formatDate(
                execucao.dataProgramada
              ),
              margem + 10,
              y
            );

            doc.text(
              statusLabel(
                execucao.status
              ),
              margem + 55,
              y
            );

            doc.text(
              formatarDuracao(
                execucao.duracaoEstimadaMinutos ??
                  plano.duracaoEstimadaMinutos
              ),
              margem + 115,
              y
            );

            y += 7;
          }
        );
      }

      y += 5;

      tituloSecao(
        "Assinaturas"
      );

      const nomes =
        plano.responsaveis.length >
        0
          ? plano.responsaveis.map(
              (item) =>
                item.user.nome
            )
          : [
              "Responsável pela manutenção",
            ];

      nomes.push(
        "Supervisor responsável"
      );

      for (
        let i = 0;
        i < nomes.length;
        i++
      ) {
        novaPaginaSePrecisar(
          32
        );

        doc.setDrawColor(
          90,
          100,
          115
        );

        doc.line(
          margem,
          y + 18,
          margem + 80,
          y + 18
        );

        doc.setFont(
          "helvetica",
          "bold"
        );

        doc.setFontSize(9);

        doc.text(
          nomes[i],
          margem + 40,
          y + 24,
          {
            align: "center",
          }
        );

        doc.setFont(
          "helvetica",
          "normal"
        );

        doc.setFontSize(8);

        doc.setTextColor(
          95,
          105,
          120
        );

        doc.text(
          "Assinatura / data",
          margem + 40,
          y + 29,
          {
            align: "center",
          }
        );

        y += 33;
      }

      const paginas =
        doc.getNumberOfPages();

      for (
        let pagina = 1;
        pagina <= paginas;
        pagina++
      ) {
        doc.setPage(
          pagina
        );

        doc.setDrawColor(
          210,
          215,
          225
        );

        doc.line(
          margem,
          alturaPagina - 16,
          larguraPagina -
            margem,
          alturaPagina - 16
        );

        doc.setFont(
          "helvetica",
          "normal"
        );

        doc.setFontSize(7.5);

        doc.setTextColor(
          115,
          125,
          140
        );

        doc.text(
          `Gerado em ${new Date().toLocaleString(
            "pt-BR"
          )}`,
          margem,
          alturaPagina - 10
        );

        doc.text(
          `Página ${pagina} de ${paginas}`,
          larguraPagina -
            margem,
          alturaPagina - 10,
          {
            align: "right",
          }
        );

        doc.text(
          "Desenvolvido por Pedro H. Laranjeira",
          larguraPagina / 2,
          alturaPagina - 6,
          {
            align: "center",
          }
        );
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
      montarPDF(true);

    img.onerror = () =>
      montarPDF(false);
  }

  return (
    <article className="flex min-h-[540px] flex-col rounded-3xl border border-cyan-400/20 bg-white/[0.04] p-4 shadow-xl shadow-black/20 transition hover:border-cyan-400/40">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-cyan-300">
            <Repeat2 size={12} />
            Plano recorrente
          </div>

          <h2 className="line-clamp-2 text-lg font-black text-white">
            {plano.titulo}
          </h2>
        </div>

        <span
          className={`shrink-0 rounded-full border px-3 py-1 text-xs font-black ${situacao.classe}`}
        >
          {situacao.texto}
        </span>
      </div>

      <p className="line-clamp-3 min-h-[60px] text-sm leading-relaxed text-slate-400">
        {plano.descricao}
      </p>

      <div className="mt-4 grid gap-3">
        <Info
          icon={<CalendarDays size={15} />}
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
          icon={<Repeat2 size={15} />}
          label="Periodicidade"
          value={frequenciaLabel(
            plano.frequencia
          )}
        />

        <Info
          icon={<Clock3 size={15} />}
          label="Duração estimada"
          value={formatarDuracao(
            plano.duracaoEstimadaMinutos
          )}
        />

        <Info
          icon={<Building2 size={15} />}
          label="Setor"
          value={plano.setor.nome}
        />

        <Info
          icon={<Wrench size={15} />}
          label="Máquina"
          value={
            plano.maquina?.nome ??
            "Não definida"
          }
        />

        <Info
          icon={<Users size={15} />}
          label="Responsáveis"
          value={responsaveis}
        />

        <Info
          icon={<ShieldAlert size={15} />}
          label="Aviso"
          value={`${plano.diasAntesAviso} dia(s) antes`}
        />

        <Info
          icon={<CalendarClock size={15} />}
          label="Prioridade"
          value={prioridadeLabel(
            plano.prioridade
          )}
        />
      </div>

      <div className="mt-auto space-y-3 pt-4">
        <div className="rounded-2xl border border-white/10 bg-[#050816] p-3">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
            Programação
          </p>

          <div className="mt-1 flex items-end justify-between gap-3">
            <p className="text-sm font-black text-white">
              {plano._count?.execucoes ?? 0} execução(ões)
            </p>

            <span
              className={
                plano.ativo
                  ? "text-xs font-black text-emerald-300"
                  : "text-xs font-black text-red-300"
              }
            >
              {plano.ativo
                ? "Plano ativo"
                : "Plano inativo"}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={gerarPDF}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 text-sm font-black text-emerald-300 transition hover:bg-emerald-400 hover:text-slate-950"
        >
          <FileDown size={17} />
          Gerar documento PDF
        </button>

        {proxima && (
          <Link
            href={`/admin/os/preventivas/execucoes/${proxima.id}`}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-cyan-400/30 bg-cyan-500/10 px-4 text-sm font-black text-cyan-300 transition hover:bg-cyan-400 hover:text-slate-950"
          >
            <Wrench size={17} />
            Abrir próxima execução
          </Link>
        )}

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
    <div className="rounded-2xl border border-white/10 bg-[#050816] p-3">
      <div className="flex items-center gap-2 text-slate-400">
        {icon}

        <span className="text-[11px] font-bold uppercase tracking-wide">
          {label}
        </span>
      </div>

      <p className="mt-1 line-clamp-2 break-words text-sm font-bold text-white">
        {value}
      </p>
    </div>
  );
}