declare module '@viz-js/viz' {
  export default class Viz {
    constructor(params?: { workerURL?: string });
    renderSVGElement(dot: string): Promise<SVGElement>;
    renderImageElement(dot: string): Promise<HTMLImageElement>;
    renderString(dot: string): Promise<string>;
    dispose(): void;
    static instance(params?: { workerURL?: string }): Promise<Viz>;
  }
}
