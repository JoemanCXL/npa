export interface NeptunesPrideData {
  sendAllTech: (recipient: number) => void;
  sendTech: (recipient: number, tech: string) => void;
  sendCash: (recipient: number, price: number) => void;
  gameVersion: string;
  version: any;
  inbox: any;
  universe: any;
  gameNumber: any;
  gameId?: any;
  np: any;
  npui: any;
  originalPlayer: any;
  account: any;
  crux: any;
}

export interface CruxLib {
  touchEnabled: boolean;
  crux: any;
  format: any;
  formatTime: any;
  templates: { [k: string]: string };
  tickCallbacks: any[];
}

declare global {
  var jQuery: any;
  var NeptunesPride: NeptunesPrideData;
  var Crux: CruxLib;
  interface String {
    format(...args: any[]): string;
  }
}
