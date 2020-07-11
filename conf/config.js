const mainnetSCAddr = '';//mainnet
const testnetSCAddr = '0x5b0e141caa18c190abc20b9fafe596bba5cc8226';//testnet 


// change networkId to switch network
export const networkId = 3; //1:mainnet, 3:testnet;

export const smartContractAddress = networkId == 1 ? mainnetSCAddr : testnetSCAddr;

export const decimals = 1e8; // Price from oracle div decimals

export const fnxTokenAddress = "0xdf228001e053641fad2bd84986413af3bed03e0b";
export const wanTokenAddress = "0x0000000000000000000000000000000000000000";

export const additionalFee = 0.01;