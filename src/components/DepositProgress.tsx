import React from 'react';

interface DepositProgressProps {
    status: 'pending' | 'processing' | 'completed' | 'failed';
    amount: number;
    timestamp: string;
    txHash?: string;
}

export const DepositProgress: React.FC<DepositProgressProps> = ({
    status,
    amount,
    timestamp,
    txHash
}) => {
    const getStatusColor = () => {
        switch (status) {
            case 'pending': return 'bg-yellow-500';
            case 'processing': return 'bg-blue-500';
            case 'completed': return 'bg-green-500';
            case 'failed': return 'bg-red-500';
            default: return 'bg-gray-500';
        }
    };

    return (
        <div className="bg-white/5 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${getStatusColor()} animate-pulse`} />
                    <span className="text-sm font-medium text-white">
                        {amount.toFixed(2)} TON Deposit
                    </span>
                </div>
                <span className="text-xs text-white/60">
                    {new Date(timestamp).toLocaleString()}
                </span>
            </div>
            
            <div className="space-y-2">
                <div className="flex justify-between text-xs">
                    <span className="text-white/60">Status</span>
                    <span className="text-white capitalize">{status}</span>
                </div>
                {txHash && (
                    <div className="flex justify-between text-xs">
                        <span className="text-white/60">Transaction</span>
                        <a 
                            href={`https://tonscan.org/tx/${txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300"
                        >
                            View on Explorer
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
}; 