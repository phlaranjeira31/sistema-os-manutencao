import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
} from "lucide-react";
import { prisma } from "@/src/lib/prisma";

export const dynamic = "force-dynamic";

const ORDEM_EMPRESAS: Record<string, number> = {
  SEQ: 1,
  SHA: 2,
  OCO: 3,
};

const IDENTIDADE_EMPRESAS: Record<
  string,
  {
    cor: string;
    logo: string;
  }
> = {
  SEQ: {
    cor: "#E31E24",
    logo: "/logo.sequoia.png",
  },
  SHA: {
    cor: "#003E71",
    logo: "/empresas/shasta.jpg",
  },
  OCO: {
    cor: "#517F3B",
    logo: "/empresas/ocotillo.png",
  },
};

export default async function EmpresasPage() {
  const empresasEncontradas =
    await prisma.empresa.findMany({
      where: {
        sigla: {
          in: ["SEQ", "SHA", "OCO"],
        },
      },
      select: {
        id: true,
        nome: true,
        sigla: true,
        ativo: true,
        cor: true,
        _count: {
          select: {
            setores: true,
            ordens: true,
          },
        },
      },
    });

  const empresas = empresasEncontradas.sort(
    (a, b) =>
      (ORDEM_EMPRESAS[a.sigla] ?? 99) -
      (ORDEM_EMPRESAS[b.sigla] ?? 99)
  );

  return (
    <main className="min-h-screen bg-[#050816] px-4 py-8 text-white md:px-10">
      <div className="mx-auto max-w-7xl space-y-7">
        <header className="flex flex-col gap-5 border-b border-white/10 pb-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10 text-cyan-300">
              <Building2 size={27} />
            </div>

            <div>
              <p className="text-sm font-bold text-cyan-300">
                Gestão corporativa
              </p>

              <h1 className="text-3xl font-black md:text-4xl">
                Empresas do grupo
              </h1>

              <p className="text-slate-400">
                Selecione uma empresa para acessar seu
                dashboard.
              </p>
            </div>
          </div>

          <Link
            href="/admin"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-50"
          >
            <ArrowLeft size={17} />
            Voltar
          </Link>
        </header>

        {empresas.length === 0 ? (
          <section className="rounded-3xl border border-dashed border-white/20 bg-white/[0.03] p-10 text-center">
            <Building2
              size={38}
              className="mx-auto mb-4 text-slate-500"
            />

            <h2 className="text-xl font-black">
              Empresas não encontradas
            </h2>

            <p className="mt-2 text-slate-400">
              As empresas do grupo ainda não estão
              disponíveis neste banco.
            </p>
          </section>
        ) : (
          <section className="grid gap-6 lg:grid-cols-3">
            {empresas.map((empresa) => {
              const identidade =
                IDENTIDADE_EMPRESAS[empresa.sigla];

              const cor =
                identidade?.cor ||
                empresa.cor ||
                "#22D3EE";

              const logo =
                identidade?.logo ||
                "/logo.sequoia.png";

              return (
                <article
                  key={empresa.id}
                  className="group overflow-hidden rounded-3xl border bg-[#080d1f] shadow-2xl transition duration-300 hover:-translate-y-1 hover:brightness-110"
                  style={{
                    borderColor: `${cor}55`,
                    background: `radial-gradient(circle at 100% 0%, ${cor}25, transparent 38%), #080d1f`,
                    boxShadow: `0 22px 60px ${cor}18`,
                  }}
                >
                  <div
                    className="h-2"
                    style={{
                      backgroundColor: cor,
                      boxShadow: `0 0 24px ${cor}90`,
                    }}
                  />

                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div
                        className="relative h-24 w-44 overflow-hidden rounded-2xl border bg-white"
                        style={{
                          borderColor: `${cor}70`,
                          boxShadow: `0 12px 30px ${cor}25`,
                        }}
                      >
                        <Image
                          src={logo}
                          alt={`Logo ${empresa.nome}`}
                          fill
                          sizes="176px"
                          className="object-contain p-3"
                          priority
                        />
                      </div>

                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black ${
                          empresa.ativo
                            ? "bg-emerald-500/15 text-emerald-300"
                            : "bg-red-500/15 text-red-300"
                        }`}
                      >
                        <CheckCircle2 size={13} />

                        {empresa.ativo
                          ? "Ativa"
                          : "Inativa"}
                      </span>
                    </div>

                    <div className="mt-6">
                      <p
                        className="text-sm font-black"
                        style={{
                          color: cor,
                        }}
                      >
                        {empresa.sigla}
                      </p>

                      <h2 className="mt-1 text-3xl font-black">
                        {empresa.nome}
                      </h2>
                    </div>

                    <div className="mt-6 grid grid-cols-2 gap-3">
                      <div
                        className="rounded-2xl border p-4"
                        style={{
                          borderColor: `${cor}35`,
                          backgroundColor: `${cor}0F`,
                        }}
                      >
                        <div
                          className="flex items-center gap-2"
                          style={{
                            color: cor,
                          }}
                        >
                          <Building2 size={16} />

                          <p className="text-xs font-bold uppercase">
                            Setores
                          </p>
                        </div>

                        <p className="mt-2 text-2xl font-black">
                          {empresa._count.setores}
                        </p>
                      </div>

                      <div
                        className="rounded-2xl border p-4"
                        style={{
                          borderColor: `${cor}35`,
                          backgroundColor: `${cor}0F`,
                        }}
                      >
                        <div
                          className="flex items-center gap-2"
                          style={{
                            color: cor,
                          }}
                        >
                          <ClipboardList size={16} />

                          <p className="text-xs font-bold uppercase">
                            Ordens
                          </p>
                        </div>

                        <p className="mt-2 text-2xl font-black">
                          {empresa._count.ordens}
                        </p>
                      </div>
                    </div>

                    <Link
                      href={`/admin/empresas/${empresa.sigla.toLowerCase()}`}
                      className="mt-6 inline-flex w-full items-center justify-between rounded-2xl px-5 py-4 text-sm font-black text-white transition hover:brightness-110"
                      style={{
                        backgroundColor: cor,
                        boxShadow: `0 14px 32px ${cor}38`,
                      }}
                    >
                      Acessar empresa

                      <ChevronRight
                        size={19}
                        className="transition group-hover:translate-x-1"
                      />
                    </Link>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}