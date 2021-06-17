import React, { useEffect, useState } from 'react';
import {
    CCol,
    CRow,
    CCard,
    CCardBody,
    CCardHeader
} from '@coreui/react';
import { Table, Tag, Space, notification } from 'antd';
import { Notification, Roles, Status, Type } from 'src/configs';
import { Link } from 'react-router-dom';
import moment from 'moment';
import { useSelector } from 'react-redux';
import { getListContracts } from 'src/services/contract';
import { withNamespaces } from 'react-i18next';
import socket from 'src/socket';

const ListContract = ({ t }) => {
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 100,
    });
    const [data, setData] = useState();
    const [provinceFilter, setProvinceFilter] = useState([]);
    const [statusFilter, setStatusFilter] = useState([]);

    const provinces = useSelector(state => state.provinces);
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
            dataIndex: 'request',
            render: request => <>{moment(parseInt(request.pickup_at)).format("HH:mm DD-MM-YYYY")}</>
        },
        {
            title: t('Price'),
            dataIndex: 'request',
            render: request => {
                let displayPrice;
                if (user.data.role === Roles.AGENCY) {
                    if (request.discount) {
                        displayPrice = request.price - (request.price / 100 * request.discount)
                        displayPrice = Math.round(displayPrice / 1000) * 1000;
                    } else {
                        displayPrice = request.price
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
            title: t('Driver\'s Name'),
            dataIndex: 'contract_driver',
            render: contract_driver => <>{contract_driver.name}</>
        },
        {
            title: t('Driver\'s Phone'),
            dataIndex: 'contract_driver',
            render: contract_driver => <>{contract_driver.phone}</>
        },
        {
            title: t('Status'),
            dataIndex: 'status',
            render: status => {
                let color;
                let name;
                if (status === Status.CONTRACT_NEW.id) {
                    color = 'green';
                    name  = Status.CONTRACT_NEW.name;
                } else if (status === Status.CONTRACT_DRIVER_START.id) {
                    color = 'yellow';
                    name  = Status.CONTRACT_DRIVER_START.name;
                } else if (status === Status.CONTRACT_DRIVER_FINISH.id) {
                    color = 'gold';
                    name  = Status.CONTRACT_DRIVER_FINISH.name;
                } else if (status === Status.CONTRACT_DONE.id) {
                    color = 'blue';
                    name  = Status.CONTRACT_DONE.name;
                } else if (status === Status.CONTRACT_CANCELED.id) {
                    color = 'volcano';
                    name  = Status.CONTRACT_CANCELED.name;
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
                        <Link to={`/contracts/${_id}`}>{t("Detail")}</Link>
                    </Space>
                    </>
                )
            }
        },
    ];

    const handleTableChange = (pagination, filters, sorter) => {
        let key = (pagination.pageSize) * (pagination.current -1) + 1;
        getListContracts(pagination, filters, sorter, (res) => {
            if (res.contracts) {
                res.contracts.forEach(contract => {
                    contract.key = key++;
                });
    
                setData(res.contracts);
                setPagination({ ...pagination, current: pagination.current, total: res.total });
            }
        });
    };

    useEffect(() => {
        if (user.data.role === Roles.AGENCY) {
            socket.getInstance(user.data._id, user.data.role).on("notification", (data) => {
                if (data.type === Notification.CONTRACT) {
                    getListContracts(pagination, {}, {}, (res => {
                        if (res.contracts) {
                            let key = 1;
                            res.contracts.forEach(contract => {
                                contract.key = key++;
                            });
                         
                            setData(res.contracts);
                            setPagination({ ...pagination, total: res.total });
                        } else {
                            notification.error({
                                message: t(`Notification`),
                                description: `${res.message}`,
                                placement: `bottomRight`,
                                duration: 1.5,
                            });
                        }
                    }));
                }
            })
        }

        provinces.forEach(province => {
            setProvinceFilter(provinceFilter => [...provinceFilter, {text: province.name, value: province._id}]);
        });

        setStatusFilter([
            { text: Status.CONTRACT_NEW.name, value: Status.CONTRACT_NEW.id },
            { text: Status.CONTRACT_DRIVER_START.name, value: Status.CONTRACT_DRIVER_START.id },
            { text: Status.CONTRACT_DRIVER_FINISH.name, value: Status.CONTRACT_DRIVER_FINISH.id },
            { text: Status.CONTRACT_DONE.name, value: Status.CONTRACT_DONE.id },
            { text: Status.CONTRACT_CANCELED.name, value: Status.CONTRACT_CANCELED.id },
        ]);

        getListContracts(pagination, {}, {}, (res => {
            if (res.contracts) {
                let key = 1;
                res.contracts.forEach(contract => {
                    contract.key = key++;
                });
             
                setData(res.contracts);
                setPagination({ ...pagination, total: res.total });
            } else {
                notification.error({
                    message: t(`Notification`),
                    description: `${res.message}`,
                    placement: `bottomRight`,
                    duration: 1.5,
                });
            }
        }));
    }, [])

    return (
        <CRow>
            <CCol xs="12" md="12" className="mb-4">
                <CCard>
                    <CCardHeader>
                    {t("List Contracts")}
                    </CCardHeader>
                    <CCardBody>
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

export default withNamespaces() (ListContract)