import { Carousel } from 'antd';
import { Component } from 'react';
import { SingleLine, Center, Body, Header2, Space, MiddleLine, 
  TabButtonSub, InALineBetween, InALineLeft, SubTitle, DarkContainer, HistoryTable } from '../components';
import CollateralInfo from '../components/collateral.js';


class Collateral extends Component {
  constructor(props) {
    super(props);
    this.state = {
      tabSelect1: true,
      tabSelect2: false
    };
  }

  historyColumn = [
    {
      title: 'Time',
      dataIndex: "time",
      key: 'time',
    },
    {
      title: 'Token',
      dataIndex: "token",
      key: 'token',
    },
    {
      title: 'Type',
      dataIndex: "type",
      key: 'type',
    },
    {
      title: 'Amount',
      dataIndex: "amount",
      key: 'amount',
    },
    {
      title: 'Value',
      dataIndex: "value",
      key: 'value',
    },
    {
      title: 'Currency',
      dataIndex: "currency",
      key: 'currency',
    },
    {
      title: 'Status',
      dataIndex: "status",
      key: 'status',
    },
    {
      title: 'Operation',
      dataIndex: 'operation',
      key: 'operation'
    }
  ]

  onTabSelect = (id) => {
    switch (id) {
      case 1:
        this.setState({ tabSelect1: true, tabSelect2: false });
        break;
      case 2:
        this.setState({ tabSelect1: false, tabSelect2: true });
        break;
      default:
        this.setState({ tabSelect1: true, tabSelect2: false });
        break;
    }
  }

  handleCancel = e => {
    console.log(e);
    this.setState({
      visible: false,
    });
  };

  render() {
    return (
      <Center>
        <Body>
          <Carousel><img src={require('../img/banner2.png')} /></Carousel>
          <Header2>
            <InALineLeft>
              <TabButtonSub select={this.state.tabSelect1} onClick={() => { this.onTabSelect(1) }}><img src={require('../img/wanchain.png')} /><SubTitle>Wanchain<MiddleLine visible={this.state.tabSelect1} /></SubTitle></TabButtonSub>
              <TabButtonSub select={this.state.tabSelect2} onClick={() => { this.onTabSelect(2) }}><img src={require('../img/ETH.png')} /><SubTitle>Ethereum<MiddleLine visible={this.state.tabSelect2} /></SubTitle></TabButtonSub>
            </InALineLeft>
          </Header2>
          <SingleLine/>
          {
            this.state.tabSelect1
              ? <CollateralInfo chainType='wan' />
              : null
          }
          {
            this.state.tabSelect2
              ? <CollateralInfo chainType='eth' />
              : null
          }
          <Header2>
            <InALineLeft>
              <TabButtonSub select>FPT History<MiddleLine visible style={{ top: "30px", left: "-82px" }} /></TabButtonSub>
            </InALineLeft>
          </Header2>
          <SingleLine />
          <DarkContainer>
            <HistoryTable columns={this.historyColumn}/>
          </DarkContainer>
        </Body>
      </Center>
    );
  }
}

export default Collateral;

