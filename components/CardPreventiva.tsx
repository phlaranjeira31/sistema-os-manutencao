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
};

function formatDate(date: Date | string | null | undefined) {
  if (!date) return "-";
  return new Intl.DateTimeFormat("pt-BR").format(new Date(date));
}

function prioridadeLabel(prioridade: string | null | undefined) {
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

export default function CardPreventiva({
  preventiva,
}: {
  preventiva: Preventiva;
}) {
  const router = useRouter();

  async function alterarStatus(status: string) {
  const res = await fetch(`/api/admin/os/preventivas/${preventiva.id}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    alert(data?.error || "Erro ao atualizar status.");
    return;
  }

  router.refresh();
}

  function gerarPDF() {
    const doc = new jsPDF();

    const img = new Image();
    img.src = "/logo.sequoia.png";

    img.onload = () => {
      doc.addImage(img, "PNG", 14, 10, 30, 30);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("OS Preventiva", 50, 20);

      doc.setDrawColor(180);
      doc.line(14, 40, 195, 40);

      let y = 52;

      const novaPaginaSePrecisar = () => {
        if (y > 275) {
          doc.addPage();
          y = 20;
        }
      };

      const addLine = (label: string, value: string) => {
        novaPaginaSePrecisar();

        doc.setFont("helvetica", "bold");
        doc.text(`${label}:`, 14, y);

        doc.setFont("helvetica", "normal");
        doc.text(value || "-", 70, y);

        y += 9;
      };

      doc.setFontSize(12);

      addLine("Título", preventiva.titulo);
      addLine("Setor", preventiva.setor?.nome ?? "-");
      addLine("Data agendada", formatDate(preventiva.dataAgendada));
      addLine("Aviso", `${preventiva.diasAntesAviso} dia(s) antes`);
      addLine("Prioridade", prioridadeLabel(preventiva.prioridade));
      addLine("Status", statusLabel(preventiva.status));

      y += 6;
      novaPaginaSePrecisar();

      doc.setFont("helvetica", "bold");
      doc.text("Descrição", 14, y);
      y += 8;

      doc.setFont("helvetica", "normal");
      const linhas = doc.splitTextToSize(preventiva.descricao || "-", 180);

      linhas.forEach((linha: string) => {
        novaPaginaSePrecisar();
        doc.text(linha, 14, y);
        y += 7;
      });

      doc.setFontSize(10);
      doc.setTextColor(150);
      doc.text(`Gerado em ${new Date().toLocaleString("pt-BR")}`, 14, 290);

      doc.save(`os-preventiva-${preventiva.titulo}.pdf`);
    };
  }

  return (
    <div className="flex min-h-[470px] flex-col rounded-3xl border border-white/10 bg-white/[0.04] p-4 shadow-xl shadow-black/20 transition hover:border-cyan-400/30">
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
  className={`
    shrink-0 rounded-full px-3 py-1 text-xs font-black border
    ${
      preventiva.status === "FEITA"
        ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-300"
        : preventiva.status === "NAO_FEITA"
        ? "border-red-400/30 bg-red-500/15 text-red-300"
        : "border-yellow-400/30 bg-yellow-500/15 text-yellow-300"
    }
  `}
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
          icon={<ShieldAlert size={15} />}
          label="Aviso"
          value={`${preventiva.diasAntesAviso} dia(s) antes`}
        />

        <Info
          icon={<CalendarClock size={15} />}
          label="Prioridade"
          value={prioridadeLabel(preventiva.prioridade)}
        />
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-[#050816] p-3">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">
          Status da preventiva
        </p>

        <select
          value={preventiva.status ?? "PENDENTE"}
          onChange={(e) => alterarStatus(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-[#020617] px-3 py-3 text-sm font-bold text-white outline-none focus:border-cyan-400"
        >
          <option value="PENDENTE">Pendente</option>
          <option value="FEITA">Feita</option>
          <option value="NAO_FEITA">Não feita</option>
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

        <BotaoExcluirPreventiva id={preventiva.id} />
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

      <p className="mt-1 line-clamp-1 break-words text-sm font-bold text-white">
        {value}
      </p>
    </div>
  );
}