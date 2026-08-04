"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { jsPDF } from "jspdf";

type DadosOS = {
  numero: number;
  titulo: string;
  setor: string;
  status: string;
  prioridade: string;
  criadaEm: string;
  atualizadaEm: string;
  descricao: string;
  responsavel: string;
};

const perguntasChecklist = [
  "Foi verificada a quantidade de peças utilizadas?",
  "Todas as ferramentas utilizadas foram recolhidas?",
  "O material reposto (peças) foi devidamente recolhido?",
  "Foi realizada a limpeza após a manutenção?",
  "A limpeza foi efetiva?",
];

type RespostaChecklist = "Sim" | "Não" | "N.A" | "";

export default function FormRelatorioOS({
  osId,
  registroAtual,
  dadosOS,
}: {
  osId: string;
  registroAtual?: string | null;
  dadosOS: DadosOS;
}) {
  const router = useRouter();

  const [dataInicio, setDataInicio] = useState("");
  const [horaInicio, setHoraInicio] = useState("");
  const [dataTermino, setDataTermino] = useState("");
  const [horaTermino, setHoraTermino] = useState("");
  const [defeito, setDefeito] = useState("");
  const [causa, setCausa] = useState("");
  const [solucao, setSolucao] = useState("");
  const [pecas, setPecas] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const [checklist, setChecklist] = useState<RespostaChecklist[]>(
    perguntasChecklist.map(() => "")
  );

  const [loading, setLoading] = useState(false);

  function atualizarChecklist(index: number, valor: RespostaChecklist) {
    setChecklist((atual) =>
      atual.map((item, i) => (i === index ? valor : item))
    );
  }

  function gerarPDF() {
    const doc = new jsPDF();

    const relatorioLimpo = (registroAtual ?? "").replace(/^Relatório:\s*/i, "");

    const img = new Image();
    img.src = "/logo.sequoia.png";

    img.onload = () => {
      doc.addImage(img, "PNG", 14, 10, 30, 30);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text(`Relatório da OS #${dadosOS.numero}`, 50, 20);

      doc.setDrawColor(180);
      doc.line(14, 40, 195, 40);

      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");

      let y = 50;

      const novaPaginaSePrecisar = () => {
        if (y > 275) {
          doc.addPage();
          y = 20;
        }
      };

      const addLine = (label: string, value: string) => {
        novaPaginaSePrecisar();

        doc.setFont("helvetica", "bold");
        doc.text(`${label}:`, 14, y);

        doc.setFont("helvetica", "normal");
        doc.text(value || "-", 70, y);

        y += 8;
      };

      doc.setFont("helvetica", "bold");
      doc.text("Dados da Ordem de Serviço", 14, y);
      y += 10;

      addLine("Título", dadosOS.titulo);
      addLine("Setor", dadosOS.setor);
      addLine("Status", dadosOS.status);
      addLine("Prioridade", dadosOS.prioridade);
      addLine("Responsável", dadosOS.responsavel);
      addLine("Criada em", dadosOS.criadaEm);
      addLine("Atualizada em", dadosOS.atualizadaEm);

      y += 5;
      novaPaginaSePrecisar();

      doc.setFont("helvetica", "bold");
      doc.text("Descrição", 14, y);
      y += 8;

      doc.setFont("helvetica", "normal");

      const descricao = doc.splitTextToSize(dadosOS.descricao || "-", 180);

      descricao.forEach((linha: string) => {
        novaPaginaSePrecisar();
        doc.text(linha, 14, y);
        y += 7;
      });

      y += 5;
      novaPaginaSePrecisar();

      doc.setFont("helvetica", "bold");
      doc.text("Relatório completo", 14, y);
      y += 8;

      doc.setFont("helvetica", "normal");

      const linhasRelatorio = doc.splitTextToSize(relatorioLimpo || "-", 180);

      linhasRelatorio.forEach((linha: string) => {
        novaPaginaSePrecisar();
        doc.text(linha, 14, y);
        y += 7;
      });

      doc.setFontSize(10);
      doc.setTextColor(150);
      doc.text(`Gerado em ${new Date().toLocaleString("pt-BR")}`, 14, 290);

      doc.save(`relatorio-os-${dadosOS.numero}.pdf`);
    };
  }

  async function salvarRelatorio() {
    const checklistIncompleto = checklist.some((item) => !item);

    if (checklistIncompleto) {
      alert("Preencha todo o checklist final da manutenção.");
      return;
    }

    const checklistTexto = perguntasChecklist
      .map(
        (pergunta, index) =>
          `${pergunta}\nResposta: ${checklist[index] || "-"}`
      )
      .join("\n\n");

    const relatorio = `
Data de início:
${dataInicio || "-"}

Hora de início:
${horaInicio || "-"}

Data de término:
${dataTermino || "-"}

Hora de término:
${horaTermino || "-"}

Defeito:
${defeito || "-"}

Causa do defeito:
${causa || "-"}

Solução do defeito:
${solucao || "-"}

Peças utilizadas:
${pecas || "-"}

Observações finais:
${observacoes || "-"}

Checklist final da manutenção:
${checklistTexto}
`.trim();

    try {
      setLoading(true);

      const res = await fetch(`/api/admin/os/${osId}/relatorio`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
       body: JSON.stringify({
  relatorio,
  observacoes: "",
  dataInicio,
  horaInicio,
  dataTermino,
  horaTermino,
}),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data?.error || "Erro ao salvar relatório.");
        return;
      }

      alert("Relatório salvo com sucesso!");
      router.push("/admin");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (registroAtual) {
    return (
      <div className="mt-8 rounded-2xl border border-white/10 bg-[#050816] p-5">
        <p className="mb-3 text-sm font-bold text-slate-400">
          Relatório atual
        </p>

        <p className="whitespace-pre-line text-sm font-semibold leading-7 text-slate-200">
          {registroAtual.replace(/^Relatório:\s*/i, "")}
        </p>

        <button
          type="button"
          onClick={gerarPDF}
          className="mt-6 rounded-xl bg-cyan-400 px-6 py-3 text-sm font-black text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-300"
        >
          Baixar PDF
        </button>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-5">
      <Campo numero="1" label="Data de início" obrigatorio type="date" value={dataInicio} set={setDataInicio} />
      <Campo numero="2" label="Hora de início" obrigatorio type="time" value={horaInicio} set={setHoraInicio} />
      <Campo numero="3" label="Data de término" obrigatorio type="date" value={dataTermino} set={setDataTermino} />
      <Campo numero="4" label="Hora de término" obrigatorio type="time" value={horaTermino} set={setHoraTermino} />

      <CampoTexto numero="5" label="Defeito" obrigatorio value={defeito} set={setDefeito} />
      <CampoTexto numero="6" label="Causa do defeito" obrigatorio value={causa} set={setCausa} />
      <CampoTexto numero="7" label="Solução do defeito" obrigatorio value={solucao} set={setSolucao} />
      <CampoTexto numero="8" label="Peças utilizadas" value={pecas} set={setPecas} />
      <CampoTexto numero="9" label="Observações" value={observacoes} set={setObservacoes} />

      <div className="rounded-3xl border border-cyan-500/10 bg-[#020617]/80 p-6 shadow-[0_0_25px_rgba(34,211,238,0.05)]">
        <h3 className="text-xl font-black text-white">
          Checklist final da manutenção
        </h3>

        <p className="mt-1 text-sm text-slate-400">
          Confirme os procedimentos realizados antes de finalizar o relatório.
        </p>

        <div className="mt-6 space-y-5">
          {perguntasChecklist.map((pergunta, index) => (
            <div
              key={pergunta}
              className="rounded-2xl border border-white/10 bg-[#080d1f] p-5"
            >
              <p className="text-base font-bold text-white">
                {pergunta} <span className="text-red-400">*</span>
              </p>

              <div className="mt-4 flex flex-wrap gap-3">
                {(["Sim", "Não", "N.A"] as RespostaChecklist[]).map((opcao) => (
                  <label
                    key={opcao}
                    className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-bold text-slate-300 transition hover:border-cyan-400/40 hover:bg-cyan-500/10"
                  >
                    <input
                      type="radio"
                      name={`checklist-${index}`}
                      value={opcao}
                      checked={checklist[index] === opcao}
                      onChange={() => atualizarChecklist(index, opcao)}
                      className="h-4 w-4 accent-cyan-400"
                    />

                    {opcao}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={salvarRelatorio}
        disabled={loading}
        className="mt-4 rounded-xl bg-cyan-400 px-6 py-3 text-sm font-black text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-300 disabled:opacity-60"
      >
        {loading ? "Salvando..." : "Enviar"}
      </button>
    </div>
  );
}

function Campo({
  numero,
  label,
  obrigatorio,
  type,
  value,
  set,
}: {
  numero: string;
  label: string;
  obrigatorio?: boolean;
  type: "date" | "time";
  value: string;
  set: (v: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#080d1f] p-5">
      <label className="mb-4 block text-base font-semibold text-slate-200">
        {numero}. {label} {obrigatorio && <span className="text-red-400">*</span>}
      </label>

      <input
        type={type}
        value={value}
        onChange={(e) => set(e.target.value)}
        className="w-full border-0 border-b border-white/20 bg-transparent px-1 py-3 text-sm font-medium text-white outline-none focus:border-cyan-400"
      />
    </div>
  );
}

function CampoTexto({
  numero,
  label,
  obrigatorio,
  value,
  set,
}: {
  numero: string;
  label: string;
  obrigatorio?: boolean;
  value: string;
  set: (v: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#080d1f] p-5">
      <label className="mb-4 block text-base font-semibold text-slate-200">
        {numero}. {label} {obrigatorio && <span className="text-red-400">*</span>}
      </label>

      <textarea
        rows={2}
        value={value}
        onChange={(e) => set(e.target.value)}
        placeholder="Insira sua resposta"
        className="w-full resize-none border-0 border-b border-white/20 bg-transparent px-1 py-3 text-sm font-medium text-white outline-none placeholder:text-slate-500 focus:border-cyan-400"
      />
    </div>
  );
}