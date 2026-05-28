import "dotenv/config";
import { PrismaClient, PerfilUsuario } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const senhaHash = await bcrypt.hash("admin123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@sistema.com" },
    update: {},
    create: {
      nome: "Administrador",
      email: "admin@sistema.com",
      senha: senhaHash,
      perfil: PerfilUsuario.ADMIN,
    },
  });

  await prisma.setor.createMany({
    data: [
      { nome: "Manutenção" },
      { nome: "Elétrica" },
      { nome: "Hidráulica" },
      { nome: "Limpeza" },
      { nome: "TI" },
      { nome: "Obra" },
    ],
    skipDuplicates: true,
  });

  console.log("Admin criado:", admin.email);
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });