import React from 'react'
import { renderToString } from "react-dom/server"
import { StaticRouter, Route } from "react-router-dom"
import { Provider } from "react-redux"
import { renderRoutes } from "react-router-config"


export const render = (store, routes, req, context) => {
    const content = renderToString((
        <Provider store={store}>
             <StaticRouter location={req.path} context={context}>
                {renderRoutes(routes)}
            </StaticRouter>
        </Provider>
    ))
    const CSS_STR = context.css ? context.css : ''// 接收组件传递的css字符串 
    const html = `<html>
        <head>
          <title>ssr</title>
          <style>${CSS_STR}</style>
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