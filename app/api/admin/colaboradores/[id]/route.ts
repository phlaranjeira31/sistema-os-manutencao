import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

import { prisma } from "@/src/lib/prisma";
import { authOptions } from "@/src/lib/auth";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

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

export async function PATCH(
  req: Request,
  { params }: Props
) {
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

    const { id } = await params;

    const isAdmin =
      usuarioAutenticado.perfil === "ADMIN";

    const editandoProprioUsuario =
      usuarioAutenticado.id === id;

    if (!isAdmin && !editandoProprioUsuario) {
      return NextResponse.json(
        {
          error:
            "Você não possui permissão para editar este colaborador.",
        },
        {
          status: 403,
        }
      );
    }

    const formData = await req.formData();

    const email = String(
      formData.get("email") ?? ""
    )
      .trim()
      .toLowerCase();

    const senha = String(
      formData.get("senha") ?? ""
    ).trim();

    if (!email) {
      return NextResponse.json(
        {
          error: "Informe o email.",
        },
        {
          status: 400,
        }
      );
    }

    const colaboradorAtual =
      await prisma.user.findUnique({
        where: {
          id,
        },

        select: {
          id: true,
          nome: true,
          email: true,
          fotoUrl: true,
          perfil: true,
          ativo: true,
          empresaOrigemId: true,
          setorId: true,
          funcaoId: true,
        },
      });

    if (!colaboradorAtual) {
      return NextResponse.json(
        {
          error: "Colaborador não encontrado.",
        },
        {
          status: 404,
        }
      );
    }

    const emailExiste =
      await prisma.user.findUnique({
        where: {
          email,
        },

        select: {
          id: true,
        },
      });

    if (emailExiste && emailExiste.id !== id) {
      return NextResponse.json(
        {
          error:
            "Já existe outro colaborador com esse email.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * USUÁRIO COMUM
     *
     * Pode alterar somente o próprio email e senha.
     * Nome, foto, perfil, status, empresa, setor e
     * função são ignorados pelo servidor.
     */
    if (!isAdmin) {
      const dataUsuario: {
        email: string;
        senha?: string;
      } = {
        email,
      };

      if (senha) {
        if (senha.length < 6) {
          return NextResponse.json(
            {
              error:
                "A senha precisa ter pelo menos 6 caracteres.",
            },
            {
              status: 400,
            }
          );
        }

        dataUsuario.senha = await bcrypt.hash(
          senha,
          10
        );
      }

      const usuarioAtualizado =
        await prisma.user.update({
          where: {
            id,
          },

          data: dataUsuario,

          select: {
            id: true,
            nome: true,
            email: true,
            fotoUrl: true,
            perfil: true,
            ativo: true,
            empresaOrigemId: true,
            setorId: true,
            funcaoId: true,
          },
        });

      return NextResponse.json(
        usuarioAtualizado
      );
    }

    /*
     * ADMINISTRADOR
     *
     * Pode editar os dados administrativos e
     * profissionais do colaborador.
     */
    const nome = String(
      formData.get("nome") ?? ""
    ).trim();

    const ativo =
      String(formData.get("ativo") ?? "true") ===
      "true";

    const foto = formData.get(
      "foto"
    ) as File | null;

    const perfilRecebido = String(
      formData.get("perfil") ?? "COLABORADOR"
    ).trim();

    const perfil =
      perfilRecebido === "ADMIN"
        ? "ADMIN"
        : "COLABORADOR";

    if (!nome) {
      return NextResponse.json(
        {
          error: "Informe o nome.",
        },
        {
          status: 400,
        }
      );
    }

    const enviouEmpresaOrigem =
      formData.has("empresaOrigemId");

    const enviouSetor =
      formData.has("setorId");

    const enviouFuncao =
      formData.has("funcaoId");

    const empresaOrigemIdInformada = String(
      formData.get("empresaOrigemId") ?? ""
    ).trim();

    const setorIdInformado = String(
      formData.get("setorId") ?? ""
    ).trim();

    const funcaoIdInformada = String(
      formData.get("funcaoId") ?? ""
    ).trim();

    const empresaOrigemIdFinal =
      enviouEmpresaOrigem
        ? empresaOrigemIdInformada || null
        : colaboradorAtual.empresaOrigemId;

    const setorIdFinal = enviouSetor
      ? setorIdInformado || null
      : colaboradorAtual.setorId;

    const funcaoIdFinal = enviouFuncao
      ? funcaoIdInformada || null
      : colaboradorAtual.funcaoId;

    if (setorIdFinal && !empresaOrigemIdFinal) {
      return NextResponse.json(
        {
          error:
            "Selecione a empresa de origem antes de selecionar o setor.",
        },
        {
          status: 400,
        }
      );
    }

    if (funcaoIdFinal && !setorIdFinal) {
      return NextResponse.json(
        {
          error:
            "Selecione o setor antes de selecionar a função.",
        },
        {
          status: 400,
        }
      );
    }

    if (empresaOrigemIdFinal) {
      const empresa =
        await prisma.empresa.findUnique({
          where: {
            id: empresaOrigemIdFinal,
          },

          select: {
            id: true,
            ativo: true,
          },
        });

      if (!empresa) {
        return NextResponse.json(
          {
            error:
              "Empresa de origem não encontrada.",
          },
          {
            status: 404,
          }
        );
      }

      const alterouEmpresa =
        empresaOrigemIdFinal !==
        colaboradorAtual.empresaOrigemId;

      if (!empresa.ativo && alterouEmpresa) {
        return NextResponse.json(
          {
            error:
              "A empresa de origem selecionada está inativa.",
          },
          {
            status: 400,
          }
        );
      }
    }

    if (setorIdFinal) {
      const setor =
        await prisma.setor.findUnique({
          where: {
            id: setorIdFinal,
          },

          select: {
            id: true,
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

      const alterouSetor =
        setorIdFinal !==
        colaboradorAtual.setorId;

      if (!setor.ativo && alterouSetor) {
        return NextResponse.json(
          {
            error:
              "O setor selecionado está inativo.",
          },
          {
            status: 400,
          }
        );
      }

      if (
        setor.empresaId !== empresaOrigemIdFinal
      ) {
        return NextResponse.json(
          {
            error:
              "O setor selecionado não pertence à empresa de origem informada.",
          },
          {
            status: 400,
          }
        );
      }
    }

    if (funcaoIdFinal) {
      const funcao =
        await prisma.funcao.findUnique({
          where: {
            id: funcaoIdFinal,
          },

          select: {
            id: true,
            ativo: true,
            setorId: true,
          },
        });

      if (!funcao) {
        return NextResponse.json(
          {
            error: "Função não encontrada.",
          },
          {
            status: 404,
          }
        );
      }

      const alterouFuncao =
        funcaoIdFinal !==
        colaboradorAtual.funcaoId;

      if (!funcao.ativo && alterouFuncao) {
        return NextResponse.json(
          {
            error:
              "A função selecionada está inativa.",
          },
          {
            status: 400,
          }
        );
      }

      if (funcao.setorId !== setorIdFinal) {
        return NextResponse.json(
          {
            error:
              "A função selecionada não pertence ao setor informado.",
          },
          {
            status: 400,
          }
        );
      }
    }

    let fotoUrl =
      colaboradorAtual.fotoUrl;

    if (foto && foto.size > 0) {
      const bytes =
        await foto.arrayBuffer();

      const buffer = Buffer.from(bytes);

      const extensao =
        foto.name.split(".").pop() || "jpg";

      const nomeArquivo = `${Date.now()}-${email.replace(
        /[^a-zA-Z0-9]/g,
        ""
      )}.${extensao}`;

      const pastaUpload = path.join(
        process.cwd(),
        "public",
        "uploads",
        "colaboradores"
      );

      await mkdir(pastaUpload, {
        recursive: true,
      });

      const caminhoArquivo = path.join(
        pastaUpload,
        nomeArquivo
      );

      await writeFile(
        caminhoArquivo,
        buffer
      );

      fotoUrl = `/uploads/colaboradores/${nomeArquivo}`;
    }

    const dataAdministrador: any = {
      nome,
      email,
      ativo,
      perfil,
      fotoUrl,
    };

    if (enviouEmpresaOrigem) {
      dataAdministrador.empresaOrigemId =
        empresaOrigemIdFinal;
    }

    if (enviouSetor) {
      dataAdministrador.setorId =
        setorIdFinal;
    }

    if (enviouFuncao) {
      dataAdministrador.funcaoId =
        funcaoIdFinal;
    }

    if (senha) {
      if (senha.length < 6) {
        return NextResponse.json(
          {
            error:
              "A senha precisa ter pelo menos 6 caracteres.",
          },
          {
            status: 400,
          }
        );
      }

      dataAdministrador.senha =
        await bcrypt.hash(senha, 10);
    }

    const colaboradorAtualizado =
      await prisma.user.update({
        where: {
          id,
        },

        data: dataAdministrador,

        select: {
          id: true,
          nome: true,
          email: true,
          fotoUrl: true,
          perfil: true,
          ativo: true,
          empresaOrigemId: true,
          setorId: true,
          funcaoId: true,
          createdAt: true,
          updatedAt: true,

          empresaOrigem: {
            select: {
              id: true,
              nome: true,
              sigla: true,
            },
          },

          setor: {
            select: {
              id: true,
              nome: true,
            },
          },

          funcao: {
            select: {
              id: true,
              nome: true,
            },
          },
        },
      });

    return NextResponse.json(
      colaboradorAtualizado
    );
  } catch (error) {
    console.error(
      "Erro ao editar colaborador:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Erro interno ao editar colaborador.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: Props
) {
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

    if (
      !usuarioAutenticado.ativo ||
      usuarioAutenticado.perfil !== "ADMIN"
    ) {
      return NextResponse.json(
        {
          error:
            "Somente administradores podem desativar colaboradores.",
        },
        {
          status: 403,
        }
      );
    }

    const { id } = await params;

    const colaboradorAtual =
      await prisma.user.findUnique({
        where: {
          id,
        },

        select: {
          id: true,
          ativo: true,
        },
      });

    if (!colaboradorAtual) {
      return NextResponse.json(
        {
          error: "Colaborador não encontrado.",
        },
        {
          status: 404,
        }
      );
    }

    await prisma.user.update({
      where: {
        id,
      },

      data: {
        ativo: false,
      },
    });

    return NextResponse.json({
      ok: true,
      message:
        "Colaborador desativado com sucesso. Todos os vínculos foram preservados.",
    });
  } catch (error) {
    console.error(
      "Erro ao desativar colaborador:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Erro interno ao desativar colaborador.",
      },
      {
        status: 500,
      }
    );
  }
}