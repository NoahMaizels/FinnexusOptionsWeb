const mainnetSCAddr = '';//mainnet
const testnetSCAddr = '0x68C42c16933DD2865e669b90C65d0D3d74D46177';//testnet 


// change networkId to switch network
export const networkId = 3; //1:mainnet, 3:testnet;

export const smartContractAddress = networkId == 1 ? mainnetSCAddr : testnetSCAddr;

export const decimals = 1e8; // Price from oracle div decimals

export const fnxTokenAddress = "0xdF228001e053641FAd2BD84986413Af3BeD03E0B";
export const wanTokenAddress = "0x0000000000000000000000000000000000000000";