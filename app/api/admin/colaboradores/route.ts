import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/src/lib/prisma";
import cloudinary from "@/src/lib/cloudinary";

export const runtime = "nodejs";

async function uploadFotoCloudinary(foto: File, email: string) {
  const bytes = await foto.arrayBuffer();
  const buffer = Buffer.from(bytes);

  return new Promise<string>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "sistema-os/colaboradores",
        public_id: `${Date.now()}-${email.replace(/[^a-zA-Z0-9]/g, "")}`,
        overwrite: true,
        resource_type: "image",
      },
      (error, result) => {
        if (error || !result) {
          reject(
            error ||
              new Error(
                "Erro ao enviar foto para o Cloudinary."
              )
          );
          return;
        }

        resolve(result.secure_url);
      }
    );

    uploadStream.end(buffer);
  });
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const nome = String(
      formData.get("nome") ?? ""
    ).trim();

    const email = String(
      formData.get("email") ?? ""
    )
      .trim()
      .toLowerCase();

    const senha = String(
      formData.get("senha") ?? ""
    ).trim();

    const foto = formData.get("foto") as File | null;

    const perfilRecebido = String(
      formData.get("perfil") ?? "COLABORADOR"
    ).trim();

    const perfil =
      perfilRecebido === "ADMIN"
        ? "ADMIN"
        : "COLABORADOR";

    /*
     * Novos dados profissionais.
     *
     * Permanecem opcionais temporariamente para não quebrar
     * o formulário atual enquanto fazemos a atualização
     * gradual das telas.
     */
    const empresaOrigemId = String(
      formData.get("empresaOrigemId") ?? ""
    ).trim();

    const setorId = String(
      formData.get("setorId") ?? ""
    ).trim();

    const funcaoId = String(
      formData.get("funcaoId") ?? ""
    ).trim();

    if (!nome) {
      return NextResponse.json(
        {
          error: "Informe o nome do colaborador.",
        },
        {
          status: 400,
        }
      );
    }

    if (!email) {
      return NextResponse.json(
        {
          error: "Informe o email do colaborador.",
        },
        {
          status: 400,
        }
      );
    }

    if (!senha || senha.length < 6) {
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

    if (setorId && !empresaOrigemId) {
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

    if (funcaoId && !setorId) {
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

    let empresaOrigem:
      | {
          id: string;
          nome: string;
          ativo: boolean;
        }
      | null = null;

    if (empresaOrigemId) {
      empresaOrigem = await prisma.empresa.findUnique({
        where: {
          id: empresaOrigemId,
        },

        select: {
          id: true,
          nome: true,
          ativo: true,
        },
      });

      if (!empresaOrigem) {
        return NextResponse.json(
          {
            error: "Empresa de origem não encontrada.",
          },
          {
            status: 404,
          }
        );
      }

      if (!empresaOrigem.ativo) {
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

    let setor:
      | {
          id: string;
          nome: string;
          ativo: boolean;
          empresaId: string | null;
        }
      | null = null;

    if (setorId) {
      setor = await prisma.setor.findUnique({
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

      if (!setor.ativo) {
        return NextResponse.json(
          {
            error: "O setor selecionado está inativo.",
          },
          {
            status: 400,
          }
        );
      }

      if (setor.empresaId !== empresaOrigemId) {
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

    if (funcaoId) {
      const funcao = await prisma.funcao.findUnique({
        where: {
          id: funcaoId,
        },

        select: {
          id: true,
          nome: true,
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

      if (!funcao.ativo) {
        return NextResponse.json(
          {
            error: "A função selecionada está inativa.",
          },
          {
            status: 400,
          }
        );
      }

      if (funcao.setorId !== setorId) {
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

    const existe = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existe && existe.ativo) {
      return NextResponse.json(
        {
          error:
            "Já existe um colaborador ativo com esse email.",
        },
        {
          status: 400,
        }
      );
    }

    let fotoUrl: string | undefined;

    if (foto && foto.size > 0) {
      fotoUrl = await uploadFotoCloudinary(
        foto,
        email
      );
    }

    const senhaHash = await bcrypt.hash(senha, 10);

    /*
     * Verifica se os novos campos realmente vieram
     * no formulário.
     *
     * Isso evita apagar os dados profissionais de um
     * usuário inativo durante uma reativação feita por
     * uma tela antiga.
     */
    const enviouEmpresaOrigem =
      formData.has("empresaOrigemId");

    const enviouSetor = formData.has("setorId");
    const enviouFuncao = formData.has("funcaoId");

    if (existe && !existe.ativo) {
      const colaboradorReativado =
        await prisma.user.update({
          where: {
            email,
          },

          data: {
            nome,
            senha: senhaHash,
            perfil,
            ativo: true,

            ...(fotoUrl
              ? {
                  fotoUrl,
                }
              : {}),

            ...(enviouEmpresaOrigem
              ? {
                  empresaOrigemId:
                    empresaOrigemId || null,
                }
              : {}),

            ...(enviouSetor
              ? {
                  setorId: setorId || null,
                }
              : {}),

            ...(enviouFuncao
              ? {
                  funcaoId: funcaoId || null,
                }
              : {}),
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
                tipo: true,
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
        colaboradorReativado,
        {
          status: 200,
        }
      );
    }

    const colaborador = await prisma.user.create({
      data: {
        nome,
        email,
        senha: senhaHash,
        fotoUrl,
        perfil,
        ativo: true,

        empresaOrigemId:
          empresaOrigemId || null,

        setorId: setorId || null,
        funcaoId: funcaoId || null,
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
            tipo: true,
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

    return NextResponse.json(colaborador, {
      status: 201,
    });
  } catch (error) {
    console.error(
      "Erro ao criar colaborador:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Erro interno ao criar colaborador.",
      },
      {
        status: 500,
      }
    );
  }
}