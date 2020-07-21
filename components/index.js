import styled from 'styled-components';
import { Modal } from 'antd';
import {  WalletButton, WalletButtonLong } from "wan-dex-sdk-wallet";
import {  WalletButton as EthWalletButton } from 'eth-sdk-wallet';
import "eth-sdk-wallet/index.css";
import "wan-dex-sdk-wallet/index.css";


export const ConnectWallet = styled.button`
  font-family:HelveticaNeue;
  font-weight:500;
  white-space: nowrap;
  cursor: pointer;
  font-size: 14px;
  color: rgb(255, 255, 255);
  border-width: initial;
  border-style: none;
  border-color: initial;
  border-image: initial;
  outline: none;
  padding: 0px 15px;

  width:161px;
  height:35px;
  background:linear-gradient(90deg,rgba(99,125,255,1) 0%,rgba(99,176,255,1) 100%);
  border-radius:4px;
  margin: 4px;

  &:hover {
    background: linear-gradient(90deg,rgba(99,125,255,1) 0%,rgba(99,176,255,1) 50%);
  }
`;

export const WalletTitle = styled.div`
  font-size: 18px;
  margin: 20px;
`;

export const InALine = styled.div`
  display: flex;
  justify-content: space-around;
`;

export const WalletBt = styled.div`
  border: 1px solid white;
  border-radius: 25px;
  margin: 20px;

  button {
    background: transparent;
    border: none;
    height: 30px;
    width: 180px;
    font-family: Roboto Condensed;
    font-size: 16px;
    :hover {
      background-color: transparent!important;
    }
  }
`;

export const TabButton = styled.div`
  font-family:"HelveticaNeue";
  font-weight:400;
  display: flex;
  justify-content: center;
  text-align: center;
  -webkit-box-align: center;
  align-items: center;
  font-size:16px;
  color: ${props => props.select ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,0.3)'};
  line-height:17px;
  height: 73px;
  padding: 6px 20px 6px 20px;
  background: ${props => props.select ? 'rgb(48, 46, 96)' : 'transparent'};
  border: none;
  margin: -13px 0px;
  :hover {
    background-color: rgb(48, 46, 96);
  }
`;

export const renderSelectWalletModal = (visible, handleCancel) => {
  return (
    <Modal
      title="CONNECT WALLET"
      visible={visible}
      onOk={handleCancel}
      onCancel={handleCancel}
      footer={null}
    >
      <InALine>
        <WalletTitle>Wanchain Wallet:</WalletTitle>
        <WalletBt><WalletButton /></WalletBt>
      </InALine>
      <InALine>
        <WalletTitle>Ethereum Wallet:</WalletTitle>
        <WalletBt><EthWalletButton /></WalletBt>
      </InALine>
    </Modal>
  );
}

export const Center = styled.div`
  text-align: center;
  display: flex;
  justify-content: center;
`;

export const Body = styled.div`
  width: 1440px;
`;

export const Header2 = styled.div`
  height: 52px;
  width: auto;
  /* background: blue; */
  background-color: #1A1C2B;

`;

export const SingleLine = styled.div`
  width:1440px;
  height:1px;
  background:rgba(31,43,82,1);
  border: none;
  border-top: 1px solid rgba(255,255,255,1);
  opacity:0.18;
`;


export const InALineLeft = styled(InALine)`
  justify-content: start;
`;

export const InALineBetween = styled(InALine)`
  justify-content: space-between;
`;

export const TabButtonSub = styled(TabButton)`
  margin: 0px;
  height: 52px;
`;

export const ConnectWalletSub = styled(ConnectWallet)`
  margin: 10px;
`;

export const Space = styled.div`
  height: 60px;
  width: 100%;
`;

export const BuyBlock = styled.div`
  width:360px;
  height:620px;
  background:rgba(31,32,52,1);
  border-radius:6px;
  margin: 0px;
  padding: 20px;
  font-family:HelveticaNeue;
  font-weight:400;
`;