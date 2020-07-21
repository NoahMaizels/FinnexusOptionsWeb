import { LineChart, Line, Point } from 'bizcharts';
import { Component } from 'react';


class MyChart extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  data = [
    {
      price: "0",
      profit: "-50",
    },
    {
      price: "8000",
      profit: "-50",
    },
    {
      price: "9000",
      profit: "100",
    },
  ];

  render() {
    return (
      <LineChart
        padding={[30, 20, 50, 40]}
        autoFit
        height={500}
        data={this.data}
        xField='price'
        yField='profit'
      >
        {/* <Line position="price*profit" />
        <Point position="8000*-30" /> */}
      </LineChart>
    );
  }
}

export default MyChart;