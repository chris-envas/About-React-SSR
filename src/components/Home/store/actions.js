import { CHANGE_LIST } from "./contants"

const changeList = (list) => ({
        type: CHANGE_LIST,
        list
    }
)

export const getHomeList = () => {
    return (dispatch,getState,axiosInstance) => {
        return axiosInstance.get('default/getArticleList')
            .then(res => {
                dispatch(changeList(res.data.data))
            }
        )
    }
}