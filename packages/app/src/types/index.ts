export interface PeerMeta {
  name: string;
  url: string;
  icons?: string[];
}

export interface Deployments {
  entryPoint?: string;
  factory: string;
}
