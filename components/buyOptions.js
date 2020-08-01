import styled from 'styled-components';
import { Component } from 'react';
import { Row, Col, Input, Radio, Select, InputNumber, Slider, Spin, message } from 'antd';
import MyChart from './chart.js';
import {
  ConnectWallet, BuyBlock, InALineLeft, InALine, VerticalLine,
  BigTitle, RadioGroup, RadioButton, CenterAlign, RadioButtonSmall,
  YellowText, AdjustInput, DarkText, SmallSpace, checkNumber, renderBuyOptionsModal
} from './index';
import { getCoinPrices, beautyNumber, getOptionsPrice, 
  getFee, getBalance, buyOptions,
  getCollateralInfo } from "../utils/scHelper.js";
import withRouter from 'umi/withRouter';
import { Wallet, getSelectedAccount, WalletButton, WalletButtonLong, getSelectedAccountWallet, getTransactionReceipt } from "wan-dex-sdk-wallet";
import { connect } from 'react-redux';
import { fnxTokenAddress } from '../conf/config.js';
import { insertOrderHistory, updateOrderStatus } from './db';

const { Option } = Select;


class BuyOptions extends Component {
  constructor(props) {
    super(props);
    this.state = {
      expiration: "7 days",
      amount: 1,
      strikePrice: 0,
      optType: "0",
      loading: false,
      amountToPay: '0$ / 0',
      valueToPay: 0,
      currencyToPay: "0",
      buyModalVisible: false,
      buyLoading: false,
      balance: 0,
      slider: 0,
    };

    this.needUpdate = true;
  }

  componentDidMount() {
    this.getInitPrice();
  }

  getInitPrice = async () => {
    let prices = getCoinPrices();
    // console.log('prices', prices);
    if (prices.WAN === 0) {
      setTimeout(this.getInitPrice, 1000);
      return;
    }

    this.setState({ strikePrice: prices[this.props.baseToken] });
  }

  calcLineData = (price, currentValue) => {
    let amount = this.state.amount;
    let optionsFee = -1 * currentValue;
    console.log('optionsFee', optionsFee);
    let data = [];
    for (let i = 0; i < 100; i++) {
      let linePrice = beautyNumber(price * (50 + i) / 100, 2);

      if (i < 50) {
        data.push({
          profit: optionsFee,
          price: linePrice,
        });
      } else {
        data.push({
          profit: beautyNumber(optionsFee + (amount * Math.abs(linePrice - price)), 4),
          price: linePrice,
        });
      }
    }
    this.minValue = optionsFee - Math.abs(optionsFee * 4);
    return data;
  }

  updateOptionsPrice = async () => {
    try {
      let expiration = this.state.expiration.split(' ')[0];
      expiration = expiration * (3600 * 24);
      let prices = getCoinPrices();
      let ret = await getOptionsPrice(prices["raw" + this.props.baseToken], this.state.strikePrice, expiration, this.props.baseToken === "BTC" ? 1 : 2, this.state.optType);
      console.log(ret);
      let currencyToPay = this.state.currencyToPay === "2" ? "WAN" : "FNX";
      let fee = getFee();
      let value = ret * this.state.amount * (1 + Number(fee.buyFee));
      let payAmount = value / prices[currencyToPay];
      this.needUpdate = false;
      this.lineData = this.calcLineData(prices[this.props.baseToken], beautyNumber(value, 4));

      this.setState({ amountToPay: beautyNumber(value, 4) + "$ / " + beautyNumber(payAmount, 4) });
      // console.log(value + "$ / " + payAmount);
      return ret;
    } catch (e) {
      console.log(e);
      return 0;
    }
  }

  buyOptions = () => {
    let expiration = this.state.expiration.split(' ')[0];
    expiration = expiration * (3600 * 24);
    let prices = getCoinPrices();
    this.setState({ buyLoading: true });
    getOptionsPrice(prices["raw" + this.props.baseToken], this.state.strikePrice, expiration, this.props.baseToken === "BTC" ? 1 : 2, this.state.optType).then((ret) => {
      console.log(ret);
      let currencyToPay = this.state.currencyToPay === "2" ? "WAN" : "FNX";
      let fee = getFee();
      let value = ret * this.state.amount * (1 + Number(fee.buyFee) + 0.01);
      let payAmount = value / prices[currencyToPay];
      let chainType = this.state.currencyToPay === "1" ? "eth" : "wan";
      if (!this.props.selectedAccount) {
        message.warn("Please select address");
        this.setState({ buyLoading: false });
        return;
      }

      let col = getCollateralInfo();
      if (value > col.availableCollateral/col.lowestPercent*100) {
        message.warn("Sorry, Collateral not enough.");
        this.setState({ buyLoading: false });
        return;
      }

      let address = this.props.selectedAccount.get('address');
      let time = (new Date()).toJSON().split('.')[0];

      let expirationWithYear = (new Date(Date.now() + expiration * 1000)).toDateString().split(' ').slice(1, 4).join(' ');

      let name = this.props.baseToken + " " + (this.state.optType === '0' ? 'Call' : 'Put') + ", " + expirationWithYear + ", $" + this.state.strikePrice + (this.state.currencyToPay !== '1' ? " @Wanchain" : " @Ethereum");
      console.log('name:', name);
      buyOptions(chainType,
        this.state.currencyToPay, payAmount, this.state.strikePrice,
        this.props.baseToken === "BTC" ? 1 : 2,
        expiration, this.state.amount, this.state.optType, this.props.selectedWallet, address).then((ret) => {
          if (ret) {
            message.info("Buy success");
            // this.setState({ buyLoading: false, buyModalVisible: false });
            updateOrderStatus(time, 'Success');
            this.props.update();
          } else {
            message.info("Sorry, buy failed");
            // this.setState({ buyLoading: false });
            updateOrderStatus(time, 'Failed');
            this.props.update();
          }
        }).catch((e) => {
          console.log(e);
          message.error("Sorry, buy failed. " + e.message);
          // this.setState({ buyLoading: false });
          updateOrderStatus(time, 'Failed');
        });

      insertOrderHistory(address, time, name, "+" + this.state.amount, '-' + this.state.amountToPay+currencyToPay, 'Buy', 'Pending');
      this.setState({ buyLoading: false, buyModalVisible: false });
      this.props.update();

    }).catch((e) => {
      console.log(e);
      message.error("Sorry, get price failed. " + e.message);
      this.setState({ buyLoading: false });
    });

  }

  getBalance = () => {
    if (this.props.selectedAccount) {
      let address = this.props.selectedAccount.get('address');
      // TODO:ETH
      let token = this.state.currencyToPay === "2" ? "0x0000000000000000000000000000000000000000" : fnxTokenAddress;
      console.log('getBalance');
      getBalance(token, address).then((ret) => {
        console.log('Balance', ret);
        this.setState({ balance: ret });
      }).catch(console.log);
    }
  }

  render() {
    if (this.needUpdate) {
      console.log('render', (new Date()).toLocaleTimeString());
      this.updateOptionsPrice();
    } else {
      this.needUpdate = true;
    }
    return (
      <CenterAlign style={{ background: "#1A1B2F" }}>
        <Row>
          <Col span={8}>
            <BuyBlock>
              <Row>
                <p>Corresponding {this.props.baseToken} Amount</p>
                <AdjustInput suffix={
                  <YellowText>{this.props.baseToken}</YellowText>
                } placeholder={"Enter " + this.props.baseToken + " amount"}
                  value={this.state.amount}
                  onChange={e => {
                    if (checkNumber(e)) {
                      this.setState({ amount: e.target.value });
                    }
                  }}
                />
                <ModifyButton onClick={() => { this.setState({ amount: beautyNumber(this.state.amount + 0.1) }); }}><img src={require('../img/add.png')} /></ModifyButton>
                <ModifyButton onClick={() => { this.setState({ amount: beautyNumber(this.state.amount - 0.1 > 0 ? this.state.amount - 0.1 : 0) }); }}><img src={require('../img/sub.png')} /></ModifyButton>
              </Row>
              <Row>
                <p>Strike Price</p>
                <AdjustInput suffix={
                  <YellowText>USD</YellowText>
                } placeholder={"Enter a price"}
                  value={beautyNumber(this.state.strikePrice, 1)}
                  onChange={e => {
                    if (checkNumber(e)) {
                      this.setState({ strikePrice: e.target.value });
                    }
                  }}
                />
                <ModifyButton onClick={() => { this.setState({ strikePrice: beautyNumber(this.state.strikePrice + 100) }); }}><img src={require('../img/add.png')} /></ModifyButton>
                <ModifyButton onClick={() => { this.setState({ strikePrice: beautyNumber(this.state.strikePrice - 100) }); }}><img src={require('../img/sub.png')} /></ModifyButton>
              </Row>
              <Row>
                <p>Expiration</p>
                <AdjustInput
                  value={this.state.expiration}
                  readOnly={true}
                />
                <DaySelect value={this.state.expiration} onChange={e => { this.setState({ expiration: e }); }}>
                  <Option value="1 day">1 day</Option>
                  <Option value="3 days">3 days</Option>
                  <Option value="7 days">7 days</Option>
                  <Option value="10 days">10 days</Option>
                  <Option value="15 days">15 days</Option>
                  <Option value="30 days">30 days</Option>
                  <Option value="90 days">90 days</Option>
                </DaySelect>
              </Row>
              <Row>
                <p>Options Type</p>
                <RadioGroup value={this.state.optType} onChange={(e) => { this.setState({ optType: e.target.value }); }} buttonStyle="solid">
                  <RadioButton value="0">Call</RadioButton>
                  <RadioButton value="1">Put</RadioButton>
                </RadioGroup>
              </Row>
              <Row>
                <p>Currency to Pay</p>
                <RadioGroup value={this.state.currencyToPay} onChange={(e) => { this.setState({ currencyToPay: e.target.value }); }} buttonStyle="solid">
                  <RadioButtonSmall value="0"><InALine>FNX<DarkText>(WRC20)</DarkText></InALine></RadioButtonSmall>
                  <RadioButtonSmall value="1"><InALine>FNX<DarkText>(ERC20)</DarkText></InALine></RadioButtonSmall>
                  <RadioButtonSmall value="2">WAN</RadioButtonSmall>
                </RadioGroup>
              </Row>
              <Row>
                <SmallSpace />
                <p>Amount to Pay</p>
                <Spin spinning={this.state.loading}>
                  <InALineLeft>
                    <Amount>{this.state.amountToPay}</Amount>
                    <AmountSuffix>
                      {
                        this.state.currencyToPay === "2"
                          ? "WAN"
                          : "FNX"
                      }
                    </AmountSuffix>
                  </InALineLeft>
                </Spin>
              </Row>
              <Row>
                <BuyButton onClick={() => {
                  this.getBalance();
                  this.setState({ buyModalVisible: true });
                }}>Buy Now</BuyButton>
              </Row>
            </BuyBlock>
          </Col>
          <Col span={16}>
            <Row>
              <InALineLeft style={{ width: "100%" }}>
                <VerticalLine />
                <BigTitle>{this.props.title}</BigTitle>
              </InALineLeft>
            </Row>
            <Row>
              <SubLine>
                <T1>Current {this.props.baseToken} Price:</T1>
                <T1Number>{beautyNumber(getCoinPrices()[this.props.baseToken],2) + '$'}</T1Number>
                <T2>Expected {this.props.baseToken} Price:</T2>
                <T2Number>{Number(getCoinPrices()[this.props.baseToken] * (100 + this.state.slider) / 100).toFixed(2)}$</T2Number>
                <PriceSlider
                  defaultValue={0}
                  max={49} min={-50}
                  tooltipVisible tipFormatter={(value) => { return <div>{value > 0 ? "+" + value + "%" : value + "%"}</div> }}
                  onChange={(value) => {
                    this.needUpdate = false;
                    this.setState({ slider: value });
                  }}
                />
              </SubLine>
            </Row>
            <Row>
              <MyChart lineData={this.lineData} slider={this.state.slider} optType={this.state.optType} minValue={this.minValue} />
            </Row>
          </Col>
        </Row>
        {
          renderBuyOptionsModal(this.state.buyModalVisible, () => {
            this.setState({ buyModalVisible: false });
          }, this.buyOptions,
            this.state.amountToPay, this.state.currencyToPay,
            this.state.balance, this.state.buyLoading, getFee(),
            this.props.selectedAccount ? this.props.selectedAccount.get("isLocked") : false)
        }

      </CenterAlign>
    );
  }
}

const BuyButton = styled(ConnectWallet)`
  width:320px;
  height:40px;
  background:linear-gradient(90deg,rgba(99,125,255,1) 0%,rgba(99,176,255,1) 100%);
  border-radius:4px;
`;

const ModifyButton = styled.button`
  width:40px;
  height:40px;
  background:rgba(48,49,71,1);
  border-radius:2px;
  color: white;
  border-width: initial;
  border-style: none;
  border-color: initial;
  border-image: initial;
  outline: none;
  margin-left: 5px;
  margin-top: 12px;
  &:hover {
    background:rgba(0,207,205,1);
  }
`;

const DaySelect = styled(Select)`
  width:85px;
  height:40px;
  background:rgba(48,49,71,1);
  border-radius:2px;
  text-align: center;
  margin: 12px 0px 0px 5px;
  border: none;
  .ant-select-selector {
    text-align: center;
    font-size:14px;
    font-family:HelveticaNeue;
    font-weight:400;
    color:rgba(255,255,255,1);
    border: none;
    height: 40px!important;
    padding: 5px 5px!important;
  }
`;

const Amount = styled.div`
  margin: 5px 0px 15px 0px;
  font-size:24px;
  font-family:Helvetica Neue;
  font-weight:400;
  color:rgba(255,255,255,1);
`;

const AmountSuffix = styled.div`
  margin: 10px 0px 15px 15px;
  font-size:18px;
  font-family:Helvetica Neue;
  font-weight:500;
  color:rgba(255,255,255,1);
`;

const SubLine = styled(InALineLeft)`
  width:895px;
  height:60px;
  background:rgba(31,32,52,1);
  border:1px solid rgba(47,48,82,1);
  padding: 12px;
  margin-top: 30px;
`;

const T1 = styled.div`
  font-size:18px;
  font-family:Helvetica Neue;
  font-weight:bold;
  color:rgba(255,255,255,1);
  margin: 0px 10px 0px 10px;
`;

const T1Number = styled.div`
  font-size:18px;
  font-family:Helvetica Neue;
  font-weight:bold;
  color:#FFBA00;
  margin: 0px 10px 0px 10px;
`;

const T2 = styled.div`
  font-size:16px;
  font-family:Helvetica Neue;
  font-weight:400;
  color:rgba(255,255,255,1);
  opacity:0.8;
  margin: 2px 10px 2px 10px;
`;

const T2Number = styled(T2)`
  font-weight:700;
`;

const PriceSlider = styled(Slider)`
  width:280px;
  .ant-slider-rail {
    background: linear-gradient(0deg, #4B93FF 100%, #345EFF 100%);
  }

  .ant-slider-track {
    background: linear-gradient(0deg, #4B93FF 100%, #345EFF 100%);
  }

  .ant-slider-handle {
    background:rgba(40,46,119,1);
    border: solid 2px rgba(75,147,255,1);
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
})(BuyOptions));