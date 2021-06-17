import React from 'react';
import { Roles } from './configs';

const Dashboard = React.lazy(() => import('./views/dashboard/Dashboard'));

const ListRequests = React.lazy(() => import('./views/request/ListRequest'));
const CreateRequest = React.lazy(() => import('./views/request/CreateRequest'));
const RequestDetail = React.lazy(() => import('./views/request/RequestDetail'));
const ListContracts = React.lazy(() => import('./views/contract/ListContract'));
const ContractDetail = React.lazy(() => import('./views/contract/ContractDetail'));
const ListCars = React.lazy(() => import('./views/hostCar/ListCar'));
const ListDrivers = React.lazy(() => import('./views/hostDriver/ListDriver'));
const ListHostDetails = React.lazy(() => import('./views/hostDetail/ListHostDetail'));
const Profile = React.lazy(() => import('./views/user/Profile'));
const ListRequestTransaction = React.lazy(() => import('./views/transaction/ListRequestTransaction'));
const ListDriverTransaction = React.lazy(() => import('./views/transaction/ListDriverTransaction'));

const routes = [
  { path: '/', exact: true, component: Dashboard, name: 'Home' },
  { path: '/dashboard', name: 'Dashboard', component: Dashboard, 
    permission: [Roles.ADMIN, Roles.AGENCY, Roles.HOST] },
  // Request's route
  { path: '/requests', name: 'Requests', component: ListRequests, 
    permission: [Roles.AGENCY, Roles.HOST], exact: true },
  { path: '/requests/create', name: 'Create Request', component: CreateRequest, 
    permission: [Roles.AGENCY], exact: true },
  { path: '/requests/:id', name: 'Request Detail', component: RequestDetail, 
    permission: [Roles.AGENCY, Roles.HOST], exact: true },
  // Contract's route
  { path: '/contracts', name: 'Contracts', component: ListContracts, 
    permission: [Roles.AGENCY, Roles.HOST], exact: true },
  { path: '/contracts/:id', name: 'Contract Detail', component: ContractDetail, 
    permission: [Roles.AGENCY, Roles.HOST], exact: true },
  // Host's services route
  { path: '/cars', name: 'Cars', component: ListCars, 
    permission: [Roles.HOST], exact: true },
  { path: '/drivers', name: 'Drivers', component: ListDrivers, 
    permission: [Roles.HOST], exact: true },
  { path: '/host-details', name: 'Host Details', component: ListHostDetails, 
    permission: [Roles.HOST], exact: true },
  // User's route
  { path: '/profile', name: 'Profile', component: Profile, 
    permission: [Roles.AGENCY, Roles.HOST], exact: true },
  // Payment's Route
  { path: '/transactions/requests', name: 'Requests\' Transaction', component: ListRequestTransaction, 
    permission: [Roles.ADMIN], exact: true },
  { path: '/transactions/drivers', name: 'Drivers\' Transaction', component: ListDriverTransaction, 
    permission: [Roles.ADMIN], exact: true },
];

export default routes;
