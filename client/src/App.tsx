/**
 * Main Application Component
 * 
 * React application root with routing, state management, and wallet integration.
 * Handles wallet authentication flow, referral processing, and global providers.
 */

import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/api-client";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

// Public pages
import Website from "@/pages/website";
import PitchDeck from "@/pages/pitch-deck";
import Whitepaper from "@/pages/whitepaper";
import Waitlist from "@/pages/waitlist";
import NotFound from "@/pages/not-found";

// Wallet & auth
import Wallet from "@/pages/wallet";
import CreateWallet from "@/pages/create-wallet";
import ImportWallet from "@/pages/import-wallet";
import UnlockWallet from "@/pages/unlock-wallet";
import Login from "@/pages/login";

// Role dashboards
import RoleSelection from "@/pages/role-selection";
import ExporterDashboard from "@/pages/exporter-dashboard";
import ImporterDashboard from "@/pages/importer-dashboard";
import FinancierDashboard from "@/pages/financier-dashboard";

// Trade & finance
import TradeFinance from "@/pages/trade-finance";
import TreasuryPortal from "@/pages/financier-console";
import SpecialistDiscovery from "@/pages/specialist-registry";
import Contracts from "@/pages/contracts";
import Marketplace from "@/pages/marketplace";
import Hedge from "@/pages/hedge";


// Rewards & admin
import Referrals from "@/pages/rewards-referrals";
import AdminDashboard from "@/pages/admin-dashboard";
import EscrowDashboard from "@/pages/escrow-dashboard";
import AdminNav from "@/components/admin/admin-nav";

function Router() {
  return (
    <Switch>
      {/* Public */}
      <Route path="/" component={Website} />
      <Route path="/pitch" component={PitchDeck} />
      <Route path="/whitepaper" component={Whitepaper} />
      <Route path="/waitlist" component={Waitlist} />

      {/* Wallet & auth */}
      <Route path="/wallet" component={Wallet} />
      <Route path="/create-wallet" component={CreateWallet} />
      <Route path="/import-wallet" component={ImportWallet} />
      <Route path="/unlock-wallet" component={UnlockWallet} />
      <Route path="/login" component={Login} />

      {/* Role dashboards */}
      <Route path="/role-selection" component={RoleSelection} />
      <Route path="/exporter-dashboard" component={ExporterDashboard} />
      <Route path="/importer-dashboard" component={ImporterDashboard} />
      <Route path="/financier-dashboard" component={FinancierDashboard} />

      {/* Trade & finance */}
      <Route path="/trade-finance" component={TradeFinance} />
      <Route path="/treasury" component={TreasuryPortal} />
      <Route path="/treasury/specialists" component={SpecialistDiscovery} />
      <Route path="/contracts" component={Contracts} />
      <Route path="/marketplace" component={Marketplace} />
      <Route path="/hedge" component={Hedge} />

      {/* Rewards & admin */}
      <Route path="/rewards" component={Referrals} />
      <Route path="/admin-nav" component={AdminNav} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/escrow-admin" component={EscrowDashboard} />

      <Route component={NotFound} />
    </Switch>
  );
}

import { ThemeProvider } from "@/components/ui/theme-provider";

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
