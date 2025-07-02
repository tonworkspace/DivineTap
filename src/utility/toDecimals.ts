/**
 * Converts a raw token amount to its decimal representation
 * @param amount - The raw amount as a BigInt
 * @param decimals - Number of decimal places
 * @returns Formatted string with proper decimal places
 */
export function toDecimals(amount: bigint, decimals: number): string {
    if (decimals === 0) return amount.toString();
    
    const strAmount = amount.toString().padStart(decimals + 1, '0');
    const decimalIndex = strAmount.length - decimals;
    
    // Split the string at decimal point
    const integerPart = strAmount.slice(0, decimalIndex) || '0';
    const fractionalPart = strAmount.slice(decimalIndex);
    
    // Trim trailing zeros after decimal
    const trimmedFractional = fractionalPart.replace(/0+$/, '');
    
    // Return formatted string
    return trimmedFractional 
        ? `${integerPart}.${trimmedFractional}`
        : integerPart;
} 