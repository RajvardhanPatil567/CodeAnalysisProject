declare module 'notistack' {
  import * as React from 'react';
  import { SnackbarProps } from '@mui/material';
  
  export type VariantType = 'default' | 'error' | 'success' | 'warning' | 'info';

  export interface OptionsObject {
    variant?: VariantType;
    autoHideDuration?: number;
    anchorOrigin?: {
      vertical: 'top' | 'bottom';
      horizontal: 'left' | 'center' | 'right';
    };
    preventDuplicate?: boolean;
    [key: string]: any;
  }

  export interface ProviderContext {
    enqueueSnackbar: (message: React.ReactNode, options?: OptionsObject) => string | number;
    closeSnackbar: (key?: string | number) => void;
  }

  export const useSnackbar: () => ProviderContext;
  
  export interface SnackbarProviderProps {
    children?: React.ReactNode;
    maxSnack?: number;
    dense?: boolean;
    hideIconVariant?: boolean;
    preventDuplicate?: boolean;
    autoHideDuration?: number;
    anchorOrigin?: {
      vertical: 'top' | 'bottom';
      horizontal: 'left' | 'center' | 'right';
    };
    iconVariant?: {
      success?: React.ReactNode;
      error?: React.ReactNode;
      warning?: React.ReactNode;
      info?: React.ReactNode;
    };
  }

  export const SnackbarProvider: React.ComponentType<SnackbarProviderProps>;

  export const withSnackbar: <P extends object>(
    Component: React.ComponentType<P & { enqueueSnackbar: ProviderContext['enqueueSnackbar'] }>
  ) => React.ComponentType<P>;

  export const closeSnackbar: (key?: string | number) => void;
}
