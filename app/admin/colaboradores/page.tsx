import Link from "next/link";
import { ArrowLeft, Mail, Plus, User, Users } from "lucide-react";
import BotaoEditarColaborador from "@/components/BotaoEditarColaborador";
import BotaoExcluirColaborador from "@/components/BotaoExcluirColaborador";
import { prisma } from "@/src/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function formatDate(date: Date | string | null | undefined) {
  if (!date) return "-";
  return new Intl.DateTimeFormat("pt-BR").format(new Date(date));
}

export default async function ColaboradoresPage() {
  const colaboradores = await prisma.user.findMany({
    where: {
      ativo: true,
    },
    orderBy: {
      nome: "asc",
    },
  });

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#050816] px-3 py-6 text-white sm:px-4 md:px-8 lg:px-10">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <header className="flex w-full min-w-0 flex-col gap-5 border-b border-white/10 pb-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10 text-cyan-300 shadow-lg shadow-cyan-950/30 sm:h-14 sm:w-14">
              <Users size={24} />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-bold text-cyan-300">Equipe</p>

              <h1 className="break-words text-2xl font-black tracking-tight text-white sm:text-3xl md:text-4xl">
                Colaboradores
              </h1>

              <p className="mt-1 break-words text-sm font-medium text-slate-400 sm:text-base">
                Visualize todos os colaboradores cadastrados.
              </p>
            </div>
          </div>

          <div className="grid w-full min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:flex lg:w-auto lg:flex-wrap lg:justify-end">
            <Link
              href="/admin"
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white px-5 py-3 text-sm font-black text-slate-950 shadow-lg transition hover:scale-[1.02] hover:bg-cyan-50 lg:w-auto"
            >
              <ArrowLeft size={17} />
              Voltar
            </Link>

            <Link
              href="/admin/colaboradores/novo"
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-black text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:scale-[1.02] hover:bg-cyan-300 lg:w-auto"
            >
              <Plus size={18} />
              Novo colaborador
            </Link>
          </div>
        </header>

        <section className="w-full min-w-0 rounded-3xl border border-white/10 bg-white/[0.04] p-3 shadow-2xl shadow-black/30 backdrop-blur sm:p-5 md:p-6">
          {colaboradores.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/15 bg-[#080d1f] p-8 text-center text-slate-400 sm:p-10">
              Nenhum colaborador cadastrado ainda.
            </div>
          ) : (
            <div className="grid w-full min-w-0 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {colaboradores.map((colaborador: any) => (
                <div
                  key={colaborador.id}
                  className="min-w-0 rounded-3xl border border-white/10 bg-[#080d1f] p-4 shadow-lg shadow-black/20 transition hover:border-cyan-400/40 hover:bg-[#0b1228] sm:p-5"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-[#050816] text-cyan-300 sm:h-12 sm:w-12">
                      {colaborador.fotoUrl ? (
                        <img
                          src={colaborador.fotoUrl}
                          alt={colaborador.nome}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <User size={22} />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h2 className="break-words text-base font-black leading-tight text-white sm:text-lg">
                        {colaborador.nome}
                      </h2>

                      <p className="mt-1 flex min-w-0 items-start gap-2 text-xs font-medium leading-relaxed text-slate-400 sm:text-sm">
                        <Mail
                          size={15}
                          className="mt-[2px] shrink-0 text-cyan-300"
                        />

                        <span className="min-w-0 break-all">
                          {colaborador.email}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid min-w-0 gap-3">
                    <div className="min-w-0 break-words rounded-2xl border border-white/10 bg-[#050816] p-3 text-sm text-slate-300">
                      <strong className="text-slate-100">Perfil:</strong>{" "}
                      {colaborador.perfil}
                    </div>

                    <div className="min-w-0 break-words rounded-2xl border border-white/10 bg-[#050816] p-3 text-sm text-slate-300">
                      <strong className="text-slate-100">Status:</strong>{" "}
                      <span
                        className={
                          colaborador.ativo
                            ? "font-bold text-emerald-300"
                            : "font-bold text-red-300"
                        }
                      >
                        {colaborador.ativo ? "Ativo" : "Inativo"}
                      </span>
                    </div>

                    <div className="min-w-0 break-words rounded-2xl border border-white/10 bg-[#050816] p-3 text-sm text-slate-300">
                      <strong className="text-slate-100">
                        Cadastrado em:
                      </strong>{" "}
                      {formatDate(colaborador.createdAt)}
                    </div>

                    <BotaoEditarColaborador
                      colaboradorId={colaborador.id}
                    />

                    <BotaoExcluirColaborador
                      colaboradorId={colaborador.id}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}