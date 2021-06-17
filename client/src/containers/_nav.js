import React from 'react'
import CIcon from '@coreui/icons-react'
import { Roles } from 'src/configs';

const _nav =  [
  {
    _tag: 'CSidebarNavItem',
    name: 'Dashboard',
    to: '/dashboard',
    icon: <CIcon name="cil-speedometer" customClasses="c-sidebar-nav-icon"/>,
    badge: {
      color: 'info',
      text: 'NEW',
    }
  },
  // Host's Services
  {
    _tag: 'CSidebarNavTitle',
    _children: ['Host services'],
    permission: [Roles.HOST],
  },
  {
    _tag: 'CSidebarNavItem',
    name: 'Host\'s Cars',
    icon: 'cil-car-alt',
    permission: [Roles.HOST],
    to: '/cars',
  },
  {
    _tag: 'CSidebarNavItem',
    name: 'Host\'s Drivers',
    icon: 'cil-user',
    permission: [Roles.HOST],
    to: '/drivers',
  },
  {
    _tag: 'CSidebarNavItem',
    name: 'Host\'s Working Provinces',
    icon: 'cil-location-pin',
    permission: [Roles.HOST],
    to: '/host-details',
  },
  // Airport services
  {
    _tag: 'CSidebarNavTitle',
    _children: ['Airport services'],
  },
  {
    _tag: 'CSidebarNavDropdown',
    name: 'Requests',
    icon: 'cil-airplane-mode',
    permission: [Roles.AGENCY, Roles.HOST],
    _children: [
      {
        _tag: 'CSidebarNavItem',
        name: 'List Requests',
        to: '/requests',
        permission: [Roles.AGENCY, Roles.HOST]
      },
      {
        _tag: 'CSidebarNavItem',
        name: 'Create Request',
        to: '/requests/create',
        permission: [Roles.AGENCY]
      },
    ],
  },
  {
    _tag: 'CSidebarNavDropdown',
    name: 'Contracts',
    icon: 'cil-car-alt',
    permission: [Roles.AGENCY, Roles.HOST],
    _children: [
      {
        _tag: 'CSidebarNavItem',
        name: 'List Contracts',
        to: '/contracts',
        permission: [Roles.AGENCY, Roles.HOST],
      },
    ],
  },
  {
    _tag: 'CSidebarNavDropdown',
    name: 'Transactions',
    icon: 'cil-cash',
    permission: [Roles.ADMIN],
    _children: [
      {
        _tag: 'CSidebarNavItem',
        name: 'List Requests\' Transaction',
        to: '/transactions/requests',
        permission: [Roles.ADMIN],
      },
      {
        _tag: 'CSidebarNavItem',
        name: 'List Drivers\' Transaction',
        to: '/transactions/drivers',
        permission: [Roles.ADMIN],
      },
    ],
  },
  // Admin Services
]

export default (_nav)
