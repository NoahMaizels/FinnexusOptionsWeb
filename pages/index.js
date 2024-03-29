import { connect } from "react-redux";
import { Component } from "react";
import { Modal, message, Carousel, Collapse } from "antd";
import BigNumber from 'bignumber.js';
import { getSelectedAccount, getSelectedAccountWallet } from "wan-dex-sdk-wallet";
import sleep from 'ko-sleep';
import { DownOutlined } from '@ant-design/icons';
import styled from 'styled-components';

import "wan-dex-sdk-wallet/index.css";

import { wanTokenAddress, fnxTokenAddress, additionalFee } from "../conf/config";

import { HistoryTable, Center, Body, Header2, Space, DarkContainer, 
  TabButtonSub, InALineBetween, InALineLeft, SingleLine, SubTitle, MiddleLine,
  SmallButton, InALine } from '../components';
import BuyOptions from "../components/buyOptions";

import Assets from './assets';

import { getOrderHistory } from '../components/db';
import { injectIntl } from 'umi';

import { getOrderHistoryColumn } from '../components/historyColums';

class IndexPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      tabSelect1: true,
      tabSelect2: false,
      historySelect1: true,
      historySelect2: false,
    };

  }

  async componentDidMount() {

  }

  // TODO: eth and wan both update
  componentDidUpdate(pre) {
    if (!pre.selectedAccount) {
      return;
    }
    let preAddr = pre.selectedAccount.get('address');
    if (this.props.selectedAccount) {
      let currentAddr = this.props.selectedAccount.get('address');
      if (preAddr !== currentAddr) {
        // console.log('address changed.');
        this.updatePage(true);
      }
    }
  }

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

  onHistorySelect = (id) => {
    switch (id) {
      case 1:
        this.setState({ historySelect1: true, historySelect2: false });
        break;
      case 2:
        this.setState({ historySelect1: false, historySelect2: true });
        break;
      default:
        this.setState({ historySelect1: true, historySelect2: false });
        break;
    }
  }

  render() {
    const intl = this.props.intl;
    return (
      <Center>
        <Body>
          <Carousel ><img src={require('../img/banner.png')} /></Carousel>
          <Header2>
            <InALineBetween>
              <InALineLeft>
                <TabButtonSub select={this.state.tabSelect1} onClick={() => { this.onTabSelect(1) }}><img src={require('../img/BTC.png')} /><SubTitle>BTC<MiddleLine visible={this.state.tabSelect1} /></SubTitle></TabButtonSub>
                <TabButtonSub select={this.state.tabSelect2} onClick={() => { this.onTabSelect(2) }}><img src={require('../img/ETH.png')} /><SubTitle>ETH<MiddleLine visible={this.state.tabSelect2} /></SubTitle></TabButtonSub>
              </InALineLeft>
            </InALineBetween>
          </Header2>
          <SingleLine />
          {
            this.state.tabSelect1
              ? <BuyOptions title={intl.messages['index.buyTitle']} baseToken="BTC" update={()=>{this.setState()}} />
              : null
          }
          {
            this.state.tabSelect2
              ? <BuyOptions title={intl.messages['index.buyTitle']} baseToken="ETH" update={()=>{this.setState()}}/>
              : null
          }
          <Header2>
            <InALineLeft>
              <TabButtonSub select >{intl.messages['index.myOptions']}<MiddleLine visible style={{ top: "30px", left: "-72px" }} /></TabButtonSub>
            </InALineLeft>
          </Header2>
          <SingleLine />
          <DarkContainer>
            {/* <HistoryTable columns={this.optionsColumn} dataSource={this.demoMyOptions} /> */}
            <Assets mini update={()=>{this.setState()}}/>
          </DarkContainer>
          <Header2>
            <InALineLeft>
              <TabButtonSub select={this.state.historySelect1} onClick={() => { this.onHistorySelect(1) }}>{intl.messages['index.orderHistory']}<MiddleLine visible={this.state.historySelect1} style={{ top: "30px", left: "-82px" }} /></TabButtonSub>
            </InALineLeft>
          </Header2>
          <SingleLine />
          <DarkContainer>
            <HistoryTable columns={getOrderHistoryColumn(intl)} dataSource={getOrderHistory(this.props.selectedAccount?this.props.selectedAccount.get('address'):'')} />
          </DarkContainer>
          <Space />
        </Body>
      </Center>
    );
  }
}



const InALineSmall = styled(InALine)`
  width: 240px;
  margin-right: -24px;
`;



export default connect(state => {
  const selectedAccountID = state.WalletReducer.get('selectedAccountID');
  return {
    selectedAccount: getSelectedAccount(state),
    selectedWallet: getSelectedAccountWallet(state),
    networkId: state.WalletReducer.getIn(['accounts', selectedAccountID, 'networkId']),
    selectedAccountID,
  }
})(injectIntl(IndexPage));





