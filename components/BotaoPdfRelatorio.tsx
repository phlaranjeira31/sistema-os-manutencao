"use client";

import { Download } from "lucide-react";
import { jsPDF } from "jspdf";

type DadosOS = {
  numero: number;
  titulo: string;
  setor: string;
  maquina: string;
  status: string;
  prioridade: string;
  criadaEm: string;
  atualizadaEm: string;
  descricao: string;
  responsavel: string;
};

function extrairCampo(texto: string, rotulo: string) {
  const escape = rotulo.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = texto.match(
    new RegExp(`${escape}:\\s*\\n?\\s*([^\\n\\r]+)`, "i")
  );
  return match?.[1]?.trim() || "-";
}

function extrairSecao(
  texto: string,
  inicio: string,
  proximos: string[]
) {
  const escape = (valor: string) =>
    valor.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const fim =
    proximos.length > 0
      ? `(?=\\n\\s*(?:${proximos.map(escape).join("|")}):|$)`
      : "$";

  const match = texto.match(
    new RegExp(
      `${escape(inicio)}:\\s*\\n?\\s*([\\s\\S]*?)${fim}`,
      "i"
    )
  );

  return match?.[1]?.trim() || "-";
}

function extrairChecklist(texto: string) {
  const secao = extrairSecao(
    texto,
    "Checklist final da manutenção",
    []
  );

  if (!secao || secao === "-") return [];

  return secao
    .split(/\n\s*\n/)
    .map((bloco) => bloco.trim())
    .filter(Boolean)
    .map((bloco) => {
      const linhas = bloco
        .split(/\r?\n/)
        .map((linha) => linha.trim())
        .filter(Boolean);

      const respostaLinha = linhas.find((linha) =>
        /^Resposta:/i.test(linha)
      );

      return {
        pergunta: linhas
          .filter((linha) => !/^Resposta:/i.test(linha))
          .join(" "),
        resposta:
          respostaLinha?.replace(/^Resposta:\s*/i, "").trim() || "-",
      };
    });
}

function formatarDataIso(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return value;

  const [, ano, mes, dia] = match;
  return `${dia}/${mes}/${ano}`;
}

function calcularDuracao(
  dataInicio: string,
  horaInicio: string,
  dataTermino: string,
  horaTermino: string
) {
  if (
    dataInicio === "-" ||
    horaInicio === "-" ||
    dataTermino === "-" ||
    horaTermino === "-"
  ) {
    return "-";
  }

  const inicio = new Date(`${dataInicio}T${horaInicio}:00-03:00`);
  const fim = new Date(`${dataTermino}T${horaTermino}:00-03:00`);
  const minutos = Math.round((fim.getTime() - inicio.getTime()) / 60000);

  if (!Number.isFinite(minutos) || minutos < 0) return "-";

  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;

  if (horas <= 0) return `${resto}min`;
  if (resto === 0) return `${horas}h`;
  return `${horas}h ${resto}min`;
}

export default function BotaoPdfRelatorio({
  registroAtual,
  dadosOS,
}: {
  registroAtual: string | null | undefined;
  dadosOS: DadosOS;
}) {
  function gerarPDF() {
    // Uma única folha A4 horizontal: mais espaço e melhor leitura.
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    const relatorio = (registroAtual ?? "")
      .replace(/^Relatório:\s*/i, "")
      .trim();

    const dataInicio = extrairCampo(relatorio, "Data de início");
    const horaInicio = extrairCampo(relatorio, "Hora de início");
    const dataTermino = extrairCampo(relatorio, "Data de término");
    const horaTermino = extrairCampo(relatorio, "Hora de término");

    const defeito = extrairSecao(relatorio, "Defeito", [
      "Causa do defeito",
    ]);
    const causa = extrairSecao(relatorio, "Causa do defeito", [
      "Solução do defeito",
    ]);
    const solucao = extrairSecao(relatorio, "Solução do defeito", [
      "Peças utilizadas",
    ]);
    const pecas = extrairSecao(relatorio, "Peças utilizadas", [
      "Observações finais",
      "Checklist final da manutenção",
    ]);
    const observacoes = extrairSecao(relatorio, "Observações finais", [
      "Checklist final da manutenção",
    ]);
    const checklist = extrairChecklist(relatorio);

    const duracao = calcularDuracao(
      dataInicio,
      horaInicio,
      dataTermino,
      horaTermino
    );

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 9;
    const gap = 4;
    const contentWidth = pageWidth - margin * 2;

    const navy: [number, number, number] = [7, 18, 34];
    const cyan: [number, number, number] = [6, 182, 212];
    const green: [number, number, number] = [5, 150, 105];
    const slate: [number, number, number] = [71, 85, 105];
    const text: [number, number, number] = [28, 39, 54];
    const light: [number, number, number] = [246, 248, 251];
    const border: [number, number, number] = [220, 226, 234];

    const setFill = (c: [number, number, number]) =>
      doc.setFillColor(c[0], c[1], c[2]);
    const setDraw = (c: [number, number, number]) =>
      doc.setDrawColor(c[0], c[1], c[2]);
    const setText = (c: [number, number, number]) =>
      doc.setTextColor(c[0], c[1], c[2]);

    const fittedText = ({
      value,
      x,
      y,
      width,
      height,
      fontSize = 8.2,
      minFontSize = 6,
      bold = false,
      color = text,
    }: {
      value: string;
      x: number;
      y: number;
      width: number;
      height: number;
      fontSize?: number;
      minFontSize?: number;
      bold?: boolean;
      color?: [number, number, number];
    }) => {
      let size = fontSize;
      let lines: string[] = [];

      while (size >= minFontSize) {
        doc.setFont("helvetica", bold ? "bold" : "normal");
        doc.setFontSize(size);
        lines = doc.splitTextToSize(value || "-", width);
        const lineHeight = size * 0.4;
        if (lines.length * lineHeight <= height) break;
        size -= 0.35;
      }

      doc.setFont("helvetica", bold ? "bold" : "normal");
      doc.setFontSize(size);
      setText(color);

      const lineHeight = size * 0.4;
      const maxLines = Math.max(1, Math.floor(height / lineHeight));

      if (lines.length > maxLines) {
        lines = lines.slice(0, maxLines);
        lines[lines.length - 1] = `${String(lines[lines.length - 1]).replace(/\.*$/, "")}...`;
      }

      doc.text(lines, x, y);
    };

    const sectionTitle = (
      x: number,
      y: number,
      numero: string,
      titulo: string
    ) => {
      setFill(navy);
      doc.roundedRect(x, y, 8, 8, 2, 2, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(255, 255, 255);
      doc.text(numero, x + 4, y + 5.2, { align: "center" });

      doc.setFontSize(11.2);
      setText(navy);
      doc.text(titulo, x + 11, y + 5.7);
    };

    const infoBox = ({
      x,
      y,
      width,
      height,
      label,
      value,
      accent = false,
    }: {
      x: number;
      y: number;
      width: number;
      height: number;
      label: string;
      value: string;
      accent?: boolean;
    }) => {
      const fillColor: [number, number, number] = accent
        ? [236, 253, 245]
        : light;
      const borderColor: [number, number, number] = accent
        ? [167, 243, 208]
        : border;

      setFill(fillColor);
      setDraw(borderColor);
      doc.roundedRect(x, y, width, height, 2.5, 2.5, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.6);
      setText(accent ? green : slate);
      doc.text(label.toUpperCase(), x + 3.5, y + 5.1);

      fittedText({
        value,
        x: x + 3.5,
        y: y + 11.2,
        width: width - 7,
        height: height - 13.5,
        fontSize: 8.8,
        minFontSize: 6.5,
        bold: true,
      });
    };

    const technicalCard = ({
      x,
      y,
      width,
      height,
      numero,
      label,
      value,
      accent,
    }: {
      x: number;
      y: number;
      width: number;
      height: number;
      numero: string;
      label: string;
      value: string;
      accent: [number, number, number];
    }) => {
      setFill(light);
      setDraw(border);
      doc.roundedRect(x, y, width, height, 2.5, 2.5, "FD");

      setFill(accent);
      doc.circle(x + 5.4, y + 6, 3, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.6);
      doc.setTextColor(255, 255, 255);
      doc.text(numero, x + 5.4, y + 7, { align: "center" });

      doc.setFontSize(8);
      setText(navy);
      doc.text(label, x + 11, y + 7);

      fittedText({
        value,
        x: x + 4,
        y: y + 13,
        width: width - 8,
        height: height - 16,
        fontSize: 8.2,
        minFontSize: 6,
      });
    };

    const headerY = 8;
    const headerH = 27;

    setFill(navy);
    doc.roundedRect(margin, headerY, contentWidth, headerH, 4, 4, "F");

    const img = new Image();
    img.src = "/logo.sequoia.png";

    img.onload = () => {
      doc.addImage(img, "PNG", margin + 5, headerY + 3, 20, 20);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(15.5);
      doc.setTextColor(255, 255, 255);
      doc.text(
        `Relatório Técnico • OS #${dadosOS.numero}`,
        margin + 30,
        headerY + 10
      );

      doc.setFontSize(10.2);
      doc.text(dadosOS.titulo, margin + 30, headerY + 17);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(190, 208, 224);
      doc.text(
        `${dadosOS.setor} • ${dadosOS.maquina}`,
        margin + 30,
        headerY + 22.5
      );

      const bodyY = 40;
      const bodyBottom = pageHeight - 13;
      const bodyH = bodyBottom - bodyY;

      const col1 = 87;
      const col2 = 91;
      const col3 = contentWidth - col1 - col2 - gap * 2;

      const x1 = margin;
      const x2 = x1 + col1 + gap;
      const x3 = x2 + col2 + gap;

      // COLUNA 1 — RESUMO + DESCRIÇÃO ORIGINAL
      sectionTitle(x1, bodyY, "1", "Resumo e chamado original");

      const summaryY = bodyY + 11;
      const halfGap = 2.5;
      const halfW = (col1 - halfGap) / 2;

      infoBox({
        x: x1,
        y: summaryY,
        width: halfW,
        height: 19,
        label: "Data do serviço",
        value: formatarDataIso(dataTermino),
      });

      infoBox({
        x: x1 + halfW + halfGap,
        y: summaryY,
        width: halfW,
        height: 19,
        label: "Duração",
        value: duracao,
        accent: true,
      });

      infoBox({
        x: x1,
        y: summaryY + 22,
        width: halfW,
        height: 19,
        label: "Horário",
        value: `${horaInicio} → ${horaTermino}`,
      });

      infoBox({
        x: x1 + halfW + halfGap,
        y: summaryY + 22,
        width: halfW,
        height: 19,
        label: "Status",
        value: dadosOS.status,
      });

      infoBox({
        x: x1,
        y: summaryY + 44,
        width: col1,
        height: 19,
        label: "Responsável",
        value: dadosOS.responsavel,
      });

      infoBox({
        x: x1,
        y: summaryY + 66,
        width: col1,
        height: 18,
        label: "Prioridade",
        value: dadosOS.prioridade,
      });

      const descY = summaryY + 88;
      const descH = bodyBottom - descY;

      setFill([255, 249, 235]);
      setDraw([253, 230, 138]);
      doc.roundedRect(x1, descY, col1, descH, 3, 3, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.3);
      doc.setTextColor(180, 83, 9);
      doc.text("DESCRIÇÃO ORIGINAL DA OS", x1 + 4, descY + 6);

      fittedText({
        value: dadosOS.descricao || "-",
        x: x1 + 4,
        y: descY + 13,
        width: col1 - 8,
        height: descH - 17,
        fontSize: 9,
        minFontSize: 6.3,
        bold: true,
      });

      // COLUNA 2 — PROBLEMA / CAUSA / SOLUÇÃO
      sectionTitle(x2, bodyY, "2", "Problema, causa e solução");

      const techY = bodyY + 11;
      const techGap = 3;
      const techH = (bodyH - 11 - techGap * 2) / 3;

      technicalCard({
        x: x2,
        y: techY,
        width: col2,
        height: techH,
        numero: "1",
        label: "Problema encontrado",
        value: defeito,
        accent: [239, 68, 68],
      });

      technicalCard({
        x: x2,
        y: techY + techH + techGap,
        width: col2,
        height: techH,
        numero: "2",
        label: "Causa identificada",
        value: causa,
        accent: [249, 115, 22],
      });

      technicalCard({
        x: x2,
        y: techY + (techH + techGap) * 2,
        width: col2,
        height: techH,
        numero: "3",
        label: "Solução realizada",
        value: solucao,
        accent: [16, 185, 129],
      });

      // COLUNA 3 — PEÇAS / OBSERVAÇÕES / CHECKLIST
      sectionTitle(x3, bodyY, "3", "Fechamento da manutenção");

      const rightY = bodyY + 11;

      infoBox({
        x: x3,
        y: rightY,
        width: col3,
        height: 29,
        label: "Peças utilizadas",
        value: pecas,
      });

      infoBox({
        x: x3,
        y: rightY + 32,
        width: col3,
        height: 29,
        label: "Observações finais",
        value: observacoes,
      });

      const checklistY = rightY + 64;
      const checklistH = bodyBottom - checklistY;

      setFill(light);
      setDraw(border);
      doc.roundedRect(x3, checklistY, col3, checklistH, 3, 3, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.2);
      setText(slate);
      doc.text("CHECKLIST FINAL", x3 + 4, checklistY + 6);

      const itens = checklist.slice(0, 6);

      if (itens.length === 0) {
        fittedText({
          value: "Checklist não identificado.",
          x: x3 + 4,
          y: checklistY + 14,
          width: col3 - 8,
          height: checklistH - 18,
          fontSize: 8,
        });
      } else {
        const itemGap = 1.3;
        const itemH =
          (checklistH - 10 - itemGap * (itens.length - 1)) /
          itens.length;

        itens.forEach((item, index) => {
          const itemY =
            checklistY + 9 + index * (itemH + itemGap);

          const resposta = item.resposta.toLowerCase();
          const positiva = resposta === "sim";
          const negativa = resposta === "não" || resposta === "nao";

          const statusColor: [number, number, number] = positiva
            ? [16, 185, 129]
            : negativa
              ? [239, 68, 68]
              : slate;

          if (index > 0) {
            doc.setDrawColor(229, 234, 240);
            doc.line(
              x3 + 4,
              itemY - 0.6,
              x3 + col3 - 4,
              itemY - 0.6
            );
          }

          doc.setFont("helvetica", "bold");
          doc.setFontSize(6.8);
          setText(statusColor);
          doc.text(`${index + 1}.`, x3 + 4, itemY + 4.2);

          fittedText({
            value: item.pergunta,
            x: x3 + 10,
            y: itemY + 4.2,
            width: col3 - 34,
            height: itemH - 1.5,
            fontSize: 7.1,
            minFontSize: 5.7,
          });

          const pillFill: [number, number, number] = positiva
            ? [220, 252, 231]
            : negativa
              ? [254, 226, 226]
              : [241, 245, 249];

          setFill(pillFill);
          setDraw(statusColor);
          doc.roundedRect(
            x3 + col3 - 20,
            itemY + 0.5,
            16,
            6.3,
            1.8,
            1.8,
            "FD"
          );

          doc.setFont("helvetica", "bold");
          doc.setFontSize(6.1);
          setText(statusColor);
          doc.text(
            item.resposta.toUpperCase(),
            x3 + col3 - 12,
            itemY + 4.7,
            { align: "center" }
          );
        });
      }

      // Rodapé compacto — continua na mesma folha.
      setDraw(border);
      doc.line(
        margin,
        pageHeight - 10,
        pageWidth - margin,
        pageHeight - 10
      );

      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.7);
      setText(slate);
      doc.text(
        `Sistema de OS • Sequoia • OS #${dadosOS.numero}`,
        margin,
        pageHeight - 6
      );
      doc.text(
        "Relatório técnico de manutenção",
        pageWidth - margin,
        pageHeight - 6,
        { align: "right" }
      );

      doc.save(`relatorio-os-${dadosOS.numero}.pdf`);
    };
  }

  return (
    <button
      type="button"
      onClick={gerarPDF}
      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 text-sm font-black text-slate-950 shadow-[0_8px_25px_rgba(34,211,238,.18)] transition hover:bg-cyan-300"
    >
      <Download size={17} />
      Baixar PDF
    </button>
  );
}
