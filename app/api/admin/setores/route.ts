import { TipoSetor } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

const TIPOS_SETOR: TipoSetor[] = [
  TipoSetor.MANUTENCAO,
  TipoSetor.OPERACIONAL,
  TipoSetor.ADMINISTRATIVO,
  TipoSetor.OUTRO,
];

function tipoSetorValido(valor: string): valor is TipoSetor {
  return TIPOS_SETOR.includes(valor as TipoSetor);
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const empresaId = String(
      searchParams.get("empresaId") ?? ""
    ).trim();

    const tipoInformado = String(
      searchParams.get("tipo") ?? ""
    )
      .trim()
      .toUpperCase();

    let tipo: TipoSetor | undefined;

    if (tipoInformado) {
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

      tipo = tipoInformado;
    }

    const setores = await prisma.setor.findMany({
      where: {
        ativo: true,

        ...(empresaId
          ? {
              empresaId,
            }
          : {}),

        ...(tipo
          ? {
              tipo,
            }
          : {}),
      },

      select: {
        id: true,
        nome: true,
        tipo: true,
        empresaId: true,

        empresa: {
          select: {
            id: true,
            nome: true,
            sigla: true,
          },
        },
      },

      orderBy: {
        nome: "asc",
      },
    });

    return NextResponse.json(setores);
  } catch (error) {
    console.error("Erro ao buscar setores:", error);

    return NextResponse.json(
      {
        error: "Erro interno ao buscar setores.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const nome = String(body?.nome ?? "").trim();

    /*
     * Compatibilidade temporária:
     * requisições antigas que não enviam empresaId
     * continuam cadastrando na Sequoia.
     */
    const empresaIdInformada = String(
      body?.empresaId ?? ""
    ).trim();

    const empresaId =
      empresaIdInformada || "empresa_sequoia";

    /*
     * O tipo não aparece mais no formulário,
     * mas permanece no banco como OUTRO.
     */
    const tipoInformadoTexto = String(
      body?.tipo ?? TipoSetor.OUTRO
    )
      .trim()
      .toUpperCase();

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

    if (!tipoSetorValido(tipoInformadoTexto)) {
      return NextResponse.json(
        {
          error: "Tipo de setor inválido.",
        },
        {
          status: 400,
        }
      );
    }

    const tipoInformado: TipoSetor =
      tipoInformadoTexto;

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

    if (!empresa.ativo) {
      return NextResponse.json(
        {
          error:
            "A empresa selecionada está inativa e não pode receber novos setores.",
        },
        {
          status: 400,
        }
      );
    }

    const setorExistente = await prisma.setor.findFirst({
      where: {
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

    if (setorExistente) {
      return NextResponse.json(
        {
          error: `Já existe um setor chamado "${setorExistente.nome}" na empresa ${empresa.nome}.`,
        },
        {
          status: 400,
        }
      );
    }

    const setor = await prisma.setor.create({
      data: {
        nome,
        tipo: tipoInformado,
        empresaId,
        ativo: true,
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
          },
        },
      },
    });

    return NextResponse.json(setor, {
      status: 201,
    });
  } catch (error: any) {
    console.error("Erro ao criar setor:", error);

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

    return NextResponse.json(
      {
        error: "Erro interno ao criar setor.",
      },
      {
        status: 500,
      }
    );
  }
}