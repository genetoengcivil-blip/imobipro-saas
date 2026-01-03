"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CheckoutSucessoPage() {
  const router = useRouter();

  useEffect(() => {
    // tempo para webhook processar (UX + segurança)
    const timer = setTimeout(() => {
      router.push("/login");
    }, 4000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
        <div className="text-emerald-600 text-5xl mb-4">✔</div>

        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          Pagamento aprovado!
        </h1>

        <p className="text-slate-600 mb-6">
          Estamos preparando seu acesso ao sistema.
          <br />
          Você será redirecionado automaticamente.
        </p>

        <div className="flex justify-center mb-6">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>

        <p className="text-xs text-slate-400">
          Isso pode levar alguns segundos.
        </p>
      </div>
    </main>
  );
}
