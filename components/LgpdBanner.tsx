'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function LgpdBanner() {
  const [accepted, setAccepted] = useState(true);

  useEffect(() => {
    const consent = localStorage.getItem('lgpd_consent');
    if (!consent) {
      setAccepted(false);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('lgpd_consent', 'true');
    setAccepted(true);
  };

  if (accepted) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl bg-zinc-900 text-white p-4 rounded-xl shadow-2xl border border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4 z-50">
      <p className="text-xs sm:text-sm text-zinc-300 m-0">
        Nós utilizamos cookies e coletamos dados para garantir o funcionamento da plataforma de gestão financeira. 
        Ao continuar, você concorda com a nossa{' '}
        <Link href="/privacidade" className="text-blue-400 underline hover:text-blue-300">
          Política de Privacidade
        </Link>.
      </p>
      <button
        onClick={handleAccept}
        className="bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
      >
        Aceitar e fechar
      </button>
    </div>
  );
}
