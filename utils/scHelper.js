import abiOptionsToken from "./abi/OptionsToken.json";
import abiCompoundOracle from "./abi/CompoundOracle.json";
import abiMatchMakingTrading from "./abi/MatchMakingTrading.json";
import abiOptionsManger from "./abi/OptionsManger.json";
import abiOptionsFormulas from './abi/OptionsFormulas.json';
import abiErc20 from './abi/Erc20.json';
import { message } from 'antd';
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

export const getOptionsInfo = async (address) => {
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
  info.assets = [];
  info.history = [];

  for (let i = 0; i < info.optionTokenList.length; i++) {
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
        strikePrice: '$' + priceConvert(ret[3]),
        expiration: (new Date(ret[4] * 1000)).toDateString().split(' ').slice(1, 3).join(' '),
        key: i,
        optionsToken: token,
      };
      subInfo.tokenName = [subInfo.underlyingAssets, subInfo.type, subInfo.expiration, subInfo.strikePrice].join(', ');
      subInfo.sellOrderList = [];
      subInfo.payOrderList = [];

      subInfo.sellOrderList = await mmtSC.methods.getSellOrderList(token, subInfo.collateralToken).call();
      subInfo.payOrderList = await mmtSC.methods.getPayOrderList(token, subInfo.collateralToken).call();
      let liquidity = subInfo.sellOrderList[2].length > 0 ? eval(subInfo.sellOrderList[2].join('+')) : 0;
      subInfo.liquidity = web3.utils.fromWei(liquidity.toString());

      let price = await oracleSC.methods.getBuyOptionsPrice(token).call();
      subInfo.price = '$' + priceConvert(price);

      let underlyingPrice = await oracleSC.methods.getUnderlyingPrice(ret[2]).call();
      subInfo.underlyingAssetsPrice = '$' + priceConvert(underlyingPrice);

      let writers = await optionMangerSC.methods.getOptionsTokenWriterList(token).call();
      subInfo.writers = writers;
      console.log('writers:', writers);

      let collateralTokenPrice = priceConvert(await oracleSC.methods.getPrice(subInfo.collateralToken).call());
      let minColPrice;
      if (subInfo.type === 'call') {
        minColPrice = await formulasSC.methods.callCollateralPrice(ret[3], underlyingPrice).call();
      } else {
        minColPrice = await formulasSC.methods.putCollateralPrice(ret[3], underlyingPrice).call();
      }
      minColPrice = priceConvert(minColPrice);

      let totalCollateral = 0;
      for (let m = 0; m < writers[1].length; m++) {
        totalCollateral += Number(web3.utils.fromWei(writers[1][m]));
      }

      let collateralPercent = (Number(totalCollateral) * (collateralTokenPrice)) / (Number(minColPrice) * subInfo.liquidity);
      subInfo.percentageOfCollateral = (collateralPercent * 100).toFixed(1) + '%';
      subInfo.minColPrice = Number((minColPrice / decimals).toFixed(4));
      subInfo.totalCollateral = totalCollateral;
      subInfo.collateralTokenPrice = collateralTokenPrice;

      if (address && address != null) {
        let tokenBalance = await getBalance(token, address);
        if (tokenBalance > 0) {
          info.assets.push({
            tokenName: subInfo.tokenName,
            underlyingAssetsPrice: subInfo.underlyingAssetsPrice,
            strikePrice: subInfo.strikePrice,
            amount: tokenBalance,
            pricePaid: '$--',
            price: subInfo.price,
            percentageOfCollateral: subInfo.percentageOfCollateral,
            expectedReturn: '$--'
          })
        }

        let events = await mmtSC.getPastEvents('BuyOptionsToken', {
          filter: {from: address, optionsToken: token},
          fromBlock: 0,
          toBlock: info.blockNumber
        });
        console.log('events:', events);
      }

      info.optionTokenInfo.push(subInfo);
    }
  }

  info.transactionFee = await optionMangerSC.methods.getTransactionFee().call();
  info.transactionFee = eval(`${info.transactionFee[0]}e${info.transactionFee[1]}`);
  info.tradingEnd = await mmtSC.methods.getTradingEnd().call();

  return info;
}

function priceConvert(price) {
  return Number((Number(price) / decimals).toFixed(4));
}

export const getBalance = async (tokenAddress, address) => {
  let balance = 0;
  try {
    if (tokenAddress === '0x0000000000000000000000000000000000000000') {
      balance = await web3.eth.getBalance(address);
    } else {
      let token = new web3.eth.Contract(abiErc20, tokenAddress);
      balance = await token.methods.balanceOf(address).call();
    }
  } catch (err) {
    console.log(err);
  }

  return Number(web3.utils.fromWei(balance.toString()));
}

export const approve = async (token, owner, amount, selectedWallet) => {
  if (token === '0x0000000000000000000000000000000000000000') {
    return;
  } else {
    let token = new web3.eth.Contract(abiErc20, token);
    let data = await token.methods.approve(matchMakingTradingSCAddress, web3.utils.toWei(amount)).encodeABI();
    const params = {
      to: token,
      data,
      value: 0,
      gasPrice: "0x3B9ACA00",
      gasLimit: "0x989680", // 10,000,000
    };
    let txID = await sendTransaction(selectedWallet, params);
    console.log('approve tx sent:', txID);
    watchTransactionStatus(txID, (status)=>{
      if(!status) {
        message.error("token approve failed");
      }
    })
  }
}

export const generateBuyOptionsTokenData = async (info) => {
  console.log('generateBuyOptionsTokenData', info);
  let encodedData = await mmtSC.methods.buyOptionsToken(
    info.optionsToken,
    web3.utils.toWei(info.amount.toString()),
    info.collateralToken,
    web3.utils.toWei(info.currencyAmount.toString())
  ).encodeABI();
  return encodedData;
}

export const generateTx = async (data, currencyAmount, address, selectedWallet, info) => {
  const txParam = {
    to: matchMakingTradingSCAddress,
    data,
    value: currencyAmount,
    gasPrice: "0x3B9ACA00",
    // gasLimit: "0x989680", // 10,000,000
  };
  console.log('wallet type:', selectedWallet.type());
  if (selectedWallet.type() === "EXTENSION") {
    txParam.gas = await estimateGas(info, currencyAmount, address);
    if (txParam.gas === -1) {
      return null;
    }
  } else {
    txParam.gasLimit = await estimateGas(info, currencyAmount, address);
    if (txParam.gasLimit === -1) {
      return null;
    }
  }
  
  return txParam;
}

export const estimateGas = async (info, value, address) => {
  try {
    console.log('estimateGas:', info, value, address);
    // let ret = await web3.eth.estimateGas(params, { from: address, value });
    let ret = await mmtSC.methods.buyOptionsToken(
      info.optionsToken,
      web3.utils.toWei(info.amount.toString()),
      info.collateralToken,
      web3.utils.toWei(info.currencyAmount.toString())
    ).estimateGas({ gas: 10000000, value, from: address });

    if (ret == 10000000) {
      return -1;
    }
    console.log('estimateGas:', '0x' + (ret + 30000).toString(16));
    return '0x' + (ret + 30000).toString(16);
  } catch (err) {
    message.error(err.toString());
    return -1;
  }
}

export const sendTransaction = async (selectedWallet, params) => {
  try {
    console.log('sendTransaction:', params);
    let transactionID = await selectedWallet.sendTransaction(params);
    console.log('sendTransaction:', transactionID);
    return transactionID;
  } catch (error) {
    if (error.toString().indexOf('Unlock')!== -1) {
      message.info("Please Unlock Your Wallet");
    } else {
      message.error('sendTransaction Failed');
      console.log('sendTransaction Failed', error.toString());
    }
  }
  return null;
}

export const getTransactionReceipt = async (txID) => {
  try {
    let txReceipt = await web3.eth.getTransactionReceipt(txID);
    return txReceipt;
  } catch (error) {
    message.error(error.toString());
  }
  return null;
}

export const watchTransactionStatus = (txID, callback) => {
  if (!txID) {
    console.log('watchTransactionStatus txID is null');
    return;
  }
  const getTransactionStatus = async () => {
      const txReceipt = await getTransactionReceipt(txID);
      if (!txReceipt) {
          setTimeout(() => getTransactionStatus(txID), 3000);
      } else if (callback) {
          callback(txReceipt.status);
      } else {
          message.info('success');
      }
  };
  setTimeout(() => getTransactionStatus(txID), 3000);
};

export const getWeb3 = () => { return web3; }

export const getAssets = async (address) => {

}