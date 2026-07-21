"use client";

import { FileDown } from "lucide-react";

type OSIndicadorPDF = {
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

export default function BotaoPDFIndicadoresOS({
  ordens,
  filtros,
}: {
  ordens: OSIndicadorPDF[];
  filtros: FiltrosIndicadores;
}) {
  async function carregarImagem(
    src: string
  ): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();

      img.src = src;
      img.onload = () => resolve(img);
      img.onerror = reject;
    });
  }

  async function gerarPDF() {
    const jsPDF = (await import("jspdf")).default;
    const autoTable = (await import("jspdf-autotable")).default;

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    const larguraPagina = doc.internal.pageSize.getWidth();
    const alturaPagina = doc.internal.pageSize.getHeight();

    let logo: HTMLImageElement | null = null;

    try {
      logo = await carregarImagem("/logo.sequoia.png");
    } catch {
      console.warn("Logo não carregada no PDF.");
    }

    function desenharCabecalho() {
      doc.setFillColor(5, 8, 22);
      doc.rect(0, 0, larguraPagina, 42, "F");

      if (logo) {
        doc.addImage(logo, "PNG", 12, 6, 32, 24);
      }

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("Indicadores de Ordens de Serviço", 50, 15);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(203, 213, 225);

      doc.text(
        `Gerado em: ${new Date().toLocaleString("pt-BR")}`,
        50,
        22
      );

      const resumoFiltros =
        `Período: ${filtros.dataInicio} até ${filtros.dataFim}  |  ` +
        `Status: ${filtros.status}  |  ` +
        `Setor: ${filtros.setor}  |  ` +
        `Colaborador: ${filtros.colaborador}`;

      const linhasFiltros = doc.splitTextToSize(
        resumoFiltros,
        larguraPagina - 24
      );

      doc.text(linhasFiltros, 12, 34);
    }

    const linhasTabela =
      ordens.length > 0
        ? ordens.map((os) => [
            String(os.numero),
            os.setor,
            os.titulo,
            os.descricao,
            os.status,
            os.geradaEm,
            os.concluidaEm,
            os.responsavel,
          ])
        : [
            [
              "-",
              "-",
              "-",
              "Nenhuma OS encontrada com os filtros selecionados.",
              "-",
              "-",
              "-",
              "-",
            ],
          ];

    autoTable(doc, {
      startY: 48,

      margin: {
        top: 48,
        right: 12,
        bottom: 18,
        left: 12,
      },

      head: [
        [
          "Nº",
          "Setor",
          "Título",
          "Descrição",
          "Status",
          "Gerada em",
          "Concluída em",
          "Responsável",
        ],
      ],

      body: linhasTabela,
      theme: "grid",
      showHead: "everyPage",
      pageBreak: "auto",
      rowPageBreak: "avoid",

      styles: {
        font: "helvetica",
        fontSize: 6.8,
        cellPadding: 2,
        overflow: "linebreak",
        valign: "top",
        lineColor: [203, 213, 225],
        lineWidth: 0.15,
        textColor: [15, 23, 42],
      },

      headStyles: {
        fillColor: [34, 211, 238],
        textColor: [5, 8, 22],
        fontStyle: "bold",
        fontSize: 7.2,
        halign: "left",
        valign: "middle",
      },

      alternateRowStyles: {
        fillColor: [245, 247, 250],
      },

      bodyStyles: {
        fillColor: [255, 255, 255],
      },

      columnStyles: {
        0: {
          cellWidth: 10,
          halign: "center",
          fontStyle: "bold",
        },
        1: {
          cellWidth: 24,
        },
        2: {
          cellWidth: 38,
        },
        3: {
          cellWidth: 70,
        },
        4: {
          cellWidth: 24,
          fontStyle: "bold",
        },
        5: {
          cellWidth: 24,
          halign: "center",
        },
        6: {
          cellWidth: 24,
          halign: "center",
        },
        7: {
          cellWidth: 59,
        },
      },

      didParseCell(data) {
        if (
          data.section === "body" &&
          data.column.index === 4
        ) {
          const status = String(data.cell.raw ?? "");

          if (status === "Concluída") {
            data.cell.styles.textColor = [5, 150, 105];
          } else if (status === "Cancelada") {
            data.cell.styles.textColor = [100, 116, 139];
          } else if (status === "Em andamento") {
            data.cell.styles.textColor = [37, 99, 235];
          } else {
            data.cell.styles.textColor = [220, 38, 38];
          }

          data.cell.styles.fontStyle = "bold";
        }
      },

      didDrawPage() {
        desenharCabecalho();
      },
    });

    const totalPaginas = doc.getNumberOfPages();

    for (let pagina = 1; pagina <= totalPaginas; pagina++) {
      doc.setPage(pagina);

      doc.setDrawColor(226, 232, 240);
      doc.line(
        12,
        alturaPagina - 13,
        larguraPagina - 12,
        alturaPagina - 13
      );

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);

      doc.text(
        "Sistema de OS - Sequoia",
        12,
        alturaPagina - 7
      );

      doc.text(
        "Desenvolvido por Pedro H. Laranjeira",
        larguraPagina / 2,
        alturaPagina - 7,
        {
          align: "center",
        }
      );

      doc.text(
        `Página ${pagina} de ${totalPaginas}`,
        larguraPagina - 12,
        alturaPagina - 7,
        {
          align: "right",
        }
      );
    }

    const dataArquivo = new Date()
      .toISOString()
      .slice(0, 10);

    doc.save(`indicadores-os-${dataArquivo}.pdf`);
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