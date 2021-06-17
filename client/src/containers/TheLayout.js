import React, { useEffect } from 'react'
import {
  TheContent,
  TheSidebar,
  TheFooter,
  TheHeader
} from './index'
import {
  getAllowedNav,
  getAllowedRoute,
} from 'src/services/auth'
import { Redirect } from 'react-router-dom'
import routes from '../routes'
import navigation from './_nav'
// import Page500 from 'src/views/page500/Page500'
import { useSelector } from 'react-redux'
import socket from 'src/socket'
import { notification } from 'antd'

const _ = require('lodash');

const TheLayout = (props) => {
  const user = useSelector(state => state.user);
  let allowedRoutes = [];
  let allowedNav = [];

  useEffect(() => {
    socket.getInstance(user.data._id, user.data.role).on("notification", (data) => {
      notification.success({
        message: `Notification`,
        description: `${data.message}`,
        placement: `bottomRight`,
        duration: 1.5,
      });
    })
  }, []);

  if (user && !_.isEmpty(user.data)) {
    allowedRoutes = getAllowedRoute(routes, user.data.role);
    allowedNav = getAllowedNav(navigation, user.data.role);

  } else {
    // if (props.location.pathname === "/") {
    //   return <Page500></Page500>
    // }

    return <Redirect to="/login" />;
  }
  return (
    <div className="c-app c-default-layout">
      <TheSidebar navigation={allowedNav}/>
      <div className="c-wrapper">
        <TheHeader/>
        <div className="c-body">
          <TheContent routes={allowedRoutes}/>
        </div>
        <TheFooter/>
      </div>
    </div>
  )
}

export default (TheLayout)
