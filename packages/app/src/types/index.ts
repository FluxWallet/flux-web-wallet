import { createContext, useContext } from "react";

export interface PeerMeta {
  name: string;
  url: string;
}

export interface GlobalContent {
  uri: string;
  address: string | undefined;
}

export const dataContext = createContext<GlobalContent>({ uri: "", address: "" });

export const useDataContext = () => useContext(dataContext);

export interface Deployments {
  entryPoint: string;
  factory: string;
}
