import { Carousel } from 'antd';
import styles from './assets.css';
import { Body, Center } from '../components';


export default function () {
  return (
    <Center>
      <Body>
        <Carousel><img src={require('./images/banner.png')} /></Carousel>
        <h1>Page assets</h1>
      </Body>
    </Center>
  );
}
