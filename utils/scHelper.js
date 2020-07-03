import abiOptionsToken from "./abi/OptionsToken.json";
import abiCompoundOracle from "./abi/CompoundOracle.json";
import abiMatchMakingTrading from "./abi/MatchMakingTrading.json";
import abiOptionsManger from "./abi/OptionsManger.json";
import abiOptionsFormulas from './abi/OptionsFormulas.json';
import abiErc20 from './abi/Erc20.json';
import { message } from 'antd';
import { smartContractAddress, decimals, fnxTokenAddress, wanTokenAddress } from '../conf/config';
import sleep from 'ko-sleep';

import { getWeb3, isSwitchFinish } from './web3switch.js';


let matchMakingTradingSCAddress = smartContractAddress;

let mmtSC, oMSC;

// All smart contract instance
let scs = {};

const defaultStartBlock = 7000000;

const initWeb3 = async () => {
  while(true) {
    if (isSwitchFinish) {
      break;
    }
    await sleep(300);
  }
  return getWeb3();
}

// All smart contract instance
const initSmartContract = async () => {
  if (scs.oracleAddr) {
    return;
  }

  let web3 = await initWeb3();
  scs.mmt = new web3.eth.Contract(abiMatchMakingTrading, matchMakingTradingSCAddress);
  let funcs = [];
  // get sc addresses
  funcs.push(scs.mmt.methods.getOptionsManagerAddress().call());
  funcs.push(scs.mmt.methods.getOracleAddress().call());
  let optionsManagerAddress, oracleAddress;
  [optionsManagerAddress, oracleAddress] = await Promise.all(funcs);
  funcs = [];

  scs.opm = new web3.eth.Contract(abiOptionsManger, optionsManagerAddress);
  scs.oracle = new web3.eth.Contract(abiCompoundOracle, oracleAddress);
  scs.mmtAddr = matchMakingTradingSCAddress;
  scs.opmAddr = optionsManagerAddress;
  scs.oracleAddr = oracleAddress;
}

const getOptionsList = async () => {
  await initSmartContract();
  let localInfo = [];
  let web3 = getWeb3();
  let str = window.localStorage.getItem("OptionsInfo");
  if (str && str.length > 0) {
    localInfo = JSON.parse(str);
  }

  let createOptionsEventStartBlock = window.localStorage.getItem("createOptionsEventStartBlock");
  if (!createOptionsEventStartBlock || createOptionsEventStartBlock.length === 0) {
    createOptionsEventStartBlock = defaultStartBlock;
  }

  console.log('createOptionsEventStartBlock', createOptionsEventStartBlock);

  let funcs = [];

  funcs.push(web3.eth.getBlockNumber());

  funcs.push(scs.opm.getPastEvents('CreateOptions', {
    fromBlock: createOptionsEventStartBlock,
  }));

  funcs.push(scs.opm.getPastEvents('Exercise', {
    fromBlock: createOptionsEventStartBlock,
  }));

  let blockNumber, eventCreate, eventExercise;
  [blockNumber, eventCreate, eventExercise] = await Promise.all(funcs);
  funcs = [];

  console.log('getOptionsList', blockNumber, eventCreate, eventExercise);

  window.localStorage.setItem('createOptionsEventStartBlock', blockNumber);

  for (let i=0; i<eventCreate.length; i++) {
    let op = {
      collateral: eventCreate[i].returnValues.collateral,
      expiration: eventCreate[i].returnValues.expiration,
      optType: eventCreate[i].returnValues.optType,
      strikePrice: eventCreate[i].returnValues.strikePrice,
      tokenAddress: eventCreate[i].returnValues.tokenAddress,
      underlyingAssets: eventCreate[i].returnValues.underlyingAssets,
      status: "active"
    };

    localInfo.push(op);
  }

  let activeAddr = [];
  // check exercise
  for (let i=0; i<localInfo.length; i++) {
    if (localInfo[i].status === 'active') {
      for (let m=0; m<eventExercise.length; m++) {
        if (localInfo[i].tokenAddress.toLowerCase() === eventExercise[m].returnValues.optionsToken.toLowerCase()) {
          localInfo[i].status = 'exercise';
        }
      }

      if (localInfo[i].status === 'active') {
        activeAddr.push(localInfo[i].tokenAddress);
      }
    }
  }

  funcs = [];
  // check timeout
  for (let i=0; i<activeAddr.length; i++) {
    funcs.push(scs.mmt.methods.isEligibleOptionsToken(activeAddr[i]).call());
  }

  let ret = await Promise.all(funcs);

  if (ret && ret.length > 0) {
    for (let i=0; i<ret.length; i++) {
      if (!ret[i]) {
        localStorage = localStorage.map((v) => {
          if (v.tokenAddress === activeAddr[i]) {
            v.status = 'timeout';
          }
          return v;
        })
      }
    }
  }

  console.log('localInfo', localInfo, activeAddr);

  str = JSON.stringify(localInfo);

  window.localStorage.setItem('OptionsInfo', str);

  return localInfo;
}

const getPrices = async (tokens) => {
  let tmpFuncs = [];
  for (let i=0; i<tokens.length; i++) {
    tmpFuncs.push(scs.oracle.methods.getBuyOptionsPrice(tokens[i].tokenAddress).call());
    tmpFuncs.push(scs.oracle.methods.getSellOptionsPrice(tokens[i].tokenAddress).call());
    tmpFuncs.push(scs.oracle.methods.getUnderlyingPrice(tokens[i].underlyingAssetsRaw).call());
  }

  tmpFuncs.push(scs.oracle.methods.getPrice(wanTokenAddress).call()); 
  tmpFuncs.push(scs.oracle.methods.getPrice(fnxTokenAddress).call());

  let ret = await Promise.all(tmpFuncs);
  let wanPrice = ret[3*tokens.length];
  let fnxPrice = ret[3*tokens.length + 1];

  for (let i=0; i<tokens.length; i++) {
    tokens[i].price = '$' + priceConvert(ret[i*3]);           // buy price
    tokens[i].sellPrice = '$' + priceConvert(ret[i*3 + 1]);   // sell price
    tokens[i].underlyingAssetsPrice = '$' + priceConvert(ret[i*3 + 2]);

    tokens[i].tokenPrice = [];
    tokens[i].tokenPrice[0] = priceConvert(wanPrice);
    tokens[i].tokenPrice[1] = priceConvert(fnxPrice);
  }
}

const getOpLiquidityAll = async (tokens) => {
  let tmpFuncs = [];
  for (let i=0; i< tokens.length; i++) {
    tmpFuncs.push(getTokenLiquidity(tokens[i].tokenAddress, wanTokenAddress));
    tmpFuncs.push(getTokenLiquidity(tokens[i].tokenAddress, fnxTokenAddress));
  }

  let ret = await Promise.all(tmpFuncs);
  for (let i=0; i< tokens.length; i++) {
    tokens[i].liquidityAll = [];
    tokens[i].liquidityAll[0] = ret[i*2];
    tokens[i].liquidityAll[1] = ret[i*2 + 1];
  }
}

const getHistory = async (allTokens, address) => {
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
    tmpFuncs.push(oMSC.getPastEvents('Exercise', {
      filter: { from: address, optionsToken: token },
      fromBlock: 0,
      toBlock: info.blockNumber
    }));

    let events, sellEvents, exerciseEvents;
    [events, sellEvents, exerciseEvents] = await Promise.all(tmpFuncs);
    // console.log('exerciseEvents:', exerciseEvents);
    console.log('events', events);

    if (events.length > 0) {
      let totalAmount = getWeb3().utils.toBN('0');
      let totalPrice = getWeb3().utils.toBN('0');
      for (let m = 0; m < events.length; m++) {
        totalAmount = totalAmount.add(getWeb3().utils.toBN(events[m].returnValues.amount));
        totalPrice = totalPrice.add(getWeb3().utils.toBN(events[m].returnValues.amount).mul(getWeb3().utils.toBN(events[m].returnValues.optionsPrice)));

        //----history-----
        info.history.push({
          blockNumber: events[m].blockNumber,
          txHash: events[m].transactionHash,
          amount: getWeb3().utils.fromWei(events[m].returnValues.amount),
          optionsPrice: '$' + priceConvert(events[m].returnValues.optionsPrice),
          type: 'buy',
          tokenName: subInfo.tokenName,
          currencyAmount: '$' + Number(Number(getWeb3().utils.fromWei(events[m].returnValues.amount)) * Number(priceConvert(events[m].returnValues.optionsPrice))).toFixed(8),
          key: events[m].transactionHash
        });
      }

      let tokenBalance = await getBalance(token, address);
      if (tokenBalance > 0) {
        info.assets.push({
          tokenName: subInfo.tokenName,
          underlyingAssetsPrice: subInfo.underlyingAssetsPrice,
          strikePrice: subInfo.strikePrice,
          amount: tokenBalance,
          // pricePaid: '$' + priceConvert(totalPrice / totalAmount),
          price: subInfo.sellPrice,
          percentageOfCollateral: subInfo.percentageOfCollateral,
          // expectedReturn: '$' + Number((Number(subInfo.sellPrice.replace('$', '')) - priceConvert(totalPrice / totalAmount)) * tokenBalance).toFixed(8)
          expectedReturn: '$' + Number((Number(subInfo.sellPrice.replace('$', ''))) * tokenBalance).toFixed(8)
        })
      }
    }

    events = sellEvents;
    // console.log('events:', events);
    if (events.length > 0) {
      for (let m = 0; m < events.length; m++) {
        //----history-----
        info.history.push({
          blockNumber: events[m].blockNumber,
          txHash: events[m].transactionHash,
          amount: getWeb3().utils.fromWei(events[m].returnValues.amount),
          optionsPrice: '$' + priceConvert(events[m].returnValues.optionsPrice),
          type: 'sell',
          tokenName: subInfo.tokenName,
          currencyAmount: '$'+Number(Number(getWeb3().utils.fromWei(events[m].returnValues.amount)) * Number(priceConvert(events[m].returnValues.optionsPrice))).toFixed(8),
          key: events[m].transactionHash
        });
      }
    }

    events = exerciseEvents;
    // console.log('events:', events);
    if (events.length > 0) {
      for (let m = 0; m < events.length; m++) {
        if (events[i].returnValues.optionsToken.toLowerCase() !== token.toLowerCase()) {
          continue;
        }
        //----history-----
        info.history.push({
          blockNumber: events[m].blockNumber,
          txHash: events[m].transactionHash,
          amount: address ? getBalance(token, address):"0",
          optionsPrice: subInfo.strikePrice,
          type: 'Exercise',
          tokenName: subInfo.tokenName,
          currencyAmount: '$'+Number(Number(address ? getBalance(token, address):"0") * Number(subInfo.strikePrice.replace('$',''))).toFixed(8),
          key: events[m].transactionHash
        });
      }
    }
  }
}

const getAssets = async (allTokens, address) => {
  if (address && address != null) {
    
  }
}

export const getOptionsInfo = async (address) => {
  console.log('****getOptionsInfo****', new Date().toISOString());

  let opTokens = await getOptionsList();
  let info = {};
  info.optionTokenInfo = [];
  info.assets = [];
  info.history = [];

  for (let i=0; i<opTokens.length; i++) {
    if (opTokens[i].status === 'active') {
      let subInfo = {
        type: opTokens[i].optType === '0' ? "call" : "put",
        underlyingAssets: opTokens[i].underlyingAssets === '1' ? 'BTC' : 'ETH', // 1: BTC, 2: ETH
        underlyingAssetsRaw: opTokens[i].underlyingAssets,
        strikePrice: '$' + priceConvert(opTokens[i].strikePrice),
        expiration: (new Date(opTokens[i].expiration * 1000)).toDateString().split(' ').slice(1, 3).join(' '),
        key: i,
        optionsToken: opTokens[i].tokenAddress,
        tokenAddress: opTokens[i].tokenAddress,
        currency: ['WAN', 'FNX'],
      };

      subInfo.tokenName = [subInfo.underlyingAssets, subInfo.type, subInfo.expiration, subInfo.strikePrice].join(', ');
     
      info.optionTokenInfo.push(subInfo);
    }
  }

  await getPrices(info.optionTokenInfo);
  await getOpLiquidityAll(info.optionTokenInfo);

  info.history = await getHistory(opTokens, address);
  info.assets = await getAssets(opTokens, address);

  if (info.history) {
    info.history.sort((a, b) => (b.blockNumber - a.blockNumber));
  }

  if (info.assets) {
    info.assets.sort();
  }

  info.transactionFee = await scs.opm.methods.getTransactionFee().call();
  info.transactionFee = eval(`${info.transactionFee[0]}e${info.transactionFee[1]}`);

  return info;
}

function priceConvert(price) {
  if (Number(price) / decimals > 1e30) {
    return " Timeout";
  }
  return Number((Number(price) / decimals).toFixed(4));
}

export const getTokenLiquidity = async (optionsTokenAddress, payTokenAddress) => {
  let sellOrderList = await scs.mmt.methods.getSellOrderList(optionsTokenAddress, payTokenAddress).call();

  let liquidity = sellOrderList[2].length > 0 ? eval(sellOrderList[2].join('+')) : 0;
  return getWeb3().utils.fromWei(liquidity.toString());
}

export const getBalance = async (tokenAddress, address) => {
  let balance = 0;
  try {
    if (tokenAddress === '0x0000000000000000000000000000000000000000') {
      balance = await getWeb3().eth.getBalance(address);
    } else {
      let web3 = getWeb3();
      let token = new web3.eth.Contract(abiErc20, tokenAddress);
      balance = await token.methods.balanceOf(address).call();
    }
  } catch (err) {
    console.log(err);
  }

  return Number(getWeb3().utils.fromWei(balance.toString()));
}

export const approve = async (tokenAddr, owner, amount, selectedWallet) => {
  if (!tokenAddr || !amount || !selectedWallet) {
    message.error("approve input params error");
    return false;
  }
  console.log('approve', tokenAddr, amount);
  if (tokenAddr !== '0x0000000000000000000000000000000000000000') {
    // console.log('approve token', tokenAddr, amount);
    let web3 = getWeb3();
    let token = new web3.eth.Contract(abiErc20, tokenAddr);
    let data = await token.methods.approve(matchMakingTradingSCAddress, getWeb3().utils.toWei(amount.toString())).encodeABI();
    const params = {
      to: tokenAddr,
      data,
      value: 0,
      gasPrice: "0x3B9ACA00",
      gasLimit: "0x989680", // 10,000,000
    };
    let txID = await sendTransaction(selectedWallet, params);
    console.log('approve tx id: ', txID);
    if (!txID) {
      return false;
    }
    message.info('approve tx sent: ' + txID);
    let watch = new Promise((resolve, reject) => {
      watchTransactionStatus(txID, (status) => {
        if (!status) {
          message.error("token approve failed");
          reject();
        }
        message.info("approve success: " + status);
        resolve();
      })
    });
    
    await watch;
  }
  return true;
}

export const generateBuyOptionsTokenData = async (info) => {
  console.log('generateBuyOptionsTokenData', info);
  let encodedData = await mmtSC.methods.buyOptionsToken(
    info.optionsToken,
    getWeb3().utils.toWei(info.amount.toString()),
    info.buyUseToken,
    getWeb3().utils.toWei(info.currencyAmount.toString())
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
  // console.log('wallet type:', selectedWallet.type());
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
    // console.log('estimateGas:', info, value, address);
    // let ret = await getWeb3().eth.estimateGas(params, { from: address, value });
    let ret = await mmtSC.methods.buyOptionsToken(
      info.optionsToken,
      getWeb3().utils.toWei(info.amount.toString()),
      info.buyUseToken,
      getWeb3().utils.toWei(info.currencyAmount.toString())
    ).estimateGas({ gas: 10000000, value, from: address });

    if (ret == 10000000) {
      console.log('estimateGas failed:', info.optionsToken, getWeb3().utils.toWei(info.amount.toString()), info.buyUseToken, getWeb3().utils.toWei(info.currencyAmount.toString()));
      // return -1;
      return '0x' + (8000000).toString(16);
    }
    // console.log('estimateGas:', '0x' + (ret + 30000).toString(16));
    return '0x' + (ret + 30000).toString(16);
  } catch (err) {
    message.error(err.toString());
    return -1;
  }
}

export const sendTransaction = async (selectedWallet, params) => {
  try {
    // console.log('sendTransaction:', params);
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
    let txReceipt = await getWeb3().eth.getTransactionReceipt(txID);
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

export const getBuyOptionsOrderAmount = async (optionsAddr, buyUseToken) => {
  let buyOrderList = await mmtSC.methods.getPayOrderList(optionsAddr, buyUseToken).call();
  // console.log('buyOrderList:', buyOrderList);
  if (buyOrderList.length < 4) {
    return 0;
  }
  let totalBuyAmount = getWeb3().utils.toBN(0);
  for (let i = 0; i < buyOrderList[2].length; i++) {
    totalBuyAmount = totalBuyAmount.add(getWeb3().utils.toBN(buyOrderList[2][i]));
  }

  return Number(getWeb3().utils.fromWei(totalBuyAmount));
}

export const sellOptionsToken = async (address, selectedWallet, info, type) => {
  try {
    //approve
    let ret = await approve(info.optionsToken, address, info.amount, selectedWallet);
    if (!ret) {
      return false;
    }
    // console.log('approve sent');
    let gas;
    if (type === 'sell') {
      gas = await mmtSC.methods.sellOptionsToken(info.optionsToken, getWeb3().utils.toWei(info.sellAmount.toString()), info.buyUseToken).estimateGas({ gas: 10000000, from: address });
    } else {
      gas = await mmtSC.methods.addSellOrder(info.optionsToken, info.buyUseToken, getWeb3().utils.toWei(info.sellAmount.toString())).estimateGas({ gas: 10000000, from: address });
    }
    //sell
    if (gas === 10000000) {
      message.error('Estimate Gas Failed');
      console.log('Estimate Gas Failed');
      return false;
    }

    // console.log('estimate gas:', gas);

    gas = '0x' + (gas + 30000).toString(16);; // add normal tx cost
    let data;
    if (type === 'sell') {
      data = await mmtSC.methods.sellOptionsToken(info.optionsToken, getWeb3().utils.toWei(info.sellAmount.toString()), info.buyUseToken).encodeABI();
    } else {
      data = await mmtSC.methods.addSellOrder(info.optionsToken, info.buyUseToken, getWeb3().utils.toWei(info.sellAmount.toString())).encodeABI();
    }
    // console.log('data:', data);

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
    // console.log('sendTransaction:', transactionID);
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

export const startEventScan = (blockNumber, callback) => {
  let eventScan = async (blockNumber) => {
    // console.log('start scan events...from blockNumber', blockNumber);
    let tmpFuncs = [];
    tmpFuncs.push(scs.opm.getPastEvents('CreateOptions', {
      fromBlock: blockNumber,
    }));

    tmpFuncs.push(scs.opm.getPastEvents('AddCollateral', {
      fromBlock: blockNumber,
    }));

    tmpFuncs.push(scs.opm.getPastEvents('WithdrawCollateral', {
      fromBlock: blockNumber,
    }));

    tmpFuncs.push(scs.opm.getPastEvents('Exercise', {
      fromBlock: blockNumber,
    }));

    tmpFuncs.push(scs.opm.getPastEvents('Liquidate', {
      fromBlock: blockNumber,
    }));

    tmpFuncs.push(scs.mmt.getPastEvents('AddSellOrder', {
      fromBlock: blockNumber,
    }));

    tmpFuncs.push(scs.mmt.getPastEvents('RedeemSellOrder', {
      fromBlock: blockNumber,
    }));

    tmpFuncs.push(scs.mmt.getPastEvents('BuyOptionsToken', {
      fromBlock: blockNumber,
    }));

    tmpFuncs.push(scs.mmt.getPastEvents('SellOptionsToken', {
      fromBlock: blockNumber,
    }));

    tmpFuncs.push(scs.mmt.getPastEvents('ReturnExpiredOrders', {
      fromBlock: blockNumber,
    }));

    let ret = await Promise.all(tmpFuncs);
    for (let i=0; i<ret.length; i++) {
      if(ret[i].length > 0) {
        // console.log('found new event.');
        blockNumber = ret[i][0].blockNumber;
        callback(false);
        break;
      }
    }
    // console.log('finish scan events...');
    setTimeout(eventScan, 30000, blockNumber);
  }

  setTimeout(eventScan, 30000, blockNumber);
}

export const getWeb3Obj = () => {
  return getWeb3();
}
