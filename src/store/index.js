import { createStore, applyMiddleware, combineReducers } from "redux"
import thunk from 'redux-thunk'
import { reducer as homeReducer } from "../components/Home/store/"
import clinetRequest from "../client/request"
import serverRequest from "../server/request"

const reducer = combineReducers({
    home: homeReducer
})

export const getStore = (req) => {
    return createStore(reducer, applyMiddleware(thunk.withExtraArgument(serverRequest(req))))
}

export const getClientStore = () => {
    const defaultState = window.context ? window.context.state : {}
    return createStore(reducer, defaultState, applyMiddleware(thunk.withExtraArgument(clinetRequest)))
}
