import { connect } from "react-redux";
import { Component } from "react";
import { Row, Col, Input, Slider, Radio, Table, Button, Divider, Spin, Modal, message } from "antd";
import BigNumber from 'bignumber.js';
import { Wallet, getSelectedAccount, WalletButton, WalletButtonLong, getSelectedAccountWallet } from "wan-dex-sdk-wallet";
import "wan-dex-sdk-wallet/index.css";
import styles from './style.less';
import { getOptionsInfo, getBalance, generateBuyOptionsTokenData, generateTx, watchTransactionStatus, sendTransaction, approve, getWeb3 } from '../utils/scHelper';
const { confirm } = Modal;

let web3 = getWeb3();

class IndexPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      optionsInfo: {},
      optionTokenInfo: [],
      pageLoading: true,

      hedgeInfo: {
        amount: 0,
        expiration: [],
        expirationSelect: 0,
        currency: [],
        currencySelect: 0,
        price: 0,
        choseCurrency: 0,
        return: 0,
      },

      leverageInfo: {
        amount: 0,
        expiration: [],
        expirationSelect: 0,
        currency: [],
        currencySelect: 0,
        price: 0,
        choseCurrency: 0,
        return: 0,
      },

      myAssets: [],
    };

  }

  async componentDidMount() {
    await this.updatePage();
  }

  updatePage = async () => {
    this.setState({pageLoading: true});
    let address = null;
    if (this.props.selectedAccount) {
      address = this.props.selectedAccount.get('address');
    }
    console.log('address:', address);
    let info = await getOptionsInfo(address);
    console.log(info);
    let optionTokenInfo = info.optionTokenInfo;
    let hedgeInfo = Object.assign({}, this.state.hedgeInfo);
    hedgeInfo.expiration = this.getExpiration(optionTokenInfo).put;
    hedgeInfo.currency = this.getCollateralTokenType(optionTokenInfo);

    let leverageInfo = Object.assign({}, this.state.leverageInfo);
    leverageInfo.expiration = this.getExpiration(optionTokenInfo).call;
    leverageInfo.currency = this.getCollateralTokenType(optionTokenInfo);

    console.log('leverageInfo', leverageInfo);

    this.setState({
      optionsInfo: info,
      optionTokenInfo,
      pageLoading: false,
      hedgeInfo,
      leverageInfo,
      hedgeNowLoading: false,
      leverageNowLoading: false,
    });
  }

  getExpiration = (info) => {
    let put = [];
    let call = [];
    for (let i = 0; i < info.length; i++) {
      if (info[i].type === 'put') {
        if (!put.includes(info[i].expiration)) {
          put.push(info[i].expiration);
        }
      } else {
        if (!call.includes(info[i].expiration)) {
          call.push(info[i].expiration);
        }
      }
    }

    return { put, call };
  }

  getCollateralTokenType = (info) => {
    let collateralTokens = [];
    for (let i = 0; i < info.length; i++) {
      if (!collateralTokens.includes(info[i].collateralTokenType)) {
        collateralTokens.push(info[i].collateralTokenType);
      }
    }
    return collateralTokens;
  }

  hedgeColumn = [
    {
      title: 'Token name',
      dataIndex: "tokenName",
      key: 'tokenName',
    },
    {
      title: 'Underlying assets price',
      dataIndex: 'underlyingAssetsPrice',
      key: 'underlyingAssetsPrice',
    },
    {
      title: 'Expiration',
      dataIndex: 'expiration',
      key: 'expiration',
    },
    {
      title: 'Strike price',
      dataIndex: 'strikePrice',
      key: 'strikePrice',
    },
    {
      title: 'Liquidity',
      dataIndex: 'liquidity',
      key: 'liquidity',
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
    },
    {
      title: 'Percentage of collateral',
      dataIndex: 'percentageOfCollateral',
      key: 'percentageOfCollateral',
    },
  ]

  myAssetsColumn = [
    {
      title: 'Token name',
      dataIndex: "tokenName",
      key: 'tokenName',
    },
    {
      title: 'Underlying assets price',
      dataIndex: 'underlyingAssetsPrice',
      key: 'underlyingAssetsPrice',
    },
    {
      title: 'Strike price',
      dataIndex: 'strikePrice',
      key: 'strikePrice',
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
    },
    {
      title: 'Price paid',
      dataIndex: 'pricePaid',
      key: 'pricePaid',
    },
    {
      title: 'Price now',
      dataIndex: 'price',
      key: 'price',
    },
    {
      title: 'Percentage of collateral',
      dataIndex: 'percentageOfCollateral',
      key: 'percentageOfCollateral',
    },
    {
      title: 'Expected Return',
      dataIndex: 'expectedReturn',
      key: 'expectedReturn',
    },
    {
      title: '',
      dataIndex: '',
      key: 'action',
      render: () => {
        return (<Button type="primary">Sell now</Button>)
      }
    },
  ]


  updateHedgeInput = (value) => {
    const { hedgeData, leverageData } = this.getTableData();

    let hedgeInfo = Object.assign({}, this.state.hedgeInfo);
    hedgeInfo.amount = value;
    hedgeInfo.price = hedgeInfo.amount * Number(hedgeData[0].price.replace('$', ''))
    hedgeInfo.price = Number(hedgeInfo.price.toFixed(8));
    hedgeInfo.choseCurrency = hedgeInfo.price / hedgeData[0].collateralTokenPrice;
    hedgeInfo.choseCurrency = Number(hedgeInfo.choseCurrency.toFixed(8));
    this.setState({ hedgeInfo });
  }

  updateLeverageInput = (value) => {
    const { hedgeData, leverageData } = this.getTableData();

    let leverageInfo = Object.assign({}, this.state.leverageInfo);
    leverageInfo.amount = value;
    leverageInfo.price = leverageInfo.amount * Number(leverageData[0].price.replace('$', ''))
    leverageInfo.price = Number(leverageInfo.price.toFixed(8));
    leverageInfo.choseCurrency = leverageInfo.price / leverageData[0].collateralTokenPrice;
    leverageInfo.choseCurrency = Number(leverageInfo.choseCurrency.toFixed(8));
    this.setState({ leverageInfo });
  }

  getTableData = () => {
    const hedgeData = this.state.optionTokenInfo.filter((v) => {
      return v.type === 'put'
        && v.expiration === this.state.hedgeInfo.expiration[this.state.hedgeInfo.expirationSelect]
        && v.collateralTokenType === this.state.hedgeInfo.currency[this.state.hedgeInfo.currencySelect];
    });
    const leverageData = this.state.optionTokenInfo.filter((v) => {
      return v.type === 'call'
        && v.expiration === this.state.leverageInfo.expiration[this.state.leverageInfo.expirationSelect]
        && v.collateralTokenType === this.state.leverageInfo.currency[this.state.leverageInfo.currencySelect];
    });
    return { hedgeData, leverageData };
  }

  getBuyInfo = (info) => {
    

    return (<div style={{marginTop:'40px'}}>
      <Row gutter={[16, 8]}>
        <Col span={8}><h4>Token Name:</h4></Col>
        <Col span={16}><h4>{info.tokenName}</h4></Col>
      </Row>
      <Row gutter={[16, 8]}>
        <Col span={8}><h4>Token Price:</h4></Col>
        <Col span={16}><h4>{info.price}</h4></Col>
      </Row>
      <Row gutter={[16, 8]}>
        <Col span={8}><h4>Trade Fee:</h4></Col>
        <Col span={16}><h4>{info.tradeFee*100 + '%'}</h4></Col>
      </Row>
      <Row gutter={[16, 8]}>
        <Col span={8}><h4>Buy Amount:</h4></Col>
        <Col span={16}><h4>{info.buyAmount}</h4></Col>
      </Row>
      <Row gutter={[16, 8]}>
        <Col span={8}><h4>Pay Token:</h4></Col>
        <Col span={16}><h4>{info.payAmount + ' ' + info.collateralTokenType}</h4></Col>
      </Row>
      <Row gutter={[16, 8]}>
        <Col span={8}><h4>My Balance:</h4></Col>
        <Col span={16}><h4>{info.balance}</h4></Col>
      </Row>
    </div>)
  }

  hedgeNow = async () => {
    const {hedgeData, leverageData} = this.getTableData();
    let info = Object.assign({}, hedgeData[0]);
    info.tradeFee = this.state.optionsInfo.transactionFee;
    info.buyAmount = this.state.hedgeInfo.amount;
    if (!this.props.selectedAccount) {
      message.warn("Please connect wallet");
      return;
    }

    if (info.buyAmount === 0) {
      message.warn("Please input buy amount");
      return;
    }


    let address = this.props.selectedAccount.get('address');
    console.log('address', address);
    this.setState({hedgeNowLoading: true});
    info.balance = await getBalance(info.collateralToken, address);
    this.setState({hedgeNowLoading: false});
    info.payAmount = Number((info.buyAmount * Number(info.price.replace('$', '')) / info.collateralTokenPrice + 0.1).toFixed(8));
    console.log('dlg info:', info);
    confirm({
      title: 'Buy Options Token',
      content: this.getBuyInfo(info),
      onOk: () => {
        console.log('OK');
        this.buyOptionToken(
          address, 
          info.balance, 
          info.payAmount, 
          info.buyAmount, 
          info.collateralToken, 
          info.optionsToken,
          "hedge").then((value) => {
            console.log(value);
          }).catch(console.log);
      },
      onCancel() {
        console.log('Cancel');
      },
    });
  }

  leverageNow = async () => {
    const {hedgeData, leverageData} = this.getTableData();
    let info = Object.assign({}, leverageData[0]);
    info.tradeFee = this.state.optionsInfo.transactionFee;
    info.buyAmount = this.state.leverageInfo.amount;
    if (!this.props.selectedAccount) {
      message.warn("Please connect wallet");
      return;
    }

    if (info.buyAmount === 0) {
      message.warn("Please input buy amount");
      return;
    }


    let address = this.props.selectedAccount.get('address');
    console.log('address', address);
    this.setState({leverageNowLoading: true});
    info.balance = await getBalance(info.collateralToken, address);
    this.setState({leverageNowLoading: true});
    info.payAmount = Number((info.buyAmount * Number(info.price.replace('$', '')) / info.collateralTokenPrice + 0.1).toFixed(8));

    console.log('dlg info:', info);
    confirm({
      title: 'Buy Options Token',
      content: this.getBuyInfo(info),
      onOk: () => {
        console.log('OK');
        this.buyOptionToken(
          address, 
          info.balance, 
          info.payAmount, 
          info.buyAmount, 
          info.collateralToken, 
          info.optionsToken, 
          "leverage").then((value) => {
            console.log(value);
          }).catch(console.log);
      },
      onCancel() {
        console.log('Cancel');
      },
    });
  }


  buyOptionToken = async (walletAddress, balance, payAmount, buyAmount, collateralToken, optionsToken, type) => {
    if (balance < payAmount) {
      message.error("Balance not enough");
      return false;
    }
    let info = {
      optionsToken,
      amount: buyAmount,
      collateralToken,
      currencyAmount: payAmount,
    };

    let data = await generateBuyOptionsTokenData(info);

    console.log('data:', data);

    if (collateralToken === '0x0000000000000000000000000000000000000000') {
    } else {
      await approve(collateralToken, walletAddress, payAmount, this.props.selectedWallet);
      payAmount = 0;
    }

    let currencyAmount = web3.utils.toHex(web3.utils.toWei(payAmount.toString())).toString();
    console.log('currencyAmount', currencyAmount);

    let txParam = await generateTx(data, currencyAmount, walletAddress, this.props.selectedWallet, info);
    console.log('txParam:', txParam);
    if (!txParam) {
      message.error("Estimate Gas Failed");
      return;
    }

    let txID = await sendTransaction(this.props.selectedWallet, txParam);
    if (!txID) {
      return;
    }

    if (type==='hedge') {
      this.setState({hedgeNowLoading: true});
    } else {
      this.setState({leverageNowLoading: true});
    }

    message.info("Transaction sent, txHash:" + txID);
    watchTransactionStatus(txID, (status) => {
      if(status) {
        message.info("Buy Options Success");
      } else {
        message.error("Buy Options Failed");
      }
      if (type==='hedge') {
        this.setState({hedgeNowLoading: false});
      } else {
        this.setState({leverageNowLoading: false});
      }
    })
  }


  render() {
    const { hedgeData, leverageData } = this.getTableData();

    let hedgeLiquidity = 0;
    for (let i = 0; i < hedgeData.length; i++) {
      hedgeLiquidity += Number(hedgeData[i].liquidity);
    }

    let leverageLiquidity = 0;
    for (let i = 0; i < leverageData.length; i++) {
      leverageLiquidity += Number(leverageData[i].liquidity);
    }

    return (
      <div>
        <Spin spinning={this.state.pageLoading} size="large">
          <div className={styles.box}>
            <h1>Hedge risk of your BTC value down</h1>
            <Row gutter={[16, 16]} className={styles.center}>
              <Col span={6}>How many BTC are you holding</Col>
              <Col span={4}>Expiration</Col>
              <Col span={3}>Currency to pay</Col>
              <Col span={6}>Hedge Price in $ / chose currency</Col>
              <Col span={4}>Return due to the price go down in percentage</Col>
            </Row>
            <Row gutter={[16, 16]} className={styles.center}>
              <Col span={6}>
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Input suffix={"BTC"} value={this.state.hedgeInfo.amount}
                      onChange={e => this.updateHedgeInput(e.target.value)} />
                  </Col>
                  <Col span={12}>
                    <Slider tipFormatter={value => `${value} BTC`}
                      min={0} max={hedgeLiquidity}
                      step={0.0001}
                      onChange={this.updateHedgeInput} />
                  </Col>
                </Row>
              </Col>
              <Col span={4}>
                <Radio.Group defaultValue={0} buttonStyle="solid" onChange={(e) => {
                  let hedgeInfo = Object.assign({}, this.state.hedgeInfo);
                  hedgeInfo.expirationSelect = e.target.value;
                  this.setState({ hedgeInfo });
                }}>
                  {
                    this.state.hedgeInfo.expiration.map((v, i) => {
                      return (<Radio.Button value={i} key={i}>{v}</Radio.Button>);
                    })
                  }
                </Radio.Group>
              </Col>
              <Col span={3}>
                <Radio.Group defaultValue={0} buttonStyle="solid" onChange={(e) => {
                  let hedgeInfo = Object.assign({}, this.state.hedgeInfo);
                  hedgeInfo.currencySelect = e.target.value;
                  this.setState({ hedgeInfo });
                }}>
                  {
                    this.state.hedgeInfo.currency.map((v, i) => {
                      return (<Radio.Button value={i} key={i}>{v}</Radio.Button>);
                    })
                  }
                </Radio.Group>
              </Col>
              <Col span={6}>${this.state.hedgeInfo.price} / {this.state.hedgeInfo.currency[this.state.hedgeInfo.currencySelect]} {this.state.hedgeInfo.choseCurrency}</Col>
              <Col span={4}>
                <Row gutter={[16, 16]}>
                  <Col span={8}>${this.state.hedgeInfo.return}</Col>
                  <Col span={16}>
                    <Slider tipFormatter={value => `-${value}%`} onChange={(value) => {
                      let hedgeInfo = Object.assign({}, this.state.hedgeInfo);
                      let underlyingAssetsPrice = Number(hedgeData[0].underlyingAssetsPrice.replace('$', ''));
                      let strikePrice = Number(hedgeData[0].strikePrice.replace('$', ''));
                      let liq = hedgeInfo.amount;
                      hedgeInfo.return = (strikePrice - underlyingAssetsPrice * (100 - value) / 100) * liq;
                      hedgeInfo.return = Number(hedgeInfo.return.toFixed(8));
                      this.setState({ hedgeInfo });
                    }} />
                  </Col>
                </Row>
              </Col>
            </Row>
            <Table dataSource={hedgeData} columns={this.hedgeColumn} />
            <div className={styles.center}>
              <Button loading={this.state.hedgeNowLoading} type="primary" style={{ margin: "20px" }} onClick={this.hedgeNow}>Hedge Now</Button>
            </div>
          </div>
          <Divider />
          <div className={styles.box}>
            <h1>Leverage your BTC</h1>
            <Row gutter={[16, 16]} className={styles.center}>
              <Col span={6}>How many BTC are you plan to leverage</Col>
              <Col span={4}>Expiration</Col>
              <Col span={3}>Currency to pay</Col>
              <Col span={6}>Leverage Price in $ / chose currency</Col>
              <Col span={4}>Return due to the price go up in percentage</Col>
            </Row>
            <Row gutter={[16, 16]} className={styles.center}>
              <Col span={6}>
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Input suffix={"BTC"} value={this.state.leverageInfo.amount}
                      onChange={e => this.updateLeverageInput(e.target.value)} />
                  </Col>
                  <Col span={12}>
                    <Slider tipFormatter={value => `${value} BTC`}
                      min={0} max={leverageLiquidity}
                      step={0.0001}
                      onChange={this.updateLeverageInput} /></Col>
                </Row>
              </Col>
              <Col span={4}>
                <Radio.Group defaultValue={0} buttonStyle="solid" onChange={(e) => {
                  let leverageInfo = Object.assign({}, this.state.leverageInfo);
                  leverageInfo.expirationSelect = e.target.value;
                  this.setState({ leverageInfo });
                }}>
                  {
                    this.state.leverageInfo.expiration.map((v, i) => {
                      return (<Radio.Button value={i} key={i}>{v}</Radio.Button>);
                    })
                  }
                </Radio.Group>
              </Col>
              <Col span={3}>
                <Radio.Group defaultValue={0} buttonStyle="solid" onChange={(e) => {
                  let leverageInfo = Object.assign({}, this.state.leverageInfo);
                  leverageInfo.currencySelect = e.target.value;
                  this.setState({ leverageInfo });
                }}>
                  {
                    this.state.leverageInfo.currency.map((v, i) => {
                      return (<Radio.Button value={i} key={i}>{v}</Radio.Button>);
                    })
                  }
                </Radio.Group>
              </Col>
              <Col span={6}>${this.state.leverageInfo.price} / {this.state.leverageInfo.currency[this.state.leverageInfo.currencySelect]} {this.state.leverageInfo.choseCurrency}</Col>
              <Col span={4}>
                <Row gutter={[16, 16]}>
                  <Col span={8}>${this.state.leverageInfo.return}</Col>
                  <Col span={16}>
                    <Slider tipFormatter={value => `+${value}%`} onChange={(value) => {
                      let leverageInfo = Object.assign({}, this.state.leverageInfo);
                      let underlyingAssetsPrice = Number(leverageData[0].underlyingAssetsPrice.replace('$', ''));
                      let strikePrice = Number(leverageData[0].strikePrice.replace('$', ''));
                      let liq = leverageInfo.amount;
                      leverageInfo.return = (underlyingAssetsPrice * (100 + value) / 100 - strikePrice) * liq;
                      leverageInfo.return = Number(leverageInfo.return.toFixed(8));
                      this.setState({ leverageInfo });
                    }} />
                  </Col>
                </Row>
              </Col>
            </Row>
            <Table dataSource={leverageData} columns={this.hedgeColumn} />
            <div className={styles.center}>
              <Button loading={this.state.leverageNowLoading} type="primary" style={{ margin: "20px" }} onClick={this.leverageNow}>Leverage Now</Button>
            </div>
          </div>
          <Divider />
          <div className={styles.box}>
            <h1>My assets</h1>
            <Table dataSource={this.state.optionsInfo.assets} columns={this.myAssetsColumn} />
          </div>
          <Divider />
          <div className={styles.box}>
            <h1>History</h1>
            <Table dataSource={this.myAssetDemo} columns={this.myAssetsColumn} />
          </div>
          <div></div>
        </Spin>
      </div>
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





