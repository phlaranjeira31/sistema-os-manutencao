import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

type Props = {
  params: Promise<{ id: string }>;
};

export async function PATCH(req: Request, { params }: Props) {
  try {
    const { id } = await params;
    const body = await req.json();

    const relatorio = String(body?.relatorio ?? "").trim();
    const observacoes = String(body?.observacoes ?? "").trim();

    if (!relatorio) {
      return NextResponse.json(
        { error: "Escreva o relatório do serviço." },
        { status: 400 }
      );
    }

    const registroFinal = [
      `Relatório: ${relatorio}`,
      observacoes && `Observações finais: ${observacoes}`,
    ]
      .filter(Boolean)
      .join("\n\n");

    const os = await prisma.ordemServico.update({
      where: { id },
      data: {
        registroFinal,
      },
    });

    return NextResponse.json(os);
  } catch (error) {
    console.error("Erro ao salvar relatório:", error);

    return NextResponse.json(
      { error: "Erro interno ao salvar relatório." },
      { status: 500 }
    );
  }
}