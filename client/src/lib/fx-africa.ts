import type { FXData } from "@/components/hedge/types";
import { createFxProvider } from "@/lib/fx-provider";

/**
 * Thin wrapper that delegates to the active FX provider.
 *
 * The provider implementation (HTTP API, Chainlink, mixed) is selected
 * inside `createFxProvider` based on environment configuration. This
 * keeps the hedge UI decoupled from any specific FX data source.
 */
const provider = createFxProvider();

export async function fetchAfricanFxRates(): Promise<FXData> {
  return provider.getAfricanRates();
}

