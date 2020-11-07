import React, { useEffect, Component } from "react"
import { connect } from "react-redux"
import { getHomeList } from "./store/actions"
import Style from './style.css'
import withStyle from "../../withStyle"

class Home extends Component {
  constructor (props) {
    super(props)
    this.state = {
      count: 0
    }
  }
  componentDidMount () {
    this.setState({count: this.state.count + 1})
    console.log(this.state.count)
    this.setState({count: this.state.count + 1})
    console.log(this.state.count)
    setTimeout(() => {
      this.setState({count: this.state.count + 1})
      console.log(this.state.count)
    })
    setTimeout(() => {
      this.setState({count: this.state.count + 1})
      console.log(this.state.count)
    })
    if (!this.props.list.length) {
      this.props.getHomeList()
    }
  }
  handleClick (event) {
    console.log(event)
    console.log(event.nativeEvent)
  }
  render() {
    const rawHTML = "<span>123</span>"
    const rawHTMLDATA = {
      __html: rawHTML
    }
   
    return (
      <div className={Style.test} onClick={this.handleClick}>
        <p dangerouslySetInnerHTML={rawHTMLDATA}></p>
        <p>{rawHTML}</p>
        <div>服务端渲染:{this.props.name}</div>
        {
         this. props.list.map(item => {
          return <div key={item.id}>{item.title}</div>
          })
        }
        <div><button onClick={() => {alert(1)}}>click me</button></div>
      </div>
    )
  }
}

// const Home = (props) => {
//   withStyle(props,Style)
//   useEffect(() => {
//     if (!props.list.length) {
//       props.getHomeList()
//     }
//   },[])
//   return (
//     <div className={Style.test}>
//       <div>服务端渲染:{props.name}</div>
//       {
//         props.list.map(item => {
//         return <div key={item.id}>{item.title}</div>
//         })
//       }
//       <div><button onClick={() => {alert(1)}}>click me</button></div>
//     </div>
//   )
// }

// 将state映射到props
const mapStateToProps = state => ({
  list: state.home.newsList,
  name: state.home.name

})
// 将action方法映射到props
const mapDispatchToProps = dispatch => ({
    getHomeList() {
      dispatch(getHomeList())
    }
})

const ExportHome = connect(mapStateToProps, mapDispatchToProps)(Home)

ExportHome.loadData = (store) => {
  return store.dispatch(getHomeList())
}

export default ExportHome