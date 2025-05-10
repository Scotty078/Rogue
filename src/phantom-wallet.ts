import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';

export class PhantomWallet {
  private static instance: PhantomWallet;
  private connection: Connection | null = null;
  private wallet: any = null;

  private constructor() {
    // Initialize connection lazily when needed
  }

  public static getInstance(): PhantomWallet {
    if (!PhantomWallet.instance) {
      PhantomWallet.instance = new PhantomWallet();
    }
    return PhantomWallet.instance;
  }

  private initializeConnection() {
    if (!this.connection) {
      // Connect to Solana mainnet using Helius RPC
      this.connection = new Connection('https://mainnet.helius-rpc.com/?api-key=5b27b390-e30b-4968-8b73-f07b2736779c', {
        commitment: 'confirmed',
        confirmTransactionInitialTimeout: 60000 // 60 seconds timeout
      });
    }
    return this.connection;
  }

  public async connect(): Promise<boolean> {
    try {
      if (!window.solana || !window.solana.isPhantom) {
        throw new Error('Phantom wallet is not installed!');
      }

      this.wallet = window.solana;
      await this.wallet.connect();
      this.initializeConnection();
      return true;
    } catch (error) {
      console.error('Failed to connect to Phantom wallet:', error);
      return false;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      if (this.wallet) {
        await this.wallet.disconnect();
      }
    } catch (error) {
      console.error('Failed to disconnect from Phantom wallet:', error);
    }
  }

  public async getBalance(): Promise<number> {
    try {
      if (!this.wallet || !this.connection) {
        throw new Error('Wallet not connected');
      }
      const balance = await this.connection.getBalance(this.wallet.publicKey);
      return balance / LAMPORTS_PER_SOL;
    } catch (error) {
      console.error('Failed to get balance:', error);
      return 0;
    }
  }

  public async sendSol(recipientAddress: string, amount: number): Promise<string> {
    try {
      if (!this.wallet || !this.connection) {
        throw new Error('Wallet not connected');
      }

      // Get the latest blockhash
      const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash();
      
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: this.wallet.publicKey,
          toPubkey: new PublicKey(recipientAddress),
          lamports: amount * LAMPORTS_PER_SOL
        })
      );

      // Set the transaction's blockhash and fee payer
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = this.wallet.publicKey;

      try {
        // Sign and send the transaction using Phantom's built-in method
        const { signature } = await this.wallet.signAndSendTransaction(transaction);
        console.log('Transaction sent:', signature);
        
        // Wait for confirmation with timeout
        const confirmation = await this.connection.confirmTransaction({
          signature,
          blockhash,
          lastValidBlockHeight
        }, 'confirmed');

        if (confirmation.value.err) {
          throw new Error(`Transaction failed: ${confirmation.value.err}`);
        }

        console.log('Transaction confirmed:', signature);
        return signature;
      } catch (txError) {
        console.error('Transaction error:', txError);
        if (txError.message.includes('User rejected')) {
          throw new Error('Transaction was rejected by user');
        }
        throw new Error(`Transaction failed: ${txError.message}`);
      }
    } catch (error) {
      console.error('Failed to send SOL:', error);
      throw error;
    }
  }

  public isConnected(): boolean {
    return this.wallet?.isConnected || false;
  }

  public getPublicKey(): string | null {
    return this.wallet?.publicKey?.toString() || null;
  }
}

// Add Phantom wallet type to window object
declare global {
  interface Window {
    solana?: {
      isPhantom: boolean;
      connect: () => Promise<void>;
      disconnect: () => Promise<void>;
      signAndSendTransaction: (transaction: Transaction) => Promise<string>;
      publicKey: PublicKey;
      isConnected: boolean;
    };
  }
} 