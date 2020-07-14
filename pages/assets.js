import { Table } from 'antd';
import styles from './assets.css';
import styled from 'styled-components';
import { Body, Center, Space, ConnectWalletSub, InALine } from '../components';
import { Row, Col, Statistic, } from 'antd';
import { Component } from 'react';


export default class Assets extends Component {

  column = [
    {
      title: 'Assets',
      dataIndex: "assets",
      key: 'assets',
    },
    {
      title: 'Balance',
      dataIndex: "balance",
      key: 'balance',
    },
    {
      title: '$ USD',
      dataIndex: "usd",
      key: 'usd',
    },
    {
      title: 'Current return',
      dataIndex: "currentReturn",
      key: 'currentReturn',
    },
    {
      title: 'Expiration',
      dataIndex: "expiration",
      key: 'expiration',
    },
    {
      title: 'Operation',
      dataIndex: "operation",
      key: 'operation',
      render: (value) => {
        console.log('value:',value);
        if (value === 0) {
          return (
            <InALine>
              <SmallButton>Buy</SmallButton>
              <SmallButton>Sell</SmallButton>
              <SmallButton>Transfer</SmallButton>
            </InALine>
          );
        } else {
          return (
            <InALine>
              <SmallButton>Exercise</SmallButton>
              <SmallButton>Close</SmallButton>
              <SmallButton>Transfer</SmallButton>
            </InALine>
          );
        }
      }
    },
  ]

  demoData = [
    {
      assets: "ETH",
      balance: "12.341234",
      usd: "$ 20043.2345",
      currentReturn: "--",
      expiration: '--',
      operation: 0
    },
    {
      assets: "WAN",
      balance: "12.341234",
      usd: "$ 20043.2345",
      currentReturn: "--",
      expiration: '--',
      operation: 0
    },
    {
      assets: "Shares token(WRC20)",
      balance: "12.341234",
      usd: "$ 20043.2345",
      currentReturn: "--",
      expiration: '--',
      operation: 0
    },
    {
      assets: "Shares token(ERC20)",
      balance: "12.341234",
      usd: "$ 20043.2345",
      currentReturn: "--",
      expiration: '--',
      operation: 0
    },
    {
      assets: "BTC put, 9th July, $8200(ERC20)",
      balance: "12.341234",
      usd: "$ 20043.2345",
      currentReturn: "$ 12.31234",
      expiration: '3d 18h 15m',
      operation: 1
    },
    {
      assets: "BTC call, 9th July, $8200(WRC20)",
      balance: "12.341234",
      usd: "$ 20043.2345",
      currentReturn: "$ 234.12312",
      expiration: '12d 20h 20m',
      operation: 1
    },
  ]

  render() {
    return (
      <Center>
        <Body>
          <Space />
          <Row gutter={[24, 40]}>
            <Col span={4}><Statistic title="FNX(ERC20) Value" value={'350.3413'} suffix="$" /></Col>
            <Col span={4}><Statistic title="FNX(ERC20) Balance" value={'200.1234'} suffix="" /></Col>
            <Col span={4}>
              <SmallButton>Buy</SmallButton>
              <SmallButton>Sell</SmallButton>
              <SmallButton>Transfer</SmallButton>
            </Col>
            <Col span={4}><Statistic title="FNX(WRC20) Value" value={'50.3413'} suffix="$" /></Col>
            <Col span={4}><Statistic title="FNX(WRC20) Balance" value={'30.3413'} suffix="" /></Col>
            <Col span={4}>
              <SmallButton>Buy</SmallButton>
              <SmallButton>Sell</SmallButton>
              <SmallButton>Transfer</SmallButton>
            </Col>
          </Row>
          <Space2 />
          <Table columns={this.column} dataSource={this.demoData}/>
        </Body>
      </Center>
    );
  }
}

const SmallButton = styled(ConnectWalletSub)`
  height: 20px;
  margin: 1px 5px 1px 5px;
  width: 70%;
  border-radius: 5px;
`;

const Space2 = styled(Space)`
  height: 30px;
`;