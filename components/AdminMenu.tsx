"use client";

import {
  BarChart3,
  Building2,
  CalendarClock,
  ClipboardList,
  LayoutDashboard,
  Plus,
  Users,
} from "lucide-react";
import MenuItem from "@/components/MenuItem";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

export default function AdminMenu() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const role = (session?.user as any)?.role;
  const isAdmin = role === "ADMIN";

  return (
    <nav className="space-y-1 px-4">
      <MenuItem icon={<LayoutDashboard size={19} />} label="Dashboard" href="/admin" active={pathname === "/admin"} />

      <MenuItem icon={<ClipboardList size={19} />} label="Ordens de serviço" href="/admin/os" active={pathname === "/admin/os"} />

      {isAdmin && (
        <>
          <MenuItem icon={<ClipboardList size={19} />} label="Editar OS" href="/admin/os/editar" active={pathname === "/admin/os/editar"} />
          <MenuItem icon={<CalendarClock size={19} />} label="OS Preventiva" href="/admin/os/preventivas" active={pathname === "/admin/os/preventivas"} />
          <MenuItem icon={<BarChart3 size={19} />} label="Indicadores OS" href="/admin/os/indicadores" active={pathname === "/admin/os/indicadores"} />
          <MenuItem icon={<Users size={19} />} label="Dashboard Colaboradores" href="/admin/dashboard-colaboradores" active={pathname === "/admin/dashboard-colaboradores"} />
          <MenuItem icon={<Users size={19} />} label="Colaboradores" href="/admin/colaboradores" active={pathname === "/admin/colaboradores"} />
          <MenuItem icon={<Plus size={19} />} label="Adicionar colaborador" href="/admin/colaboradores/novo" active={pathname === "/admin/colaboradores/novo"} />
          <MenuItem icon={<Building2 size={19} />} label="Setores" href="/admin/setores" active={pathname === "/admin/setores"} />
          <MenuItem icon={<BarChart3 size={19} />} label="Relatórios" href="/admin/relatorios" active={pathname === "/admin/relatorios"} />
        </>
      )}
    </nav>
  );
}