"use client";

import { createContext, useContext } from "react";

const CurrencyContext = createContext("LKR");

export function CurrencyProvider({ currency, children }: { currency: string; children: React.ReactNode }) {
  return <CurrencyContext value={currency}>{children}</CurrencyContext>;
}

export const useCurrency = () => useContext(CurrencyContext);
