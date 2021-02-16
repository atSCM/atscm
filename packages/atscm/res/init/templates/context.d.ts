/* eslint-disable no-var,vars-on-top */

declare global {
  var __INIT__: {
    atviseHost: string;
    atvisePortOpc: number;
    atvisePortHttp: number;
    atviseUser?: string;
    atvisePassword?: string;
  };
}

export {};
