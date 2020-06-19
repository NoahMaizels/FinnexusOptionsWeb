const mainnetSCAddr = '';//mainnet
const testnetSCAddr = '0xc31e9f2024183B693dfcB16991B964b8Ec041B54';//testnet 

// change networkId to switch network
export const networkId = 3; //1:mainnet, 3:testnet;

export const smartContractAddress = networkId == 1 ? mainnetSCAddr : testnetSCAddr;

export const decimals = 10000; // Price from oracle div decimals