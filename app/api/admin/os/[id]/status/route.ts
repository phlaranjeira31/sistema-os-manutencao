import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

type Props = {
  params: Promise<{ id: string }>;
};

export async function PATCH(req: Request, { params }: Props) {
  try {
    const { id } = await params;
    const body = await req.json();

    const status = String(body?.status ?? "").trim();

    if (!status) {
      return NextResponse.json(
        { error: "Status é obrigatório." },
        { status: 400 }
      );
    }

    const os = await prisma.ordemServico.update({
      where: { id },
      data: { status: status as any },
    });

    return NextResponse.json(os);
  } catch (error) {
    console.error("Erro ao atualizar status:", error);

    return NextResponse.json(
      { error: "Erro interno ao atualizar status." },
      { status: 500 }
    );
  }
}