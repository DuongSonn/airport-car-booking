import { AxiosConfig } from "src/configs";
import { getToken } from "./auth";

export function getRequestTransaction(pagination, filter, sorter, callback) {    
    const axios = AxiosConfig();

    let api = `/cash-flows/requests?page=${pagination.current}&limit=${pagination.pageSize}&status=${filter.status}`;
    axios.get(api).then(res => {
            callback(res.data)
        })
        .catch(err => {
            if (err.response) {
                if (err.response.status === 403) {
                    getToken(getRequestTransaction(pagination, filter, sorter, callback));
                } else {
                    callback(err.response.data);
                }
            }
        }) 
}

export function confirmTransaction(id, callback) {
    const axios = AxiosConfig();

    let api = `/cash-flows/${id}`;
    axios.put(api).then(res => {
            callback(res.data)
        })
        .catch(err => {
            if (err.response) {
                if (err.response.status === 403) {
                    getToken(confirmTransaction(id, callback));
                } else {
                    callback(err.response.data);
                }
            }
        }) 
}

export function getDriverTransaction(pagination, filter, sorter, callback) {    
    const axios = AxiosConfig();

    let api = `/cash-flows/drivers?page=${pagination.current}&limit=${pagination.pageSize}&status=${filter.status}`;
    axios.get(api).then(res => {
            callback(res.data)
        })
        .catch(err => {
            if (err.response) {
                if (err.response.status === 403) {
                    getToken(getDriverTransaction(pagination, filter, sorter, callback));
                } else {
                    callback(err.response.data);
                }
            }
        }) 
}