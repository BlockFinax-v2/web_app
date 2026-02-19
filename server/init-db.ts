/**
 * Database Initialization
 * 
 * Sets up default blockchain networks for the communication platform.
 * Ensures essential network configurations are available for wallet operations.
 */

import { db } from "./db";
import { networks } from "@shared/schema";
import { eq } from "drizzle-orm";

// Default blockchain networks for wallet support
const defaultNetworks = [
  {
    name: "Base Sepolia",
    chainId: 84532,
    rpcUrl: "https://sepolia.base.org",
    symbol: "ETH",
    blockExplorerUrl: "https://sepolia-explorer.base.org",
    isTestnet: true
  }
];

/**
 * Initialize database with default network configurations
 * Creates essential blockchain network entries if they don't exist
 */
export async function initializeDatabase() {
  if (!db) {
    console.log("Skipping database initialization: No database connection.");
    return;
  }

  console.log("Initializing database with default networks...");

  for (const network of defaultNetworks) {
    try {
      // Check if network already exists
      const existing = await db
        .select()
        .from(networks)
        .where(eq(networks.chainId, network.chainId))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(networks).values(network);
        console.log(`Added network: ${network.name}`);
      } else {
        console.log(`Network already exists: ${network.name}`);
      }
    } catch (error) {
      console.error(`Failed to add network ${network.name}:`, error);
    }
  }

  console.log("Database initialization completed");
}