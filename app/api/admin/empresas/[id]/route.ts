import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function validarEmail(email: string | null) {
  if (!email) return true;

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validarLogoUrl(valor: string | null) {
  if (!valor) return true;

  try {
    const url = new URL(valor);

    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function normalizarCor(valor: unknown) {
  const corInformada = String(valor ?? "").trim();

  if (!corInformada) {
    return {
      cor: null,
      erro: null,
    };
  }

  const cor = corInformada.startsWith("#")
    ? corInformada
    : `#${corInformada}`;

  if (!/^#[0-9A-Fa-f]{6}$/.test(cor)) {
    return {
      cor: null,
      erro: "A cor deve estar no formato hexadecimal. Exemplo: #22D3EE.",
    };
  }

  return {
    cor: cor.toUpperCase(),
    erro: null,
  };
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

    const empresa = await prisma.empresa.findUnique({
      where: {
        id,
      },

      select: {
        id: true,
        nome: true,
        sigla: true,
        ativo: true,
        logoUrl: true,
        cor: true,
        emailNotificacao: true,
        createdAt: true,
        updatedAt: true,

        _count: {
          select: {
            setores: true,
            ordens: true,
            preventivas: true,
            usuariosOrigem: true,
            usuariosAtendimento: true,
          },
        },
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

    return NextResponse.json(empresa);
  } catch (error) {
    console.error("Erro ao buscar empresa:", error);

    return NextResponse.json(
      {
        error: "Erro interno ao buscar empresa.",
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

    const empresaAtual = await prisma.empresa.findUnique({
      where: {
        id,
      },

      select: {
        id: true,
        nome: true,
        sigla: true,
        ativo: true,
        logoUrl: true,
        cor: true,
        emailNotificacao: true,
      },
    });

    if (!empresaAtual) {
      return NextResponse.json(
        {
          error: "Empresa não encontrada.",
        },
        {
          status: 404,
        }
      );
    }

    const nome = String(body?.nome ?? empresaAtual.nome).trim();

    const sigla = String(body?.sigla ?? empresaAtual.sigla)
      .trim()
      .toUpperCase();

    const emailNotificacao =
      body?.emailNotificacao === undefined
        ? empresaAtual.emailNotificacao
        : String(body.emailNotificacao ?? "").trim().toLowerCase() || null;

    const logoUrl =
      body?.logoUrl === undefined
        ? empresaAtual.logoUrl
        : String(body.logoUrl ?? "").trim() || null;

    const ativo = converterBooleano(body?.ativo, empresaAtual.ativo);

    const resultadoCor =
      body?.cor === undefined
        ? {
            cor: empresaAtual.cor,
            erro: null,
          }
        : normalizarCor(body.cor);

    if (!nome) {
      return NextResponse.json(
        {
          error: "O nome da empresa é obrigatório.",
        },
        {
          status: 400,
        }
      );
    }

    if (nome.length < 2) {
      return NextResponse.json(
        {
          error: "O nome da empresa deve possuir pelo menos 2 caracteres.",
        },
        {
          status: 400,
        }
      );
    }

    if (!sigla) {
      return NextResponse.json(
        {
          error: "A sigla da empresa é obrigatória.",
        },
        {
          status: 400,
        }
      );
    }

    if (!/^[A-Z0-9]{2,6}$/.test(sigla)) {
      return NextResponse.json(
        {
          error:
            "A sigla deve possuir entre 2 e 6 letras ou números, sem espaços.",
        },
        {
          status: 400,
        }
      );
    }

    if (resultadoCor.erro) {
      return NextResponse.json(
        {
          error: resultadoCor.erro,
        },
        {
          status: 400,
        }
      );
    }

    if (!validarEmail(emailNotificacao)) {
      return NextResponse.json(
        {
          error: "Informe um e-mail de notificação válido.",
        },
        {
          status: 400,
        }
      );
    }

    if (!validarLogoUrl(logoUrl)) {
      return NextResponse.json(
        {
          error: "Informe uma URL válida para o logo.",
        },
        {
          status: 400,
        }
      );
    }

    const empresaComMesmoNome = await prisma.empresa.findFirst({
      where: {
        id: {
          not: id,
        },

        nome: {
          equals: nome,
          mode: "insensitive",
        },
      },

      select: {
        id: true,
      },
    });

    if (empresaComMesmoNome) {
      return NextResponse.json(
        {
          error: "Já existe outra empresa com esse nome.",
        },
        {
          status: 400,
        }
      );
    }

    const empresaComMesmaSigla = await prisma.empresa.findFirst({
      where: {
        id: {
          not: id,
        },

        sigla: {
          equals: sigla,
          mode: "insensitive",
        },
      },

      select: {
        id: true,
      },
    });

    if (empresaComMesmaSigla) {
      return NextResponse.json(
        {
          error: "Já existe outra empresa com essa sigla.",
        },
        {
          status: 400,
        }
      );
    }

    const empresa = await prisma.empresa.update({
      where: {
        id,
      },

      data: {
        nome,
        sigla,
        ativo,
        cor: resultadoCor.cor,
        logoUrl,
        emailNotificacao,
      },

      select: {
        id: true,
        nome: true,
        sigla: true,
        ativo: true,
        logoUrl: true,
        cor: true,
        emailNotificacao: true,
        createdAt: true,
        updatedAt: true,

        _count: {
          select: {
            setores: true,
            ordens: true,
            preventivas: true,
            usuariosOrigem: true,
            usuariosAtendimento: true,
          },
        },
      },
    });

    return NextResponse.json(empresa);
  } catch (error: any) {
    console.error("Erro ao editar empresa:", error);

    if (error?.code === "P2002") {
      return NextResponse.json(
        {
          error: "Já existe uma empresa com esse nome ou sigla.",
        },
        {
          status: 400,
        }
      );
    }

    if (error?.code === "P2025") {
      return NextResponse.json(
        {
          error: "Empresa não encontrada.",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json(
      {
        error: "Erro interno ao editar empresa.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(_req: Request, { params }: RouteContext) {
  try {
    const { id } = await params;

    const empresa = await prisma.empresa.findUnique({
      where: {
        id,
      },

      select: {
        id: true,
        nome: true,

        _count: {
          select: {
            setores: true,
            ordens: true,
            preventivas: true,
            usuariosOrigem: true,
            usuariosAtendimento: true,
          },
        },
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

    const possuiVinculos =
      empresa._count.setores > 0 ||
      empresa._count.ordens > 0 ||
      empresa._count.preventivas > 0 ||
      empresa._count.usuariosOrigem > 0 ||
      empresa._count.usuariosAtendimento > 0;

    if (possuiVinculos) {
      return NextResponse.json(
        {
          error:
            `A empresa "${empresa.nome}" possui dados vinculados e não pode ser excluída. ` +
            "Desative a empresa para preservar OS, setores, preventivas e colaboradores.",
          vinculos: {
            setores: empresa._count.setores,
            ordens: empresa._count.ordens,
            preventivas: empresa._count.preventivas,
            usuariosOrigem: empresa._count.usuariosOrigem,
            usuariosAtendimento: empresa._count.usuariosAtendimento,
          },
        },
        {
          status: 409,
        }
      );
    }

    await prisma.empresa.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      ok: true,
      message: "Empresa excluída com sucesso.",
    });
  } catch (error: any) {
    console.error("Erro ao excluir empresa:", error);

    if (error?.code === "P2025") {
      return NextResponse.json(
        {
          error: "Empresa não encontrada.",
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
            "A empresa possui dados vinculados e não pode ser excluída. Desative-a.",
        },
        {
          status: 409,
        }
      );
    }

    return NextResponse.json(
      {
        error: "Erro interno ao excluir empresa.",
      },
      {
        status: 500,
      }
    );
  }
}