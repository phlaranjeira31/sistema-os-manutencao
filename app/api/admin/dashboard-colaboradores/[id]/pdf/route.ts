import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { jsPDF } from "jspdf";
import fs from "fs";
import path from "path";

type RouteProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatDate(date: Date | string | null | undefined) {
  if (!date) return "-";
  return new Intl.DateTimeFormat("pt-BR").format(new Date(date));
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    NAO_INICIADA: "Não iniciada",
    EM_ANDAMENTO: "Em andamento",
    CONCLUIDA: "Concluída",
    CANCELADA: "Cancelada",
  };

  return map[status] ?? status;
}

export async function GET(_req: Request, { params }: RouteProps) {
  const { id } = await params;

  const colaborador = await prisma.user.findUnique({
    where: { id },
    include: {
      ordensResponsavel: {
        include: {
          os: {
            include: {
              setor: true,
            },
          },
        },
      },
    },
  });

  if (!colaborador) {
    return NextResponse.json(
      { error: "Colaborador não encontrado." },
      { status: 404 }
    );
  }

  const ordens = colaborador.ordensResponsavel.map(
    (item: any) => item.os
  );

  const total = ordens.length;

  const naoIniciadas = ordens.filter(
    (os: any) => os.status === "NAO_INICIADA"
  ).length;

  const emAndamento = ordens.filter(
    (os: any) => os.status === "EM_ANDAMENTO"
  ).length;

  const concluidas = ordens.filter(
    (os: any) => os.status === "CONCLUIDA"
  ).length;

  const canceladas = ordens.filter(
    (os: any) => os.status === "CANCELADA"
  ).length;

  const abertas = naoIniciadas + emAndamento;
  const resolucao = total > 0 ? Math.round((concluidas / total) * 100) : 0;

  const doc = new jsPDF();

  doc.setFillColor(2, 6, 23);
  doc.rect(0, 0, 210, 297, "F");

  const logoPaths = [
    path.join(process.cwd(), "public", "sequoia.png"),
    path.join(process.cwd(), "public", "logo.png"),
    path.join(process.cwd(), "public", "logo-sequoia.png"),
  ];

  const logoPath = logoPaths.find((p) => fs.existsSync(p));

  if (logoPath) {
    const logoBase64 = fs.readFileSync(logoPath).toString("base64");
    doc.addImage(`data:image/png;base64,${logoBase64}`, "PNG", 15, 12, 28, 22);
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("Relatório do Colaborador", 50, 22);

  doc.setFontSize(11);
  doc.setTextColor(148, 163, 184);
  doc.text("Sistema de OS - Sequoia", 50, 30);

  doc.setDrawColor(34, 211, 238);
  doc.line(15, 42, 195, 42);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(17);
  doc.text(colaborador.nome, 15, 58);

  doc.setFontSize(10);
  doc.setTextColor(148, 163, 184);
  doc.text(`Perfil: ${colaborador.perfil}`, 15, 66);
  doc.text(`E-mail: ${colaborador.email}`, 15, 73);
  doc.text(`Gerado em: ${formatDate(new Date())}`, 15, 80);

  function card(x: number, y: number, title: string, value: string) {
    doc.setFillColor(15, 23, 42);
    doc.roundedRect(x, y, 40, 24, 3, 3, "F");

    doc.setTextColor(34, 211, 238);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text(title, x + 4, y + 8);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text(value, x + 4, y + 19);
  }

  card(15, 92, "TOTAL", String(total));
  card(60, 92, "ABERTAS", String(abertas));
  card(105, 92, "CONCLUÍDAS", String(concluidas));
  card(150, 92, "CANCELADAS", String(canceladas));

  doc.setFillColor(15, 23, 42);
  doc.roundedRect(15, 126, 180, 28, 4, 4, "F");

  doc.setTextColor(148, 163, 184);
  doc.setFontSize(10);
  doc.text("RESOLUÇÃO", 22, 137);

  doc.setTextColor(34, 211, 238);
  doc.setFontSize(22);
  doc.text(`${resolucao}%`, 22, 148);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.text("Ordens de Serviço vinculadas", 15, 170);

  let y = 182;

  if (ordens.length === 0) {
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(11);
    doc.text("Nenhuma OS vinculada a este colaborador.", 15, y);
  } else {
    for (const os of ordens.slice(0, 18) as any[]) {
      if (y > 270) {
        doc.addPage();
        doc.setFillColor(2, 6, 23);
        doc.rect(0, 0, 210, 297, "F");
        y = 20;
      }

      doc.setFillColor(15, 23, 42);
      doc.roundedRect(15, y - 8, 180, 18, 3, 3, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(`#${os.numero} - ${os.titulo}`, 20, y);

      doc.setTextColor(148, 163, 184);
      doc.setFontSize(8);
      doc.text(
        `${os.setor?.nome ?? "-"} | ${statusLabel(os.status)} | Criada em ${formatDate(os.createdAt)}`,
        20,
        y + 6
      );

      y += 23;
    }
  }

  const pdf = Buffer.from(doc.output("arraybuffer"));

  return new NextResponse(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="relatorio-${colaborador.nome}.pdf"`,
    },
  });
}