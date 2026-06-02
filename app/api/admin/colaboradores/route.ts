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
          reject(error || new Error("Erro ao enviar foto para o Cloudinary."));
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

    const existe = await prisma.user.findUnique({
      where: { email },
    });

    if (existe && existe.ativo) {
      return NextResponse.json(
        { error: "Já existe um colaborador ativo com esse email." },
        { status: 400 }
      );
    }

    let fotoUrl: string | undefined;

    if (foto && foto.size > 0) {
      fotoUrl = await uploadFotoCloudinary(foto, email);
    }

    const senhaHash = await bcrypt.hash(senha, 10);

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