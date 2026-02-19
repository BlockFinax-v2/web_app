export const UNDERLYING_PAIRS = [
    "USD/GHS",
    "USD/NGN",
    "USD/KES",
    "USD/ZAR"
];

export const SAFETY_FACTORS = [
    { label: "High (0.90)", value: "0.90" },
    { label: "Standard (0.80)", value: "0.80" },
    { label: "Conservative (0.70)", value: "0.70" }
];

export const EXPIRY_OPTIONS = [
    { label: "30 Days", value: "30" },
    { label: "60 Days", value: "60" },
    { label: "90 Days", value: "90" }
];

export const getStatusBadgeStyle = (status: string) => {
    switch (status) {
        case "active":
            return "bg-green-500/20 text-green-400 border-green-500/30";
        case "settled_win":
        case "claimed":
            return "bg-primary/20 text-primary border-primary/30";
        case "settled_loss":
            return "bg-muted/50 text-muted-foreground border-border";
        default:
            return "bg-muted/50 text-muted-foreground border-border";
    }
};

export const getStatusLabel = (status: string) => {
    switch (status) {
        case "active":
            return "Active";
        case "settled_win":
            return "Payout Available";
        case "settled_loss":
            return "Expired";
        case "claimed":
            return "Claimed";
        default:
            return status;
    }
};
