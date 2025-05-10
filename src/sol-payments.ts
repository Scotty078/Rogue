import { PhantomWallet } from './phantom-wallet';
import { VoucherType } from './system/voucher';
import { globalScene } from './global-scene';
import { PokeballType } from './enums/pokeball';

// SOL prices in lamports (1 SOL = 1,000,000,000 lamports)
const VOUCHER_PRICES = {
  [VoucherType.REGULAR]: 0.05 * 1e9, // 0.1 SOL
  [VoucherType.PLUS]: 0.3 * 1e9,   // 0.25 SOL
  [VoucherType.PREMIUM]: 0.5 * 1e9,  // 0.5 SOL
  [VoucherType.GOLDEN]: 1 * 1e9,     // 1 SOL
};

const POKEBALL_PRICES = {
  [PokeballType.POKEBALL]: 0.05 * 1e9,    // 0.05 SOL
  [PokeballType.GREAT_BALL]: 0.1 * 1e9,   // 0.1 SOL
  [PokeballType.ULTRA_BALL]: 0.2 * 1e9,   // 0.2 SOL
  [PokeballType.ROGUE_BALL]: 0.3 * 1e9,   // 0.3 SOL
  [PokeballType.MASTER_BALL]: 1 * 1e9,    // 1 SOL
  [PokeballType.LUXURY_BALL]: 0.15 * 1e9  // 0.15 SOL
};

// Your wallet address to receive payments
const MERCHANT_WALLET = 'By1JSdLiY78qqezMCJYsZAXTtZ8NXQ9DCuv9mDeTRUS2';

export class SolPayments {
  private static instance: SolPayments;
  private wallet: PhantomWallet;

  private constructor() {
    this.wallet = PhantomWallet.getInstance();
  }

  public static getInstance(): SolPayments {
    if (!SolPayments.instance) {
      SolPayments.instance = new SolPayments();
    }
    return SolPayments.instance;
  }

  public async purchaseVoucher(voucherType: VoucherType): Promise<boolean> {
    if (!this.wallet.isConnected()) {
      throw new Error('Please connect your wallet first');
    }

    try {
      const price = VOUCHER_PRICES[voucherType];
      console.log(`Attempting to purchase voucher type ${voucherType} for ${price / 1e9} SOL`);
      
      const signature = await this.wallet.sendSol(MERCHANT_WALLET, price / 1e9);
      console.log('Transaction signature:', signature);
      
      if (signature) {
        // Add voucher to user's account
        globalScene.gameData.voucherCounts[voucherType] = (globalScene.gameData.voucherCounts[voucherType] || 0) + 1;
        await globalScene.gameData.saveSystem();
        console.log('Voucher purchased successfully');
        return true;
      }
      throw new Error('Transaction signature not received');
    } catch (error) {
      console.error('Failed to purchase voucher:', error);
      // Rethrow the original error message if available
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to purchase voucher. Please try again.');
    }
  }

  public async purchasePokeballs(pokeballType: PokeballType, count: number): Promise<boolean> {
    if (!this.wallet.isConnected()) {
      throw new Error('Please connect your wallet first');
    }

    try {
      const price = POKEBALL_PRICES[pokeballType] * count;
      const signature = await this.wallet.sendSol(MERCHANT_WALLET, price / 1e9);
      
      if (signature) {
        // Add pokeballs to user's inventory
        globalScene.pokeballCounts[pokeballType] += count;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to purchase pokeballs:', error);
      throw new Error('Failed to purchase pokeballs. Please try again.');
    }
  }

  public getVoucherPrice(voucherType: VoucherType): number {
    return VOUCHER_PRICES[voucherType] / 1e9;
  }

  public getPokeballPrice(pokeballType: PokeballType): number {
    return POKEBALL_PRICES[pokeballType] / 1e9;
  }

  public isWalletConnected(): boolean {
    return this.wallet.isConnected();
  }
} 