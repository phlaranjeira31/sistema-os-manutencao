import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const TIPOS_SETOR = [
  "MANUTENCAO",
  "OPERACIONAL",
  "ADMINISTRATIVO",
  "OUTRO",
] as const;

type TipoSetorValido = (typeof TIPOS_SETOR)[number];

function tipoSetorValido(valor: string): valor is TipoSetorValido {
  return TIPOS_SETOR.includes(valor as TipoSetorValido);
}

function converterBooleano(valor: unknown, padrao: boolean) {
  if (typeof valor === "boolean") {
    return valor;
  }

  if (valor === "true" || valor === 1 || valor === "1") {
    return true;
  }

  if (valor === "false" || valor === 0 || valor === "0") {
    return false;
  }

  return padrao;
}

export async function GET(_req: Request, { params }: RouteContext) {
  try {
    const { id } = await params;

    const setor = await prisma.setor.findUnique({
      where: {
        id,
      },

      select: {
        id: true,
        nome: true,
        tipo: true,
        ativo: true,
        empresaId: true,
        createdAt: true,
        updatedAt: true,

        empresa: {
          select: {
            id: true,
            nome: true,
            sigla: true,
            ativo: true,
          },
        },

        _count: {
          select: {
            ordens: true,
            preventivas: true,
            maquinas: true,
            usuarios: true,
            funcoes: true,
          },
        },
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

    return NextResponse.json(setor);
  } catch (error) {
    console.error("Erro ao buscar setor:", error);

    return NextResponse.json(
      {
        error: "Erro interno ao buscar setor.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function PATCH(req: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const body = await req.json();

    const setorAtual = await prisma.setor.findUnique({
      where: {
        id,
      },

      select: {
        id: true,
        nome: true,
        tipo: true,
        ativo: true,
        empresaId: true,
      },
    });

    if (!setorAtual) {
      return NextResponse.json(
        {
          error: "Setor não encontrado.",
        },
        {
          status: 404,
        }
      );
    }

    const nome = String(body?.nome ?? setorAtual.nome).trim();

    const empresaId =
      body?.empresaId === undefined
        ? setorAtual.empresaId
        : String(body?.empresaId ?? "").trim();

    const tipoInformado = String(body?.tipo ?? setorAtual.tipo)
      .trim()
      .toUpperCase();

    const ativo = converterBooleano(body?.ativo, setorAtual.ativo);

    if (!nome) {
      return NextResponse.json(
        {
          error: "O nome do setor é obrigatório.",
        },
        {
          status: 400,
        }
      );
    }

    if (nome.length < 2) {
      return NextResponse.json(
        {
          error:
            "O nome do setor deve possuir pelo menos 2 caracteres.",
        },
        {
          status: 400,
        }
      );
    }

    if (!empresaId) {
      return NextResponse.json(
        {
          error: "Selecione a empresa do setor.",
        },
        {
          status: 400,
        }
      );
    }

    if (!tipoSetorValido(tipoInformado)) {
      return NextResponse.json(
        {
          error: "Tipo de setor inválido.",
        },
        {
          status: 400,
        }
      );
    }

    const empresa = await prisma.empresa.findUnique({
      where: {
        id: empresaId,
      },

      select: {
        id: true,
        nome: true,
        sigla: true,
        ativo: true,
      },
    });

    if (!empresa) {
      return NextResponse.json(
        {
          error: "Empresa não encontrada.",
        },
        {
          status: 404,
        }
      );
    }

    if (!empresa.ativo && empresaId !== setorAtual.empresaId) {
      return NextResponse.json(
        {
          error:
            "A empresa selecionada está inativa e não pode receber o setor.",
        },
        {
          status: 400,
        }
      );
    }

    const setorDuplicado = await prisma.setor.findFirst({
      where: {
        id: {
          not: id,
        },

        empresaId,

        nome: {
          equals: nome,
          mode: "insensitive",
        },
      },

      select: {
        id: true,
        nome: true,
      },
    });

    if (setorDuplicado) {
      return NextResponse.json(
        {
          error: `Já existe um setor chamado "${setorDuplicado.nome}" na empresa ${empresa.nome}.`,
        },
        {
          status: 400,
        }
      );
    }

    const setor = await prisma.setor.update({
      where: {
        id,
      },

      data: {
        nome,
        tipo: tipoInformado,
        ativo,
        empresaId,
      },

      select: {
        id: true,
        nome: true,
        tipo: true,
        ativo: true,
        empresaId: true,
        createdAt: true,
        updatedAt: true,

        empresa: {
          select: {
            id: true,
            nome: true,
            sigla: true,
            ativo: true,
          },
        },

        _count: {
          select: {
            ordens: true,
            preventivas: true,
            maquinas: true,
            usuarios: true,
            funcoes: true,
          },
        },
      },
    });

    return NextResponse.json(setor);
  } catch (error: any) {
    console.error("Erro ao editar setor:", error);

    if (error?.code === "P2002") {
      return NextResponse.json(
        {
          error:
            "Já existe um setor com esse nome dentro da empresa selecionada.",
        },
        {
          status: 400,
        }
      );
    }

    if (error?.code === "P2025") {
      return NextResponse.json(
        {
          error: "Setor não encontrado.",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json(
      {
        error: "Erro interno ao editar setor.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: RouteContext
) {
  try {
    const { id } = await params;

    const setor = await prisma.setor.findUnique({
      where: {
        id,
      },

      select: {
        id: true,
        nome: true,

        empresa: {
          select: {
            nome: true,
          },
        },

        _count: {
          select: {
            ordens: true,
            preventivas: true,
            maquinas: true,
            usuarios: true,
            funcoes: true,
          },
        },
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

    const possuiVinculos =
      setor._count.ordens > 0 ||
      setor._count.preventivas > 0 ||
      setor._count.maquinas > 0 ||
      setor._count.usuarios > 0 ||
      setor._count.funcoes > 0;

    if (possuiVinculos) {
      return NextResponse.json(
        {
          error:
            `O setor "${setor.nome}" possui dados vinculados e não pode ser excluído. ` +
            "Desative o setor para preservar o histórico das ordens, máquinas, preventivas, funções e colaboradores.",

          vinculos: {
            ordens: setor._count.ordens,
            preventivas: setor._count.preventivas,
            maquinas: setor._count.maquinas,
            colaboradores: setor._count.usuarios,
            funcoes: setor._count.funcoes,
          },
        },
        {
          status: 409,
        }
      );
    }

    await prisma.setor.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      ok: true,
      message: "Setor excluído com sucesso.",
    });
  } catch (error: any) {
    console.error("Erro ao excluir setor:", error);

    if (error?.code === "P2025") {
      return NextResponse.json(
        {
          error: "Setor não encontrado.",
        },
        {
          status: 404,
        }
      );
    }

    if (error?.code === "P2003") {
      return NextResponse.json(
        {
          error:
            "O setor possui dados vinculados e não pode ser excluído. Desative-o para preservar o histórico.",
        },
        {
          status: 409,
        }
      );
    }

    return NextResponse.json(
      {
        error: "Erro interno ao excluir setor.",
      },
      {
        status: 500,
      }
    );
  }
}