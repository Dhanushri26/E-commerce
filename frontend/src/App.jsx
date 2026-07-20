import { useCallback, useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { fetchAuthSession } from "aws-amplify/auth";

import AppRoutes from "./routes/AppRoutes";
import { AppProvider } from "./context/AppContext";
import { ErrorBoundary } from "./components/ui/error-boundary";
import LoginPage from "./pages/LoginPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

function App() {
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [initialRoute, setInitialRoute] = useState("/");

  const checkSession = useCallback(async () => {
    setLoading(true);

    try {
      const session = await fetchAuthSession();

      if (session.tokens?.accessToken) {
        const idToken = session.tokens.idToken?.toString();

        if (idToken) {
          const payload = JSON.parse(atob(idToken.split(".")[1]));
          const groups = payload["cognito:groups"] || [];

          if (groups.includes("Admin")) {
            setInitialRoute("/admin");
          } else {
            setInitialRoute("/");
          }
        }

        setIsLoggedIn(true);
        return;
      }
    } catch (err) {
      console.log("No existing session");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" />
          <p className="text-sm font-medium text-slate-500">Loading ShopSphere...</p>
        </div>
      </div>
    );
  }

  return isLoggedIn ? (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AppProvider>
          <BrowserRouter>
            <AppRoutes initialRoute={initialRoute} />
          </BrowserRouter>
        </AppProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  ) : (
    <LoginPage onLogin={checkSession} />
  );
}

export default App;