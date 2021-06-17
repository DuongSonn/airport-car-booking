import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import {
  CCreateElement,
  CSidebar,
  CSidebarBrand,
  CSidebarNav,
  CSidebarNavDivider,
  CSidebarNavTitle,
  CSidebarMinimizer,
  CSidebarNavDropdown,
  CSidebarNavItem,
} from '@coreui/react'

import CIcon from '@coreui/icons-react'
import { withNamespaces } from 'react-i18next'

const TheSidebar = ({navigation, t, tReady}) => {
  const dispatch = useDispatch()
  const show = useSelector(state => state.changeState.sidebarShow);

  for (let i = 0; i < navigation.length; i++) {
    if (navigation[i]._children) {
      if (navigation[i].name) {
        navigation[i].name = t(navigation[i].name);
      } 

      for (let j = 0; j < navigation[i]._children.length; j++) {
        if (navigation[i]._children[j].name) {
          navigation[i]._children[j].name = t(navigation[i]._children[j].name);
        } else {
          navigation[i]._children[j] = t(navigation[i]._children[j]);
        }
      }
    } else {
      navigation[i].name = t(navigation[i].name);
    }
  }
  
  return (
    <CSidebar
      show={show}
      onShowChange={(val) => dispatch({type: 'set', sidebarShow: val })}
    >
      <CSidebarBrand className="d-md-down-none" to="/">
        <CIcon
          className="c-sidebar-brand-full"
          name="logo-negative"
          height={35}
        />
        <CIcon
          className="c-sidebar-brand-minimized"
          name="sygnet"
          height={35}
        />
      </CSidebarBrand>
      <CSidebarNav>

        <CCreateElement
          items={navigation}
          components={{
            CSidebarNavDivider,
            CSidebarNavDropdown,
            CSidebarNavItem,
            CSidebarNavTitle
          }}
        />
      </CSidebarNav>
      <CSidebarMinimizer className="c-d-md-down-none"/>
    </CSidebar>
  )
}

export default withNamespaces() (React.memo(TheSidebar))
