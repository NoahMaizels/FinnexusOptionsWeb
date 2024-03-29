import low from 'lowdb';
import LocalStorage from 'lowdb/adapters/LocalStorage';

const adapter = new LocalStorage('options-v2');
const db = low(adapter);

db.defaults({
  order: [],
  collateral: [],
  transfer: [],
  mine: [],
}).write();

//------order----------
export const getOrderHistory = (address) => {
  // console.log('getOrderHistory', db.get('order').filter({ address }).sortBy('time').value().reverse());
  return db.get('order').filter({ address }).sortBy('time').value().reverse();
}

export const insertOrderHistory = (address, time, name, amount, paid, type, status) => {
  // console.log('insertOrderHistory', address, time, name, amount, paid, type, status);
  db.get('order').push(
    { address, time, name, amount, paid, type, status, key: time }
  ).write();
}

export const updateOrderStatus = (time, status) => {
  db.get('order').find({ time }).assign({ status }).write();
}

// -------collateral----------
export const getCollateralHistory = (address) => {
  return db.get('collateral').filter({ address }).sortBy('time').value().reverse();
}

export const insertCollateralHistory = (address, time, token, type, amount, value, currency, status) => {
  db.get('collateral').push(
    { address, time, token, type, amount, value, currency, status, key: time }
  ).write();
}

export const updateCollateralStatus = (time, status) => {
  db.get('collateral').find({ time }).assign({ status }).write();
}

// ---------transfer----------
export const getTransferHistory = (address) => {
  return db.get('transfer').filter({ address }).sortBy('time').value().reverse();
}

export const insertTransferHistory = (address, time, token, to, amount, status) => {
  db.get('transfer').push(
    { address, time, token, to, amount, status, key: time }
  ).write();
}

export const updateTransferStatus = (time, status) => {
  db.get('transfer').find({ time }).assign({ status }).write();
}
// ---------mine--------------