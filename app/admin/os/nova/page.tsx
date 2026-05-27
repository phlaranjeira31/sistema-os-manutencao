"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ClipboardList,
  FileText,
  Building2,
  AlertTriangle,
  ArrowLeft,
  Save,
  ListChecks,
  ImagePlus,
  X,
  UserRound,
} from "lucide-react";

type Setor = {
  id: string;
  nome: string;
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
  const [erro, setErro] = useState("");
  const [setores, setSetores] = useState<Setor[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [arquivos, setArquivos] = useState<PreviewArquivo[]>([]);

  const [form, setForm] = useState({
    titulo: "",
    descricao: "",
    setor: "",
    status: "NAO_INICIADA",
    prioridade: "MEDIA",
    criadoPorId: "",
  });

  useEffect(() => {
    async function carregarDados() {
      try {
        const [setoresRes, usuariosRes] = await Promise.all([
          fetch("/api/admin/setores"),
          fetch("/api/admin/usuarios-os")
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
      }
    }

    carregarDados();
  }, []);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleArquivosChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);

    const novosArquivos: PreviewArquivo[] = files.map((file) => ({
      file,
      url: URL.createObjectURL(file),
      tipo: file.type.startsWith("video/") ? "video" : "imagem",
    }));

    setArquivos((prev) => [...prev, ...novosArquivos]);
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

    if (!form.titulo.trim()) return setErro("Informe o título.");
    if (!form.descricao.trim()) return setErro("Informe a descrição.");
    if (!form.setor) return setErro("Selecione o setor.");
    if (!form.criadoPorId) return setErro("Selecione quem criou a OS.");

    try {
      setLoading(true);

      const data = new FormData();
      data.append("titulo", form.titulo);
      data.append("descricao", form.descricao);
      data.append("setor", form.setor);
      data.append("status", form.status);
      data.append("prioridade", form.prioridade);
      data.append("criadoPorId", form.criadoPorId);

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

      router.push("/admin");
      router.refresh();
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Erro ao criar OS.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#050816] px-4 py-8 text-white md:px-10">
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="flex items-center justify-between border-b border-white/10 pb-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10 text-cyan-300 shadow-lg shadow-cyan-950/30">
              <ClipboardList size={22} />
            </div>

            <div>
              <p className="text-sm font-bold text-cyan-300">Cadastro</p>

              <h1 className="text-2xl font-black text-white md:text-3xl">
                Nova Ordem de Serviço
              </h1>

              <p className="text-sm text-slate-400">
                Crie uma nova solicitação
              </p>
            </div>
          </div>

          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white px-5 py-2 text-sm font-bold text-slate-950 shadow-lg transition hover:scale-[1.03] hover:bg-cyan-50"
          >
            <ArrowLeft size={16} />
            Voltar
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/30 backdrop-blur"
        >
          {erro && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300">
              {erro}
            </div>
          )}

          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-400">
              <FileText size={17} />
              Título
            </label>

            <input
              name="titulo"
              value={form.titulo}
              onChange={handleChange}
              placeholder="Ex: Troca de iluminação"
              className="w-full rounded-xl border border-white/10 bg-[#050816] px-4 py-3 text-sm font-semibold text-white placeholder:text-slate-500 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
            />
          </div>

          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-400">
              <ClipboardList size={17} />
              Descrição
            </label>

            <textarea
              name="descricao"
              value={form.descricao}
              onChange={handleChange}
              rows={4}
              placeholder="Descreva detalhadamente o problema..."
              className="w-full rounded-xl border border-white/10 bg-[#050816] px-4 py-3 text-sm font-semibold text-white placeholder:text-slate-500 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
            />
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
              className="block w-full rounded-xl border border-white/10 bg-[#050816] px-4 py-3 text-sm font-semibold text-slate-300 file:mr-4 file:rounded-lg file:border-0 file:bg-cyan-400 file:px-4 file:py-2 file:font-bold file:text-slate-950"
            />

            {arquivos.length > 0 && (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {arquivos.map((arquivo, index) => (
                  <div
                    key={arquivo.url}
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
                        alt="Preview"
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
              <Building2 size={17} />
              Setor
            </label>

            <select
              name="setor"
              value={form.setor}
              onChange={handleChange}
              className="w-full rounded-xl border border-white/10 bg-[#050816] px-4 py-3 text-sm font-semibold text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
            >
              <option value="">Selecione o setor</option>

              {setores.map((setor) => (
                <option key={setor.id} value={setor.nome}>
                  {setor.nome}
                </option>
              ))}
            </select>
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
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-400 py-3 font-black text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:scale-[1.03] hover:bg-cyan-300 disabled:opacity-60"
          >
            <Save size={16} />
            {loading ? "Criando..." : "Criar OS"}
          </button>
        </form>
      </div>
    </div>
  );
}