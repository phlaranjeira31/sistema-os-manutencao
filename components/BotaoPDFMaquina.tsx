"use client";

import { FileDown } from "lucide-react";

type OrdemPDF = {
  numero: number;
  descricao: string;
  status: string;
  prioridade: string;
  criadaEm: string;
  concluidaEm: string;
  responsavel: string;
};

type Props = {
  maquina: string;
  setor: string;
  dataInicio?: string;
  dataFim?: string;
  total: number;
  naoIniciadas: number;
  emAndamento: number;
  concluidas: number;
  canceladas: number;
  taxaResolucao: number;
  tempoMedioHoras: number;
  ordens: OrdemPDF[];
};

export default function BotaoPDFMaquina({
  maquina,
  setor,
  dataInicio,
  dataFim,
  total,
  naoIniciadas,
  emAndamento,
  concluidas,
  canceladas,
  taxaResolucao,
  tempoMedioHoras,
  ordens,
}: Props) {
  async function carregarImagem(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = src;
      img.onload = () => resolve(img);
      img.onerror = reject;
    });
  }

  async function gerarPDF() {
    const jsPDF = (await import("jspdf")).default;

    const doc = new jsPDF("l", "mm", "a4");

    doc.setFillColor(5, 8, 22);
    doc.rect(0, 0, 297, 36, "F");

    try {
      const logo = await carregarImagem("/logo.sequoia.png");
      doc.addImage(logo, "PNG", 14, 5, 35, 25);
    } catch {
      console.warn("Logo não carregada no PDF.");
    }

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text(`Dashboard da máquina: ${maquina}`, 55, 15);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Setor: ${setor}`, 55, 23);

    const periodo =
      dataInicio || dataFim
        ? `Período: ${dataInicio || "início"} até ${dataFim || "hoje"}`
        : "Período: Todos os registros";

    doc.text(periodo, 55, 29);

    doc.setTextColor(0, 0, 0);

    const cards = [
      { label: "Total de OS", value: total },
      { label: "Não iniciadas", value: naoIniciadas },
      { label: "Em andamento", value: emAndamento },
      { label: "Concluídas", value: concluidas },
      { label: "Canceladas", value: canceladas },
      { label: "Resolução", value: `${taxaResolucao}%` },
      {
        label: "Tempo médio",
        value: `${tempoMedioHoras.toFixed(1)}h`,
      },
    ];

    const cardWidth = 36;
    const cardGap = 3;
    let cardX = 14;

    cards.forEach((card) => {
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(cardX, 43, cardWidth, 24, 3, 3, "F");

      doc.setTextColor(90, 100, 115);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text(card.label, cardX + 3, 51);

      doc.setTextColor(5, 8, 22);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(15);
      doc.text(String(card.value), cardX + 3, 62);

      cardX += cardWidth + cardGap;
    });

    let y = 82;

    doc.setFillColor(34, 211, 238);
    doc.rect(14, y - 7, 270, 10, "F");

    doc.setTextColor(5, 8, 22);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);

    doc.text("Nº", 17, y);
    doc.text("Descrição", 30, y);
    doc.text("Status", 115, y);
    doc.text("Prioridade", 150, y);
    doc.text("Criada em", 180, y);
    doc.text("Concluída em", 215, y);
    doc.text("Responsável", 250, y);

    y += 9;

    if (ordens.length === 0) {
      doc.setTextColor(90, 100, 115);
      doc.setFont("helvetica", "normal");
      doc.text("Nenhuma OS encontrada no período selecionado.", 14, y + 10);
    } else {
      ordens.forEach((os, index) => {
        if (y > 190) {
          doc.addPage();

          doc.setFillColor(5, 8, 22);
          doc.rect(0, 0, 297, 24, "F");

          doc.setTextColor(255, 255, 255);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(14);
          doc.text(`Dashboard da máquina: ${maquina}`, 14, 15);

          y = 36;

          doc.setFillColor(34, 211, 238);
          doc.rect(14, y - 7, 270, 10, "F");

          doc.setTextColor(5, 8, 22);
          doc.setFontSize(9);

          doc.text("Nº", 17, y);
          doc.text("Descrição", 30, y);
          doc.text("Status", 115, y);
          doc.text("Prioridade", 150, y);
          doc.text("Criada em", 180, y);
          doc.text("Concluída em", 215, y);
          doc.text("Responsável", 250, y);

          y += 9;
        }

        doc.setFillColor(
          index % 2 === 0 ? 245 : 255,
          index % 2 === 0 ? 247 : 255,
          index % 2 === 0 ? 250 : 255
        );

        doc.rect(14, y - 6, 270, 9, "F");

        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);

        doc.text(String(os.numero), 17, y);
        doc.text(os.descricao.slice(0, 48), 30, y);
        doc.text(os.status.slice(0, 18), 115, y);
        doc.text(os.prioridade.slice(0, 12), 150, y);
        doc.text(os.criadaEm, 180, y);
        doc.text(os.concluidaEm, 215, y);
        doc.text(os.responsavel.slice(0, 20), 250, y);

        y += 9;
      });
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text("Sistema de OS - Sequoia", 14, 202);

    const nomeArquivo = maquina
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-");

    doc.save(`dashboard-${nomeArquivo}.pdf`);
  }

  return (
    <button
      type="button"
      onClick={gerarPDF}
      className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl border border-cyan-400/30 bg-cyan-500/20 px-5 text-sm font-black text-cyan-200 transition hover:bg-cyan-400 hover:text-slate-950 sm:w-auto"
    >
      <FileDown size={18} />
      Gerar PDF
    </button>
  );
}