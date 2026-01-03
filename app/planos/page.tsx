"use client";

export default function PlanosPage() {
  const handleCheckout = async (plano: "basic" | "pro" | "premium") => {
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plano }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Erro ao criar checkout");
        return;
      }

      window.location.href = data.init_point;
    } catch {
      alert("Erro inesperado no checkout");
    }
  };

  return (
    <main className="bg-slate-100 min-h-screen">
      {/* HEADER */}
      <section className="bg-gradient-to-b from-slate-900 to-slate-800 text-white py-20">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
            Escolha o plano ideal para o seu crescimento
          </h1>
          <p className="text-slate-300 text-lg">
            Uma plataforma profissional para corretores que levam o negócio a sério.
          </p>
        </div>
      </section>

      {/* PLANOS */}
      <section className="-mt-10 pb-24">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* BÁSICO */}
          <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col text-slate-900">
            <h3 className="text-xl font-bold mb-1">Básico</h3>
            <p className="text-slate-500 mb-4">Para quem está começando</p>

            <p className="text-emerald-600 font-medium text-sm mb-4">
              🎁 7 dias de acesso Premium
            </p>

            <div className="mb-6">
              <span className="text-4xl font-extrabold">R$ 97</span>
              <span className="text-slate-500"> /mês</span>
            </div>

            <ul className="space-y-2 text-sm text-slate-700">
              <li>✔ Até 50 imóveis</li>
              <li>✔ CRM básico</li>
              <li>✔ Site responsivo</li>
              <li>✔ 1 usuário</li>
              <li>✔ Suporte por e-mail</li>
            </ul>

            <button
              onClick={() => handleCheckout("basic")}
              className="mt-auto w-full py-3 rounded-lg border-2 border-slate-900 font-semibold
                         hover:bg-slate-900 hover:text-white transition"
            >
              Assinar Básico
            </button>
          </div>

          {/* PROFISSIONAL */}
          <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col
                          border-2 border-emerald-500 relative text-slate-900">
            <span className="absolute -top-4 left-1/2 -translate-x-1/2
                             bg-emerald-500 text-white text-xs font-bold px-4 py-1 rounded-full">
              MAIS POPULAR
            </span>

            <h3 className="text-xl font-bold mb-1">Profissional</h3>
            <p className="text-slate-500 mb-4">Para quem quer escalar resultados</p>

            <p className="text-emerald-600 font-medium text-sm mb-4">
              🎁 7 dias de acesso Premium
            </p>

            <div className="mb-6">
              <span className="text-5xl font-extrabold">R$ 197</span>
              <span className="text-slate-500"> /mês</span>
            </div>

            <ul className="space-y-2 text-sm text-slate-700">
              <li>✔ Até 200 imóveis</li>
              <li>✔ CRM avançado</li>
              <li>✔ SEO profissional</li>
              <li>✔ Até 3 usuários</li>
              <li>✔ Relatórios</li>
              <li>✔ App mobile</li>
            </ul>

            <button
              onClick={() => handleCheckout("pro")}
              className="mt-auto w-full py-3 rounded-lg
                         bg-slate-900 text-white font-semibold
                         hover:bg-slate-800 transition"
            >
              Assinar Profissional
            </button>
          </div>

          {/* PREMIUM */}
          <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col text-slate-900">
            <h3 className="text-xl font-bold mb-1">Premium</h3>
            <p className="text-slate-500 mb-4">
              Para quem quer o máximo desde o primeiro dia
            </p>

            <div className="mb-6">
              <span className="text-4xl font-extrabold">R$ 397</span>
              <span className="text-slate-500"> /mês</span>
            </div>

            <ul className="space-y-2 text-sm text-slate-700">
              <li>✔ Imóveis ilimitados</li>
              <li>✔ CRM completo</li>
              <li>✔ Multi-sites</li>
              <li>✔ Usuários ilimitados</li>
              <li>✔ Suporte 24/7</li>
            </ul>

            <button
              onClick={() => handleCheckout("premium")}
              className="mt-auto w-full py-3 rounded-lg border-2 border-slate-900 font-semibold
                         hover:bg-slate-900 hover:text-white transition"
            >
              Assinar Premium
            </button>
          </div>

        </div>
      </section>
    </main>
  );
}

