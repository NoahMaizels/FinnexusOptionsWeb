import { Component } from 'react';
import { LineChart, Line, Point, AreaChart } from 'bizcharts';
import { Statistic, Row, Col } from 'antd';
import styled from 'styled-components';
import { Header2, Space, ConnectWalletSub, MyStatistic, Box, ShortLine, InALineLeft, VerticalLine, BigTitle, SingleLine } from './index';



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
        <SingleLine/>
        <Header2>
          <InALineLeft>
            <Title>My Pool</Title>
            <MyButton onClick={() => { }}>Deposit</MyButton>
            <MyButton onClick={() => { }}>Withdraw</MyButton>
          </InALineLeft>
        </Header2>
        <SingleLine/>
        <SmallSpace />
        <Row gutter={[24, 40]}>
          <Col span={6}><Box><MyStatistic title="My shares token" value={'2.123456'} /><ShortLine coldColor/></Box></Col>
          <Col span={6}><Box><MyStatistic title="Percentage of the pool" value={'1.1'} suffix="%" /><ShortLine coldColor/></Box></Col>
          <Col span={6}><Box><MyStatistic title="Current value" value={'20.3413'} suffix="$" /><ShortLine coldColor/></Box></Col>
          <Col span={6}><Box><MyStatistic title="Total return" value={'32.1234'} suffix="$" /><ShortLine coldColor/></Box></Col>
        </Row>
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






export default CollateralInfo;

