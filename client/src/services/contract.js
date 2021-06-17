import { AxiosConfig } from "src/configs";
import { getToken } from "./auth";

const axios = AxiosConfig();

export function getListContracts(pagination, filter, sorter, callback) {
    const axios = AxiosConfig();

    let api = `/contracts?page=${pagination.current}&limit=${pagination.pageSize}&provinces=${filter.province}&status=${filter.status}`;
    axios.get(api).then(res => {
            callback(res.data)
        })
        .catch(err => {
            if (err.response) {
                if (err.response.status === 403) {
                    getToken(getListContracts(pagination, filter, sorter, callback));
                } else {
                    callback(err.response.data);
                }
            }
        }) 
}

export function getContractDetail(id, callback) {
    const axios = AxiosConfig();

    axios.get(`/contracts/${id}`).then(res => {
        callback(res.data);
    })
    .catch(err => {
        if (err.response) {
            if (err.response.status === 403 || err.response.status === 403) {
                getToken(getContractDetail(id, callback));
            } else {
                callback(err.response.data);
            }
        }
    })
}

export function updateContract(data, callback) {
    const axios = AxiosConfig();

    axios.put(`/contracts/${data.id}`, data).then(res => {
        callback(res.data);
    })
    .catch(err => {
        if (err.response) {
            if (err.response.status === 403) {
                getToken(updateContract(data, callback));
            } else {
                callback(err.response.data);
            }
        }
    })
}

export function deleteContract(id, callback) {
    const axios = AxiosConfig();

    axios.delete(`/contracts/${id}`).then(res => {
        callback(res.data);
    })
    .catch(err => {
        if (err.response) {
            if (err.response.status === 403) {
                getToken(deleteContract(id, callback));
            } else {
                callback(err.response.data);
            }
        }
    })
}

export function updateContractDriver(data, callback) {
    const axios = AxiosConfig();

    axios.put(`/contracts/contract-driver/${data.id}`, data).then(res => {
        callback(res.data);
    })
    .catch(err => {
        if (err.response) {
            if (err.response.status === 403) {
                getToken(updateContractDriver(data, callback));
            } else {
                callback(err.response.data);
            }
        }
    })
}