import styled from 'styled-components';
import { Component } from 'react';
import { Row, Col, Input, Radio, Select, InputNumber, Slider, Button } from 'antd';
import MyChart from './chart.js';
import { ConnectWallet, BuyBlock, InALineLeft, InALine, VerticalLine, BigTitle } from './index';

const { Option } = Select;


export default class BuyOptions extends Component {
  constructor(props) {
    super(props);
    this.state = {
      expiration: "7 days"
    };
  }

  checkNumber = e => {
    const { value } = e.target;
    const reg = /^-?\d*(\.\d*)?$/;
    if ((!isNaN(value) && reg.test(value)) || value === '' || value === '-') {
      return true;
    }

    return false;
  }

  render() {
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
                    if (this.checkNumber(e)) {
                      this.setState({ amount: e.target.value });
                    }
                  }}
                />
                <ModifyButton><img src={require('../img/add.png')} /></ModifyButton>
                <ModifyButton><img src={require('../img/sub.png')} /></ModifyButton>
              </Row>
              <Row>
                <p>Strike Price</p>
                <AdjustInput suffix={
                  <YellowText>USD</YellowText>
                } placeholder={"Enter a price"}
                  value={this.state.strikePrice}
                  onChange={e => {
                    if (this.checkNumber(e)) {
                      this.setState({ strikePrice: e.target.value });
                    }
                  }}
                />
                <ModifyButton><img src={require('../img/add.png')} /></ModifyButton>
                <ModifyButton><img src={require('../img/sub.png')} /></ModifyButton>
              </Row>
              <Row>
                <p>Expiration</p>
                <AdjustInput
                  value={this.state.expiration}
                  readOnly={true}
                />
                <DaySelect value={this.state.expiration} onChange={e => this.setState({ expiration: e })}>
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
                <RadioGroup defaultValue="put" buttonStyle="solid">
                  <RadioButton value="put">Put</RadioButton>
                  <RadioButton value="call">Call</RadioButton>
                </RadioGroup>
              </Row>
              <Row>
                <p>Currency to Pay</p>
                <RadioGroup defaultValue="fnxWrc20" buttonStyle="solid">
                  <RadioButtonSmall value="fnxWrc20"><InALine>FNX<DarkText>(WRC20)</DarkText></InALine></RadioButtonSmall>
                  <RadioButtonSmall value="fnxErc20"><InALine>FNX<DarkText>(ERC20)</DarkText></InALine></RadioButtonSmall>
                  <RadioButtonSmall value="wan">WAN</RadioButtonSmall>
                </RadioGroup>
              </Row>
              <Row>
                <SmallSpace />
                <p>Amount to Pay</p>
                <InALineLeft>
                  <Amount>100$ / 2000</Amount>
                  <AmountSuffix>FNX</AmountSuffix>
                </InALineLeft>

              </Row>
              <Row>
                <BuyButton>Buy Now</BuyButton>
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
                <T1Number>8,200$</T1Number>
                <T2>Expected {this.props.baseToken} Price:</T2>
                <T2Number>9,200$</T2Number>
                <PriceSlider defaultValue={30} />
              </SubLine>
            </Row>
            <Row>
              <MyChart />
            </Row>
          </Col>
        </Row>


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

const CenterAlign = styled.div`
  text-align: left;
  margin: auto;
  padding: 20px;
  h2 {
    text-align: center;
    width: 100%;
    margin: 10px 0px 20px 0px;
  }

  p {
    text-align: left;
    margin: 0px;
    font-size:14px;
    font-family:Helvetica Neue;
    font-weight:400;
    color:rgba(172,181,227,1);
    width: 100%;
  }
`;

const AdjustInput = styled(Input)`
  margin: 12px 0px 12px 0px;
  width:230px;
  height:40px;
  background:rgba(48,49,71,1);
  border-radius:2px;
  font-size:14px;
  text-align: center;
  input.ant-input {
    text-align: center;
    font-size:14px;
    font-family:HelveticaNeue;
    font-weight:400;
    color:rgba(255,255,255,1);
    padding: 5px;
  }
`;

const YellowText = styled.div`
  font-size:14px;
  font-family:HelveticaNeue;
  font-weight:400;
  color:rgba(255,186,0,1);
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

const RadioButton = styled(Radio.Button)`
  width:160px;
  height:35px;
  background:transparent;
  border-radius:2px;
  margin: 0px;
  font-size:16px;
  font-family:Helvetica Neue;
  font-weight:400;
  color:rgba(255,255,255,1);
  opacity:0.5;
  text-align: center;
  border: none;
  padding: 4px;
`;

const RadioGroup = styled(Radio.Group)`
  width:320px;
  height:35px;
  background:rgba(26,27,44,1);
  border-radius:2px;
  padding: 0px;
  margin: 12px 0px 12px 0px;
  .ant-radio-button-wrapper-checked:not([class*=' ant-radio-button-wrapper-disabled']).ant-radio-button-wrapper {
    background:linear-gradient(90deg,rgba(99,125,255,1) 0%,rgba(99,176,255,1) 100%);
    border-radius:2px;
    color: white;
    opacity: 1;
  }
`;

const RadioButtonSmall = styled(RadioButton)`
  width: 106px;
  font-size:14px;
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

const SmallSpace = styled.div`
  width: 100%;
  height: 5px;
`;

const DarkText = styled.div`
  font-size:12px;
  font-family:RobotoCondensed;
  font-weight:400;
  color:rgba(255,255,255,1);
  opacity:0.6;
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
  width:330px;
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