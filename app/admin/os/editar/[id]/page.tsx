import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Settings } from "lucide-react";
import { prisma } from "@/src/lib/prisma";
import EditarOSForm from "@/components/EditarOSForm";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditarOSDetalhePage({ params }: PageProps) {
  const { id } = await params;

  const [os, setores] = await Promise.all([
    prisma.ordemServico.findUnique({
      where: { id },
      include: {
        setor: true,
      },
    }),

    prisma.setor.findMany({
      where: {
        ativo: true,
      },
      orderBy: {
        nome: "asc",
      },
    }),
  ]);

  if (!os) return notFound();

  return (
    <main className="min-h-screen bg-[#050816] text-white">
      <div className="mx-auto max-w-5xl px-4 py-8 md:px-10 space-y-6">
        <header className="flex flex-col gap-5 border-b border-white/10 pb-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10 text-cyan-300 shadow-lg shadow-cyan-950/30">
              <Settings size={26} />
            </div>

            <div>
              <p className="text-sm font-bold text-cyan-300 mb-1">
                Gerenciamento
              </p>

              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white">
                Editar OS #{os.numero}
              </h1>

              <p className="text-slate-400 mt-1">{os.titulo}</p>
            </div>
          </div>

          <Link
            href="/admin/os/editar"
            className="inline-flex w-fit items-center gap-2 rounded-2xl border border-white/10 bg-white px-5 py-3 text-sm font-black text-slate-950 shadow-lg transition hover:scale-[1.02] hover:bg-cyan-50"
          >
            <ArrowLeft size={17} />
            Voltar
          </Link>
        </header>
        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/20 backdrop-blur">
          <EditarOSForm os={os} setores={setores} />
        </section>
      </div>
    </main>
  );
}