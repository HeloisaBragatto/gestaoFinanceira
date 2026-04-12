"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Footer() {
  const [year, setYear] = useState<number | null>(null);
  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);
  return (
    <>
      <footer className="py-2">
        <div className="row">
          <div className="container">
            <div className="inline">
              <p className="gap-x-1 flex flex-row justify-center items-center">
                <Link
                  href="/politica-privacidade"
                  className="text-xs underline hover:text-zinc-200 transition-color duration-300"
                >
                  Política de Privacidade.
                </Link>
                <span className="text-xs hover:text-zinc-200 transition-color duration-300">
                  © {year} Todos os direitos reservados
                </span>
              </p>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
