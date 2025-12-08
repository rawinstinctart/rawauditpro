declare module "probe-image-size" {
  interface ProbeResult {
    width: number;
    height: number;
    type: string;
    mime: string;
    wUnits: string;
    hUnits: string;
  }

  interface ProbeStream {
    (input: NodeJS.ReadableStream): Promise<ProbeResult>;
    sync(buffer: Buffer): ProbeResult | null;
  }

  const probe: ProbeStream;
  export = probe;
}
