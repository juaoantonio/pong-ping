"use client";

import { createContext, useContext, type ReactNode } from "react";
import useSWR, { SWRConfig } from "swr";
import {
  AUTHENTICATED_USER_KEY,
  type AuthenticatedUserResponse,
  type ClientAuthenticatedUser,
} from "@/lib/auth/shared";

type AuthenticatedUserContextValue = {
  initialUser: ClientAuthenticatedUser;
};

const AuthenticatedUserContext =
  createContext<AuthenticatedUserContextValue | null>(null);

async function fetchAuthenticatedUser(
  input: string,
): Promise<AuthenticatedUserResponse> {
  const response = await fetch(input);

  if (!response.ok) {
    throw new Error("Nao foi possivel carregar os dados do usuario.");
  }

  return (await response.json()) as AuthenticatedUserResponse;
}

export function AuthenticatedUserProvider({
  children,
  initialUser,
}: {
  children: ReactNode;
  initialUser: ClientAuthenticatedUser;
}) {
  return (
    <AuthenticatedUserContext.Provider value={{ initialUser }}>
      <SWRConfig
        value={{
          fallback: {
            [AUTHENTICATED_USER_KEY]: { user: initialUser },
          },
          fetcher: fetchAuthenticatedUser,
          revalidateOnFocus: false,
        }}
      >
        {children}
      </SWRConfig>
    </AuthenticatedUserContext.Provider>
  );
}

export function useAuthenticatedUser() {
  const context = useContext(AuthenticatedUserContext);

  if (!context) {
    throw new Error(
      "useAuthenticatedUser must be used within AuthenticatedUserProvider.",
    );
  }

  const { data, mutate } = useSWR<AuthenticatedUserResponse>(
    AUTHENTICATED_USER_KEY,
    {
      fallbackData: { user: context.initialUser },
      revalidateOnMount: false,
    },
  );

  return {
    user: data?.user ?? context.initialUser,
    mutateUser: async (nextUser: ClientAuthenticatedUser) => {
      await mutate({ user: nextUser }, { revalidate: false });
    },
    revalidateUser: async () => {
      await mutate();
    },
  };
}
