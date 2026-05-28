import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
  const senhaHash = await bcrypt.hash("admin123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@sistema.com" },
    update: {},
    create: {
      nome: "Administrador",
      email: "admin@sistema.com",
      senha: senhaHash,
      perfil: "ADMIN",
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
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });