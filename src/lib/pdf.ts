import jsPDF from "jspdf";

export function gerarPDFRelatorio(os: any) {
  const doc = new jsPDF();

  // ===== LOGO =====
  const img = new Image();
  img.src = "/logo.sequoia.png";

  img.onload = () => {
    doc.addImage(img, "PNG", 15, 10, 30, 30);

    // ===== TÍTULO =====
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text(`Relatório da OS #${os.numero}`, 50, 20);

    // ===== LINHA =====
    doc.setDrawColor(200);
    doc.line(15, 35, 195, 35);

    // ===== DADOS =====
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");

    let y = 45;

    const addLine = (label: string, value: string) => {
      doc.setFont("helvetica", "bold");
      doc.text(`${label}:`, 15, y);

      doc.setFont("helvetica", "normal");
      doc.text(value || "-", 70, y);

      y += 8;
    };

    doc.setFont("helvetica", "bold");
    doc.text("Dados da Ordem de Serviço", 15, y);
    y += 10;

    addLine("Título", os.titulo);
    addLine("Setor", os.setor?.nome);
    addLine("Status", os.status);
    addLine("Prioridade", os.prioridade);
    addLine("Responsável", os.responsavel?.nome);
    addLine("Criada em", os.createdAt);
    addLine("Atualizada em", os.updatedAt);

    // ===== DESCRIÇÃO =====
    y += 5;
    doc.setFont("helvetica", "bold");
    doc.text("Descrição", 15, y);

    y += 8;
    doc.setFont("helvetica", "normal");

    const descricao = doc.splitTextToSize(os.descricao || "-", 180);
    doc.text(descricao, 15, y);

    y += descricao.length * 6 + 5;

    // ===== RELATÓRIO =====
    doc.setFont("helvetica", "bold");
    doc.text("Relatório", 15, y);

    y += 10;

    addLine("Data de início", os.relatorio?.dataInicio);
    addLine("Hora de início", os.relatorio?.horaInicio);
    addLine("Data fim", os.relatorio?.dataFim);
    addLine("Hora fim", os.relatorio?.horaFim);

    // ===== RODAPÉ =====
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text(
      `Gerado em ${new Date().toLocaleString("pt-BR")}`,
      15,
      285
    );

    doc.save(`relatorio-os-${os.numero}.pdf`);
  };
}