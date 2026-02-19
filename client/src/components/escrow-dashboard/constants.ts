export const getStatusColor = (status?: string) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    switch (status.toLowerCase()) {
        case 'active': case 'funded': case 'approved': return 'bg-green-100 text-green-800';
        case 'completed': case 'released': case 'repaid': return 'bg-blue-100 text-blue-800';
        case 'expired': case 'defaulted': return 'bg-red-100 text-red-800';
        case 'disputed': case 'pending': case 'repaying': return 'bg-yellow-100 text-yellow-800';
        default: return 'bg-gray-100 text-gray-800';
    }
};

export const formatAddress = (address?: string) => {
    if (!address) return "N/A";
    if (address.length < 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const formatCurrency = (amount?: string | number) => {
    if (amount === undefined || amount === null) return "$0.00";
    const num = typeof amount === "string" ? parseFloat(amount.replace(/[^0-9.-]+/g, "")) : amount;
    if (isNaN(num)) return "$0.00";
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(num);
};

export const getEtherscanUrl = (txHash: string, networkId: number) => {
    let baseUrl = 'https://etherscan.io';
    if (networkId === 11155111) baseUrl = 'https://sepolia.etherscan.io';
    else if (networkId === 8453) baseUrl = 'https://basescan.org';
    else if (networkId === 84532) baseUrl = 'https://sepolia.basescan.org';
    return `${baseUrl}/tx/${txHash}`;
};

export const getRiskRatingColor = (rating?: string) => {
    if (!rating) return 'bg-gray-100 text-gray-800';
    switch (rating.toUpperCase()) {
        case 'AAA': case 'AA': return 'bg-green-100 text-green-800';
        case 'A': case 'BBB': return 'bg-blue-100 text-blue-800';
        case 'BB': case 'B': return 'bg-yellow-100 text-yellow-800';
        default: return 'bg-red-100 text-red-800';
    }
};

export const getPoolTypeLabel = (type?: string) => {
    if (!type) return 'Unknown';
    switch (type.toLowerCase()) {
        case 'trade_finance': return 'Trade Finance';
        case 'working_capital': return 'Working Capital';
        case 'supply_chain': return 'Supply Chain';
        case 'invoice_factoring': return 'Invoice Factoring';
        default: return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }
};
