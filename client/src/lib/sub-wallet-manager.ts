/**
 * Sub-Wallet Management System
 * 
 * Manages contract-specific escrow accounts where each contract
 * gets dedicated sub-wallets for all parties involved.
 */

import { ethers } from 'ethers';
import { walletManager } from './wallet';
import { secureStorage } from './encrypted-storage';
import { usdcManager } from './usdc-manager';
import CryptoJS from 'crypto-js';

export interface SubWalletData {
  address: string;
  name: string; // Human-readable name based on contract
  encryptedPrivateKey: string;
  contractId: string;
  purpose: string;
  mainWalletAddress: string;
  createdAt: string;
  contractSigned?: boolean;
  signedAt?: string;
  contractRole?: 'party' | 'arbitrator';
}

export interface ContractInvitation {
  id: string;
  inviterAddress: string;
  inviteeAddress: string;
  contractType: 'trade_finance' | 'escrow' | 'export_import';
  contractDetails: {
    title: string;
    description: string;
    amount: string;
    currency: string;
    deadline: string;
  };
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  expiresAt: string;
  createdAt: string;
  respondedAt?: string;
}

class SubWalletManager {
  private subWallets: Map<string, SubWalletData> = new Map();
  private invitations: Map<string, ContractInvitation> = new Map();
  private balanceCache: Map<string, { balance: any; timestamp: number }> = new Map();
  private cacheTimeout = 30000; // 30 seconds cache

  constructor() {
    this.loadSubWalletsFromStorage();
    this.loadInvitationsFromStorage();
  }

  createSubWallet(contractId: string, purpose: string, contractTitle?: string): SubWalletData {
    // Ensure wallet is properly restored before accessing
    walletManager.restoreWalletFromMemory();
    const mainWalletAddress = walletManager.getAddress();
    if (!mainWalletAddress) {
      throw new Error('Main wallet not connected. Please unlock your wallet first.');
    }

    // Generate new wallet
    const newWallet = ethers.Wallet.createRandom();
    
    // Encrypt private key using secure storage for consistency with existing sub-wallets
    const encryptedPrivateKey = secureStorage.encrypt(newWallet.privateKey);
    
    // Create human-readable name
    const name = contractTitle ? 
      `${contractTitle} - ${purpose}` : 
      `Contract ${contractId.slice(0, 8)} - ${purpose}`;
    
    const subWalletData: SubWalletData = {
      address: newWallet.address,
      name,
      encryptedPrivateKey,
      contractId,
      purpose,
      mainWalletAddress,
      createdAt: new Date().toISOString()
    };

    this.subWallets.set(newWallet.address, subWalletData);
    this.saveSubWalletsToStorage();
    
    // Sync to database
    this.syncSubWalletToDatabase(subWalletData);
    
    return subWalletData;
  }

  /**
   * Sync sub-wallet to database
   */
  private async syncSubWalletToDatabase(subWalletData: SubWalletData): Promise<void> {
    try {
      const response = await fetch('/api/sub-wallets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: subWalletData.address,
          name: subWalletData.name,
          contractId: subWalletData.contractId,
          purpose: subWalletData.purpose,
          mainWalletAddress: subWalletData.mainWalletAddress,
          encryptedPrivateKey: subWalletData.encryptedPrivateKey,
          contractSigned: subWalletData.contractSigned || false
        })
      });

      if (!response.ok) {
      } else {
      }
    } catch (error) {
    }
  }

  /**
   * Sync existing sub-wallets to database
   */
  private async syncExistingSubWalletsToDatabase(): Promise<void> {
    for (const subWalletData of Array.from(this.subWallets.values())) {
      await this.syncSubWalletToDatabase(subWalletData);
    }
  }

  /**
   * Sync sub-wallets from database to local storage
   */
  syncFromDatabase(databaseSubWallets: any[]): void {
    
    // Clear existing sub-wallets
    this.subWallets.clear();
    
    // Add database sub-wallets to memory
    for (const dbSubWallet of databaseSubWallets) {
      const subWalletData: SubWalletData = {
        address: dbSubWallet.address,
        name: dbSubWallet.name,
        encryptedPrivateKey: dbSubWallet.encryptedPrivateKey,
        contractId: dbSubWallet.contractId,
        purpose: dbSubWallet.purpose,
        mainWalletAddress: dbSubWallet.mainWalletAddress,
        createdAt: dbSubWallet.createdAt || new Date().toISOString(),
        contractSigned: dbSubWallet.contractSigned || false
      };
      
      this.subWallets.set(dbSubWallet.address, subWalletData);
    }
    
    // Save to local storage
    this.saveSubWalletsToStorage();
    
  }

  /**
   * Send invitation to another party to create their sub-wallet for the contract
   */
  async sendContractInvitation(
    inviteeAddress: string,
    contractType: 'trade_finance' | 'escrow' | 'export_import',
    contractDetails: {
      title: string;
      description: string;
      amount: string;
      currency: string;
      deadline: string;
    }
  ): Promise<ContractInvitation> {
    const mainWalletAddress = walletManager.getAddress();
    if (!mainWalletAddress) {
      throw new Error('Main wallet not connected');
    }

    const invitation: ContractInvitation = {
      id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      inviterAddress: mainWalletAddress,
      inviteeAddress,
      contractType,
      contractDetails,
      status: 'pending',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      createdAt: new Date().toISOString()
    };

    this.invitations.set(invitation.id, invitation);
    this.saveInvitationsToStorage();
    
    return invitation;
  }

  /**
   * Accept a contract invitation and create sub-wallet
   */
  acceptInvitation(invitationId: string, contractId: string): SubWalletData {
    const invitation = this.invitations.get(invitationId);
    if (!invitation) {
      throw new Error('Invitation not found');
    }

    if (invitation.status !== 'pending') {
      throw new Error('Invitation has already been processed');
    }

    // Mark invitation as accepted
    invitation.status = 'accepted';
    invitation.respondedAt = new Date().toISOString();
    this.saveInvitationsToStorage();

    // Create sub-wallet for the contract
    const accessData: SubWalletData = this.createSubWallet(
      contractId, 
      'Contract Participant',
      invitation.contractDetails.title
    );

    return accessData;
  }

  /**
   * Get sub-wallets for the current main wallet
   */
  getSubWallets(): SubWalletData[] {
    const mainWalletAddress = walletManager.getAddress();
    if (!mainWalletAddress) return [];
    
    return Array.from(this.subWallets.values())
      .filter(sw => sw.mainWalletAddress === mainWalletAddress);
  }

  /**
   * Get sub-wallets for a specific contract
   */
  getSubWalletsForContract(contractId: string): SubWalletData[] {
    return Array.from(this.subWallets.values())
      .filter(sw => sw.contractId === contractId);
  }

  /**
   * Get pending invitations for current wallet
   */
  getPendingInvitations(): ContractInvitation[] {
    const mainWalletAddress = walletManager.getAddress();
    if (!mainWalletAddress) return [];
    
    return Array.from(this.invitations.values())
      .filter(inv => inv.inviteeAddress === mainWalletAddress && inv.status === 'pending');
  }

  /**
   * Get signer for a sub-wallet
   */
  getSubWalletSigner(subWalletAddress: string): ethers.Wallet | null {
    const subWalletData = this.subWallets.get(subWalletAddress);
    if (!subWalletData) return null;

    try {
      const privateKey = secureStorage.decrypt(subWalletData.encryptedPrivateKey);
      return new ethers.Wallet(privateKey);
    } catch (error) {
      return null;
    }
  }

  /**
   * Get balance for a sub-wallet with caching
   */
  async getSubWalletBalance(subWalletAddress: string, networkId: number = 84532): Promise<{ eth: string; usdc: string; ethUsd: number; usdcUsd: number }> {
    const cacheKey = `${subWalletAddress}_${networkId}`;
    const cached = this.balanceCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.balance;
    }

    try {
      
      // Create provider based on network (using chainId)
      let provider: ethers.JsonRpcProvider;
      let networkName: string;
      
      if (networkId === 84532) {
        provider = new ethers.JsonRpcProvider('https://sepolia.base.org');
        networkName = 'Base Sepolia';
      } else if (networkId === 4202) {
        provider = new ethers.JsonRpcProvider('https://rpc.sepolia-api.lisk.com');
        networkName = 'Lisk Sepolia';
      } else if (networkId === 8453) {
        provider = new ethers.JsonRpcProvider('https://mainnet.base.org');
        networkName = 'Base Mainnet';
      } else if (networkId === 11155111) {
        provider = new ethers.JsonRpcProvider('https://sepolia.drpc.org');
        networkName = 'Ethereum Sepolia';
      } else {
        provider = new ethers.JsonRpcProvider('https://sepolia.base.org');
        networkName = 'Base Sepolia (default)';
      }
      
      // Get ETH balance
      const ethBalance = await provider.getBalance(subWalletAddress);
      const ethFormatted = ethers.formatEther(ethBalance);

      // Use unified USDC manager for consistent detection (pass chainId)
      const usdcFormatted = await usdcManager.getUSDCBalance(subWalletAddress, networkId);
      const foundUSDC = parseFloat(usdcFormatted) > 0;
      
      if (foundUSDC) {
      } else {
      }

      // Calculate USD values
      const ethPrice = 2400;
      const usdcPrice = 1.00;

      const ethUsd = parseFloat(ethFormatted) * ethPrice;
      const usdcUsd = parseFloat(usdcFormatted) * usdcPrice;

      const result = {
        eth: parseFloat(ethFormatted).toFixed(6),
        usdc: parseFloat(usdcFormatted).toFixed(2),
        ethUsd,
        usdcUsd
      };
      
      // Cache the result
      this.balanceCache.set(cacheKey, {
        balance: result,
        timestamp: Date.now()
      });
      
      return result;
    } catch (error) {
      return { eth: '0.00', usdc: '0.00', ethUsd: 0, usdcUsd: 0 };
    }
  }

  /**
   * Save sub-wallets to local storage
   */
  private saveSubWalletsToStorage(): void {
    const data = Array.from(this.subWallets.entries());
    localStorage.setItem('subWallets', JSON.stringify(data));
  }

  /**
   * Load sub-wallets from local storage
   */
  loadSubWalletsFromStorage(): void {
    try {
      const data = localStorage.getItem('subWallets');
      if (data) {
        const parsed = JSON.parse(data);
        this.subWallets = new Map(parsed);
        
        // Sync to database if we have sub-wallets
        if (this.subWallets.size > 0) {
          this.syncExistingSubWalletsToDatabase();
        }
      }
    } catch (error) {
    }
  }

  /**
   * Save invitations to local storage
   */
  private saveInvitationsToStorage(): void {
    const data = Array.from(this.invitations.entries());
    localStorage.setItem('contractInvitations', JSON.stringify(data));
  }

  /**
   * Load invitations from local storage
   */
  loadInvitationsFromStorage(): void {
    try {
      const data = localStorage.getItem('contractInvitations');
      if (data) {
        const parsed = JSON.parse(data);
        this.invitations = new Map(parsed);
      }
    } catch (error) {
    }
  }

  /**
   * Initialize the sub-wallet manager
   */
  initialize(): void {
    
    // Create sample invitation for testing if none exist
    if (this.invitations.size === 0) {
      const mainWalletAddress = walletManager.getAddress();
      if (mainWalletAddress) {
        const sampleInvitation: ContractInvitation = {
          id: 'sample_inv_001',
          inviterAddress: '0x1234567890123456789012345678901234567890',
          inviteeAddress: mainWalletAddress,
          contractType: 'trade_finance',
          contractDetails: {
            title: 'International Trade Agreement',
            description: 'Export of electronic components to European markets',
            amount: '50000',
            currency: 'USDC',
            deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          },
          status: 'pending',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString()
        };
        
        this.invitations.set(sampleInvitation.id, sampleInvitation);
        this.saveInvitationsToStorage();
      }
    }
  }

  /**
   * Fund a sub-wallet with ETH or USDC
   */
  async fundSubWallet(subWalletAddress: string, amount: string, networkId: number, currency: string): Promise<string> {
    const mainWalletAddress = walletManager.getAddress();
    if (!mainWalletAddress) {
      throw new Error('Main wallet not connected');
    }

    const signer = await walletManager.getSigner(networkId);
    if (!signer) {
      throw new Error(`Wallet signer not available for network ${networkId}`);
    }

    try {
      if (currency === 'ETH') {
        const provider = signer.provider;
        if (provider && mainWalletAddress) {
          const balance = await provider.getBalance(mainWalletAddress);
          const transferAmount = ethers.parseEther(amount);
          if (balance < transferAmount) {
            const available = ethers.formatEther(balance);
            throw new Error(`Insufficient ETH balance. Available: ${available} ETH, Required: ${amount} ETH`);
          }
        }
        const tx = await signer.sendTransaction({
          to: subWalletAddress,
          value: ethers.parseEther(amount),
          gasLimit: 21000
        });
        await tx.wait();
        return tx.hash;
      } else if (currency === 'USDC') {
        const usdcConfig = this.getUsdcConfigForNetwork(networkId);
        if (!usdcConfig) {
          throw new Error(`No USDC configuration for network ${networkId}`);
        }
        
        const usdcAbi = [
          'function transfer(address to, uint256 amount) returns (bool)',
          'function balanceOf(address account) view returns (uint256)',
          'function decimals() view returns (uint8)'
        ];
        
        const usdcContract = new ethers.Contract(usdcConfig.address, usdcAbi, signer);
        const transferAmount = ethers.parseUnits(amount, usdcConfig.decimals);

        if (mainWalletAddress) {
          const usdcBalance = await usdcContract.balanceOf(mainWalletAddress);
          if (usdcBalance < transferAmount) {
            const available = ethers.formatUnits(usdcBalance, usdcConfig.decimals);
            throw new Error(`Insufficient USDC balance. Available: ${available} USDC, Required: ${amount} USDC`);
          }
        }
        
        const tx = await usdcContract.transfer(subWalletAddress, transferAmount);
        await tx.wait();
        return tx.hash;
      } else {
        throw new Error(`Unsupported currency: ${currency}`);
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('insufficient funds')) {
        throw new Error('Insufficient ETH for gas fees. You need ETH to pay transaction fees.');
      }
      throw error;
    }
  }
  
  private getUsdcConfigForNetwork(chainId: number): { address: string; decimals: number } | null {
    // Base Sepolia
    if (chainId === 84532) {
      return { address: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', decimals: 6 };
    }
    // Lisk Sepolia
    if (chainId === 4202) {
      return { address: '0x0E82fDDAd51cc3ac12b69761C45bBCB9A2Bf3C83', decimals: 6 };
    }
    // Base Mainnet
    if (chainId === 8453) {
      return { address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', decimals: 6 };
    }
    return null;
  }

  /**
   * Transfer funds from sub-wallet back to main wallet
   */
  async transferFromSubWallet(subWalletAddress: string, amount: string, currency: string, networkId: number): Promise<string> {
    
    // Try exact match first
    let subWallet = this.subWallets.get(subWalletAddress);
    
    // If not found, try case-insensitive search
    if (!subWallet) {
      const lowerAddress = subWalletAddress.toLowerCase();
      for (const [address, wallet] of Array.from(this.subWallets.entries())) {
        if (address.toLowerCase() === lowerAddress) {
          subWallet = wallet;
          break;
        }
      }
    }
    
    // If still not found, try loading from storage and then from database
    if (!subWallet) {
      this.loadSubWalletsFromStorage();
      subWallet = this.subWallets.get(subWalletAddress);
      
      // If still not found, try to fetch from database
      if (!subWallet) {
        try {
          const mainWalletAddress = walletManager.getAddress();
          if (mainWalletAddress) {
            const response = await fetch(`/api/sub-wallets?walletAddress=${mainWalletAddress}`);
            if (response.ok) {
              const databaseSubWallets = await response.json();
              this.syncFromDatabase(databaseSubWallets);
              subWallet = this.subWallets.get(subWalletAddress);
            }
          }
        } catch (error) {
        }
      }
    }
    
    if (!subWallet) {
      throw new Error(`Sub-wallet not found: ${subWalletAddress}`);
    }

    // Decrypt private key and create signer
    let decryptedPrivateKey: string;
    try {
      // First, ensure the wallet is properly restored
      walletManager.restoreWalletFromMemory();
      
      // Check if wallet is properly unlocked
      if (!secureStorage.isUnlocked()) {
        throw new Error('Wallet is locked. Please unlock your wallet with your password before transferring funds.');
      }
      
      // Get the main wallet private key - try multiple sources
      let mainWalletPrivateKey = secureStorage.getSessionPrivateKey();
      
      if (!mainWalletPrivateKey) {
        const storedWallet = secureStorage.loadWallet();
        if (storedWallet) {
          try {
            mainWalletPrivateKey = secureStorage.decrypt(storedWallet.encryptedPrivateKey);
            if (mainWalletPrivateKey) {
              secureStorage.setSessionPrivateKey(mainWalletPrivateKey);
            }
          } catch (decryptError) {
            throw new Error('Invalid wallet password. Please unlock your wallet with the correct password.');
          }
        }
      }
      
      if (!mainWalletPrivateKey) {
        // Try to get from wallet manager directly
        const wallet = walletManager.getWallet();
        if (wallet && wallet.privateKey) {
          mainWalletPrivateKey = wallet.privateKey;
          secureStorage.setSessionPrivateKey(mainWalletPrivateKey);
        }
      }
      
      if (!mainWalletPrivateKey) {
        throw new Error('Wallet access required. Please unlock your wallet with your password to access sub-wallet funds.');
      }
      
      // Try different decryption methods
      
      // First try: Use secure storage decryption (password-based)
      try {
        decryptedPrivateKey = secureStorage.decrypt(subWallet.encryptedPrivateKey);
        if (decryptedPrivateKey && decryptedPrivateKey.length > 0) {
        }
      } catch (error) {
        
        // Second try: Use the SHA256-derived key method
        try {
          const encryptionKey = CryptoJS.SHA256(subWallet.mainWalletAddress + mainWalletPrivateKey).toString();
          const bytes = CryptoJS.AES.decrypt(subWallet.encryptedPrivateKey, encryptionKey);
          decryptedPrivateKey = bytes.toString(CryptoJS.enc.Utf8);
          
          if (decryptedPrivateKey && decryptedPrivateKey.length > 0) {
          }
        } catch (customError) {
          throw new Error('Unable to decrypt sub-wallet private key');
        }
      }
      
      if (!decryptedPrivateKey || decryptedPrivateKey.length === 0) {
        throw new Error('Failed to decrypt sub-wallet private key');
      }
      
    } catch (error) {
      throw new Error('Unable to decrypt sub-wallet. Please unlock your main wallet and try again.');
    }
    
    // Get provider for the specified network
    let provider = walletManager.getProvider(networkId);
    
    // If provider not available, try to get a signer which includes provider initialization
    if (!provider) {
      const signer = await walletManager.getSigner(networkId);
      if (signer && signer.provider) {
        provider = signer.provider as ethers.JsonRpcProvider;
      }
    }
    
    if (!provider) {
      throw new Error(`Provider not available for network ${networkId}`);
    }
    
    const subWalletSigner = new ethers.Wallet(decryptedPrivateKey, provider);

    const mainWalletAddress = walletManager.getAddress();
    if (!mainWalletAddress) {
      throw new Error('Main wallet not connected');
    }

    try {
      if (currency === 'ETH') {
        const balance = await provider.getBalance(subWalletAddress);
        const feeData = await provider.getFeeData();
        const gasLimit = 21000;
        const gasCost = BigInt(gasLimit) * (feeData.gasPrice || BigInt(0));
        
        const transferAmount = ethers.parseEther(amount);
        if (balance < transferAmount + gasCost) {
          const available = ethers.formatEther(balance);
          const needed = ethers.formatEther(transferAmount + gasCost);
          throw new Error(`Insufficient ETH balance. Available: ${available} ETH, Required (including gas): ${needed} ETH`);
        }

        const tx = await subWalletSigner.sendTransaction({
          to: mainWalletAddress,
          value: transferAmount,
          gasLimit: gasLimit
        });
        await tx.wait();
        return tx.hash;
      } else if (currency === 'USDC') {
        const usdcConfig = this.getUsdcConfigForNetwork(networkId);
        if (!usdcConfig) {
          throw new Error(`No USDC configuration for network ${networkId}`);
        }
        
        const usdcAbi = [
          'function transfer(address to, uint256 amount) returns (bool)',
          'function balanceOf(address account) view returns (uint256)',
          'function decimals() view returns (uint8)'
        ];
        
        const usdcContract = new ethers.Contract(usdcConfig.address, usdcAbi, subWalletSigner);
        const transferAmount = ethers.parseUnits(amount, usdcConfig.decimals);

        const usdcBalance = await usdcContract.balanceOf(subWalletAddress);
        if (usdcBalance < transferAmount) {
          const available = ethers.formatUnits(usdcBalance, usdcConfig.decimals);
          throw new Error(`Insufficient USDC balance. Available: ${available} USDC, Required: ${amount} USDC`);
        }

        const ethBalance = await provider.getBalance(subWalletAddress);
        if (ethBalance === BigInt(0)) {
          throw new Error('This contract wallet has no ETH for gas fees. Please fund it with a small amount of ETH first.');
        }
        
        const tx = await usdcContract.transfer(mainWalletAddress, transferAmount);
        await tx.wait();
        return tx.hash;
      } else {
        throw new Error(`Unsupported currency: ${currency}`);
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('insufficient funds')) {
          throw new Error('This contract wallet needs ETH for gas fees. Please fund it with a small amount of ETH first.');
        }
      }
      throw error;
    }
  }

  /**
   * Sign a contract with the main wallet
   */
  async signContract(subWalletAddress: string): Promise<{ isFullySigned: boolean; fundsLocked: boolean }> {
    const mainWalletAddress = walletManager.getAddress();
    if (!mainWalletAddress) {
      throw new Error('Main wallet not connected');
    }

    // Use the currently selected network (defaults to Base Sepolia)
    const signer = await walletManager.getSigner(84532);
    if (!signer) {
      throw new Error('Wallet signer not available');
    }

    try {
      // Create signature message
      const message = `Sign contract for sub-wallet ${subWalletAddress} at ${new Date().toISOString()}`;
      const signature = await signer.signMessage(message);
      
      // Store signature locally
      const signatureData = {
        subWalletAddress,
        signerAddress: mainWalletAddress,
        signature,
        message,
        timestamp: new Date().toISOString()
      };

      // Save to local storage for persistence
      const existingSignatures = JSON.parse(localStorage.getItem('contractSignatures') || '[]');
      existingSignatures.push(signatureData);
      localStorage.setItem('contractSignatures', JSON.stringify(existingSignatures));

      // For now, assume contract is fully signed after one signature
      // In a real implementation, this would check all required signatures
      return {
        isFullySigned: true,
        fundsLocked: true
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Deactivate a sub-wallet
   */
  deactivateSubWallet(subWalletAddress: string): void {
    const subWallet = this.subWallets.get(subWalletAddress);
    if (subWallet) {
      this.subWallets.delete(subWalletAddress);
      this.saveSubWalletsToStorage();
    }
  }
}

export const subWalletManager = new SubWalletManager();