export default (props, style) => {
    if(props.staticContext) {
        props.staticContext.css += style._getCss()
    }
}