import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Settings } from "lucide-react";

import { prisma } from "@/src/lib/prisma";
import EditarOSForm from "@/components/EditarOSForm";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function EditarOSDetalhePage({
  params,
}: PageProps) {
  const { id } = await params;

  const [os, setores] = await Promise.all([
    prisma.ordemServico.findUnique({
      where: {
        id,
      },

      include: {
        setor: true,

        maquina: {
          select: {
            id: true,
            nome: true,
            setorId: true,
            ativo: true,
          },
        },

        criadoPor: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },

        fotos: {
          select: {
            id: true,
            url: true,
            publicId: true,
            createdAt: true,
          },

          orderBy: {
            createdAt: "asc",
          },
        },
      },
    }),

    prisma.setor.findMany({
      where: {
        ativo: true,
      },

      select: {
        id: true,
        nome: true,
      },

      orderBy: {
        nome: "asc",
      },
    }),
  ]);

  if (!os) {
    return notFound();
  }

  return (
    <main className="min-h-screen bg-[#050816] text-white">
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 md:px-10">
        <header className="flex flex-col gap-5 border-b border-white/10 pb-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10 text-cyan-300 shadow-lg shadow-cyan-950/30">
              <Settings size={26} />
            </div>

            <div className="min-w-0">
              <p className="mb-1 text-sm font-bold text-cyan-300">
                Gerenciamento
              </p>

              <h1 className="break-words text-3xl font-black tracking-tight text-white md:text-4xl">
                Editar OS #{os.numero}
              </h1>

              <p className="mt-1 break-words text-slate-400">
                {os.titulo}
              </p>
            </div>
          </div>

          <Link
            href="/admin/os/editar"
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white px-5 py-3 text-sm font-black text-slate-950 shadow-lg transition hover:scale-[1.02] hover:bg-cyan-50 sm:w-fit"
          >
            <ArrowLeft size={17} />
            Voltar
          </Link>
        </header>

        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-black/20 backdrop-blur sm:p-6">
          <EditarOSForm
            os={os}
            setores={setores}
          />
        </section>
      </div>
    </main>
  );
}