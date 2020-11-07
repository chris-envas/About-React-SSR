import axios from "axios"

const instance = axios.create({
    baseURL: '/api',
    params: {
        publicSecret: 'xixi'
    }
})

export default instance