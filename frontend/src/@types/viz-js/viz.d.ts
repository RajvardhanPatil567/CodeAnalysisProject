declare module '@viz-js/viz' {
  export interface VizOptions {
    workerURL?: string;
    worker?: Worker;
    renderer?: 'svg' | 'dot' | 'json' | 'xdot' | 'plain' | 'ps';
    format?: 'svg' | 'dot' | 'json' | 'xdot' | 'plain' | 'ps';
    engine?: 'circo' | 'dot' | 'fdp' | 'neato' | 'osage' | 'patchwork' | 'twopi';
    scale?: number;
    yInvert?: boolean;
    useWorker?: boolean;
    totalMemory?: number;
  }

  export interface RenderOptions {
    format?: 'svg' | 'dot' | 'json' | 'xdot' | 'plain' | 'ps';
    engine?: 'circo' | 'dot' | 'fdp' | 'neato' | 'osage' | 'patchwork' | 'twopi';
    scale?: number;
    yInvert?: boolean;
  }

  export default class Viz {
    constructor(options?: VizOptions);
    
    renderSVGElement(dot: string, options?: RenderOptions): Promise<SVGSVGElement>;
    renderImageElement(dot: string, options?: RenderOptions): Promise<HTMLImageElement>;
    renderString(dot: string, options?: RenderOptions): Promise<string>;
    
    dispose(): void;
    
    static instance(options?: VizOptions): Promise<Viz>;
  }
}
