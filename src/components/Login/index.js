import React from "react"
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