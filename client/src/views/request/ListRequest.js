import React, { useEffect, useState } from 'react'
import {
    CCol,
    CRow,
    CCard,
    CCardBody,
    CCardHeader
} from '@coreui/react'
import { Table, Tag, Space, Button } from 'antd';
import { Notification, Roles, Status, Type } from 'src/configs';
import { getListRequests } from 'src/services/request';
import { Link } from 'react-router-dom';
import moment from 'moment';
import { useSelector } from 'react-redux';
import { withNamespaces } from 'react-i18next';
import socket from 'src/socket';
  
const ListRequest = ({ t }) => {
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 100,
    });
    const [data, setData] = useState();
    const [provinceFilter, setProvinceFilter] = useState([]);
    const [carTypeFilter, setCarTypeFilter] = useState([]);
    const [statusFilter, setStatusFilter] = useState([]);

    const provinces = useSelector(state => state.provinces);
    const carTypes = useSelector(state => state.carTypes);
    const user = useSelector(state => state.user);

    const columns = [
        {
            title: t('ID'),
            dataIndex: 'key',
        },
        {
            title: t('Pickup Location'),
            dataIndex: 'request_destinations',
            render: request_destinations => (
                <>
                {request_destinations.map(request_destination => (
                    (request_destination.type === Type.PICKUP_LOCATION) && (request_destination.location[0])
                ))}
                </>
            )
        },
        {
            title: t('Drop Off Location'),
            dataIndex: 'request_destinations',
            render: request_destinations => (
                <>
                {request_destinations.map(request_destination => (
                    (request_destination.type === Type.DROP_OFF_LOCATION) && (request_destination.location[0])
                ))}
                </>
            )
        },
        {
            title: t('Province'),
            dataIndex: 'province',
            render: province => <>{province.name}</>,
            filters: provinceFilter,
        },
        {
            title: t('Pickup Time'),
            dataIndex: 'pickup_at',
            render: pickup_at => <>{moment(parseInt(pickup_at)).format("HH:mm DD-MM-YYYY")}</>
        },
        {
            title: t('Price'),
            dataIndex: 'price',
            render: (price, request) => {
                let displayPrice;
                if (user.data.role === Roles.AGENCY) {
                    if (request.discount) {
                        displayPrice = price - (price / 100 * request.discount)
                        displayPrice = Math.round(displayPrice / 1000) * 1000;
                    } else {
                        displayPrice = price
                    }
                    
                } else if (user.data.role === Roles.HOST) {
                    displayPrice = request.base_price
                }
                return (
                    <>
                        {displayPrice.toLocaleString('it-IT', {style : 'currency', currency : 'VND'})}
                    </>
                )
            }
        },
        {
            title: t('Car Type'),
            dataIndex: 'car_type',
            render: car_type => <>{car_type.type} Seats</>,
            filters: carTypeFilter,
        },
        {
            title: t('Status'),
            dataIndex: 'status',
            render: status => {
                let color;
                let name;
                if (status === Status.REQUEST_NEW.id) {
                    color = 'green';
                    name  = Status.REQUEST_NEW.name;
                } else if (status === Status.REQUEST_CANCELED.id) {
                    color = 'volcano';
                    name  = Status.REQUEST_CANCELED.name;
                }
                return (
                    <>
                        <Tag color={color} key={name}>
                            {name.toUpperCase()}
                        </Tag>
                    </>
                )
            },
            filters: statusFilter
        },
        {
            title: t('Action'),
            dataIndex: '_id',
            render: (_id) => {
                return (
                    <>
                    <Space size="middle">
                        <Link to={`/requests/${_id}`}>{t("Detail")}</Link>
                    </Space>
                    </>
                )
            }
        },
    ];

    const handleTableChange = (pagination, filters, sorter) => {
        let key = (pagination.pageSize) * (pagination.current -1) + 1;
        getListRequests(pagination, filters, sorter, (res) => {
            if (res.requests) {
                res.requests.forEach(request => {
                    request.key = key++;
                });
    
                setData(res.requests);
                setPagination({ ...pagination, current: pagination.current, total: res.total });
            }
        });
    };

    useEffect(() => {
        if (user.data.role === Roles.AGENCY) {
            provinces.forEach(province => {
                setProvinceFilter(provinceFilter => [...provinceFilter, {text: province.name, value: province._id}]);
            });
    
            carTypes.forEach(carType => {
                setCarTypeFilter(carTypeFilter => [...carTypeFilter, {text: `${carType.type} Seats`, value: carType._id}]);
            });
    
            setStatusFilter([
                { text: Status.REQUEST_NEW.name, value: Status.REQUEST_NEW.id },
                { text: Status.REQUEST_CANCELED.name, value: Status.REQUEST_CANCELED.id },
            ]);
        } else if (user.data.role === Roles.HOST) {
            socket.getInstance(user.data._id, user.data.role).on("notification", (data) => {
                if (data.type && data.type == Notification.REQUEST) {
                    getListRequests(pagination, {}, {}, (res => {
                        if (res.requests) {
                            let key = 1;
                            res.requests.forEach(request => {
                                request.key = key++;
                            });
            
                            setData(res.requests);
                            setPagination({ ...pagination, total: res.total });
                        }
                    }));
                }
              })
        }

        getListRequests(pagination, {}, {}, (res => {
            if (res.requests) {
                let key = 1;
                res.requests.forEach(request => {
                    request.key = key++;
                });

                setData(res.requests);
                setPagination({ ...pagination, total: res.total });
            }
        }));
    }, [])

    return (
        <CRow>
            <CCol xs="12" md="12" className="mb-4">
                <CCard>
                    <CCardHeader>
                    {t("List Requests")}
                    </CCardHeader>
                    <CCardBody>
                        {(user.data.role === Roles.AGENCY) ? 
                            <Link to="/requests/create">
                                <Button type="primary" 
                                    style={{ marginBottom: 16 }} 
                                >
                                    {t("Create A New Request")}
                                </Button>
                            </Link>
                        : null}
                        
                        <Table
                            columns={columns} 
                            dataSource={data} 
                            pagination={pagination}
                            onChange={handleTableChange}
                        />
                    </CCardBody>
                </CCard>
            </CCol>
        </CRow>
    )
}

export default withNamespaces() (ListRequest)