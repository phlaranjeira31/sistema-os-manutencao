"use client";

import {
  Activity,
  BarChart3,
  Building2,
  CalendarClock,
  CalendarDays,
  ClipboardList,
  FileDown,
  LayoutDashboard,
  Pencil,
  Plus,
  Users,
  Wrench,
} from "lucide-react";
import MenuItem from "@/components/MenuItem";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type Usuario = {
  perfil?: string;
};

export default function AdminMenu() {
  const pathname = usePathname();
  const [usuario, setUsuario] = useState<Usuario>({});

  useEffect(() => {
    async function carregarUsuario() {
      try {
        const res = await fetch("/api/auth/session");
        const data = await res.json();

        const role = data?.user?.role;

        if (role) {
          setUsuario({ perfil: role });
          return;
        }

        const user = localStorage.getItem("user");

        if (user) {
          setUsuario(JSON.parse(user));
        }
      } catch {
        const user = localStorage.getItem("user");

        if (user) {
          setUsuario(JSON.parse(user));
        }
      }
    }

    carregarUsuario();
  }, []);

  const isAdmin = usuario.perfil === "ADMIN";

  return (
    <nav className="space-y-1 px-4 lg:space-y-0 lg:px-3 lg:[&_a>div]:!gap-2.5 lg:[&_a>div]:!px-3 lg:[&_a>div]:!py-2 lg:[&_a>div]:!text-[13px] lg:[&_svg]:!h-[17px] lg:[&_svg]:!w-[17px]">
      <MenuItem
        icon={<LayoutDashboard size={19} />}
        label="Dashboard"
        href="/admin"
        active={pathname === "/admin"}
      />

      <MenuItem
        icon={<ClipboardList size={19} />}
        label="Ordens de serviço"
        href="/admin/os"
        active={pathname === "/admin/os"}
      />

      {isAdmin && (
        <>
          <MenuItem
            icon={<Pencil size={19} />}
            label="Editar OS"
            href="/admin/os/editar"
            active={pathname === "/admin/os/editar"}
          />

          <MenuItem
            icon={<CalendarClock size={19} />}
            label="OS Preventiva"
            href="/admin/os/preventivas"
            active={pathname === "/admin/os/preventivas"}
          />

          <MenuItem
            icon={<CalendarDays size={19} />}
            label="Agenda da Manutenção"
            href="/admin/os/agenda"
            active={pathname === "/admin/os/agenda"}
          />

          <MenuItem
            icon={<BarChart3 size={19} />}
            label="Indicadores OS"
            href="/admin/os/indicadores"
            active={pathname === "/admin/os/indicadores"}
          />

          <MenuItem
            icon={<Activity size={19} />}
            label="Dashboard Colaboradores"
            href="/admin/dashboard-colaboradores"
            active={
              pathname ===
              "/admin/dashboard-colaboradores"
            }
          />

          <MenuItem
            icon={<Users size={19} />}
            label="Colaboradores"
            href="/admin/colaboradores"
            active={pathname === "/admin/colaboradores"}
          />

          <MenuItem
            icon={<Plus size={19} />}
            label="Adicionar colaborador"
            href="/admin/colaboradores/novo"
            active={
              pathname === "/admin/colaboradores/novo"
            }
          />

          <MenuItem
            icon={<Building2 size={19} />}
            label="Empresas"
            href="/admin/empresas"
            active={pathname.startsWith("/admin/empresas")}
          />

          <MenuItem
            icon={<Wrench size={19} />}
            label="Setores"
            href="/admin/setores"
            active={pathname === "/admin/setores"}
          />

          <MenuItem
            icon={<FileDown size={19} />}
            label="Relatórios"
            href="/admin/relatorios"
            active={pathname === "/admin/relatorios"}
          />
        </>
      )}
    </nav>
  );
}
