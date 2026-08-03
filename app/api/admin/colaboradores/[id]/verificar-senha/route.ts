import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import {
  createHmac,
  timingSafeEqual,
} from "crypto";

import { prisma } from "@/src/lib/prisma";
import { authOptions } from "@/src/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

const NOME_COOKIE =
  "edicao_colaboradores_token";

const TEMPO_AUTORIZACAO_SEGUNDOS =
  10 * 60;

function compararSenhas(
  senhaInformada: string,
  senhaConfigurada: string
) {
  const bufferInformado =
    Buffer.from(senhaInformada);

  const bufferConfigurado =
    Buffer.from(senhaConfigurada);

  if (
    bufferInformado.length !==
    bufferConfigurado.length
  ) {
    return false;
  }

  return timingSafeEqual(
    bufferInformado,
    bufferConfigurado
  );
}

function gerarTokenAutorizacao({
  administradorId,
  colaboradorId,
  expiraEm,
  segredo,
}: {
  administradorId: string;
  colaboradorId: string;
  expiraEm: number;
  segredo: string;
}) {
  const conteudo = [
    administradorId,
    colaboradorId,
    expiraEm,
  ].join(".");

  const assinatura = createHmac(
    "sha256",
    segredo
  )
    .update(conteudo)
    .digest("base64url");

  return Buffer.from(
    `${conteudo}.${assinatura}`
  ).toString("base64url");
}

export async function POST(
  req: Request,
  { params }: Props
) {
  try {
    const session =
      await getServerSession(authOptions);

    const usuarioId = String(
      (session?.user as any)?.id ?? ""
    ).trim();

    if (!usuarioId) {
      return NextResponse.json(
        {
          error: "Usuário não autenticado.",
        },
        {
          status: 401,
        }
      );
    }

    const usuarioAutenticado =
      await prisma.user.findUnique({
        where: {
          id: usuarioId,
        },

        select: {
          id: true,
          perfil: true,
          ativo: true,
        },
      });

    if (!usuarioAutenticado) {
      return NextResponse.json(
        {
          error: "Usuário não encontrado.",
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

    if (
      usuarioAutenticado.perfil !== "ADMIN"
    ) {
      return NextResponse.json(
        {
          error:
            "Somente administradores podem liberar a edição de colaboradores.",
        },
        {
          status: 403,
        }
      );
    }

    const { id: colaboradorId } =
      await params;

    const colaborador =
      await prisma.user.findUnique({
        where: {
          id: colaboradorId,
        },

        select: {
          id: true,
        },
      });

    if (!colaborador) {
      return NextResponse.json(
        {
          error:
            "Colaborador não encontrado.",
        },
        {
          status: 404,
        }
      );
    }

    let body: {
      senha?: unknown;
    };

    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        {
          error: "Requisição inválida.",
        },
        {
          status: 400,
        }
      );
    }

    const senhaInformada = String(
      body?.senha ?? ""
    );

    if (!senhaInformada) {
      return NextResponse.json(
        {
          error:
            "Informe a senha administrativa.",
        },
        {
          status: 400,
        }
      );
    }

    const senhaConfigurada =
      process.env.SENHA_ADMIN_EDICAO;

    const segredoAssinatura =
      process.env.NEXTAUTH_SECRET;

    if (!senhaConfigurada) {
      console.error(
        "A variável SENHA_ADMIN_EDICAO não está configurada."
      );

      return NextResponse.json(
        {
          error:
            "A senha administrativa de edição ainda não foi configurada no servidor.",
        },
        {
          status: 500,
        }
      );
    }

    if (!segredoAssinatura) {
      console.error(
        "A variável NEXTAUTH_SECRET não está configurada."
      );

      return NextResponse.json(
        {
          error:
            "A segurança da autorização não está configurada no servidor.",
        },
        {
          status: 500,
        }
      );
    }

    const senhaCorreta = compararSenhas(
      senhaInformada,
      senhaConfigurada
    );

    if (!senhaCorreta) {
      return NextResponse.json(
        {
          error:
            "Senha administrativa incorreta.",
        },
        {
          status: 401,
        }
      );
    }

    const expiraEm =
      Date.now() +
      TEMPO_AUTORIZACAO_SEGUNDOS * 1000;

    const token = gerarTokenAutorizacao({
      administradorId:
        usuarioAutenticado.id,

      colaboradorId,
      expiraEm,
      segredo: segredoAssinatura,
    });

    const response = NextResponse.json({
      ok: true,
      message:
        "Edição administrativa liberada.",
      expiresAt: expiraEm,
    });

    response.cookies.set({
      name: NOME_COOKIE,
      value: token,
      httpOnly: true,
      secure:
        process.env.NODE_ENV ===
        "production",
      sameSite: "strict",
      path: "/",
      maxAge:
        TEMPO_AUTORIZACAO_SEGUNDOS,
    });

    return response;
  } catch (error) {
    console.error(
      "Erro ao verificar senha administrativa:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Erro interno ao liberar a edição administrativa.",
      },
      {
        status: 500,
      }
    );
  }
}