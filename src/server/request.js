import axios from "axios"

const createInstance = req => axios.create({
    baseURL: 'http://admin.kuwanfront.cn',
    headers: {
        cookie: req.get('cookie') || ''
    },
    params: {
        publicSecret: 'xixi'
    }
})

export default createInstance