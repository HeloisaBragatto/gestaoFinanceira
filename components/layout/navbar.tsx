"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  FileUp,
  LogOut,
  Menu,
  X,
  BarChart3,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Login from "../../public/img/login/person.webp";

const navItems = [
  { href: "/protected/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/protected/extratos", label: "Extratos", icon: FileText },
  { href: "/protected/importar", label: "Importar PDF", icon: FileUp },
  { href: "/protected/graficos", label: "Gráficos", icon: BarChart3 },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [firstName, setFirstName] = useState("Usuário");
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const nome = user?.user_metadata?.full_name;
      const first = nome?.trim().split(" ")[0] ?? "Usuário";
      setFirstName(first);
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  const isActive = (href: string) => pathname === href;

  const avatar = (
    <Image
      src={Login}
      alt=""
      width={48}
      height={48}
      className="rounded-full shrink-0"
    />
  );

  return (
    <>
      {/* Desktop */}
      <nav
        className="
        hidden lg:flex group
        w-16 hover:w-[15%]
        h-full min-h-screen
        flex-col justify-between
        px-3 py-4
        bg-white/50 backdrop-blur-sm
        rounded-r-md
        transition-all duration-300
        overflow-hidden shrink-0
        sticky top-0
      "
      >
        {/* Topo: avatar + nome + links */}
        <div className="flex flex-col gap-6">
          {/* Avatar + nome */}
          <div className="flex items-center gap-3">
            {avatar}
            <span className="text-sm text-black font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              Olá, {firstName}!
            </span>
          </div>

          {/* Links */}
          <ul className="flex flex-col gap-1">
            {navItems.map(({ href, label, icon: Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  className={`flex items-center gap-3 px-2 py-2.5 rounded-md transition-colors ${
                    isActive(href)
                      ? "bg-[#a2cef0] text-white"
                      : "hover:bg-white/20 text-gray-700"
                  }`}
                >
                  <Icon size={20} className="shrink-0" />
                  <span className="text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    {label}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Botão sair */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-2 py-2.5 rounded-md hover:bg-white/30 text-gray-700 hover:text-black transition-colors w-full"
        >
          <LogOut size={20} className="shrink-0" />
          <span className="text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            Sair
          </span>
        </button>
      </nav>

      {/* Mobile */}
      <div className="lg:hidden w-full absolute top-0 left-0 right-0 z-50">
        {/* Topbar */}
        <div className="flex items-center justify-between px-4 py-3 bg-white/50 text-black backdrop-blur-sm">
          <div className="flex items-center gap-2">
            {avatar}
            <span className="text-sm font-medium">Olá, {firstName}!</span>
          </div>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-md hover:bg-[#a2cef0]/40 transition-colors"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Drawer */}
        {mobileOpen && (
          <div
            className="bg-white/50
          backdrop-blur-sm shadow-lg px-4 py-4 flex flex-col gap-2"
          >
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-3 rounded-md transition-colors ${
                  isActive(href)
                    ? "bg-[#a2cef0] text-black"
                    : "hover:bg-[#a2cef0]/40 text-gray-700"
                }`}
              >
                <Icon size={20} />
                <span className="text-sm font-medium">{label}</span>
              </Link>
            ))}

            <hr className="my-1" />

            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-3 rounded-md hover:bg-red-100 text-gray-700 hover:text-red-600 transition-colors"
            >
              <LogOut size={20} />
              <span className="text-sm font-medium">Sair</span>
            </button>
          </div>
        )}
      </div>
    </>
  );
}
