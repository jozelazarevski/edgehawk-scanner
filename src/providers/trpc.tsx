import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink } from "@trpc/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import superjson from "superjson";
import type { AppRouter } from "../../api/router";
import type { ReactNode } from "react";
import { createStaticFetch } from "@/static/localLink";

export const trpc = createTRPCReact<AppRouter>();

// Static builds (GitHub Pages) have no backend — resolve tRPC in-browser.
const IS_STATIC = import.meta.env.VITE_STATIC === "1";

const queryClient = new QueryClient();
const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      fetch: IS_STATIC
        ? createStaticFetch()
        : (input, init) =>
            globalThis.fetch(input, {
              ...(init ?? {}),
              credentials: "include",
            }),
    }),
  ],
});

export function TRPCProvider({ children }: { children: ReactNode }) {
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  );
}
