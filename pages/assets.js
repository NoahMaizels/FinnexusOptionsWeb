import { Table } from 'antd';
import styles from './assets.css';
import styled from 'styled-components';
import { Body, Center, Space, ConnectWalletSub, InALine, Box, VerticalLine, InALineLeft, BigTitle, MyStatistic, InALineAround, HistoryTable } from '../components';
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
        console.log('value:', value);
        if (value === 0) {
          return (
            <InALine>
              <SmallButton><img src={require('../img/buy.png')} style={{ marginRight: "10px" }} />Buy</SmallButton>
              <SmallButton><img src={require('../img/sell.png')} style={{ marginRight: "10px" }} />Sell</SmallButton>
              <SmallButton><img src={require('../img/transfer.png')} style={{ marginRight: "10px" }} />Transfer</SmallButton>
            </InALine>
          );
        } else {
          return (
            <InALine>
              <SmallButton><img src={require('../img/buy.png')} style={{ marginRight: "10px" }} />Exercise</SmallButton>
              <SmallButton><img src={require('../img/sell.png')} style={{ marginRight: "10px" }} />Sell</SmallButton>
              <SmallButton><img src={require('../img/transfer.png')} style={{ marginRight: "10px" }} />Transfer</SmallButton>
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
          <Space2 />
          <Row style={{ marginLeft: '20px' }}>
            <Col span={12}>
              <Box2>
                <Row>
                  <InALineLeft>
                    <VerticalLine />
                    <SmallTitle>FNX</SmallTitle>
                    <SmallTitle dark>(ERC20)</SmallTitle>
                  </InALineLeft>
                </Row>
                <Row>
                  <InALineAround style={{ width: "100%" }}>
                    <div>
                      <MyStatistic style={{ position: "relative", left: "34px" }} coldColor value={"1000.34"} suffix="$" title={"Value"} />
                    </div>
                    <VLine />
                    <div>
                      <MyStatistic style={{ position: "relative", left: "-38px" }} value={"2000.12"} title={"Balance"} />
                    </div>
                  </InALineAround>
                </Row>
                <Row><HLine /></Row>
                <Row>
                  <InALineAround style={{ width: "100%" }}>
                    <MyButton><img src={require('../img/buy.png')} style={{ marginRight: "10px" }} />Buy</MyButton>
                    <MyButton><img src={require('../img/sell.png')} style={{ marginRight: "10px" }} />Sell</MyButton>
                    <MyButton><img src={require('../img/transfer.png')} style={{ marginRight: "10px" }} />Transfer</MyButton>
                  </InALineAround>
                </Row>
              </Box2>
            </Col>
            <Col span={12}>
              <Box2>
                <Row>
                  <InALineLeft>
                    <VerticalLine />
                    <SmallTitle>FNX</SmallTitle>
                    <SmallTitle dark>(WRC20)</SmallTitle>
                  </InALineLeft>
                </Row>
                <Row>
                  <InALineAround style={{ width: "100%" }}>
                    <div>
                      <MyStatistic style={{ position: "relative", left: "34px" }} coldColor value={"200.34"} suffix="$" title={"Value"} />
                    </div>
                    <VLine />
                    <div>
                      <MyStatistic style={{ position: "relative", left: "-38px" }} value={"300.12"} title={"Balance"} />
                    </div>
                  </InALineAround>
                </Row>
                <Row><HLine /></Row>
                <Row>
                  <InALineAround style={{ width: "100%" }}>
                    <MyButton><img src={require('../img/buy.png')} style={{ marginRight: "10px" }} />Buy</MyButton>
                    <MyButton><img src={require('../img/sell.png')} style={{ marginRight: "10px" }} />Sell</MyButton>
                    <MyButton><img src={require('../img/transfer.png')} style={{ marginRight: "10px" }} />Transfer</MyButton>
                  </InALineAround>
                </Row>
              </Box2>
            </Col>
          </Row>
          <Space2 />
          <AssetsTable columns={this.column} dataSource={this.demoData} />
        </Body>
      </Center>
    );
  }
}

const AssetsTable = styled(HistoryTable)`
  width: 1400px;
`;

const MyButton = styled(ConnectWalletSub)`
  width:135px;
  height:45px;
  /* background:linear-gradient(90deg,rgba(99,125,255,1) 0%,rgba(99,176,255,1) 100%); */
  background: transparent;
  border-radius:23px;
  font-family:Helvetica Neue;
  font-weight:400;
  color:rgba(255,255,255,1);
  line-height:15px;
`;

const SmallButton = styled(MyButton)`
  width: 116px;
  margin: 0px;
  padding: 0px;
`;

const Space2 = styled(Space)`
  height: 20px;
`;

const Box2 = styled(Box)`
  width:690px;
  height:290px;
  border-radius:4px;
  padding: 20px;
`;

const HLine = styled.div`
  width:648px;
  height:1px;
  background:rgba(255,255,255,1);
  border-bottom:1px solid rgba(255,255,255,1);
  opacity:0.1;
  margin-bottom: 20px;

`;

const VLine = styled.div`
  width:1px;
  height:101px;
  background:rgba(255,255,255,1);
  border-left:1px solid rgba(255,255,255,1);
  opacity:0.1;
  margin-bottom: 25px;
`;

const SmallTitle = styled(BigTitle)`
  font-weight: 400;
  font-size: 18px;
  margin-top: 6px;
  opacity: ${props => props.dark ? '0.5' : '1'};
  margin-left: ${props => props.dark ? '10px' : '0px'};
`;
