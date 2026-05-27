import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();

    const status = String(body?.status ?? "");

    if (!["PENDENTE", "FEITA", "NAO_FEITA"].includes(status)) {
      return NextResponse.json(
        { error: "Status inválido." },
        { status: 400 }
      );
    }

    const preventiva = await prisma.ordemPreventiva.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ ok: true, preventiva });
  } catch (error) {
    console.error("Erro ao atualizar status da preventiva:", error);

    return NextResponse.json(
      { error: "Erro interno ao atualizar status." },
      { status: 500 }
    );
  }
}