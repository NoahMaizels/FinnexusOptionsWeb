const mainnetSCAddr = '';//mainnet
const testnetSCAddr = '0x5Dc09503D2a6FA372485AB4f357f076A2CA0A788';//testnet 

// change networkId to switch network
export const networkId = 3; //1:mainnet, 3:testnet;

// export const nodeUrl = networkId == 1 ? "wss://api2.wanchain.org:8443/ws/v3/30e9d7131a7fa1557eeeb9ffb18f0a2f66aee81a550ee857343136e5c04b5785" : "wss://apitest.wanchain.org:8443/ws/v3/30e9d7131a7fa1557eeeb9ffb18f0a2f66aee81a550ee857343136e5c04b5785";

export const nodeUrl = networkId == 1 ? "wss://api2.wanchain.org:8443/ws/v3/30e9d7131a7fa1557eeeb9ffb18f0a2f66aee81a550ee857343136e5c04b5785" : "http://localhost:7545";


export const smartContractAddress = networkId == 1 ? mainnetSCAddr : testnetSCAddr;

export const decimals = 10000; // Price from oracle div decimals