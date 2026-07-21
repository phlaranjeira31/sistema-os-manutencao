"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { jsPDF } from "jspdf";
import {
  Building2,
  CalendarClock,
  FileDown,
  Pencil,
  ShieldAlert,
  Users,
  Wrench,
} from "lucide-react";
import BotaoExcluirPreventiva from "@/components/BotaoExcluirPreventiva";

type Preventiva = {
  id: string;
  titulo: string;
  descricao: string | null;
  dataAgendada: Date | string;
  diasAntesAviso: number;
  prioridade: string | null;
  status?: string | null;

  setor?: {
    nome: string;
  } | null;

  maquina?: {
    nome: string;
  } | null;

  responsaveis?: Array<{
    user: {
      nome: string;
      email?: string | null;
    };
  }>;
};

function formatDate(date: Date | string | null | undefined) {
  if (!date) return "-";

  return new Intl.DateTimeFormat("pt-BR").format(
    new Date(date)
  );
}

function prioridadeLabel(
  prioridade: string | null | undefined
) {
  const map: Record<string, string> = {
    BAIXA: "Baixa",
    MEDIA: "Média",
    ALTA: "Alta",
    URGENTE: "Urgente",
  };

  return map[prioridade ?? ""] ?? prioridade ?? "-";
}

function statusLabel(status: string | null | undefined) {
  const map: Record<string, string> = {
    PENDENTE: "Pendente",
    FEITA: "Feita",
    NAO_FEITA: "Não feita",
  };

  return map[status ?? ""] ?? "Pendente";
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

export default function CardPreventiva({
  preventiva,
}: {
  preventiva: Preventiva;
}) {
  const router = useRouter();

  const responsaveis =
    preventiva.responsaveis?.map(
      (responsavel) => responsavel.user
    ) ?? [];

  const nomesResponsaveis =
    responsaveis.length > 0
      ? responsaveis
          .map((responsavel) => responsavel.nome)
          .join(", ")
      : "Não definido";

  async function alterarStatus(status: string) {
    const res = await fetch(
      `/api/admin/os/preventivas/${preventiva.id}/status`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      }
    );

    if (!res.ok) {
      const data = await res.json().catch(() => null);

      alert(
        data?.error || "Erro ao atualizar status."
      );

      return;
    }

    router.refresh();
  }

  function gerarPDF() {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const img = new Image();
    img.src = "/logo.sequoia.png";

    function montarPDF(comLogo: boolean) {
      const larguraPagina =
        doc.internal.pageSize.getWidth();

      const alturaPagina =
        doc.internal.pageSize.getHeight();

      const margem = 14;
      const larguraUtil = larguraPagina - margem * 2;

      let y = 48;

      function adicionarCabecalho() {
        doc.setFillColor(5, 8, 22);
        doc.rect(0, 0, larguraPagina, 38, "F");

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

        const inicioTexto = comLogo ? 47 : margem;

        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(17);

        doc.text(
          "ORDEM DE SERVIÇO PREVENTIVA",
          inicioTexto,
          17
        );

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(190, 200, 215);

        doc.text(
          "Sistema de Manutenção - Sequoia",
          inicioTexto,
          24
        );

        doc.setDrawColor(34, 211, 238);
        doc.setLineWidth(1.2);
        doc.line(
          inicioTexto,
          29,
          larguraPagina - margem,
          29
        );

        doc.setTextColor(20, 30, 45);
      }

      function novaPaginaSePrecisar(
        espacoNecessario: number
      ) {
        if (
          y + espacoNecessario >
          alturaPagina - 22
        ) {
          doc.addPage();

          doc.setFillColor(5, 8, 22);
          doc.rect(0, 0, larguraPagina, 18, "F");

          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          doc.setTextColor(255, 255, 255);

          doc.text(
            "OS PREVENTIVA - CONTINUAÇÃO",
            margem,
            12
          );

          doc.setTextColor(20, 30, 45);

          y = 28;
        }
      }

      function adicionarTituloSecao(titulo: string) {
        novaPaginaSePrecisar(15);

        doc.setFillColor(225, 247, 250);
        doc.roundedRect(
          margem,
          y,
          larguraUtil,
          9,
          2,
          2,
          "F"
        );

        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(8, 100, 120);

        doc.text(titulo.toUpperCase(), margem + 4, y + 6);

        doc.setTextColor(20, 30, 45);

        y += 14;
      }

      function adicionarCampo(
        label: string,
        value: string
      ) {
        const valor = value || "-";

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);

        const linhas = doc.splitTextToSize(
          valor,
          larguraUtil - 50
        ) as string[];

        const alturaCampo = Math.max(
          8,
          linhas.length * 5 + 3
        );

        novaPaginaSePrecisar(alturaCampo);

        doc.setFont("helvetica", "bold");
        doc.setTextColor(55, 65, 80);
        doc.text(`${label}:`, margem, y);

        doc.setFont("helvetica", "normal");
        doc.setTextColor(20, 30, 45);

        doc.text(
          linhas,
          margem + 47,
          y
        );

        y += alturaCampo;
      }

      function adicionarDescricao() {
        adicionarTituloSecao("Descrição da preventiva");

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(20, 30, 45);

        const linhas = doc.splitTextToSize(
          preventiva.descricao || "-",
          larguraUtil
        ) as string[];

        for (const linha of linhas) {
          novaPaginaSePrecisar(7);

          doc.text(linha, margem, y);
          y += 6;
        }

        y += 4;
      }

      function adicionarResponsaveis() {
        adicionarTituloSecao(
          "Colaboradores responsáveis"
        );

        if (responsaveis.length === 0) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(10);
          doc.setTextColor(80, 90, 105);

          doc.text(
            "Nenhum responsável definido.",
            margem,
            y
          );

          y += 10;
          return;
        }

        responsaveis.forEach(
          (responsavel, index) => {
            const identificacao = responsavel.email
              ? `${responsavel.nome} - ${responsavel.email}`
              : responsavel.nome;

            const linhas = doc.splitTextToSize(
              `${index + 1}. ${identificacao}`,
              larguraUtil
            ) as string[];

            const altura =
              Math.max(7, linhas.length * 5 + 2);

            novaPaginaSePrecisar(altura);

            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            doc.setTextColor(20, 30, 45);

            doc.text(linhas, margem, y);

            y += altura;
          }
        );

        y += 4;
      }

      function adicionarAssinaturas() {
        adicionarTituloSecao(
          "Assinaturas dos responsáveis"
        );

        const assinaturas =
          responsaveis.length > 0
            ? responsaveis.map(
                (responsavel) =>
                  responsavel.nome
              )
            : ["Responsável pela manutenção"];

        const espacoEntreColunas = 10;

        const larguraAssinatura =
          (larguraUtil - espacoEntreColunas) / 2;

        for (
          let index = 0;
          index < assinaturas.length;
          index += 2
        ) {
          novaPaginaSePrecisar(39);

          const nomesLinha = assinaturas.slice(
            index,
            index + 2
          );

          nomesLinha.forEach(
            (nome, coluna) => {
              const x =
                margem +
                coluna *
                  (larguraAssinatura +
                    espacoEntreColunas);

              doc.setDrawColor(90, 100, 115);
              doc.setLineWidth(0.4);

              doc.line(
                x,
                y + 20,
                x + larguraAssinatura,
                y + 20
              );

              doc.setFont("helvetica", "bold");
              doc.setFontSize(9);
              doc.setTextColor(20, 30, 45);

              const nomeQuebrado =
                doc.splitTextToSize(
                  nome,
                  larguraAssinatura - 4
                ) as string[];

              doc.text(
                nomeQuebrado,
                x + larguraAssinatura / 2,
                y + 26,
                {
                  align: "center",
                }
              );

              doc.setFont("helvetica", "normal");
              doc.setFontSize(8);
              doc.setTextColor(95, 105, 120);

              doc.text(
                "Assinatura / data",
                x + larguraAssinatura / 2,
                y + 34,
                {
                  align: "center",
                }
              );
            }
          );

          y += 39;
        }
      }

      function adicionarRodapes() {
        const quantidadePaginas =
          doc.getNumberOfPages();

        for (
          let pagina = 1;
          pagina <= quantidadePaginas;
          pagina++
        ) {
          doc.setPage(pagina);

          doc.setDrawColor(210, 215, 225);
          doc.setLineWidth(0.3);

          doc.line(
            margem,
            alturaPagina - 16,
            larguraPagina - margem,
            alturaPagina - 16
          );

          doc.setFont("helvetica", "normal");
          doc.setFontSize(7.5);
          doc.setTextColor(115, 125, 140);

          doc.text(
            `Gerado em ${new Date().toLocaleString(
              "pt-BR"
            )}`,
            margem,
            alturaPagina - 10
          );

          doc.text(
            `Página ${pagina} de ${quantidadePaginas}`,
            larguraPagina - margem,
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
      }

      adicionarCabecalho();

      adicionarTituloSecao(
        "Identificação da preventiva"
      );

      adicionarCampo(
        "Título",
        preventiva.titulo
      );

      adicionarCampo(
        "Setor",
        preventiva.setor?.nome ?? "-"
      );

      adicionarCampo(
        "Máquina",
        preventiva.maquina?.nome ??
          "Não definida"
      );

      adicionarCampo(
        "Data agendada",
        formatDate(preventiva.dataAgendada)
      );

      adicionarCampo(
        "Aviso",
        `${preventiva.diasAntesAviso} dia(s) antes`
      );

      adicionarCampo(
        "Prioridade",
        prioridadeLabel(
          preventiva.prioridade
        )
      );

      adicionarCampo(
        "Status",
        statusLabel(preventiva.status)
      );

      adicionarCampo(
        "Responsáveis",
        nomesResponsaveis
      );

      y += 3;

      adicionarDescricao();
      adicionarResponsaveis();
      adicionarAssinaturas();
      adicionarRodapes();

      const nomeArquivo =
        limparNomeArquivo(preventiva.titulo) ||
        preventiva.id;

      doc.save(
        `os-preventiva-${nomeArquivo}.pdf`
      );
    }

    img.onload = () => {
      montarPDF(true);
    };

    img.onerror = () => {
      montarPDF(false);
    };
  }

  return (
    <div className="flex min-h-[570px] flex-col rounded-3xl border border-white/10 bg-white/[0.04] p-4 shadow-xl shadow-black/20 transition hover:border-cyan-400/30">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-black text-cyan-300">
            {formatDate(preventiva.dataAgendada)}
          </p>

          <h2 className="mt-1 line-clamp-2 break-words text-lg font-black text-white">
            {preventiva.titulo}
          </h2>
        </div>

        <span
          className={`shrink-0 rounded-full border px-3 py-1 text-xs font-black ${
            preventiva.status === "FEITA"
              ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-300"
              : preventiva.status === "NAO_FEITA"
                ? "border-red-400/30 bg-red-500/15 text-red-300"
                : "border-yellow-400/30 bg-yellow-500/15 text-yellow-300"
          }`}
        >
          {statusLabel(preventiva.status)}
        </span>
      </div>

      <p className="line-clamp-3 min-h-[60px] text-sm leading-relaxed text-slate-400">
        {preventiva.descricao}
      </p>

      <div className="mt-4 grid gap-3">
        <Info
          icon={<Building2 size={15} />}
          label="Setor"
          value={preventiva.setor?.nome ?? "-"}
        />

        <Info
          icon={<Wrench size={15} />}
          label="Máquina"
          value={
            preventiva.maquina?.nome ??
            "Não definida"
          }
        />

        <Info
          icon={<Users size={15} />}
          label="Responsáveis"
          value={nomesResponsaveis}
        />

        <Info
          icon={<ShieldAlert size={15} />}
          label="Aviso"
          value={`${preventiva.diasAntesAviso} dia(s) antes`}
        />

        <Info
          icon={<CalendarClock size={15} />}
          label="Prioridade"
          value={prioridadeLabel(
            preventiva.prioridade
          )}
        />
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-[#050816] p-3">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">
          Status da preventiva
        </p>

        <select
          value={preventiva.status ?? "PENDENTE"}
          onChange={(event) =>
            alterarStatus(event.target.value)
          }
          className="w-full rounded-xl border border-white/10 bg-[#020617] px-3 py-3 text-sm font-bold text-white outline-none focus:border-cyan-400"
        >
          <option value="PENDENTE">
            Pendente
          </option>

          <option value="FEITA">
            Feita
          </option>

          <option value="NAO_FEITA">
            Não feita
          </option>
        </select>
      </div>

      <div className="mt-auto grid grid-cols-1 gap-3 pt-4 sm:grid-cols-3">
        <button
          type="button"
          onClick={gerarPDF}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 text-sm font-black text-emerald-300 transition hover:bg-emerald-400 hover:text-slate-950"
        >
          <FileDown size={16} />
          PDF
        </button>

        <Link
          href={`/admin/os/preventivas/${preventiva.id}/editar`}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-cyan-400/30 bg-cyan-500/10 px-4 text-sm font-black text-cyan-300 transition hover:bg-cyan-400 hover:text-slate-950"
        >
          <Pencil size={16} />
          Editar
        </Link>

        <BotaoExcluirPreventiva
          id={preventiva.id}
        />
      </div>
    </div>
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