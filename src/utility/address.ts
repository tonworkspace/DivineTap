export function isValidAddress(address: string): boolean {
  try {
    return address.length === 48 && /^[0-9A-Za-z_-]*$/.test(address);
  } catch {
    return false;
  }
} 