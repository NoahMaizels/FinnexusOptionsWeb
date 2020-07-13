const mainnetSCAddr = '0xe1e4a74a0232aca5f55a4163dcae8b6546bf0827';//mainnet
const testnetSCAddr = '0x350b0dedc27705f4f8486e071b572e38ac4cf79d';//testnet 


// change networkId to switch network
export const networkId = 1; //1:mainnet, 3:testnet;

export const smartContractAddress = networkId == 1 ? mainnetSCAddr : testnetSCAddr;

export const decimals = 1e8; // Price from oracle div decimals

export const fnxTokenAddress = "0xc6f4465a6a521124c8e3096b62575c157999d361";
export const wanTokenAddress = "0x0000000000000000000000000000000000000000";

export const additionalFee = 0.01;