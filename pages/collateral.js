import { Carousel } from 'antd';
import { Component } from 'react';
import { SingleLine, Center, Body, Header2, Space, MiddleLine, 
  TabButtonSub, InALineBetween, InALineLeft, SubTitle, DarkContainer, HistoryTable } from '../components';
import CollateralInfo from '../components/collateral.js';
import {getCollateralHistory} from '../components/db';
import { getSelectedAccount, getSelectedAccountWallet } from "wan-dex-sdk-wallet";
import { connect } from "react-redux";


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
      title: 'FPT Amount',
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
              ? <CollateralInfo chainType='wan' update={()=>{this.setState({})}} />
              : null
          }
          {
            this.state.tabSelect2
              ? <CollateralInfo chainType='eth' update={()=>{this.setState({})}} />
              : null
          }
          <Header2>
            <InALineLeft>
              <TabButtonSub select>FPT History<MiddleLine visible style={{ top: "30px", left: "-82px" }} /></TabButtonSub>
            </InALineLeft>
          </Header2>
          <SingleLine />
          <DarkContainer>
            <HistoryTable columns={this.historyColumn} dataSource={getCollateralHistory(this.props.selectedAccount?this.props.selectedAccount.get('address'):'')}/>
          </DarkContainer>
        </Body>
      </Center>
    );
  }
}


export default connect(state => {
  const selectedAccountID = state.WalletReducer.get('selectedAccountID');
  return {
    selectedAccount: getSelectedAccount(state),
    selectedWallet: getSelectedAccountWallet(state),
    networkId: state.WalletReducer.getIn(['accounts', selectedAccountID, 'networkId']),
    selectedAccountID,
  }
})(Collateral);
