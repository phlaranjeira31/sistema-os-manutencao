"use client";

import { FileDown } from "lucide-react";

type OSIndicadorPDF = {
  numero: number;
  setor: string;
  titulo: string;
  status: string;
  geradaEm: string;
  concluidaEm: string;
  responsavel: string;
};

export default function BotaoPDFIndicadoresOS({
  ordens,
}: {
  ordens: OSIndicadorPDF[];
}) {
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

    try {
      const logo = await carregarImagem("/logo.sequoia.png");
      doc.addImage(logo, "PNG", 14, 8, 32, 24);
    } catch {
      console.warn("Logo não carregada no PDF.");
    }

    doc.setFillColor(5, 8, 22);
    doc.rect(0, 0, 297, 34, "F");

    try {
      const logo = await carregarImagem("/logo.sequoia.png");
      doc.addImage(logo, "PNG", 14, 5, 35, 25);
    } catch {}

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Indicadores de Ordens de Serviço", 55, 15);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Total de OS: ${ordens.length}`, 55, 23);

    doc.setTextColor(0, 0, 0);

    let y = 48;

    doc.setFont("helvetica", "bold");
    doc.setFillColor(34, 211, 238);
    doc.rect(14, y - 7, 270, 10, "F");

    doc.text("Nº", 17, y);
    doc.text("Setor", 30, y);
    doc.text("Título", 62, y);
    doc.text("Status", 132, y);
    doc.text("Gerada em", 170, y);
    doc.text("Concluída em", 205, y);
    doc.text("Responsável", 245, y);

    y += 9;
    doc.setFont("helvetica", "normal");

    ordens.forEach((os, index) => {
      if (y > 190) {
        doc.addPage();

        doc.setFillColor(5, 8, 22);
        doc.rect(0, 0, 297, 24, "F");

        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text("Indicadores de Ordens de Serviço", 14, 15);

        doc.setTextColor(0, 0, 0);
        y = 36;

        doc.setFillColor(34, 211, 238);
        doc.rect(14, y - 7, 270, 10, "F");

        doc.text("Nº", 17, y);
        doc.text("Setor", 30, y);
        doc.text("Título", 62, y);
        doc.text("Status", 132, y);
        doc.text("Gerada em", 170, y);
        doc.text("Concluída em", 205, y);
        doc.text("Responsável", 245, y);

        y += 9;
        doc.setFont("helvetica", "normal");
      }

      if (index % 2 === 0) {
        doc.setFillColor(245, 247, 250);
      } else {
        doc.setFillColor(255, 255, 255);
      }

      doc.rect(14, y - 6, 270, 9, "F");

      doc.setTextColor(0, 0, 0);
      doc.text(String(os.numero), 17, y);
      doc.text(os.setor.slice(0, 16), 30, y);
      doc.text(os.titulo.slice(0, 34), 62, y);
      doc.text(os.status.slice(0, 18), 132, y);
      doc.text(os.geradaEm, 170, y);
      doc.text(os.concluidaEm, 205, y);
      doc.text(os.responsavel.slice(0, 22), 245, y);

      y += 9;
    });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text("Sistema de OS - Sequoia", 14, 202);

    doc.save("indicadores-os.pdf");
  }

  return (
    <button
      type="button"
      onClick={gerarPDF}
      className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl border border-cyan-400/30 bg-cyan-500/20 px-4 text-sm font-black text-cyan-200 transition hover:bg-cyan-400 hover:text-slate-950"
    >
      <FileDown size={18} />
      Gerar PDF
    </button>
  );
}