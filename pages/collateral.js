import { Carousel } from 'antd';
import { Component } from 'react';
import { SingleLine, Center, Body, Header2, Space, MiddleLine, TabButtonSub, InALineBetween, InALineLeft, SubTitle } from '../components';
import CollateralInfo from '../components/collateral.js';


import styles from './collateral.css';

class Collateral extends Component {
  constructor(props) {
    super(props);
    this.state = {
      tabSelect1: true,
      tabSelect2: false
    };
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
              ? <CollateralInfo chain='wan' />
              : null
          }
          {
            this.state.tabSelect2
              ? <CollateralInfo chain='eth' />
              : null
          }

        </Body>
      </Center>
    );
  }
}

export default Collateral;

