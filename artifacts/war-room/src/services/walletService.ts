import { ethers } from 'ethers';

export interface ConnectedWallet {
  address: string;
  chainId: number;
  balance: string;
  provider: ethers.providers.Web3Provider;
  signer: ethers.Signer;
  walletType: 'metamask' | 'walletconnect' | 'coinbase' | 'ledger';
}

export interface WalletBalance {
  address: string;
  balance: string;
  formattedBalance: string;
  chainId: number;
  chainName: string;
}

// Supported chains
const SUPPORTED_CHAINS: Record<number, { name: string; symbol: string; rpcUrl: string }> = {
  1: { name: 'Ethereum Mainnet', symbol: 'ETH', rpcUrl: 'https://eth.llamarpc.com' },
  56: { name: 'Binance Smart Chain', symbol: 'BNB', rpcUrl: 'https://bsc-dataseed1.binance.org:8545' },
  137: { name: 'Polygon', symbol: 'MATIC', rpcUrl: 'https://polygon-rpc.com' },
  43114: { name: 'Avalanche', symbol: 'AVAX', rpcUrl: 'https://api.avax.network/ext/bc/C/rpc' },
  250: { name: 'Fantom', symbol: 'FTM', rpcUrl: 'https://rpc.ftm.tools' },
  42161: { name: 'Arbitrum', symbol: 'ARB', rpcUrl: 'https://arb1.arbitrum.io/rpc' },
  10: { name: 'Optimism', symbol: 'OP', rpcUrl: 'https://mainnet.optimism.io' },
  8453: { name: 'Base', symbol: 'BASE', rpcUrl: 'https://mainnet.base.org' },
};

class WalletService {
  private connectedWallet: ConnectedWallet | null = null;

  /**
   * Connect MetaMask wallet
   */
  async connectMetaMask(): Promise<ConnectedWallet> {
    if (!window.ethereum) {
      throw new Error('MetaMask not installed. Please install MetaMask extension.');
    }

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const chainId = (await provider.getNetwork()).chainId;
      const balance = await provider.getBalance(accounts[0]);

      this.connectedWallet = {
        address: accounts[0],
        chainId,
        balance: balance.toString(),
        provider,
        signer,
        walletType: 'metamask',
      };

      return this.connectedWallet;
    } catch (error) {
      throw new Error(`Failed to connect MetaMask: ${error}`);
    }
  }

  /**
   * Connect WalletConnect
   */
  async connectWalletConnect(): Promise<ConnectedWallet> {
    try {
      // WalletConnect integration would require additional setup
      // This is a placeholder for the actual implementation
      throw new Error('WalletConnect integration requires additional setup');
    } catch (error) {
      throw new Error(`Failed to connect WalletConnect: ${error}`);
    }
  }

  /**
   * Disconnect wallet
   */
  disconnectWallet(): void {
    this.connectedWallet = null;
  }

  /**
   * Get connected wallet
   */
  getConnectedWallet(): ConnectedWallet | null {
    return this.connectedWallet;
  }

  /**
   * Get wallet balance
   */
  async getWalletBalance(address: string): Promise<WalletBalance> {
    if (!this.connectedWallet) {
      throw new Error('No wallet connected');
    }

    try {
      const balance = await this.connectedWallet.provider.getBalance(address);
      const chainInfo = SUPPORTED_CHAINS[this.connectedWallet.chainId];

      return {
        address,
        balance: balance.toString(),
        formattedBalance: ethers.utils.formatEther(balance),
        chainId: this.connectedWallet.chainId,
        chainName: chainInfo?.name || 'Unknown Chain',
      };
    } catch (error) {
      throw new Error(`Failed to fetch wallet balance: ${error}`);
    }
  }

  /**
   * Get token balance (ERC-20)
   */
  async getTokenBalance(tokenAddress: string, walletAddress: string): Promise<string> {
    if (!this.connectedWallet) {
      throw new Error('No wallet connected');
    }

    try {
      const ERC20_ABI = [
        'function balanceOf(address owner) view returns (uint256)',
        'function decimals() view returns (uint8)',
      ];

      const contract = new ethers.Contract(
        tokenAddress,
        ERC20_ABI,
        this.connectedWallet.provider
      );

      const balance = await contract.balanceOf(walletAddress);
      const decimals = await contract.decimals();

      return ethers.utils.formatUnits(balance, decimals);
    } catch (error) {
      throw new Error(`Failed to fetch token balance: ${error}`);
    }
  }

  /**
   * Send transaction
   */
  async sendTransaction(to: string, amount: string): Promise<string> {
    if (!this.connectedWallet) {
      throw new Error('No wallet connected');
    }

    try {
      const tx = await this.connectedWallet.signer.sendTransaction({
        to,
        value: ethers.utils.parseEther(amount),
      });

      return tx.hash;
    } catch (error) {
      throw new Error(`Failed to send transaction: ${error}`);
    }
  }

  /**
   * Switch network
   */
  async switchNetwork(chainId: number): Promise<void> {
    if (!window.ethereum) {
      throw new Error('MetaMask not installed');
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      });
    } catch (error: any) {
      if (error.code === 4902) {
        // Chain not added, add it
        const chainInfo = SUPPORTED_CHAINS[chainId];
        if (!chainInfo) throw new Error('Unsupported chain');

        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: `0x${chainId.toString(16)}`,
              chainName: chainInfo.name,
              rpcUrls: [chainInfo.rpcUrl],
              nativeCurrency: { name: chainInfo.name, symbol: chainInfo.symbol, decimals: 18 },
            },
          ],
        });
      } else {
        throw error;
      }
    }
  }

  /**
   * Get supported chains
   */
  getSupportedChains() {
    return SUPPORTED_CHAINS;
  }

  /**
   * Sign message
   */
  async signMessage(message: string): Promise<string> {
    if (!this.connectedWallet) {
      throw new Error('No wallet connected');
    }

    try {
      return await this.connectedWallet.signer.signMessage(message);
    } catch (error) {
      throw new Error(`Failed to sign message: ${error}`);
    }
  }
}

export const walletService = new WalletService();
