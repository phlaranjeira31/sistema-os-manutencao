import { prisma } from "@/src/lib/prisma";
import { notFound } from "next/navigation";
import EditarColaboradorForm from "@/components/EditarColaboradorForm";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditarColaboradorPage({ params }: Props) {
  const { id } = await params;

  const colaborador = await prisma.user.findUnique({
    where: { id },
  });

  if (!colaborador) return notFound();

  return (
    <main className="min-h-screen bg-[#050816] px-4 py-6 text-white sm:px-6 md:px-10">
      <div className="mx-auto w-full max-w-3xl">
        <EditarColaboradorForm colaborador={colaborador} />
      </div>
    </main>
  );
}