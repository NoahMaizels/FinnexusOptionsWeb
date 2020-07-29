import { LineChart, Line, Point, Chart, Axis, AreaChart, Guide } from 'bizcharts';
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
      <AreaChart
        padding={[30, 80, 50, 80]}
        autoFit
        height={500}
        data={this.props.lineData}
        xField='price'
        yField='profit'
        // sales={{'profit':{range:[-1, 2]}}}
        yAxis={
          {
            visible: true,
            min: this.props.minValue,
          }
        }
        title={{
          visible: true,
          alignTo: 'left',
          text: 'Profit or Loss',
          style: {
            fontSize: 18,
            fill: 'white',
          }
        }}
      >
        {
          this.props.lineData
          ? (<Guide>
            <Guide.Line
              top={true} 
              start={['start', Number(this.props.optType) === 0 ? this.props.lineData[50 + this.props.slider].profit: this.props.lineData[50 - this.props.slider].profit]} 
              end={['end', Number(this.props.optType) === 0 ? this.props.lineData[50 + this.props.slider].profit: this.props.lineData[50 - this.props.slider].profit]} 
              lineStyle={{
                stroke: '#FFFFFF', 
                lineDash: [0, 2, 2], 
                lineWidth: 3 
              }} 

              text={{
                position: 'start', 
                content: 'Profit or loss: ' + (Number(this.props.optType) === 0 ? this.props.lineData[50 + this.props.slider].profit: this.props.lineData[50 - this.props.slider].profit) + '$', 
                style: {
                  fill: 'white'
                },
              }}
            />
          </Guide>)
          : null
        }
        
        {/* <Axis name="profit" title={"Profit or Loss"} visible={true} grid={true} position={"left"} /> */}
        {/* <Line position="price*profit" /> */}
        {/* <Point position="8000*-30" /> */}
      </AreaChart>
    );
  }
}

export default MyChart;