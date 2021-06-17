import { Actions } from 'src/configs';
import axios from 'axios';

require('dotenv').config();

export async function getCarTypeThunk(dispatch, getState) {
    await axios.get(`${process.env.REACT_APP_API}/api/car-types`)
    .then(res => {
        dispatch({
            type: Actions.GET_CAR_TYPE_SUCCESS,
            payload: {
                data: res.data,
            }
        });
    }).catch(err => {
        if (err.response) {
            dispatch({
                type: Actions.GET_CAR_TYPE_FAIL,
                payload: {
                    message: err.response.data.message
                }
            });
        }
    });    
}