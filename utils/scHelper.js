
import abiErc20 from './abi/IERC20.json';
import { message } from 'antd';
import { contractInfo, decimals, fnxTokenAddress, wanTokenAddress, priceTimeout } from '../conf/config';
import sleep from 'ko-sleep';
import { getWeb3, isSwitchFinish } from './web3switch.js';

// All smart contract instance
let scs = {};

let prices = {
  WAN: 0,
  BTC: 0,
  ETH: 0,
  FNX: 0,
  rawWAN: 0,
  rawBTC: 0,
  rawETH: 0,
  rawFNX: 0,
};

let collateral = {
  sharePrice: 0,
  totalSupply: 0,
  totalValue: 0,
  usedValue: 0,
  lowestPercent: 0,
  balance: 0,
  userPayUsd: 0,
  outOfWithdraw: 0,
  lockedValue: 0,
  availableCollateral: 0,
}

let optionsIDs = [];

let options = [];

let optionsLatest = [];

const buyFee = 0;
const sellFee = 1;
const exerciseFee = 2;
const addColFee = 3;
const redeemColFee = 4;

let fee = {
  redeemColFee: 0,
  addColFee: 0,
  exerciseFee: 0,
  buyFee: 0,
  sellFee: 0,
}

const defaultStartBlock = 7000000;

const initWeb3 = async () => {
  while (true) {
    if (isSwitchFinish) {
      break;
    }
    await sleep(300);
  }
  return getWeb3();
}

// All smart contract instance
export const initSmartContract = async () => {
  if (scs.opManager) {
    return;
  }

  let web3 = await initWeb3();
  scs.opManager = new web3.eth.Contract(require('./abi/OptionsManagerV2.json'), contractInfo.OptionsManagerV2.address);
  scs.oracle = new web3.eth.Contract(require('./abi/CompoundOracle.json'), contractInfo.FNXOracle.address);
  scs.opPool = new web3.eth.Contract(require('./abi/OptionsPool.json'), contractInfo.OptionsPool.address);
  scs.opPrice = new web3.eth.Contract(require('./abi/OptionsPrice.json'), contractInfo.OptionsPrice.address);
  scs.fctCoin = new web3.eth.Contract(require('./abi/FPTCoin.json'), contractInfo.FPTCoin.address);
  scs.minePool = new web3.eth.Contract(require('./abi/FNXMinePool.json'), contractInfo.FNXMinePool.address);

  updateFee();
}

const updateFee = () => {
  let web3 = getWeb3();
  let batch = new web3.BatchRequest();
  batch.add(scs.opManager.methods.getFeeRate(buyFee).call.request({}, (err, ret) => {
    if (err || !ret) {
      console.log(err, ret);
      return;
    }
    fee.buyFee = beautyNumber(ret[0] / ret[1], 6);
  }));

  batch.add(scs.opManager.methods.getFeeRate(sellFee).call.request({}, (err, ret) => {
    if (err || !ret) {
      console.log(err, ret);
      return;
    }
    fee.sellFee = beautyNumber(ret[0] / ret[1], 6);
  }));

  batch.add(scs.opManager.methods.getFeeRate(exerciseFee).call.request({}, (err, ret) => {
    if (err || !ret) {
      console.log(err, ret);
      return;
    }
    fee.exerciseFee = beautyNumber(ret[0] / ret[1], 6);
  }));

  batch.add(scs.opManager.methods.getFeeRate(addColFee).call.request({}, (err, ret) => {
    if (err || !ret) {
      console.log(err, ret);
      return;
    }
    fee.addColFee = beautyNumber(ret[0] / ret[1], 6);
  }));

  batch.add(scs.opManager.methods.getFeeRate(redeemColFee).call.request({}, (err, ret) => {
    if (err || !ret) {
      console.log(err, ret);
      return;
    }
    fee.redeemColFee = beautyNumber(ret[0] / ret[1], 6);
  }));

  batch.execute();
}

export const getFee = () => {
  return fee;
}

export const updateCoinPrices = async () => {
  let web3 = await initWeb3();
  await initSmartContract();

  let batch = new web3.BatchRequest();
  batch.add(scs.oracle.methods.getPrice('0x0000000000000000000000000000000000000000').call.request({}, (err, ret) => {
    if (err || !ret) {
      console.log(err, ret);
      return;
    }
    prices.WAN = priceConvert(ret);
    prices.rawWAN = ret;
  }));

  batch.add(scs.oracle.methods.getPrice('0x0000000000000000000000000000000000000001').call.request({}, (err, ret) => {
    if (err || !ret) {
      console.log(err, ret);
      return;
    }
    prices.BTC = priceConvert(ret);
    prices.rawBTC = ret;
  }));

  batch.add(scs.oracle.methods.getPrice('0x0000000000000000000000000000000000000002').call.request({}, (err, ret) => {
    if (err || !ret) {
      console.log(err, ret);
      return;
    }
    prices.ETH = priceConvert(ret);
    prices.rawETH = ret;
  }));

  batch.add(scs.oracle.methods.getPrice(fnxTokenAddress).call.request({}, (err, ret) => {
    if (err || !ret) {
      console.log(err, ret);
      return;
    }
    prices.FNX = priceConvert(ret);
    prices.rawFNX = ret;
  }));

  batch.execute();
}

export const getCoinPrices = () => {
  // console.log('prices', prices);
  return prices;
}

function priceRevert(price) {
  return Number(price * decimals).toFixed(0);
}

function priceConvert(price, time) {
  if (Number(price) / decimals > 1e30) {
    return " Timeout";
  }

  if (time && (Date.now() / 1000 - time) > priceTimeout) {
    return " Timeout";
  }
  return Number((Number(price) / decimals).toFixed(8));
}

export const beautyNumber = (n, d = 8) => {
  if (isNaN(n) || Number(n) === 0) {
    return 0;
  }
  return Number(Number(n).toFixed(d));
}

export const getOptionsPrice = async (currentPrice, strikePrice, expiration, underlying, optType) => {
  if (!scs.opManager) {
    return 0;
  }

  // console.log('getOptionsPrice:', (currentPrice), priceRevert(strikePrice), expiration, underlying, optType);
  let ret = await scs.opPrice.methods.getOptionsPrice((currentPrice), priceRevert(strikePrice), expiration, underlying, optType).call();
  // console.log('getOptionsPrice', ret);
  return priceConvert(ret);
}

export const updateCollateralInfo = async (address) => {
  let web3 = await initWeb3();
  await initSmartContract();

  let batch = new web3.BatchRequest();

  let finish = false;

  batch.add(scs.opManager.methods.getTokenNetworth().call.request({}, (err, ret) => {
    if (err || !ret) {
      console.log(err, ret);
      return;
    }
    // console.log('getTokenNetworth', ret);
    collateral.sharePrice = priceConvert(ret);
  }));

  batch.add(scs.fctCoin.methods.totalSupply().call.request({}, (err, ret) => {
    if (err || !ret) {
      console.log(err, ret);
      return;
    }
    // console.log('totalSupply', ret);
    collateral.totalSupply = web3.utils.fromWei(ret);
  }));

  batch.add(scs.opManager.methods.getAvailableCollateral().call.request({}, (err, ret) => {
    if (err || !ret) {
      console.log(err, ret);
      return;
    }
    // console.log('getAvailableCollateral', priceConvert(web3.utils.fromWei(ret)));
    collateral.availableCollateral = priceConvert(web3.utils.fromWei(ret));
  }));

  batch.add(scs.opManager.methods.getTotalCollateral().call.request({}, (err, ret) => {
    if (err || !ret) {
      console.log(err, ret);
      return;
    }
    // console.log('getTotalCollateral', ret);
    let value = web3.utils.fromWei(ret);
    if (value > 1e30) {
      // console.log('getTotalCollateral value invalid', value);
      return;
    }
    collateral.totalValue = priceConvert(value);
  }));

  batch.add(scs.opManager.methods.getOccupiedCollateral().call.request({}, (err, ret) => {
    if (err || !ret) {
      console.log(err, ret);
      return;
    }
    // console.log('getOccupiedCollateral', priceConvert(web3.utils.fromWei(ret)));
    let value = web3.utils.fromWei(ret);
    if (value > 1e30) {
      console.log('getOccupiedCollateral value invalid', priceConvert(value));
      return;
    }
    collateral.usedValue = priceConvert(value);
  }));

  batch.add(scs.opManager.methods.getLeftCollateral().call.request({}, (err, ret) => {
    if (err || !ret) {
      console.log(err, ret);
      return;
    }
    // console.log('getLeftCollateral', ret);
    let value = web3.utils.fromWei(ret);
    if (value > 1e30) {
      console.log('getLeftCollateral value invalid', value);
      return;
    }
    collateral.outOfWithdraw = priceConvert(value);
  }));

  batch.add(scs.fctCoin.methods.getTotalLockedWorth().call.request({}, (err, ret) => {
    if (err || !ret) {
      console.log(err, ret);
      return;
    }
    // console.log('getTotalLockedWorth', ret);
    let value = web3.utils.fromWei(ret);
    if (value > 1e30) {
      console.log('getTotalLockedWorth value invalid', value);
      return;
    }
    collateral.lockedValue = priceConvert(value);
  }));

  //--mine--info---
  batch.add(scs.minePool.methods.getMineInfo(fnxTokenAddress).call.request({}, (err, ret) => {
    if (err || !ret) {
      console.log(err, ret);
      return;
    }
    let amount = web3.utils.fromWei(ret[0]);
    let interval = ret[1];
    // console.log('getMineInfo fnx', ret, beautyNumber(amount * 3600 * 24 / interval, 2));

    collateral.fnxMine = beautyNumber(amount * 3600 * 24 / interval, 2);
  }));

  batch.add(scs.minePool.methods.getMineInfo('0x0000000000000000000000000000000000000000').call.request({}, (err, ret) => {
    if (err || !ret) {
      console.log(err, ret);
      return;
    }
    let amount = web3.utils.fromWei(ret[0]);
    let interval = ret[1];
    // console.log('getMineInfo wan', ret, beautyNumber(amount * 3600 * 24 / interval, 2));
    collateral.wanMine = beautyNumber(amount * 3600 * 24 / interval, 2);
  }));

  batch.add(scs.opManager.methods.getCollateralRate().call.request({}, (err, ret) => {
    if (err || !ret) {
      console.log(err, ret);
      return;
    }
    // console.log('getCollateralRate', ret);
    collateral.lowestPercent = beautyNumber(ret[0] ** ret[1] * 100, 2);

    if (!address) {
      finish = true;
    }
  }));



  if (address) {
    batch.add(scs.fctCoin.methods.balanceOf(address).call.request({}, (err, ret) => {
      if (err || !ret) {
        console.log(err, ret);
        return;
      }
      // console.log('balanceOf', ret);
      collateral.balance = web3.utils.fromWei(ret);
      finish = true;
    }));

    batch.add(scs.opManager.methods.getUserPayingUsd(address).call.request({}, (err, ret) => {
      if (err || !ret) {
        console.log(err, ret);
        return;
      }
      // console.log('getUserPayingUsd', ret);
      collateral.userPayUsd = priceConvert(web3.utils.fromWei(ret));
    }));

    batch.add(scs.minePool.methods.getMinerBalance(address, fnxTokenAddress).call.request({}, (err, ret) => {
      if (err || !ret) {
        console.log(err, ret);
        return;
      }
      // console.log('getMinerBalance fnx', web3.utils.fromWei(ret));
      collateral.minedFnx = web3.utils.fromWei(ret);
    }));

    batch.add(scs.minePool.methods.getMinerBalance(address, '0x0000000000000000000000000000000000000000').call.request({}, (err, ret) => {
      if (err || !ret) {
        console.log(err, ret);
        return;
      }
      // console.log('getMinerBalance wan', web3.utils.fromWei(ret));
      collateral.minedWan = web3.utils.fromWei(ret);
    }));
  }

  batch.execute();

  while (!finish) {
    await sleep(500);
  }
  // await sleep(5000);
  // console.log('update finish');
}

export const getCollateralInfo = () => {
  return collateral;
}

export const deposit = async (chainType, amountToPay, currencyToPay, selectedWallet, address) => {
  if (!amountToPay || !selectedWallet || !address) {
    message.error("Sorry, deposit input params error");
    return false;
  }
  let ret = false;
  // console.log('deposit:', chainType, amountToPay, currencyToPay);
  let web3 = getWeb3();
  let txParam = { gasPrice: '0x3B9ACA00' };
  if (chainType === 'wan') {
    let token = "0x0000000000000000000000000000000000000000";
    txParam.to = contractInfo.OptionsManagerV2.address;
    if (currencyToPay != 0) {
      token = fnxTokenAddress;
      let apRet = await approve(token, amountToPay, address, selectedWallet);
      if (!apRet) {
        return false;
      }
      txParam.value = "0";
    } else {
      txParam.value = web3.utils.toWei(amountToPay.toString());
    }
    // console.log('addCollateral:', token, web3.utils.toWei(amountToPay.toString()));
    let gas = await scs.opManager.methods.addCollateral(token, web3.utils.toWei(amountToPay.toString())).estimateGas({ gas: 1e7, from: address, value: txParam.value });
    if (gas.toString() === "10000000") {
      message.error("Sorry, gas estimate failed, Please check input params");
      return false;
    }
    if (selectedWallet.type() === "EXTENSION") {
      txParam.gas = gas;
    } else {
      txParam.gasLimit = gas;
    }

    let data = await scs.opManager.methods.addCollateral(token, web3.utils.toWei(amountToPay.toString())).encodeABI();
    txParam.data = data;

    let transactionID = await selectedWallet.sendTransaction(txParam);
    console.log('sendTransaction:', transactionID);
    message.info("Transaction Submitted, txHash:" + transactionID);
    let timeout = 20;
    while (timeout > 0) {
      const txReceipt = await getTransactionReceipt(transactionID);
      if (!txReceipt) {
        await sleep(3000);
        // console.log('waiting...');
      } else {
        return txReceipt.status;
      }
      timeout--;
    }
  }

  return ret;
}

export const withdraw = async (chainType, amountToPay, currencyToPay, selectedWallet, address) => {
  if (!amountToPay || !selectedWallet || !address) {
    message.error("Sorry, deposit input params error");
    return false;
  }
  let ret = false;
  // console.log('withdraw:', chainType, amountToPay, currencyToPay);
  let web3 = getWeb3();
  let txParam = { gasPrice: '0x3B9ACA00' };
  if (chainType === 'wan') {
    let token = "0x0000000000000000000000000000000000000000";
    txParam.to = contractInfo.OptionsManagerV2.address;
    if (currencyToPay != 0) {
      token = fnxTokenAddress;
    }
    txParam.value = "0";
    // console.log('withdraw:', token, web3.utils.toWei(amountToPay.toString()));
    let gas = await scs.opManager.methods.redeemCollateral(web3.utils.toWei(amountToPay.toString()), token).estimateGas({ gas: 1e7, from: address, value: txParam.value });
    if (gas.toString() === "10000000") {
      message.error("Sorry, gas estimate failed, Please check input params");
      return false;
    }
    if (selectedWallet.type() === "EXTENSION") {
      txParam.gas = gas;
    } else {
      txParam.gasLimit = gas;
    }

    let data = await scs.opManager.methods.redeemCollateral(web3.utils.toWei(amountToPay.toString()), token).encodeABI();
    txParam.data = data;

    let transactionID = await selectedWallet.sendTransaction(txParam);
    console.log('sendTransaction:', transactionID);
    message.info("Transaction Submitted, txHash:" + transactionID);
    let timeout = 20;
    while (timeout > 0) {
      const txReceipt = await getTransactionReceipt(transactionID);
      if (!txReceipt) {
        await sleep(3000);
        // console.log('waiting...');
      } else {
        return txReceipt.status;
      }
      timeout--;
    }
  }

  return ret;
}

export const buyOptions = async (chainType, currencyToPay, amountToPay, strikePrice, underlying, expiration, amount, optType, selectedWallet, address) => {
  if (!amountToPay || !amount || !expiration || !strikePrice || !selectedWallet || !address) {
    message.error("Sorry, deposit input params error");
    return false;
  }
  let ret = false;
  // console.log('buyOption:', currencyToPay, amountToPay, strikePrice, underlying, expiration, amount, optType, address);
  let txParam = { gasPrice: '0x3B9ACA00' };
  if (chainType === 'wan') {
    let web3 = getWeb3();
    let token = "0x0000000000000000000000000000000000000000";
    txParam.to = contractInfo.OptionsManagerV2.address;
    if (currencyToPay != 2) {
      token = fnxTokenAddress;
      let apRet = await approve(token, amountToPay, address, selectedWallet);
      if (!apRet) {
        return false;
      }
      txParam.value = "0";
    } else {
      txParam.value = web3.utils.toWei(amountToPay.toString());
    }
    // console.log('addCollateral:', token, web3.utils.toWei(amountToPay.toString()));
    let gas = await scs.opManager.methods.buyOption(token,
      web3.utils.toWei(amountToPay.toString()),
      priceRevert(strikePrice), underlying, expiration, web3.utils.toWei(amount.toString()), optType).estimateGas({ gas: 1e7, from: address, value: txParam.value });
    if (gas.toString() === "10000000") {
      message.error("Sorry, gas estimate failed, Please check input params");
      return false;
    }
    if (selectedWallet.type() === "EXTENSION") {
      txParam.gas = gas;
    } else {
      txParam.gasLimit = gas;
    }

    let data = await scs.opManager.methods.buyOption(token,
      web3.utils.toWei(amountToPay.toString()),
      priceRevert(strikePrice), underlying, expiration, web3.utils.toWei(amount.toString()), optType).encodeABI();
    txParam.data = data;

    let transactionID = await selectedWallet.sendTransaction(txParam);
    console.log('sendTransaction:', transactionID);
    message.info("Transaction Submitted, txHash:" + transactionID);
    let timeout = 20;
    while (timeout > 0) {
      const txReceipt = await getTransactionReceipt(transactionID);
      if (!txReceipt) {
        await sleep(3000);
        // console.log('waiting...');
      } else {
        return txReceipt.status;
      }
      timeout--;
    }
  }

  return ret;
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
    console.log(err, tokenAddress, address);
  }

  return Number(getWeb3().utils.fromWei(balance.toString()));
}

export const approve = async (tokenAddr, amount, owner, selectedWallet) => {
  if (!tokenAddr || !selectedWallet) {
    message.error("approve input params error");
    return false;
  }
  // console.log('approve', tokenAddr, amount);
  if (tokenAddr !== '0x0000000000000000000000000000000000000000') {
    // console.log('approve token', tokenAddr, amount);
    let web3 = getWeb3();
    let token = new web3.eth.Contract(abiErc20, tokenAddr);
    let allowance = await token.methods.allowance(owner, contractInfo.OptionsManagerV2.address).call();
    // console.log('allowance', allowance);
    if (Number(allowance) !== 0 && Number(amount) !== 0) {
      if (Number(web3.utils.fromWei(allowance.toString())) >= amount) {
        return true;
      }

      let ret = await approve(tokenAddr, 0, owner, selectedWallet);
      if (!ret) {
        message.info('approve 0 failed');
        return false;
      }
      message.info('approve 0 success');
    }

    let data = await token.methods.approve(contractInfo.OptionsManagerV2.address, getWeb3().utils.toWei(amount.toString())).encodeABI();
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

export const getTransactionReceipt = async (txID) => {
  try {
    let txReceipt = await getWeb3().eth.getTransactionReceipt(txID);
    return txReceipt;
  } catch (error) {
    message.error(error.toString());
  }
  return null;
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

export const watchTransactionStatus = (txID, callback) => {
  if (!txID) {
    console.log('watchTransactionStatus txID is null');
    return;
  }
  const getTransactionStatus = async () => {
    const txReceipt = await getTransactionReceipt(txID);
    if (!txReceipt) {
      setTimeout(() => getTransactionStatus(txID), 3000);
      // console.log('waiting...');
    } else if (callback) {
      callback(txReceipt.status);
    } else {
      message.info('success');
    }
  };
  setTimeout(() => getTransactionStatus(txID), 3000);
  // console.log('waiting...');
};

export const updateUserOptions = async (address, chainType) => {
  if (!address) {
    return;
  }

  if (chainType === 'wan') {
    await initSmartContract();
    let web3 = getWeb3();
    optionsIDs = await scs.opPool.methods.getUserOptionsID(address).call();
    // console.log('getUserOptions, id', optionsIDs);
    if (optionsIDs.length > 0) {
      let batch = new web3.BatchRequest();
      for (let i = 0; i < optionsIDs.length; i++) {
        batch.add(scs.opPool.methods.getOptionsById(optionsIDs[i]).call.request({}, (err, ret) => {
          if (err || !ret) {
            console.log(err, ret);
            return;
          }

          // console.log('getOptionsById', optionsIDs[i], ret);
          if (ret[1].toLowerCase() != address.toLowerCase()) {
            console.log('getOptionsById information address mismatch');
          }

          let info = {
            id: ret[0],
            key: ret[0],
            optType: ret[2] === '0' ? 'Call' : 'Put',
            underlying: ret[3] === '1' ? 'BTC' : 'ETH',
            expiration: ret[4],
            strikePrice: priceConvert(ret[5]),
            amount: web3.utils.fromWei(ret[6]),
            ret
          };

          if (Number(info.amount) === 0) {
            return;
          }

          let expirationWithYear = (new Date(info.expiration * 1000)).toDateString().split(' ').slice(1, 4).join(' ');

          info.name = info.underlying + " " + info.optType + ", " + expirationWithYear + ", $" + info.strikePrice + " @Wanchain";
          optionsLatest.push(info);
        }));
      }

      optionsLatest = [];
      batch.execute();
    }
  }
}

export const getUserOptions = () => {
  if (optionsLatest.length > 0) {
    for (let i = 0; i < optionsLatest.length; i++) {
      for (let j = 0; j < options.length; j++) {
        if (optionsLatest[i].id === options[j].id) {
          if (Number(options[j].price) !== 0) {
            optionsLatest[i].price = options[i].price;
          }
        }
      }
    }
    options = optionsLatest.slice();
  }
  // console.log('optionsLatest', optionsLatest);
  return options.sort((a, b) => { return b.id - a.id });
}

export const getOptionsPrices = async () => {
  let timeout = 5;
  while (optionsIDs.length === 0) {
    await sleep(1000);
    // console.log('timeout', timeout);
    if (timeout-- < 0) {
      return [];
    }
  }

  let web3 = getWeb3()
  let batch = new web3.BatchRequest();
  let finish = false;

  for (let i = 0; i < options.length; i++) {
    if (options[i].expiration <= Date.now() / 1000 || Number(options[i].amount) === 0) {
      continue;
    }
    let ptrOptions = options[i];
    batch.add(scs.opPrice.methods.getOptionsPrice(prices['raw' + options[i].underlying],
      options[i].ret[5], options[i].expiration - parseInt(Date.now() / 1000, 10),
      options[i].ret[3], options[i].ret[2]).call.request({},
        (err, ret) => {
          if (err || !ret) {
            console.log(err, ret);
            return;
          }
          // console.log('getOptionsPrice', ret);
          ptrOptions.price = priceConvert(ret);
          finish = true;
        }));
  }

  batch.execute();

  while (!finish) {
    await sleep(1000);
  }

  // console.log('getOptionsPrices finish', options);
}

export const sellOptions = async (chainType, id, amount, selectedWallet, address) => {
  if (!amount || !selectedWallet || !address) {
    message.error("Sorry, deposit input params error");
    return false;
  }
  let ret = false;
  // console.log('sellOptions:', chainType, id, amount);
  let txParam = { gasPrice: '0x3B9ACA00' };
  if (chainType === 'wan') {
    let web3 = getWeb3();
    txParam.to = contractInfo.OptionsManagerV2.address;
    txParam.value = "0";

    let gas = await scs.opManager.methods.sellOption(id,
      web3.utils.toWei(amount.toString())).estimateGas({ gas: 1e7, from: address, value: txParam.value });
    if (gas.toString() === "10000000") {
      message.error("Sorry, gas estimate failed, Please check input params");
      return false;
    }
    if (selectedWallet.type() === "EXTENSION") {
      txParam.gas = gas;
    } else {
      txParam.gasLimit = gas;
    }

    let data = await scs.opManager.methods.sellOption(id,
      web3.utils.toWei(amount.toString())).encodeABI();
    txParam.data = data;

    let transactionID = await selectedWallet.sendTransaction(txParam);
    console.log('sendTransaction:', transactionID);
    message.info("Transaction Submitted, txHash:" + transactionID);
    let timeout = 20;
    while (timeout > 0) {
      const txReceipt = await getTransactionReceipt(transactionID);
      if (!txReceipt) {
        await sleep(3000);
        // console.log('waiting...');
      } else {
        return txReceipt.status;
      }
      timeout--;
    }
  }

  return ret;
}

export const exerciseOptions = async (chainType, id, amount, selectedWallet, address) => {
  if (!amount || !selectedWallet || !address) {
    message.error("Sorry, deposit input params error");
    return false;
  }
  let ret = false;
  // console.log('exerciseOptions:', chainType, id, amount);
  let txParam = { gasPrice: '0x3B9ACA00' };
  if (chainType === 'wan') {
    let web3 = getWeb3();
    txParam.to = contractInfo.OptionsManagerV2.address;
    txParam.value = "0";

    let gas = await scs.opManager.methods.exerciseOption(id,
      web3.utils.toWei(amount.toString())).estimateGas({ gas: 1e7, from: address, value: txParam.value });
    if (gas.toString() === "10000000") {
      message.error("Sorry, gas estimate failed, Please check input params");
      return false;
    }
    if (selectedWallet.type() === "EXTENSION") {
      txParam.gas = gas;
    } else {
      txParam.gasLimit = gas;
    }

    let data = await scs.opManager.methods.exerciseOption(id,
      web3.utils.toWei(amount.toString())).encodeABI();
    txParam.data = data;

    let transactionID = await selectedWallet.sendTransaction(txParam);
    console.log('sendTransaction:', transactionID);
    message.info("Transaction Submitted, txHash:" + transactionID);
    let timeout = 20;
    while (timeout > 0) {
      const txReceipt = await getTransactionReceipt(transactionID);
      if (!txReceipt) {
        await sleep(3000);
        // console.log('waiting...');
      } else {
        return txReceipt.status;
      }
      timeout--;
    }
  }

  return ret;
}

export const transferToken = async (chainType, token, to, value, selectedWallet, address) => {
  if (!value || !selectedWallet || !address) {
    message.error("Sorry, deposit input params error");
    return false;
  }
  let ret = false;
  // console.log('transferToken:', chainType, token, to, value);
  let txParam = { gasPrice: '0x3B9ACA00' };
  if (chainType === 'wan') {
    let web3 = getWeb3();

    let wanAddr = "0x0000000000000000000000000000000000000000";
    let gas = 0;
    if (token === wanAddr) {
      txParam.to = to;
      txParam.value = '0x' + web3.utils.toBN(web3.utils.toWei(value.toString())).toString('hex');
      gas = '0x' + web3.utils.toBN('21000').toString('hex');
      if (selectedWallet.type() === "EXTENSION") {
        txParam.gas = gas;
      } else {
        txParam.gasLimit = gas;
      }

      txParam.data = "0x";
    } else {
      txParam.to = token;
      txParam.value = "0x0";
      let erc20 = new web3.eth.Contract(abiErc20, token);
      let gas = await erc20.methods.transfer(to,
        web3.utils.toWei(value.toString())).estimateGas({ gas: 1e7, from: address, value: txParam.value });
      if (gas.toString() === "10000000") {
        message.error("Sorry, gas estimate failed, Please check input params");
        return false;
      }

      if (selectedWallet.type() === "EXTENSION") {
        txParam.gas = gas;
      } else {
        txParam.gasLimit = gas;
      }

      let data = await erc20.methods.transfer(to,
        web3.utils.toWei(value.toString())).encodeABI();
      txParam.data = data;
    }

    let transactionID = await selectedWallet.sendTransaction(txParam);
    console.log('sendTransaction:', transactionID);
    message.info("Transaction Submitted, txHash:" + transactionID);
    let timeout = 20;
    while (timeout > 0) {
      const txReceipt = await getTransactionReceipt(transactionID);
      if (!txReceipt) {
        await sleep(3000);
        // console.log('waiting...');
      } else {
        return txReceipt.status;
      }
      timeout--;
    }
  }

  return ret;
}

export const getOptionsLimitTimeById = async (id) => {
  let ret = await scs.opPool.methods.getOptionsLimitTimeById(id).call();
  return ret;
}

export const redeemMinerCoin = async (chainType, coinToken, amount, selectedWallet, address) => {
  if (!amount || !selectedWallet || !address) {
    message.error("Sorry, deposit input params error");
    return false;
  }
  // console.log('redeemMinerCoin:', chainType, coinToken, amount);
  let ret = false;
  if (chainType === 'wan') {
    let web3 = getWeb3();
    let txParam = { gasPrice: '0x3B9ACA00' };
    txParam.to = contractInfo.FNXMinePool.address;
    txParam.value = "0";

    let gas = await scs.minePool.methods.redeemMinerCoin(coinToken,
      web3.utils.toWei(amount.toString())).estimateGas({ gas: 1e7, from: address, value: txParam.value });
    if (gas.toString() === "10000000") {
      message.error("Sorry, gas estimate failed, Please check input params");
      return false;
    }
    if (selectedWallet.type() === "EXTENSION") {
      txParam.gas = gas;
    } else {
      txParam.gasLimit = gas;
    }

    let data = await scs.minePool.methods.redeemMinerCoin(coinToken,
    web3.utils.toWei(amount.toString())).encodeABI();
    txParam.data = data;

    let transactionID = await selectedWallet.sendTransaction(txParam);
    console.log('sendTransaction:', transactionID);
    message.info("Transaction Submitted, txHash:" + transactionID);
    let timeout = 20;
    while (timeout > 0) {
      const txReceipt = await getTransactionReceipt(transactionID);
      if (!txReceipt) {
        await sleep(3000);
        // console.log('waiting...');
      } else {
        return txReceipt.status;
      }
      timeout--;
    }
  }

  return ret;
}
