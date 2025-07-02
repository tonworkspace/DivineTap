export function toDecimals(value: bigint | number, decimals: number): string {
  const stringValue = value.toString();
  const paddedValue = stringValue.padStart(decimals + 1, '0');
  const integerPart = paddedValue.slice(0, -decimals) || '0';
  const fractionalPart = paddedValue.slice(-decimals);
  return `${integerPart}.${fractionalPart}`;
}

export const formatTonValue = (value: string): string => {
  return (Number(value) / 1e9).toFixed(2);
}; 