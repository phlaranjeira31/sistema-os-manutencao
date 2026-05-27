import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const nome = String(body?.nome ?? "").trim();
    const ativo = Boolean(body?.ativo);

    if (!nome) {
      return NextResponse.json(
        { error: "O nome do setor é obrigatório." },
        { status: 400 }
      );
    }

    const setor = await prisma.setor.update({
      where: { id },
      data: {
        nome,
        ativo,
      },
    });

    return NextResponse.json(setor);
  } catch (error) {
    console.error("Erro ao editar setor:", error);

    return NextResponse.json(
      { error: "Erro interno ao editar setor." },
      { status: 500 }
    );
  }
}

/* ========================= */
/*       ADIÇÃO AQUI         */
/* ========================= */

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.setor.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Erro ao excluir setor:", error);

    return NextResponse.json(
      {
        error:
          "Erro ao excluir setor. Verifique se existem ordens vinculadas.",
      },
      { status: 500 }
    );
  }
}