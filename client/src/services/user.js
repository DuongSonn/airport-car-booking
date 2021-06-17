import axios from "axios";
import { AxiosConfig } from "src/configs";
import { getToken } from "./auth";

export function register(data, callback) {
    axios.post(`${process.env.REACT_APP_API}/api/users/register`, data)
        .then(res => {
            callback(res.data)
        })
        .catch(err => {
            if (err.response) {
                callback(err.response.data)
            }
        }) 
}

export function getProfile(id, callback) {
    const axiosConfig = AxiosConfig();

    axiosConfig.get(`/users/${id}`).then(res => {
        callback(res.data);
    })
    .catch(err => {
        if (err.response) {
            if (err.response.status === 403) {
                getToken(getProfile(id, callback));
            } else {
                callback(err.response.data);
            }
        }
    })
}

export function generateCode(callback) {
    const axiosConfig = AxiosConfig();

    axiosConfig.post(`/users/promo_code`).then(res => {
        callback(res.data);
    })
    .catch(err => {
        if (err.response) {
            if (err.response.status === 403) {
                getToken(generateCode(callback));
            } else {
                callback(err.response.data);
            }
        }
    })
}