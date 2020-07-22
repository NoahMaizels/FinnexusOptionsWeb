import { Component } from 'react';
import withRouter from 'umi/withRouter';
import { Link } from 'umi';
import { connect } from 'react-redux';
import { message, Modal, Button } from 'antd';
import { Wallet, getSelectedAccount, WalletButton, WalletButtonLong, getSelectedAccountWallet, getTransactionReceipt } from "wan-dex-sdk-wallet";
import { Wallet as EthWallet, WalletButton as EthWalletButton } from 'eth-sdk-wallet';
import "eth-sdk-wallet/index.css";

import "wan-dex-sdk-wallet/index.css";
import style from './style.less';
// import logo from '../img/wandoraLogo.png';
import { networkId, nodeUrl } from '../conf/config.js';
import { getNodeUrl, isSwitchFinish } from '../utils/web3switch.js';
import sleep from 'ko-sleep';
import { TabButton, WalletBt, InALine, WalletTitle, ConnectWallet, renderSelectWalletModal, InALineLeft, InALineBetween, HeaderLine } from '../components';
import { updateCoinPrices, updateCollateralInfo} from '../utils/scHelper.js';

const networkLogo = networkId == 1 ? require('../img/mainnet.svg') : require('../img/testnet.svg');

class Layout extends Component {
  constructor(props) {
    super(props);
    this.state = {
      tabSelect1: true,
      tabSelect2: false,
      tabSelect3: false,
    };
  }

  async componentWillMount() {
    while (true) {
      if (isSwitchFinish()) {
        break;
      }
      await sleep(100);
    }

    
    updateCoinPrices();
    this.priceTimer = setInterval(updateCoinPrices, 10000);

    this.updateInfo();

    this.setState({});
  }

  updateInfo = async () => {
    let timer = 0;
    while (this.props.selectedAccount === null) {
      if (timer > 10) {
        message.info('account not found');
        break;
      }
      await sleep(500);
      timer++;
    }
    
    let wanAddress;
    if (this.props.selectedAccount) {
      wanAddress = this.props.selectedAccount.get('address');
    }

    updateCollateralInfo(wanAddress);
    this.collateralTimer = setInterval(this.updateInfo, 30000);
  }

  componentWillUnmount() {
    if (this.priceTimer) {
      clearInterval(this.priceTimer);
      this.priceTimer = undefined;
    }

    if (this.collateralTimer) {
      clearInterval(this.collateralTimer);
      this.collateralTimer = undefined;
    }
  }

  showGameRule = () => {
    window.open("https://finnexus.io");
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // You can also log the error to an error reporting service
    console.log(error, info);
  }

  onTabSelect = (id) => {
    switch (id) {
      case 1:
        this.setState({ tabSelect1: true, tabSelect2: false, tabSelect3: false });
        break;
      case 2:
        this.setState({ tabSelect1: false, tabSelect2: true, tabSelect3: false });
        break;
      case 3:
        this.setState({ tabSelect1: false, tabSelect2: false, tabSelect3: true });
        break;
      default:
        this.setState({ tabSelect1: true, tabSelect2: false, tabSelect3: false });
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
    let nodeUrl = getNodeUrl();
    if (!isSwitchFinish()) {
      return (<div>Loading...</div>);
    }

    return (
      <div className={style.app}>
        <InALine>
          <div className={style.header}>
            <Wallet title="Wan Game" nodeUrl={nodeUrl} />
            <EthWallet nodeUrl={"https://ropsten.infura.io/v3/f977681c79004fad87aa00da8f003597"} />
            <InALineBetween style={{width:"1440px"}}>
              <InALineLeft>
                <img className={style.logo} width="139px" height="40px" src={require('../img/FNXlogo@2x.png')} alt="Logo" />
                <Link to="/" ><TabButton select={this.state.tabSelect1} onClick={() => { this.onTabSelect(1) }}>Options Exchange<HeaderLine visible={this.state.tabSelect1} style={{top: "24px", left: "34px"}}/></TabButton></Link>
                <Link to="/collateral" ><TabButton select={this.state.tabSelect2} onClick={() => { this.onTabSelect(2) }}>Collateral<HeaderLine visible={this.state.tabSelect2} style={{top: "24px", left: "8px"}}/></TabButton></Link>
                <Link to="/assets" ><TabButton select={this.state.tabSelect3} onClick={() => { this.onTabSelect(3) }}>Assets<HeaderLine visible={this.state.tabSelect3} style={{top: "24px", left: "8px"}}/></TabButton></Link>
              </InALineLeft>

              <InALine>
                <div className={style.gameRule} onClick={this.showGameRule}><img height="25px" src={require('../img/help.png')}/></div>
                <ConnectWallet onClick={() => { this.setState({ visible: true }) }}>Connect Wallet</ConnectWallet>
                {
                  renderSelectWalletModal(this.state.visible, this.handleCancel)
                }
              </InALine>
            </InALineBetween>
          </div>
        </InALine>
        {this.props.selectedAccountID === 'EXTENSION' && parseInt(this.props.networkId, 10) !== parseInt(networkId, 10) && (
          <div className="network-warning bg-warning text-white text-center" style={{ padding: 4, backgroundColor: "red", textAlign: "center" }}>
            Please be noted that you are currently choosing the Testnet for WanMask and shall switch to Mainnet for playing Wandora.
          </div>
        )}
        {this.props.children}
      </div>
    );
  }
}





export default withRouter(connect(state => {
  const selectedAccountID = state.WalletReducer.get('selectedAccountID');
  return {
    selectedAccount: getSelectedAccount(state),
    selectedWallet: getSelectedAccountWallet(state),
    networkId: state.WalletReducer.getIn(['accounts', selectedAccountID, 'networkId']),
    selectedAccountID,
  }
})(Layout));
