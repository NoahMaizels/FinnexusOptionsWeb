
export function getOrderHistoryColumn (intl) {
  const orderHistoryColumn = [
    {
      title: intl.messages['table.time'],
      dataIndex: "time",
      key: 'time',
    },
    {
      title: intl.messages['table.type'],
      dataIndex: "type",
      key: 'type',
    },
    {
      title: intl.messages['table.optionsName'],
      dataIndex: "name",
      key: 'name',
    },
    {
      title: intl.messages['table.amount'],
      dataIndex: "amount",
      key: 'amount',
    },
    {
      title: intl.messages['table.paid'],
      dataIndex: "paid",
      key: 'paid',
    },
    {
      title: intl.messages['table.status'],
      dataIndex: "status",
      key: 'status',
    },
  ];

  return orderHistoryColumn;
}

export function getCollateralHistoryColumn (intl) {
  const collateralHistoryColumn = [
    {
      title: intl.messages['table.time'],
      dataIndex: "time",
      key: 'time',
    },
    {
      title: intl.messages['table.token'],
      dataIndex: "token",
      key: 'token',
    },
    {
      title: intl.messages['table.type'],
      dataIndex: "type",
      key: 'type',
    },
    {
      title: intl.messages['table.FPTAmount'],
      dataIndex: "amount",
      key: 'amount',
    },
    {
      title: intl.messages['table.value'],
      dataIndex: "value",
      key: 'value',
    },
    {
      title: intl.messages['table.currency'],
      dataIndex: "currency",
      key: 'currency',
    },
    {
      title: intl.messages['table.status'],
      dataIndex: "status",
      key: 'status',
    }
  ];
  return collateralHistoryColumn;
}

export function getTransferHistoryColumn (intl) {
  const transferHistoryColumn = [
    {
      title: intl.messages['table.time'],
      dataIndex: "time",
      key: 'time',
    },
    {
      title: intl.messages['table.token'],
      dataIndex: "token",
      key: 'token',
    },
    {
      title: intl.messages['table.to'],
      dataIndex: "to",
      key: 'to',
    },
    {
      title: intl.messages['table.amount'],
      dataIndex: "amount",
      key: 'amount',
    },
    {
      title: intl.messages['table.status'],
      dataIndex: "status",
      key: 'status',
    },
  ];

  return transferHistoryColumn;
}