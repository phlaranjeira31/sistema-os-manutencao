"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ClipboardList,
  Building2,
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

type Setor = {
  id: string;
  nome: string;
};

type Maquina = {
  id: string;
  nome: string;
  setorId: string;
};

type Usuario = {
  id: string;
  nome: string;
};

type PreviewArquivo = {
  file: File;
  url: string;
  tipo: "imagem" | "video";
};

export default function NovaOSPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [loadingMaquinas, setLoadingMaquinas] = useState(false);
  const [erro, setErro] = useState("");

  const [setores, setSetores] = useState<Setor[]>([]);
  const [maquinas, setMaquinas] = useState<Maquina[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [arquivos, setArquivos] = useState<PreviewArquivo[]>([]);

  const [form, setForm] = useState({
    setorId: "",
    maquinaId: "",
    descricao: "",
    dataParada: "",
    status: "NAO_INICIADA",
    prioridade: "MEDIA",
    criadoPorId: "",
  });

  useEffect(() => {
    async function carregarDados() {
      try {
        const [setoresRes, usuariosRes] = await Promise.all([
          fetch("/api/admin/setores", {
            cache: "no-store",
          }),
          fetch("/api/admin/usuarios-os", {
            cache: "no-store",
          }),
        ]);

        const setoresData = await setoresRes.json();
        const usuariosData = await usuariosRes.json();

        if (setoresRes.ok) {
          setSetores(Array.isArray(setoresData) ? setoresData : []);
        }

        if (usuariosRes.ok) {
          setUsuarios(Array.isArray(usuariosData) ? usuariosData : []);
        }
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
        setErro("Não foi possível carregar os dados do formulário.");
      }
    }

    carregarDados();
  }, []);

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
          `/api/admin/maquinas?setorId=${encodeURIComponent(form.setorId)}`,
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
      ...(name === "setorId" ? { maquinaId: "" } : {}),
    }));
  }

  function handleArquivosChange(e: React.ChangeEvent<HTMLInputElement>) {
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");

    if (!form.setorId) {
      setErro("Selecione o setor.");
      return;
    }

    if (!form.maquinaId) {
      setErro("Selecione a máquina ou equipamento.");
      return;
    }

    if (!form.descricao.trim()) {
      setErro("Informe a descrição do problema.");
      return;
    }

    if (!form.criadoPorId) {
      setErro("Selecione quem criou a OS.");
      return;
    }

    try {
      setLoading(true);

      const data = new FormData();

      data.append("setorId", form.setorId);
      data.append("maquinaId", form.maquinaId);
      data.append("descricao", form.descricao);
      data.append("status", form.status);
      data.append("prioridade", form.prioridade);
      data.append("criadoPorId", form.criadoPorId);

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

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#050816] px-3 py-6 text-white sm:px-4 md:px-8 lg:px-10">
      <div className="mx-auto w-full max-w-3xl space-y-6 sm:space-y-8">
        <header className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10 text-cyan-300 shadow-lg shadow-cyan-950/30">
              <ClipboardList size={22} />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-bold text-cyan-300">Cadastro</p>

              <h1 className="break-words text-2xl font-black text-white sm:text-3xl">
                Nova Ordem de Serviço
              </h1>

              <p className="text-sm text-slate-400">
                Selecione o setor e o equipamento
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
              Setor
            </label>

            <select
              name="setorId"
              value={form.setorId}
              onChange={handleChange}
              className="w-full rounded-xl border border-white/10 bg-[#050816] px-4 py-3 text-sm font-semibold text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
            >
              <option value="">Selecione o setor</option>

              {setores.map((setor) => (
                <option key={setor.id} value={setor.id}>
                  {setor.nome}
                </option>
              ))}
            </select>
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
              Campo opcional. Deixe vazio se a máquina não estiver parada ou
              se o horário não for conhecido.
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

            <select
              name="criadoPorId"
              value={form.criadoPorId}
              onChange={handleChange}
              className="w-full rounded-xl border border-white/10 bg-[#050816] px-4 py-3 text-sm font-semibold text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
            >
              <option value="">Selecione o colaborador</option>

              {usuarios.map((usuario) => (
                <option key={usuario.id} value={usuario.id}>
                  {usuario.nome}
                </option>
              ))}
            </select>
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
              loadingMaquinas ||
              !form.setorId ||
              !form.maquinaId
            }
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-400 py-3 font-black text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60 sm:hover:scale-[1.02]"
          >
            <Save size={16} />
            {loading ? "Criando..." : "Criar OS"}
          </button>
        </form>
      </div>
    </main>
  );
}