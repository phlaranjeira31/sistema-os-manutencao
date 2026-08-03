import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

function validarEmail(email: string | null) {
  if (!email) return true;

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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

function validarLogoUrl(valor: string | null) {
  if (!valor) return true;

  try {
    const url = new URL(valor);

    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const somenteAtivas = searchParams.get("ativas") === "true";

    const empresas = await prisma.empresa.findMany({
      where: somenteAtivas
        ? {
            ativo: true,
          }
        : undefined,

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

      orderBy: [
        {
          ativo: "desc",
        },
        {
          nome: "asc",
        },
      ],
    });

    return NextResponse.json(empresas);
  } catch (error) {
    console.error("Erro ao buscar empresas:", error);

    return NextResponse.json(
      {
        error: "Erro interno ao buscar empresas.",
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
    const sigla = String(body?.sigla ?? "")
      .trim()
      .toUpperCase();

    const emailNotificacao =
      String(body?.emailNotificacao ?? "").trim().toLowerCase() || null;

    const logoUrl = String(body?.logoUrl ?? "").trim() || null;

    const ativo =
      body?.ativo === undefined || body?.ativo === null
        ? true
        : Boolean(body.ativo);

    const resultadoCor = normalizarCor(body?.cor);

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
          error: "Já existe uma empresa com esse nome.",
        },
        {
          status: 400,
        }
      );
    }

    const empresaComMesmaSigla = await prisma.empresa.findFirst({
      where: {
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
          error: "Já existe uma empresa com essa sigla.",
        },
        {
          status: 400,
        }
      );
    }

    const empresa = await prisma.empresa.create({
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

    return NextResponse.json(empresa, {
      status: 201,
    });
  } catch (error: any) {
    console.error("Erro ao criar empresa:", error);

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

    return NextResponse.json(
      {
        error: "Erro interno ao criar empresa.",
      },
      {
        status: 500,
      }
    );
  }
}