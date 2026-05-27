import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/src/lib/prisma";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

type Props = {
  params: Promise<{ id: string }>;
};

export async function PATCH(req: Request, { params }: Props) {
  try {
    const { id } = await params;
    const formData = await req.formData();

    const nome = String(formData.get("nome") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const senha = String(formData.get("senha") ?? "").trim();
    const ativo = String(formData.get("ativo") ?? "true") === "true";
    const foto = formData.get("foto") as File | null;
    const perfilRecebido = String(formData.get("perfil") ?? "COLABORADOR").trim();
    const perfil = perfilRecebido === "ADMIN" ? "ADMIN" : "COLABORADOR";

    if (!nome) {
      return NextResponse.json({ error: "Informe o nome." }, { status: 400 });
    }

    if (!email) {
      return NextResponse.json({ error: "Informe o email." }, { status: 400 });
    }

    const colaboradorAtual = await prisma.user.findUnique({
      where: { id },
    });

    if (!colaboradorAtual) {
      return NextResponse.json(
        { error: "Colaborador não encontrado." },
        { status: 404 }
      );
    }

    const emailExiste = await prisma.user.findUnique({
      where: { email },
    });

    if (emailExiste && emailExiste.id !== id) {
      return NextResponse.json(
        { error: "Já existe outro colaborador com esse email." },
        { status: 400 }
      );
    }

    let fotoUrl = colaboradorAtual.fotoUrl;

    if (foto && foto.size > 0) {
      const bytes = await foto.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const ext = foto.name.split(".").pop() || "jpg";
      const fileName = `${Date.now()}-${email.replace(/[^a-zA-Z0-9]/g, "")}.${ext}`;

      const uploadDir = path.join(
        process.cwd(),
        "public",
        "uploads",
        "colaboradores"
      );

      await mkdir(uploadDir, { recursive: true });

      const filePath = path.join(uploadDir, fileName);
      await writeFile(filePath, buffer);

      fotoUrl = `/uploads/colaboradores/${fileName}`;
    }

    const data: any = {
      nome,
      email,
      ativo,
      fotoUrl,
      perfil,
    };

    if (senha) {
      if (senha.length < 6) {
        return NextResponse.json(
          { error: "A senha precisa ter pelo menos 6 caracteres." },
          { status: 400 }
        );
      }

      data.senha = await bcrypt.hash(senha, 10);
    }

    const colaborador = await prisma.user.update({
      where: { id },
      data,
    });

    return NextResponse.json(colaborador);
  } catch (error) {
    console.error("Erro ao editar colaborador:", error);

    return NextResponse.json(
      { error: "Erro interno ao editar colaborador." },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: Request, { params }: Props) {
  try {
    const { id } = await params;

    const colaboradorAtual = await prisma.user.findUnique({
      where: { id },
    });

    if (!colaboradorAtual) {
      return NextResponse.json(
        { error: "Colaborador não encontrado." },
        { status: 404 }
      );
    }

    await prisma.user.update({
      where: { id },
      data: {
        ativo: false,
      },
    });

    return NextResponse.json({
      ok: true,
      message: "Colaborador excluído com sucesso.",
    });
  } catch (error) {
    console.error("Erro ao excluir colaborador:", error);

    return NextResponse.json(
      { error: "Erro interno ao excluir colaborador." },
      { status: 500 }
    );
  }
}