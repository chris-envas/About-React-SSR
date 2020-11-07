import React from "react"
import { Link } from "react-router-dom"
import Style from "./style.css"
import withStyle from "../withStyle"

const header = (props) => {
    withStyle(props, Style)
    return (
        <div className={Style.test}>
            <Link to="/">to home</Link>
            <Link to="/login">to login</Link>
        </div>
    )
}

export default header