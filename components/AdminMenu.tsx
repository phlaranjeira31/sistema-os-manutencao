"use client";

import Link from "next/link";
import {
  Activity,
  BarChart3,
  Building2,
  CalendarClock,
  ClipboardList,
  FileDown,
  Factory,
  LayoutDashboard,
  Map as MapIcon,
  Pencil,
  Plus,
  Users,
  Wrench,
} from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type Usuario = {
  perfil?: string;
};

type NavItemProps = {
  href: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
};

function NavItem({
  href,
  label,
  icon,
  active,
}: NavItemProps) {
  return (
    <Link
      href={href}
      className={`group relative flex h-9 items-center gap-2.5 rounded-xl border px-2.5 text-[12px] font-semibold transition-all ${
        active
          ? "border-cyan-400/20 bg-[linear-gradient(90deg,rgba(34,211,238,.12),rgba(34,211,238,.035))] text-cyan-100 shadow-[0_0_22px_rgba(34,211,238,.06)]"
          : "border-transparent text-slate-400 hover:border-white/[0.06] hover:bg-white/[0.03] hover:text-slate-100"
      }`}
    >
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border transition ${
          active
            ? "border-cyan-400/15 bg-cyan-400/[0.07] text-cyan-300"
            : "border-white/[0.04] bg-white/[0.02] text-slate-500 group-hover:text-slate-300"
        }`}
      >
        {icon}
      </span>

      <span className="min-w-0 flex-1 truncate">
        {label}
      </span>

      {active && (
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-300 shadow-[0_0_8px_rgba(103,232,249,.9)]" />
      )}
    </Link>
  );
}

function NavGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-1.5 px-3 text-[8px] font-black uppercase tracking-[0.18em] text-slate-700">
        {title}
      </p>

      <div className="space-y-0.5">
        {children}
      </div>
    </div>
  );
}

export default function AdminMenu() {
  const pathname = usePathname();

  const [usuario, setUsuario] =
    useState<Usuario>({});

  useEffect(() => {
    async function carregarUsuario() {
      try {
        const res = await fetch(
          "/api/auth/session"
        );

        const data =
          await res.json();

        const role =
          data?.user?.role;

        if (role) {
          setUsuario({
            perfil: role,
          });

          return;
        }

        const user =
          localStorage.getItem(
            "user"
          );

        if (user) {
          setUsuario(
            JSON.parse(user)
          );
        }
      } catch {
        const user =
          localStorage.getItem(
            "user"
          );

        if (user) {
          setUsuario(
            JSON.parse(user)
          );
        }
      }
    }

    carregarUsuario();
  }, []);

  const isAdmin =
    usuario.perfil === "ADMIN";

  const ordemServicoAtiva =
    pathname.startsWith(
      "/admin/os"
    ) &&
    !pathname.startsWith(
      "/admin/os/editar"
    ) &&
    !pathname.startsWith(
      "/admin/os/preventivas"
    ) &&
    !pathname.startsWith(
      "/admin/os/indicadores"
    );

  const colaboradoresAtivo =
    pathname.startsWith(
      "/admin/colaboradores"
    ) &&
    !pathname.startsWith(
      "/admin/colaboradores/novo"
    );

  return (
    <nav className="space-y-3 px-3 py-2">
      <NavGroup title="Operação">
        <NavItem
          icon={
            <LayoutDashboard
              size={15}
            />
          }
          label="Dashboard"
          href="/admin"
          active={
            pathname === "/admin"
          }
        />

        <NavItem
          icon={
            <ClipboardList
              size={15}
            />
          }
          label="Ordens de serviço"
          href="/admin/os"
          active={
            ordemServicoAtiva
          }
        />

        {isAdmin && (
          <>
            <NavItem
              icon={
                <Pencil
                  size={15}
                />
              }
              label="Editar OS"
              href="/admin/os/editar"
              active={pathname.startsWith(
                "/admin/os/editar"
              )}
            />

            <NavItem
              icon={
                <CalendarClock
                  size={15}
                />
              }
              label="OS Preventiva"
              href="/admin/os/preventivas"
              active={pathname.startsWith(
                "/admin/os/preventivas"
              )}
            />
          </>
        )}
      </NavGroup>

      {isAdmin && (
        <>
          <NavGroup title="Ativos & BI">
            <NavItem
              icon={
                <Factory
                  size={15}
                />
              }
              label="Máquinas"
              href="/admin/maquinas"
              active={pathname.startsWith(
                "/admin/maquinas"
              )}
            />

            <NavItem
              icon={
                <MapIcon
                  size={15}
                />
              }
              label="Mapa da Fábrica"
              href="/admin/mapa-fabrica"
              active={pathname.startsWith(
                "/admin/mapa-fabrica"
              )}
            />

            <NavItem
              icon={
                <BarChart3
                  size={15}
                />
              }
              label="Indicadores OS"
              href="/admin/os/indicadores"
              active={pathname.startsWith(
                "/admin/os/indicadores"
              )}
            />

            <NavItem
              icon={
                <Activity
                  size={15}
                />
              }
              label="Dashboard Colaboradores"
              href="/admin/dashboard-colaboradores"
              active={pathname.startsWith(
                "/admin/dashboard-colaboradores"
              )}
            />
          </NavGroup>

          <NavGroup title="Gestão">
            <NavItem
              icon={
                <Users
                  size={15}
                />
              }
              label="Colaboradores"
              href="/admin/colaboradores"
              active={
                colaboradoresAtivo
              }
            />

            <NavItem
              icon={
                <Plus
                  size={15}
                />
              }
              label="Adicionar colaborador"
              href="/admin/colaboradores/novo"
              active={pathname.startsWith(
                "/admin/colaboradores/novo"
              )}
            />

            <NavItem
              icon={
                <Building2
                  size={15}
                />
              }
              label="Empresas"
              href="/admin/empresas"
              active={pathname.startsWith(
                "/admin/empresas"
              )}
            />

            <NavItem
              icon={
                <Wrench
                  size={15}
                />
              }
              label="Setores"
              href="/admin/setores"
              active={pathname.startsWith(
                "/admin/setores"
              )}
            />

            <NavItem
              icon={
                <FileDown
                  size={15}
                />
              }
              label="Relatórios"
              href="/admin/relatorios"
              active={pathname.startsWith(
                "/admin/relatorios"
              )}
            />
          </NavGroup>
        </>
      )}
    </nav>
  );
}
