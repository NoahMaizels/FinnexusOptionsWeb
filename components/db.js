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
  return db.get('order').filter({ address }).sortBy('time').value().reverse();
}

export const insertOrderHistory = (address, time, hash, name, amount, paid, status) => {
  db.get('order').insert(
    { address, time, hash, name, amount, paid, status }
  ).write();
}

export const updateOrderStatus = (hash, status) => {
  db.get('order').find({ hash }).assign({ status }).write();
}

// -------collateral----------
export const getCollateralHistory = (address) => {
  return db.get('collateral').filter({ address }).sortBy('time').value().reverse();
}

export const insertCollateralHistory = (address, time, hash, sharesName, sharesAmount, value, currency, status) => {
  db.get('collateral').insert(
    { address, time, hash, sharesName, sharesAmount, value, currency, status }
  ).write();
}

export const updateOrderStatus = (hash, status) => {
  db.get('collateral').find({ hash }).assign({ status }).write();
}

// ---------transfer----------
export const getTransferHistory = (address) => {
  return db.get('transfer').filter({ address }).sortBy('time').value().reverse();
}

export const insertTransferHistory = (address, time, hash, token, to, amount, status) => {
  db.get('transfer').insert(
    { address, time, hash, token, to, amount, status }
  ).write();
}

export const updateTransferStatus = (hash, status) => {
  db.get('transfer').find({ hash }).assign({ status }).write();
}
// ---------mine--------------