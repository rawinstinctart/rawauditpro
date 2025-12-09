import React from "react";
import { useUser } from "../useUser";

export function withPro(Component: React.ComponentType<any>) {
  return function Wrapped(props: any) {
    const { user, loading } = useUser();

    if (loading) {
      return (
        <div className="w-full flex items-center justify-center py-10 text-gray-400">
          Loading user…
        </div>
      );
    }

    if (!user) {
      return (
        <div className="w-full flex items-center justify-center py-10 text-red-500">
          Not logged in.
        </div>
      );
    }

    if (user.subscriptionTier !== "pro") {
      return (
        <div className="w-full text-center py-10">
          <h2 className="text-xl font-semibold mb-2">🚫 PRO Feature</h2>
          <p className="text-gray-300 mb-4">
            Dein aktuelles Abo erlaubt diese Funktion nicht.
          </p>
          <a
            href="/billing"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white"
          >
            Upgrade auf PRO
          </a>
        </div>
      );
    }

    return <Component {...props} user={user} />;
  };
}