import { Buffer } from 'buffer';
import process from 'process';

// Polyfill Buffer and process globally
declare global {
    interface Window {
        Buffer: typeof Buffer;
        process: typeof process;
    }
}

if (typeof window !== 'undefined') {
    window.Buffer = window.Buffer || Buffer;
    window.process = window.process || process;
    (window as any).global = window;
}

export {};