import { create } from 'zustand';

interface SnackbarState {
  message: string;
  description?: string;
  type?: 'success' | 'error';
  isOpen: boolean;
  showSnackbar: (params: { message: string; description?: string; type?: 'success' | 'error' }) => void;
  hideSnackbar: () => void;
}

interface SnackbarParams {
  message: string;
  description?: string;
  type?: 'success' | 'error';
}

export const useSnackbar = create<SnackbarState>((set) => ({
  message: '',
  description: '',
  type: 'success',
  isOpen: false,
  showSnackbar: ({ message, description, type = 'success' }: SnackbarParams) => 
    set({ message, description, type, isOpen: true }),
  hideSnackbar: () => set({ isOpen: false })
})); 