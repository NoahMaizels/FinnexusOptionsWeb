import { Component } from 'react';
import { LineChart, Line, Point } from 'bizcharts';
import { Statistic, Row, Col } from 'antd';
import styled from 'styled-components';
import { Header2, Space, ConnectWalletSub, TabButtonSub, InALineBetween, InALineLeft } from './index';



class CollateralInfo extends Component {
  constructor(props) {
    super(props);
    this.state = {
    };
  }

  data = [
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

  render() {
    return (
      <div>
        <LineChart
          padding={[10, 20, 50, 40]}
          autoFit
          height={300}
          data={this.data}
          xField='date'
          yField='amount'
          smooth={true}
          title={{
            visible: true,
            text: 'Pool Value',
          }}
          description={{
            visible: true,
            text: 'Pool Value',
          }}
        >
          {/* <Line position="price*profit" />
            <Point position="8000*-30" /> */}
        </LineChart>
        <Space />
        <Row gutter={[24, 40]}>
          <Col span={6}><Statistic title="Bottom of collateral coverage" value={'350'} suffix="%" /></Col>
          <Col span={6}><Statistic title="Lowest collateral percent" value={'300'} suffix="%" /></Col>
          <Col span={6}><Statistic title="Net value for total shares" value={'21,234.13'} suffix="$" /></Col>
          <Col span={6}><Statistic title="Net value for each share" value={'1.23'} suffix="$" /></Col>
        </Row>
        <Row gutter={[24, 40]}>
          <Col span={6}><Statistic title="Total amount of shares" value={'35002.123456'} /></Col>
          <Col span={6}><Statistic title="Return in this month" value={'180'} suffix="$" /></Col>
          <Col span={6}><Statistic title="APR in this month" value={'20'} suffix="%" /></Col>
          <Col span={6}><Statistic title="APR in this year" value={'25'} suffix="%" /></Col>
        </Row>
        
        <Header2>
          <InALineLeft>
            <Title>My Pool</Title>
            <MyButton onClick={() => { }}>Deposit</MyButton>
            <MyButton onClick={() => { }}>Withdraw</MyButton>
          </InALineLeft>
        </Header2>
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



export default CollateralInfo;

