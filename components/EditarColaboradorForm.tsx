"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Briefcase,
  Building2,
  ImagePlus,
  Lock,
  Mail,
  Save,
  User,
  UserCog,
} from "lucide-react";

type Empresa = {
  id: string;
  nome: string;
  sigla: string;
  ativo?: boolean;
};

type Setor = {
  id: string;
  nome: string;
  empresaId?: string | null;
  ativo?: boolean;
};

type Funcao = {
  id: string;
  nome: string;
  setorId?: string;
  ativo?: boolean;
};

type Colaborador = {
  id: string;
  nome: string;
  email: string;
  fotoUrl: string | null;
  ativo: boolean;
  perfil: string;

  empresaOrigemId?: string | null;
  setorId?: string | null;
  funcaoId?: string | null;

  empresaOrigem?: {
    id: string;
    nome: string;
    sigla?: string;
  } | null;

  setor?: {
    id: string;
    nome: string;
  } | null;

  funcao?: {
    id: string;
    nome: string;
  } | null;
};

function extrairLista<T>(
  resposta: unknown,
  propriedade: "empresas" | "setores" | "funcoes"
): T[] {
  if (Array.isArray(resposta)) {
    return resposta as T[];
  }

  if (
    resposta &&
    typeof resposta === "object" &&
    propriedade in resposta
  ) {
    const lista = (
      resposta as Record<string, unknown>
    )[propriedade];

    if (Array.isArray(lista)) {
      return lista as T[];
    }
  }

  return [];
}

export default function EditarColaboradorForm({
  colaborador,
}: {
  colaborador: Colaborador;
}) {
  const router = useRouter();

  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);

  const [carregandoEmpresas, setCarregandoEmpresas] =
    useState(false);

  const [carregandoSetores, setCarregandoSetores] =
    useState(false);

  const [carregandoFuncoes, setCarregandoFuncoes] =
    useState(false);

  const [erro, setErro] = useState("");

  const [foto, setFoto] = useState<File | null>(null);

  const [fotoPreview, setFotoPreview] = useState<
    string | null
  >(colaborador.fotoUrl);

  const [empresas, setEmpresas] = useState<Empresa[]>(
    []
  );

  const [setores, setSetores] = useState<Setor[]>([]);

  const [funcoes, setFuncoes] = useState<Funcao[]>([]);

  const [form, setForm] = useState({
    nome: colaborador.nome,
    email: colaborador.email,
    senha: "",
    ativo: String(colaborador.ativo),
    perfil: colaborador.perfil,

    empresaOrigemId:
      colaborador.empresaOrigemId ??
      colaborador.empresaOrigem?.id ??
      "",

    setorId:
      colaborador.setorId ??
      colaborador.setor?.id ??
      "",

    funcaoId:
      colaborador.funcaoId ??
      colaborador.funcao?.id ??
      "",
  });

  useEffect(() => {
    try {
      const user = localStorage.getItem("user");

      if (user) {
        const usuario = JSON.parse(user);

        setIsAdmin(
          usuario?.perfil === "ADMIN"
        );
      }
    } catch (error) {
      console.error(
        "Erro ao verificar usuário local:",
        error
      );

      setIsAdmin(false);
    }
  }, []);

  useEffect(() => {
    let ativo = true;

    async function carregarEmpresas() {
      try {
        setCarregandoEmpresas(true);

        const resposta = await fetch(
          "/api/admin/empresas?ativas=true",
          {
            cache: "no-store",
          }
        );

        const dados = await resposta.json();

        if (!resposta.ok) {
          throw new Error(
            dados?.error ||
              "Erro ao carregar empresas."
          );
        }

        if (!ativo) return;

        const lista = extrairLista<Empresa>(
          dados,
          "empresas"
        );

        setEmpresas(lista);
      } catch (error) {
        if (!ativo) return;

        console.error(
          "Erro ao carregar empresas:",
          error
        );

        setErro(
          error instanceof Error
            ? error.message
            : "Erro ao carregar empresas."
        );
      } finally {
        if (ativo) {
          setCarregandoEmpresas(false);
        }
      }
    }

    carregarEmpresas();

    return () => {
      ativo = false;
    };
  }, []);

  useEffect(() => {
    let ativo = true;

    async function carregarSetores() {
      if (!form.empresaOrigemId) {
        setSetores([]);
        return;
      }

      try {
        setCarregandoSetores(true);

        const parametros = new URLSearchParams({
          empresaId: form.empresaOrigemId,
          ativas: "true",
        });

        const resposta = await fetch(
          `/api/admin/setores?${parametros.toString()}`,
          {
            cache: "no-store",
          }
        );

        const dados = await resposta.json();

        if (!resposta.ok) {
          throw new Error(
            dados?.error ||
              "Erro ao carregar setores."
          );
        }

        if (!ativo) return;

        const lista = extrairLista<Setor>(
          dados,
          "setores"
        );

        setSetores(lista);
      } catch (error) {
        if (!ativo) return;

        console.error(
          "Erro ao carregar setores:",
          error
        );

        setSetores([]);

        setErro(
          error instanceof Error
            ? error.message
            : "Erro ao carregar setores."
        );
      } finally {
        if (ativo) {
          setCarregandoSetores(false);
        }
      }
    }

    carregarSetores();

    return () => {
      ativo = false;
    };
  }, [form.empresaOrigemId]);

  useEffect(() => {
    let ativo = true;

    async function carregarFuncoes() {
      if (!form.setorId) {
        setFuncoes([]);
        return;
      }

      try {
        setCarregandoFuncoes(true);

        const parametros = new URLSearchParams({
          setorId: form.setorId,
          ativas: "true",
        });

        const resposta = await fetch(
          `/api/admin/funcoes?${parametros.toString()}`,
          {
            cache: "no-store",
          }
        );

        const dados = await resposta.json();

        if (!resposta.ok) {
          throw new Error(
            dados?.error ||
              "Erro ao carregar funções."
          );
        }

        if (!ativo) return;

        const lista = extrairLista<Funcao>(
          dados,
          "funcoes"
        );

        setFuncoes(lista);
      } catch (error) {
        if (!ativo) return;

        console.error(
          "Erro ao carregar funções:",
          error
        );

        setFuncoes([]);

        setErro(
          error instanceof Error
            ? error.message
            : "Erro ao carregar funções."
        );
      } finally {
        if (ativo) {
          setCarregandoFuncoes(false);
        }
      }
    }

    carregarFuncoes();

    return () => {
      ativo = false;
    };
  }, [form.setorId]);

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement
    >
  ) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleEmpresaChange(
    e: React.ChangeEvent<HTMLSelectElement>
  ) {
    const empresaOrigemId = e.target.value;

    setForm((prev) => ({
      ...prev,
      empresaOrigemId,
      setorId: "",
      funcaoId: "",
    }));

    setSetores([]);
    setFuncoes([]);
  }

  function handleSetorChange(
    e: React.ChangeEvent<HTMLSelectElement>
  ) {
    const setorId = e.target.value;

    setForm((prev) => ({
      ...prev,
      setorId,
      funcaoId: "",
    }));

    setFuncoes([]);
  }

  function handleFotoChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];

    if (!file) return;

    setFoto(file);
    setFotoPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();
    setErro("");

    try {
      setLoading(true);

      const data = new FormData();

      data.append("nome", form.nome);
      data.append("email", form.email);
      data.append("senha", form.senha);
      data.append("ativo", form.ativo);
      data.append("perfil", form.perfil);

      /*
       * Somente administradores enviam os dados
       * profissionais.
       *
       * Quando um colaborador edita o próprio perfil,
       * esses vínculos permanecem preservados.
       */
      if (isAdmin) {
        data.append(
          "empresaOrigemId",
          form.empresaOrigemId
        );

        data.append("setorId", form.setorId);
        data.append("funcaoId", form.funcaoId);
      }

      if (foto) {
        data.append("foto", foto);
      }

      const res = await fetch(
        `/api/admin/colaboradores/${colaborador.id}`,
        {
          method: "PATCH",
          body: data,
        }
      );

      const response = await res.json();

      if (!res.ok) {
        throw new Error(
          response?.error ||
            "Erro ao editar colaborador."
        );
      }

      const userLocal =
        localStorage.getItem("user");

      if (userLocal) {
        const userAtual = JSON.parse(userLocal);

        if (userAtual.id === colaborador.id) {
          localStorage.setItem(
            "user",
            JSON.stringify({
              ...userAtual,
              nome: form.nome,
              email: form.email,
              perfil: form.perfil,
              fotoUrl:
                response?.fotoUrl ??
                userAtual.fotoUrl,

              empresaOrigemId:
                response?.empresaOrigemId ??
                userAtual.empresaOrigemId,

              setorId:
                response?.setorId ??
                userAtual.setorId,

              funcaoId:
                response?.funcaoId ??
                userAtual.funcaoId,
            })
          );
        }
      }

      router.push("/admin");
      router.refresh();
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Erro ao editar colaborador."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-full overflow-hidden">
      <header className="mb-6 border-b border-white/10 pb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10 text-cyan-300">
              <UserCog size={22} />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-bold text-cyan-300">
                Edição
              </p>

              <h1 className="break-words text-2xl font-black leading-tight sm:text-3xl">
                Editar colaborador
              </h1>

              <p className="break-words text-sm text-slate-400">
                Atualize os dados pessoais e
                profissionais do colaborador
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => router.push("/admin")}
            className="inline-flex w-fit shrink-0 items-center gap-2 rounded-2xl bg-white px-5 py-2 text-sm font-bold text-slate-950"
          >
            <ArrowLeft size={16} />
            Voltar
          </button>
        </div>
      </header>

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-full space-y-6 rounded-3xl border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-black/30 backdrop-blur sm:p-6"
      >
        {erro && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300">
            {erro}
          </div>
        )}

        <section className="space-y-5">
          <div>
            <h2 className="text-lg font-black text-white">
              Dados pessoais
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Informações de acesso e identificação.
            </p>
          </div>

          <div>
            <label className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-400">
              <ImagePlus size={17} />
              Foto
            </label>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-[#050816]">
                {fotoPreview ? (
                  <img
                    src={fotoPreview}
                    alt="Foto"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User
                    className="text-slate-500"
                    size={28}
                  />
                )}
              </div>

              <input
                type="file"
                accept="image/*"
                onChange={handleFotoChange}
                className="block w-full min-w-0 max-w-full overflow-hidden rounded-xl border border-white/10 bg-[#050816] px-3 py-3 text-xs text-slate-300 file:mr-2 file:rounded-lg file:border-0 file:bg-cyan-400 file:px-3 file:py-2 file:text-xs file:font-bold file:text-slate-950 sm:text-sm sm:file:text-sm"
              />
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-400">
                <User size={17} />
                Nome
              </label>

              <input
                name="nome"
                value={form.nome}
                onChange={handleChange}
                required
                className="w-full min-w-0 rounded-xl border border-white/10 bg-[#050816] px-4 py-3 text-sm font-semibold text-white outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-400">
                <Mail size={17} />
                Email
              </label>

              <input
                name="email"
                value={form.email}
                onChange={handleChange}
                type="email"
                required
                className="w-full min-w-0 rounded-xl border border-white/10 bg-[#050816] px-4 py-3 text-sm font-semibold text-white outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-400">
              <Lock size={17} />
              Nova senha
            </label>

            <input
              name="senha"
              value={form.senha}
              onChange={handleChange}
              type="password"
              placeholder="Deixe em branco para não alterar"
              className="w-full min-w-0 rounded-xl border border-white/10 bg-[#050816] px-4 py-3 text-sm font-semibold text-white placeholder:text-slate-500 outline-none focus:border-cyan-400"
            />
          </div>
        </section>

        {isAdmin && (
          <>
            <div className="border-t border-white/10" />

            <section className="space-y-5">
              <div>
                <h2 className="text-lg font-black text-white">
                  Dados profissionais
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  Defina a empresa de origem, o setor e
                  a função do colaborador.
                </p>
              </div>

              <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-3">
                <p className="text-sm font-semibold leading-relaxed text-cyan-100">
                  Somente colaboradores vinculados ao
                  setor de Manutenção poderão receber
                  ordens de serviço.
                </p>
              </div>

              <div className="grid gap-5 md:grid-cols-3">
                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-400">
                    <Building2 size={17} />
                    Empresa de origem
                  </label>

                  <select
                    name="empresaOrigemId"
                    value={form.empresaOrigemId}
                    onChange={handleEmpresaChange}
                    disabled={carregandoEmpresas}
                    className="w-full min-w-0 rounded-xl border border-white/10 bg-[#050816] px-4 py-3 text-sm font-semibold text-white outline-none focus:border-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <option value="">
                      {carregandoEmpresas
                        ? "Carregando empresas..."
                        : "Não definida"}
                    </option>

                    {empresas.map((empresa) => (
                      <option
                        key={empresa.id}
                        value={empresa.id}
                      >
                        {empresa.sigla
                          ? `${empresa.sigla} - ${empresa.nome}`
                          : empresa.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-400">
                    <UserCog size={17} />
                    Setor
                  </label>

                  <select
                    name="setorId"
                    value={form.setorId}
                    onChange={handleSetorChange}
                    disabled={
                      !form.empresaOrigemId ||
                      carregandoSetores
                    }
                    className="w-full min-w-0 rounded-xl border border-white/10 bg-[#050816] px-4 py-3 text-sm font-semibold text-white outline-none focus:border-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <option value="">
                      {!form.empresaOrigemId
                        ? "Selecione a empresa"
                        : carregandoSetores
                          ? "Carregando setores..."
                          : "Não definido"}
                    </option>

                    {setores.map((setor) => (
                      <option
                        key={setor.id}
                        value={setor.id}
                      >
                        {setor.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-400">
                    <Briefcase size={17} />
                    Função
                  </label>

                  <select
                    name="funcaoId"
                    value={form.funcaoId}
                    onChange={handleChange}
                    disabled={
                      !form.setorId ||
                      carregandoFuncoes
                    }
                    className="w-full min-w-0 rounded-xl border border-white/10 bg-[#050816] px-4 py-3 text-sm font-semibold text-white outline-none focus:border-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <option value="">
                      {!form.setorId
                        ? "Selecione o setor"
                        : carregandoFuncoes
                          ? "Carregando funções..."
                          : "Não definida"}
                    </option>

                    {funcoes.map((funcao) => (
                      <option
                        key={funcao.id}
                        value={funcao.id}
                      >
                        {funcao.nome}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            <div className="border-t border-white/10" />

            <section className="space-y-5">
              <div>
                <h2 className="text-lg font-black text-white">
                  Acesso ao sistema
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  Controle o perfil e o status do
                  usuário.
                </p>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-400">
                    Perfil
                  </label>

                  <select
                    name="perfil"
                    value={form.perfil}
                    onChange={handleChange}
                    className="w-full min-w-0 rounded-xl border border-white/10 bg-[#050816] px-4 py-3 text-sm font-semibold text-white outline-none focus:border-cyan-400"
                  >
                    <option value="COLABORADOR">
                      Colaborador
                    </option>

                    <option value="ADMIN">
                      Administrador
                    </option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-400">
                    Status
                  </label>

                  <select
                    name="ativo"
                    value={form.ativo}
                    onChange={handleChange}
                    className="w-full min-w-0 rounded-xl border border-white/10 bg-[#050816] px-4 py-3 text-sm font-semibold text-white outline-none focus:border-cyan-400"
                  >
                    <option value="true">
                      Ativo
                    </option>

                    <option value="false">
                      Inativo
                    </option>
                  </select>
                </div>
              </div>
            </section>
          </>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-400 py-3 font-black text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save size={17} />

          {loading
            ? "Salvando..."
            : "Salvar alterações"}
        </button>
      </form>
    </div>
  );
}