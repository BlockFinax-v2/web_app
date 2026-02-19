# Overview

BlockFinaX is a blockchain-based trade finance marketplace designed to bridge the $4 trillion global trade finance gap, specifically targeting the $1.2 trillion African market. It connects African SME importers/exporters with global financiers. The platform offers three core pillars: cross-border stablecoin payments (Pay), peer-to-peer trade finance matching (Finance), and peer-to-peer trade hedging for FX protection (Hedge). All USDC transactions flow through a treasury pool wallet. The business model includes a 1% platform fee on funded trades and a 0.5% hedge pool fee. The project aims for a Mainnet launch in July 2026 on the Base Network and is seeking $25M in funding, positioning itself as a "finance match marketplace."

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Core Design
The platform is built with a multi-network architecture. The frontend is developed using React 18, TypeScript, and Vite, while the backend uses Express.js and WebSockets. PostgreSQL, managed by Drizzle ORM on Neon, serves as the database. Blockchain interactions are handled by ethers.js, supporting operations on Base Sepolia, Lisk Sepolia, and Base Mainnet. Smart contracts are modular, utilizing the EIP-2535 Diamond Standard for upgradeability.

## UI/UX
The user interface is constructed with shadcn/ui components (based on Radix UI) and styled with Tailwind CSS. State management employs TanStack Query for server-side data and React hooks for local component state. Wouter is used for client-side routing, and Framer Motion provides animations.

## Technical Implementations
- **Wallet Management**: Supports main and contract-specific sub-wallets. Features include AES-256 encrypted private key storage, session-based access, automated sub-wallet generation, and real-time balance tracking.
- **Real-time Communication**: Implemented via WebSockets for messaging with delivery status and file attachments. WebRTC enables secure peer-to-peer voice and video calls between wallet addresses.
- **Smart Contract Platform**: An escrow system, built on the EIP-2535 Diamond Standard, facilitates secure trade finance with milestone payments, multi-party agreements, and dispute resolution. Active Diamond facets: EscrowFacet, DocumentFacet, LiquidityPoolFacet. (InvoiceFacet and GovernanceFacet removed from app layer as they don't align with the Pay/Finance/Hedge value proposition.)
- **Security**: Comprehensive security measures include encrypted private key storage, session-based authentication, automatic wallet locking, secure transaction signing, input validation, SQL injection prevention, secure WebSocket protocols, EIP-191 cryptographic signature verification for mainnet API routes, tiered API rate limiting, and mainnet transaction safety guards with daily limits.
- **Trade Finance Portal**: Provides a matchmaking model for trade financing, allowing businesses to submit applications, track offers, and manage trade milestones (Applied → Offers Received → Offer Accepted → Documents Verified → Goods Shipped → Delivery Confirmed → Payment Complete). Features partial payment support for invoices and charges a 1% platform fee.
- **Financier Console**: Enables financiers to browse trade financing applications, register their institution (Bank, Trade Finance Fund, Family Office, DFI, Institutional Investor), and submit competitive offers with configurable terms (amount, interest rate, tenor, fees, conditions).
- **Waitlist System**: Collects early adopter information through an embedded Zoho Form, including contact details, role, company, country, trade volume, and financing needs.
- **B2B Trade Partner Marketplace**: Facilitates business discovery and connection for high-value commodity trades within African trade corridors. Features include business profiles, product listings, an RFQ system, trade corridor analytics, and a review/reputation system. A 0.1% marketplace fee plus a 1% trade financing fee is applied.
- **P2P Trade Hedge**: A Web3-based system for FX protection against currency devaluation. It allows hedgers to buy protection by paying a premium and LPs to provide liquidity to event pools, earning premiums. Settlements are based on admin-posted FX rates. Supports USD/GHS, USD/NGN, USD/KES, USD/ZAR, USD/XOF, EUR/GHS pairs.

# External Dependencies

## Blockchain Infrastructure
- **Ethers.js**: For all blockchain interactions.
- **Multi-Network Support**: Base Sepolia (primary testnet), Lisk Sepolia (secondary testnet), and Base Mainnet (production).
- **USDC Integration**: For stablecoin operations on Base Mainnet.

## Database Services
- **Neon Database**: Serverless PostgreSQL.
- **Drizzle ORM**: For type-safe database operations.

## Frontend Libraries
- **Radix UI**: For accessible UI components.
- **TanStack Query**: For server state management.
- **Wouter**: For client-side routing.
- **Framer Motion**: For animations.

## Development Tools
- **Vite**: Build tool.
- **TypeScript**: For type safety.
- **Tailwind CSS**: CSS framework.

## Cryptography and Security
- **crypto-js**: For client-side encryption.
- **WebSocket**: For real-time communication.

## Third-party Integrations
- **Coinbase SDK**: For wallet functionality.
- **Zoho Forms**: For waitlist management.