import styled from 'styled-components';
import { Component } from 'react';
import { Row, Col, Input, Radio, Select, InputNumber, Slider } from 'antd';
import MyChart from './chart.js';
import { ConnectWallet } from './index';

const { Option } = Select;


export default class BuyOptions extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    return (
      <CenterAlign>
        <Row>
          <h2>{this.props.title}</h2>
        </Row>
        <Row>
          <Col span={12}>
            <Row>
              <p>Corresponding {this.props.baseToken} Amount</p>
              <InputNumber
                defaultValue={1}
                formatter={value => `${value} ${this.props.baseToken}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={value => value.replace(/\$\s?|(,*)/g, '')}
                onChange={()=>{}}
                style={{width: "300px", textAlign: "center"}}
              />
            </Row>
            <Row>
              <p>Strike Price</p>
              <InputNumber
                defaultValue={1000}
                formatter={value => `${value} USD`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={value => value.replace(/\$\s?|(,*)/g, '')}
                onChange={()=>{}}
                style={{width: "300px", textAlign: "center"}}
              />
            </Row>
            <Row>
              <p>Expiration</p>
              <Select defaultValue="7">
                <Option value="1">1 day</Option>
                <Option value="3">3 days</Option>
                <Option value="7">7 days</Option>
                <Option value="10">10 days</Option>
                <Option value="15">15 days</Option>
                <Option value="30">30 days</Option>
                <Option value="90">90 days</Option>
              </Select>
            </Row>
            <Row>
              <p>Options Type</p>
              <Radio.Group defaultValue="put" buttonStyle="solid">
                <Radio.Button value="put">Put</Radio.Button>
                <Radio.Button value="call">Call</Radio.Button>
              </Radio.Group>
            </Row>
            <Row>
              <p>Currency to Pay</p>
              <Radio.Group defaultValue="fnxWrc20" buttonStyle="solid">
                <Radio.Button value="fnxWrc20">FNX(WRC20)</Radio.Button>
                <Radio.Button value="fnxErc20">FNX(ERC20)</Radio.Button>
                <Radio.Button value="eth">ETH</Radio.Button>
                <Radio.Button value="wan">WAN</Radio.Button>
              </Radio.Group>
            </Row>
          </Col>
          <Col span={12}>
            <Row>
              <p>Current {this.props.baseToken} Price: 8,200$</p>
            </Row>
            <Row>
              <p>Expected {this.props.baseToken} Price: 9,200$</p>
              <Slider defaultValue={30} style={{width: "100%"}}/>
            </Row>
            <Row>
              <MyChart />
            </Row>
          </Col>
        </Row>
        <Row>
          <p>Amount to Pay</p>
          <p>100 $ / 2000 FNX</p>
        </Row>
        <Row>
          <BuyButton>Buy Now</BuyButton>
        </Row>
      </CenterAlign>
    );
  }
}

const BuyButton = styled(ConnectWallet)`
  width: 100%;
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
    margin: 10px;
    font-size: 16px;
    width: 100%;
  }

  input {
    /* margin: 0px 20px 0px 20px; */
  }
`;
