declare module 'recharts' {
  import * as React from 'react';

  export interface RechartsFunction {
    (): JSX.Element;
  }

  export interface CartesianGridProps {
    stroke?: string;
    strokeDasharray?: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    horizontal?: boolean | object;
    vertical?: boolean | object;
  }

  export const CartesianGrid: React.ComponentType<CartesianGridProps>;
  export const BarChart: React.ComponentType<any>;
  export const Bar: React.ComponentType<any>;
  export const XAxis: React.ComponentType<any>;
  export const YAxis: React.ComponentType<any>;
  export const Tooltip: React.ComponentType<any>;
  export const Legend: React.ComponentType<any>;
  export const ResponsiveContainer: React.ComponentType<any>;
  export const PieChart: React.ComponentType<any>;
  export const Pie: React.ComponentType<any>;
  export const Cell: React.ComponentType<any>;
}
