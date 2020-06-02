import abiOptionsToken from "./abi/OptionsToken.json";
import abiCompoundOracle from "./abi/CompoundOracle.json";
import abiMatchMakingTrading from "./abi/MatchMakingTrading.json";
import abiOptionsManger from "./abi/OptionsManger.json";
import abiOptionsFormulas from './abi/OptionsFormulas.json';
import abiErc20 from './abi/Erc20.json';
import { smartContractAddress, networkId, nodeUrl, decimals } from '../conf/config';
import Web3 from 'web3';

let matchMakingTradingSCAddress = smartContractAddress;

let web3;

if (nodeUrl.indexOf('ws') === 0) {
  web3 = new Web3(new Web3.providers.WebsocketProvider(nodeUrl));
} else {
  web3 = new Web3(new Web3.providers.HttpProvider(nodeUrl));
}

let mmtSC = new web3.eth.Contract(abiMatchMakingTrading, matchMakingTradingSCAddress);

export const getOptionsInfo = async () => {
  let info = {};
  info.blockNumber = await web3.eth.getBlockNumber();
  info.optionsManagerAddress = await mmtSC.methods.getOptionsManagerAddress().call();
  info.oracleAddress = await mmtSC.methods.getOracleAddress().call();
  let optionMangerSC = new web3.eth.Contract(abiOptionsManger, info.optionsManagerAddress);
  info.formulasAddress = await optionMangerSC.methods.getFormulasAddress().call();
  let formulasSC = new web3.eth.Contract(abiOptionsFormulas, info.formulasAddress);
  let oracleSC = new web3.eth.Contract(abiCompoundOracle, info.oracleAddress);
  info.optionTokenList = await optionMangerSC.methods.getOptionsTokenList().call();
  info.optionTokenInfo = [];

  for (let i=0; i<info.optionTokenList.length; i++) {
    let token = info.optionTokenList[i];
    let eligible = await mmtSC.methods.isEligibleOptionsToken(token).call();
    if (!eligible) {
      console.log('token not eligible:', token, eligible);
      continue;
    }

    let ret = await optionMangerSC.methods.getOptionsTokenInfo(token).call();
    if (ret[5] === false) {
      let subInfo = {
        type: ret[0] === '0' ? "call" : "put",
        collateralToken: ret[1],//settlementsCurrency
        collateralTokenType: ret[1] === "0x0000000000000000000000000000000000000000" ? 'WAN' : 'FNX',
        underlyingAssets: ret[2] === '1' ? 'BTC' : 'ETH', // 1: BTC, 2: ETH
        strikePrice: '$' + (Number(ret[3]) / decimals).toFixed(4),
        expiration: (new Date(ret[4] * 1000)).toDateString().split(' ').slice(1, 3).join(' '),
        key: i,
      };
      subInfo.tokenName = [subInfo.underlyingAssets, subInfo.type, subInfo.expiration, subInfo.strikePrice].join(', ');
      subInfo.sellOrderList = [];
      subInfo.payOrderList = [];

      subInfo.sellOrderList = await mmtSC.methods.getSellOrderList(token, subInfo.collateralToken).call();
      subInfo.payOrderList = await mmtSC.methods.getPayOrderList(token, subInfo.collateralToken).call();
      subInfo.liquidity = subInfo.sellOrderList[2].length > 0 ? eval(subInfo.sellOrderList[2].join('+')) : 0;
      let price = await oracleSC.methods.getBuyOptionsPrice(token).call();
      subInfo.price = '$' + (Number(price) / decimals).toFixed(4);
      let underlyingPrice = await oracleSC.methods.getUnderlyingPrice(token).call();
      subInfo.underlyingAssetsPrice = '$' + (Number(underlyingPrice) / decimals).toFixed(4);
      let writers = await optionMangerSC.methods.getOptionsTokenWriterList(token).call();
      subInfo.writers = writers;
      let collateralTokenPrice = await oracleSC.methods.getPrice(subInfo.collateralToken).call();
      let minColPrice;
      if (subInfo.type === 'call') {
        minColPrice = await formulasSC.methods.callCollateralPrice(ret[3], underlyingPrice).call();
      } else {
        minColPrice = await formulasSC.methods.putCollateralPrice(ret[3], underlyingPrice).call();
      }
      let totalCollateral = writers[1].length > 0 ? eval(writers[1].join('+')) : 0;
      let collateralPercent = (Number(totalCollateral) * (collateralTokenPrice)) / (Number(minColPrice) * subInfo.liquidity);
      subInfo.percentageOfCollateral = (collateralPercent * 100).toFixed(1) + '%';
      subInfo.minColPrice = minColPrice;
      subInfo.totalCollateral = totalCollateral;
      subInfo.collateralTokenPrice = collateralTokenPrice/10000;

      info.optionTokenInfo.push(subInfo);
    }
  }

  info.transactionFee = await optionMangerSC.methods.getTransactionFee().call();
  info.transactionFee = eval(`${info.transactionFee[0]}e${info.transactionFee[1]}`);
  info.tradingEnd = await mmtSC.methods.getTradingEnd().call();

  return info;
}

export const getBalance = async (token, address) => {
  let balance = 0;
  if (token === '0x0000000000000000000000000000000000000000') {
    balance = await web3.eth.getBalance(address);
  } else {
    let token = new web3.eth.Contract(abiErc20, token);
    balance = await token.methods.balanceOf(address).call();
  }

  return web3.utils.fromWei(balance);
}