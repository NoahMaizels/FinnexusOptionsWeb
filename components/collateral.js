import { Component } from 'react';
import { LineChart, Line, Point, AreaChart, Chart } from 'bizcharts';
import { Statistic, Row, Col, message, Spin } from 'antd';
import styled from 'styled-components';
import {
  Header2, Space, ConnectWalletSub, MyStatistic,
  Box, ShortLine, InALineLeft, VerticalLine, BigTitle,
  SingleLine, renderDepositModal, checkNumber, renderWithdrawModal
} from './index';
import { getCollateralInfo, beautyNumber, getBalance, deposit, withdraw, getFee, updateCollateralInfo } from "../utils/scHelper.js";
import withRouter from 'umi/withRouter';
import { Wallet, getSelectedAccount, WalletButton, WalletButtonLong, getSelectedAccountWallet, getTransactionReceipt } from "wan-dex-sdk-wallet";
import { connect } from 'react-redux';
import { fnxTokenAddress } from '../conf/config.js';
import axios from 'axios';


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
      withdrawVisible: false,
      amountToPay: '',
      currencyToPay: "0",
      currencyBalance: 0,
      loading: false,
      historyLine: [],
      spinning: true,
    };
  }

  componentDidMount() {
    this.firstLoad = true;
    this.getHistoryLine();
    this.updateInfo();
    this.timer = setInterval(this.updateInfo, 5000);
  }

  componentWillUnmount() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  getHistoryLine = () => {
    if (this.props.chain === 'wan') {
      axios.get('https://wandora.finnexus.app/api/wan').then((resp) => {
        let historyLine = resp.data.map((v) => {
          return { time: (new Date(v.time * 1000)).toISOString(), value: v.value };
          // return {time: (new Date(v.time*1000)).toLocaleDateString(), value: v.value};
        });

        console.log('wan historyLine', historyLine);
        let min=1e15, max=0;
        for (let i=0; i<historyLine.length; i++) {
          if (historyLine[i].value > max) {
            max = historyLine[i].value;
          }
          if (historyLine[i].value < min) {
            min = historyLine[i].value;
          }
        }
        this.min = min / 1.1;
        this.max = max * 1.1;

        this.setState({ historyLine });
      }).catch(e => console.log(e));

    } else {
      axios.get('https://wandora.finnexus.app/api/eth').then((resp) => {
        let historyLine = resp.data.map((v) => {
          return { time: (new Date(v.time * 1000)).toISOString(), value: v.value };
          // return {time: (new Date(v.time*1000)).toLocaleDateString(), value: v.value};
        });

        console.log('eth historyLine', historyLine);
        let min=1e15, max=0;
        for (let i=0; i<historyLine.length; i++) {
          if (historyLine[i].value > max) {
            max = historyLine[i].value;
          }
          if (historyLine[i].value < min) {
            min = historyLine[i].value;
          }
        }
        this.min = min / 1.1;
        this.max = max * 1.1;

        this.setState({ historyLine });
      }).catch(e => console.log(e));
    }

  }

  updateInfo = () => {
    let info = getCollateralInfo();
    // console.log('info:', info);
    if (info.lowestPercent > 0) {
      this.setState({
        sharePrice: info.sharePrice,
        totalSupply: info.totalSupply,
        totalValue: info.totalValue,
        usedValue: info.usedValue,
        lowestPercent: info.lowestPercent,
        balance: info.balance,
        userPayUsd: info.userPayUsd,
      });

      if (this.firstLoad) {
        this.firstLoad = false;
        this.setState({spinning: false});
      }
    }
  }

  updateNewInfo = () => {
    console.log('updateNewInfo start');
    this.setState({spinning: true});
    updateCollateralInfo().then(() => {
      this.updateInfo();
      console.log('updateNewInfo success');
      this.setState({spinning: false});
    }).catch(e => {
      console.log(e);
      this.setState({spinning: false});
    });
  }


  depositCancel = () => {
    this.setState({ depositVisible: false, amountToPay: '' });
  }

  withdrawCancel = () => {
    this.setState({ withdrawVisible: false, amountToPay: '' });
  }



  depositOk = () => {
    if (Number(this.state.amountToPay) >= Number(this.state.currencyBalance)) {
      message.warn("Balance not enough");
      return;
    }

    if (this.state.amountToPay === 0) {
      message.warn("Please fill amount");
      return;
    }

    this.setState({ loading: true });
    deposit(this.props.chainType, this.state.amountToPay, this.state.currencyToPay, this.props.selectedWallet, this.props.selectedAccount.get('address')).then((ret) => {
      if (ret) {
        this.setState({ depositVisible: false, loading: false, amountToPay: '' });
        message.info("Deposit success");
        this.updateNewInfo();
      } else {
        this.setState({ loading: false });
      }
    }).catch((e) => {
      console.log(e);
      message.warn("Sorry, deposit failed:" + e.message);
      this.setState({ loading: false });
    });
  }

  withdrawOk = () => {
    if (Number(this.state.amountToPay) > Number(this.state.balance)) {
      message.warn("Balance not enough");
      console.log(this.state.amountToPay, this.state.balance);
      return;
    }

    if (this.state.amountToPay === 0) {
      message.warn("Please fill amount");
      return;
    }

    this.setState({ loading: true });
    withdraw(this.props.chainType, this.state.amountToPay, this.state.currencyToPay, this.props.selectedWallet, this.props.selectedAccount.get('address')).then((ret) => {
      if (ret) {
        this.setState({ withdrawVisible: false, loading: false, amountToPay: '' });
        message.info("Withdraw success");
        this.updateNewInfo();
      } else {
        this.setState({ loading: false });
      }
    }).catch((e) => {
      console.log(e);
      message.warn("Sorry, withdraw failed:" + e.message);
      this.setState({ loading: false });
    });
  }

  getBalance = () => {
    if (this.props.selectedAccount) {
      let address = this.props.selectedAccount.get('address');
      let token = this.state.currencyToPay === "0" ? "0x0000000000000000000000000000000000000000" : fnxTokenAddress;
      console.log('getBalance');
      getBalance(token, address).then((ret) => {
        console.log('Balance', ret);
        this.setState({ currencyBalance: ret });
      }).catch(console.log);
    }
  }

  render() {
    return (
      <div style={{ background: "#1A1C2B", padding: "20px" }}>
        <InALineLeft>
          <VerticalLine style={{ marginLeft: "20px" }} />
          <BigTitle>Pool Value</BigTitle>
        </InALineLeft>
        <AreaChart
          padding={[30, 60, 50, 60]}
          autoFit
          height={320}
          data={this.state.historyLine}
          xField='time'
          yField='value'
          smooth={true}
          yAxis = {
            {
              visible: true,
              min: this.min,
            }
          }
        >
          {/* <Line position="time*value" /> */}
            {/* <Point position="8000*-30" /> */}
        </AreaChart>
        <Space />
        <Spin spinning={this.state.spinning} size="large">
          <Row gutter={[24, 24]}>
            <Col span={6}><Box><MyStatistic coldColor title="Collateral occupied percent" value={this.state.totalSupply > 0 ? beautyNumber(this.state.usedValue * 3 / this.state.totalValue * 100, 2) : 0} suffix="%" /><ShortLine coldColor /></Box></Col>
            <Col span={6}><Box><MyStatistic coldColor title="Lowest collateral percent" value={this.state.lowestPercent} suffix="%" /><ShortLine coldColor /></Box></Col>
            <Col span={6}><Box><MyStatistic coldColor title="Net value for total shares" value={beautyNumber(this.state.totalValue, 4)} suffix="$" /><ShortLine coldColor /></Box></Col>
            <Col span={6}><Box><MyStatistic coldColor title="Net value for each share" value={beautyNumber(this.state.sharePrice, 4)} suffix="$" /><ShortLine coldColor /></Box></Col>
          </Row>
          <Row gutter={[24, 24]}>
            <Col span={6}><Box><MyStatistic title="Total amount of shares" value={beautyNumber(this.state.totalSupply, 4)} /><ShortLine /></Box></Col>
            <Col span={6}><Box><MyStatistic title="Return in this month" value={'0'} suffix="$" /><ShortLine /></Box></Col>
            <Col span={6}><Box><MyStatistic title="APR in this month" value={'0'} suffix="%" /><ShortLine /></Box></Col>
            <Col span={6}><Box><MyStatistic title="APR in this year" value={'0'} suffix="%" /><ShortLine /></Box></Col>
          </Row>
          <SingleLine />
          <Header2>
            <InALineLeft>
              <Title>My Pool</Title>
              <MyButton onClick={() => {
                this.getBalance();
                this.setState({ depositVisible: true });
              }}>Deposit</MyButton>
              <MyButton onClick={() => {
                this.setState({ withdrawVisible: true });
              }}>Withdraw</MyButton>
            </InALineLeft>
          </Header2>
          <SingleLine />
          <SmallSpace />
          <Row gutter={[24, 40]}>
            <Col span={6}><Box><MyStatistic title="My shares token" value={beautyNumber(this.state.balance, 4)} /><ShortLine coldColor /></Box></Col>
            <Col span={6}><Box><MyStatistic title="Percentage of the pool" value={this.state.totalSupply > 0 ? beautyNumber(this.state.balance / this.state.totalSupply * 100, 4) : 0} suffix="%" /><ShortLine coldColor /></Box></Col>
            <Col span={6}><Box><MyStatistic title="Current value" value={beautyNumber(this.state.balance * this.state.sharePrice, 4)} suffix="$" /><ShortLine coldColor /></Box></Col>
            <Col span={6}><Box><MyStatistic title="Total return" value={beautyNumber(this.state.balance * this.state.sharePrice - this.state.userPayUsd, 4)} suffix="$" /><ShortLine coldColor /></Box></Col>
          </Row>
        </Spin>
        {
          renderDepositModal(this.props.chainType, this.state.depositVisible, this.depositCancel, this.depositOk,
            this.state.amountToPay, (e) => {
              if (checkNumber(e)) {
                this.setState({ amountToPay: e.target.value });
              }
            }, this.state.currencyToPay, (e) => {
              this.setState({ currencyToPay: e.target.value }, () => {
                this.getBalance();
              });
            }, this.state.currencyBalance, this.state.loading, getFee(),
            this.props.selectedAccount ? this.props.selectedAccount.get("isLocked") : false)
        }
        {
          renderWithdrawModal(this.props.chainType, this.state.withdrawVisible, this.withdrawCancel, this.withdrawOk,
            this.state.amountToPay, (e) => {
              if (checkNumber(e)) {
                this.setState({ amountToPay: e.target.value });
              }
            }, this.state.currencyToPay, (e) => {
              this.setState({ currencyToPay: e.target.value });
            }, this.state.balance, this.state.loading, getFee(),
            this.props.selectedAccount ? this.props.selectedAccount.get("isLocked") : false)
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