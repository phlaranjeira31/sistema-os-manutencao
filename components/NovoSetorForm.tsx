"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Factory,
  Loader2,
  Plus,
} from "lucide-react";

type Empresa = {
  id: string;
  nome: string;
  sigla: string;
  ativo: boolean;
};

type NovoSetorFormProps = {
  empresaIdInicial?: string;
};

export default function NovoSetorForm({
  empresaIdInicial = "",
}: NovoSetorFormProps) {
  const router = useRouter();

  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [empresaId, setEmpresaId] = useState(empresaIdInicial);
  const [nome, setNome] = useState("");

  const [carregandoEmpresas, setCarregandoEmpresas] =
    useState(true);

  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  useEffect(() => {
    async function carregarEmpresas() {
      setCarregandoEmpresas(true);
      setErro("");

      try {
        const resposta = await fetch(
          "/api/admin/empresas?ativas=true",
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const dados = await resposta.json();

        if (!resposta.ok) {
          throw new Error(
            dados?.error || "Erro ao carregar empresas."
          );
        }

        const lista: Empresa[] = Array.isArray(dados)
          ? dados
          : [];

        setEmpresas(lista);

        const empresaSelecionada = lista.find(
          (empresa) => empresa.id === empresaIdInicial
        );

        const sequoia = lista.find(
          (empresa) => empresa.sigla === "SEQ"
        );

        if (empresaSelecionada) {
          setEmpresaId(empresaSelecionada.id);
        } else if (sequoia) {
          setEmpresaId(sequoia.id);
        } else if (lista.length > 0) {
          setEmpresaId(lista[0].id);
        } else {
          setEmpresaId("");
        }
      } catch (error) {
        setErro(
          error instanceof Error
            ? error.message
            : "Erro inesperado ao carregar empresas."
        );
      } finally {
        setCarregandoEmpresas(false);
      }
    }

    carregarEmpresas();
  }, [empresaIdInicial]);

  useEffect(() => {
    if (
      empresaIdInicial &&
      empresas.some(
        (empresa) => empresa.id === empresaIdInicial
      )
    ) {
      setEmpresaId(empresaIdInicial);
      setErro("");
      setSucesso("");
    }
  }, [empresaIdInicial, empresas]);

  async function criarSetor() {
    setErro("");
    setSucesso("");

    if (!empresaId) {
      setErro("Selecione a empresa do setor.");
      return;
    }

    if (!nome.trim()) {
      setErro("Informe o nome do setor.");
      return;
    }

    setLoading(true);

    try {
      const resposta = await fetch("/api/admin/setores", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          empresaId,
          nome: nome.trim(),
        }),
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados?.error || "Erro ao criar setor."
        );
      }

      setNome("");

      setSucesso(
        `Setor "${dados.nome}" adicionado à empresa ${
          dados.empresa?.nome ?? ""
        }.`
      );

      router.refresh();
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Erro inesperado ao criar setor."
      );
    } finally {
      setLoading(false);
    }
  }

  const formularioDesabilitado =
    loading ||
    carregandoEmpresas ||
    empresas.length === 0;

  return (
    <div className="space-y-5">
      {(erro || sucesso) && (
        <div
          aria-live="polite"
          className={`rounded-2xl border px-4 py-3 text-sm font-bold ${
            erro
              ? "border-red-400/30 bg-red-500/10 text-red-200"
              : "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
          }`}
        >
          {erro || sucesso}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <label className="mb-2 flex items-center gap-2 text-sm font-black text-slate-300">
            <Building2
              size={16}
              className="text-cyan-300"
            />
            Empresa
          </label>

          <select
            value={empresaId}
            onChange={(event) => {
              setEmpresaId(event.target.value);
              setErro("");
              setSucesso("");
            }}
            disabled={
              carregandoEmpresas || empresas.length === 0
            }
            className="h-14 w-full rounded-2xl border border-white/10 bg-[#020617] px-4 text-sm font-semibold text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {carregandoEmpresas ? (
              <option value="">
                Carregando empresas...
              </option>
            ) : empresas.length === 0 ? (
              <option value="">
                Nenhuma empresa ativa disponível
              </option>
            ) : (
              <>
                <option value="">
                  Selecione uma empresa
                </option>

                {empresas.map((empresa) => (
                  <option
                    key={empresa.id}
                    value={empresa.id}
                  >
                    {empresa.nome} — {empresa.sigla}
                  </option>
                ))}
              </>
            )}
          </select>
        </div>

        <div>
          <label className="mb-2 flex items-center gap-2 text-sm font-black text-slate-300">
            <Factory
              size={16}
              className="text-cyan-300"
            />
            Nome do setor
          </label>

          <input
            type="text"
            value={nome}
            onChange={(event) =>
              setNome(event.target.value)
            }
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                criarSetor();
              }
            }}
            disabled={formularioDesabilitado}
            placeholder="Ex: Manutenção, Produção, Administrativo..."
            className="h-14 w-full rounded-2xl border border-white/10 bg-[#020617] px-5 text-base font-medium text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-60"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={criarSetor}
        disabled={formularioDesabilitado}
        className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-6 text-sm font-black text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:scale-[1.01] hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60 md:w-auto"
      >
        {loading ? (
          <Loader2
            size={18}
            className="animate-spin"
          />
        ) : (
          <Plus size={18} />
        )}

        {loading
          ? "Adicionando..."
          : "Adicionar setor"}
      </button>
    </div>
  );
}