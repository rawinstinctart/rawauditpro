import React, { useEffect, useState } from "react";
import { useUser } from "../hooks/useUser";
import { withPro } from "../components/withPro";

export default function Dashboard() {
  const { user } = useUser();

  const [audits, setAudits] = useState([]);
  const [websites, setWebsites] = useState([]);
  const [loading, setLoading] = useState(true);

  const FREE_LIMIT = 5;
  const PRO_LIMIT = 100;

  const isPro = user?.subscriptionTier === "pro";

  useEffect(() => {
    async function loadData() {
      try {
        const auditsRes = await fetch("/api/audits/recent", {
          credentials: "include",
        });
        const websitesRes = await fetch("/api/websites", {
          credentials: "include",
        });

        const auditsData = await auditsRes.json();
        const websitesData = await websitesRes.json();

        setAudits(auditsData);
        setWebsites(websitesData);
      } catch (err) {
        console.error("Daten konnten nicht geladen werden:", err);
      }

      setLoading(false);
    }

    loadData();
  }, []);

  const used = audits?.length || 0;
  const limit = isPro ? PRO_LIMIT : FREE_LIMIT;
  const remaining = limit - used;

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-300">
        Lade Dashboard…
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">

      <h1 className="text-3xl font-bold mb-4">Dashboard</h1>

      {/* --- Audit Limit Anzeige --- */}
      <div className="bg-gray-800 p-4 rounded-xl mb-6">
        <p className="text-lg font-semibold">
          Deine monatlichen Scans: {used} / {limit}
        </p>

        {remaining <= 0 && !isPro && (
          <p className="mt-2 text-red-400 font-semibold">
            Du hast dein Limit erreicht. Upgrade auf PRO, um weiter zu scannen.
          </p>
        )}

        {remaining > 0 && (
          <p className="mt-2 text-green-400">
            Verfügbar: {remaining} weitere Scans
          </p>
        )}
      </div>

      {/* --- Websites Liste --- */}
      <div className="bg-gray-800 p-4 rounded-xl">
        <h2 className="text-xl font-semibold mb-3">Deine Webseiten</h2>

        {websites.length === 0 ? (
          <p className="text-gray-400">Noch keine Websites hinzugefügt.</p>
        ) : (
          <ul className="space-y-2">
            {websites.map((w) => (
              <li
                key={w.id}
                className="bg-gray-700 p-3 rounded-lg flex justify-between items-center"
              >
                <span>{w.url}</span>
                <a
                  href={`/audits?website=${w.id}`}
                  className="text-blue-400 hover:underline"
                >
                  Scans ansehen
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}