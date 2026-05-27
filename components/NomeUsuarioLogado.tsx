"use client";

import { useEffect, useState } from "react";

export default function NomeUsuarioLogado() {
  const [nome, setNome] = useState("Administrador");

  useEffect(() => {
    const user = localStorage.getItem("user");

    if (user) {
      const parsed = JSON.parse(user);
      setNome(parsed.nome || "Administrador");
    }
  }, []);

  return <>Bem-vindo, {nome}</>;
}