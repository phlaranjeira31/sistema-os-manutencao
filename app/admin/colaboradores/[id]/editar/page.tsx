import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";

import EditarColaboradorForm from "@/components/EditarColaboradorForm";
import { authOptions } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditarColaboradorPage({
  params,
}: Props) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const usuarioId = String(
    (session.user as { id?: string } | undefined)?.id ?? ""
  ).trim();

  if (!usuarioId) {
    redirect("/login");
  }

  const usuarioAutenticado = await prisma.user.findUnique({
    where: {
      id: usuarioId,
    },

    select: {
      perfil: true,
      ativo: true,
    },
  });

  if (!usuarioAutenticado?.ativo) {
    redirect("/login");
  }

  const { id } = await params;

  const colaborador = await prisma.user.findUnique({
    where: {
      id,
    },

    select: {
      id: true,
      nome: true,
      email: true,
      fotoUrl: true,
      ativo: true,
      perfil: true,

      empresaOrigemId: true,
      setorId: true,
      funcaoId: true,

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

  if (!colaborador) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#050816] px-4 py-6 text-white sm:px-6 md:px-10">
      <div className="mx-auto w-full max-w-5xl">
        <EditarColaboradorForm
          colaborador={colaborador}
          isAdmin={usuarioAutenticado.perfil === "ADMIN"}
        />
      </div>
    </main>
  );
}