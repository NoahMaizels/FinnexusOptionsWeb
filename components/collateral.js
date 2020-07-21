import { Component } from 'react';
import { LineChart, Line, Point } from 'bizcharts';
import { Statistic, Row, Col } from 'antd';
import styled from 'styled-components';
import { Header2, Space, ConnectWalletSub, Center, DarkContainer, InALineLeft, VerticalLine, BigTitle } from './index';



class CollateralInfo extends Component {
  constructor(props) {
    super(props);
    this.state = {
    };
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
    }
  ];

  render() {
    return (
      <div style={{background:"#1A1C2B", padding: "20px"}}>
        <InALineLeft>
          <VerticalLine style={{marginLeft:"20px"}}/>
          <BigTitle>Pool Value</BigTitle>
        </InALineLeft>
        <LineChart
          padding={[10, 20, 50, 40]}
          autoFit
          height={300}
          data={this.props.chain === 'wan' ? this.dataWan : this.dataEth}
          xField='date'
          yField='amount'
          smooth={true}
        >
          {/* <Line position="price*profit" />
            <Point position="8000*-30" /> */}
        </LineChart>
        <Space />
        <Row gutter={[24, 40]}>
          <Col span={6}><Box><MyStatistic coldColor title="Bottom of collateral coverage" value={'350'} suffix="%" /><ShortLine coldColor/></Box></Col>
          <Col span={6}><Box><MyStatistic coldColor title="Lowest collateral percent" value={'300'} suffix="%" /><ShortLine coldColor/></Box></Col>
          <Col span={6}><Box><MyStatistic coldColor title="Net value for total shares" value={'21,234.13'} suffix="$" /><ShortLine coldColor/></Box></Col>
          <Col span={6}><Box><MyStatistic coldColor title="Net value for each share" value={'1.23'} suffix="$" /><ShortLine coldColor/></Box></Col>
        </Row>
        <Row gutter={[24, 40]}>
          <Col span={6}><Box><MyStatistic title="Total amount of shares" value={'35002.123456'} /><ShortLine/></Box></Col>
          <Col span={6}><Box><MyStatistic title="Return in this month" value={'180'} suffix="$" /><ShortLine/></Box></Col>
          <Col span={6}><Box><MyStatistic title="APR in this month" value={'20'} suffix="%" /><ShortLine/></Box></Col>
          <Col span={6}><Box><MyStatistic title="APR in this year" value={'25'} suffix="%" /><ShortLine/></Box></Col>
        </Row>
        
        <Header2>
          <InALineLeft>
            <Title>My Pool</Title>
            <MyButton onClick={() => { }}>Deposit</MyButton>
            <MyButton onClick={() => { }}>Withdraw</MyButton>
          </InALineLeft>
        </Header2>
        <Row gutter={[24, 40]}>
          <Col span={6}><Box><MyStatistic title="My shares token" value={'2.123456'} /><ShortLine coldColor/></Box></Col>
          <Col span={6}><Box><MyStatistic title="Percentage of the pool" value={'1.1'} suffix="%" /><ShortLine coldColor/></Box></Col>
          <Col span={6}><Box><MyStatistic title="Current value" value={'20.3413'} suffix="$" /><ShortLine coldColor/></Box></Col>
          <Col span={6}><Box><MyStatistic title="Total return" value={'32.1234'} suffix="$" /><ShortLine coldColor/></Box></Col>
        </Row>
        <Space/>
      </div>
    );
  }
}

const Title = styled.div`
  font-size: 16px;
  margin: 10px 40px 10px 10px;
  font-weight: 700;
`;

const MyButton = styled(ConnectWalletSub)``;

const MyStatistic = styled(Statistic)`
  .ant-statistic-title {
    position: relative;
    top: 70px;
    font-size:14px;
    font-family:HelveticaNeue;
    font-weight:400;
    color: ${props => props.coldColor ? '#A8B7FF' : '#C58A70'}
  }

  .ant-statistic-content {
    font-size:36px;
    font-family:HelveticaNeue;
    font-weight:300;
    color:rgba(255,255,255,1);
    line-height:46px;
  }
`;

const Box = styled.div`
  width:335px;
  height:120px;
  background:rgba(31,32,52,1);
  border-radius:4px;
  text-align:center;
`;

const ShortLine = styled.div`
  width:16px;
  height:2px;
  background: ${props => props.coldColor ? 'linear-gradient(90deg,rgba(99,125,255,1) 0%,rgba(99,176,255,1) 100%);':'linear-gradient(90deg,rgba(255,174,58,1) 1%,rgba(212,161,107,1) 100%);'};
  position: relative;
  top: 42px;
  left: 158px;
`;




export default CollateralInfo;

