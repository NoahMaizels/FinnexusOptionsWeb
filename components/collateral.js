import { Component } from 'react';
import { LineChart, Line, Point, AreaChart } from 'bizcharts';
import { Statistic, Row, Col } from 'antd';
import styled from 'styled-components';
import { Header2, Space, ConnectWalletSub, MyStatistic, 
  Box, ShortLine, InALineLeft, VerticalLine, BigTitle, 
  SingleLine, renderDepositModal, checkNumber } from './index';
import { getCollateralInfo, beautyNumber, getBalance } from "../utils/scHelper.js";
import withRouter from 'umi/withRouter';
import { Wallet, getSelectedAccount, WalletButton, WalletButtonLong, getSelectedAccountWallet, getTransactionReceipt } from "wan-dex-sdk-wallet";
import { connect } from 'react-redux';
import { fnxTokenAddress } from '../conf/config.js';


class CollateralInfo extends Component {
  constructor(props) {
    super(props);
    this.state = {
      sharePrice: 0,
      totalSupply: 0,
      totalValue: 0,
      usedValue: 0,
      lowestPercent: 0,
      balance: 0,
      userPayUsd: 0,
      depositVisible: false,
      amountToPay: 0,
      currencyToPay: "0",
      currencyBalance: 0,
    };
  }

  componentDidMount() {
    this.updateInfo();
    this.timer = setInterval(this.updateInfo, 5000);
  }

  componentWillUnmount() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  updateInfo = () => {
    let info = getCollateralInfo();
    console.log('info:', info);
    this.setState({
      sharePrice: info.sharePrice,
      totalSupply: info.totalSupply,
      totalValue: info.totalValue,
      usedValue: info.usedValue,
      lowestPercent: info.lowestPercent,
      balance: info.balance,
      userPayUsd: info.userPayUsd,
    });
  }

  dataWan = [
    {
      date: "2020-07-11",
      amount: 70,
    },
    {
      date: "2020-07-12",
      amount: 50,
    },
    {
      date: "2020-07-13",
      amount: 80,
    },
    {
      date: "2020-07-14",
      amount: 75,
    },
    {
      date: "2020-07-15",
      amount: 59,
    },
    {
      date: "2020-07-16",
      amount: 90,
    },
    {
      date: "2020-07-17",
      amount: 80,
    },
    {
      date: "2020-07-18",
      amount: 83,
    },
    {
      date: "2020-07-19",
      amount: 85,
    },
    {
      date: "2020-07-20",
      amount: 82,
    }

  ];

  dataEth = [
    {
      date: "2020-07-11",
      amount: 100,
    },
    {
      date: "2020-07-12",
      amount: 200,
    },
    {
      date: "2020-07-13",
      amount: 280,
    },
    {
      date: "2020-07-14",
      amount: 240,
    },
    {
      date: "2020-07-15",
      amount: 250,
    },
    {
      date: "2020-07-16",
      amount: 200,
    },
    {
      date: "2020-07-17",
      amount: 210,
    },
    {
      date: "2020-07-18",
      amount: 80,
    },
    {
      date: "2020-07-19",
      amount: 85,
    },
    {
      date: "2020-07-20",
      amount: 81,
    }
  ];

  depositCancel = () => {
    this.setState({depositVisible: false});
  }

  depositOk = () => {
    this.setState({depositVisible: false});
  }

  getBalance = () => {
    if (this.props.selectedAccount) {
      let address = this.props.selectedAccount.get('address');
      let token = this.state.currencyToPay === "0" ? "0x0000000000000000000000000000000000000000" : fnxTokenAddress;
      console.log('getBalance');
      getBalance(token, address).then((ret)=>{
        console.log('Balance', ret);
        this.setState({currencyBalance: ret});
      }).catch(console.log);
    }
  }

  render() {
    return (
      <div style={{background:"#1A1C2B", padding: "20px"}}>
        <InALineLeft>
          <VerticalLine style={{marginLeft:"20px"}}/>
          <BigTitle>Pool Value</BigTitle>
        </InALineLeft>
        <AreaChart
          padding={[30, 60, 50, 60]}
          autoFit
          height={320}
          data={this.props.chain === 'wan' ? this.dataWan : this.dataEth}
          xField='date'
          yField='amount'
          smooth={false}
        >
          {/* <Line position="price*profit" />
            <Point position="8000*-30" /> */}
        </AreaChart>
        <Space />
        <Row gutter={[24, 40]}>
          <Col span={6}><Box><MyStatistic coldColor title="Collateral occupied percent" value={this.state.totalSupply > 0 ? beautyNumber(this.state.usedValue / this.state.totalSupply * 100, 2) : 0} suffix="%" /><ShortLine coldColor/></Box></Col>
          <Col span={6}><Box><MyStatistic coldColor title="Lowest collateral percent" value={this.state.lowestPercent} suffix="%" /><ShortLine coldColor/></Box></Col>
          <Col span={6}><Box><MyStatistic coldColor title="Net value for total shares" value={this.state.totalValue} suffix="$" /><ShortLine coldColor/></Box></Col>
          <Col span={6}><Box><MyStatistic coldColor title="Net value for each share" value={this.state.sharePrice} suffix="$" /><ShortLine coldColor/></Box></Col>
        </Row>
        <Row gutter={[24, 40]}>
          <Col span={6}><Box><MyStatistic title="Total amount of shares" value={this.state.totalSupply} /><ShortLine/></Box></Col>
          <Col span={6}><Box><MyStatistic title="Return in this month" value={'0'} suffix="$" /><ShortLine/></Box></Col>
          <Col span={6}><Box><MyStatistic title="APR in this month" value={'0'} suffix="%" /><ShortLine/></Box></Col>
          <Col span={6}><Box><MyStatistic title="APR in this year" value={'0'} suffix="%" /><ShortLine/></Box></Col>
        </Row>
        <SingleLine/>
        <Header2>
          <InALineLeft>
            <Title>My Pool</Title>
            <MyButton onClick={() => { 
              this.getBalance();
              this.setState({depositVisible: true});
            }}>Deposit</MyButton>
            <MyButton onClick={() => { }}>Withdraw</MyButton>
          </InALineLeft>
        </Header2>
        <SingleLine/>
        <SmallSpace />
        <Row gutter={[24, 40]}>
          <Col span={6}><Box><MyStatistic title="My shares token" value={this.state.balance} /><ShortLine coldColor/></Box></Col>
          <Col span={6}><Box><MyStatistic title="Percentage of the pool" value={this.state.totalSupply > 0? beautyNumber(this.state.balance/this.state.totalSupply, 4):0 } suffix="%" /><ShortLine coldColor/></Box></Col>
          <Col span={6}><Box><MyStatistic title="Current value" value={beautyNumber(this.state.balance * this.state.sharePrice, 4)} suffix="$" /><ShortLine coldColor/></Box></Col>
          <Col span={6}><Box><MyStatistic title="Total return" value={beautyNumber(this.state.balance * this.state.sharePrice - this.state.userPayUsd, 4)} suffix="$" /><ShortLine coldColor/></Box></Col>
        </Row>
        {
          renderDepositModal(this.props.chainType, this.state.depositVisible, this.depositCancel, this.depositOk,
            this.state.amountToPay, (e) => {
              if (checkNumber(e)) {
                this.setState({ amountToPay: e.target.value });
              }
            }, this.state.currencyToPay, (e) => {
              this.setState({ currencyToPay: e.target.value}, () => {
                this.getBalance();
              });
            }, this.state.currencyBalance)
        }
      </div>
    );
  }
}

const SmallSpace = styled(Space)`
  height: 40px;
`;

const Title = styled.div`
  margin: 20px 40px 10px 10px;
  font-weight: 700;
  font-size:18px;
  font-family:Helvetica Neue;
  color:rgba(255,255,255,1);
  line-height:15px;
`;

const MyButton = styled(ConnectWalletSub)`
  margin-top: 12px;
`;






export default withRouter(connect(state => {
  const selectedAccountID = state.WalletReducer.get('selectedAccountID');
  return {
    selectedAccount: getSelectedAccount(state),
    selectedWallet: getSelectedAccountWallet(state),
    networkId: state.WalletReducer.getIn(['accounts', selectedAccountID, 'networkId']),
    selectedAccountID,
  }
})(CollateralInfo));