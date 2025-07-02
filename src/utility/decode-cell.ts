import { Cell } from '@ton/core';

/**
 * Decodes a cell to extract a string.
 * @param cell - The cell to decode.
 * @returns The decoded string.
 */
export function decodeCell(cell: Cell): string {
    // Assuming the cell contains a string, you can decode it like this:
    const slice = cell.beginParse();
    return slice.loadStringTail();
} 