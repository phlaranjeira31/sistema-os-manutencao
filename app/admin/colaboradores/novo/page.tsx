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
    <main className="min-h-screen bg-[#050816] text-white px-4 py-8 md:px-10">
      <div className="mx-auto max-w-3xl space-y-8">
        <header className="flex items-center justify-between border-b border-white/10 pb-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10 text-cyan-300 shadow-lg shadow-cyan-950/30">
              <UserPlus size={22} />
            </div>

            <div>
              <p className="text-sm font-bold text-cyan-300">
                Cadastro
              </p>
              <h1 className="text-2xl md:text-3xl font-black">
                Adicionar colaborador
              </h1>
              <p className="text-sm text-slate-400">
                Cadastre quem receberá ordens de serviço
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white px-5 py-2 text-sm font-bold text-slate-950 shadow-lg transition hover:scale-[1.03] hover:bg-cyan-50"
          >
            <ArrowLeft size={16} />
            Voltar
          </button>
        </header>

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
            <label className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-400">
              <ImagePlus size={17} />
              Foto do colaborador
            </label>

            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-[#050816]">
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
                className="w-full rounded-xl border border-white/10 bg-[#050816] px-4 py-3 text-sm text-slate-300 file:mr-4 file:rounded-lg file:border-0 file:bg-cyan-400 file:px-4 file:py-2 file:text-sm file:font-bold file:text-slate-950 hover:file:bg-cyan-300"
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
              placeholder="Ex: João da Silva"
              className="w-full rounded-xl border border-white/10 bg-[#050816] px-4 py-3 text-sm font-semibold text-white placeholder:text-slate-500 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
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
              placeholder="colaborador@email.com"
              className="w-full rounded-xl border border-white/10 bg-[#050816] px-4 py-3 text-sm font-semibold text-white placeholder:text-slate-500 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
            />
          </div>

          <div>
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
              className="w-full rounded-xl border border-white/10 bg-[#050816] px-4 py-3 text-sm font-semibold text-white placeholder:text-slate-500 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
            />
          </div>

          
          <div>
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
              className="w-full rounded-xl border border-white/10 bg-[#050816] px-4 py-3 text-sm font-semibold text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
            >
              <option value="COLABORADOR">Colaborador</option>
              <option value="ADMIN">Administrador</option>
            </select>
          </div>

          {/* BOTÃO */}
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-400 py-3 font-black text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:scale-[1.03] hover:bg-cyan-300 disabled:opacity-60"
          >
            <Save size={17} />
            {loading ? "Salvando..." : "Cadastrar colaborador"}
          </button>
        </form>
      </div>
    </main>
  );
}