import React, { useEffect, useState } from 'react';
import {
    CCol,
    CRow,
    CCard,
    CCardBody,
    CCardHeader
} from '@coreui/react';
import { Form, Input, Button, Select, DatePicker, Modal, Radio, notification } from 'antd';
import { PlusOutlined, MinusCircleOutlined, ExclamationCircleOutlined  } from '@ant-design/icons';
import { Status, Type } from 'src/configs';
import { useSelector } from 'react-redux';
import Autocomplete from 'react-google-autocomplete';
import moment from 'moment';
import { cancelRequest, getRequestDetail, updateRequestDetail } from 'src/services/request';
import { useHistory } from 'react-router';
import { withNamespaces } from 'react-i18next';
import { calculateRequestPrice, createNewRequest } from 'src/services/request';

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

function disabledDate(current) {
    return current && current < moment().endOf('day');
}

const formItemLayoutWithOutLabel = {
    wrapperCol: {
        xs: { span: 24, offset: 0 },
        sm: { span: 24, offset: 8 },
    },
};

const { Option } = Select;
const { TextArea } = Input;

const AgencyRequestDetail = ({match, t}) => {
    const [form] = Form.useForm();

    const provinces = useSelector(state => state.provinces);
    const carTypes = useSelector(state => state.carTypes);

    const [otherPickup, setOtherPickup] = useState([]);
    const [otherDropOff, setOtherDropOff] = useState([]);
    const [request, setRequest] = useState();
    const [loading, setLoading] = useState(false);

    const history = useHistory();

    function showConfirm(data) {
        let price = data.price - data.price * data.discount / 100;
        Modal.confirm({
            title: t(`Request's confirmation`),
            icon: <ExclamationCircleOutlined />,
            content: t(`Request's Price`
                , {price: price}),
            onOk() {
                updateRequestDetail(data, (res) => {
                    if (res.request) {
                        notification.success({
                            message: t(`Notification`),
                            description: `${res.message}`,
                            placement: `bottomRight`,
                            duration: 1.5,
                        });

                        getRequestDetail(match.params.id, (res) => {
                            if (res.request) {
                                setRequest(res.request);
                                let pickup_time = moment(parseInt(res.request.pickup_at)).format('HH:mm DD-MM-YYYY');
                                form.setFieldsValue({
                                    name: res.request.request_customers.name,
                                    phone: res.request.request_customers.phone,
                                    payment_type: res.request.payment_type,
                                    note: res.request.note,
                                    airport: res.request.airport,
                                    car_type_id: res.request.car_type_id,
                                    province_id: res.request.province_id,
                                    pickup_time: moment(pickup_time, 'HH:mm DD-MM-YYYY'),
                                });
                
                                if (res.request.type === Type.TO_AIRPORT) {
                                    res.request.request_destinations.forEach(request_destination => {
                                        if (request_destination.type === Type.PICKUP_LOCATION) {
                                            form.setFieldsValue({
                                                pickup_location: request_destination.location[0]
                                            });
                
                                            let other_pickup_locations = request_destination.location.slice(1)
                                            form.setFieldsValue({
                                                other_pickup_locations: other_pickup_locations
                                            });
                                            setOtherPickup(other_pickup_locations);
                                        }
                                    });
                                    
                                } else if (res.request.type === Type.FROM_AIRPORT) {
                                    res.request.request_destinations.forEach(request_destination => {
                                        if (request_destination.type === Type.DROP_OFF_LOCATION) {
                                            form.setFieldsValue({
                                                drop_off_location: request_destination.location[0]
                                            });
                
                                            let other_drop_off_locations = request_destination.location.slice(1)
                                            form.setFieldsValue({
                                                other_drop_off_locations: other_drop_off_locations
                                            });
                                            setOtherDropOff(other_drop_off_locations);
                                        }
                                    });
                                }
                            } else {
                                history.push('/404');
                            }
                        })
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
                    description: `Canceled`,
                    placement: `bottomRight`,
                    duration: 1.5,
                });
            },
            centered: true,
        });
    }

    const onFinish = (values) => {
        setLoading(true);

        let pickup_locations = [];
        if (values.type === Type.TO_AIRPORT) {
            pickup_locations.push(values.pickup_location);
            if (values.other_pickup_locations) {
                values.other_pickup_locations.forEach(other_pickup_location => {
                    pickup_locations.push(other_pickup_location);
                });
            }
        } else {
            pickup_locations.push(values.airport);
        }
        

        let drop_off_locations = [];
        if (values.type === Type.FROM_AIRPORT) {
            drop_off_locations.push(values.drop_off_location);
            if (values.other_drop_off_locations) {
                values.other_drop_off_locations.forEach(other_drop_off_location => {
                    drop_off_locations.push(other_drop_off_location);
                });
            }
        } else {
            drop_off_locations.push(values.airport)
        }
        
        let note = '';
        if (values.flight_no) {
            note += values.flight_no;
            note += '\n';
        }
        if (values.note) {
            note += values.note;
        }

        let data = {
            id: values.id,
            type: values.type,
            airport: values.airport,
            car_type_id: values.car_type_id,
            pickup_time : new Date(values.pickup_time).getTime(),
            drop_off_locations: drop_off_locations,
            pickup_locations: pickup_locations,
            province_id: values.province_id,
            phone: values.phone,
            name: values.name,
            note: note,
            payment_type: values.payment_type,
        };

        calculateRequestPrice(data, (res) => {
            setLoading(false);

            if (res.price && res.price > 0) {
                data.price = res.price;
                data.discount = res.discount;
                data.user_id = res.user_id;
                showConfirm(data);
            } else if (res.message) {
                notification.error({
                    message: t(`Notification`),
                    description: `${res.message}`,
                    placement: `bottomRight`,
                    duration: 1.5,
                });
            }
        })
    }

    const handleDelete = () => {
        Modal.confirm({
            title: t(`Cancel Request`),
            icon: <ExclamationCircleOutlined />,
            content: t(`You are going to cancel this request? Are you sure you want to do this? You can't reverse this`),
            onOk() {
                cancelRequest(match.params.id, res => {
                    if (res.request) {
                        notification.success({
                            message: t(`Notification`),
                            description: `${res.message}`,
                            placement: `bottomRight`,
                            duration: 1.5,
                        });
                        setRequest(res.request);
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
                    description: t(`Stop cancel request`),
                    placement: `bottomRight`,
                    duration: 1.5,
                });
            },
            centered: true,
        });
    }

    useEffect(() => {
        getRequestDetail(match.params.id, (res) => {
            if (res.request) {
                setRequest(res.request);
                let pickup_time = moment(parseInt(res.request.pickup_at)).format('HH:mm DD-MM-YYYY');
                form.setFieldsValue({
                    name: res.request.request_customers.name,
                    phone: res.request.request_customers.phone,
                    payment_type: res.request.payment_type,
                    note: res.request.note,
                    airport: res.request.airport,
                    car_type_id: res.request.car_type_id,
                    province_id: res.request.province_id,
                    pickup_time: moment(pickup_time, 'HH:mm DD-MM-YYYY'),
                });

                if (res.request.type === Type.TO_AIRPORT) {
                    res.request.request_destinations.forEach(request_destination => {
                        if (request_destination.type === Type.PICKUP_LOCATION) {
                            form.setFieldsValue({
                                pickup_location: request_destination.location[0]
                            });

                            let other_pickup_locations = request_destination.location.slice(1)
                            form.setFieldsValue({
                                other_pickup_locations: other_pickup_locations
                            });
                            setOtherPickup(other_pickup_locations);
                        }
                    });
                    
                } else if (res.request.type === Type.FROM_AIRPORT) {
                    res.request.request_destinations.forEach(request_destination => {
                        if (request_destination.type === Type.DROP_OFF_LOCATION) {
                            form.setFieldsValue({
                                drop_off_location: request_destination.location[0]
                            });

                            let other_drop_off_locations = request_destination.location.slice(1)
                            form.setFieldsValue({
                                other_drop_off_locations: other_drop_off_locations
                            });
                            setOtherDropOff(other_drop_off_locations);
                        }
                    });
                }
            } else {
                history.push('/404');
            }
        })
    }, []);

    useEffect(() => {
        form.setFieldsValue({other_pickup_locations: otherPickup})
    }, [otherPickup]);

    useEffect(() => {
        form.setFieldsValue({other_drop_off_locations: otherDropOff})
    }, [otherDropOff]);

    const displayPrice = function() {
        let data;
        if (request) {
            if (request.discount) {
                data = request.price - (request.price / 100 * request.discount)
                data = Math.round(data / 1000) * 1000;
            } else {
                data = request.price
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
        <CCol xs="12" md="12" className="mb-4">
            <CCard>
                <CCardHeader>
                    {t("Request Detail")}
                </CCardHeader>
                <CCardBody>
                <Form
                    form={form}
                    {...formItemLayout}
                    onFinish={onFinish}
                >
                    {request ?
                        <> 
                            <Form.Item
                                name="type"
                                label="Type"
                                initialValue={request.type}
                                hidden
                            >
                                <Input />
                            </Form.Item>
                            <Form.Item
                                name="id"
                                label="Id"
                                initialValue={request._id}
                                hidden
                            >
                                <Input />
                            </Form.Item>
                            <Form.Item
                                label={t("Request's Link")}
                            >
                                <span className="ant-form-text">{process.env.REACT_APP_CHECK_REQUEST_URL}{request.code}</span>
                            </Form.Item>
                            <Form.Item
                                label={t("Price")}
                            >
                                <span className="ant-form-text">{displayPrice()}</span>
                            </Form.Item>
                        </>
                    : null}
                    
                    <Form.Item
                        name="car_type_id"
                        label={t("Car Type")}
                        rules={[
                            {
                                required: true,
                                message: t("Please select a car type!"),
                            },
                        ]}
                    >
                        <Select placeholder={t("Please select a car type")}>
                            {carTypes.map(carType => (
                                <Option value={carType._id} key={carType._id}>{carType.type}&nbsp;{t("Seats")}</Option>
                            ))}
                        </Select>
                    </Form.Item>
                    {(request && request.type === Type.TO_AIRPORT) ?
                        <>
                            <Form.Item
                                name="pickup_location"
                                label={t("Pickup Location")}
                                rules={[
                                    {
                                        required: true,
                                        message: t("Please input a pickup location!"),
                                    },
                                ]}
                            >
                                <Autocomplete
                                    className="ant-input"
                                    onPlaceSelected={(place) => {
                                        form.setFieldsValue({ pickup_location: place.formatted_address });
                                    }}
                                    types={['address']}
                                    componentRestrictions={{country: "vn"}}
                                />
                            </Form.Item>
                            <Form.List name="other_pickup_locations">
                                {(fields, { add, remove }, { errors }) => (
                                    <>
                                    {fields.map((field) => {
                                        return (
                                            <Form.Item
                                                {...formItemLayoutWithOutLabel}
                                                required={false}
                                                key={field.key}
                                            >
                                                <Form.Item
                                                    {...field}
                                                    validateTrigger={['onChange', 'onBlur']}
                                                    rules={[
                                                        {
                                                            required: true,
                                                            whitespace: true,
                                                            message: t("Please input another location or delete this field!"),
                                                        },
                                                    ]}
                                                    noStyle
                                                >
                                                    <Autocomplete
                                                        style={{width: '90%'}}
                                                        className="ant-input"
                                                        onPlaceSelected={(place) => {
                                                            setOtherPickup(otherPickup => [...otherPickup, place.formatted_address])
                                                        }}
                                                        types={['address']}
                                                        componentRestrictions={{country: "vn"}}
                                                    />
                                                </Form.Item>
                                                <MinusCircleOutlined
                                                    className="dynamic-delete-button"
                                                    onClick={() => {
                                                        remove(field.name)
                                                        setOtherPickup(form.getFieldsValue().other_pickup_locations);
                                                    }}
                                                />
                                            </Form.Item>
                                        )
                                    })}
                                    <Form.Item>
                                        <Button
                                            type="dashed"
                                            onClick={() => add()}
                                            style={{ float: "right" }}
                                            icon={<PlusOutlined />}
                                        >
                                            {t("Add another pickup location")}
                                        </Button>
                                        <Form.ErrorList errors={errors} />
                                    </Form.Item>
                                </>
                                )}
                            </Form.List>
                        </>
                        : <>
                            <Form.Item
                                name="drop_off_location"
                                label={t("Drop Off Location")}
                                rules={[
                                    {
                                        required: true,
                                        message: t("Please input a drop off location!"),
                                    },
                                ]}
                            >
                                <Autocomplete
                                    className="ant-input"
                                    onPlaceSelected={(place) => {
                                        form.setFieldsValue({ drop_off_location: place.formatted_address });
                                    }}
                                    types={['address']}
                                    componentRestrictions={{country: "vn"}}
                                />
                            </Form.Item>
                            <Form.List name="other_drop_off_locations">
                                {(fields, { add, remove }, { errors }) => (
                                    <>
                                    {fields.map((field) => {
                                        return (
                                            <Form.Item
                                                {...formItemLayoutWithOutLabel}
                                                required={false}
                                                key={field.key}
                                            >
                                                <Form.Item
                                                    {...field}
                                                    validateTrigger={['onChange', 'onBlur']}
                                                    rules={[
                                                        {
                                                            required: true,
                                                            whitespace: true,
                                                            message: t("Please input another location or delete this field."),
                                                        },
                                                    ]}
                                                    noStyle
                                                >
                                                    <Autocomplete
                                                        style={{width: '90%'}}
                                                        className="ant-input"
                                                        onPlaceSelected={(place) => {
                                                            setOtherDropOff(otherDropOff => [...otherDropOff, place.formatted_address])
                                                        }}
                                                        types={['address']}
                                                        componentRestrictions={{country: "vn"}}
                                                    />
                                                </Form.Item>
                                                <MinusCircleOutlined
                                                    className="dynamic-delete-button"
                                                    onClick={() => {
                                                        remove(field.name)
                                                        setOtherDropOff(form.getFieldsValue().other_drop_off_locations);
                                                    }}
                                                />
                                            </Form.Item>
                                        )
                                    })}
                                    <Form.Item>
                                        <Button
                                            type="dashed"
                                            onClick={() => add()}
                                            style={{ float: "right" }}
                                            icon={<PlusOutlined />}
                                        >
                                            {t("Add another drop off location")}
                                        </Button>
                                        <Form.ErrorList errors={errors} />
                                    </Form.Item>
                                </>
                                )}
                            </Form.List>
                        </>}
                    <Form.Item
                        name="province_id"
                        label={t("Province")}
                        rules={[
                            {
                                required: true,
                                message: t("Please select a province!"),
                            },
                        ]}
                    >
                        <Select placeholder={t("Please select a province")}>
                            {provinces.map(province => (
                                <Option value={province._id} key={province._id}>{province.name}</Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item
                        name="airport"
                        label={t("Airport")}
                        rules={[
                            {
                                required: true,
                                message: t("Please select an airport!"),
                            },
                        ]}
                    >
                        <Select placeholder={t("Please select an airport")}>
                            {provinces.map(province => (
                                province.airports.map(airport => (
                                    <Option value={airport}>{airport}</Option>
                                ))
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item
                        name="pickup_time"
                        label={t("Pickup Time",)}
                        rules={[
                            {
                                required: true,
                                message: t("Please choose a pickup time!"),
                            },
                        ]}
                    >
                        <DatePicker
                            style={{ width: '100%' }}
                            format="HH:mm DD-MM-YYYY"
                            disabledDate={disabledDate}
                            showTime={{ defaultValue: moment('00:00:00', 'HH:mm:ss') }}
                        />
                    </Form.Item>
                    <Form.Item
                        name="name"
                        label={t("Client's Name")}
                        rules={[
                            {
                                required: true,
                                message: t("Please enter the customer's name!"),
                            },
                        ]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="phone"
                        label={t("Client's Phone")}
                        rules={[
                            {
                                required: true,
                                message: t("Please enter the customer's phone number!"),
                            },
                        ]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item 
                        name="payment_type" 
                        label={t("Payment Method")}
                        rules={[
                            {
                                required: true,
                                message: t("Please select a payment method!"),
                            },
                        ]}
                    >
                        <Radio.Group>
                            <Radio value={Type.TRANSFER_MONEY}>{t("Transfer money")}</Radio>
                            <Radio value={Type.PAY_IN_CASH}>{t("Pay in cash")}</Radio>
                        </Radio.Group>
                    </Form.Item>
                    { (request && request.payment_type === Type.TRANSFER_MONEY) ? 
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
                        name="note"
                        label={t("Note")}
                    >
                        <TextArea />
                    </Form.Item>
                    {(request && request.status !== Status.REQUEST_CANCELED.id) ? 
                        <Form.Item
                            style={{
                                textAlign: 'right',
                            }}>
                            <Button type="primary" htmlType="submit" loading={loading}>{t("Update")}</Button>
                            <Button type="danger" 
                                    style={{
                                        margin: '0 8px',
                                    }}
                                    onClick={handleDelete}>
                                    {t("Delete")}
                                </Button>
                        </Form.Item>
                        : null}
                </Form>
                </CCardBody>
            </CCard>
        </CCol>
    </CRow>
    )
}

export default withNamespaces() (AgencyRequestDetail)