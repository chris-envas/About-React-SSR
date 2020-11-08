## 前言

本文探索的内容是如何将：**将SPA应用通过同构的方式渲染到客户端**

SPA应用的内容是通过JavaScript驱动的视图，因此人们发现，SPA应用虽然可以构建更加健壮、强大的web应用，但是存在两个缺点

- SEO不友好
- 首屏渲染较慢

为了解决这两个问题，人们想到将SPA应用在服务端渲染后下发，确切的说就是在服务端获取SPA应用**快照**，首屏渲染时采用服务端快照，后续应用逻辑则交由客户端代码接管，这种方式也被称之为**同构**

服务端渲染的知识点总体还是毕竟琐碎的

![wNK6aQ.png](https://s1.ax1x.com/2020/09/11/wNK6aQ.png)



## 服务端渲染组件

创建组件

```javascript
import React from 'react';
const Home = () => {
  return (
    <div>
      <div>服务端渲染</div>
    </div>
  )
}
export default Home
```

使用React提供的`renderToString`在服务端解析组件

```javascript
import Express from "express"
import Home from "../components/Home.js"
import React from 'react'
import { renderToString } from "react-dom/server"

const app = Express()
const content = renderToString(<Home />)
app.get('*', (req, res) => {
    console.log(req.url)
    res.send(
        `<html>
        <head>
          <title>ssr</title>
        </head>
        <body>
          <div id="root">${content}</div>
        </body>
      </html>
        `
    )
})
app.listen(8080,() => {
    console.log('server port on 8080')
})
```

成功把React组件从服务端下发到客户端,可供爬虫爬取

![wNM2wD.png](https://s1.ax1x.com/2020/09/11/wNM2wD.png)

总结：掌握React提供的解析组件方法`renderToString`，服务端才可以下发SPA应用，这一点在Vue亦是同个道理

## 同构

所谓同构为何物？

React提供了`renderToString`方法用于在服务端渲染组件生成HTML供服务端渲染优化SEO，但是组件中的事件处理将无法被激发，因为在服务端中这根本意义，因此我们需要生成一份专门用于客户端的React逻辑代码（用于激发组件中的JS操作），这里称为`bundle.js`，用于激活React组件的事件处理能力，而这就是**同构**

```html
<html>
    <head>
        <title>ssr</title>
    </head>
    <body>
        <div id="root"></div>
        <script src="/bundle.js" ></script>
    </body>
</html>
```

为此，我们需要先扩展服务端的静态资源处理能力，将`webpack`生成的`bundle.js`存放在public文件目录下

```javascript
app.use(Express.static("public"))
```

那么你是否好奇，所谓的`bundle.js`是什么？其实不过就是你最熟悉的纯客户端渲染编写入口文件

```javascript
import React from "react"
import ReactDom from "react-dom"
import Home from "../components/Home.js"

ReactDom.hydrate(<Home />, document.getElementById("root"))
```

对了，你肯定会好奇渲染时为什么不是`ReactDOM.render()`而是`ReactDOM.hydrate() `

这是因为服务端渲染的内容会存在标记，React可以在客户端识别到这一点，所以如果使用了`ReactDOM.hydrate() `方法，React会保留服务端的内容，仅触发组件的事件处理能力，如果用一句话来说明，那就是：**既然你已经帮我处理了20%，那么剩下的80%我来搞定**

总结：同构是服务端渲染的核心之一，因为客户端的`bundle.js`是驱动SPA应用的重点！

## 服务端路由

SPA应用大部分会采用前端路由功能，客户端路由代码按照正常标准一般书写，采用`BrowserRouter`包裹路由组件

```javascript
import React from "react"
import ReactDom from "react-dom"
import {BrowserRouter} from "react-router-dom"
import Routes from "../Routes"

const App = () => {
    return (
        <BrowserRouter>
            {Routes}
        </BrowserRouter>
    )
}

ReactDom.hydrate(<App />, document.getElementById("root"))
```

**但存在一个问题，在客户端运行React应用程序时，可以自动感知当前的URL,进而按照不同的逻辑加载React路由组件，但在服务端，React应用程序无法自动感知URL，必须在每次用户请求时才能感知，因此不能采用`BrowserRouter`而是必须使用`StaticRouter`，并在每次请求时获取`req.path`当前请求路径，将之挂载到`location`属性上，`StaticRouter`方能找到对应逻辑组件进行加载**

```javascript
import Express from "express"
import React from 'react'
import { renderToString } from "react-dom/server"
import {StaticRouter} from "react-router-dom"
import Routes from "../Routes.js"

const app = Express()
app.use(Express.static("public"))
app.get('*', (req, res) => {
   const content = renderToString((
      <StaticRouter location={req.path} context={{}}>
        {Routes}
      </StaticRouter>
    ))
    const content = renderToString((
      <StaticRouter location={req.path} context={{}}>
        {Routes}
      </StaticRouter>
    ))
    res.send( 
        `<html>
        <head>
          <title>ssr</title>
        </head>
        <body>
          <div id="root">${content}</div>
          <script src="./index.js" ></script>
        </body>
      </html>
        `
    )
})
```

**优化：多路由中的公共组件复用**

> 假设在`Home`组件与`Login`组件中都需要用到`Header`组件，那么需要在组件中引入两次，如果有N个路由将需要重复引入N次

对此，可以使用`react-router-config`提供的`renderRoutes`方法解决这个问题

首先需要调整路由文件的结构,采用数组嵌套的形式

```javascript
...
export default [{
    path: '/',
    component: App,
    routes: [
        {
            path: '/',
            exact: true,
            component: Home,
            loadData: Home.loadData,
            key: 'home'
        },
        {
            path: '/login',
            exact: true,
            component: Login,
            key: 'login'
        }
    ]
}]
```

通过`renderRoutes`识别修改后的路由文件

```javascript
// client/index.js
import Routes from "../Routes"
import { renderRoutes } from "react-router-config"
...
const App = () => {
    return (
        <Provider store={getClientStore()}>
            <BrowserRouter>
               {renderRoutes(Routes)}
            </BrowserRouter>
        </Provider>
    )
}

// server/util.js
const content = renderToString((
        <Provider store={store}>
             <StaticRouter location={req.path} context={{}}>
                {renderRoutes(routes)}
            </StaticRouter>
        </Provider>
  ))
```

最后修改一级路由`/`路径对应的组件,同样使用`renderRoutes`方法，此时可以通过`props`属性获取路由文件中的嵌套路由，作为参数调用，方可正确加载我们需要的组件

```javascript
// App.js
import React from "react"
import Header from "./common/header"

import { renderRoutes } from "react-router-config"

const App = (props) => {
    return (
        <div>
            <Header />
            {renderRoutes(props.route.routes)}
        </div>
    )
}

export default App
```



## 数据同步

数据同步是服务端渲染的另一核心，因为服务端与客户端必须维持一套相同数据激发的视图，否则在客户端会发生重绘甚至出错

因此需要借助`redux`的能力，为组件提供数据仓库`store`，下面先将组件与`redux`连接在一起

```javascript
//store.js
import { createStore, applyMiddleware } from "redux"
import thunk from 'redux-thunk'

const reducer = (state = {name: 'de'}, action) => {
    return state
}

// 每次返回新的Store
const getStore = () => {
    return createStore(reducer, applyMiddleware(thunk))
}

export default getStore
```

在服务端与客户端逻辑中，一致通过`Provider`进行`store`挂载

```javascript
// client/index.js
...
import Routes from "../Routes"
import getStore from "../store/index.js"

const App = () => {
    return (
        <Provider store={getStore()}>
            <BrowserRouter>
                {Routes}
            </BrowserRouter>
        </Provider>
    )
}
...
```

```javascript
// server/index.js
...
import { Provider } from "react-redux"
import getStore from "../store/index.js"

export const render = (req) => {
    const content = renderToString((
        <Provider store={getStore()}>
             <StaticRouter location={req.path} context={{}}>
                {Routes}
            </StaticRouter>
        </Provider>
    ))
...
}
```

在组件中利用`react-redux`提供的`connect`方法连接数据，`mapStateToProps`与`mapDispatchToProps`分别用于映射数据与方法

```javascript
// Home.js
...
import { connect } from "react-redux"
import { getHomeList } from "./store/actions"

const Home = (props) => {
  useEffect(() => {
    props.getHomeList()
  },[])
  return (
    <div>
      <Header />
      <div>服务端渲染:{props.name}</div>
      <button onClick={() => {alert(1)}}>click me</button>
    </div>
  )
}
// 将state映射到props
const mapStateToProps = state => ({
  name: state.home.name
})
// 将action方法映射到props
const mapDispatchToProps = dispatch => ({
    getHomeList() {
      dispatch(getHomeList())
    }
})

export default connect(mapStateToProps, mapDispatchToProps)(Home)
```

[更多关于redux的使用方法](https://www.redux.org.cn/docs/advanced/AsyncActions.html)

上述代码，在编写纯客户端渲染时，你已经非常了熟悉了，你会轻易的发现上述代码的逻辑

- 1、组件渲染即将挂载时，调用`props.getHomeList()`
- 2、触发`store`内部的方法发起异步请求，获取数据渲染数据列表

遗憾的是在服务端环境中`props.getHomeList()`压根不会被执行，众所周知`useEffect`在这里相当于`componentDidMount `生命周期，在服务端渲染时，是不会触发该生命周期的，那么异步请求更无从发起！

React团队当然想到这个问题，因此提供了解决方案：**[改造路由](https://reactrouter.com/web/guides/server-rendering)**

通常来讲，编写Reaact应用的路由应该是如下所示

```javascript
export default (
    <div>
        <Route path="/" exact component={Home}></Route>
        <Route path="/login" exact component={Login}></Route>
    </div>
)
```

但是为了服务端渲染，我们需要进行重构,改写成如下的数组格式

```javascript
export default [
    {
        path: '/',
        exact: true,
        component: Home,
        loadData: Home.loadData, // 服务端初始化数据
        key: 'home'
    },
    {
        path: '/login',
        exact: true,
        component: Login,
        key: 'login'
    }
]
```

可以看到改写的路由中包含`loadData`属性

喂！这个就是重点了，`loadData`将用于服务端渲染时提前执行，完成异步数据的获取，你也许好奇在`Home`组件如何编写`loadData`，实际上非常简单

```javascript
// Home.js
...
// 将state映射到props
const mapStateToProps = state => ({
  name: state.home.name
})
// 将action方法映射到props
const mapDispatchToProps = dispatch => ({
    getHomeList() {
      dispatch(getHomeList())
    }
})

+ Home.loadData = (store) => {
+  return store.dispatch(getHomeList())
+ }

export default connect(mapStateToProps, mapDispatchToProps)(Home)
```

由于返回的路由不再是`JSX`的形式，因此需要循环遍历如下所示

```javascript
// 服务端
<StaticRouter location={req.path} context={{}}>
     {routes.map(route => (
      <Route {...route} />
     ))}
</StaticRouter>

// 客户端
 <BrowserRouter>
    {Routes.map(route => (
     <Route {...route} />
    ))}
</BrowserRouter>
```

**服务端预加载数据阶段比较特殊，我们需要监听每次请求的`req.path`来判断需要调用哪个组件的`loadData`方法**

`react-router-dom`提供了`matchPath `用来根据`req.path`找到具体的路由组件，如下所示

```javascript
import { matchPath }  from  "react-router-dom"
const promises = [];
routes.some(route => {
  const match = matchPath(req.path, route)
  if (match) promises.push(route.loadData(match))
  return match
})
Promise.all(promises).then(data => {
  // 异步请求已完成 可以渲染组件 下发到客户端
});
```

**注意：**如果你的路由包含了嵌套路由，也就是多层级路由，如下所示，`matchPath`方法将无法识别

```javascript
const routes = [
  {
    component: Root,
    routes: [
      {
        path: "/",
        exact: true,
        component: Home
      },
      {
        path: "/child/:id",
        component: Child,
        routes: [
          {
            path: "/child/:id/grand-child",
            component: GrandChild
          }
        ]
      }
    ]
  }
];
```

因此需要额外使用第三方库`react-router-config`提供的`matchRoutes `方可识别多层级的嵌套路由，具体使用方法请移步[react-router-config](https://github.com/ReactTraining/react-router/tree/master/packages/react-router-config)

```javascript
const match = matchRoutes(routes, req.path);
// using the routes shown earlier, this returns
// [
//   routes[0],
//   routes[0].routes[1]
// ]
```

到目前为止，我们解决了**首屏渲染时服务器初始化数据**这一“心腹大患”，解决了它，意味着我们的WEB应用将正常支持SEO

但是还存在一个小小的问题，客户端未能同步到服务端的数据

**仔细 回想一下，当我们在服务端初始化数据后，数据将会被存储在`store`中，但是在客户端应用是无法获取到这份数据，因为在客户端会重新创建新的`store`实例，毕竟二者处于不同的上下文环境中，由于二者的数据不一致，在渲染组件时，React会发现服务端渲染的内容与当前客户端的数据逻辑并不一致，往往控制台报诸如以下的错误，实际上就是内部的`diff`发现二者的`vnode`结构前后不一致**

```javascript
Warning: Expected server HTML to contain a matching <button> in <div>.
Warning: Did not expect server HTML to contain a <div> in <div>.
```

为此，我们需要将服务端获取的数据同步给客户端，答案就是在服务端下发的HTML增加以下内容

```javascript
  <script>
      window.context = {
     	state: ${JSON.stringify(store.getState())}
	  }
 </script>
```

并修改客户端创建`store`实例的代码，默认获取检查当前全局对象`window`中是否存在`context`

```javascript
export const getClientStore = () => {
    const defaultState = window.context ? window.context.state : {};
    return createStore(reducer, defaultState, applyMiddleware(thunk));
}
```

如此一来，就完成了服务端与客户端的数据同步，一个基本的SSR工程就已经初具雏形！

总结：服务端数据的预加载是重中之重，实现起来其实并不麻烦，本质是都是利用`redux`充当数据层，Next.js也提供了类似的机制，其方法为`getInitialProps`,详情在[这里](https://nextjs.frontendx.cn/docs/#%E8%8E%B7%E5%8F%96%E6%95%B0%E6%8D%AE%E4%BB%A5%E5%8F%8A%E7%BB%84%E4%BB%B6%E7%94%9F%E5%91%BD%E5%91%A8%E6%9C%9F)

## 请求代理

使用Node.js服务端渲染时,会产生多渠道请求的问题，负责接口服务的A服务器需要接受来自Node.js服务器与浏览器客户端的请求，在定位问题时将会变得复杂许多，并且可能还会衍生出其他问题，因此可以将客户端请求通过代理的方式交给Node.js服务器进行转发

- 将请求都集中于Node.js服务器上便于日后请求问题排查
- 更充分的使用了Node.js的能力，毕竟仅仅用来做组件渲染有点浪费
- 减轻了接口服务器的压力，方便日后业务的调整

使用代理非常简单

```javascript
npm i express-http-proxy --save
```

这里以本地服务器为例（虚构）

客户端请求`http://localhost/api/**`会被转发为`http://136.152.12.5/**`

```javascript
app.use('/api', proxy('http://admin.kuwanfront.cn', {
  proxyReqPathResolver(req) {
    console.log(req.url)
    return req.url
  }
}))
```

区分客户端/服务端发送请求的根路径，利用`axios`提供的`instance`能力，配置不同的请求实例，将客户端的请求根路径`baseURL`设置为采用相对路径的形式

```javascript
// /client/request.js
import axios from "axios"

const instance = axios.create({
    baseURL: '/'
})

export default instance
```

```javascript
// /server/request.js
import axios from "axios"

const instance = axios.create({
    baseURL: 'http://admin.kuwanfront.cn'
})

export default instance
```

现在面临的问题就是：**如何在客户端与服务端请求时区分不同的Axios实例**，通常来讲可以通过控制变量的形式来进行区分，但这种方式不仅使代码量增多，耦合且提高了项目维护的难度，因此我们可以需要寻求其他的方法优化工程代码

得益于`redux-thunk`中间件提供的`withExtraArgument`方法，允许我们传入自定义参数，所以我们可以将客户端与服务端的`axios`实例以参数的形式传入，从根本上区分了实例的请求方法，并且代码逻辑清晰，不干涉请求方法内部逻辑，此为优解

```javascript
// sotre/index.js
import { createStore, applyMiddleware, combineReducers } from "redux"
import thunk from 'redux-thunk'
import { reducer as homeReducer } from "../components/Home/store/"
import clinetRequest from "../client/request"
import serverRequest from "../server/request"
...

export const getStore = () => {
    return createStore(reducer, applyMiddleware(thunk.withExtraArgument(serverRequest)))
}

export const getClientStore = () => {
    const defaultState = window.context ? window.context.state : {}
    return createStore(reducer, defaultState, applyMiddleware(thunk.withExtraArgument(clinetRequest)))
}
```

并在触发Redux的Aaction时，获取该实例`axiosInstance`调用

```javascript
// action.js
...
export const getHomeList = (server) => {
    return (dispatch,getState,axiosInstance) => {
        return axiosInstance.get('default/getArticleList')
            .then(res => {
                dispatch(changeList(res.data.data))
            }
        )
    }
}
```

如此一来就合理的处理了客户端/服务端请求的`baseURL`不同的问题

## 异常与重定向

> 接下来完善服务端的404和301重定向功能

### 服务端返回404状态码

新建`NotFound`组件

```javascript
// NotFound.js
import React from "react"

const NotFound = (props) => {
    return (
        <div>404</div>
    )
}

export default NotFound
```

修改路由,在识别不到具体路径时，调用该`NotFound`组件

```javascript
// Routes.js
...
import NotFound from "./components/NotFound/index.js"


export default [{
    path: '/',
    component: App,
    routes: [
       ...
        {
            component: NotFound
        }
    ]
}]
```

服务端设置传入`context`字段

```javascript
// server/index.js
...
app.get('*', (req, res) => {
  ...
  Promise.all(promises).then(() => {
    let context = {}
    const html = render(store, routes, req, context)
  })
})
```

得益于`StaticRouter`组件提供的功能，我们可以在`NotFound`组件接收到`context`并创建`NOTFOUND`字段作为服务端识别404的状态

```javascript
...
export const render = (store, routes, req, context) => {
    const content = renderToString((
        <Provider store={store}>
             <StaticRouter location={req.path} context={context}>
                {renderRoutes(routes)}
            </StaticRouter>
        </Provider>
    ))
    const html = `<html>
        <head>
          <title>ssr</title>
        </head>
        <body>
          <div id="root">${content}</div>
          <script>
            window.context = {
              state: ${JSON.stringify(store.getState())}
            }
          </script>
          <script src="/index.js" ></script>
        </body>
      </html>
        `
    return html
}
```

```javascript
// NotFound.js
import React from "react"

const NotFound = (props) => {
    if(props.staticContext) {
        props.staticContext.NOTFOUND = true
    }
    return (
        <div>404</div>
    )
}

export default NotFound
```

服务端返回404状态码

```javascript
// server/index.js
...
app.get('*', (req, res) => {
  ...
  Promise.all(promises).then(() => {
    let context = {}
    const html = render(store, routes, req, context)
    if(context.NOTFOUND) {
      res.status(404)
      res.send(html)
    }else{
      res.status(200)
      res.send(html)
    }
  })
})
```

301重定向比较特殊，服务端的路由组件我们采用的是 `StaticRouter`组件进行嵌套处理

因此当某个组件出现`react-router-dom`提供的`Redirect`组件时，`StaticRouter`组件会自动往`context`注入内容如下所示

```javascript
import { Redirect } from "react-router-dom"

const Loign = () => {
  const test = false
  console.log(test)
  return (
    test ? 
    <div>
      <div>Loign</div>
    </div>
    :
    <Redirect 
      to="/"
    />
  )
}
export default Loign
```

在服务端中打印此时`context`

```javascript
...
app.get('*', (req, res) => {
  ...
  Promise.all(promises).then(() => {
    let context = {}
    const html = render(store, routes, req, context)
    console.log(context)
    if(context.NOTFOUND) {
      res.status(404)
      res.send(html)
    }else{
      res.status(200)
      res.send(html)
    }
  })
})
```

输出`context`内容，注意再强调一遍，这个操作是`StaticRouter`路由组件自动完成的，我们只需要坐享其成

```javascript
{
  action: 'REPLACE',
  location: { pathname: '/', search: '', hash: '', state: undefined },
  url: '/'
}
```

```javascript
...
app.get('*', (req, res) => {
  ...
  Promise.all(promises).then(() => {
    let context = {}
    const html = render(store, routes, req, context)
   
    if(context.NOTFOUND) {
      res.status(404)
      res.send(html)
    }else{
      res.status(200)
      res.send(html)
    }
  })
})
```

可以知道，服务端组件在`StaticRouter`路由组件渲染时会被动态注入`staticContext`属性，凭借该属性我们可以设法完成特定的需求
