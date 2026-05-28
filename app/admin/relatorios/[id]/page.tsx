import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ClipboardList, FileText } from "lucide-react";
import FormRelatorioOS from "@/components/FormRelatorioOS";
import AlterarStatusRelatorio from "@/components/AlterarStatusRelatorio";
import { prisma } from "@/src/lib/prisma";

type PageProps = {
  params: Promise<{ id: string }>;
};

function formatDate(date: Date | string | null | undefined) {
  if (!date) return "-";
  return new Intl.DateTimeFormat("pt-BR").format(new Date(date));
}

export default async function RelatorioOSPage({ params }: PageProps) {
  const { id } = await params;

  const os = await prisma.ordemServico.findUnique({
    where: { id },
    include: {
      setor: true,
      responsaveis: {
        include: {
          user: true,
        },
      },
    },
  });

  if (!os) return notFound();

  return (
    <main className="min-h-screen bg-[#050816] px-4 py-8 text-white md:px-10">
      <div className="mx-auto max-w-5xl space-y-6">

        {/* HEADER */}
        <header className="flex flex-col gap-5 border-b border-white/10 pb-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10 text-cyan-300 shadow-lg shadow-cyan-950/30">
              <FileText size={26} />
            </div>

            <div>
              <p className="text-sm font-bold text-cyan-300">Relatório</p>
              <h1 className="text-3xl font-black md:text-4xl">
                OS #{os.numero}
              </h1>
              <p className="text-slate-400">{os.titulo}</p>
            </div>
          </div>

          <Link
  href="/admin/relatorios"
  className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white px-6 py-3 text-sm font-black text-black transition hover:scale-[1.02]"
>
  <ArrowLeft size={18} />
  Voltar para relatórios
</Link>
        </header>

        {/* DADOS */}
        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-xl bg-cyan-400 p-2 text-slate-950">
              <ClipboardList size={20} />
            </div>

            <div>
              <h2 className="text-xl font-black">
                Dados da ordem de serviço
              </h2>
              <p className="text-sm text-slate-400">
                Informações usadas no relatório
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Info label="Título" value={os.titulo} />
            <Info label="Setor" value={os.setor?.nome ?? "-"} />
            <Info label="Status" value={<AlterarStatusRelatorio os={os} />} />
            <Info label="Prioridade" value={os.prioridade} />
            <Info label="Criada em" value={formatDate(os.createdAt)} />
            <Info label="Atualizada em" value={formatDate(os.updatedAt)} />
          </div>

          <div className="mt-6">
            <p className="mb-2 text-sm font-bold text-slate-400">Descrição</p>
            <div className="rounded-2xl border border-white/10 bg-[#080d1f] p-4 text-slate-300">
              {os.descricao || "-"}
            </div>
          </div>

          <div className="mt-6">
            <p className="mb-2 text-sm font-bold text-slate-400">
              Responsável
            </p>
            <div className="rounded-2xl border border-white/10 bg-[#080d1f] p-4 text-slate-300">
              {os.responsaveis.length
                ? os.responsaveis.map((r: any) => r.user.nome).join(", ")
                : "Ainda não atribuído"}
            </div>
          </div>
        </section>
        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur">
          <h2 className="text-xl font-black">Escrever relatório</h2>

          <p className="mt-1 text-sm text-slate-400">
            Descreva o serviço executado, materiais utilizados e conclusão.
          </p>

          <FormRelatorioOS
  osId={os.id}
  registroAtual={os.registroFinal}
  dadosOS={{
    numero: os.numero,
    titulo: os.titulo,
    setor: os.setor?.nome ?? "-",
    status: os.status,
    prioridade: os.prioridade,
    criadaEm: formatDate(os.createdAt),
    atualizadaEm: formatDate(os.updatedAt),
    descricao: os.descricao || "-",
    responsavel: os.responsaveis.length
      ? os.responsaveis.map((r: any) => r.user.nome).join(", ")
      : "Ainda não atribuído",
  }}
/>
        </section>
      </div>
    </main>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#080d1f] p-4">
      <p className="text-sm font-bold text-slate-400">{label}</p>
      <div className="mt-1 font-bold text-white">{value}</div>
    </div>
  );
}