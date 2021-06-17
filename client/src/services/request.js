import { AxiosConfig } from "src/configs";
import { getToken } from "./auth";

export function getListRequests(pagination, filter, sorter, callback) {    
    const axios = AxiosConfig();

    let api = `/requests?page=${pagination.current}&limit=${pagination.pageSize}&provinces=${filter.province}&car_types=${filter.car_type}&status=${filter.status}`;
    axios.get(api).then(res => {
            callback(res.data)
        })
        .catch(err => {
            if (err.response) {
                if (err.response.status === 403) {
                    getToken(getListRequests(pagination, filter, sorter, callback));
                } else {
                    callback(err.response.data);
                }
            }
        }) 
}

export function createNewRequest(data, callback) {
    const axios = AxiosConfig();

    axios.post(`/requests`, data).then(res => {
            callback(res.data);
        })
        .catch(err => {
            if (err.response) {
                if (err.response.status === 403 || err.response.status === 401) {
                    getToken(createNewRequest(data, callback));
                } else {
                    callback(err.response.data);
                }
            }
        })
}

export function calculateRequestPrice(data, callback) {
    const axios = AxiosConfig();

    axios.post(`/requests/calculate-price`, data).then(res => {
            callback(res.data);
        })
        .catch(err => {
            if (err.response) {
                if (err.response.status === 403 || err.response.status === 401) {
                    getToken(calculateRequestPrice(data, callback));
                } else {
                    callback(err.response.data);
                }
            }
        })
}

export function getRequestDetail(id, callback) {
    const axios = AxiosConfig();

    axios.get(`/requests/${id}`).then(res => {
        callback(res.data);
    })
    .catch(err => {
        if (err.response) {
            if (err.response.status === 403 || err.response.status === 401) {
                getToken(getRequestDetail(id, callback));
            } else {
                callback(err.response.data);
            }
        }
    })
}

export function getRequestDetailByCode(code, callback) {
    const axios = AxiosConfig();

    axios.get(`/requests/check?code=${code}`).then(res => {
        callback(res.data);
    })
    .catch(err => {
        if (err.response) {
            callback(err.response.data);
        }
    })
}

export function cancelRequest(id, callback) {
    const axios = AxiosConfig();

    axios.delete(`/requests/${id}`).then(res => {
        callback(res.data);
    })
    .catch(err => {
        if (err.response) {
            if (err.response.status === 403 || err.response.status === 401) {
                getToken(cancelRequest(id, callback));
            } else {
                callback(err.response.data);
            }
        }
    })
}

export function updateRequestDetail(data, callback) {
    console.log(data);
    const axios = AxiosConfig();

    axios.put(`/requests/${data.id}`, data).then(res => {
        callback(res.data);
    })
    .catch(err => {
        if (err.response) {
            if (err.response.status === 403) {
                getToken(updateRequestDetail(data, callback));
            } else {
                callback(err.response.data);
            }
        }
    })
}