"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  Save,
  User,
  UserPlus,
  Lock,
  ImagePlus,
} from "lucide-react";

export default function NovoColaboradorPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [foto, setFoto] = useState<File | null>(null);

  const [form, setForm] = useState({
    nome: "",
    email: "",
    senha: "",
    perfil: "COLABORADOR",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
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
      data.append("perfil", form.perfil);

      if (foto) {
        data.append("foto", foto);
      }

      const res = await fetch("/api/admin/colaboradores", {
        method: "POST",
        body: data,
      });

      const response = await res.json();

      if (!res.ok) {
        throw new Error(response?.error || "Erro ao cadastrar colaborador.");
      }

      router.push("/admin/colaboradores");
      router.refresh();
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Erro ao cadastrar colaborador."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#050816] px-3 py-6 text-white sm:px-4 md:px-8 lg:px-10">
      <div className="mx-auto w-full max-w-3xl space-y-6 sm:space-y-8">
        <header className="flex w-full min-w-0 flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10 text-cyan-300 shadow-lg shadow-cyan-950/30">
              <UserPlus size={22} />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-bold text-cyan-300">Cadastro</p>

              <h1 className="break-words text-2xl font-black leading-tight sm:text-3xl">
                Adicionar colaborador
              </h1>

              <p className="break-words text-sm text-slate-400">
                Cadastre quem receberá ordens de serviço
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

          <div className="min-w-0">
            <label className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-400">
              <ImagePlus size={17} />
              Foto do colaborador
            </label>

            <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center">
              <div className="mx-auto flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-[#050816] sm:mx-0">
                {fotoPreview ? (
                  <img
                    src={fotoPreview}
                    alt="Preview"
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
                className="w-full min-w-0 rounded-xl border border-white/10 bg-[#050816] px-4 py-3 text-sm text-slate-300 file:mr-4 file:rounded-lg file:border-0 file:bg-cyan-400 file:px-4 file:py-2 file:text-sm file:font-bold file:text-slate-950 hover:file:bg-cyan-300"
              />
            </div>
          </div>

          <div className="min-w-0">
            <label className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-400">
              <User size={17} />
              Nome
            </label>

            <input
              name="nome"
              value={form.nome}
              onChange={handleChange}
              placeholder="Ex: João da Silva"
              className="w-full min-w-0 rounded-xl border border-white/10 bg-[#050816] px-4 py-3 text-sm font-semibold text-white placeholder:text-slate-500 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
            />
          </div>

          <div className="min-w-0">
            <label className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-400">
              <Mail size={17} />
              Email
            </label>

            <input
              name="email"
              value={form.email}
              onChange={handleChange}
              type="email"
              placeholder="colaborador@email.com"
              className="w-full min-w-0 rounded-xl border border-white/10 bg-[#050816] px-4 py-3 text-sm font-semibold text-white placeholder:text-slate-500 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
            />
          </div>

          <div className="min-w-0">
            <label className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-400">
              <Lock size={17} />
              Senha
            </label>

            <input
              name="senha"
              value={form.senha}
              onChange={handleChange}
              type="password"
              placeholder="Mínimo 6 caracteres"
              className="w-full min-w-0 rounded-xl border border-white/10 bg-[#050816] px-4 py-3 text-sm font-semibold text-white placeholder:text-slate-500 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
            />
          </div>

          <div className="min-w-0">
            <label className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-400">
              <User size={17} />
              Perfil
            </label>

            <select
              name="perfil"
              value={form.perfil}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, perfil: e.target.value }))
              }
              className="w-full min-w-0 rounded-xl border border-white/10 bg-[#050816] px-4 py-3 text-sm font-semibold text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
            >
              <option value="COLABORADOR">Colaborador</option>
              <option value="ADMIN">Administrador</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-400 py-3 font-black text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-300 disabled:opacity-60 sm:hover:scale-[1.03]"
          >
            <Save size={17} />
            {loading ? "Salvando..." : "Cadastrar colaborador"}
          </button>
        </form>
      </div>
    </main>
  );
}