export interface EscrowStats {
    totalUsers: number;
    usersByRole: {
        exporters: number;
        importers: number;
        financiers: number;
    };
    totalEscrows: number;
    totalValueLocked: string;
    activeEscrows: number;
    completedEscrows: number;
    networkStatus: string;
    activeWallets: number;
}

export interface UserActivity {
    walletAddress: string;
    role: string;
    lastActivity: string;
    kycStatus: string;
    escrowsCreated: number;
    escrowsParticipated: number;
    referralSource?: string;
}

export interface EscrowData {
    id: string;
    contractAddress: string;
    escrowId: string;
    exporter: string;
    importer: string;
    financier?: string;
    amount: string;
    tokenSymbol: string;
    status: string;
    createdDate: string;
    expiryDate?: string;
    networkId: number;
}

export interface TransactionFeed {
    txHash: string;
    contractAddress: string;
    eventName: string;
    blockNumber: number;
    timestamp: string;
    eventData: any;
    networkId: number;
}

export interface TokenStats {
    symbol: string;
    totalValue: string;
    escrowCount: number;
    percentage: number;
}

export interface SmartContract {
    contractAddress: string;
    deployer: string;
    abiVersion: string;
    deploymentTx: string;
    activeInstances: number;
    isActive: boolean;
    auditLink?: string;
    createdAt: string;
}

export interface ReferralActivity {
    id: string;
    referrerAddress: string;
    referredAddress: string;
    referralCode: string;
    referralSource: string;
    accountCreatedAt: string;
    status: 'pending' | 'completed' | 'rewarded';
    rewardAmount?: string;
    rewardToken?: string;
    firstEscrowCreated?: boolean;
    totalEscrowValue?: string;
}

export interface ReferralStats {
    totalReferrals: number;
    activeReferrers: number;
    conversionRate: number;
    topReferralSources: Array<{
        source: string;
        count: number;
        percentage: number;
    }>;
    recentSignups: number;
    totalRewardsDistributed: string;
}

export interface FinancePool {
    id: string;
    name: string;
    type: 'trade_finance' | 'working_capital' | 'supply_chain' | 'invoice_factoring';
    totalFunding: string;
    availableLiquidity: string;
    utilizationRate: number;
    usersServed: number;
    activeLoans: number;
    averageAPR: number;
    maturityPeriod: string;
    riskRating: 'AAA' | 'AA' | 'A' | 'BBB' | 'BB' | 'B';
    status: 'active' | 'paused' | 'closed';
    createdAt: string;
    lastActivity: string;
}

export interface FinanceLoan {
    id: string;
    poolId: string;
    borrowerAddress: string;
    amount: string;
    currency: string;
    apr: number;
    term: string;
    purpose: string;
    collateralType: string;
    status: 'pending' | 'approved' | 'funded' | 'repaying' | 'completed' | 'defaulted';
    fundedAt?: string;
    dueDate?: string;
    repaidAmount?: string;
}

export interface FinanceStats {
    totalPools: number;
    totalFundingDeployed: string;
    totalUsersServed: number;
    averageUtilization: number;
    totalActiveLoans: number;
    totalRepaid: string;
    defaultRate: number;
    averageAPR: number;
}
