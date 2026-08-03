import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { prisma } from "@/src/lib/prisma";
import { authOptions } from "@/src/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function obterUsuarioAutenticado() {
  const session = await getServerSession(authOptions);

  const usuarioId = String(
    (session?.user as any)?.id ?? ""
  ).trim();

  if (!usuarioId) {
    return null;
  }

  return prisma.user.findUnique({
    where: {
      id: usuarioId,
    },

    select: {
      id: true,
      perfil: true,
      ativo: true,
    },
  });
}

export async function GET(req: Request) {
  try {
    const usuarioAutenticado =
      await obterUsuarioAutenticado();

    if (!usuarioAutenticado) {
      return NextResponse.json(
        {
          error: "Usuário não autenticado.",
        },
        {
          status: 401,
        }
      );
    }

    if (!usuarioAutenticado.ativo) {
      return NextResponse.json(
        {
          error: "Usuário inativo.",
        },
        {
          status: 403,
        }
      );
    }

    const { searchParams } = new URL(req.url);

    const setorId = String(
      searchParams.get("setorId") ?? ""
    ).trim();

    const filtroAtivas = String(
      searchParams.get("ativas") ??
        searchParams.get("ativos") ??
        "false"
    )
      .trim()
      .toLowerCase();

    const somenteAtivas =
      filtroAtivas === "true" ||
      filtroAtivas === "1";

    if (!setorId) {
      return NextResponse.json(
        {
          error:
            "Informe o setor para carregar as funções.",
        },
        {
          status: 400,
        }
      );
    }

    const setor = await prisma.setor.findUnique({
      where: {
        id: setorId,
      },

      select: {
        id: true,
        nome: true,
        ativo: true,
        empresaId: true,
      },
    });

    if (!setor) {
      return NextResponse.json(
        {
          error: "Setor não encontrado.",
        },
        {
          status: 404,
        }
      );
    }

    const funcoes = await prisma.funcao.findMany({
      where: {
        setorId,

        ...(somenteAtivas
          ? {
              ativo: true,
            }
          : {}),
      },

      select: {
        id: true,
        nome: true,
        ativo: true,
        setorId: true,
      },

      orderBy: {
        nome: "asc",
      },
    });

    return NextResponse.json({
      funcoes,
      setor: {
        id: setor.id,
        nome: setor.nome,
        ativo: setor.ativo,
        empresaId: setor.empresaId,
      },
    });
  } catch (error) {
    console.error(
      "Erro ao carregar funções:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Erro interno ao carregar funções.",
      },
      {
        status: 500,
      }
    );
  }
}