import React, { useState } from "react";
import { useUser } from "../hooks/useUser";

export default function Pricing() {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);

  async function handleCheckout() {
    setLoading(true);

    try {
      const res = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId: "price_1ScBAG2Mj9flkmq6cZkILFO", // <- hier deine echte Price ID
          successUrl: window.location.origin + "/pricing?success=1",
          cancelUrl: window.location.origin + "/pricing?canceled=1",
        }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Checkout error:", err);
    }

    setLoading(false);
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">

      <h1 className="text-4xl font-bold mb-10 text-center">
        Wähle deinen Plan
      </h1>

      {/* FREE PLAN */}
      <div className="bg-gray-800 p-6 rounded-xl shadow-xl mb-8">
        <h2 className="text-2xl font-bold mb-2">Free</h2>
        <p className="text-gray-400 mb-4">Ideal für Einsteiger.</p>

        <ul className="mb-4 space-y-1 text-gray-300">
          <li>✔ 5 Audits pro Monat</li>
          <li>✔ Basis KI-Analyse</li>
          <li>✘ Keine Auto-Fixes</li>
          <li>✘ Kein Deep Scan</li>
        </ul>

        <p className="text-xl font-bold">0 € / Monat</p>
      </div>

      {/* PRO PLAN */}
      <div className="bg-gradient-to-br from-purple-600 to-blue-600 p-6 rounded-xl shadow-xl text-white">
        <h2 className="text-2xl font-bold mb-2">Pro</h2>
        <p className="opacity-90 mb-4">Für Power-User & Profis.</p>

        <ul className="mb-4 space-y-1">
          <li>✔ 100 Audits pro Monat</li>
          <li>✔ KI-Auto-Fixes</li>
          <li>✔ Deep SEO-Analyse</li>
          <li>✔ Priorisierte Crawls</li>
        </ul>

        <p className="text-xl font-bold mb-4">29,99 € / Monat</p>

        <button
          onClick={handleCheckout}
          disabled={loading}
          className="bg-black/40 backdrop-blur px-6 py-3 rounded-lg hover:bg-black/60 transition font-semibold"
        >
          {loading ? "Weiterleitung..." : "Upgrade starten"}
        </button>
      </div>

    </div>
  );
}