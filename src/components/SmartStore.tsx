import { useState, useEffect } from 'react';
import { useTonConnectUI } from '@tonconnect/ui-react';
import { toNano } from '@ton/core';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../hooks/useAuth';
import { GiFrog, GiBasket, GiTrophy, GiWallet, GiCoins } from 'react-icons/gi';

interface TokenOffering {
  id: number;
  tierName: string;
  description: string;
  totalTokens: number;
  pricePerToken: number;
  minPurchaseAmount: number; // Minimum purchase amount in USD
  maxPurchaseAmount: number; // Maximum purchase amount in USD
  image: string; // Image for the tier/offering
  status: 'active' | 'upcoming' | 'soldOut';
  soldAmount: number; // Amount sold for progress calculation
}

// Add these constants at the top of the file after imports
const MAINNET_DEPOSIT_ADDRESS = 'UQACvk54LPa9hJB1MbuDuipTrX63NB3mGLcn0gebqUc8_joY';
const TESTNET_DEPOSIT_ADDRESS = 'UQACvk54LPa9hJB1MbuDuipTrX63NB3mGLcn0gebqUc8_joY';
const isMainnet = true; // Toggle this for testing
const DEPOSIT_ADDRESS = isMainnet ? MAINNET_DEPOSIT_ADDRESS : TESTNET_DEPOSIT_ADDRESS;

// Add STK price constant
const STK_PRICE_USDT = 0.0025; // 1 STK = $0.0025 USDT

// Update the sendTonTransaction function to use tonConnectUI directly
const sendTonTransaction = async (amount: number, tonConnectUI: any) => {
  try {
    // More detailed validation
    console.log('sendTonTransaction called with amount:', amount, 'type:', typeof amount);
    
    if (typeof amount !== 'number') {
      throw new Error(`Amount must be a number, got: ${typeof amount}`);
    }
    
    if (isNaN(amount)) {
      throw new Error('Amount is NaN');
    }
    
    if (!isFinite(amount)) {
      throw new Error('Amount is not finite');
    }
    
    if (amount <= 0) {
      throw new Error(`Amount must be positive, got: ${amount}`);
    }
    
    // Convert to string with fixed precision to avoid floating point issues
    const amountString = amount.toFixed(9);
    console.log('Amount as string:', amountString);
    
    const amountInNano = toNano(amountString);
    console.log('Amount in nano:', amountInNano.toString());
    
    const transaction = {
      validUntil: Math.floor(Date.now() / 1000) + 60 * 20, // 20 minutes
      messages: [
        {
          address: DEPOSIT_ADDRESS,
          amount: amountInNano.toString(),
        },
      ],
    };

    // Use tonConnectUI directly like in the working example
    const result = await tonConnectUI.sendTransaction(transaction);
    return result;
  } catch (error) {
    console.error('TON transaction failed:', error);
    throw error;
  }
};

// Add this interface for the price data
interface PriceData {
  tonPrice: number;
  usdtPrice: number;
}

// Add this function to fetch TON price
const fetchTonPrice = async (): Promise<PriceData> => {
  try {
    // Using CoinGecko API to get TON price
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=the-open-network&vs_currencies=usd');
    const data = await response.json();
    const tonPrice = data['the-open-network'].usd;
    
    // Get USDT price (usually 1, but we'll fetch it anyway)
    const usdtResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=usd');
    const usdtData = await usdtResponse.json();
    const usdtPrice = usdtData.tether.usd;

    return { tonPrice, usdtPrice };
  } catch (error) {
    console.error('Error fetching prices:', error);
    // Fallback values in case of API failure
    return { tonPrice: 2.5, usdtPrice: 1 };
  }
};

// Add interface for purchase record
interface PurchaseRecord {
  id: string;
  user_id: string;
  offering_id: number;
  usdt_amount: number;
  ton_amount: number;
  tokens_purchased: number;
  tx_hash?: string;
  status: 'pending' | 'confirmed' | 'failed';
  created_at: string;
}

const SmartStore = () => {
  const [tonConnectUI] = useTonConnectUI();
  const { user, refreshSTKBalance } = useAuth();
  
  const [tokenOfferings] = useState<TokenOffering[]>([
    {
      id: 1,
      tierName: "Private Sale Tier 1",
      description: "First public-facing private sale round with a capped price.",
      totalTokens: 10000000,
      pricePerToken: 0.0025,
      minPurchaseAmount: 25,
      maxPurchaseAmount: 5000,
      image: "/images/private-sale-tier1.jpg", // Placeholder image
      status: "active",
      soldAmount: 0, // Example sold amount
    },
    {
      id: 2,
      tierName: "Private Sale Tier 2",
      description: "Second private sale round, slightly higher price point.",
      totalTokens: 25000000,
      pricePerToken: 0.0055,
      minPurchaseAmount: 100,
      maxPurchaseAmount: 1000,
      image: "/images/private-sale-tier2.jpg", // Placeholder image
      status: "upcoming",
      soldAmount: 0, // Not yet started
    }
  ]);

  // Add new state for purchase modal
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [selectedOffering, setSelectedOffering] = useState<TokenOffering | null>(null);
  const [purchaseAmount, setPurchaseAmount] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Add snackbar state
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarDescription, setSnackbarDescription] = useState('');

  // Add new state for price data
  const [priceData, setPriceData] = useState<PriceData>({ tonPrice: 2.5, usdtPrice: 1 });
  const [isLoadingPrice, setIsLoadingPrice] = useState(true);

  // Add new state for wallet connection modal
  const [showWalletModal, setShowWalletModal] = useState(false);

  // Add state for purchase history
  const [purchaseHistory, setPurchaseHistory] = useState<PurchaseRecord[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [isHistoryVisible, setIsHistoryVisible] = useState(false);

  // Function to refresh purchase history
  const refreshPurchaseHistory = async () => {
    if (!tonConnectUI.connected || !tonConnectUI.account?.address) {
      setPurchaseHistory([]);
      return;
    }

    setIsHistoryLoading(true);
    try {
      const { data, error } = await supabase
        .from('token_purchases')
        .select('*')
        .eq('user_id', tonConnectUI.account.address)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to fetch purchase history:', error);
        setPurchaseHistory([]);
      } else {
        setPurchaseHistory(data || []);
      }
    } catch (error) {
      console.error('Error fetching purchase history:', error);
      setPurchaseHistory([]);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  // Add useEffect to fetch purchase history
  useEffect(() => {
    refreshPurchaseHistory();
  }, [tonConnectUI.connected, tonConnectUI.account?.address]);

  // Add useEffect to fetch price data
  useEffect(() => {
    const loadPrices = async () => {
      setIsLoadingPrice(true);
      try {
        const prices = await fetchTonPrice();
        setPriceData(prices);
      } catch (error) {
        console.error('Failed to load prices:', error);
      } finally {
        setIsLoadingPrice(false);
      }
    };

    loadPrices();
    // Refresh prices every 5 minutes
    const interval = setInterval(loadPrices, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Helper function to show snackbar
  const showSnackbar = (message: string, description: string) => {
    setSnackbarMessage(message);
    setSnackbarDescription(description);
    setSnackbarVisible(true);
  };

  // Update the refreshUserBalance function to use the auth hook
  const refreshUserBalance = async () => {
    if (!tonConnectUI.connected || !tonConnectUI.account?.address) return;

    try {
      // Update the user's wallet address if it's not set
      if (user && user.wallet_address !== tonConnectUI.account.address) {
        await supabase
          .from('users')
          .update({ wallet_address: tonConnectUI.account.address })
          .eq('telegram_id', user.telegram_id);
      }

      // Refresh STK balance using the auth hook
      await refreshSTKBalance();
    } catch (error) {
      console.error('Error refreshing balance:', error);
    }
  };

  // Modify handlePurchase to check wallet connection first
  const handlePurchase = (offeringId: number) => {
    if (!tonConnectUI.connected) {
      setShowWalletModal(true);
      return;
    }

    const offering = tokenOfferings.find(o => o.id === offeringId);
    if (offering) {
      setSelectedOffering(offering);
      setIsPurchaseModalOpen(true);
    }
  };

  const handlePurchaseSubmit = async () => {
    if (!selectedOffering || !purchaseAmount) return;
    
    const amount = parseFloat(purchaseAmount);
    console.log('=== Starting Purchase Process ===');
    console.log('Parsed amount:', amount, 'type:', typeof amount);
    console.log('Selected offering:', selectedOffering);
    console.log('Current user:', user);
    
    if (isNaN(amount)) {
      showSnackbar('Invalid Amount', 'Please enter a valid number');
      return;
    }

    // Validate purchase amount
    if (amount < selectedOffering.minPurchaseAmount || amount > selectedOffering.maxPurchaseAmount) {
      showSnackbar(
        'Invalid Amount',
        `Purchase amount must be between ${selectedOffering.minPurchaseAmount} and ${selectedOffering.maxPurchaseAmount} USDT`
      );
      return;
    }

    setIsProcessing(true);
    let purchaseId: string | null = null;
    
    try {
      // Check if wallet is connected
      if (!tonConnectUI.connected) {
        showSnackbar(
          'Wallet Not Connected',
          'Please connect your wallet first'
        );
        return;
      }

      // Get user info
      const userWalletAddress = tonConnectUI.account?.address;
      if (!userWalletAddress) {
        showSnackbar('User Error', 'Unable to get user information');
        return;
      }

      console.log('User wallet address:', userWalletAddress);

      // Validate price data
      console.log('Price data:', priceData);
      
      if (!priceData.tonPrice || !priceData.usdtPrice || priceData.tonPrice <= 0 || priceData.usdtPrice <= 0) {
        showSnackbar(
          'Price Data Error',
          'Unable to fetch current prices. Please try again.'
        );
        return;
      }

      // Calculate TON amount using real rates
      const tonAmount = (amount * priceData.usdtPrice) / priceData.tonPrice;
      const tokensPurchased = amount / selectedOffering.pricePerToken;
      
      console.log('Purchase calculation:', {
        usdtAmount: amount,
        usdtPrice: priceData.usdtPrice,
        tonPrice: priceData.tonPrice,
        calculatedTonAmount: tonAmount,
        tokensPurchased: tokensPurchased
      });
      
      // Validate TON amount
      if (isNaN(tonAmount) || !isFinite(tonAmount) || tonAmount <= 0) {
        showSnackbar(
          'Calculation Error',
          `Unable to calculate TON amount. Result: ${tonAmount}`
        );
        return;
      }
      
      if (tonAmount < 0.1) {
        showSnackbar(
          'Invalid Amount',
          'Minimum purchase amount is too low'
        );
        return;
      }

      // Generate unique purchase ID
      purchaseId = `purchase_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create pending purchase record
      const purchaseRecord: PurchaseRecord = {
        id: purchaseId,
        user_id: userWalletAddress,
        offering_id: selectedOffering.id,
        usdt_amount: amount,
        ton_amount: tonAmount,
        tokens_purchased: tokensPurchased,
        status: 'pending',
        created_at: new Date().toISOString()
      };

      console.log('Creating purchase record:', purchaseRecord);

      // Insert pending purchase into database
      const { error: insertError } = await supabase
        .from('token_purchases')
        .insert([purchaseRecord]);

      if (insertError) {
        console.error('Failed to create purchase record:', insertError);
        showSnackbar('Database Error', 'Failed to create purchase record');
        return;
      }
      
      console.log('Purchase record created successfully');
      
      // Send TON transaction
      console.log('Sending TON transaction...');
      const result = await sendTonTransaction(tonAmount, tonConnectUI);

      if (result) {
        console.log('TON transaction successful:', result);
        
        // Update purchase record with transaction hash and status
        const { error: updateError } = await supabase
          .from('token_purchases')
          .update({ 
            status: 'confirmed',
            tx_hash: result.boc || result.hash
          })
          .eq('id', purchaseId);

        if (updateError) {
          console.error('Failed to update purchase record:', updateError);
        }

        console.log('Processing token allocation...');
        // Process the token allocation
        await processTokenAllocation(userWalletAddress, tokensPurchased, selectedOffering.id);

        console.log('Refreshing user balance...');
        // Refresh the balance from the DB to get the confirmed new value
        await refreshUserBalance();

        console.log('Refreshing purchase history...');
        // Refresh purchase history
        await refreshPurchaseHistory();

        showSnackbar(
          'Purchase Successful!',
          `Successfully purchased ${tokensPurchased.toFixed(2)} tokens for ${tonAmount.toFixed(4)} TON`
        );
        
        setIsPurchaseModalOpen(false);
        setPurchaseAmount('');
        console.log('=== Purchase Process Completed Successfully ===');
      }
    } catch (error) {
      console.error('Purchase failed:', error);
      
      // Update purchase record as failed if we have a purchase ID
      if (purchaseId) {
        await supabase
          .from('token_purchases')
          .update({ status: 'failed' })
          .eq('id', purchaseId);
      }
      
      showSnackbar(
        'Purchase Failed',
        error instanceof Error ? error.message : 'Please try again later'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Update the processTokenAllocation function to use the authenticated user
  const processTokenAllocation = async (userId: string, tokenAmount: number, offeringId: number) => {
    try {
      console.log('Starting token allocation process...');
      console.log('User ID (wallet address):', userId);
      console.log('Token amount to allocate:', tokenAmount);
      console.log('Offering ID:', offeringId);
      console.log('Current auth user:', user);

      // Use the authenticated user from the auth hook
      if (!user || !user.id) {
        console.error('No authenticated user found');
        return;
      }

      console.log('Current user data:', user);
      console.log('Current STK balance:', user.total_sbt);

      // Update user's STK token balance
      const currentSTK = user.total_sbt || 0;
      const newSTKBalance = currentSTK + tokenAmount;

      console.log('New STK balance will be:', newSTKBalance);

      // Update the user's wallet address if it's different
      if (user.wallet_address !== userId) {
        const { error: walletUpdateError } = await supabase
          .from('users')
          .update({ wallet_address: userId })
          .eq('id', user.id);

        if (walletUpdateError) {
          console.error('Failed to update wallet address:', walletUpdateError);
        }
      }

      // Update the STK balance
      const { error: balanceError } = await supabase
        .from('users')
        .update({ 
          total_sbt: newSTKBalance,
          last_sbt_claim: new Date().toISOString()
        })
        .eq('id', user.id);

      if (balanceError) {
        console.error('Failed to update user STK balance:', balanceError);
        return;
      }

      console.log('Successfully updated STK balance in database');

      // Log the STK earning in earning_history
      const { error: logError } = await supabase
        .from('earning_history')
        .insert({
          user_id: user.id,
          amount: tokenAmount,
          type: 'token_purchase',
          created_at: new Date().toISOString()
        });

      if (logError) {
        console.error('Failed to log STK earning:', logError);
      }

      // Log in SBT history (since we're using total_sbt for STK)
      const { error: sbtError } = await supabase
        .from('sbt_history')
        .insert({
          user_id: user.id,
          amount: tokenAmount,
          type: 'token_purchase',
          timestamp: new Date().toISOString()
        });

      if (sbtError) {
        console.error('Failed to log SBT history:', sbtError);
      }

      // Update offering sold amount (if token_offerings table exists)
      try {
        const { error: offeringError } = await supabase
          .from('token_offerings')
          .update({ 
            sold_amount: tokenAmount 
          })
          .eq('id', offeringId);

        if (offeringError) {
          console.error('Failed to update offering:', offeringError);
        }
      } catch (error) {
        console.log('token_offerings table might not exist, skipping update');
      }

      console.log(`Successfully allocated ${tokenAmount} STK tokens to user ${user.id}`);

      // Refresh the auth user data to reflect the new balance
      console.log('Refreshing auth user data...');
      await refreshSTKBalance();
      
      // Verify the update by fetching the user data again
      const { data: verifyUser, error: verifyError } = await supabase
        .from('users')
        .select('total_sbt')
        .eq('id', user.id)
        .single();

      if (verifyError) {
        console.error('Failed to verify STK balance update:', verifyError);
      } else {
        console.log('Verified STK balance after update:', verifyUser.total_sbt);
      }

    } catch (error) {
      console.error('Token allocation failed:', error);
    }
  };

  // Add useEffect to update wallet address when connected
  useEffect(() => {
    const updateWalletAddress = async () => {
      if (tonConnectUI.connected && tonConnectUI.account?.address && user) {
        try {
          // Only update if the wallet address is different
          if (user.wallet_address !== tonConnectUI.account.address) {
            console.log('Updating wallet address in database...');
            const { error } = await supabase
              .from('users')
              .update({ wallet_address: tonConnectUI.account.address })
              .eq('telegram_id', user.telegram_id);

            if (error) {
              console.error('Failed to update wallet address:', error);
            } else {
              console.log('Wallet address updated successfully');
              // Refresh user data to get the updated wallet address
              await refreshSTKBalance();
            }
          }
        } catch (error) {
          console.error('Error updating wallet address:', error);
        }
      }
    };

    updateWalletAddress();
  }, [tonConnectUI.connected, tonConnectUI.account?.address, user?.telegram_id, user?.wallet_address]);

  // Add wallet connection modal
  const renderWalletModal = () => {
    if (!showWalletModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-gradient-to-br from-green-100 to-green-50 rounded-3xl p-8 max-w-md w-full shadow-2xl border-4 border-green-300 relative">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-green-800 font-comic mb-4">Connect Your Wallet</h2>
            <p className="text-green-700 mb-6">Please connect your TON wallet to purchase tokens</p>
            
            <button
              onClick={() => {
                tonConnectUI.connectWallet();
                setShowWalletModal(false);
              }}
              className="w-full py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg text-lg font-medium mb-4"
            >
              Connect Wallet
            </button>
            
            <button
              onClick={() => setShowWalletModal(false)}
              className="w-full py-3 text-green-700 hover:text-green-800 border-2 border-green-300 rounded-xl hover:bg-green-50 transition-colors text-base font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Update the purchase modal to show STK value
  const renderPurchaseModal = () => {
    if (!isPurchaseModalOpen || !selectedOffering) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-gradient-to-br from-green-100 to-green-50 rounded-2xl p-6 max-w-sm w-full shadow-2xl border-2 border-green-300 relative">
          <div className="relative">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-green-800">Purchase Tokens</h2>
              <button 
                onClick={() => setIsPurchaseModalOpen(false)}
                className="text-green-600 hover:text-green-800 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="bg-white rounded-xl p-4 mb-4 border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-green-700 text-sm">Tier</span>
                <span className="text-green-800 font-bold">{selectedOffering.tierName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-green-700 text-sm">Price per token</span>
                <span className="text-green-600 font-bold">${selectedOffering.pricePerToken.toFixed(4)}</span>
              </div>
            </div>
            
            <div className="mb-4">
              {!tonConnectUI.connected ? (
                <div className="text-center">
                  <p className="text-green-800 mb-3 text-sm">Connect your wallet to purchase tokens</p>
                  {renderWalletModal()}
                </div>
              ) : (
                <>
                  <label className="block text-green-800 text-sm font-medium mb-2">
                    Amount (USDT)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={purchaseAmount}
                      onChange={(e) => setPurchaseAmount(e.target.value)}
                      className="w-full p-3 bg-white border border-green-200 rounded-lg text-green-800 placeholder-green-300 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all"
                      placeholder="Enter amount in USDT"
                      min={selectedOffering.minPurchaseAmount}
                      max={selectedOffering.maxPurchaseAmount}
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-600 text-sm">
                      USDT
                    </div>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-green-600">
                      Min: {selectedOffering.minPurchaseAmount} USDT
                    </span>
                    <span className="text-xs text-green-600">
                      Max: {selectedOffering.maxPurchaseAmount} USDT
                    </span>
                  </div>
                </>
              )}
            </div>

            {tonConnectUI.connected && purchaseAmount && (
              <div className="bg-white rounded-xl p-4 mb-4 border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-green-700 text-sm">You will receive</span>
                  <span className="text-green-800 font-bold text-lg">
                    {(parseFloat(purchaseAmount) / selectedOffering.pricePerToken).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })} STK
                  </span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-green-700 text-sm">STK Value</span>
                  <span className="text-green-600 font-bold">
                    ${((parseFloat(purchaseAmount) / selectedOffering.pricePerToken) * STK_PRICE_USDT).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })} USDT
                  </span>
                </div>
                <div className="text-xs text-green-600 space-y-1">
                  <div>1 TON = ${priceData.tonPrice.toFixed(2)}</div>
                  <div>1 STK = ${STK_PRICE_USDT.toFixed(4)}</div>
                  <div className="font-medium text-green-700">
                    Required: {((parseFloat(purchaseAmount) * priceData.usdtPrice) / priceData.tonPrice).toFixed(4)} TON
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setIsPurchaseModalOpen(false)}
                className="flex-1 px-4 py-3 text-green-700 hover:text-green-800 border border-green-300 rounded-lg hover:bg-green-50 transition-colors text-sm font-medium"
                disabled={isProcessing}
              >
                Cancel
              </button>
              {tonConnectUI.connected && (
                <button
                  onClick={handlePurchaseSubmit}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98] text-sm font-medium shadow-lg"
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Processing...
                    </div>
                  ) : (
                    'Confirm Purchase'
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Loading state - Similar to FrogsMiner
  if (isLoadingPrice) {
    return (
      <div className="w-full min-h-[80vh] flex items-center justify-center p-custom">
        <div className="flex flex-col items-center space-y-4 max-w-sm w-full">
          {/* Compact Loading Animation */}
          <div className="relative">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 bg-green-500/20 rounded-full blur-lg animate-pulse"></div>
              <div className="relative w-full h-full flex items-center justify-center">
                <GiCoins size={40} className="text-green-600 animate-bounce" />
              </div>
              
              {/* Fewer orbiting particles */}
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1.5 h-1.5 bg-green-400 rounded-full animate-ping"
                  style={{
                    top: '50%',
                    left: '50%',
                    transform: `rotate(${i * 90}deg) translateX(30px)`,
                    animationDelay: `${i * 0.3}s`,
                    animationDuration: '2s'
                  }}
                />
              ))}
            </div>
          </div>

          {/* Loading Message */}
          <div className="text-center space-y-1">
            <div className="text-xs text-green-500 font-medium">LOADING SMART STORE</div>
            <div className="text-xs text-green-700 font-medium">
              🪙 Fetching current prices...
            </div>
            <div className="text-xs text-gray-500 animate-pulse">
              Preparing token offerings...
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-[80vh] flex items-center justify-center p-custom">
      <div className="w-full max-w-4xl space-y-6">
        {/* Enhanced wallet connection status banner - Similar to FrogsMiner */}
        {!tonConnectUI.connected && (
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-6 border-2 border-yellow-300 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 bg-yellow-200 rounded-full flex items-center justify-center">
                <GiWallet size={24} className="text-yellow-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-yellow-800">Connect Your Wallet</h3>
                <p className="text-yellow-600 text-sm">Connect your TON wallet to purchase tokens</p>
              </div>
            </div>
            <div className="flex justify-center">
              <button
                onClick={() => setShowWalletModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 hover:from-blue-500 hover:via-blue-600 hover:to-blue-700 text-white rounded-xl text-lg font-bold transition-all duration-200 transform hover:scale-105 shadow-lg border-2 border-blue-400"
              >
                🔗 Connect Wallet
              </button>
            </div>
          </div>
        )}

        {/* Header Stats - Similar to FrogsMiner stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-2xl p-4 border-2 border-green-300 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm text-green-700 font-bold mb-1">TON Price</h3>
                <p className="text-2xl font-bold text-green-800">
                  ${priceData.tonPrice.toFixed(2)}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center">
                <GiCoins size={24} className="text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-4 border-2 border-purple-300 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm text-purple-700 font-bold mb-1">STK Price</h3>
                <p className="text-2xl font-bold text-purple-800">
                  ${STK_PRICE_USDT.toFixed(4)}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-200 rounded-full flex items-center justify-center">
                <GiTrophy size={24} className="text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced User Token Balance Card - Similar to FrogsMiner */}
        {tonConnectUI.connected && user && (
          <div className="bg-gradient-to-br from-yellow-50 via-orange-50 to-yellow-100 rounded-2xl p-6 border-2 border-yellow-300 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-yellow-800 flex items-center gap-2">
                <GiBasket size={20} className="text-yellow-600" />
                Your STK Balance
              </h3>
              <button
                onClick={refreshUserBalance}
                className="w-8 h-8 bg-yellow-200 rounded-full flex items-center justify-center hover:bg-yellow-300 transition-colors"
              >
                <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
            
            <div className="bg-white/50 rounded-xl p-4 border border-yellow-200">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-yellow-700 font-medium">Available STK</p>
                  <p className="text-2xl font-bold text-yellow-800">
                    {(user.total_sbt || 0).toLocaleString(undefined, { 
                      minimumFractionDigits: 2, 
                      maximumFractionDigits: 2 
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-yellow-700 font-medium">Value in USDT</p>
                  <p className="text-xl font-bold text-yellow-800">
                    ${((user.total_sbt || 0) * STK_PRICE_USDT).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Token Offerings Grid - Similar to Frog Collection in FrogsMiner */}
        <div className="bg-white/50 rounded-2xl p-4 border-2 border-green-200 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-green-800 flex items-center gap-2">
              <GiFrog size={20} className="text-green-600" />
              Token Offerings
            </h3>
            <div className="text-sm text-green-600">
              {tokenOfferings.filter(o => o.status === 'active').length} Active
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {tokenOfferings.map((offering, index) => (
              <div 
                key={offering.id} 
                className={`bg-gradient-to-br ${
                  index % 3 === 0 ? 'from-blue-50 to-green-50' : 
                  index % 3 === 1 ? 'from-green-50 to-blue-50' : 
                  'from-purple-50 to-pink-50'
                } rounded-2xl p-4 border-2 border-green-200 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-green-800">{offering.tierName}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    offering.status === 'active' 
                      ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white' 
                      : offering.status === 'upcoming' 
                      ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-white'
                      : 'bg-gradient-to-r from-red-400 to-orange-400 text-white'
                  }`}>
                    {offering.status === 'active' ? '🐸 Live' : 
                     offering.status === 'upcoming' ? '⏳ Soon' : '🔴 Sold Out'}
                  </span>
                </div>
                
                <p className="text-green-600 text-sm mb-4">{offering.description}</p>
                
                <div className="bg-white/50 rounded-lg p-3 mb-4 border border-green-200">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-green-600 text-sm">Price per token</span>
                      <span className="font-bold text-green-800">${offering.pricePerToken.toFixed(4)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-600 text-sm">Total Supply</span>
                      <span className="font-bold text-green-800">{offering.totalTokens.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-600 text-sm">Min Purchase</span>
                      <span className="font-bold text-green-800">{offering.minPurchaseAmount} USDT</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-600 text-sm">Max Purchase</span>
                      <span className="font-bold text-green-800">{offering.maxPurchaseAmount} USDT</span>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => handlePurchase(offering.id)}
                  className={`w-full px-4 py-3 rounded-xl text-lg font-bold transition-all duration-200 transform hover:scale-105 shadow-lg border-2 ${
                    offering.status === 'active'
                      ? 'bg-gradient-to-r from-green-400 via-green-500 to-green-600 hover:from-green-500 hover:via-green-600 hover:to-green-700 text-white border-green-400'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed border-gray-300'
                  }`}
                  disabled={offering.status !== 'active'}
                >
                  {offering.status === 'active' ? (
                    <div className="flex items-center justify-center gap-2">
                      <span>🐸</span>
                      <span>Purchase Tokens</span>
                      <span>→</span>
                    </div>
                  ) : offering.status === 'upcoming' ? (
                    <div className="flex items-center justify-center gap-2">
                      <span>⏳</span>
                      <span>Coming Soon</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <span>🔴</span>
                      <span>Sold Out</span>
                    </div>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Purchase History Section - Similar to FrogsMiner tabs */}
        {tonConnectUI.connected && (
          <div className="bg-white/50 rounded-2xl p-4 border-2 border-green-200 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-green-800 flex items-center gap-2">
                <GiTrophy size={20} className="text-green-600" />
                Purchase History
              </h3>
              <button
                onClick={() => setIsHistoryVisible(v => !v)}
                className="px-4 py-2 bg-gradient-to-r from-green-400 to-emerald-500 text-white rounded-lg text-sm font-bold transition-all duration-200 transform hover:scale-105 shadow-lg border-2 border-green-400"
              >
                {isHistoryVisible ? 'Hide History' : 'Show History'}
              </button>
            </div>

            {isHistoryVisible && (
              <div className="space-y-3">
                {isHistoryLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
                  </div>
                ) : purchaseHistory.length > 0 ? (
                  <div className="max-h-96 overflow-y-auto space-y-3">
                    {purchaseHistory.map(purchase => (
                      <div key={purchase.id} className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-4 border-2 border-green-200 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-bold text-green-800 text-lg">
                              {purchase.tokens_purchased.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                              })} STK
                            </p>
                            <p className="text-sm text-green-600">
                              ≈ ${(purchase.tokens_purchased * STK_PRICE_USDT).toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                              })} USDT
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(purchase.created_at).toLocaleString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-green-700">
                              {purchase.ton_amount.toLocaleString(undefined, {
                                minimumFractionDigits: 4,
                                maximumFractionDigits: 4
                              })} TON
                            </p>
                            <p className="text-xs text-green-600">
                              ${purchase.usdt_amount.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                              })} USDT
                            </p>
                            <span className={`mt-2 inline-block px-3 py-1 text-xs font-bold rounded-full ${
                              purchase.status === 'confirmed' ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white' :
                              purchase.status === 'failed' ? 'bg-gradient-to-r from-red-400 to-orange-400 text-white' :
                              'bg-gradient-to-r from-yellow-400 to-orange-400 text-white'
                            }`}>
                              {purchase.status.charAt(0).toUpperCase() + purchase.status.slice(1)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border-2 border-gray-200 shadow-lg text-center">
                    <GiTrophy size={48} className="text-gray-400 mx-auto mb-4" />
                    <p className="text-lg text-gray-600">No purchase history yet</p>
                    <p className="text-gray-500 text-sm mt-2">Start your token collection!</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Disconnect Button - Similar to FrogsMiner buttons */}
        {tonConnectUI.connected && (
          <div className="flex justify-center">
            <button
              onClick={() => tonConnectUI.disconnect()}
              className="px-6 py-3 bg-gradient-to-r from-red-400 via-red-500 to-red-600 hover:from-red-500 hover:via-red-600 hover:to-red-700 text-white rounded-xl text-lg font-bold transition-all duration-200 transform hover:scale-105 shadow-lg border-2 border-red-400"
            >
              <div className="flex items-center gap-2">
                <span>🔌</span>
                <span>Disconnect Wallet</span>
              </div>
            </button>
          </div>
        )}

        {/* Enhanced wallet modal */}
        {renderWalletModal()}

        {/* Enhanced purchase modal */}
        {renderPurchaseModal()}

        {/* Enhanced snackbar */}
        {snackbarVisible && (
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-4 rounded-2xl shadow-2xl border-2 border-green-400 animate-bounce max-w-md w-full mx-4">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <div className="font-bold text-lg mb-1">{snackbarMessage}</div>
                <div className="text-green-100 text-sm">{snackbarDescription}</div>
              </div>
              <button
                onClick={() => setSnackbarVisible(false)}
                className="text-white/80 hover:text-white transition-colors p-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartStore;