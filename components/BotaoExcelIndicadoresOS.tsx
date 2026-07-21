"use client";

import { FileSpreadsheet } from "lucide-react";

type OSIndicadorExcel = {
  numero: number;
  setor: string;
  titulo: string;
  descricao: string;
  status: string;
  geradaEm: string;
  concluidaEm: string;
  responsavel: string;
};

type FiltrosIndicadores = {
  dataInicio: string;
  dataFim: string;
  status: string;
  colaborador: string;
  setor: string;
};

export default function BotaoExcelIndicadoresOS({
  ordens,
  filtros,
}: {
  ordens: OSIndicadorExcel[];
  filtros: FiltrosIndicadores;
}) {
  async function gerarExcel() {
    const XLSX = await import("xlsx");

    const dadosOrdens = ordens.map((os) => ({
      "Nº da OS": os.numero,
      Setor: os.setor,
      Título: os.titulo,
      Descrição: os.descricao,
      Status: os.status,
      "Gerada em": os.geradaEm,
      "Concluída em": os.concluidaEm,
      Responsável: os.responsavel,
    }));

    const totalConcluidas = ordens.filter(
      (os) => os.status === "Concluída"
    ).length;

    const totalCanceladas = ordens.filter(
      (os) => os.status === "Cancelada"
    ).length;

    const totalPendentes = ordens.filter(
      (os) =>
        os.status === "Não iniciada" ||
        os.status === "Em andamento"
    ).length;

    const dadosResumo = [
      ["Indicadores de Ordens de Serviço"],
      [],
      ["Gerado em", new Date().toLocaleString("pt-BR")],
      ["Data inicial", filtros.dataInicio],
      ["Data final", filtros.dataFim],
      ["Status", filtros.status],
      ["Setor", filtros.setor],
      ["Colaborador", filtros.colaborador],
      [],
      ["Total de OS", ordens.length],
      ["Concluídas", totalConcluidas],
      ["Pendentes", totalPendentes],
      ["Canceladas", totalCanceladas],
      [],
      ["Desenvolvido por", "Pedro H. Laranjeira"],
    ];

    const planilhaOrdens =
      XLSX.utils.json_to_sheet(dadosOrdens);

    const planilhaResumo =
      XLSX.utils.aoa_to_sheet(dadosResumo);

    planilhaOrdens["!cols"] = [
      { wch: 12 },
      { wch: 24 },
      { wch: 40 },
      { wch: 70 },
      { wch: 20 },
      { wch: 16 },
      { wch: 16 },
      { wch: 35 },
    ];

    planilhaResumo["!cols"] = [
      { wch: 24 },
      { wch: 50 },
    ];

    if (planilhaOrdens["!ref"]) {
      planilhaOrdens["!autofilter"] = {
        ref: planilhaOrdens["!ref"],
      };
    }

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      planilhaResumo,
      "Resumo"
    );

    XLSX.utils.book_append_sheet(
      workbook,
      planilhaOrdens,
      "Ordens de Serviço"
    );

    const dataArquivo = new Date()
      .toISOString()
      .slice(0, 10);

    XLSX.writeFile(
      workbook,
      `indicadores-os-${dataArquivo}.xlsx`
    );
  }

  return (
    <button
      type="button"
      onClick={gerarExcel}
      className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl border border-emerald-400/30 bg-emerald-500/20 px-4 text-sm font-black text-emerald-200 transition hover:bg-emerald-400 hover:text-slate-950"
    >
      <FileSpreadsheet size={18} />
      Gerar Excel
    </button>
  );
}