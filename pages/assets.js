import styled from 'styled-components';
import {
  Body, Center, Space, Box, VerticalLine,
  InALineLeft, BigTitle, MyStatistic, InALineAround, HistoryTable,
  renderSellOptionsModal, checkNumber, renderExerciseModal, renderTransferModal, MyButton, SmallButton
} from '../components';
import { Row, Col, Spin, message } from 'antd';
import { Component } from 'react';
import {
  getBalance, getCoinPrices, getCollateralInfo, beautyNumber, getUserOptions,
  getOptionsPrices, getFee, sellOptions, exerciseOptions, transferToken,
  getOptionsLimitTimeById
} from '../utils/scHelper';
import withRouter from 'umi/withRouter';
import { getSelectedAccount, getSelectedAccountWallet, getTransactionReceipt } from "wan-dex-sdk-wallet";
import { connect } from 'react-redux';
import { fnxTokenAddress, contractInfo } from '../conf/config';
import { insertOrderHistory, updateOrderStatus } from '../components/db';

class Assets extends Component {
  constructor(props) {
    super(props);

    this.state = {
      loading: false,
      optionsOperateLoading: false,
      sellOptionsModalVisible: false,
      exerciseOptionsModalVisible: false,
      transferModalVisible: false,
      optionsID: -1,
      optionsName: "",
      optionsAmount: "",
      chainType: "",
      optionsBalance: 0,
      transferName: "",
      transferAmount: "",
      transferTo: "",
      transferBalance: "",
      transferToken: "0x0000000000000000000000000000000000000000",
      assets: [
        {
          assets: "ETH",
          balance: "0",
          usd: "$ 0",
          currentReturn: "--",
          expiration: '--',
          operation: 0,
          key: 'eth'
        },
        {
          assets: "WAN",
          balance: "0",
          usd: "$ 0",
          currentReturn: "--",
          expiration: '--',
          operation: 0,
          key: 'wan'
        },
        {
          assets: "FPT @Wanchain",
          balance: "0",
          usd: "$ 0",
          currentReturn: "--",
          expiration: '--',
          operation: 2,
          key: 'FPT @Wanchain'
        },
        {
          assets: "FPT @Ethereum",
          balance: "0",
          usd: "$ 0",
          currentReturn: "--",
          expiration: '--',
          operation: 2,
          key: "FPT @Ethereum"
        },
        {
          assets: "FNX @Ethereum",
          balance: "0",
          usd: "$ 0",
          currentReturn: "--",
          expiration: '--',
          operation: 0,
          key: "FNX @Ethereum",
        },
        {
          assets: "FNX @Wanchain",
          balance: "0",
          usd: "$ 0",
          currentReturn: "--",
          expiration: '--',
          operation: 0,
          key: "FNX @Wanchain",
        },
      ],
      options: []
    };
  }

  column = [
    {
      title: 'ID',
      dataIndex: "id",
      key: 'id',
      visible: false,
    },
    {
      title: 'Assets',
      dataIndex: "assets",
      key: 'assets',
    },
    {
      title: 'Balance',
      dataIndex: "balance",
      key: 'balance',
    },
    {
      title: '$ USD',
      dataIndex: "usd",
      key: 'usd',
    },
    {
      title: 'Current return',
      dataIndex: "currentReturn",
      key: 'currentReturn',
    },
    {
      title: 'Expiration',
      dataIndex: "expiration",
      key: 'expiration',
    },
    {
      title: 'Operation',
      dataIndex: "operation",
      key: 'operation',
      render: (value, row) => {
        if (value === 0) {
          return (
            <InALineLeft>
              <SmallButton><img src={require('../img/buy.png')} style={{ marginRight: "10px" }} />Buy</SmallButton>
              <SmallButton><img src={require('../img/sell.png')} style={{ marginRight: "10px" }} />Sell</SmallButton>
              <SmallButton onClick={() => { this.onTransfer(row.assets) }}><img src={require('../img/transfer.png')} style={{ marginRight: "10px" }} />Transfer</SmallButton>
            </InALineLeft>
          );
        } else if(value === 1) {
          return (
            <InALineLeft>
              <SmallButton onClick={() => { this.onSellOptions(row) }}><img src={require('../img/sell.png')} style={{ marginRight: "10px" }} />Sell</SmallButton>
              <SmallButton onClick={() => { this.onExerciseOptions(row) }}><img src={require('../img/transfer.png')} style={{ marginRight: "10px" }} />Exercise</SmallButton>
            </InALineLeft>
          );
        } else {
          return (
            <InALineLeft>
              <SmallButton><img src={require('../img/buy.png')} style={{ marginRight: "10px" }} />Deposit</SmallButton>
              <SmallButton><img src={require('../img/sell.png')} style={{ marginRight: "10px" }} />Withdraw</SmallButton>
              <SmallButton onClick={() => { this.onTransfer(row.assets) }}><img src={require('../img/transfer.png')} style={{ marginRight: "10px" }} />Transfer</SmallButton>
            </InALineLeft>
          );
        }
      }
    },
  ]

  componentDidMount() {
    this.updateInfo(true);
  }

  componentWillUnmount() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = undefined;
    }
  }

  onSellOptions = (info) => {
    console.log('onSellOptions', info);
    let id = info.id;
    if (id === -1) {
      message.error("Sorry, can't find options id by name");
    }
    getOptionsLimitTimeById(id).then((ret)=>{
      console.log('getOptionsLimitTimeById', ret);
      if(Number(ret) > Date.now()/1000) {
        message.warn("Can not sell options in 1 hour after buy.");
        return;
      }

      let chainType = info.assets.includes('Wanchain') ? 'wan' : 'eth';
      this.setState({ optionsID: id, chainType, optionsName: info.assets, optionsBalance: info.balance, sellOptionsModalVisible: true });
  
    }).catch((e)=>{
      console.log(e);
    })
  }

  onSellOptionsOk = () => {
    if (Number(this.state.optionsBalance) < Number(this.state.optionsAmount)) {
      message.warn("Sorry, balance is not enough");
      return;
    }

    if (!this.props.selectedAccount) {
      message.warn("Please connect wallet first");
      return;
    }

    let address = this.props.selectedAccount.get("address");
    let time = (new Date()).toLocaleString();
    let options = this.getOptionsById(this.state.optionsID);
    let sellValue = '';
    if (options.price) {
      sellValue = beautyNumber(options.price * this.state.optionsAmount, 4) + '$';
    }

    console.log('onSellOptionsOk', options);

    this.setState({ optionsOperateLoading: true });

    sellOptions(this.state.chainType, this.state.optionsID, this.state.optionsAmount, this.props.selectedWallet, address).then((ret) => {
      if (ret) {
        message.info("Sell options success");
        // this.setState({ optionsID: -1, sellOptionsModalVisible: false, optionsAmount: '', optionsName: '', optionsOperateLoading: false });
        updateOrderStatus(time, "Success");
      } else {
        message.error("Sell options failed");
        // this.setState({ optionsOperateLoading: false });
        updateOrderStatus(time, "Failed");
      }
    }).catch(e => {
      console.log(e);
      message.error(e.message);
      // this.setState({ optionsOperateLoading: false });
      updateOrderStatus(time, "Failed");
    });

    insertOrderHistory(address, time, options.name, -1 * this.state.optionsAmount, sellValue, 'Sell', 'Pending');
    this.setState({ sellOptionsModalVisible: false, optionsAmount: '', optionsName: '', optionsOperateLoading: false });
  }

  onSellOptionsCancel = () => {
    this.setState({ optionsID: -1, sellOptionsModalVisible: false, optionsAmount: '', optionsName: '' });
  }

  onExerciseOptions = (info) => {
    console.log('onExerciseOptions', info);
    let id = info.id;
    if (id === -1) {
      message.error("Sorry, can't find options id by name");
    }

    getOptionsLimitTimeById(id).then((ret)=>{
      console.log('getOptionsLimitTimeById', ret);
      if(Number(ret) > Date.now()/1000) {
        message.warn("Can not exercise options in 1 hour after buy.");
        return;
      }

      let chainType = info.assets.includes('Wanchain') ? 'wan' : 'eth';
      this.setState({ optionsID: id, chainType, optionsName: info.assets, optionsBalance: info.balance, exerciseOptionsModalVisible: true });
    }).catch((e)=>console.log(e));

  }

  onExerciseOk = () => {
    if (Number(this.state.optionsBalance) < Number(this.state.optionsAmount)) {
      message.warn("Sorry, balance is not enough");
      return;
    }

    if (!this.props.selectedAccount) {
      message.warn("Please connect wallet first");
      return;
    }

    let address = this.props.selectedAccount.get("address");
    let time = (new Date()).toLocaleString();
    let options = this.getOptionsById(this.state.optionsID);

    this.setState({ optionsOperateLoading: true });

    exerciseOptions(this.state.chainType, this.state.optionsID, this.state.optionsAmount, this.props.selectedWallet, address).then((ret) => {
      if (ret) {
        message.info("Exercise options success");
        updateOrderStatus(time, "Success");
        // this.setState({ optionsID: -1, exerciseOptionsModalVisible: false, optionsAmount: '', optionsName: '', optionsOperateLoading: false });
      } else {
        message.error("Exercise options failed");
        updateOrderStatus(time, "Failed");
        // this.setState({ optionsOperateLoading: false });
      }
    }).catch(e => {
      console.log(e);
      message.error(e.message);
      updateOrderStatus(time, "Failed");
      // this.setState({ optionsOperateLoading: false });
    });

    let value ;
    let prices = getCoinPrices();
    if (options.optType === "Call") {
      if (Number(prices[options.underlying]) <= Number(options.strikePrice)) {
        value = "0";
      } else {
        value = beautyNumber(this.state.optionsAmount * (Number(prices[options.underlying]) - Number(options.strikePrice)), 4) + "$" ;
      }
    } else {
      if (Number(prices[options.underlying]) >= Number(options.strikePrice)) {
        value = "0";
      } else {
        value = beautyNumber(this.state.optionsAmount * (Number(options.strikePrice) - Number(prices[options.underlying])), 4) + "$" ;
      }
    }

    insertOrderHistory(address, time, options.name, -1 * this.state.optionsAmount, value, 'Exercise', 'Pending');
    this.setState({ exerciseOptionsModalVisible: false, optionsAmount: '', optionsName: '', optionsOperateLoading: false });
  }

  onExerciseCancel = () => {
    this.setState({ optionsID: -1, exerciseOptionsModalVisible: false, optionsAmount: '', optionsName: '' });
  }

  onTransferOk = () => {
    if (Number(this.state.transferBalance) < Number(this.state.transferAmount)) {
      message.warn("Sorry, balance is not enough");
      return;
    }

    if (!this.props.selectedAccount) {
      message.warn("Please connect wallet first");
      return;
    }

    let address = this.props.selectedAccount.get("address");

    this.setState({ optionsOperateLoading: true });

    // chainType, token, to, value, selectedWallet, address
    let token = '';
    transferToken(this.state.chainType, this.state.transferToken, this.state.transferTo, this.state.transferAmount, this.props.selectedWallet, address).then((ret) => {
      if (ret) {
        message.info("Transfer success");
        this.setState({ optionsID: -1, transferModalVisible: false, optionsAmount: '', optionsName: '', optionsOperateLoading: false });
      } else {
        message.error("Transfer failed");
        this.setState({ optionsOperateLoading: false });
      }
    }).catch(e => {
      console.log(e);
      message.error(e.message);
      this.setState({ optionsOperateLoading: false });
    });
  }

  onTransferCancel = () => {
    this.setState({ transferModalVisible: false });
  }

  getTableData = () => {
    let assets = [];

    if (!this.props.mini) {
      assets = this.state.assets.filter((v) => {
        return !v.assets.includes('FNX');
      });
    }

    let options = this.state.options.filter((v) => {
      return Number(v.balance) !== 0;
    })

    return assets.concat(options);
  }

  getPanelData = () => {
    return this.state.assets.filter((v) => {
      return v.assets.includes('FNX');
    });
  }

  setInfo = (symbol, balance, usd) => {
    console.log('setInfo', symbol, balance, usd);
    let assets = this.state.assets.slice();
    for (let i = 0; i < assets.length; i++) {
      if (assets[i].assets === symbol) {
        assets[i].balance = beautyNumber(balance, 4);
        assets[i].usd = "$" + beautyNumber(usd, 4).toString();
        break;
      }
    }
    this.setState({ assets });
  }

  getLeftTimeStr = (expiration) => {
    let leftTime = (expiration - Date.now() / 1000);
    let timeStr = "";
    if (leftTime < 0) {
      timeStr = "expired";
    } else {
      const d = parseInt(leftTime / 24 / 3600);
      leftTime = leftTime % (24 * 3600);
      const h = parseInt(leftTime / 3600);
      leftTime = leftTime % 3600;

      const m = parseInt(leftTime / 60);
      leftTime = leftTime % 60;

      const s = leftTime;
      timeStr = d + "d " + h + "h ";
      if (d === 0 && h === 0) {
        timeStr = "< 1h";
      }
      // timeStr = d + "d " + h + "h " + m + "m";
    }
    return timeStr;
  }

  setOptions = (optionsInfo) => {
    console.log('setOptions', optionsInfo);
    let prices = getCoinPrices();
    let options = [];
    for (let i = 0; i < optionsInfo.length; i++) {
      let op = {
        id: optionsInfo[i].id,
        assets: optionsInfo[i].name,
        balance: optionsInfo[i].amount,
        usd: "loading",
        currentReturn: "loading",
        expiration: this.getLeftTimeStr(optionsInfo[i].expiration),
        operation: 1
      };

      if (optionsInfo[i].optType === "Call") {
        if (Number(prices[optionsInfo[i].underlying]) <= Number(optionsInfo[i].strikePrice)) {
          op.currentReturn = "0";
        } else {
          op.currentReturn = beautyNumber(optionsInfo[i].amount * (Number(prices[optionsInfo[i].underlying]) - Number(optionsInfo[i].strikePrice)), 4) + "$" ;
        }
      } else {
        if (Number(prices[optionsInfo[i].underlying]) >= Number(optionsInfo[i].strikePrice)) {
          op.currentReturn = "0";
        } else {
          op.currentReturn = beautyNumber(optionsInfo[i].amount * (Number(optionsInfo[i].strikePrice) - Number(prices[optionsInfo[i].underlying])), 4) + "$" ;
        }
      }

      if (optionsInfo[i].price) {
        op.usd = beautyNumber(optionsInfo[i].price * optionsInfo[i].amount, 4) + '$';
      }
      options.push(op);
    }

    this.setState({ options });
  }

  getOptionsById = (id) => {
    let options = getUserOptions();
    for (let i = 0; i < options.length; i++) {
      if (id === options[i].id) {
        return options[i];
      }
    }
  }

  updateInfo = (loading) => {
    if (loading) {
      this.setState({ loading: loading });
    }

    let prices = getCoinPrices();
    let options = getUserOptions();
    if (Number(prices.WAN) === 0 || !this.props.selectedAccount) {
      this.timer = setTimeout(this.updateInfo, 3000);
      return;
    }
    let colInfo = getCollateralInfo();
    let address = this.props.selectedAccount.get('address');

    getBalance('0x0000000000000000000000000000000000000000', address).then((ret) => {
      this.setInfo('WAN', ret, ret * prices.WAN);
    }).catch(e => console.log(e));

    getBalance(fnxTokenAddress, address).then((ret) => {
      this.setInfo('FNX @Wanchain', ret, ret * prices.FNX);
    }).catch(e => console.log(e));

    getBalance(contractInfo.FPTCoin.address, address).then((ret) => {
      this.setInfo('FPT @Wanchain', ret, ret * colInfo.sharePrice);
    }).catch(e => console.log(e));

    // this.setOptions(options);

    getOptionsPrices().then(() => {
      let optionsWithPrice = getUserOptions();
      console.log('optionsWithPrice', optionsWithPrice);
      this.setOptions(optionsWithPrice);
      this.setState({ loading: false });
    }).catch(e => console.log(e));

    this.timer = setTimeout(this.updateInfo, 30000);
  }

  onTransfer = (tokenName) => {
    console.log('onTransfer', tokenName);
    if (tokenName === 'FNX(WRC20)') {
      this.setState({
        chainType: 'wan',
        transferName: tokenName,
        transferToken: fnxTokenAddress,
        transferModalVisible: true,
        transferBalance: this.getPanelData()[1].balance
      });
    }

    if (tokenName === 'FNX(ERC20)') {

    }

    if (tokenName === 'WAN') {
      this.setState({
        chainType: 'wan',
        transferName: tokenName,
        transferToken: '0x0000000000000000000000000000000000000000',
        transferModalVisible: true,
        transferBalance: this.getTableData()[1].balance
      });
    }

    if (tokenName === 'ETH') {

    }

    if (tokenName === 'FPT @Wanchain') {
      this.setState({
        chainType: 'wan',
        transferName: tokenName,
        transferToken: contractInfo.OptionsManagerV2.address,
        transferModalVisible: true,
        transferBalance: this.getTableData()[2].balance
      });
    }

    if (tokenName === 'FPT @Ethereum') {

    }
  }

  render() {
    return (
      <Center>
        <Spin spinning={this.state.loading} size="large">
          <Body>
            {
              this.props.mini
                ? null
                : (<div>
                  <Space2 />
                  <Row style={{ marginLeft: '20px' }}>
                    <Col span={12}>
                      <Box2>
                        <Row>
                          <InALineLeft>
                            <VerticalLine />
                            <SmallTitle>FNX</SmallTitle>
                            <SmallTitle dark>(ERC20)</SmallTitle>
                          </InALineLeft>
                        </Row>
                        <Row>
                          <InALineAround style={{ width: "100%" }}>
                            <div>
                              <MyStatistic style={{ position: "relative", left: "34px" }} coldColor value={this.getPanelData()[0].usd} suffix="$" title={"Value"} />
                            </div>
                            <VLine />
                            <div>
                              <MyStatistic style={{ position: "relative", left: "-38px" }} value={this.getPanelData()[0].balance} title={"Balance"} />
                            </div>
                          </InALineAround>
                        </Row>
                        <Row><HLine /></Row>
                        <Row>
                          <InALineAround style={{ width: "100%" }}>
                            <MyButton><img src={require('../img/buy.png')} style={{ marginRight: "10px" }} />Buy</MyButton>
                            <MyButton><img src={require('../img/sell.png')} style={{ marginRight: "10px" }} />Sell</MyButton>
                            <MyButton><img src={require('../img/transfer.png')} style={{ marginRight: "10px" }} />Transfer</MyButton>
                          </InALineAround>
                        </Row>
                      </Box2>
                    </Col>
                    <Col span={12}>
                      <Box2>
                        <Row>
                          <InALineLeft>
                            <VerticalLine />
                            <SmallTitle>FNX</SmallTitle>
                            <SmallTitle dark>(WRC20)</SmallTitle>
                          </InALineLeft>
                        </Row>
                        <Row>
                          <InALineAround style={{ width: "100%" }}>
                            <div>
                              <MyStatistic style={{ position: "relative", left: "34px" }} coldColor value={this.getPanelData()[1].usd.replace('$', '')} suffix="$" title={"Value"} />
                            </div>
                            <VLine />
                            <div>
                              <MyStatistic style={{ position: "relative", left: "-38px" }} value={this.getPanelData()[1].balance} title={"Balance"} />
                            </div>
                          </InALineAround>
                        </Row>
                        <Row><HLine /></Row>
                        <Row>
                          <InALineAround style={{ width: "100%" }}>
                            <MyButton><img src={require('../img/buy.png')} style={{ marginRight: "10px" }} />Buy</MyButton>
                            <MyButton><img src={require('../img/sell.png')} style={{ marginRight: "10px" }} />Sell</MyButton>
                            <MyButton onClick={() => { this.onTransfer('FNX(WRC20)') }}><img src={require('../img/transfer.png')} style={{ marginRight: "10px" }} />Transfer</MyButton>
                          </InALineAround>
                        </Row>
                      </Box2>
                    </Col>
                  </Row>
                  <Space2 />
                </div>
                )
            }

            <AssetsTable columns={this.column} dataSource={this.getTableData()} />
          </Body>
        </Spin>
        {
          this.state.sellOptionsModalVisible
            ? renderSellOptionsModal(this.state.chainType, this.state.sellOptionsModalVisible, this.state.optionsName,
              this.state.optionsAmount,
              (e) => {
                if (checkNumber(e)) {
                  this.setState({ optionsAmount: e.target.value });
                }
              },
              this.onSellOptionsOk, this.onSellOptionsCancel, this.state.optionsOperateLoading, this.state.optionsBalance, getFee(),
              this.props.selectedAccount.get("isLocked"))
            : null
        }
        {
          this.state.exerciseOptionsModalVisible
            ? renderExerciseModal(this.state.chainType, this.state.exerciseOptionsModalVisible, this.state.optionsName,
              this.state.optionsAmount,
              (e) => {
                if (checkNumber(e)) {
                  this.setState({ optionsAmount: e.target.value });
                }
              },
              this.onExerciseOk, this.onExerciseCancel, this.state.optionsOperateLoading, this.state.optionsBalance, getFee(),
              this.props.selectedAccount.get("isLocked"))
            : null
        }
        {
          this.state.transferModalVisible
            ? renderTransferModal(this.state.chainType, this.state.transferModalVisible, this.state.transferName,
              this.state.transferAmount,
              (e) => {
                if (checkNumber(e)) {
                  this.setState({ transferAmount: e.target.value });
                }
              },
              this.state.transferTo,
              (e) => {
                this.setState({ transferTo: e.target.value });
              },
              this.onTransferOk, this.onTransferCancel, this.state.optionsOperateLoading, this.state.transferBalance,
              this.props.selectedAccount.get("isLocked"))
            : null
        }
      </Center>
    );
  }
}

const AssetsTable = styled(HistoryTable)`
  width: 1400px;
`;



const Space2 = styled(Space)`
  height: 20px;
`;

const Box2 = styled(Box)`
  width:690px;
  height:290px;
  border-radius:4px;
  padding: 20px;
`;

const HLine = styled.div`
  width:648px;
  height:1px;
  background:rgba(255,255,255,1);
  border-bottom:1px solid rgba(255,255,255,1);
  opacity:0.1;
  margin-bottom: 20px;

`;

const VLine = styled.div`
  width:1px;
  height:101px;
  background:rgba(255,255,255,1);
  border-left:1px solid rgba(255,255,255,1);
  opacity:0.1;
  margin-bottom: 25px;
`;

const SmallTitle = styled(BigTitle)`
  font-weight: 400;
  font-size: 18px;
  margin-top: 6px;
  opacity: ${props => props.dark ? '0.5' : '1'};
  margin-left: ${props => props.dark ? '10px' : '0px'};
`;


export default withRouter(connect(state => {
  const selectedAccountID = state.WalletReducer.get('selectedAccountID');
  return {
    selectedAccount: getSelectedAccount(state),
    selectedWallet: getSelectedAccountWallet(state),
    networkId: state.WalletReducer.getIn(['accounts', selectedAccountID, 'networkId']),
    selectedAccountID,
  }
})(Assets));