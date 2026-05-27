import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

function parseDate(value: unknown) {
  const text = String(value ?? "").trim();
  if (!text) return null;

  return new Date(`${text}T00:00:00`);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const titulo = String(body?.titulo ?? "").trim();
    const descricao = String(body?.descricao ?? "").trim();
    const setorId = String(body?.setorId ?? "").trim();
    const status = String(body?.status ?? "NAO_INICIADA").trim();
    const prioridade = String(body?.prioridade ?? "MEDIA").trim();
    const anotacoes = String(body?.anotacoes ?? "").trim();
    const registroFinal = String(body?.registroFinal ?? "").trim();

    if (!titulo) {
      return NextResponse.json(
        { error: "O título é obrigatório." },
        { status: 400 }
      );
    }

    if (!descricao) {
      return NextResponse.json(
        { error: "A descrição é obrigatória." },
        { status: 400 }
      );
    }

    if (!setorId) {
      return NextResponse.json(
        { error: "O setor é obrigatório." },
        { status: 400 }
      );
    }

    const os = await prisma.ordemServico.update({
      where: { id },
      data: {
        titulo,
        descricao,
        setorId,
        status: status as any,
        prioridade: prioridade as any,
        dataInicio: parseDate(body?.dataInicio),
        dataPrevista: parseDate(body?.dataPrevista),
        dataConclusao: parseDate(body?.dataConclusao),
        anotacoes: anotacoes || null,
        registroFinal: registroFinal || null,
      },
    });

    return NextResponse.json(os);
  } catch (error) {
    console.error("Erro ao editar OS:", error);

    return NextResponse.json(
      { error: "Erro interno ao editar OS." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.ordemServico.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao excluir OS:", error);

    return NextResponse.json(
      { error: "Erro interno ao excluir OS." },
      { status: 500 }
    );
  }
}