import { useEffect, useState } from 'react';
import { dexFactory, Client } from "@ston-fi/sdk";
import { useTonConnectUI, useTonAddress } from '@tonconnect/ui-react';
import { StonApiClient, AssetTag } from '@ston-fi/api';

interface Asset {
  contractAddress: string;
  meta?: {
    symbol?: string;
    displayName?: string;
    decimals?: number;
  };
  kind?: string;
}

interface SimulationResult {
  askAddress: string;
  askJettonWallet: string;
  askUnits: string;
  feeAddress: string;
  feePercent: string;
  feeUnits: string;
  minAskUnits: string;
  offerAddress: string;
  offerJettonWallet: string;
  offerUnits: string;
  routerAddress: string;
  swapRate: string;
}

const DexSwap = () => {
  const [tonConnectUI] = useTonConnectUI();
  const userAddress = useTonAddress();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [fromAsset, setFromAsset] = useState<Asset | null>(null);
  const [toAsset, setToAsset] = useState<Asset | null>(null);
  const [amount, setAmount] = useState('');
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);

  // Single function to handle changes in "From", "To", and "Amount"
  const handleChange = (setter: React.Dispatch<React.SetStateAction<any>>) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.value;
    
    if (setter === setFromAsset || setter === setToAsset) {
      const selectedAsset = assets.find(asset => asset.contractAddress === value);
      setter(selectedAsset);
    } else {
      setter(value);
    }
    
    setSimulationResult(null);
  };

  // Helper to find an asset by address and return a consistent object
  const getAssetInfo = (asset: Asset | null) => {
    if (!asset) return { symbol: 'token', decimals: 10 ** 9 };
    const symbol = asset.meta?.symbol || asset.meta?.displayName || 'token';
    const decimals = 10 ** (asset.meta?.decimals ?? 9);
    return { symbol, decimals };
  };

  // Fetch assets on mount
  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const client = new StonApiClient();
        const condition = [
          AssetTag.LiquidityVeryHigh,
          AssetTag.LiquidityHigh,
          AssetTag.LiquidityMedium,
        ].join(' | ');
        const assetList = await client.queryAssets({ condition });

        setAssets(assetList);
        if (assetList[0]) setFromAsset(assetList[0]);
        if (assetList[1]) setToAsset(assetList[1]);
      } catch (err) {
        console.error('Failed to fetch assets:', err);
      }
    };
    fetchAssets();
  }, []);

  // Simulate swap
  const handleSimulate = async () => {
    if (!fromAsset || !toAsset || !amount) return;
    try {
      const { decimals: fromDecimals } = getAssetInfo(fromAsset);
      const client = new StonApiClient();
      const offerUnits = (Number(amount) * fromDecimals).toString();
      
      const result = await client.simulateSwap({
        offerAddress: fromAsset.contractAddress,
        askAddress: toAsset.contractAddress,
        slippageTolerance: '0.01',
        offerUnits,
      });
      setSimulationResult(result);
    } catch (err) {
      console.error('Simulation failed:', err);
      setSimulationResult(null);
    }
  };

  // Shortcut to display either symbol or 'token'
  const displaySymbol = (asset: Asset | null) => getAssetInfo(asset).symbol;

  const handleSwap = async () => {
    if (!fromAsset || !toAsset || !amount || !userAddress) {
      alert('Please connect wallet and enter swap details.');
      return;
    }

    if(!simulationResult) {
      alert('Please simulate the swap first.');
      return;
    }
  
    try {
      const tonApiClient = new Client({
        endpoint: "https://toncenter.com/api/v2/jsonRPC",
      });
      
      const client = new StonApiClient();
      const routerMetadata = await client.getRouter(simulationResult.routerAddress);
      const dexContracts = dexFactory(routerMetadata);
      const router = tonApiClient.open(
        dexContracts.Router.create(routerMetadata.address)
      );
      
      const sharedTxParams = {
        userWalletAddress: userAddress,
        offerAmount: simulationResult.offerUnits,
        minAskAmount: simulationResult.minAskUnits,
      };
      
      const getSwapParams = () => {
        if (fromAsset.kind === 'Ton') {
          return router.getSwapTonToJettonTxParams({
            ...sharedTxParams,
            proxyTon: dexContracts.pTON.create(routerMetadata.ptonMasterAddress),
            askJettonAddress: simulationResult.askAddress,
          });
        } 
        if (toAsset.kind === 'Ton') {
          return router.getSwapJettonToTonTxParams({
            ...sharedTxParams,
            proxyTon: dexContracts.pTON.create(routerMetadata.ptonMasterAddress),
            offerJettonAddress: simulationResult.offerAddress,
          });
        }
        return router.getSwapJettonToJettonTxParams({
          ...sharedTxParams,
          offerJettonAddress: simulationResult.offerAddress,
          askJettonAddress: simulationResult.askAddress,
        });
      };
      
      const swapParams = await getSwapParams();
      
      await tonConnectUI.sendTransaction({
        validUntil: Date.now() + 5 * 60 * 1000,
        messages: [
          {
            address: swapParams.to.toString(),
            amount: swapParams.value.toString(),
            payload: swapParams.body?.toBoc().toString("base64"),
          }
        ]
      });
    } catch (err) {
      console.error('Swap failed:', err);
      alert('Swap transaction failed. See console for details.');
    }
  };

  // Format output amount
  const formattedOutputAmount = simulationResult
    ? (Number(simulationResult.minAskUnits) / getAssetInfo(toAsset).decimals).toFixed(4)
    : '';

  return (
    <div className="bg-black rounded-xl border border-blue-500/20 p-6 space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white">Swap Tokens</h2>
        <span className="px-2 py-1 text-xs rounded-full bg-blue-500/20 text-blue-400">Powered by STON.fi</span>
      </div>

      {assets.length > 0 ? (
        <div className="space-y-6">
          {/* From */}
          <div className="space-y-2">
            <label className="text-sm text-white/60">From</label>
            <select
              value={fromAsset?.contractAddress || ''}
              onChange={handleChange(setFromAsset)}
              className="w-full p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-white focus:border-blue-500/50 transition-all"
            >
              {assets.map((asset) => (
                <option key={asset.contractAddress} value={asset.contractAddress}>
                  {asset.meta?.symbol || asset.meta?.displayName || 'token'}
                </option>
              ))}
            </select>
          </div>

          {/* To */}
          <div className="space-y-2">
            <label className="text-sm text-white/60">To</label>
            <select
              value={toAsset?.contractAddress || ''}
              onChange={handleChange(setToAsset)}
              className="w-full p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-white focus:border-blue-500/50 transition-all"
            >
              {assets.map((asset) => (
                <option key={asset.contractAddress} value={asset.contractAddress}>
                  {asset.meta?.symbol || asset.meta?.displayName || 'token'}
                </option>
              ))}
            </select>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <label className="text-sm text-white/60">Amount</label>
            <div className="relative">
              <input
                type="number"
                placeholder="0.0"
                value={amount}
                onChange={handleChange(setAmount)}
                className="w-full p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-white focus:border-blue-500/50 transition-all"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60">
                {displaySymbol(fromAsset)}
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleSimulate}
              className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 font-medium py-3 px-4 rounded-lg transition-all"
            >
              Simulate
            </button>
            <button
              onClick={handleSwap}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg transition-all"
            >
              Swap
            </button>
          </div>

          {/* Simulation Result */}
          {simulationResult && (
            <div className="mt-4 p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <div className="text-center">
                <p className="text-sm text-white/60 mb-2">Swap Summary</p>
                <div className="flex items-center justify-center gap-2">
                  <p className="text-white font-medium">
                    {amount} {displaySymbol(fromAsset)}
                  </p>
                  <span className="text-white/40">→</span>
                  <p className="text-white font-medium">
                    {formattedOutputAmount} {displaySymbol(toAsset)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-center py-10">
          <div className="animate-pulse flex gap-2">
            <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
            <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
            <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
          </div>
          <p className="ml-3 text-white/60">Loading assets...</p>
        </div>
      )}
    </div>
  );
};

export default DexSwap; 