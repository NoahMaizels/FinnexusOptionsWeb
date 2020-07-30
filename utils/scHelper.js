
import abiErc20 from './abi/IERC20.json';
import { message } from 'antd';
import { contractInfo, decimals, fnxTokenAddress, wanTokenAddress, priceTimeout } from '../conf/config';
import sleep from 'ko-sleep';
import { getWeb3, isSwitchFinish } from './web3switch.js';

// All smart contract instance
let scs = {};

let prices = {
  WAN:0,
  BTC:0,
  ETH:0,
  FNX:0,
  rawWAN:0,
  rawBTC:0,
  rawETH:0,
  rawFNX:0,
};

let collateral = {
  sharePrice: 0,
  totalSupply: 0,
  totalValue: 0,
  usedValue: 0,
  lowestPercent: 0,
  balance: 0,
  userPayUsd: 0,
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
  scs.fctCoin = new web3.eth.Contract(require('./abi/FCTCoin.json'), contractInfo.FCTCoin.address);

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

  if (time && (Date.now()/1000 - time) > priceTimeout) {
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

  console.log('getOptionsPrice:', (currentPrice), priceRevert(strikePrice), expiration, underlying, optType);
  let ret = await scs.opPrice.methods.getOptionsPrice((currentPrice), priceRevert(strikePrice), expiration, underlying, optType).call();
  console.log('getOptionsPrice', ret);
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
    console.log('getTokenNetworth', ret);
    collateral.sharePrice = priceConvert(ret);
  }));

  batch.add(scs.fctCoin.methods.totalSupply().call.request({}, (err, ret) => {
    if (err || !ret) {
      console.log(err, ret);
      return;
    }
    console.log('totalSupply', ret);
    collateral.totalSupply = web3.utils.fromWei(ret);
  }));

  batch.add(scs.opManager.methods.getTotalCollateral().call.request({}, (err, ret) => {
    if (err || !ret) {
      console.log(err, ret);
      return;
    }
    console.log('getTotalCollateral', ret);
    let value = web3.utils.fromWei(ret);
    if (value > 1e30) {
      console.log('getTotalCollateral value invalid', value);
      return;
    }
    collateral.totalValue = priceConvert(value);
  }));

  batch.add(scs.opManager.methods.getOccupiedCollateral().call.request({}, (err, ret) => {
    if (err || !ret) {
      console.log(err, ret);
      return;
    }
    console.log('getOccupiedCollateral', ret);
    let value = web3.utils.fromWei(ret);
    if (value > 1e30) {
      console.log('getOccupiedCollateral value invalid', value);
      return;
    }
    collateral.usedValue = priceConvert(value);
  }));

  batch.add(scs.opManager.methods.getCollateralRate().call.request({}, (err, ret) => {
    if (err || !ret) {
      console.log(err, ret);
      return;
    }
    console.log('getCollateralRate', ret);
    collateral.lowestPercent = beautyNumber(ret[0]**ret[1] * 100, 2);

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
      console.log('balanceOf', ret);
      collateral.balance = web3.utils.fromWei(ret);
      finish = true;
    }));

    batch.add(scs.opManager.methods.getUserPayingUsd(address).call.request({}, (err, ret) => {
      if (err || !ret) {
        console.log(err, ret);
        return;
      }
      console.log('getUserPayingUsd', ret);
      collateral.userPayUsd = priceConvert(web3.utils.fromWei(ret));
    }));
  }

  batch.execute();

  while(!finish) {
    await sleep(500);
  }
  await sleep(5000);
  console.log('update finish');
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
  console.log('deposit:', chainType, amountToPay, currencyToPay);
  let web3 = getWeb3();
  let txParam = {gasPrice: '0x3B9ACA00'};
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
    console.log('addCollateral:', token, web3.utils.toWei(amountToPay.toString()));
    let gas = await scs.opManager.methods.addCollateral(token, web3.utils.toWei(amountToPay.toString())).estimateGas({gas: 1e7, from: address, value: txParam.value});
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
        console.log('waiting...');
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
  console.log('withdraw:', chainType, amountToPay, currencyToPay);
  let web3 = getWeb3();
  let txParam = {gasPrice: '0x3B9ACA00'};
  if (chainType === 'wan') {
    let token = "0x0000000000000000000000000000000000000000";
    txParam.to = contractInfo.OptionsManagerV2.address;
    if (currencyToPay != 0) {
      token = fnxTokenAddress;
    } 
    txParam.value = "0";
    console.log('withdraw:', token, web3.utils.toWei(amountToPay.toString()));
    let gas = await scs.opManager.methods.redeemCollateral(web3.utils.toWei(amountToPay.toString()), token).estimateGas({gas: 1e7, from: address, value: txParam.value});
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
        console.log('waiting...');
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
  console.log('buyOption:', currencyToPay, amountToPay, strikePrice, underlying, expiration, amount, optType, address);
  let txParam = {gasPrice: '0x3B9ACA00'};
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
    console.log('addCollateral:', token, web3.utils.toWei(amountToPay.toString()));
    let gas = await scs.opManager.methods.buyOption(token, 
      web3.utils.toWei(amountToPay.toString()), 
      priceRevert(strikePrice), underlying, expiration, web3.utils.toWei(amount.toString()), optType).estimateGas({gas: 1e7, from: address, value: txParam.value});
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
        console.log('waiting...');
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
    console.log(err);
  }

  return Number(getWeb3().utils.fromWei(balance.toString()));
}

export const approve = async (tokenAddr, amount, owner, selectedWallet) => {
  if (!tokenAddr || !amount || !selectedWallet) {
    message.error("approve input params error");
    return false;
  }
  console.log('approve', tokenAddr, amount);
  if (tokenAddr !== '0x0000000000000000000000000000000000000000') {
    // console.log('approve token', tokenAddr, amount);
    let web3 = getWeb3();
    let token = new web3.eth.Contract(abiErc20, tokenAddr);
    let allowance = await token.methods.allowance(owner, contractInfo.OptionsManagerV2.address).call();
    console.log('allowance', allowance);
    if (Number(allowance) !== 0 && Number(amount) !== 0)
    {
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
      console.log('waiting...');
    } else if (callback) {
      callback(txReceipt.status);
    } else {
      message.info('success');
    }
  };
  setTimeout(() => getTransactionStatus(txID), 3000);
  console.log('waiting...');
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
      for (let i=0; i<optionsIDs.length; i++) {
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

          let expirationWithYear = (new Date(info.expiration * 1000)).toDateString().split(' ').slice(1, 4).join(' ');

          info.name = info.underlying + " " + info.optType + ", " + expirationWithYear + ", $"+info.strikePrice + " @Wanchain";
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
    options = optionsLatest.slice();
  }
  console.log('optionsLatest', optionsLatest);
  return options.sort((a,b)=>{return b.id - a.id});
}

export const getOptionsPrices = async () => {
  let timeout = 5;
  while(optionsIDs.length === 0 || optionsIDs.length !== options.length) {
    await sleep(1000);
    console.log('timeout', timeout);
    if(timeout-- < 0 && optionsIDs.length === 0 ) {
      return [];
    }
  }

  let web3 = getWeb3()
  let batch = new web3.BatchRequest();
  let finish = false;

  for (let i=0; i<options.length; i++) {
    if (options[i].expiration <= Date.now()/1000) {
      continue;
    }
    let ptrOptions = options[i];
    batch.add(scs.opPrice.methods.getOptionsPrice(prices['raw'+options[i].underlying], 
      options[i].ret[5], options[i].expiration - parseInt(Date.now()/1000, 10), 
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

  while(!finish) {
    await sleep(1000);
  }

  // console.log('getOptionsPrices finish', options);
}

export const sellOptions = async (chainType, id, amount, selectedWallet, address) => {
  if ( !amount || !selectedWallet || !address ) {
    message.error("Sorry, deposit input params error");
    return false;
  }
  let ret = false;
  console.log('sellOptions:', chainType, id, amount);
  let txParam = {gasPrice: '0x3B9ACA00'};
  if (chainType === 'wan') {
    let web3 = getWeb3();
    txParam.to = contractInfo.OptionsManagerV2.address;
    txParam.value = "0";

    let gas = await scs.opManager.methods.sellOption(id, 
      web3.utils.toWei(amount.toString())).estimateGas({gas: 1e7, from: address, value: txParam.value});
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
        console.log('waiting...');
      } else {
        return txReceipt.status;
      }
      timeout--;
    }
  }

  return ret;
}

export const exerciseOptions = async (chainType, id, amount, selectedWallet, address) => {
  if ( !amount || !selectedWallet || !address) {
    message.error("Sorry, deposit input params error");
    return false;
  }
  let ret = false;
  console.log('exerciseOptions:', chainType, id, amount);
  let txParam = {gasPrice: '0x3B9ACA00'};
  if (chainType === 'wan') {
    let web3 = getWeb3();
    txParam.to = contractInfo.OptionsManagerV2.address;
    txParam.value = "0";

    let gas = await scs.opManager.methods.exerciseOption(id, 
      web3.utils.toWei(amount.toString())).estimateGas({gas: 1e7, from: address, value: txParam.value});
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
        console.log('waiting...');
      } else {
        return txReceipt.status;
      }
      timeout--;
    }
  }

  return ret;
}

export const transferToken = async (chainType, token, to, value, selectedWallet, address) => {
  if ( !value || !selectedWallet || !address) {
    message.error("Sorry, deposit input params error");
    return false;
  }
  let ret = false;
  console.log('transferToken:', chainType, token, to, value);
  let txParam = {gasPrice: '0x3B9ACA00'};
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
        web3.utils.toWei(value.toString())).estimateGas({gas: 1e7, from: address, value: txParam.value});
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
        console.log('waiting...');
      } else {
        return txReceipt.status;
      }
      timeout--;
    }
  }

  return ret;
}

//// V1 code -----

// const getOptionsList = async () => {
//   await initSmartContract();
//   let localInfo = [];
//   let web3 = getWeb3();
//   let str = window.localStorage.getItem("OptionsInfo");
//   if (str && str.length > 0) {
//     localInfo = JSON.parse(str);
//   }

//   let createOptionsEventStartBlock = window.localStorage.getItem("createOptionsEventStartBlock");
//   if (!createOptionsEventStartBlock || createOptionsEventStartBlock.length === 0) {
//     createOptionsEventStartBlock = defaultStartBlock;
//   }

//   let funcs = [];

//   funcs.push(web3.eth.getBlockNumber());

//   funcs.push(scs.opm.getPastEvents('CreateOptions', {
//     fromBlock: createOptionsEventStartBlock,
//   }));

//   funcs.push(scs.opm.getPastEvents('Exercise', {
//     fromBlock: createOptionsEventStartBlock,
//   }));

//   let blockNumber, eventCreate, eventExercise;
//   [blockNumber, eventCreate, eventExercise] = await Promise.all(funcs);
//   funcs = [];

//   window.localStorage.setItem('createOptionsEventStartBlock', blockNumber + 1);

//   for (let i = 0; i < eventCreate.length; i++) {
//     let op = {
//       collateral: eventCreate[i].returnValues.collateral,
//       expiration: eventCreate[i].returnValues.expiration,
//       optType: eventCreate[i].returnValues.optType,
//       strikePrice: eventCreate[i].returnValues.strikePrice,
//       tokenAddress: eventCreate[i].returnValues.tokenAddress,
//       underlyingAssets: eventCreate[i].returnValues.underlyingAssets,
//       status: "active"
//     };

//     localInfo.push(op);
//   }

//   let activeAddr = [];
//   // check exercise
//   for (let i = 0; i < localInfo.length; i++) {
//     if (localInfo[i].status !== 'exercise') {
//       for (let m = 0; m < eventExercise.length; m++) {
//         if (localInfo[i].tokenAddress.toLowerCase() === eventExercise[m].returnValues.optionsToken.toLowerCase()) {
//           localInfo[i].status = 'exercise';
//         }
//       }

//       if (localInfo[i].status === 'active') {
//         activeAddr.push(localInfo[i].tokenAddress);
//       }
//     }
//   }

//   funcs = [];
//   // check timeout
//   for (let i = 0; i < activeAddr.length; i++) {
//     funcs.push(scs.mmt.methods.isEligibleOptionsToken(activeAddr[i]).call());
//   }

//   let ret = await Promise.all(funcs);

//   if (ret && ret.length > 0) {
//     for (let i = 0; i < ret.length; i++) {
//       if (!ret[i]) {
//         localInfo = localInfo.map((v) => {
//           if (v.tokenAddress === activeAddr[i]) {
//             v.status = 'timeout';
//           }
//           return v;
//         })
//       }
//     }
//   }

//   str = JSON.stringify(localInfo);

//   window.localStorage.setItem('OptionsInfo', str);

//   return localInfo;
// }

// const getPrices = async (tokens) => {
//   let tmpFuncs = [];
//   for (let i = 0; i < tokens.length; i++) {
//     tmpFuncs.push(scs.oracle.methods.getBuyOptionsPrice(tokens[i].tokenAddress).call());
//     tmpFuncs.push(scs.oracle.methods.getSellOptionsPrice(tokens[i].tokenAddress).call());
//     tmpFuncs.push(scs.oracle.methods.getUnderlyingPrice(tokens[i].underlyingAssetsRaw).call());
//   }

//   tmpFuncs.push(scs.oracle.methods.getPrice(wanTokenAddress).call());
//   tmpFuncs.push(scs.oracle.methods.getPrice(fnxTokenAddress).call());

//   let ret = await Promise.all(tmpFuncs);
//   let wanPrice = ret[3 * tokens.length];
//   let fnxPrice = ret[3 * tokens.length + 1];

//   for (let i = 0; i < tokens.length; i++) {
//     tokens[i].price = '$' + priceConvert(ret[i * 3]);           // buy price
//     tokens[i].sellPrice = '$' + priceConvert(ret[i * 3 + 1]);   // sell price
//     tokens[i].underlyingAssetsPrice = '$' + priceConvert(ret[i * 3 + 2]);

//     tokens[i].tokenPrice = [];
//     tokens[i].tokenPrice[0] = priceConvert(wanPrice);
//     tokens[i].tokenPrice[1] = priceConvert(fnxPrice);
//   }
// }

// const getOpLiquidityAll = async (tokens) => {
//   let tmpFuncs = [];
//   for (let i = 0; i < tokens.length; i++) {
//     tmpFuncs.push(getTokenLiquidity(tokens[i].tokenAddress, wanTokenAddress));
//     tmpFuncs.push(getTokenLiquidity(tokens[i].tokenAddress, fnxTokenAddress));
//   }

//   let ret = await Promise.all(tmpFuncs);
//   for (let i = 0; i < tokens.length; i++) {
//     tokens[i].liquidityAll = [];
//     tokens[i].liquidityAll[0] = ret[i * 2];
//     tokens[i].liquidityAll[1] = ret[i * 2 + 1];
//   }
// }

// const getHistory = async (allTokens, address) => {
//   let history = [];
//   let startBlock = defaultStartBlock;
//   if (address && address != null) {
//     let localAddress = window.localStorage.getItem('localAddress');
//     if (localAddress && address.toLowerCase() === localAddress.toLowerCase()) {
//       startBlock = window.localStorage.getItem('historyStartBlock');
//       if (!startBlock || startBlock === '') {
//         startBlock = defaultStartBlock;
//       } else {
//         let str = window.localStorage.getItem('history');
//         history = JSON.parse(str);
//       }
//     }
//     let blockNumber = await getWeb3().eth.getBlockNumber();

//     for (let i = 0; i < allTokens.length; i++) {
//       let token = allTokens[i].tokenAddress;
//       let subInfo = getSubInfo(allTokens[i]);
//       let tmpFuncs = [];
//       tmpFuncs.push(scs.mmt.getPastEvents('BuyOptionsToken', {
//         filter: { from: address, optionsToken: token },
//         fromBlock: startBlock,
//       }));
//       tmpFuncs.push(scs.mmt.getPastEvents('SellOptionsToken', {
//         filter: { from: address, optionsToken: token },
//         fromBlock: startBlock,
//       }));
//       tmpFuncs.push(scs.opm.getPastEvents('ExercisePayback', {
//         filter: { recieptor: address, optionsToken: token },
//         fromBlock: startBlock,
//       }));

//       let events, sellEvents, exerciseEvents;
//       [events, sellEvents, exerciseEvents] = await Promise.all(tmpFuncs);
//       // console.log('events', events, sellEvents);

//       if (events.length > 0) {
//         let totalAmount = getWeb3().utils.toBN('0');
//         let totalPrice = getWeb3().utils.toBN('0');
//         for (let m = 0; m < events.length; m++) {
//           totalAmount = totalAmount.add(getWeb3().utils.toBN(events[m].returnValues.amount));
//           totalPrice = totalPrice.add(getWeb3().utils.toBN(events[m].returnValues.amount).mul(getWeb3().utils.toBN(events[m].returnValues.optionsPrice)));

//           //----history-----
//           history.push({
//             blockNumber: events[m].blockNumber,
//             txHash: events[m].transactionHash,
//             amount: getWeb3().utils.fromWei(events[m].returnValues.amount),
//             optionsPrice: '$' + priceConvert(events[m].returnValues.optionsPrice),
//             type: 'buy',
//             tokenName: subInfo.tokenName,
//             currencyAmount: Number(getWeb3().utils.fromWei(events[m].returnValues.totalPay)).toFixed(8) + (events[m].returnValues.settlementCurrency === wanTokenAddress ? " WAN" : " FNX"),
//             key: events[m].transactionHash,
//           });
//         }
//       }

//       events = sellEvents;
//       if (events.length > 0) {
//         for (let m = 0; m < events.length; m++) {
//           //----history-----
//           history.push({
//             blockNumber: events[m].blockNumber,
//             txHash: events[m].transactionHash,
//             amount: getWeb3().utils.fromWei(events[m].returnValues.amount),
//             optionsPrice: '$' + priceConvert(events[m].returnValues.optionsPrice),
//             type: 'sell',
//             tokenName: subInfo.tokenName,
//             currencyAmount: Number(getWeb3().utils.fromWei(events[m].returnValues.payback)).toFixed(8) + (events[m].returnValues.settlementCurrency === wanTokenAddress ? " WAN" : " FNX"),
//             key: events[m].transactionHash
//           });
//         }
//       }

//       events = exerciseEvents;
//       if (events.length > 0) {
//         for (let m = 0; m < events.length; m++) {
//           //----history-----
//           history.push({
//             amount: await getBalance(events[m].returnValues.optionsToken, address),
//             optionsPrice: '--',
//             blockNumber: events[m].blockNumber,
//             txHash: events[m].transactionHash,
//             type: 'exercise',
//             tokenName: subInfo.tokenName,
//             currencyAmount: Number(getWeb3().utils.fromWei(events[m].returnValues.payback)).toFixed(8) + (events[m].returnValues.collateral === wanTokenAddress ? " WAN" : " FNX"),
//             key: events[m].transactionHash
//           });
//         }
//       }
//     }

//     window.localStorage.setItem('localAddress', address);
//     window.localStorage.setItem('historyStartBlock', blockNumber + 1);
//     window.localStorage.setItem('history', JSON.stringify(history));
//   }
//   return history;
// }

// const getSubInfo = (opToken) => {
//   let subInfo = {
//     type: opToken.optType === '0' ? "call" : "put",
//     underlyingAssets: opToken.underlyingAssets === '1' ? 'BTC' : 'ETH', // 1: BTC, 2: ETH
//     underlyingAssetsRaw: opToken.underlyingAssets,
//     strikePrice: '$' + priceConvert(opToken.strikePrice),
//     expiration: (new Date(opToken.expiration * 1000)).toDateString().split(' ').slice(1, 3).join(' '),
//     key: opToken.tokenAddress,
//     optionsToken: opToken.tokenAddress,
//     tokenAddress: opToken.tokenAddress,
//     currency: ['WAN', 'FNX'],
//     status: opToken.status,
//   };

//   subInfo.tokenName = [subInfo.underlyingAssets, subInfo.type, subInfo.expiration, subInfo.strikePrice].join(', ');

//   return subInfo;
// }

// const getAssets = async (exerciseOp, nowTokens, address) => {
//   let assets = [];

//   if (address && address != null) {
//     let funcs = [];
//     for (let i = 0; i < exerciseOp.length; i++) {
//       funcs.push(getBalance(exerciseOp[i].tokenAddress, address));
//     }

//     let ret = await Promise.all(funcs);
//     funcs = [];

//     // get exercised op
//     for (let i = 0; i < exerciseOp.length; i++) {
//       if (ret[i] > 0) {
//         let subInfo = exerciseOp[i];
//         assets.push({
//           tokenName: subInfo.tokenName,
//           underlyingAssetsPrice: '--',
//           strikePrice: subInfo.strikePrice,
//           amount: ret[i],
//           price: '--',
//           expectedReturn: '--',
//           status: subInfo.status,
//           key: subInfo.tokenName,
//         });
//       }
//     }

//     //get now op
//     for (let i = 0; i < nowTokens.length; i++) {
//       funcs.push(getBalance(nowTokens[i].tokenAddress, address));
//     }

//     ret = await Promise.all(funcs);
//     funcs = [];

//     // get exercised op
//     for (let i = 0; i < nowTokens.length; i++) {
//       if (ret[i] > 0) {
//         let subInfo = nowTokens[i];
//         assets.push({
//           tokenName: subInfo.tokenName,
//           underlyingAssetsPrice: subInfo.underlyingAssetsPrice,
//           strikePrice: subInfo.strikePrice,
//           amount: ret[i],
//           price: subInfo.sellPrice,
//           percentageOfCollateral: subInfo.percentageOfCollateral,
//           expectedReturn: '$' + Number((Number(subInfo.sellPrice.replace('$', ''))) * ret[i]).toFixed(8),
//           key: subInfo.tokenName,
//         });
//       }
//     }
//   }
//   return assets;
// }

// export const getOptionsInfo = async (address) => {
//   console.log('****getOptionsInfo****', new Date().toISOString());

//   let opTokens = await getOptionsList();
//   let info = {};
//   info.optionTokenInfo = [];
//   info.assets = [];
//   info.history = [];
//   let exerciseOp = [];
//   for (let i = 0; i < opTokens.length; i++) {
//     if (opTokens[i].status !== 'exercise') {
//       info.optionTokenInfo.push(getSubInfo(opTokens[i]));
//     } else {
//       exerciseOp.push(getSubInfo(opTokens[i]));
//     }
//   }

//   await getPrices(info.optionTokenInfo);
//   await getOpLiquidityAll(info.optionTokenInfo);

//   info.assets = await getAssets(exerciseOp, info.optionTokenInfo, address);
//   info.history = await getHistory(opTokens, address);

//   if (info.history) {
//     info.history.sort((a, b) => (b.blockNumber - a.blockNumber));
//   }

//   if (info.assets) {
//     info.assets.sort().reverse();
//   }

//   info.transactionFee = await scs.opm.methods.getTransactionFee().call();
//   info.transactionFee = eval(`${info.transactionFee[0]}e${info.transactionFee[1]}`);

//   return info;
// }

// function priceConvert(price) {
//   if (Number(price) / decimals > 1e30) {
//     return " Timeout";
//   }
//   return Number((Number(price) / decimals).toFixed(4));
// }

// export const getTokenLiquidity = async (optionsTokenAddress, payTokenAddress) => {
//   let sellOrderList = await scs.mmt.methods.getSellOrderList(optionsTokenAddress, payTokenAddress).call();

//   let liquidity = sellOrderList[2].length > 0 ? eval(sellOrderList[2].join('+')) : 0;
//   return getWeb3().utils.fromWei(liquidity.toString());
// }

// export const getBalance = async (tokenAddress, address) => {
//   let balance = 0;
//   try {
//     if (tokenAddress === '0x0000000000000000000000000000000000000000') {
//       balance = await getWeb3().eth.getBalance(address);
//     } else {
//       let web3 = getWeb3();
//       let token = new web3.eth.Contract(abiErc20, tokenAddress);
//       balance = await token.methods.balanceOf(address).call();
//     }
//   } catch (err) {
//     console.log(err);
//   }

//   return Number(getWeb3().utils.fromWei(balance.toString()));
// }

// export const approve = async (tokenAddr, owner, amount, selectedWallet) => {
//   if (!tokenAddr || !amount || !selectedWallet) {
//     message.error("approve input params error");
//     return false;
//   }
//   console.log('approve', tokenAddr, amount);
//   if (tokenAddr !== '0x0000000000000000000000000000000000000000') {
//     // console.log('approve token', tokenAddr, amount);
//     let web3 = getWeb3();
//     let token = new web3.eth.Contract(abiErc20, tokenAddr);
//     let data = await token.methods.approve(matchMakingTradingSCAddress, getWeb3().utils.toWei(amount.toString())).encodeABI();
//     const params = {
//       to: tokenAddr,
//       data,
//       value: 0,
//       gasPrice: "0x3B9ACA00",
//       gasLimit: "0x989680", // 10,000,000
//     };
//     let txID = await sendTransaction(selectedWallet, params);
//     console.log('approve tx id: ', txID);
//     if (!txID) {
//       return false;
//     }
//     message.info('approve tx sent: ' + txID);
//     let watch = new Promise((resolve, reject) => {
//       watchTransactionStatus(txID, (status) => {
//         if (!status) {
//           message.error("token approve failed");
//           reject();
//         }
//         message.info("approve success: " + status);
//         resolve();
//       })
//     });

//     await watch;
//   }
//   return true;
// }

// export const generateBuyOptionsTokenData = async (info) => {
//   console.log('generateBuyOptionsTokenData', info);
//   let encodedData = await scs.mmt.methods.buyOptionsToken(
//     info.optionsToken,
//     getWeb3().utils.toWei(info.amount.toString()),
//     info.buyUseToken,
//     getWeb3().utils.toWei(info.currencyAmount.toString())
//   ).encodeABI();
//   return encodedData;
// }

// export const generateTx = async (data, currencyAmount, address, selectedWallet, info) => {
//   const txParam = {
//     to: matchMakingTradingSCAddress,
//     data,
//     value: currencyAmount,
//     gasPrice: "0x3B9ACA00",
//     // gasLimit: "0x989680", // 10,000,000
//   };
//   // console.log('wallet type:', selectedWallet.type());
//   if (selectedWallet.type() === "EXTENSION") {
//     txParam.gas = await estimateGas(info, currencyAmount, address);
//     if (txParam.gas === -1) {
//       return null;
//     }
//   } else {
//     txParam.gasLimit = await estimateGas(info, currencyAmount, address);
//     if (txParam.gasLimit === -1) {
//       return null;
//     }
//   }

//   return txParam;
// }

// export const estimateGas = async (info, value, address) => {
//   try {
//     // console.log('estimateGas:', info, value, address);
//     // let ret = await getWeb3().eth.estimateGas(params, { from: address, value });
//     let ret = await scs.mmt.methods.buyOptionsToken(
//       info.optionsToken,
//       getWeb3().utils.toWei(info.amount.toString()),
//       info.buyUseToken,
//       getWeb3().utils.toWei(info.currencyAmount.toString())
//     ).estimateGas({ gas: 10000000, value, from: address });

//     if (ret == 10000000) {
//       console.log('estimateGas failed:', info.optionsToken, getWeb3().utils.toWei(info.amount.toString()), info.buyUseToken, getWeb3().utils.toWei(info.currencyAmount.toString()));
//       return -1;
//       // return '0x' + (8000000).toString(16);
//     }
//     // console.log('estimateGas:', '0x' + (ret + 30000).toString(16));
//     return '0x' + (ret + 30000).toString(16);
//   } catch (err) {
//     message.error(err.toString());
//     return -1;
//   }
// }

// export const sendTransaction = async (selectedWallet, params) => {
//   try {
//     // console.log('sendTransaction:', params);
//     let transactionID = await selectedWallet.sendTransaction(params);
//     console.log('sendTransaction:', transactionID);
//     return transactionID;
//   } catch (error) {
//     if (error.toString().indexOf('Unlock') !== -1) {
//       message.info("Please Unlock Your Wallet");
//     } else {
//       message.error('sendTransaction Failed');
//       console.log('sendTransaction Failed', error.toString());
//     }
//   }
//   return null;
// }

// export const getTransactionReceipt = async (txID) => {
//   try {
//     let txReceipt = await getWeb3().eth.getTransactionReceipt(txID);
//     return txReceipt;
//   } catch (error) {
//     message.error(error.toString());
//   }
//   return null;
// }

// export const watchTransactionStatus = (txID, callback) => {
//   if (!txID) {
//     console.log('watchTransactionStatus txID is null');
//     return;
//   }
//   const getTransactionStatus = async () => {
//     const txReceipt = await getTransactionReceipt(txID);
//     if (!txReceipt) {
//       setTimeout(() => getTransactionStatus(txID), 3000);
//     } else if (callback) {
//       callback(txReceipt.status);
//     } else {
//       message.info('success');
//     }
//   };
//   setTimeout(() => getTransactionStatus(txID), 3000);
// };

// export const getBuyOptionsOrderAmount = async (optionsAddr, buyUseToken) => {
//   let buyOrderList = await scs.mmt.methods.getPayOrderList(optionsAddr, buyUseToken).call();
//   // console.log('buyOrderList:', buyOrderList);
//   if (buyOrderList.length < 4) {
//     return 0;
//   }
//   let totalBuyAmount = getWeb3().utils.toBN(0);
//   for (let i = 0; i < buyOrderList[2].length; i++) {
//     totalBuyAmount = totalBuyAmount.add(getWeb3().utils.toBN(buyOrderList[2][i]));
//   }

//   return Number(getWeb3().utils.fromWei(totalBuyAmount));
// }

// export const sellOptionsToken = async (address, selectedWallet, info, type) => {
//   try {
//     //approve
//     let ret = await approve(info.optionsToken, address, info.amount, selectedWallet);
//     if (!ret) {
//       return false;
//     }
//     // console.log('approve sent');
//     let gas;
//     if (type === 'sell') {
//       gas = await scs.mmt.methods.sellOptionsToken(info.optionsToken, getWeb3().utils.toWei(info.sellAmount.toString()), info.buyUseToken).estimateGas({ gas: 10000000, from: address });
//     } else {
//       gas = await scs.mmt.methods.addSellOrder(info.optionsToken, info.buyUseToken, getWeb3().utils.toWei(info.sellAmount.toString())).estimateGas({ gas: 10000000, from: address });
//     }
//     //sell
//     if (gas === 10000000) {
//       message.error('Estimate Gas Failed');
//       console.log('Estimate Gas Failed');
//       return false;
//     }

//     // console.log('estimate gas:', gas);

//     gas = '0x' + (gas + 30000).toString(16);; // add normal tx cost
//     let data;
//     if (type === 'sell') {
//       data = await scs.mmt.methods.sellOptionsToken(info.optionsToken, getWeb3().utils.toWei(info.sellAmount.toString()), info.buyUseToken).encodeABI();
//     } else {
//       data = await scs.mmt.methods.addSellOrder(info.optionsToken, info.buyUseToken, getWeb3().utils.toWei(info.sellAmount.toString())).encodeABI();
//     }
//     // console.log('data:', data);
//     console.log('sell Amount:', getWeb3().utils.toWei(info.sellAmount.toString()));

//     const txParam = {
//       to: matchMakingTradingSCAddress,
//       data,
//       value: 0,
//       gasPrice: "0x3B9ACA00",
//       // gasLimit: "0x989680", // 10,000,000
//     };

//     if (selectedWallet.type() === "EXTENSION") {
//       txParam.gas = gas;
//     } else {
//       txParam.gasLimit = gas;
//     }

//     let transactionID = await selectedWallet.sendTransaction(txParam);
//     // console.log('sendTransaction:', transactionID);
//     message.info("Transaction Submitted, txHash:" + transactionID);
//     let timeout = 20;
//     while (timeout > 0) {
//       const txReceipt = await getTransactionReceipt(transactionID);
//       if (!txReceipt) {
//         await sleep(3000);
//       } else {
//         return txReceipt.status;
//       }
//       timeout--;
//     }
//   } catch (error) {
//     console.log('Sell Options Token Error:', error);
//     if (error.toString().indexOf('Unlock') !== -1) {
//       message.info("Please Unlock Your Wallet");
//     } else {
//       message.error("Sell Options Token Error");
//     }
//   }
//   return false;
// }

// export const startEventScan = (blockNumber, callback) => {
//   let eventScan = async (blockNumber) => {
//     console.log('start scan events...from blockNumber', blockNumber, new Date().toISOString());
//     let tmpFuncs = [];
//     tmpFuncs.push(scs.opm.getPastEvents('CreateOptions', {
//       fromBlock: blockNumber,
//     }));

//     tmpFuncs.push(scs.opm.getPastEvents('AddCollateral', {
//       fromBlock: blockNumber,
//     }));

//     tmpFuncs.push(scs.opm.getPastEvents('WithdrawCollateral', {
//       fromBlock: blockNumber,
//     }));

//     tmpFuncs.push(scs.opm.getPastEvents('Exercise', {
//       fromBlock: blockNumber,
//     }));

//     tmpFuncs.push(scs.opm.getPastEvents('Liquidate', {
//       fromBlock: blockNumber,
//     }));

//     tmpFuncs.push(scs.mmt.getPastEvents('AddSellOrder', {
//       fromBlock: blockNumber,
//     }));

//     tmpFuncs.push(scs.mmt.getPastEvents('RedeemSellOrder', {
//       fromBlock: blockNumber,
//     }));

//     tmpFuncs.push(scs.mmt.getPastEvents('BuyOptionsToken', {
//       fromBlock: blockNumber,
//     }));

//     tmpFuncs.push(scs.mmt.getPastEvents('SellOptionsToken', {
//       fromBlock: blockNumber,
//     }));

//     tmpFuncs.push(scs.mmt.getPastEvents('ReturnExpiredOrders', {
//       fromBlock: blockNumber,
//     }));

//     let ret = await Promise.all(tmpFuncs);
//     for (let i = 0; i < ret.length; i++) {
//       if (ret[i].length > 0) {
//         blockNumber = Number(ret[i][0].blockNumber) + 1;
//         callback(false);
//         break;
//       }
//     }
//     setTimeout(eventScan, 30000, blockNumber);
//   }

//   setTimeout(eventScan, 30000, blockNumber);
// }

// export const getWeb3Obj = () => {
//   return getWeb3();
// }
