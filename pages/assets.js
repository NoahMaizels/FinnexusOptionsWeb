import { Table } from 'antd';
import styles from './assets.css';
import styled from 'styled-components';
import { Body, Center, Space, ConnectWalletSub, InALine, Box, VerticalLine, InALineLeft, BigTitle, MyStatistic, InALineAround, HistoryTable } from '../components';
import { Row, Col, Statistic, } from 'antd';
import { Component } from 'react';
import { getBalance, getCoinPrices, getCollateralInfo, beautyNumber, getUserOptions } from '../utils/scHelper';
import withRouter from 'umi/withRouter';
import { Wallet, getSelectedAccount, WalletButton, WalletButtonLong, getSelectedAccountWallet, getTransactionReceipt } from "wan-dex-sdk-wallet";
import { connect } from 'react-redux';
import { fnxTokenAddress, contractInfo } from '../conf/config';

class Assets extends Component {
  constructor(props) {
    super(props);

    this.state = {
      assets: [
        {
          assets: "ETH",
          balance: "0",
          usd: "$ 0",
          currentReturn: "--",
          expiration: '--',
          operation: 0
        },
        {
          assets: "WAN",
          balance: "0",
          usd: "$ 0",
          currentReturn: "--",
          expiration: '--',
          operation: 0
        },
        {
          assets: "Shares token @Wanchain",
          balance: "0",
          usd: "$ 0",
          currentReturn: "--",
          expiration: '--',
          operation: 0
        },
        {
          assets: "Shares token @Ethereum",
          balance: "0",
          usd: "$ 0",
          currentReturn: "--",
          expiration: '--',
          operation: 0
        },
        {
          assets: "FNX @Ethereum",
          balance: "0",
          usd: "$ 0",
          currentReturn: "--",
          expiration: '--',
          operation: 0
        },
        {
          assets: "FNX @Wanchain",
          balance: "0",
          usd: "$ 0",
          currentReturn: "--",
          expiration: '--',
          operation: 0
        },
      ],
      options: []
    };
  }

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
              <SmallButton><img src={require('../img/buy.png')} style={{ marginRight: "10px" }} />Buy</SmallButton>
              <SmallButton><img src={require('../img/sell.png')} style={{ marginRight: "10px" }} />Sell</SmallButton>
              <SmallButton disable><img src={require('../img/transfer.png')} style={{ marginRight: "10px" }} />Exercise</SmallButton>
            </InALine>
          );
        }
      }
    },
  ]

  componentDidMount() {
    this.updateInfo();
  }

  componentWillUnmount() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = undefined;
    }
  }

  getTableData = () => {
    let assets = this.state.assets.filter((v) => {
      return !v.assets.includes('FNX');
    });

    return assets.concat(this.state.options);
  }

  getPanelData = () => {
    return this.state.assets.filter((v) => {
      return v.assets.includes('FNX');
    });
  }

  setInfo = (symbol, balance, usd) => {
    console.log('setInfo', symbol, balance, usd);
    let assets = this.state.assets.slice();
    for (let i = 0; i < assets.length; i++) {
      if (assets[i].assets === symbol) {
        assets[i].balance = beautyNumber(balance, 4);
        assets[i].usd = "$" + beautyNumber(usd, 4).toString();
        break;
      }
    }
    this.setState({ assets });
  }

  getLeftTimeStr = (expiration) => {
    let leftTime = (expiration - Date.now() / 1000);
    let timeStr = "";
    if (leftTime < 0) {
      timeStr = "expired";
    } else {
      const d = parseInt(leftTime / 24 / 3600);
      leftTime = leftTime % (24 * 3600);
      const h = parseInt(leftTime / 3600);
      leftTime = leftTime % 3600;

      const m = parseInt(leftTime / 60);
      leftTime = leftTime % 60;

      const s = leftTime;
      timeStr = d + "d " + h + "h ";
      if (d === 0 && h === 0) {
        timeStr = "< 1h";
      }
      // timeStr = d + "d " + h + "h " + m + "m";
    }
    return timeStr;
  }

  setOptions = (optionsInfo) => {
    let options = [];
    for (let i = 0; i < optionsInfo.length; i++) {
      options.push({
        assets: optionsInfo[i].name,
        balance: optionsInfo[i].amount,
        usd: "$ --",
        currentReturn: "--",
        expiration: this.getLeftTimeStr(optionsInfo[i].expiration),
        operation: 1
      });
    }

    this.setState({ options });
  }

  updateInfo = () => {
    let prices = getCoinPrices();
    let options = getUserOptions();
    if (Number(prices.WAN) === 0 || !this.props.selectedAccount || options.length === 0) {
      this.timer = setTimeout(this.updateInfo, 3000);
      return;
    }
    let colInfo = getCollateralInfo();
    let address = this.props.selectedAccount.get('address');

    getBalance('0x0000000000000000000000000000000000000000', address).then((ret) => {
      this.setInfo('WAN', ret, ret * prices.WAN);
    }).catch(e => console.log(e));

    getBalance(fnxTokenAddress, address).then((ret) => {
      this.setInfo('FNX @Wanchain', ret, ret * prices.FNX);
    }).catch(e => console.log(e));

    getBalance(contractInfo.OptionsMangerV2.address, address).then((ret) => {
      this.setInfo('Shares token @Wanchain', ret, ret * colInfo.sharePrice);
    }).catch(e => console.log(e));

    this.setOptions(options);

    this.timer = setTimeout(this.updateInfo, 30000);
  }


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
                      <MyStatistic style={{ position: "relative", left: "34px" }} coldColor value={this.getPanelData()[0].usd} suffix="$" title={"Value"} />
                    </div>
                    <VLine />
                    <div>
                      <MyStatistic style={{ position: "relative", left: "-38px" }} value={this.getPanelData()[0].balance} title={"Balance"} />
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
                      <MyStatistic style={{ position: "relative", left: "34px" }} coldColor value={this.getPanelData()[1].usd.replace('$', '')} suffix="$" title={"Value"} />
                    </div>
                    <VLine />
                    <div>
                      <MyStatistic style={{ position: "relative", left: "-38px" }} value={this.getPanelData()[1].balance} title={"Balance"} />
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
          <AssetsTable columns={this.column} dataSource={this.getTableData()} />
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


export default withRouter(connect(state => {
  const selectedAccountID = state.WalletReducer.get('selectedAccountID');
  return {
    selectedAccount: getSelectedAccount(state),
    selectedWallet: getSelectedAccountWallet(state),
    networkId: state.WalletReducer.getIn(['accounts', selectedAccountID, 'networkId']),
    selectedAccountID,
  }
})(Assets));