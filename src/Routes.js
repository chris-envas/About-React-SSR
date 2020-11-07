import Home from "./components/Home/index.js"
import Login from "./components/Login/index.js"
import NotFound from "./components/NotFound/index.js"
import App from "./App"

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
        },
        {
            component: NotFound
        }
    ]
}]

