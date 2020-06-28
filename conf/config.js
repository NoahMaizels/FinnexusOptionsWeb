const mainnetSCAddr = '';//mainnet
const testnetSCAddr = '0x37a1BC43253379F22c71FEE657C5310657249474';//testnet 

// change networkId to switch network
export const networkId = 3; //1:mainnet, 3:testnet;

export const smartContractAddress = networkId == 1 ? mainnetSCAddr : testnetSCAddr;

export const decimals = 1e8; // Price from oracle div decimals