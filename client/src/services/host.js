import { AxiosConfig } from "src/configs";
import { getToken } from "./auth";

export function getListCars(pagination, callback) {
    const axios = AxiosConfig();
    
    axios.get(`/users/cars?page=${pagination.current}&limit=${pagination.pageSize}`).then(res => {
        callback(res.data);
    }).catch(err => {
        if (err.response) {
            if (err.response.status === 403) {
                getToken(getListCars(pagination, callback));
            } else {
                callback(err.response.data);
            }
        }
    });
}

export function createHostCar(data, callback) {
    const axios = AxiosConfig();

    axios.post(`/users/cars`, data).then(res => {
        callback(res.data);
    }).catch(err => {
        if (err.response) {
            if (err.response.status === 403) {
                getToken(createHostCar(data, callback));
            } else {
                callback(err.response.data);
            }
        }
    });
}

export function updateHostCar(data, callback) {
    const axios = AxiosConfig();

    axios.put(`/users/cars/${data._id}`, data).then(res => {
        callback(res.data);
    }).catch(err => {
        if (err.response) {
            if (err.response.status === 403) {
                getToken(updateHostCar(data, callback));
            } else {
                callback(err.response.data);
            }
        }
    });
}

export function deleteHostCar(data, callback) {
    const axios = AxiosConfig();

    axios.delete(`/users/cars/${data._id}`).then(res => {
        callback(res.data);
    }).catch(err => {
        if (err.response) {
            if (err.response.status === 403) {
                getToken(deleteHostCar(data, callback));
            } else {
                callback(err.response.data);
            }
        }
    });
}

export function getListDrivers(pagination, callback) {
    const axios = AxiosConfig();

    axios.get(`/users/drivers?page=${pagination.current}&limit=${pagination.pageSize}`).then(res => {
        callback(res.data);
    }).catch(err => {
        if (err.response) {
            if (err.response.status === 403) {
                getToken(getListDrivers(pagination, callback));
            } else {
                callback(err.response.data);
            }
        }
    });
}

export function createHostDriver(data, callback) {
    const axios = AxiosConfig();

    axios.post(`/users/drivers`, data).then(res => {
        callback(res.data);
    }).catch(err => {
        if (err.response) {
            if (err.response.status === 403) {
                getToken(createHostDriver(data, callback));
            } else {
                callback(err.response.data);
            }
        }
    });
}

export function updateHostDriver(data, callback) {
    const axios = AxiosConfig();

    axios.put(`/users/drivers/${data._id}`, data).then(res => {
        callback(res.data);
    }).catch(err => {
        if (err.response) {
            if (err.response.status === 403) {
                getToken(updateHostDriver(data, callback));
            } else {
                callback(err.response.data);
            }
        }
    });
}

export function deleteHostDriver(data, callback) {
    const axios = AxiosConfig();

    axios.delete(`/users/drivers/${data._id}`).then(res => {
        callback(res.data);
    }).catch(err => {
        if (err.response) {
            if (err.response.status === 403) {
                getToken(deleteHostCar(data, callback));
            } else {
                callback(err.response.data);
            }
        }
    });
}

export function rechargeDriverAccount(data, callback) {
    const axios = AxiosConfig();

    axios.post(`/cash-flows`, data).then(res => {
        callback(res.data);
    }).catch(err => {
        if (err.response) {
            if (err.response.status === 403) {
                getToken(rechargeDriverAccount(data, callback));
            } else {
                callback(err.response.data);
            }
        }
    })
}

export function getListDetails(pagination, callback) {
    const axios = AxiosConfig();

    axios.get(`/users/host-details?page=${pagination.current}&limit=${pagination.pageSize}`).then(res => {
        callback(res.data);
    }).catch(err => {
        if (err.response) {
            if (err.response.status === 403) {
                getToken(getListDetails(pagination, callback));
            } else {
                callback(err.response.data);
            }
        }
    });
}

export function createHostDetail(data, callback) {
    const axios = AxiosConfig();

    axios.post(`/users/host-details`, data).then(res => {
        callback(res.data);
    }).catch(err => {
        if (err.response) {
            if (err.response.status === 403) {
                getToken(createHostDetail(data, callback));
            } else {
                callback(err.response.data);
            }
        }
    });
}

export function updateHostDetail(data, callback) {
    const axios = AxiosConfig();

    axios.put(`/users/host-details/${data._id}`, data).then(res => {
        callback(res.data);
    }).catch(err => {
        if (err.response) {
            if (err.response.status === 403) {
                getToken(updateHostDetail(data, callback));
            } else {
                callback(err.response.data);
            }
        }
    });
}

export function deleteHostDetail(data, callback) {
    const axios = AxiosConfig();

    axios.delete(`/users/host-details/${data._id}`).then(res => {
        callback(res.data);
    }).catch(err => {
        if (err.response) {
            if (err.response.status === 403) {
                getToken(deleteHostDetail(data, callback));
            } else {
                callback(err.response.data);
            }
        }
    });
}