"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ImagePlus,
  Lock,
  Mail,
  Save,
  User,
  UserCog,
} from "lucide-react";

type Colaborador = {
  id: string;
  nome: string;
  email: string;
  fotoUrl: string | null;
  ativo: boolean;
  perfil: string;
};

export default function EditarColaboradorForm({
  colaborador,
}: {
  colaborador: Colaborador;
}) {
  const router = useRouter();

  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [foto, setFoto] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(
    colaborador.fotoUrl
  );

  const [form, setForm] = useState({
    nome: colaborador.nome,
    email: colaborador.email,
    senha: "",
    ativo: String(colaborador.ativo),
    perfil: colaborador.perfil,
  });

  useEffect(() => {
    const user = localStorage.getItem("user");

    if (user) {
      const usuario = JSON.parse(user);
      setIsAdmin(usuario?.perfil === "ADMIN");
    }
  }, []);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleFotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setFoto(file);
    setFotoPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e: React.FormEvent) {
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

      if (foto) data.append("foto", foto);

      const res = await fetch(`/api/admin/colaboradores/${colaborador.id}`, {
        method: "PATCH",
        body: data,
      });

      const response = await res.json();

      if (!res.ok) {
        throw new Error(response?.error || "Erro ao editar colaborador.");
      }

      const userLocal = localStorage.getItem("user");

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
              fotoUrl: response?.fotoUrl ?? userAtual.fotoUrl,
            })
          );
        }
      }

      router.push("/admin");
      router.refresh();
    } catch (error) {
      setErro(
        error instanceof Error ? error.message : "Erro ao editar colaborador."
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
              <p className="text-sm font-bold text-cyan-300">Edição</p>
              <h1 className="break-words text-2xl font-black leading-tight sm:text-3xl">
                Editar colaborador
              </h1>
              <p className="break-words text-sm text-slate-400">
                Atualize dados do colaborador
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
                <User className="text-slate-500" size={28} />
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

        <div>
          <label className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-400">
            <User size={17} />
            Nome
          </label>

          <input
            name="nome"
            value={form.nome}
            onChange={handleChange}
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
            className="w-full min-w-0 rounded-xl border border-white/10 bg-[#050816] px-4 py-3 text-sm font-semibold text-white outline-none focus:border-cyan-400"
          />
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

        {isAdmin && (
          <>
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
                <option value="COLABORADOR">Colaborador</option>
                <option value="ADMIN">Administrador</option>
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
                <option value="true">Ativo</option>
                <option value="false">Inativo</option>
              </select>
            </div>
          </>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-400 py-3 font-black text-slate-950 shadow-lg shadow-cyan-500/20 disabled:opacity-60"
        >
          <Save size={17} />
          {loading ? "Salvando..." : "Salvar alterações"}
        </button>
      </form>
    </div>
  );
}