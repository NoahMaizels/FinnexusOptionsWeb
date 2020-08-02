import { Component } from 'react';
import { LineChart, Line, Point, AreaChart, Chart } from 'bizcharts';
import { Modal, Row, Col, message, Spin, Tooltip } from 'antd';
import styled from 'styled-components';
import {
  Header2, Space, ConnectWalletSub, MyStatistic,
  Box, ShortLine, InALineLeft, VerticalLine, BigTitle,
  SingleLine, renderDepositModal, checkNumber, renderWithdrawModal,
  renderClaimModal
} from './index';
import {
  getCollateralInfo, beautyNumber, getBalance,
  deposit, withdraw, getFee, updateCollateralInfo,
  getCoinPrices, redeemMinerCoin
} from "../utils/scHelper.js";
import withRouter from 'umi/withRouter';
import { Wallet, getSelectedAccount, WalletButton, WalletButtonLong, getSelectedAccountWallet, getTransactionReceipt } from "wan-dex-sdk-wallet";
import { connect } from 'react-redux';
import { fnxTokenAddress } from '../conf/config.js';
import axios from 'axios';
import { insertCollateralHistory, updateCollateralStatus } from '../components/db';
import {
  InfoCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';

const { confirm } = Modal;

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
      claimVisible: false,
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
    if (this.props.chainType === 'wan') {
      axios.get('https://wandora.finnexus.app/api/wan').then((resp) => {
        let historyLine = resp.data.map((v) => {
          return { time: (new Date(v.time * 1000)).toISOString(), value: v.value };
          // return {time: (new Date(v.time*1000)).toLocaleDateString(), value: v.value};
        });
        historyLine = historyLine.reverse();

        console.log('wan historyLine', historyLine);
        let min = 1e15, max = 0;
        for (let i = 0; i < historyLine.length; i++) {
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

        historyLine = historyLine.reverse();

        console.log('eth historyLine', historyLine);
        let min = 1e15, max = 0;
        for (let i = 0; i < historyLine.length; i++) {
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
        outOfWithdraw: info.outOfWithdraw,
        lockedValue: info.lockedValue,
        fnxMine: info.fnxMine,
        wanMine: info.wanMine,
        minedFnx: info.minedFnx,
        minedWan: info.minedWan,
      });

      if (this.firstLoad) {
        this.firstLoad = false;
        this.setState({ spinning: false });
      }
    }
  }

  updateNewInfo = () => {
    console.log('updateNewInfo start');
    this.setState({ spinning: true });
    updateCollateralInfo().then(() => {
      this.updateInfo();
      console.log('updateNewInfo success');
      this.setState({ spinning: false });
    }).catch(e => {
      console.log(e);
      this.setState({ spinning: false });
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

    if (!this.props.selectedAccount) {
      message.warn("Please select account first.");
      return;
    }

    if (this.props.selectedAccount ? this.props.selectedAccount.get("isLocked") : false) {
      message.info("Please unlock your wallet first");
      return;
    }

    if (this.state.amountToPay === 0) {
      message.warn("Please fill amount");
      return;
    }

    let time = (new Date()).toJSON().split('.')[0];
    console.log('depositOk', this.props.chainType, this.state.amountToPay, this.state.currencyToPay);

    this.setState({ loading: true });
    deposit(this.props.chainType, this.state.amountToPay, this.state.currencyToPay, this.props.selectedWallet, this.props.selectedAccount.get('address')).then((ret) => {
      if (ret) {
        // this.setState({ depositVisible: false, loading: false, amountToPay: '' });
        message.info("Deposit success");
        this.updateNewInfo();
        updateCollateralStatus(time, 'Success');
      } else {
        // this.setState({ loading: false });
        updateCollateralStatus(time, 'Failed');
      }
      if (this.props.update) {
        this.props.update();
      }
    }).catch((e) => {
      console.log(e);
      message.warn("Sorry, deposit failed:" + e.message);
      // this.setState({ loading: false });
      updateCollateralStatus(time, 'Failed');
      if (this.props.update) {
        this.props.update();
      }
    });

    let token = this.props.chainType === 'wan' ? 'FPT@Wanchain' : 'FPT@Ethereum';
    let prices = getCoinPrices();
    let currency = Number(this.state.currencyToPay) === 0 ? 'WAN' : 'FNX';
    let value = beautyNumber(Number(this.state.amountToPay) * prices[currency], 4);
    let amount = beautyNumber(value / this.state.sharePrice, 4);
    value = value + '$';
    insertCollateralHistory(this.props.selectedAccount.get('address'),
      time, token, 'Deposit', amount, value, this.state.amountToPay + ' ' + currency, 'Pending');

    this.setState({ depositVisible: false, loading: false, amountToPay: '' });

    if (this.props.update) {
      this.props.update();
    }
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

    if (this.props.selectedAccount ? this.props.selectedAccount.get("isLocked") : false) {
      message.info("Please unlock your wallet first");
      return;
    }

    this.setState({ loading: true });
    let time = (new Date()).toJSON().split('.')[0];

    withdraw(this.props.chainType, this.state.amountToPay, this.state.currencyToPay, this.props.selectedWallet, this.props.selectedAccount.get('address')).then((ret) => {
      if (ret) {
        // this.setState({ withdrawVisible: false, loading: false, amountToPay: '' });
        if (this.state.amountToPay < this.state.outOfWithdraw) {
          message.info("Withdraw success");
          updateCollateralStatus(time, "Success");
        } else {
          message.info("Withdraw in queue");
          updateCollateralStatus(time, "In queue");
        }
        this.updateNewInfo();
        if (this.props.update) {
          this.props.update();
        }
      } else {
        // this.setState({ loading: false });
        updateCollateralStatus(time, "Failed");
        if (this.props.update) {
          this.props.update();
        }
      }
    }).catch((e) => {
      console.log(e);
      message.warn("Sorry, withdraw failed:" + e.message);
      // this.setState({ loading: false });
      updateCollateralStatus(time, "Failed");
      if (this.props.update) {
        this.props.update();
      }
    });

    let prices = getCoinPrices();
    let token = this.props.chainType === 'wan' ? 'FPT@Wanchain' : 'FPT@Ethereum';
    let currency = Number(this.state.currencyToPay) === 0 ? 'WAN' : 'FNX';
    let value = beautyNumber(this.state.amountToPay * this.state.sharePrice, 4);
    let amount = beautyNumber(this.state.amountToPay, 4);
    value = value + '$';
    let currencyAmount = beautyNumber(this.state.amountToPay * this.state.sharePrice / prices[currency], 4);
    insertCollateralHistory(this.props.selectedAccount.get('address'),
      time, token, 'Deposit', amount, value, currencyAmount + ' ' + currency, 'Pending');

    this.setState({ withdrawVisible: false, loading: false, amountToPay: '' });

    if (this.props.update) {
      this.props.update();
    }
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

  redeemMinedCoinToken = () => {
    if (!this.props.selectedAccount) {
      message.warn("Please select address first");
      return;
    }

    if (Number(this.state.minedWan) === 0 && Number(this.state.minedFnx) === 0) {
      message.warn("Sorry, no mined coin");
      return;
    }

    if (this.props.selectedAccount ? this.props.selectedAccount.get("isLocked") : false) {
      message.info("Please unlock your wallet first");
      return;
    }

    // wan
    let time = (new Date()).toJSON().split('.')[0];
    redeemMinerCoin(this.props.chainType, '0x0000000000000000000000000000000000000000',
      this.state.minedWan, this.props.selectedWallet, this.props.selectedAccount.get('address')).then((ret) => {
        if (ret) {
          message.info('Redeem mined WAN success');
          updateCollateralStatus(time, 'Success');
        } else {
          message.info('Redeem mined WAN failed');
          updateCollateralStatus(time, 'Failed');
        }

        this.updateNewInfo();

        if (this.props.update) {
          this.props.update();
        }
      }).catch((e) => {
        console.log(e);
        updateCollateralStatus(time, 'Failed');
        if (this.props.update) {
          this.props.update();
        }
      });

    let prices = getCoinPrices();
    let currency = 'WAN';
    let value = beautyNumber(prices[currency] * this.state.minedWan, 4) + '$';
    insertCollateralHistory(this.props.selectedAccount.get('address'),
      time, 'WAN', 'Claim', '--', value, beautyNumber(this.state.minedWan, 4) + ' ' + currency, 'Pending');
    if (this.props.update) {
      this.props.update();
    }

    setTimeout(() => {
      // fnx
      let time = (new Date()).toJSON().split('.')[0];
      redeemMinerCoin(this.props.chainType, fnxTokenAddress,
        this.state.minedFnx, this.props.selectedWallet, this.props.selectedAccount.get('address')).then((ret) => {
          if (ret) {
            message.info('Redeem mined FNX success');
            updateCollateralStatus(time, 'Success');
          } else {
            message.info('Redeem mined FNX failed');
            updateCollateralStatus(time, 'Failed');
          }
          if (this.props.update) {
            this.props.update();
          }
        }).catch((e) => {
          console.log(e);
          updateCollateralStatus(time, 'Failed');
          if (this.props.update) {
            this.props.update();
          }
        });

      let prices = getCoinPrices();
      let currency = 'FNX';
      let value = beautyNumber(prices[currency] * this.state.minedFnx, 4) + '$';
      insertCollateralHistory(this.props.selectedAccount.get('address'),
        time, 'FNX', 'Claim', '--', value, beautyNumber(this.state.minedFnx, 4) + ' ' + currency, 'Pending');
      if (this.props.update) {
        this.props.update();
      }
    }, 2000);

    this.setState({ claimVisible: false});
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
          yAxis={
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
            <Col span={6}><Box><MyStatistic coldColor title="Collateral occupied percent" value={this.state.totalSupply > 0 ? beautyNumber(this.state.usedValue * this.state.lowestPercent / 100 / this.state.totalValue * 100, 2) : 0} suffix="%" /><ShortLine coldColor /></Box></Col>
            <Col span={6}><Box><TwoStatics coldColor title="Farming amount per day" value={this.state.fnxMine + ' FNX / ' + this.state.wanMine + ' WAN'} suffix="" /><ShortLine coldColor /></Box></Col>
            <Col span={6}><Box><MyStatistic coldColor title="Net value for total FPT" value={beautyNumber(this.state.totalValue, 4)} suffix="$" /><ShortLine coldColor /></Box></Col>
            <Col span={6}><Box><MyStatistic coldColor title="Net value for each FPT" value={beautyNumber(this.state.sharePrice, 4)} suffix="$" /><ShortLine coldColor /></Box></Col>
            <Col span={6}><Box><MyStatistic title="Total amount of FPT" value={beautyNumber(this.state.totalSupply, 4)} /><ShortLine /></Box></Col>
            <Col span={6}><Box><MyStatistic title="Return in this month" value={'0'} suffix="$" /><ShortLine /></Box></Col>
            <Col span={6}><Box><MyStatistic title="APR in this month" value={'0'} suffix="%" /><ShortLine /></Box></Col>
            <Col span={6}><Box><MyStatistic title="APR in this year" value={'0'} suffix="%" /><ShortLine /></Box></Col>
            <Col span={6}><Box><MyStatistic coldColor title="Lowest collateral percent" value={this.state.lowestPercent} suffix="%" /><ShortLine coldColor /></Box></Col>
            <Col span={6}><Box><MyStatistic coldColor title="FPT out of collateral" value={beautyNumber(this.state.outOfWithdraw, 2)} suffix="$" /><ShortLine coldColor /></Box></Col>
            <Col span={6}><Box><MyStatistic coldColor title="Withdrawing value in queue" value={beautyNumber(this.state.lockedValue, 2)} suffix="$" /><ShortLine coldColor /></Box></Col>
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
              <MyButton onClick={() => {
                this.setState({ claimVisible: true });
              }}>Claim return</MyButton>
            </InALineLeft>
          </Header2>
          <SingleLine />
          <SmallSpace />
          <Row gutter={[24, 40]}>
            <Col span={6}><Box><MyStatistic title="My FPT" value={beautyNumber(this.state.balance, 4)} /><ShortLine /></Box></Col>
            <Col span={6}><Box><MyStatistic title="Percentage of the pool" value={this.state.totalSupply > 0 ? beautyNumber(this.state.balance / this.state.totalSupply * 100, 4) : 0} suffix="%" /><ShortLine /></Box></Col>
            <Col span={6}><Box><MyStatistic title="Current value" value={beautyNumber(this.state.balance * this.state.sharePrice, 4)} suffix="$" /><ShortLine /></Box></Col>
            <Col span={6}>
              <Tooltip title={this.state.minedFnx + ' (FNX) ' + this.state.minedWan + ' (WAN)'}>
                <Box><TwoStatics title="Farming return" value={beautyNumber(this.state.minedFnx, 2) + " FNX / " + beautyNumber(this.state.minedWan, 2) + " WAN"} suffix="" /><ShortLine /></Box>
                <MyToolTip />
              </Tooltip>
            </Col>
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
        {
          renderClaimModal(this.props.chainType, this.state.claimVisible, this.state.minedWan, this.state.minedFnx, 
            this.redeemMinedCoinToken, () => {
              this.setState({claimVisible: false})
            }, this.state.loading, this.props.selectedAccount ? this.props.selectedAccount.get("isLocked") : false)
        }
      </div>
    );
  }
}

const MyToolTip = styled(InfoCircleOutlined)`
  position: relative;
  top: -112px;
  left: 150px;
`;

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

const TwoStatics = styled(MyStatistic)`
  .ant-statistic-content-value {
    font-size: 20px;
  }
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