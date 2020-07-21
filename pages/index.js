import { connect } from "react-redux";
import { Component } from "react";
import { Row, Col, Input, Slider, Radio, Table, Button, Divider, Spin, Modal, message, Carousel, Collapse } from "antd";
import BigNumber from 'bignumber.js';
import { Wallet, getSelectedAccount, WalletButton, WalletButtonLong, getSelectedAccountWallet } from "wan-dex-sdk-wallet";
import sleep from 'ko-sleep';
import { DownOutlined } from '@ant-design/icons';
import styled from 'styled-components';

import styles from './style.less';
import "wan-dex-sdk-wallet/index.css";

import {
  getOptionsInfo,
  getBalance,
  generateBuyOptionsTokenData,
  generateTx,
  watchTransactionStatus,
  sendTransaction,
  approve,
  getWeb3Obj,
  getBuyOptionsOrderAmount,
  sellOptionsToken,
  startEventScan
} from '../utils/scHelper';

import { wanTokenAddress, fnxTokenAddress, additionalFee } from "../conf/config";
import { Label } from "bizcharts";

import { HistoryTable, Center, Body, Header2, Space, DarkContainer, TabButtonSub, InALineBetween, InALineLeft, SingleLine, SubTitle, MiddleLine } from '../components';
import BuyOptions from "../components/buyOptions";


const { confirm } = Modal;
const { Panel } = Collapse;

let web3 = getWeb3Obj();

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
        console.log('address changed.');
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

  historyColumn = [
    {
      title: 'Options name',
      dataIndex: "optionsName",
      key: 'optionsName',
    },
    {
      title: 'Underlying assets price',
      dataIndex: "underlyingAssetsPrice",
      key: 'underlyingAssetsPrice',
    },
    {
      title: 'Amount',
      dataIndex: "amount",
      key: 'amount',
    },
    {
      title: 'Amount paid',
      dataIndex: "amountPaid",
      key: 'amountPaid',
    },
    {
      title: 'Status',
      dataIndex: "status",
      key: 'status',
    },
  ]

  demoData = [
    {
      optionsName: "BTC call, 5th July, $7000",
      underlyingAssetsPrice: "BTC / $ 7200",
      amount: "0.12",
      amountPaid: "$ 60 / 500.123456 FNX",
      status: "Success"
    },
    {
      optionsName: "BTC call, 15th July, $7000",
      underlyingAssetsPrice: "BTC / $ 7200",
      amount: "0.12",
      amountPaid: "$ 60 / 500.123456 FNX",
      status: "Pending"
    },
    {
      optionsName: "BTC call, 1th July, $7000",
      underlyingAssetsPrice: "BTC / $ 7200",
      amount: "0.12",
      amountPaid: "$ 60 / 500.123456 FNX",
      status: "Failed"
    },
  ]

  demoMyOptions = [
    {
      optionsName: "BTC call, 5th July, $7000",
      underlyingAssetsPrice: "BTC / $ 7200",
      amount: "0.12",
      amountPaid: "$ 60 / 500.123456 FNX",
      status: "Exercised"
    },
    {
      optionsName: "BTC call, 15th July, $7000",
      underlyingAssetsPrice: "BTC / $ 7200",
      amount: "0.12",
      amountPaid: "$ 60 / 500.123456 FNX",
      status: "Before expiration"
    },
    {
      optionsName: "BTC call, 1th July, $7000",
      underlyingAssetsPrice: "BTC / $ 7200",
      amount: "0.12",
      amountPaid: "$ 60 / 500.123456 FNX",
      status: "Past expiration"
    },
  ]


  render() {
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
          <SingleLine/>
          {
            this.state.tabSelect1
              ? <BuyOptions title="Choose and buy the options" baseToken="BTC" />
              : null
          }
          {
            this.state.tabSelect2
              ? <BuyOptions title="Choose and buy the options" baseToken="ETH" />
              : null
          }
          <Header2>
            <InALineLeft>
              <TabButtonSub select={this.state.historySelect1} onClick={() => { this.onHistorySelect(1) }}>Orders History<MiddleLine visible={this.state.historySelect1} style={{top:"30px", left: "-82px"}}/></TabButtonSub>
              <TabButtonSub select={this.state.historySelect2} onClick={() => { this.onHistorySelect(2) }}>My Options<MiddleLine visible={this.state.historySelect2} style={{top:"30px", left: "-72px"}}/></TabButtonSub>
            </InALineLeft>
          </Header2>
          <SingleLine/>
          <DarkContainer>
          {
            this.state.historySelect1
              ? <HistoryTable columns={this.historyColumn} dataSource={this.demoData} />
              : null
          }
          {
            this.state.historySelect2
              ? <HistoryTable columns={this.historyColumn} dataSource={this.demoMyOptions} />
              : null
          }
          </DarkContainer>
          <Space />
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
})(IndexPage);





