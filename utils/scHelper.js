import abiOptionsToken from "./abi/OptionsToken.json";
import abiCompoundOracle from "./abi/CompoundOracle.json";
import abiMatchMakingTrading from "./abi/MatchMakingTrading.json";
import abiOptionsManger from "./abi/OptionsManger.json";
import abiOptionsFormulas from './abi/OptionsFormulas.json';
import abiErc20 from './abi/Erc20.json';
import { message } from 'antd';
import { smartContractAddress, networkId, nodeUrl, decimals } from '../conf/config';
import sleep from 'ko-sleep';

import Web3 from 'web3';

let matchMakingTradingSCAddress = smartContractAddress;

let web3;

if (nodeUrl.indexOf('ws') === 0) {
  web3 = new Web3(new Web3.providers.WebsocketProvider(nodeUrl));
} else {
  web3 = new Web3(new Web3.providers.HttpProvider(nodeUrl));
}

window.debugweb3 = web3;

let mmtSC = new web3.eth.Contract(abiMatchMakingTrading, matchMakingTradingSCAddress);
window.mmtSC = mmtSC;

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

  let funcs = [];

  for (let i = 0; i < info.optionTokenList.length; i++) {
    let func = async () => {
      let token = info.optionTokenList[i];
      let eligible = await mmtSC.methods.isEligibleOptionsToken(token).call();
      if (!eligible) {
        console.log('token not eligible:', token, eligible);
        return;
      }
      console.log('token:', token);
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
        let tmpFuncs = [];
        tmpFuncs.push(mmtSC.methods.getSellOrderList(token, subInfo.collateralToken).call());
        tmpFuncs.push(mmtSC.methods.getPayOrderList(token, subInfo.collateralToken).call());
        tmpFuncs.push(oracleSC.methods.getBuyOptionsPrice(token).call());
        tmpFuncs.push(oracleSC.methods.getSellOptionsPrice(token).call());
        tmpFuncs.push(oracleSC.methods.getUnderlyingPrice(ret[2]).call());
        tmpFuncs.push(optionMangerSC.methods.getOptionsTokenWriterList(token).call());
        tmpFuncs.push(oracleSC.methods.getPrice(subInfo.collateralToken).call());

        let buyPrice, sellPrice, underlyingPrice, writers, collateralTokenPrice;
        [subInfo.sellOrderList, subInfo.payOrderList, buyPrice, sellPrice, underlyingPrice, writers, collateralTokenPrice] = await Promise.all(tmpFuncs);

        let liquidity = subInfo.sellOrderList[2].length > 0 ? eval(subInfo.sellOrderList[2].join('+')) : 0;
        subInfo.liquidity = web3.utils.fromWei(liquidity.toString());

        subInfo.price = '$' + priceConvert(buyPrice);
        subInfo.sellPrice = '$' + priceConvert(sellPrice);

        subInfo.underlyingAssetsPrice = '$' + priceConvert(underlyingPrice);

        subInfo.writers = writers;
        console.log('writers:', writers);

        collateralTokenPrice = priceConvert(collateralTokenPrice);
        let minColPrice;
        if (subInfo.type === 'call') {
          minColPrice = await formulasSC.methods.callCollateralPrice(ret[3], underlyingPrice).call();
        } else {
          minColPrice = await formulasSC.methods.putCollateralPrice(ret[3], underlyingPrice).call();
        }
        minColPrice = priceConvert(minColPrice);

        let totalCollateral = 0;
        let totoMintAmount = 0;

        for (let m = 0; m < writers[1].length; m++) {
          totalCollateral += Number(web3.utils.fromWei(writers[1][m]));
          totoMintAmount += Number(web3.utils.fromWei(writers[2][m]));
        }


        let collateralPercent = (Number(totalCollateral) * (collateralTokenPrice)) / (Number(minColPrice) * totoMintAmount);
        subInfo.percentageOfCollateral = (collateralPercent * 100).toFixed(1) + '%';
        subInfo.minColPrice = Number((minColPrice / decimals).toFixed(4));
        subInfo.totalCollateral = totalCollateral;
        subInfo.collateralTokenPrice = collateralTokenPrice;

        if (address && address != null) {
          tmpFuncs = [];
          tmpFuncs.push(mmtSC.getPastEvents('BuyOptionsToken', {
            filter: { from: address, optionsToken: token },
            fromBlock: 0,
            toBlock: info.blockNumber
          }));
          tmpFuncs.push(mmtSC.getPastEvents('SellOptionsToken', {
            filter: { from: address, optionsToken: token },
            fromBlock: 0,
            toBlock: info.blockNumber
          }));

          let events, sellEvents;
          [events, sellEvents] = await Promise.all(tmpFuncs);
          console.log('events:', events);

          if (events.length > 0) {
            let totalAmount = web3.utils.toBN('0');
            let totalPrice = web3.utils.toBN('0');
            for (let m = 0; m < events.length; m++) {
              totalAmount = totalAmount.add(web3.utils.toBN(events[m].returnValues.amount));
              totalPrice = totalPrice.add(web3.utils.toBN(events[m].returnValues.amount).mul(web3.utils.toBN(events[m].returnValues.optionsPrice)));

              //----history-----
              info.history.push({
                blockNumber: events[m].blockNumber,
                txHash: events[m].transactionHash,
                amount: web3.utils.fromWei(events[m].returnValues.amount),
                optionsPrice: '$' + priceConvert(events[m].returnValues.optionsPrice),
                type: 'buy',
              });
            }

            let tokenBalance = await getBalance(token, address);
            if (tokenBalance > 0) {
              info.assets.push({
                tokenName: subInfo.tokenName,
                underlyingAssetsPrice: subInfo.underlyingAssetsPrice,
                strikePrice: subInfo.strikePrice,
                amount: tokenBalance,
                pricePaid: '$' + priceConvert(totalPrice / totalAmount),
                price: subInfo.price,
                percentageOfCollateral: subInfo.percentageOfCollateral,
                expectedReturn: '$' + (Number(subInfo.price.replace('$', '')) - priceConvert(totalPrice / totalAmount)) * tokenBalance
              })
            }
          }

          events = sellEvents;
          console.log('events:', events);
          if (events.length > 0) {
            for (let m = 0; m < events.length; m++) {
              //----history-----
              info.history.push({
                blockNumber: events[m].blockNumber,
                txHash: events[m].transactionHash,
                amount: web3.utils.fromWei(events[m].returnValues.amount),
                optionsPrice: '$' + priceConvert(events[m].returnValues.optionsPrice),
                type: 'sell',
              });
            }
          }
        }
        info.optionTokenInfo.push(subInfo);
      }
    };

    funcs.push(func());
  }
  console.log('funcs:', funcs);
  await Promise.all(funcs);
  console.log('funcs finish:', funcs);

  info.history.sort((a, b) => (b.blockNumber - a.blockNumber));

  funcs = [];

  funcs.push(optionMangerSC.methods.getTransactionFee().call());
  funcs.push(mmtSC.methods.getTradingEnd().call());

  [info.transactionFee, info.tradingEnd] = await Promise.all(funcs);
  console.log('fee:', info.transactionFee, info.tradingEnd);

  info.transactionFee = eval(`${info.transactionFee[0]}e${info.transactionFee[1]}`);

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

export const approve = async (tokenAddr, owner, amount, selectedWallet) => {
  if (!tokenAddr || !amount || !selectedWallet) {
    message.error("approve input params error");
    return false;
  }
  if (tokenAddr !== '0x0000000000000000000000000000000000000000') {
    console.log('approve token', tokenAddr, amount);
    let token = new web3.eth.Contract(abiErc20, tokenAddr);
    let data = await token.methods.approve(matchMakingTradingSCAddress, web3.utils.toWei(amount.toString())).encodeABI();
    const params = {
      to: tokenAddr,
      data,
      value: 0,
      gasPrice: "0x3B9ACA00",
      gasLimit: "0x989680", // 10,000,000
    };
    let txID = await sendTransaction(selectedWallet, params);
    if (!txID) {
      return false;
    }
    console.log('approve tx sent:', txID);
    watchTransactionStatus(txID, (status) => {
      if (!status) {
        message.error("token approve failed");
      }
    })
  }
  return true;
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
    if (error.toString().indexOf('Unlock') !== -1) {
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

export const getBuyOptionsOrderAmount = async (optionsAddr, collateralToken) => {
  let buyOrderList = await mmtSC.methods.getPayOrderList(optionsAddr, collateralToken).call();
  console.log('buyOrderList:', buyOrderList);
  if (buyOrderList.length < 4) {
    return 0;
  }
  let totalBuyAmount = web3.utils.toBN(0);
  for (let i = 0; i < buyOrderList[2].length; i++) {
    totalBuyAmount = totalBuyAmount.add(web3.utils.toBN(buyOrderList[2][i]));
  }

  return Number(web3.utils.fromWei(totalBuyAmount));
}

export const sellOptionsToken = async (address, selectedWallet, info, type) => {
  try {
    //approve
    let ret = await approve(info.optionsToken, address, info.amount, selectedWallet);
    if (!ret) {
      return false;
    }
    console.log('approve sent');
    let gas;
    if (type === 'sell') {
      gas = await mmtSC.methods.sellOptionsToken(info.optionsToken, web3.utils.toWei(info.amount.toString()), info.collateralToken).estimateGas({ gas: 10000000, from: address });
    } else {
      gas = await mmtSC.methods.addSellOrder(info.optionsToken, info.collateralToken, web3.utils.toWei(info.amount.toString())).estimateGas({ gas: 10000000, from: address });
    }
    //sell
    if (gas === 10000000) {
      message.error('Estimate Gas Failed');
      console.log('Estimate Gas Failed');
      return false;
    }

    console.log('estimate gas:', gas);

    gas = '0x' + (gas + 30000).toString(16);; // add normal tx cost
    let data;
    if (type === 'sell') {
      data = await mmtSC.methods.sellOptionsToken(info.optionsToken, web3.utils.toWei(info.amount.toString()), info.collateralToken).encodeABI();
    } else {
      data = await mmtSC.methods.addSellOrder(info.optionsToken, info.collateralToken, web3.utils.toWei(info.amount.toString())).encodeABI();
    }
    console.log('data:', data);

    const txParam = {
      to: matchMakingTradingSCAddress,
      data,
      value: 0,
      gasPrice: "0x3B9ACA00",
      // gasLimit: "0x989680", // 10,000,000
    };

    if (selectedWallet.type() === "EXTENSION") {
      txParam.gas = gas;
    } else {
      txParam.gasLimit = gas;
    }

    let transactionID = await selectedWallet.sendTransaction(txParam);
    console.log('sendTransaction:', transactionID);
    message.info("Transaction Submitted, txHash:" + transactionID);
    let timeout = 20;
    while (timeout > 0) {
      const txReceipt = await getTransactionReceipt(transactionID);
      if (!txReceipt) {
        await sleep(3000);
      } else {
        return txReceipt.status;
      }
      timeout--;
    }
  } catch (error) {
    console.log('Sell Options Token Error:', error);
    if (error.toString().indexOf('Unlock') !== -1) {
      message.info("Please Unlock Your Wallet");
    } else {
      message.error("Sell Options Token Error");
    }
  }
  return false;
}
