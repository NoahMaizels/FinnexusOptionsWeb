const mainnetSCAddr = '';//mainnet
const testnetSCAddr = '0xe69f70652799A82C9CA18aDC79F7b29c2CB837e7';//testnet 


// change networkId to switch network
export const networkId = 3; //1:mainnet, 3:testnet;

export const smartContractAddress = networkId == 1 ? mainnetSCAddr : testnetSCAddr;

export const decimals = 1e8; // Price from oracle div decimals

export const fnxTokenAddress = "0xdf228001e053641fad2bd84986413af3bed03e0b";
export const wanTokenAddress = "0x0000000000000000000000000000000000000000";

export const additionalFee = 0.01;