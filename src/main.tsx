import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { MotionConfig } from "motion/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { TmdbError } from "./lib/tmdb";
import { makeRouter } from "./router";
import "./styles/app.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // a missing film (404) or a bad key (401) does not get better with a retry
      retry: (count, error) =>
        !(error instanceof TmdbError && error.status >= 400 && error.status < 500) && count < 2,
      refetchOnWindowFocus: false,
    },
  },
});

const router = makeRouter(queryClient);

// A view transition is skipped when the tab is hidden or a second navigation interrupts it.
// The page still updates; only the animation is lost, so the rejection is not an error.
window.addEventListener("unhandledrejection", (event) => {
  const reason = event.reason as { name?: string; message?: string } | undefined;
  if (
    (reason?.name === "InvalidStateError" || reason?.name === "AbortError") &&
    /transition/i.test(reason.message ?? "")
  ) {
    event.preventDefault();
  }
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </MotionConfig>
  </StrictMode>,
);

// The service worker caches the app shell only (docs/decisions.md); not in development.
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {});
  });
}
