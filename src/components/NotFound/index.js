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