const mainnetSCAddr = '';//mainnet
const testnetSCAddr = '0xc31e9f2024183B693dfcB16991B964b8Ec041B54';//testnet 

// change networkId to switch network
export const networkId = 3; //1:mainnet, 3:testnet;

export const nodeUrl = networkId == 1 ? "wss://api2.wanchain.org:8443/ws/v3/30e9d7131a7fa1557eeeb9ffb18f0a2f66aee81a550ee857343136e5c04b5785" : "wss://apitest.wanchain.org:8443/ws/v3/30e9d7131a7fa1557eeeb9ffb18f0a2f66aee81a550ee857343136e5c04b5785";

// export const nodeUrl = networkId == 1 ? "wss://api2.wanchain.org:8443/ws/v3/30e9d7131a7fa1557eeeb9ffb18f0a2f66aee81a550ee857343136e5c04b5785" : "http://192.168.1.2:8545";


export const smartContractAddress = networkId == 1 ? mainnetSCAddr : testnetSCAddr;

export const decimals = 10000; // Price from oracle div decimals