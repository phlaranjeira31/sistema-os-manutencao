import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

export const runtime = "nodejs";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(req: Request, { params }: Props) {
  try {
    const { id } = await params;
    const body = await req.json();

    const maquinaAtual = await prisma.maquina.findUnique({
      where: {
        id,
      },
    });

    if (!maquinaAtual) {
      return NextResponse.json(
        { error: "Máquina não encontrada." },
        { status: 404 }
      );
    }

    const nome =
      body?.nome !== undefined ? String(body.nome).trim() : undefined;

    const ativo =
      typeof body?.ativo === "boolean" ? body.ativo : undefined;

    if (nome !== undefined && !nome) {
      return NextResponse.json(
        { error: "Informe o nome da máquina." },
        { status: 400 }
      );
    }

    if (nome) {
      const duplicada = await prisma.maquina.findFirst({
        where: {
          id: {
            not: id,
          },
          setorId: maquinaAtual.setorId,
          nome: {
            equals: nome,
            mode: "insensitive",
          },
        },
      });

      if (duplicada) {
        return NextResponse.json(
          { error: "Já existe uma máquina com esse nome neste setor." },
          { status: 400 }
        );
      }
    }

    const maquina = await prisma.maquina.update({
      where: {
        id,
      },
      data: {
        ...(nome !== undefined ? { nome } : {}),
        ...(ativo !== undefined ? { ativo } : {}),
      },
    });

    return NextResponse.json(maquina);
  } catch (error) {
    console.error("Erro ao editar máquina:", error);

    return NextResponse.json(
      { error: "Erro interno ao editar máquina." },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: Request, { params }: Props) {
  try {
    const { id } = await params;

    const maquina = await prisma.maquina.findUnique({
      where: {
        id,
      },
      include: {
        _count: {
          select: {
            ordens: true,
          },
        },
      },
    });

    if (!maquina) {
      return NextResponse.json(
        { error: "Máquina não encontrada." },
        { status: 404 }
      );
    }

    if (maquina._count.ordens > 0) {
      await prisma.maquina.update({
        where: {
          id,
        },
        data: {
          ativo: false,
        },
      });

      return NextResponse.json({
        message:
          "A máquina possui OS vinculadas e foi desativada para preservar o histórico.",
      });
    }

    await prisma.maquina.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      message: "Máquina excluída com sucesso.",
    });
  } catch (error) {
    console.error("Erro ao excluir máquina:", error);

    return NextResponse.json(
      { error: "Erro interno ao excluir máquina." },
      { status: 500 }
    );
  }
}