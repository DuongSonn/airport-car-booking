import React, { useEffect, useState } from 'react'
import {
    CCol,
    CRow,
    CCard,
    CCardBody,
    CCardHeader
} from '@coreui/react';
import { Form, Input, Button, Select, Radio, notification } from 'antd';
import moment from 'moment';
import { getRequestDetail, updateRequestDetail } from 'src/services/request';
import { useHistory } from 'react-router';
import { Status, Type, Validate } from 'src/configs';
import { getListDrivers } from 'src/services/host';
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

const CreateContract = ({ match, t }) => {
    const [form] = Form.useForm();
    const history = useHistory();

    const [request, setRequest] = useState();
    const [listDrivers, setListDrivers] = useState([])
    const [formVisible, setFormVisible] = useState(false);
    const [isOutside, setIsOutside] = useState(false);
    
    useEffect(() => {
        getRequestDetail(match.params.id, (res) => {
            if (res.request) {
                setRequest(res.request);
            } else {
                history.push('/404');
            }
        });

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
    }, []);

    const onFinish = (values) => {
        let inputs = {};
        for (const property in values) {
            if (property !== 'status') {
                inputs[property] = values[property]
            }
        }

        inputs.status = Status.REQUEST_CONTRACT.id;
        inputs.id = request._id;

        updateRequestDetail(inputs, res => {
            if (res.request && res.contract) {
                notification.success({
                    message: t(`Notification`),
                    description: `${res.message}`,
                    placement: `bottomRight`,
                    duration: 1.5,
                });
                history.push(`/contracts/${res.contract._id}`);
            } else {
                notification.error({
                    message: t(`Notification`),
                    description: `${res.message}`,
                    placement: `bottomRight`,
                    duration: 1.5,
                });
            }
        });
    }

    const onChangeSelect = (value) => {
        let driverDetail = listDrivers.filter(driver => driver._id === value);
        setFormVisible(true);
        form.setFieldsValue({
            driver_name: driverDetail[0].user.username,
            driver_phone: driverDetail[0].user.phone,
            car_name: driverDetail[0].host_car.car_name,
            car_plate: driverDetail[0].host_car.car_plate,
        })
    }

    const onChangeForm = (data) => {
        setIsOutside(data.target.value);
        form.resetFields(['driver_name', 'driver_phone', 'car_name', 'car_plate', 'host_driver_id']);
    }

    return (
        <CRow>
            <CCol xs="12" md="7" className="mb-4">
                <CCard>
                    <CCardHeader>
                    {t("Request Detail")}
                    </CCardHeader>
                    <CCardBody>
                        {request ?
                            <Form
                                {...formItemLayout}
                                name="request_detail"
                            >   
                                {request.status === Status.REQUEST_CONTRACT.id ?
                                    <>
                                        <Form.Item
                                            name="name"
                                            label={t("Client's Name")}
                                        >
                                            <span className="ant-form-text">{request.request_customers.name}</span>
                                        </Form.Item>
                                        <Form.Item
                                            name="phone"
                                            label={t("Client's Phone")}
                                        >
                                            <span className="ant-form-text">{request.request_customers.phone}</span>
                                        </Form.Item>
                                    </>
                                    : null
                                }
                                <Form.Item
                                    name="payment_type"
                                    label={t("Payment Method")}
                                >
                                    <span className="ant-form-text">
                                        {
                                            (request.payment_type === Type.TRANSFER_MONEY ? t("Transfer money") : t("Pay in cash"))
                                        }
                                    </span>
                                </Form.Item>
                                { (request.payment_type === Type.TRANSFER_MONEY) ? 
                                    <Form.Item 
                                        name="payment_status" 
                                        label={t("Payment Status")}
                                    >
                                        {request.payment_status === Status.PAYMENT_DONE.id ?
                                            <span className="ant-form-text">{t("Payment Done")}</span>
                                        : <span className="ant-form-text">{t("Payment Not Done")}</span> }
                                    </Form.Item>
                                : null}
                                <Form.Item
                                    name="price"
                                    label={t("Price")}
                                >
                                    <span className="ant-form-text">
                                        {
                                            (request.base_price).toLocaleString('it-IT', {style : 'currency', currency : 'VND'})
                                        }
                                    </span>
                                </Form.Item>
                                <Form.Item
                                    name="car_type_id"
                                    label={t("Car Type")}
                                >
                                    <span className="ant-form-text">{request.car_type.type}&nbsp;{t("Seats")}</span>
                                </Form.Item>
                                <Form.Item
                                    name="province_id"
                                    label={t("Province")}
                                >
                                    <span className="ant-form-text">{request.province.name}</span>
                                </Form.Item>
                                <Form.Item
                                    name="pickup_locations"
                                    label={t("Pickup Location")}
                                >
                                    {request.request_destinations.map(request_destination => {
                                        if (request_destination.type === Type.PICKUP_LOCATION) {
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
                                            return null;
                                        }
                                    })}
                                </Form.Item>
                                <Form.Item
                                    name="drop_off_locations"
                                    label={t("Drop Off Location")}
                                >
                                    {request.request_destinations.map(request_destination => {
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
                                            return null;
                                        }
                                    })}
                                </Form.Item>
                                <Form.Item
                                    name="pickup_time"
                                    label={t("Pickup Time")}
                                >
                                    <span className="ant-form-text">{moment(parseInt(request.pickup_at)).format('HH:mm DD-MM-YYYY')}</span>
                                </Form.Item>
                                <Form.Item
                                    name="note"
                                    label={t("Note")}
                                >
                                    <span className="ant-form-text">{request.note}</span>
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
                        <Form
                            {...formItemLayout}
                            name="add_driver"
                            onFinish={onFinish}
                            initialValues={{
                                driver_type: formVisible
                            }}
                            form={form}
                        >
                            <Form.Item 
                                name="driver_type" 
                                label={t("Driver Type")}
                            >
                                <Radio.Group
                                    onChange={onChangeForm}
                                >
                                    <Radio value={false}>{t("Inside System")}</Radio>
                                    <Radio value={true}>{t("Outside System")}</Radio>
                                </Radio.Group>
                            </Form.Item>
                            {(isOutside) ? null 
                                : <Form.Item 
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
                                    >
                                        {listDrivers.map(driver => (
                                            <Option value={driver._id} key={driver._id}>{driver.user.username}</Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            }
                            {(formVisible || isOutside) ?
                                <>
                                    <Form.Item
                                        label={t("Driver's Name")}
                                        name="driver_name"
                                        rules={[{ 
                                            required: true, 
                                            message: t("Please enter the driver's name!")
                                        }]}
                                    >
                                        <Input disabled={!isOutside}/>
                                    </Form.Item>
                                    <Form.Item
                                        label={t("Driver's Phone")}
                                        name="driver_phone"
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
                                        <Input disabled={!isOutside}/>
                                    </Form.Item>
                                    <Form.Item
                                        label={t("Car's Name")}
                                        name="car_name"
                                        rules={[{ 
                                            required: true,
                                            message: t("Please enter the driver's car's name!")
                                        }]}
                                    >
                                        <Input disabled={!isOutside}/>
                                    </Form.Item>
                                    <Form.Item
                                        label={t("Car's Plate")}
                                        name="car_plate"
                                        rules={[{ 
                                            required: true,
                                            message: t("Please enter the driver's car's plate!")
                                        }]}
                                    >
                                        <Input disabled={!isOutside}/>
                                    </Form.Item>
                                </>
                                : null
                            }
                            <Form.Item {...formItemLayoutWithOutLabel}>
                                <Button type="primary" htmlType="submit">
                                    {t("Create Contract")}
                                </Button>
                            </Form.Item>
                        </Form>
                    </CCardBody>
                </CCard>
            </CCol>
        </CRow>
    )
}

export default withNamespaces() (CreateContract)