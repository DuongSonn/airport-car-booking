import { Actions } from 'src/configs';

const initialState = [];
const provinceReducer = (state = initialState, action) => {
    switch (action.type) {
        case Actions.GET_PROVINCE_SUCCESS:
            return action.payload.data.provinces;
        default:
            return state;
    }
}

export default provinceReducer;