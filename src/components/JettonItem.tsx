import { JettonBalance } from "@ton-api/client";
import { toDecimals } from "../utility/decimals";

interface JettonItemProps {
  jettonBalance: JettonBalance;
  onSelect: (jetton: JettonBalance) => void;
  isImported?: boolean;
}

export const JettonItem = ({ jettonBalance, onSelect, isImported }: JettonItemProps) => {
  const { jetton, balance, jetton: { decimals } } = jettonBalance;

  const handleClick = () => {
    onSelect(jettonBalance);
  };

  return (
    <div 
      onClick={handleClick}
      className="group flex items-center justify-between p-4 hover:bg-[#1a2235] rounded-lg transition-all duration-200 border-b border-gray-800/30"
    >
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-blue-500/10 to-purple-600/10 flex items-center justify-center flex-shrink-0">
          {jetton.image ? (
            <img 
              src={jetton.image} 
              alt={jetton.name} 
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://via.placeholder.com/40/1e2738/ffffff?text=${jetton.symbol?.[0] || '?'}`
              }}
            />
          ) : (
            <span className="text-base font-bold text-white/90">
              {jetton.symbol?.[0]}
            </span>
          )}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="text-white font-medium">
              {jetton.name}
            </p>
            {isImported && (
              <span className="text-xs px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded-full text-[10px]">
                Imported
              </span>
            )}
          </div>
          <p className="text-gray-400 text-sm">
            {jetton.symbol}
          </p>
        </div>
      </div>
      
      <div className="text-right">
        <p className="text-white font-medium">
          {toDecimals(balance, decimals)}
        </p>
        <p className="text-gray-400 text-sm">
          $0.00
        </p>
      </div>
    </div>
  );
};