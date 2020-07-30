import { connect } from "react-redux";
import { Component } from "react";
import { Modal, message, Carousel, Collapse } from "antd";
import BigNumber from 'bignumber.js';
import { Wallet, getSelectedAccount, WalletButton, WalletButtonLong, getSelectedAccountWallet } from "wan-dex-sdk-wallet";
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

  optionsColumn = [
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
      title: 'USD',
      dataIndex: "usd",
      key: 'usd',
    },
    {
      title: 'Expiration',
      dataIndex: "expiration",
      key: 'expiration',
    },
    {
      title: 'Operation',
      dataIndex: "operate",
      key: 'operate',
      render: (value, row) => {
       return ( <InALineSmall>
          <SmallButton onClick={() => { this.onSellOptions(row) }}><img src={require('../img/sell.png')} style={{ marginRight: "10px" }} />Sell</SmallButton>
          <SmallButton onClick={() => { this.onExerciseOptions(row) }}><img src={require('../img/transfer.png')} style={{ marginRight: "10px" }} />Exercise</SmallButton>
        </InALineSmall>)
      }
    },
  ]

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
    // {
    //   optionsName: "BTC call, 5th July, $7000",
    //   underlyingAssetsPrice: "BTC / $ 7200",
    //   amount: "0.12",
    //   amountPaid: "$ 60 / 500.123456 FNX",
    //   status: "Exercised"
    // },
    // {
    //   optionsName: "BTC call, 15th July, $7000",
    //   underlyingAssetsPrice: "BTC / $ 7200",
    //   amount: "0.12",
    //   amountPaid: "$ 60 / 500.123456 FNX",
    //   status: "Before expiration"
    // },
    // {
    //   optionsName: "BTC call, 1th July, $7000",
    //   underlyingAssetsPrice: "BTC / $ 7200",
    //   amount: "0.12",
    //   amountPaid: "$ 60 / 500.123456 FNX",
    //   status: "Past expiration"
    // },
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
          <SingleLine />
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
              <TabButtonSub select >My Options<MiddleLine visible style={{ top: "30px", left: "-72px" }} /></TabButtonSub>
            </InALineLeft>
          </Header2>
          <SingleLine />
          <DarkContainer>
            {/* <HistoryTable columns={this.optionsColumn} dataSource={this.demoMyOptions} /> */}
            <Assets mini/>
          </DarkContainer>
          <Header2>
            <InALineLeft>
              <TabButtonSub select={this.state.historySelect1} onClick={() => { this.onHistorySelect(1) }}>Orders History<MiddleLine visible={this.state.historySelect1} style={{ top: "30px", left: "-82px" }} /></TabButtonSub>
            </InALineLeft>
          </Header2>
          <SingleLine />
          <DarkContainer>
            <HistoryTable columns={this.historyColumn} dataSource={this.demoData} />
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
})(IndexPage);





