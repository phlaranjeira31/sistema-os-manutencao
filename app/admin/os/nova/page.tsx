"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ClipboardList,
  Building2,
  Factory,
  AlertTriangle,
  ArrowLeft,
  Save,
  ListChecks,
  ImagePlus,
  X,
  UserRound,
  Cpu,
  CalendarClock,
} from "lucide-react";

type Empresa = {
  id: string;
  nome: string;
  sigla: string;
  ativo: boolean;
};

type Setor = {
  id: string;
  nome: string;
  empresaId?: string | null;
};

type Maquina = {
  id: string;
  nome: string;
  setorId: string;
};

type UsuarioLogado = {
  name?: string | null;
  email?: string | null;
};

type PreviewArquivo = {
  file: File;
  url: string;
  tipo: "imagem" | "video";
};

type SuspeitaDuplicidade = {
  id: string;
  numero: number;
  titulo: string;
  descricao: string;
  status: string;
  prioridade: string;
  createdAt: string;
  score: number;
  nivel: "ALTA" | "POSSIVEL" | "ATENCAO";
  similaridadeTexto: number;
  motivos: string[];
  setor: { id: string; nome: string };
  maquina: { id: string; nome: string } | null;
  responsaveis: { id: string; nome: string }[];
};

export default function NovaOSPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [loadingEmpresas, setLoadingEmpresas] = useState(true);
  const [loadingSetores, setLoadingSetores] = useState(false);
  const [loadingMaquinas, setLoadingMaquinas] = useState(false);
  const [loadingSessao, setLoadingSessao] = useState(true);
  const [verificandoDuplicidade, setVerificandoDuplicidade] =
    useState(false);
  const [suspeitasDuplicidade, setSuspeitasDuplicidade] = useState<
    SuspeitaDuplicidade[]
  >([]);
  const [mostrarAlertaDuplicidade, setMostrarAlertaDuplicidade] =
    useState(false);
  const [erro, setErro] = useState("");

  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [setores, setSetores] = useState<Setor[]>([]);
  const [maquinas, setMaquinas] = useState<Maquina[]>([]);
  const [usuarioLogado, setUsuarioLogado] =
    useState<UsuarioLogado | null>(null);
  const [arquivos, setArquivos] = useState<PreviewArquivo[]>([]);

  const [form, setForm] = useState({
    empresaId: "",
    setorId: "",
    maquinaId: "",
    descricao: "",
    dataParada: "",
    status: "NAO_INICIADA",
    prioridade: "MEDIA",
  });

  useEffect(() => {
    async function carregarDados() {
      try {
        const [empresasRes, sessaoRes] = await Promise.all([
          fetch("/api/admin/empresas?ativas=true", {
            cache: "no-store",
          }),

          fetch("/api/auth/session", {
            cache: "no-store",
          }),
        ]);

        const empresasData = await empresasRes.json();
        const sessaoData = await sessaoRes.json();

        if (!empresasRes.ok) {
          throw new Error(
            empresasData?.error || "Erro ao carregar empresas."
          );
        }

        const listaEmpresas: Empresa[] = Array.isArray(empresasData)
          ? empresasData
          : [];

        setEmpresas(listaEmpresas);

        const sequoia = listaEmpresas.find(
          (empresa) => empresa.sigla === "SEQ"
        );

        setForm((prev) => ({
          ...prev,
          empresaId: sequoia?.id || listaEmpresas[0]?.id || "",
        }));

        if (sessaoRes.ok && sessaoData?.user) {
          setUsuarioLogado({
            name: sessaoData.user.name,
            email: sessaoData.user.email,
          });
        } else {
          setUsuarioLogado(null);
          setErro(
            "Não foi possível identificar o usuário logado. Entre novamente no sistema."
          );
        }
      } catch (error) {
        console.error("Erro ao buscar dados:", error);

        setErro(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar os dados do formulário."
        );
      } finally {
        setLoadingEmpresas(false);
        setLoadingSessao(false);
      }
    }

    carregarDados();
  }, []);

  useEffect(() => {
    async function carregarSetores() {
      if (!form.empresaId) {
        setSetores([]);
        setMaquinas([]);
        return;
      }

      try {
        setLoadingSetores(true);
        setErro("");

        const res = await fetch(
          `/api/admin/setores?empresaId=${encodeURIComponent(
            form.empresaId
          )}`,
          {
            cache: "no-store",
          }
        );

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.error || "Erro ao buscar setores.");
        }

        setSetores(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Erro ao buscar setores:", error);

        setSetores([]);
        setMaquinas([]);

        setErro(
          error instanceof Error
            ? error.message
            : "Erro ao carregar setores."
        );
      } finally {
        setLoadingSetores(false);
      }
    }

    carregarSetores();
  }, [form.empresaId]);

  useEffect(() => {
    async function carregarMaquinas() {
      if (!form.setorId) {
        setMaquinas([]);
        return;
      }

      try {
        setLoadingMaquinas(true);
        setErro("");

        const res = await fetch(
          `/api/admin/maquinas?setorId=${encodeURIComponent(
            form.setorId
          )}`,
          {
            cache: "no-store",
          }
        );

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.error || "Erro ao buscar máquinas.");
        }

        setMaquinas(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Erro ao buscar máquinas:", error);

        setMaquinas([]);

        setErro(
          error instanceof Error
            ? error.message
            : "Erro ao carregar máquinas."
        );
      } finally {
        setLoadingMaquinas(false);
      }
    }

    carregarMaquinas();
  }, [form.setorId]);

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "empresaId"
        ? {
            setorId: "",
            maquinaId: "",
          }
        : {}),
      ...(name === "setorId" ? { maquinaId: "" } : {}),
    }));
  }

  function handleArquivosChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const files = Array.from(e.target.files ?? []);

    const novosArquivos: PreviewArquivo[] = files.map((file) => ({
      file,
      url: URL.createObjectURL(file),
      tipo: file.type.startsWith("video/") ? "video" : "imagem",
    }));

    setArquivos((prev) => [...prev, ...novosArquivos]);

    e.target.value = "";
  }

  function removerArquivo(index: number) {
    setArquivos((prev) => {
      const copia = [...prev];

      URL.revokeObjectURL(copia[index].url);
      copia.splice(index, 1);

      return copia;
    });
  }

  function validarFormulario() {
    if (!usuarioLogado) {
      setErro(
        "Não foi possível identificar o usuário logado. Entre novamente no sistema."
      );
      return false;
    }

    if (!form.empresaId) {
      setErro("Selecione a empresa.");
      return false;
    }

    if (!form.setorId) {
      setErro("Selecione o setor.");
      return false;
    }

    if (!form.maquinaId) {
      setErro("Selecione a máquina ou equipamento.");
      return false;
    }

    if (!form.descricao.trim()) {
      setErro("Informe a descrição do problema.");
      return false;
    }

    return true;
  }

  async function criarOS() {
    try {
      setLoading(true);
      setErro("");

      const data = new FormData();

      data.append("empresaId", form.empresaId);
      data.append("setorId", form.setorId);
      data.append("maquinaId", form.maquinaId);
      data.append("descricao", form.descricao);
      data.append("status", form.status);
      data.append("prioridade", form.prioridade);

      if (form.dataParada) {
        data.append("dataParada", form.dataParada);
      }

      arquivos.forEach((arquivo) => {
        data.append("arquivos", arquivo.file);
      });

      const res = await fetch("/api/admin/os", {
        method: "POST",
        body: data,
      });

      const response = await res.json();

      if (!res.ok) {
        throw new Error(response?.error || "Erro ao criar OS.");
      }

      setMostrarAlertaDuplicidade(false);
      router.push("/admin/os");
      router.refresh();
    } catch (error) {
      setErro(
        error instanceof Error ? error.message : "Erro ao criar OS."
      );
    } finally {
      setLoading(false);
    }
  }

  async function verificarDuplicidade() {
    const res = await fetch(
      "/api/admin/os/verificar-duplicidade",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          empresaId: form.empresaId,
          setorId: form.setorId,
          maquinaId: form.maquinaId,
          descricao: form.descricao,
        }),
      }
    );

    const response = await res.json();

    if (!res.ok) {
      throw new Error(
        response?.error ||
          "Não foi possível verificar possíveis duplicidades."
      );
    }

    return Array.isArray(response?.suspeitas)
      ? (response.suspeitas as SuspeitaDuplicidade[])
      : [];
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");

    if (!validarFormulario()) {
      return;
    }

    try {
      setVerificandoDuplicidade(true);

      const suspeitas = await verificarDuplicidade();

      if (suspeitas.length > 0) {
        setSuspeitasDuplicidade(suspeitas);
        setMostrarAlertaDuplicidade(true);
        return;
      }

      await criarOS();
    } catch (error) {
      console.warn(
        "Falha ao verificar duplicidade. A criação da OS seguirá normalmente:",
        error
      );

      await criarOS();
    } finally {
      setVerificandoDuplicidade(false);
    }
  }


  return (
    <main className="min-h-screen overflow-x-hidden bg-[#050816] px-3 py-6 text-white sm:px-4 md:px-8 lg:px-10">
      <div className="mx-auto w-full max-w-3xl space-y-6 sm:space-y-8">
        <header className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10 text-cyan-300 shadow-lg shadow-cyan-950/30">
              <ClipboardList size={22} />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-bold text-cyan-300">
                Cadastro
              </p>

              <h1 className="break-words text-2xl font-black text-white sm:text-3xl">
                Nova Ordem de Serviço
              </h1>

              <p className="text-sm text-slate-400">
                Selecione a empresa, o setor e o equipamento
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => router.back()}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white px-5 py-3 text-sm font-bold text-slate-950 shadow-lg transition hover:bg-cyan-50 sm:w-auto"
          >
            <ArrowLeft size={16} />
            Voltar
          </button>
        </header>

        <form
          onSubmit={handleSubmit}
          className="w-full min-w-0 space-y-6 rounded-3xl border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-black/30 backdrop-blur sm:p-6"
        >
          {erro && (
            <div className="break-words rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300">
              {erro}
            </div>
          )}

          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-400">
              <Building2 size={17} />
              Empresa
            </label>

            <select
              name="empresaId"
              value={form.empresaId}
              onChange={handleChange}
              disabled={loadingEmpresas || empresas.length === 0}
              className="w-full rounded-xl border border-white/10 bg-[#050816] px-4 py-3 text-sm font-semibold text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">
                {loadingEmpresas
                  ? "Carregando empresas..."
                  : empresas.length === 0
                    ? "Nenhuma empresa ativa disponível"
                    : "Selecione a empresa"}
              </option>

              {empresas.map((empresa) => (
                <option key={empresa.id} value={empresa.id}>
                  {empresa.nome} — {empresa.sigla}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-400">
              <Factory size={17} />
              Setor
            </label>

            <select
              name="setorId"
              value={form.setorId}
              onChange={handleChange}
              disabled={!form.empresaId || loadingSetores}
              className="w-full rounded-xl border border-white/10 bg-[#050816] px-4 py-3 text-sm font-semibold text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">
                {!form.empresaId
                  ? "Selecione primeiro a empresa"
                  : loadingSetores
                    ? "Carregando setores..."
                    : setores.length === 0
                      ? "Nenhum setor ativo cadastrado"
                      : "Selecione o setor"}
              </option>

              {setores.map((setor) => (
                <option key={setor.id} value={setor.id}>
                  {setor.nome}
                </option>
              ))}
            </select>

            {form.empresaId &&
              !loadingSetores &&
              setores.length === 0 && (
                <p className="mt-2 text-xs font-semibold text-orange-300">
                  Cadastre um setor nesta empresa antes de criar a OS.
                </p>
              )}
          </div>

          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-400">
              <Cpu size={17} />
              Máquina ou equipamento
            </label>

            <select
              name="maquinaId"
              value={form.maquinaId}
              onChange={handleChange}
              disabled={!form.setorId || loadingMaquinas}
              className="w-full rounded-xl border border-white/10 bg-[#050816] px-4 py-3 text-sm font-semibold text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">
                {!form.setorId
                  ? "Selecione primeiro o setor"
                  : loadingMaquinas
                    ? "Carregando equipamentos..."
                    : maquinas.length === 0
                      ? "Nenhum equipamento cadastrado"
                      : "Selecione a máquina ou equipamento"}
              </option>

              {maquinas.map((maquina) => (
                <option key={maquina.id} value={maquina.id}>
                  {maquina.nome}
                </option>
              ))}
            </select>

            {form.setorId &&
              !loadingMaquinas &&
              maquinas.length === 0 && (
                <p className="mt-2 text-xs font-semibold text-orange-300">
                  Cadastre uma máquina neste setor antes de criar a OS.
                </p>
              )}
          </div>

          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-400">
              <ClipboardList size={17} />
              Descrição do problema
            </label>

            <textarea
              name="descricao"
              value={form.descricao}
              onChange={handleChange}
              rows={5}
              placeholder="Descreva detalhadamente o problema encontrado..."
              className="w-full resize-y rounded-xl border border-white/10 bg-[#050816] px-4 py-3 text-sm font-semibold text-white placeholder:text-slate-500 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
            />
          </div>

          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-400">
              <CalendarClock size={17} />
              Data e horário em que a máquina parou
            </label>

            <input
              name="dataParada"
              value={form.dataParada}
              onChange={handleChange}
              type="datetime-local"
              className="w-full rounded-xl border border-white/10 bg-[#050816] px-4 py-3 text-sm font-semibold text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
            />

            <p className="mt-2 text-xs font-medium text-slate-500">
              Campo opcional. Deixe vazio se a máquina não estiver
              parada ou se o horário não for conhecido.
            </p>
          </div>

          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-400">
              <ImagePlus size={17} />
              Fotos ou vídeos
            </label>

            <input
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleArquivosChange}
              className="block w-full min-w-0 rounded-xl border border-white/10 bg-[#050816] px-4 py-3 text-sm font-semibold text-slate-300 file:mr-4 file:rounded-lg file:border-0 file:bg-cyan-400 file:px-4 file:py-2 file:font-bold file:text-slate-950"
            />

            {arquivos.length > 0 && (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {arquivos.map((arquivo, index) => (
                  <div
                    key={`${arquivo.url}-${index}`}
                    className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#050816]"
                  >
                    <button
                      type="button"
                      onClick={() => removerArquivo(index)}
                      className="absolute right-2 top-2 z-10 rounded-full bg-red-500 p-1 text-white"
                    >
                      <X size={16} />
                    </button>

                    {arquivo.tipo === "imagem" ? (
                      <img
                        src={arquivo.url}
                        alt="Preview do arquivo"
                        className="h-40 w-full object-cover"
                      />
                    ) : (
                      <video
                        src={arquivo.url}
                        controls
                        className="h-40 w-full bg-black object-cover"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-400">
              <UserRound size={17} />
              Criada por
            </label>

            <div
              className={`rounded-xl border px-4 py-4 ${
                usuarioLogado
                  ? "border-cyan-400/20 bg-cyan-500/10"
                  : "border-red-500/30 bg-red-500/10"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    usuarioLogado
                      ? "bg-cyan-400/15 text-cyan-300"
                      : "bg-red-500/15 text-red-300"
                  }`}
                >
                  <UserRound size={19} />
                </div>

                <div className="min-w-0">
                  <p className="break-words text-sm font-black text-white">
                    {loadingSessao
                      ? "Identificando usuário..."
                      : usuarioLogado?.name ||
                        "Usuário não identificado"}
                  </p>

                  {usuarioLogado?.email && (
                    <p className="break-words text-xs font-semibold text-slate-400">
                      {usuarioLogado.email}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <p className="mt-2 text-xs font-medium text-slate-500">
              O criador da OS é definido automaticamente pelo usuário
              conectado ao sistema.
            </p>
          </div>

          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-400">
              <AlertTriangle size={17} />
              Prioridade
            </label>

            <select
              name="prioridade"
              value={form.prioridade}
              onChange={handleChange}
              className="w-full rounded-xl border border-white/10 bg-[#050816] px-4 py-3 text-sm font-semibold text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
            >
              <option value="BAIXA">Baixa</option>
              <option value="MEDIA">Média</option>
              <option value="ALTA">Alta</option>
              <option value="URGENTE">Urgente</option>
            </select>
          </div>

          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-400">
              <ListChecks size={17} />
              Status
            </label>

            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="w-full rounded-xl border border-white/10 bg-[#050816] px-4 py-3 text-sm font-semibold text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
            >
              <option value="NAO_INICIADA">Não iniciada</option>
              <option value="EM_ANDAMENTO">Em andamento</option>
              <option value="CONCLUIDA">Concluída</option>
              <option value="CANCELADA">Cancelada</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={
              loading ||
              verificandoDuplicidade ||
              loadingEmpresas ||
              loadingSetores ||
              loadingSessao ||
              loadingMaquinas ||
              !usuarioLogado ||
              !form.empresaId ||
              !form.setorId ||
              !form.maquinaId
            }
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-400 py-3 font-black text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60 sm:hover:scale-[1.02]"
          >
            <Save size={16} />
            {loading
              ? "Criando..."
              : verificandoDuplicidade
                ? "Verificando possíveis duplicidades..."
                : "Criar OS"}
          </button>
        </form>

        {mostrarAlertaDuplicidade && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
            <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-amber-400/30 bg-[#070b1a] shadow-2xl shadow-black/60">
              <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-white/10 bg-[#070b1a] p-5 sm:p-6">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-amber-400/30 bg-amber-400/10 text-amber-300">
                    <AlertTriangle size={22} />
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-300">
                      Verificação de duplicidade
                    </p>
                    <h2 className="mt-1 text-xl font-black text-white sm:text-2xl">
                      Esta OS pode já existir
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      Encontramos ordens recentes com sinais semelhantes.
                      Confira antes de criar uma nova. O sistema não bloqueia
                      a criação caso seja realmente outra ocorrência.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setMostrarAlertaDuplicidade(false)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400 transition hover:bg-white/10 hover:text-white"
                  aria-label="Fechar aviso"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3 p-5 sm:p-6">
                {suspeitasDuplicidade.map((suspeita) => {
                  const nivelClasse =
                    suspeita.nivel === "ALTA"
                      ? "border-red-400/30 bg-red-500/10 text-red-300"
                      : suspeita.nivel === "POSSIVEL"
                        ? "border-amber-400/30 bg-amber-500/10 text-amber-300"
                        : "border-cyan-400/30 bg-cyan-500/10 text-cyan-300";

                  const nivelTexto =
                    suspeita.nivel === "ALTA"
                      ? "Alta possibilidade"
                      : suspeita.nivel === "POSSIVEL"
                        ? "Possível duplicata"
                        : "Requer atenção";

                  return (
                    <div
                      key={suspeita.id}
                      className="rounded-2xl border border-white/10 bg-[#050816] p-4 sm:p-5"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-black text-cyan-300">
                              OS #{suspeita.numero}
                            </span>
                            <span
                              className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${nivelClasse}`}
                            >
                              {nivelTexto}
                            </span>
                          </div>

                          <h3 className="mt-2 break-words text-lg font-black text-white">
                            {suspeita.maquina?.nome || suspeita.titulo}
                          </h3>
                          <p className="mt-1 text-xs font-semibold text-slate-500">
                            {suspeita.setor.nome} • {suspeita.status}
                          </p>
                        </div>

                        <div className="shrink-0 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-center">
                          <p className="text-2xl font-black text-white">
                            {suspeita.score}%
                          </p>
                          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                            compatibilidade
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                          Descrição existente
                        </p>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-300">
                          {suspeita.descricao}
                        </p>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {suspeita.motivos.map((motivo) => (
                          <span
                            key={motivo}
                            className="rounded-full border border-cyan-400/15 bg-cyan-400/[0.06] px-2.5 py-1 text-[11px] font-bold text-cyan-200"
                          >
                            {motivo}
                          </span>
                        ))}
                      </div>

                      <a
                        href={`/admin/os/${suspeita.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-4 inline-flex h-10 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 text-xs font-black text-cyan-200 transition hover:bg-cyan-400 hover:text-slate-950"
                      >
                        Abrir OS existente
                      </a>
                    </div>
                  );
                })}
              </div>

              <div className="sticky bottom-0 grid gap-3 border-t border-white/10 bg-[#070b1a] p-5 sm:grid-cols-2 sm:p-6">
                <button
                  type="button"
                  onClick={() => setMostrarAlertaDuplicidade(false)}
                  disabled={loading}
                  className="h-12 rounded-2xl border border-white/10 bg-white/5 px-5 text-sm font-black text-white transition hover:bg-white/10 disabled:opacity-50"
                >
                  Revisar informações
                </button>

                <button
                  type="button"
                  onClick={() => void criarOS()}
                  disabled={loading}
                  className="h-12 rounded-2xl bg-amber-300 px-5 text-sm font-black text-slate-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "Criando..." : "Criar mesmo assim"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}