import React from 'react'
import { useSelector } from 'react-redux'
import { Roles } from 'src/configs'
import CreateContract from '../contract/CreateContract'
import AgencyRequestDetail from './AgencyRequestDetail'

export default function RequestDetail({match}) {
    const user = useSelector(state => state.user)
    return (
        <>
            {user.data.role === Roles.AGENCY ? <AgencyRequestDetail match={match}></AgencyRequestDetail> 
                : <CreateContract match={match}></CreateContract>} 
        </>
    )
}
