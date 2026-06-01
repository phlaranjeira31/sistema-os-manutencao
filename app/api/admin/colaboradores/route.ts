import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/src/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const nome = String(formData.get("nome") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const senha = String(formData.get("senha") ?? "").trim();
    const foto = formData.get("foto") as File | null;

    const perfilRecebido = String(
      formData.get("perfil") ?? "COLABORADOR"
    ).trim();

    const perfil = perfilRecebido === "ADMIN" ? "ADMIN" : "COLABORADOR";

    if (!nome) {
      return NextResponse.json(
        { error: "Informe o nome do colaborador." },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { error: "Informe o email do colaborador." },
        { status: 400 }
      );
    }

    if (!senha || senha.length < 6) {
      return NextResponse.json(
        { error: "A senha precisa ter pelo menos 6 caracteres." },
        { status: 400 }
      );
    }

    let fotoUrl: string | undefined;

    if (foto && foto.size > 0) {
      const bytes = await foto.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const ext = foto.name.split(".").pop() || "jpg";
      const fileName = `${Date.now()}-${email.replace(
        /[^a-zA-Z0-9]/g,
        ""
      )}.${ext}`;

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

    const senhaHash = await bcrypt.hash(senha, 10);

    const existe = await prisma.user.findUnique({
      where: { email },
    });

    if (existe && existe.ativo) {
      return NextResponse.json(
        { error: "Já existe um colaborador ativo com esse email." },
        { status: 400 }
      );
    }

    if (existe && !existe.ativo) {
      const colaboradorReativado = await prisma.user.update({
        where: { email },
        data: {
          nome,
          senha: senhaHash,
          perfil,
          ativo: true,
          ...(fotoUrl ? { fotoUrl } : {}),
        },
      });

      return NextResponse.json(colaboradorReativado, { status: 200 });
    }

    const colaborador = await prisma.user.create({
      data: {
        nome,
        email,
        senha: senhaHash,
        fotoUrl,
        perfil,
        ativo: true,
      },
    });

    return NextResponse.json(colaborador, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar colaborador:", error);

    return NextResponse.json(
      { error: "Erro interno ao criar colaborador." },
      { status: 500 }
    );
  }
}