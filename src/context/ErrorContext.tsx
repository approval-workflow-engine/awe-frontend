import { createContext, useContext, useState,type ReactNode } from "react";

interface ErrorContextType {
  error: string | null;
  setError: (msg: string | null) => void;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

export function ErrorProvider({ children }: { children: ReactNode }) {
  const [error, setError] = useState<string | null>(null);

  return (
    <ErrorContext.Provider value={{ error, setError }}>
      {children}
    </ErrorContext.Provider>
  );
}

export function useError() {
  const ctx = useContext(ErrorContext);
  if (!ctx) {
    throw new Error("useError must be used within an ErrorProvider");
  }
  return ctx;
}
