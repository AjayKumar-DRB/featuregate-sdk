// registry/react/FeatureProvider.tsx
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { EvaluationContext, FeatureFlagMap } from "../core/types";

interface FeatureContextValue {
  context: EvaluationContext | null;
  flags: FeatureFlagMap;
  setContext: (context: EvaluationContext) => void;
  setFlags: (flags: FeatureFlagMap) => void;
}

const FeatureContext = createContext<FeatureContextValue | undefined>(undefined);

interface FeatureProviderProps {
  children: ReactNode;
  initialContext?: EvaluationContext;
  initialFlags?: FeatureFlagMap;
}

export const FeatureProvider: React.FC<FeatureProviderProps> = ({
  children,
  initialContext = null,
  initialFlags = {},
}) => {
  const [context, setContext] = useState<EvaluationContext | null>(initialContext);
  const [flags, setFlags] = useState<FeatureFlagMap>(initialFlags);

  // BUG FIX: Listen for changes to the initial props and update internal state.
  // This ensures that if a developer fetches new flags from an API, the UI updates.
  useEffect(() => {
    setFlags(initialFlags);
  }, [initialFlags]);

  useEffect(() => {
    if (initialContext) {
      setContext(initialContext);
    }
  }, [initialContext]);

  return (
    <FeatureContext.Provider value={{ context, flags, setContext, setFlags }}>
      {children}
    </FeatureContext.Provider>
  );
};

export const useFeatureContext = () => {
  const context = useContext(FeatureContext);
  if (!context) {
    throw new Error("useFeatureContext must be used within a FeatureProvider");
  }
  return context;
};