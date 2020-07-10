import { Component } from 'react';
import withRouter from 'umi/withRouter';
import { connect } from 'react-redux';
import { message } from 'antd';
import { Wallet, getSelectedAccount, WalletButton, WalletButtonLong, getSelectedAccountWallet, getTransactionReceipt } from "wan-dex-sdk-wallet";
import { Wallet as EthWallet, WalletButton as EthWalletButton } from 'eth-sdk-wallet';
import "eth-sdk-wallet/index.css";

import "wan-dex-sdk-wallet/index.css";
import style from './style.less';
// import logo from '../img/wandoraLogo.png';
import {networkId, nodeUrl} from '../conf/config.js';
import {getNodeUrl, isSwitchFinish} from '../utils/web3switch.js';
import sleep from 'ko-sleep';


const networkLogo = networkId == 1 ? require('../img/mainnet.svg') : require('../img/testnet.svg');

class Layout extends Component {
  constructor(props) {
    super(props);
  }

  async componentWillMount() {
    while(true) {
      if(isSwitchFinish()) {
        break;
      }
      await sleep(100);
    }

    this.setState({});
  }

  showGameRule = () => {
    window.open("https://github.com/wandevs/wan-game/blob/master/GameRule.md");
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // You can also log the error to an error reporting service
    console.log(error, info);
  }

  render() {
    let nodeUrl = getNodeUrl();
    if (!isSwitchFinish()) {
      return (<div>Loading...</div>);
    }

    return (
      <div>
        <div className={style.header}>
          <Wallet title="Wan Game" nodeUrl={nodeUrl} />
          <EthWallet nodeUrl={"https://ropsten.infura.io/v3/f977681c79004fad87aa00da8f003597"} />
          <img className={style.logo} width="28px" height="28px" src={require('../public/logo.png')} alt="Logo" />
          <div className={style.title}>Finnexus Options</div>
        
          <img style={{ height: "25px", margin: "3px 8px 3px 3px" }} src={networkLogo} />
          <div className={style.gameRule} onClick={this.showGameRule}>Know more</div>
          <WalletButton />
          <EthWalletButton />
        </div>
        {this.props.selectedAccountID === 'EXTENSION' && parseInt(this.props.networkId, 10) !== parseInt(networkId, 10) && (
          <div className="network-warning bg-warning text-white text-center" style={{ padding: 4, backgroundColor: "red", textAlign:"center" }}>
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
