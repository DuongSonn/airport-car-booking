import React, { useEffect, useState } from 'react'
import {
    CCol,
    CRow,
    CCard,
    CCardBody,
    CCardHeader
} from '@coreui/react';
import { Form, Input, Button, Select, Modal, Radio, notification } from 'antd';
import moment from 'moment';
import { Roles, Status, Type, Validate } from 'src/configs';
import { getContractDetail, updateContract, updateContractDriver, deleteContract } from 'src/services/contract';
import { useSelector } from 'react-redux';
import { getListDrivers } from 'src/services/host';
import { ExclamationCircleOutlined  } from '@ant-design/icons';
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

const formItemLayoutWithOutLabel = {
    wrapperCol: {
        xs: { span: 24, offset: 0 },
        sm: { span: 24, offset: 8 },
    },
};

const { Option } = Select;

const ContractDetail = ({match, t}) => {
    const [form] = Form.useForm(); 

    const [contract, setContract] = useState();
    const [listDrivers, setListDrivers] = useState([]);
    const [isOutside, setIsOutside] = useState();


    const user = useSelector(state => state.user);

    useEffect(() => {
        getContractDetail(match.params.id, (res) => {
            if (res.contract) {
                setContract(res.contract);

                if (res.contract.contract_driver.length > 0) {
                    form.setFieldsValue({
                        id: res.contract.contract_driver[0]._id,
                        driver_name: res.contract.contract_driver[0].name,
                        driver_phone: res.contract.contract_driver[0].phone,
                        car_name: res.contract.contract_driver[0].car_name,
                        car_plate: res.contract.contract_driver[0].car_plate,
                    });
                }

                if (res.contract.driver_id) {
                    form.setFieldsValue({
                        driver_type: false,
                        host_driver_id: res.contract.host_driver[0]._id
                    });

                    setIsOutside(false);
                } else {
                    form.setFieldsValue({
                        driver_type: true
                    });

                    setIsOutside(true);
                }

            } else {
                notification.error({
                    message: t(`Notification`),
                    description: `${res.message}`,
                    placement: `bottomRight`,
                    duration: 1.5,
                });
            }
        });
        if (user.data.role === Roles.HOST) {
            getListDrivers({} , (res) => {
                if (res.host_drivers) {
                    setListDrivers(res.host_drivers);
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
    }, []);

    const onChangeSelect = (value) => {
        let driverDetail = listDrivers.filter(driver => driver._id === value);
        form.setFieldsValue({
            driver_name: driverDetail[0].user.username,
            driver_phone: driverDetail[0].user.phone,
            car_name: driverDetail[0].host_car.car_name,
            car_plate: driverDetail[0].host_car.car_plate,
        })
    }

    const onFinish = (values) => {
        let data;
        if (isOutside) {
            data = {
                car_name: values.car_name,
                car_plate: values.car_plate,
                name: values.driver_name,
                phone: values.driver_phone,
                id: values.id,
            }
        } else {
            data = {
                car_name: values.car_name,
                car_plate: values.car_plate,
                name: values.driver_name,
                phone: values.driver_phone,
                host_driver_id: values.host_driver_id,
                id: values.id,
            }
        }

        updateContractDriver(data, res => {
            if (res.contract_driver) {
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
    }

    const onCancelContract = () => {
        Modal.confirm({
            title: t(`Cancel Contract`),
            icon: <ExclamationCircleOutlined />,
            content: t(`You are going to cancel this contract? Are you sure you want to do this? You can't reverse this`),
            onOk() {
                deleteContract(match.params.id, res => {
                    if (res.contract) {
                        getContractDetail(match.params.id, (res) => {
                            if (res.contract) {
                                setContract(res.contract);
                                
                                if (res.contract.contract_driver.length > 0) {
                                    form.setFieldsValue({
                                        id: res.contract.contract_driver[0]._id,
                                        driver_name: res.contract.contract_driver[0].name,
                                        driver_phone: res.contract.contract_driver[0].phone,
                                        car_name: res.contract.contract_driver[0].car_name,
                                        car_plate: res.contract.contract_driver[0].car_plate,
                                    });
                                }
                
                                if (res.contract.driver_id) {
                                    form.setFieldsValue({
                                        driver_type: false,
                                        host_driver_id: res.contract.host_driver._id
                                    });
                
                                    setIsOutside(false);
                                } else {
                                    form.setFieldsValue({
                                        driver_type: true
                                    });
                
                                    setIsOutside(true);
                                }
                
                            } else {
                                notification.error({
                                    message: t(`Notification`),
                                    description: `${res.message}`,
                                    placement: `bottomRight`,
                                    duration: 1.5,
                                });
                            }
                        });
        
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
            },
            onCancel() {
                notification.info({
                    message: t(`Notification`),
                    description: t(`Stop cancel contract`),
                    placement: `bottomRight`,
                    duration: 1.5,
                });
            },
            centered: true,
        });
    }

    const onFinishContract = () => {
        let data = {
            id: match.params.id,
            status: Status.CONTRACT_DONE.id,
        };

        updateContract(data, res => {
            if (res.contract) {
                getContractDetail(match.params.id, (res) => {
                    if (res.contract) {
                        setContract(res.contract);

                        if (res.contract.contract_driver.length > 0) {
                            form.setFieldsValue({
                                id: res.contract.contract_driver[0]._id,
                                driver_name: res.contract.contract_driver[0].name,
                                driver_phone: res.contract.contract_driver[0].phone,
                                car_name: res.contract.contract_driver[0].car_name,
                                car_plate: res.contract.contract_driver[0].car_plate,
                            });
                        }
        
                        if (res.contract.driver_id) {
                            form.setFieldsValue({
                                driver_type: false,
                                host_driver_id: res.contract.host_driver._id
                            });
        
                            setIsOutside(false);
                        } else {
                            form.setFieldsValue({
                                driver_type: true
                            });
        
                            setIsOutside(true);
                        }
        
                    } else {
                        notification.error({
                            message: t(`Notification`),
                            description: `${res.message}`,
                            placement: `bottomRight`,
                            duration: 1.5,
                        });
                    }
                });

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
    }

    const displayPrice = function() {
        let data;
        if (contract && contract.request) {
            if (user.data.role === Roles.AGENCY) {
                if (contract.request.discount) {
                    data = contract.request.price - (contract.request.price / 100 * contract.request.discount)
                    data = Math.round(data / 1000) * 1000;
                } else {
                    data = contract.request.price
                }
            } else if (user.data.role === Roles.HOST) {
                data= contract.request.base_price
            }
            
            return (
                <span className="ant-form-text">
                    {data.toLocaleString('it-IT', {style : 'currency', currency : 'VND'})}
                </span>
            )
        }
    }

    return (
        <CRow>
            <CCol xs="12" md="7" className="mb-4">
                <CCard>
                    <CCardHeader>
                    {t("Request Detail")}
                    </CCardHeader>
                    <CCardBody>
                        {contract ?
                            <Form
                                {...formItemLayout}
                                name="request_detail"
                            >   
                                <>
                                    <Form.Item
                                        label={t("Request's Link")}
                                    >
                                        <span className="ant-form-text">{process.env.REACT_APP_CHECK_REQUEST_URL}{contract.request.code}</span>
                                    </Form.Item>
                                    <Form.Item
                                        label={t("Price")}
                                    >
                                        <span className="ant-form-text">{displayPrice()}</span>
                                    </Form.Item>
                                    <Form.Item
                                        label={t("Client's Name")}
                                    >
                                        <span className="ant-form-text">{contract.request_customers.name}</span>
                                    </Form.Item>
                                    <Form.Item
                                        label={t("Client's Phone")}
                                    >
                                        <span className="ant-form-text">{contract.request_customers.phone}</span>
                                    </Form.Item>
                                </>
                                <Form.Item
                                    label={t("Payment Method")}
                                >
                                    <span className="ant-form-text">
                                        {
                                            (contract.request.payment_type === Type.TRANSFER_MONEY ? t("Transfer money") : t("Pay in cash"))
                                        }
                                    </span>
                                </Form.Item>
                                { (contract.request.payment_type === Type.TRANSFER_MONEY) ? 
                                    <Form.Item 
                                        name="payment_status" 
                                        label={t("Payment Status")}
                                    >
                                        {contract.request.payment_status === Status.PAYMENT_DONE.id ?
                                            <span className="ant-form-text">{t("Payment Done")}</span>
                                        : <span className="ant-form-text">{t("Payment Not Done")}</span> }
                                    </Form.Item>
                                : null}
                                <Form.Item
                                    label={t("Car Type")}
                                >
                                    <span className="ant-form-text">{contract.car_type.type}&nbsp;{t("Seats")}</span>
                                </Form.Item>
                                <Form.Item
                                    label={t("Province")}
                                >
                                    <span className="ant-form-text">{contract.province.name}</span>
                                </Form.Item>
                                <Form.Item
                                    label={t("Pickup Location")}
                                >
                                    {contract.request_destinations.map(request_destination => {
                                        if (request_destination.type === Type.PICKUP_LOCATION) {
                                            return (
                                                <>
                                                    <span className="ant-form-text" key={request_destination._id}>
                                                        {request_destination.location}
                                                    </span>
                                                    <br/>
                                                </>
                                            )
                                        } else {
                                            return null
                                        }
                                    })}
                                </Form.Item>
                                <Form.Item
                                    label={t("Drop Off Location")}
                                >
                                    {contract.request_destinations.map(request_destination => {
                                        if (request_destination.type === Type.DROP_OFF_LOCATION) {
                                            return (
                                                request_destination.location.map(location => {
                                                    return (
                                                        <>
                                                            <span className="ant-form-text" key={request_destination._id}>
                                                                {location}
                                                            </span>
                                                            <br/>
                                                        </>
                                                    ) 
                                                })
                                            )
                                        } else {
                                            return null
                                        }
                                    })}
                                </Form.Item>
                                <Form.Item
                                    label={t("Pickup Time")}
                                >
                                    <span className="ant-form-text">{moment(parseInt(contract.request.pickup_at)).format('HH:mm DD-MM-YYYY')}</span>
                                </Form.Item>
                                <Form.Item
                                    label={t("Note")}
                                >
                                    <span className="ant-form-text">{contract.request.note}</span>
                                </Form.Item>
                            </Form> 
                            : null
                        }
                    </CCardBody>
                </CCard>
            </CCol>
            <CCol xs="12" md="5" className="mb-4">
                <CCard>
                    <CCardHeader>
                    {t("Driver's Info")}
                    </CCardHeader>
                    <CCardBody>
                        {(user.data.role === Roles.HOST) ?
                            <>
                                <Form
                                    {...formItemLayout}
                                    name="request_detail"
                                    form={form}
                                    onFinish={onFinish}
                                >   
                                    <>
                                        <Form.Item 
                                            name="driver_type" 
                                            label={t("Driver Type")}
                                        >
                                            <Radio.Group
                                                onChange={(data) => setIsOutside(data.target.value)}
                                                disabled={contract && contract.status !== Status.CONTRACT_NEW.id ? true : false }
                                            >
                                                <Radio value={false}>{t("Inside System")}</Radio>
                                                <Radio value={true}>{t("Outside System")}</Radio>
                                            </Radio.Group>
                                        </Form.Item>
                                        {(isOutside) ? null :
                                            <Form.Item 
                                                label={t("Select Driver" )}
                                                name="host_driver_id"
                                                rules={[{ 
                                                    required: true,
                                                    message: t('Please choose a driver!')
                                                }]}
                                            >
                                                <Select
                                                    showSearch
                                                    optionFilterProp="children"
                                                    filterOption={(input, option) => 
                                                        option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                                                    }
                                                    onChange={onChangeSelect}
                                                    disabled={contract && contract.status !== Status.CONTRACT_NEW.id ? true : false }
                                                >
                                                    {listDrivers.map(driver => (
                                                        <Option value={driver._id} key={driver._id}>{driver.user.username}</Option>
                                                    ))}
                                                </Select>
                                            </Form.Item>  
                                        }
                                        <Form.Item
                                            name="id"
                                            hidden
                                        >
                                            <Input />
                                        </Form.Item>
                                        <Form.Item
                                            name="driver_name"
                                            label={t("Driver's Name")}
                                            rules={[{ 
                                                required: true, 
                                                message: t("Please enter the driver's name!")
                                            }]}
                                        >
                                            <Input disabled={contract && contract.status !== Status.CONTRACT_NEW.id ? true : false } />
                                        </Form.Item>
                                        <Form.Item
                                            name="driver_phone"
                                            label={t("Driver's Phone")}
                                            rules={[{ validator: (_, value) => {
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
                                            }}]}
                                        >
                                            <Input disabled={contract && contract.status !== Status.CONTRACT_NEW.id ? true : false } />
                                        </Form.Item>
                                    </>
                                    <Form.Item
                                        name="car_name"
                                        label={t("Car's Name")}
                                        rules={[{ 
                                            required: true,
                                            message: t("Please enter the driver's car's name!")
                                        }]}
                                    >
                                        <Input disabled={contract && contract.status !== Status.CONTRACT_NEW.id ? true : false }/>
                                    </Form.Item>
                                    <Form.Item
                                        name="car_plate"
                                        label={t("Car's Plate")}
                                        rules={[{ 
                                            required: true,
                                            message: t("Please enter the driver's car's plate!")
                                        }]}
                                    >
                                        <Input disabled={contract && contract.status !== Status.CONTRACT_NEW.id ? true : false }/>
                                    </Form.Item>
                                    <Form.Item {...formItemLayoutWithOutLabel}>
                                        {(contract && contract.status === Status.CONTRACT_NEW.id) ?
                                            <>
                                                <Button type="primary" htmlType="submit" style={{ marginRight: '8px'}}>{t("Update")}</Button>
                                                <Button style={{ marginRight: '8px'}} onClick={onFinishContract}>{t("Finish")}</Button>
                                                <Button type="danger" onClick={onCancelContract}>{t("Cancel")}</Button>
                                            </>
                                        : null}
                                        {contract && (contract.status === Status.CONTRACT_DRIVER_FINISH.id || contract.status === Status.CONTRACT_DRIVER_START.id) ?
                                            <>
                                                <Button style={{ marginRight: '8px'}} onClick={onFinishContract}>{t("Finish")}</Button>
                                                <Button type="danger" onClick={onCancelContract}>{t("Cancel")}</Button>
                                            </>
                                        : null}
                                    </Form.Item>
                                </Form>
                            </>
                            : <Form
                                {...formItemLayout}
                            >   
                                {(contract && contract.contract_driver.length) > 0 ?
                                    <>
                                        <Form.Item
                                            name="driver_name"
                                            label={t("Driver's Name")}
                                        >
                                            <span className="ant-form-text">
                                                {contract.contract_driver[0].name}
                                            </span>
                                        </Form.Item>
                                        <Form.Item
                                            name="driver_phone"
                                            label={t("Driver's Phone")}
                                        >
                                            <span className="ant-form-text">
                                                {contract.contract_driver[0].phone}
                                            </span>
                                        </Form.Item>
                                        <Form.Item
                                            name="car_name"
                                            label={t("Car's Name")}
                                        >
                                            <span className="ant-form-text">
                                                {contract.contract_driver[0].car_name}
                                            </span>
                                        </Form.Item>
                                        <Form.Item
                                            name="car_plate"
                                            label={t("Car's Plate")}
                                        >
                                            <span className="ant-form-text">
                                                {contract.contract_driver[0].car_plate}
                                            </span>
                                        </Form.Item>
                                    </>
                                : t("No Driver's Info") }
                            </Form>
                        }
                    </CCardBody>
                </CCard>
            </CCol>
        </CRow>
    )
}

export default withNamespaces() (ContractDetail)