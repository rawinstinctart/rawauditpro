import React from "react";
import { useUser } from "../useUser";

export function withUser(Component: React.ComponentType<any>) {
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

    return <Component {...props} user={user} />;
  };
}