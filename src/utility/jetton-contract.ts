import { TonApiClient } from "@ton-api/client";
import { Address } from "@ton/core";

const ta = new TonApiClient({
  baseUrl: "https://tonapi.io",
  apiKey: import.meta.env.VITE_TONAPI_KEY || undefined,
});

export interface JettonMetadata {
  address: string;
  name: string;
  symbol: string;
  description?: string;
  decimals: string;
  image?: string;
  balance?: string;
  verified?: boolean;
}

export async function getJettonMetadata(
  jettonMasterAddress: string,
  ownerAddress?: string,
  retries = 3
): Promise<JettonMetadata> {
  let lastError: Error | null = null;
  
  for (let i = 0; i < retries; i++) {
    try {
      const jettonInfo = await ta.jettons.getJettonInfo(
        Address.parse(jettonMasterAddress)
      );
      
      let balance = undefined;
      if (ownerAddress) {
        const balanceInfo = await ta.accounts.getAccountJettonsBalances(
          Address.parse(ownerAddress)
        );
        const jettonBalance = balanceInfo.balances.find(
          j => j.jetton.address.toString() === jettonMasterAddress
        );
        balance = jettonBalance?.balance.toString();
      }
      
      return {
        address: jettonMasterAddress,
        name: jettonInfo.metadata?.name || 'Unknown Jetton',
        symbol: jettonInfo.metadata?.symbol || 'UNKNOWN',
        decimals: (Number(jettonInfo.metadata?.decimals) || 9).toString(),
        description: jettonInfo.metadata?.description || '',
        image: jettonInfo.metadata?.image || '',
        balance,
      };
    } catch (error) {
      console.error('Attempt', i + 1, 'failed:', error);
      lastError = error instanceof Error ? error : new Error(String(error));
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        continue;
      }
    }
  }
  
  throw lastError || new Error('Failed to fetch jetton metadata');
}