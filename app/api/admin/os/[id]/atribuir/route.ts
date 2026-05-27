import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

type Props = {
  params: Promise<{ id: string }>;
};

async function enviarEmail({
  to,
  titulo,
  descricao,
  numero,
  setor,
  id,
}: {
  to: string;
  titulo: string;
  descricao: string;
  numero: number;
  setor?: string;
  id: string;
}) {
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) return;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM,
      to,
      subject: `Você foi atribuído à OS #${numero} - ${titulo}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>Nova Ordem de Serviço atribuída</h2>

          <p>Você foi atribuído a uma nova Ordem de Serviço no sistema.</p>

          <p><strong>OS:</strong> #${numero}</p>
          <p><strong>Título:</strong> ${titulo}</p>
          <p><strong>Setor:</strong> ${setor || "Não informado"}</p>
          <p><strong>Descrição:</strong> ${descricao}</p>

          <div style="margin-top: 24px;">
            <a href="${baseUrl}/admin/os/${id}"
              style="
                display: inline-block;
                padding: 12px 18px;
                background-color: #020617;
                color: #ffffff;
                text-decoration: none;
                border-radius: 8px;
                font-weight: bold;
                margin-right: 10px;
              ">
              Ver OS
            </a>

            <a href="${baseUrl}/admin/relatorios/${id}"
              style="
                display: inline-block;
                padding: 12px 18px;
                background-color: #16a34a;
                color: #ffffff;
                text-decoration: none;
                border-radius: 8px;
                font-weight: bold;
              ">
              Fazer relatório
            </a>
          </div>

          <p style="margin-top: 24px;">
            Ou acesse o sistema completo:
          </p>

          <a href="${baseUrl}/admin"
            style="color:#2563eb; font-weight:bold;">
            Acessar sistema
          </a>
        </div>
      `,
    }),
  });

  if (!res.ok) {
    const data = await res.text();
    console.error("Erro ao enviar e-mail:", data);
  }
}

export async function POST(req: Request, { params }: Props) {
  try {
    const { id } = await params;
    const body = await req.json();

    const userId = String(body?.userId ?? "").trim();

    if (!userId) {
      return NextResponse.json(
        { error: "Selecione um colaborador." },
        { status: 400 }
      );
    }

    const os = await prisma.ordemServico.findUnique({
      where: { id },
      include: {
        setor: true,
      },
    });

    if (!os) {
      return NextResponse.json(
        { error: "OS não encontrada." },
        { status: 404 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Colaborador não encontrado." },
        { status: 404 }
      );
    }

    await prisma.responsavelOS.upsert({
      where: {
        osId_userId: {
          osId: id,
          userId,
        },
      },
      update: {},
      create: {
        osId: id,
        userId,
      },
    });

    const osAtualizada = await prisma.ordemServico.update({
      where: { id },
      data: {
        status: "EM_ANDAMENTO",
      },
      include: {
        setor: true,
        responsaveis: {
          include: {
            user: true,
          },
        },
      },
    });

    await enviarEmail({
      to: user.email,
      titulo: os.titulo,
      descricao: os.descricao,
      numero: os.numero,
      setor: os.setor?.nome,
      id: os.id,
    });

    return NextResponse.json(osAtualizada);
  } catch (error) {
    console.error("Erro ao atribuir OS:", error);

    return NextResponse.json(
      { error: "Erro interno ao atribuir OS." },
      { status: 500 }
    );
  }
}