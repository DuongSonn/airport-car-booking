import React, { useEffect, useState } from 'react';
import {
    CCol,
    CRow,
    CCard,
    CCardBody,
    CCardHeader
} from '@coreui/react';
import { Table, Space, Button, Modal, Form, Input, notification, Tag, Typography, Select, Radio } from 'antd';
import { getListCars, getListDrivers, createHostDriver, deleteHostDriver, updateHostDriver, rechargeDriverAccount } from 'src/services/host';
import { ExclamationCircleOutlined  } from '@ant-design/icons';
import { Roles, Status, Type, Validate } from 'src/configs';
import { withNamespaces } from 'react-i18next';

const formItemLayout = {
    labelCol: {
        xs: { span: 24 },
        sm: { span: 8 },
    },
    wrapperCol: {
        xs: { span: 24 },
        sm: { span: 16 },
    },
};

const tailLayout = {
    wrapperCol: { offset: 8, span: 16 },
};

const { Link } = Typography;
const { Option } = Select;

const ListDriver = ({ t }) => {
    const [form] = Form.useForm();
    const [formCarDetail] = Form.useForm();

    const [dataDrivers, setDataDrivers] = useState([]);
    const [dataCars, setDataCars] = useState([]);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
    });
    const [carVisible, setCarVisible] = useState(false);
    const [driverVisible, setDriverVisible] = useState(false);
    const [rechargeVisible, setReChargeVisible] = useState(false);
    const [isUpdate, setIsUpdate] = useState(false);
    const [isActive, setIsActive] = useState(true);
    const [formTitle, setFormTitle] = useState(t("Add A New Driver"));

    const columns = [
        {
            title: t('ID'),
            dataIndex: 'key',
        },
        {
            title: t('Driver\'s Name'),
            dataIndex: 'user',
            render: user => <>{user.username}</>
        },
        {
            title: t('Driver\'s Phone'),
            dataIndex: 'user',
            render: user => <>{user.phone}</>
        },
        {
            title: t('Driver\'s License'),
            dataIndex: 'license',
        },
        {
            title: t('Driver\'s Wallet'),
            dataIndex: 'user',
            render: user => {
                if (user.wallet) {
                    return <>{user.wallet}</>
                } else {
                    return <>0 VND</>
                }
            }
        },
        {
            title: t('Driver\'s Car'),
            dataIndex: 'host_car',
            render: host_car => {
                return (
                    <>
                        <Link onClick={() => setCarData(host_car)}>
                            {host_car.car_name}
                        </Link>
                    </>
                )
            }
        },
        {
            title: t('Driver\'s Status'),
            dataIndex: 'status',
            render: status => {
                let color;
                let name;
                if (status === Status.DRIVER_PENDING.id) {
                    color = 'green';
                    name  = Status.DRIVER_PENDING.name;
                } else if (status === Status.DRIVER_GOING.id) {
                    color = 'blue';
                    name  = Status.DRIVER_GOING.name;
                } else if (status === Status.DRIVER_DEACTIVE.id) {
                    color = 'volcano';
                    name  = Status.DRIVER_DEACTIVE.name;
                }
                return (
                    <>
                        <Tag color={color} key={name}>
                            {name.toUpperCase()}
                        </Tag>
                    </>
                )
            }
        },
        {
            title: t('Action'),
            dataIndex: '_id',
            render: (_id) => (
                <>              
                    <Space size="middle">
                        <Button onClick={() => {
                            setFormData(_id);
                            setDriverVisible(true);
                            setIsUpdate(true);
                            setFormTitle(t("Host's Driver Detail"));
                        }}>{t("Detail")}</Button>
                    </Space>
                </>
            )
        },
    ];

    useEffect(() => {
        getListDrivers(pagination, res => {
            if (res.host_drivers) {
                console.log(res);
                let key = 1;
                res.host_drivers.forEach(host_driver => {
                    host_driver.key = key++;
                });

                setDataDrivers(res.host_drivers);
                setPagination({ ...pagination, total: res.total });
            }
        });

        getListCars({} , res => {
            if (res.host_cars) {
                setDataCars(res.host_cars);
            }
        })
    }, []);

    const handleTableChange = (pagination, filters, sorter) => {
        let key = (pagination.pageSize) * (pagination.current -1) + 1;
        getListDrivers(pagination, (res) => {
            res.host_drivers.forEach(host_driver => {
                host_driver.key = key++;
            });

            setDataDrivers(res.host_driver);
            setPagination({ ...pagination, current: pagination.current, total: res.total });
        });
    };

    const setCarData = (host_car) => {
        setCarVisible(true);
        let carDetail = dataDrivers.find(dataDriver => dataDriver.host_car_id === host_car._id);
        formCarDetail.setFieldsValue({
            car_type_id: `${carDetail.car_type.type} ${t("Seats")}`,
            car_name: carDetail.host_car.car_name,
            car_plate: carDetail.host_car.car_plate,
            brand: carDetail.host_car.brand,
        });
    }

    const setFormData = (_id) => {
        let driverDetail = dataDrivers.find(detail => detail._id === _id);
        if (driverDetail.status === Status.DRIVER_DEACTIVE.id) {
            setIsActive(false)
        } else {
            setIsActive(true)
        }

        form.resetFields();
        form.setFieldsValue({
            _id: driverDetail._id,
            username: driverDetail.user.username,
            phone: driverDetail.user.phone,
            license: driverDetail.license,
            host_car_id: driverDetail.host_car_id,
        });
    }

    const onFinish = (values) => {
        let data = {
            username: values.username,
            phone: values.phone,
            language: "vi",
            role: Roles.DRIVER,
            host_car_id: values.host_car_id,
            license: values.license
        }
        createHostDriver(data, (res => {
            if (res.host_driver) {
                getListDrivers(pagination, res => {
                    let key = 1;
                    res.host_drivers.forEach(host_driver => {
                        host_driver.key = key++;
                    });
        
                    setDataDrivers(res.host_drivers);
                    setPagination({ ...pagination, total: res.total });
                });

                setDriverVisible(false);

                notification.success({
                    message: t(`Notification`),
                    description: `${res.message}`,
                    placement: `bottomRight`,
                    duration: 1.5,
                });
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

    const onDelete = () => {
        Modal.confirm({
            title: t(`Delete Host's Driver`),
            icon: <ExclamationCircleOutlined />,
            content: t(`You are going to delete this driver and his account? Are you sure you want to do this? You can't reverse this`),
            onOk() {
                form.validateFields().then(values => {
                    deleteHostDriver(values, res => {
                        if (res.host_driver) {
                            getListDrivers(pagination, res => {
                                let key = 1;
                                res.host_drivers.forEach(host_driver => {
                                    host_driver.key = key++;
                                });
                    
                                setDataDrivers(res.host_drivers);
                                setPagination({ ...pagination, total: res.total });
                            });
        
                            setDriverVisible(false);
        
                            notification.success({
                                message: t(`Notification`),
                                description: `${res.message}`,
                                placement: `bottomRight`,
                                duration: 1.5,
                            });
                        } else {
                            notification.error({
                                message: t(`Notification`),
                                description: `${res.message}`,
                                placement: `bottomRight`,
                                duration: 1.5,
                            });
                        }
                    })
                })
            },
            onCancel() {
                notification.info({
                    message: t(`Notification`),
                    description: t(`Stop delete host's driver`),
                    placement: `bottomRight`,
                    duration: 1.5,
                });
                setDriverVisible(false);
            },
            centered: true,
        });
    }

    const onUpdate = () => {
        form.validateFields().then(values => {
            updateHostDriver(values, res => {
                if (res.host_driver) {
                    getListDrivers(pagination, res => {
                        let key = 1;
                        res.host_drivers.forEach(host_driver => {
                            host_driver.key = key++;
                        });
            
                        setDataDrivers(res.host_drivers);
                        setPagination({ ...pagination, total: res.total });
                    });

                    setDriverVisible(false);

                    notification.success({
                        message: t(`Notification`),
                        description: `${res.message}`,
                        placement: `bottomRight`,
                        duration: 1.5,
                    });
                } else {
                    notification.error({
                        message: t(`Notification`),
                        description: `${res.message}`,
                        placement: `bottomRight`,
                        duration: 1.5,
                    });
                }
            })
        })
    }

    const checkAmount = (_, value) => {
        if (value < 1000) {
            return Promise.reject(new Error(t('Amount must be greater than 1 thousand VND!')));
        } else {
            if (!Number.isInteger(value / 1000))
                return Promise.reject(new Error(t('Invalid amount of money!')));

            return Promise.resolve();
        }     
    };

    const onFinishRecharge = (values) => {
        let driverDetail = dataDrivers.find(detail => detail._id === form.getFieldValue('_id'));

        let data = {
            driver_id: driverDetail.user_id,
            type: values.type,
            amount: values.amount
        }

        rechargeDriverAccount(data, res => {
            let message;
            if (values.type === Type.DRIVER_RECHARGE) {
                message = t('Recharge Account')
            } else if (values.type === Type.DRIVER_WITHDRAW) {
                message = t('Withdraw Money')
            }

            if (res.cash_flow) {
                notification.success({
                    message: t(`Notification`),
                    description: `${t("Recharge Request", {message: message})}`,
                    placement: `bottomRight`,
                    duration: 1.5,
                });

                setReChargeVisible(false);
            } else {
                notification.error({
                    message: t(`Notification`),
                    description: `${res.message}`,
                    placement: `bottomRight`,
                    duration: 1.5,
                });
            }
        })
    }

    return (
        <CRow>
            <Modal
                centered
                visible={carVisible}
                title={t("Driver's Car Detail")}
                footer={null}
                onCancel={() => setCarVisible(false)}
            >
                <Form
                    {...formItemLayout}
                    form={formCarDetail}
                >   
                    <Form.Item
                        name="car_type_id"
                        label={t("Car Type")}
                    >
                        <Input disabled/>
                    </Form.Item>
                    <Form.Item
                        name="brand"
                        label={t("Car's Brand")}
                    >
                        <Input disabled/>
                    </Form.Item>
                    <Form.Item 
                        name="car_plate" 
                        label={t("Car's Plate")}
                    >
                            <Input disabled/>
                    </Form.Item>
                    <Form.Item 
                        name="car_name" 
                        label={t("Car's Name")}
                    >
                            <Input disabled/>
                    </Form.Item>
                </Form>
            </Modal>
            <Modal
                centered
                visible={driverVisible}
                title={formTitle}
                footer={null}
                onCancel={() => setDriverVisible(false)}
            >
                <Form
                    form={form}
                    {...formItemLayout}
                    name="form_in_modal"
                    onFinish={onFinish}
                >   
                    <Form.Item
                        name="_id"
                        hidden
                    >
                        <Input/>
                    </Form.Item>
                    <Form.Item
                        name="username"
                        label={t("Driver's Name")}
                        rules={[
                            {
                                required: true,
                                message: t('Please enter the driver\'s name!'),
                            },
                        ]}
                    >
                        <Input placeholder={t("Please enter the driver's name")}/>
                    </Form.Item>
                    <Form.Item 
                        name="phone" 
                        label={t("Driver's Phone")}
                        rules={[
                            {
                                validator: (_, value) => {
                                    if (value) {
                                      let regex_phone = new RegExp(Validate.REGEX_PHONE);
                                      if (regex_phone.test(value)) {
                                        return Promise.resolve();
                                      } else {
                                        return Promise.reject(new Error(t('Please enter a valid phone number!')));
                                      }
                                    } else {
                                      return Promise.reject(new Error(t('Please input a phone number!')));
                                    }
                                }
                            },
                        ]}
                    >
                            <Input placeholder={t("Please enter the driver's phone")}/>
                    </Form.Item>
                    <Form.Item 
                        name="license" 
                        label={t("Driver's License")}
                        rules={[
                            {
                                required: true,
                                message: t('Please enter the driver\'s license'),
                            },
                        ]}
                    >
                            <Input placeholder={t("Please enter the driver's license")}/>
                    </Form.Item>
                    <Form.Item
                        name="host_car_id"
                        label={t("Driver's Car")}
                        rules={[
                            { 
                                required: true, 
                                message: t('Please select a car!') 
                            }
                        ]}
                    >
                        <Select placeholder={t("Please select a car")}
                            showSearch
                            optionFilterProp="children"
                            filterOption={(input, option) => 
                                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                            }
                        >
                            {dataCars.map(dataCar => {
                                let option = `${dataCar.car_name}-${dataCar.car_plate}`
                                 return (
                                    <Option value={dataCar._id} key={dataCar._id}>{option}</Option>
                                )
                            })}
                        </Select>
                    </Form.Item>
                    <Form.Item {...tailLayout}>
                        { isUpdate ?
                            <>
                            {
                                isActive ?
                                    <>
                                        <Button type="primary" htmlType="button" onClick={() => onUpdate()} style={ { marginRight: '8px'}}>
                                            {t("Update")}
                                        </Button>
                                        <Button type="danger" htmlType="button" onClick={() => onDelete()} style={{ marginRight: '8px'}}>
                                            {t("Delete")}
                                        </Button>
                                        <Button htmlType="button" 
                                            onClick={() => {
                                                    setDriverVisible(false);
                                                    setReChargeVisible(true)
                                                }
                                            } 
                                            style={{ marginRight: '8px'}}>
                                            {t("Recharge Account")}
                                        </Button>                                        
                                    </>
                                : null
                            }
                            </>
                            : <Button type="primary" htmlType="submit" style={{ marginRight: '8px'}}>
                                {t("Create")}
                            </Button>
                        }
                    </Form.Item>
                </Form>
            </Modal>
            <Modal
                centered
                visible={rechargeVisible}
                title={t("Recharge Account")}
                footer={null}
                onCancel={() => setReChargeVisible(false)}
            >
                <Form
                    {...formItemLayout}
                    onFinish={onFinishRecharge}
                >   
                    <Form.Item 
                        name="type" 
                        label={t("Action")} 
                        initialValue={Type.DRIVER_RECHARGE}
                        rules={[
                            {
                                required: true,
                                message: t('Please select an action!')
                            }
                        ]}
                    >
                        <Radio.Group>
                            <Radio value={Type.DRIVER_RECHARGE}>{t("Recharge Account")}</Radio>
                            <Radio value={Type.DRIVER_WITHDRAW}>{t("Withdraw Money")}</Radio>
                        </Radio.Group>
                    </Form.Item>
                    <Form.Item
                        name="amount"
                        label={t("Amount")}
                        rules={[
                            {
                                validator: checkAmount,
                            },
                        ]}
                    >
                        <span>
                            <Input
                                type="text"
                                style={{
                                    width: 100,
                                }}
                            />
                            <Input 
                                disabled={true}
                                value="VND"
                                style={{
                                    width: 80,
                                    margin: '0 8px',
                                }}
                            />
                        </span>
                    </Form.Item>
                    <Form.Item {...tailLayout}>
                        <Button type="primary" htmlType="submit">
                            {t("Submit")}
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
            <CCol xs="12" md="12" className="mb-4">
                <CCard>
                    <CCardHeader>
                    {t("List Host's Drivers")}
                    </CCardHeader>
                    <CCardBody>
                        <Button type="primary" 
                            style={{ marginBottom: 16 }} 
                            onClick={() => {
                                setDriverVisible(true);
                                setIsUpdate(false);
                                setFormTitle(t("Add A New Driver"));
                                form.resetFields();
                            }}
                        >
                            {t("Add A New Driver")}
                        </Button>
                        <Table 
                            columns={columns} 
                            dataSource={dataDrivers} 
                            pagination={pagination}
                            onChange={handleTableChange}
                        />
                    </CCardBody>
                </CCard>
            </CCol>
        </CRow>
    )
}

export default  withNamespaces() (ListDriver)