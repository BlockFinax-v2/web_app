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
import { MainLayout } from "@/components/layout/main-layout";
import { useWallet } from "@/hooks/use-wallet";
import { Redirect } from "wouter";

// A wrapper for authenticated routes that requires a connected wallet
// and encapsulates the view within the responsive MainLayout framework
function AuthenticatedRoute({ component: Component, path }: { component: any, path: string }) {
  const { wallet } = useWallet();
  
  return (
    <Route path={path}>
      {() => {
        if (!wallet) {
          return <Redirect to="/login" />;
        }
        return (
          <MainLayout>
            <Component />
          </MainLayout>
        );
      }}
    </Route>
  );
}

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

      {/* Role dashboards (Wrapped in MainLayout) */}
      <AuthenticatedRoute path="/role-selection" component={RoleSelection} />
      <AuthenticatedRoute path="/exporter-dashboard" component={ExporterDashboard} />
      <AuthenticatedRoute path="/importer-dashboard" component={ImporterDashboard} />
      <AuthenticatedRoute path="/financier-dashboard" component={FinancierDashboard} />

      {/* Trade & finance */}
      <AuthenticatedRoute path="/trade-finance" component={TradeFinance} />
      <AuthenticatedRoute path="/treasury" component={TreasuryPortal} />
      <AuthenticatedRoute path="/treasury/specialists" component={SpecialistDiscovery} />
      <AuthenticatedRoute path="/contracts" component={Contracts} />
      <AuthenticatedRoute path="/marketplace" component={Marketplace} />
      <AuthenticatedRoute path="/hedge" component={Hedge} />

      {/* Rewards & admin */}
      <AuthenticatedRoute path="/rewards" component={Referrals} />
      <AuthenticatedRoute path="/admin-nav" component={AdminNav} />
      <AuthenticatedRoute path="/admin" component={AdminDashboard} />
      <AuthenticatedRoute path="/escrow-admin" component={EscrowDashboard} />

      <Route component={NotFound} />
    </Switch>
  );
}

import { ThemeProvider } from "@/components/ui/theme-provider";
import { TransactionSignerProvider } from "@/contexts/TransactionSignerContext";

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <QueryClientProvider client={queryClient}>
        <TransactionSignerProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </TransactionSignerProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
