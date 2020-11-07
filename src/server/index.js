import Express from "express"
import proxy from "express-http-proxy"
import { render } from "./util.js"
import { getStore } from "../store/index.js"
import routes  from '../Routes'
import { matchRoutes } from 'react-router-config'

const app = Express()
app.use(Express.static("public"))
app.use('/api', proxy('http://admin.kuwanfront.cn', {
  proxyReqPathResolver(req) {
    return req.url
  }
}))

app.get('*', (req, res) => {
  const store = getStore(req)
  const matchedRoutes = matchRoutes(routes, req.path)
  const promises = []
  matchedRoutes.forEach(item => {
    if (item.route.loadData) {
      const promise = new Promise((resolve, reject) => {
        item.route.loadData(store).then(resolve).catch(resolve)
      })
      promises.push(promise)
    }
  })
  Promise.all(promises).then(() => {
    let context = {
      css: ''
    }
    const html = render(store, routes, req, context)
    if(context.action === "REPLACE") {
      res.redirect(301, context.url)
    }else if(context.NOTFOUND) {
      res.status(404)
      res.send(html)
    }else{
      res.status(200)
      res.send(html)
    }
  }).catch(err => {
    res.status(502)
    res.send('Request failed with status code 404 in Server')
  })
})

app.listen(9000, () => {
  console.log('server port on 9000')
})