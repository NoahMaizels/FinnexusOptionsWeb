import styled from 'styled-components';
import { Modal, Table, Statistic, Radio, Row, Col, Input } from 'antd';
import { WalletButton, WalletButtonLong } from "wan-dex-sdk-wallet";
import { WalletButton as EthWalletButton } from 'eth-sdk-wallet';
import { beautyNumber } from "../utils/scHelper.js";
import "eth-sdk-wallet/index.css";
import "wan-dex-sdk-wallet/index.css";
import {
  LockOutlined
} from '@ant-design/icons';

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
  text-align: center;
  -webkit-box-align: center;
  align-items: center;
  font-size:16px;
  color: ${props => props.select ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,0.3)'};
  line-height:17px;
  height: 73px;
  padding: 6px 20px 6px 20px;
  background: transparent;
  border: none;
  margin: -13px 0px;
  padding: 30px;
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
  background-color: #1C1A2F;
`;

export const Header2 = styled.div`
  height: 60px;
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

export const InALineAround = styled(InALine)`
  justify-content: space-around;
`;

export const TabButtonSub = styled(TabButton)`
  display: flex;
  justify-content: center;
  margin: 0px;
  height: 52px;
  font-size:18px;
  font-family:HelveticaNeue;
  font-weight: ${props => props.select ? '700' : '400'};
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

export const HistoryTable = styled(Table)`
  margin: 20px;
  width: 100%;
  .ant-table {
    line-height: 50px;
    background: #1A1C2B;
  }
  .ant-table-thead > tr > th {
    font-size:20px;
    font-family:Helvetica Neue;
    font-weight:bold;
    color:rgba(255,255,255,1);
    opacity:0.3;
  }
  .ant-table-tbody {
    background: #1F2034;
    border-radius: 5px;
   
  }
  .ant-table-tbody > tr > td {
    font-size:16px;
    font-family:Helvetica Neue;
    font-weight:400;
    color:rgba(255,255,255,1);
    line-height:46px;
    border-bottom: 10px solid #1A1C2B;
    
  }
`;

export const SubTitle = styled.div`
  font-family: Roboto Condensed;
  font-weight: 700;
  line-height: 15px;
  margin-left: 10px;
  font-size:18px;
`;

export const VerticalLine = styled.div`
  width:2px;
  height:16px;
  background:linear-gradient(90deg,rgba(99,125,255,1) 0%,rgba(99,176,255,1) 100%);
  margin: 13px 10px 13px 0px;
`;

export const BigTitle = styled.div`
  font-size:24px;
  font-family:Helvetica Neue;
  font-weight:bold;
  color:rgba(255,255,255,1);

`;

export const MiddleLine = styled.div`
  width:40px;
  height:2px;
  background:${props => props.visible ? 'linear-gradient(90deg,rgba(99,125,255,1) 0%,rgba(99,176,255,1) 100%);' : 'transparent'};
  border-radius:1px;
  position: relative;
  top: 23px;
`;

export const HeaderLine = styled(MiddleLine)`
  width:51px;
  height:2px;
`;

export const MyStatistic = styled(Statistic)`
  .ant-statistic-title {
    position: relative;
    top: 70px;
    font-size:14px;
    font-family:HelveticaNeue;
    font-weight:400;
    color: ${props => props.coldColor ? '#A8B7FF' : '#C58A70'}
  }

  .ant-statistic-content {
    font-size:36px;
    font-family:HelveticaNeue;
    font-weight:300;
    color:rgba(255,255,255,1);
    line-height:46px;
  }
`;

export const Box = styled.div`
  width:335px;
  height:120px;
  background:rgba(31,32,52,1);
  border-radius:4px;
  text-align:center;
`;

export const ShortLine = styled.div`
  width:16px;
  height:2px;
  background: ${props => props.coldColor ? 'linear-gradient(90deg,rgba(99,125,255,1) 0%,rgba(99,176,255,1) 100%);' : 'linear-gradient(90deg,rgba(255,174,58,1) 1%,rgba(212,161,107,1) 100%);'};
  position: relative;
  top: 36px;
  left: 158px;
`;

export const DarkContainer = styled(Center)`
  background-color: #1A1C2B;
`;


export const RadioButton = styled(Radio.Button)`
  width:160px;
  height:35px;
  background:transparent;
  border-radius:2px;
  margin: 0px;
  font-size:16px;
  font-family:Helvetica Neue;
  font-weight:400;
  color:rgba(255,255,255,1);
  opacity:0.5;
  text-align: center;
  border: none;
  padding: 4px;
`;

export const RadioGroup = styled(Radio.Group)`
  width:320px;
  height:35px;
  background:rgba(26,27,44,1);
  border-radius:2px;
  padding: 0px;
  margin: 12px 0px 12px 0px;
  .ant-radio-button-wrapper-checked:not([class*=' ant-radio-button-wrapper-disabled']).ant-radio-button-wrapper {
    background:linear-gradient(90deg,rgba(99,125,255,1) 0%,rgba(99,176,255,1) 100%);
    border-radius:2px;
    color: white;
    opacity: 1;
  }
`;

export const RadioButtonSmall = styled(RadioButton)`
  width: 106px;
  font-size:14px;
`;

export const CenterAlign = styled.div`
  text-align: left;
  margin: auto;
  padding: 20px;
  h2 {
    text-align: center;
    width: 100%;
    margin: 10px 0px 20px 0px;
  }

  p {
    text-align: left;
    margin: 0px;
    font-size:14px;
    font-family:Helvetica Neue;
    font-weight:400;
    color:rgba(172,181,227,1);
    width: 100%;
  }
`;

export const AdjustInput = styled(Input)`
  margin: 12px 0px 12px 0px;
  width:230px;
  height:40px;
  background:rgba(48,49,71,1);
  border-radius:2px;
  font-size:14px;
  text-align: center;
  input.ant-input {
    text-align: center;
    font-size:14px;
    font-family:HelveticaNeue;
    font-weight:400;
    color:rgba(255,255,255,1);
    padding: 5px;
  }
`;

export const YellowText = styled.div`
  font-size:14px;
  font-family:HelveticaNeue;
  font-weight:400;
  color:rgba(255,186,0,1);
`;

export const DarkText = styled.div`
  font-size:12px;
  font-family:RobotoCondensed;
  font-weight:400;
  color:rgba(255,255,255,1);
  opacity:0.6;
`;

export const SmallSpace = styled.div`
  width: 100%;
  height: 5px;
`;

const MyModal = styled(Modal)`
  .ant-modal-content {
    border-radius: 15px;
    width: 406px;
  }

  .ant-modal-header {
    border-radius: 15px 15px 0 0;
  }
`;

const AmountInput = styled(AdjustInput)`
  width: 320px;
`;

export const checkNumber = e => {
  const { value } = e.target;
  const reg = /^[+]?\d*(\.\d*)?$/;
  if ((!isNaN(value) && reg.test(value) && Number(value) >= 0) || value === '') {
    return true;
  }

  return false;
}

const WalletDiv = styled.div`
  margin: 12px 0px 12px 0px;
  button {
    width: 320px!important;
    font-size: 13px!important;
    height: 40px!important;
  }
`;

const Locked = styled(LockOutlined)`
  position: relative;
  top: -30px;
  left: 10px;
`;

export const renderDepositModal = (chainType, visible, handleCancel, handleOk, 
  amountToDeposit, amountChange, currencyToPay, currencyChange, balance, loading, fee, locked) => {
  // console.log('fee:', fee);
  let payToken = currencyToPay === "0" ? "WAN" : "FNX";
  return (
    <MyModal
      title="Deposit"
      visible={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={loading}
    >
      <CenterAlign>
        <Row>
          <p>From address</p>
          <WalletDiv>
            {
              chainType === 'wan'
              ? <WalletButtonLong />
              : <EthWalletButton />
            }
            {
              locked
              ? <Locked />
              : null
            }
          </WalletDiv>
        </Row>
        <Row>
          <p>Currency to pay</p>
          <RadioGroup 
          value={currencyToPay} 
          onChange={currencyChange} buttonStyle="solid">
            <RadioButton value="0">WAN</RadioButton>
            {
              chainType === 'wan'
                ? <RadioButton value="1"><InALine>FNX<DarkText>(WRC20)</DarkText></InALine></RadioButton>
                : <RadioButton value="2"><InALine>FNX<DarkText>(ERC20)</DarkText></InALine></RadioButton>
            }
          </RadioGroup>
        </Row>
        <Row>
          <SmallSpace />
          <p>Amount to deposit</p>
          <AmountInput suffix={
            <YellowText>{payToken}</YellowText>
          } placeholder={"Enter " + payToken + " amount"}
            value={amountToDeposit}
            onChange={amountChange}
          />
          <p style={{opacity: "0.6"}}>* Your balance is: {balance + " " + payToken} </p>
          <p style={{opacity: "0.6"}}>* Contains {fee.addColFee*100 + "%"} fee. </p>
        </Row>
      </CenterAlign>
    </MyModal>
  );
}

export const renderWithdrawModal = (chainType, visible, handleCancel, handleOk, 
  amountToDeposit, amountChange, currencyToPay, currencyChange, balance, loading, fee, locked) => {
  let payToken = "Shares token";
  return (
    <MyModal
      title="Withdraw"
      visible={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={loading}
    >
      <CenterAlign>
        <Row>
          <p>To address</p>
          <WalletDiv>
            {
              chainType === 'wan'
              ? <WalletButtonLong />
              : <EthWalletButton />
            }
            {
              locked
              ? <Locked />
              : null
            }
          </WalletDiv>
        </Row>
        <Row>
          <p>Preference of currency</p>
          <RadioGroup 
          value={currencyToPay} 
          onChange={currencyChange} buttonStyle="solid">
            <RadioButton value="0">WAN</RadioButton>
            {
              chainType === 'wan'
                ? <RadioButton value="1"><InALine>FNX<DarkText>(WRC20)</DarkText></InALine></RadioButton>
                : <RadioButton value="2"><InALine>FNX<DarkText>(ERC20)</DarkText></InALine></RadioButton>
            }
          </RadioGroup>
        </Row>
        <Row>
          <SmallSpace />
          <p>Amount to withdraw</p>
          <AmountInput suffix={
             <YellowText>{payToken}</YellowText>
            } 
            placeholder={"Enter " + payToken + " amount"}
            value={amountToDeposit}
            onChange={amountChange}
          />
          <p style={{opacity: "0.6"}}>* Your shares token balance is: {beautyNumber(balance, 8) + " "} </p>
          <p style={{opacity: "0.6"}}>* Contains {fee.redeemColFee*100 + "%"} fee.</p>
        </Row>
      </CenterAlign>
    </MyModal>
  );
}

export const renderBuyOptionsModal = (visible, handleCancel, handleOk, 
  amountToPay, currencyToPay, balance, loading, fee, locked) => {
  let payToken = "WAN";
  let payAmount = amountToPay.split('/ ')[1];
  switch (currencyToPay) {
    case "0": payToken = "FNX (WRC20)"; break;
    case "1": payToken = "FNX (ERC20)"; break;
    case "2": payToken = "WAN"; break;
    default: payToken = "WAN"; break;
  }

  return (
    <MyModal
      title="Buy Now"
      visible={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={loading}
    >
      <CenterAlign>
        <Row>
          <p>From address</p>
          <WalletDiv>
            {
              currencyToPay !== '1'
              ? <WalletButtonLong />
              : <EthWalletButton />
            }
            {
              locked
              ? <Locked />
              : null
            }
          </WalletDiv>
        </Row>
        <Row>
          <SmallSpace />
          <p>Amount to pay</p>
          <AmountInput suffix={
            <YellowText>{payToken}</YellowText>
          }
            value={payAmount}
            readOnly
          />
          <p style={{opacity: "0.6"}}>* Your balance is: {beautyNumber(balance,8) + " " + payToken} </p>
          <p style={{opacity: "0.6"}}>* Contains {fee.buyFee*100 + "%"} fee.</p>
        </Row>
      </CenterAlign>
    </MyModal>
  );
}

