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
import { withRouter } from 'umi';
import { Wallet, getSelectedAccount, WalletButton, WalletButtonLong, getSelectedAccountWallet, getTransactionReceipt } from "wan-dex-sdk-wallet";
import { connect } from 'react-redux';
import { fnxTokenAddress } from '../conf/config.js';
import axios from 'axios';
import { insertCollateralHistory, updateCollateralStatus } from '../components/db';
import {
  InfoCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';

import { injectIntl } from 'umi';

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
      monthReturn: 0,
      monthAPR: 0,
      yearAPR: 0,
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

        // console.log('wan historyLine', historyLine);
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

        // console.log('eth historyLine', historyLine);
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

    axios.get('https://wandora.finnexus.app/api/returns').then((resp) => {
      let ret = resp.data;

      this.setState({
        monthReturn: beautyNumber(ret.monthReturn, 4),
        monthAPR: beautyNumber(ret.monthAPR * 100, 2),
        yearAPR: beautyNumber(ret.APR * 100, 2)
      });
    }).catch(e => console.log(e));
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
    // console.log('updateNewInfo start');
    this.setState({ spinning: true });
    updateCollateralInfo().then(() => {
      this.updateInfo();
      // console.log('updateNewInfo success');
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
    const intl = this.props.intl;
    if (Number(this.state.amountToPay) >= Number(this.state.currencyBalance)) {
      message.warn(intl.messages['msg.balanceNotEnough']);
      return;
    }

    if (!this.props.selectedAccount) {
      message.warn(intl.messages['msg.selectAddress']);
      return;
    }

    if (this.props.selectedAccount ? this.props.selectedAccount.get("isLocked") : false) {
      message.info(intl.messages['msg.unlock']);
      return;
    }

    if (this.state.amountToPay === 0) {
      message.warn(intl.messages['msg.fillAmount']);
      return;
    }

    let time = (new Date()).toJSON().split('.')[0];
    // console.log('depositOk', this.props.chainType, this.state.amountToPay, this.state.currencyToPay);

    this.setState({ loading: true });
    deposit(this.props.chainType, this.state.amountToPay, this.state.currencyToPay, this.props.selectedWallet, this.props.selectedAccount.get('address')).then((ret) => {
      if (ret) {
        // this.setState({ depositVisible: false, loading: false, amountToPay: '' });
        message.info(intl.messages['msg.depositSuccess']);
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
      message.warn(intl.messages['msg.depositFailed'] + e.message);
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
    const intl = this.props.intl;
    if (Number(this.state.amountToPay) > Number(this.state.balance)) {
      message.warn(intl.messages['msg.balanceNotEnough']);
      // console.log(this.state.amountToPay, this.state.balance);
      return;
    }

    if (this.state.amountToPay === 0) {
      message.warn(intl.messages['msg.fillAmount']);
      return;
    }

    if (this.props.selectedAccount ? this.props.selectedAccount.get("isLocked") : false) {
      message.info(intl.messages['msg.unlock']);
      return;
    }

    this.setState({ loading: true });
    let time = (new Date()).toJSON().split('.')[0];

    withdraw(this.props.chainType, this.state.amountToPay, this.state.currencyToPay, this.props.selectedWallet, this.props.selectedAccount.get('address')).then((ret) => {
      if (ret) {
        // this.setState({ withdrawVisible: false, loading: false, amountToPay: '' });
        if (this.state.amountToPay < this.state.outOfWithdraw) {
          message.info(intl.messages['msg.withdrawSuccess']);
          updateCollateralStatus(time, "Success");
        } else {
          message.info(intl.messages['msg.withdrawInQueue']);
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
      message.warn(intl.messages['msg.withdrawFailed'] + e.message);
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
      // console.log('getBalance');
      getBalance(token, address).then((ret) => {
        // console.log('Balance', ret);
        this.setState({ currencyBalance: ret });
      }).catch(console.log);
    }
  }

  redeemMinedCoinToken = () => {
    const intl = this.props.intl;
    if (!this.props.selectedAccount) {
      message.warn(intl.messages['msg.selectAddress']);
      return;
    }

    if (Number(this.state.minedWan) === 0 && Number(this.state.minedFnx) === 0) {
      message.warn(intl.messages['msg.noMined']);
      return;
    }

    if (this.props.selectedAccount ? this.props.selectedAccount.get("isLocked") : false) {
      message.info(intl.messages['msg.unlock']);
      return;
    }

    // wan
    let time = (new Date()).toJSON().split('.')[0];
    redeemMinerCoin(this.props.chainType, '0x0000000000000000000000000000000000000000',
      this.state.minedWan, this.props.selectedWallet, this.props.selectedAccount.get('address')).then((ret) => {
        if (ret) {
          message.info(intl.messages['msg.redeemMinedWANSuccess']);
          updateCollateralStatus(time, 'Success');
        } else {
          message.info(intl.messages['msg.redeemMinedWANFailed']);
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
            message.info(intl.messages['msg.redeemMinedFNXSuccess']);
            updateCollateralStatus(time, 'Success');
          } else {
            message.info(intl.messages['msg.redeemMinedFNXFailed']);
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

    this.setState({ claimVisible: false });
  }

  render() {
    const intl = this.props.intl;
    return (
      <div style={{ background: "#1A1C2B", padding: "20px" }}>
        <InALineLeft>
          <VerticalLine style={{ marginLeft: "20px" }} />
          <BigTitle>{intl.messages['col.poolValue']}</BigTitle>
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
            <Col span={6}><Box><MyStatistic coldColor title={intl.messages['col.collateralOccupiedPercent']} value={this.state.totalSupply > 0 ? beautyNumber(this.state.usedValue * this.state.lowestPercent / 100 / this.state.totalValue * 100, 2) : 0} suffix="%" /><ShortLine coldColor /></Box></Col>
            <Col span={6}><Box><TwoStatics coldColor title={intl.messages['col.farmingAmountPerDay']} value={this.state.fnxMine + ' FNX / ' + this.state.wanMine + ' WAN'} suffix="" /><ShortLine coldColor /></Box></Col>
            <Col span={6}><Box><MyStatistic coldColor title={intl.messages['col.netValueForTotalFPT']} value={beautyNumber(this.state.totalValue, 4)} suffix="$" /><ShortLine coldColor /></Box></Col>
            <Col span={6}><Box><MyStatistic coldColor title={intl.messages['col.netValueForEachFPT']} value={beautyNumber(this.state.sharePrice, 4)} suffix="$" /><ShortLine coldColor /></Box></Col>
            <Col span={6}><Box><MyStatistic title={intl.messages['col.totalAmountOfFPT']} value={beautyNumber(this.state.totalSupply, 4)} /><ShortLine /></Box></Col>
            <Col span={6}><Box><MyStatistic title={intl.messages['col.eachFPTReturnInThisMonth']} value={this.state.monthReturn} suffix="$" /><ShortLine /></Box></Col>
            <Col span={6}><Box><MyStatistic title={intl.messages['col.APRInThisMonth']} value={this.state.monthAPR} suffix="%" /><ShortLine /></Box></Col>
            <Col span={6}><Box><MyStatistic title={intl.messages['col.APRInThisYear']} value={this.state.yearAPR} suffix="%" /><ShortLine /></Box></Col>
            <Col span={6}><Box><MyStatistic coldColor title={intl.messages['col.LowestCollateralPercent']} value={this.state.lowestPercent} suffix="%" /><ShortLine coldColor /></Box></Col>
            <Col span={6}><Box><MyStatistic coldColor title={intl.messages['col.FPTOutOfCollateral']} value={beautyNumber(this.state.outOfWithdraw, 2)} suffix="$" /><ShortLine coldColor /></Box></Col>
            <Col span={6}><Box><MyStatistic coldColor title={intl.messages['col.WithdrawingValueInQueue']} value={beautyNumber(this.state.lockedValue, 2)} suffix="$" /><ShortLine coldColor /></Box></Col>
          </Row>
          <SingleLine />
          <Header2>
            <InALineLeft>
              <Title>{intl.messages['col.myPool']}</Title>
              <MyButton onClick={() => {
                this.getBalance();
                this.setState({ depositVisible: true });
              }}>{intl.messages['col.deposit']}</MyButton>
              <MyButton onClick={() => {
                this.setState({ withdrawVisible: true });
              }}>{intl.messages['col.withdraw']}</MyButton>
              <MyButton onClick={() => {
                this.setState({ claimVisible: true });
              }}>{intl.messages['col.claimReturn']}</MyButton>
            </InALineLeft>
          </Header2>
          <SingleLine />
          <SmallSpace />
          <Row gutter={[24, 40]}>
            <Col span={6}><Box><MyStatistic title={intl.messages['col.myFPT']} value={beautyNumber(this.state.balance, 4)} /><ShortLine /></Box></Col>
            <Col span={6}><Box><MyStatistic title={intl.messages['col.percentageOfThePool']} value={this.state.totalSupply > 0 ? beautyNumber(this.state.balance / this.state.totalSupply * 100, 4) : 0} suffix="%" /><ShortLine /></Box></Col>
            <Col span={6}><Box><MyStatistic title={intl.messages['col.currentValue']} value={beautyNumber(this.state.balance * this.state.sharePrice, 4)} suffix="$" /><ShortLine /></Box></Col>
            <Col span={6}>
              <Tooltip title={this.state.minedFnx + ' (FNX) ' + this.state.minedWan + ' (WAN)'}>
                <Box><TwoStatics title={intl.messages['col.farmingReturn']} value={beautyNumber(this.state.minedFnx, 2) + " FNX / " + beautyNumber(this.state.minedWan, 2) + " WAN"} suffix="" /><ShortLine /></Box>
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
              this.setState({ claimVisible: false })
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
})(injectIntl(CollateralInfo)));