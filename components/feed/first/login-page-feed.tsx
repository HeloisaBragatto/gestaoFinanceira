"use client";
import { BsGraphUpArrow } from "react-icons/bs";
import { LuLayoutDashboard } from "react-icons/lu";
import { GoClock } from "react-icons/go";
import { useState } from "react";
import { cn } from "@/lib/utils";
import LoginForm from "@/components/forms/login-form";
import { SignUpForm } from "@/components/forms/sign-up-form";

type Mode = "login" | "signup";

export default function LoginPageFeed() {
  const [mode, setMode] = useState<Mode>("login");

  return (
    <div className="flex flex-col-reverse md:flex-row md:min-h-screen ">
      {/* Informações */}
      <div className="md:w-1/2 xl:w-[45%] relative gradient md:rounded-r-[1.5rem]">
        <section className="max-w-3xl flex flex-col justify-center items-center h-full mb-10 mt-10 md:mt-0">
          <div className="row">
            <div className="container">
              <div className="">
                <h1 className="login-title">
                  O controle financeiro que{" "}
                  <span className="text-brand-blue">você precisa.</span>
                </h1>
                <p className="login-texts">
                  Acompanhe receitas e despesas e tome desições com base em
                  dados reais.
                </p>
              </div>
              <div className="space-y-3 mt-4">
                {container.map(({ icon, title, text }, i) => (
                  <div key={i} className="flex flex-row items-center gap-x-2">
                    <div className="h-fit w-fit bg-[#60a5fa33] p-2.5 rounded-lg">
                      {icon}
                    </div>
                    <div>
                      <h2 className="font-medium">{title}</h2>
                      <p className="login-texts">{text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Forms */}
      <div className="md:w-1/2 xl:w-[60%] flex items-start md:items-center justify-center px-6 py-10 md:py-0 mt-10 md:mt-0 relative overflow-hidden ">
        <div className="w-full max-w-sm bg-white/90 backdrop-blur-xl border border-white/20 shadow-md rounded-2xl p-6">
          {/* Tabs */}
          <div className="flex bg-gray-100 border border-gray-200 rounded-xl p-1 mb-8">
            <button
              onClick={() => setMode("login")}
              className={cn(
                "flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200",
                mode === "login"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              Entrar
            </button>
            <button
              onClick={() => setMode("signup")}
              className={cn(
                "flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200",
                mode === "signup"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              Criar conta
            </button>
          </div>
          <div className="relative">
            {/* Login */}
            <div
              className={cn(
                "transition-all duration-300 ease-in-out",
                mode === "login"
                  ? "opacity-100 translate-x-0 pointer-events-auto relative"
                  : "opacity-0 -translate-x-6 pointer-events-none absolute inset-0"
              )}
            >
              <LoginForm onSwitchToSignup={() => setMode("signup")} />
            </div>

            {/* Cadastro */}
            <div
              className={cn(
                "transition-all duration-300 ease-in-out",
                mode === "signup"
                  ? "opacity-100 translate-x-0 pointer-events-auto relative"
                  : "opacity-0 translate-x-6 pointer-events-none absolute inset-0"
              )}
            >
              <SignUpForm onSwitchToLogin={() => setMode("login")} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const container = [
  {
    icon: <BsGraphUpArrow />,
    title: "Visão completa",
    text: "Tenha uma visão 360° das finanças.",
  },

  {
    icon: <LuLayoutDashboard />,
    title: "Controle total",
    text: "Tenha domínio completo sobre suas entradas e saídas financeiras.",
  },
  {
    icon: <GoClock />,
    title: "Economize tempo",
    text: "Automatize processos e foque no que importa.",
  },
];
