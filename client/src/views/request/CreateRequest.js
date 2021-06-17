import { CButton, CCard, CCardBody, CCardHeader, CCol, CCollapse, CRow } from '@coreui/react';
import React, { useEffect, useState } from 'react';
import { Form, Input, Button, Select, DatePicker, Modal, Radio, notification } from 'antd';
import { PlusOutlined, MinusCircleOutlined  } from '@ant-design/icons';
import moment from 'moment';
import Autocomplete from 'react-google-autocomplete';
import { useSelector } from 'react-redux';
import { Type } from 'src/configs';
import { calculateRequestPrice, createNewRequest } from 'src/services/request';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { withNamespaces } from 'react-i18next';
import { useHistory } from 'react-router';

const { Option } = Select;
const { TextArea } = Input;

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

const CreateRequest = ({ t }) => {
    const history = useHistory();

    const [form_to_airport] = Form.useForm();
    const [form_from_airport] = Form.useForm();

    const provinces = useSelector(state => state.provinces);
    const carTypes = useSelector(state => state.carTypes);
    const user = useSelector(state => state.user);

    const [accordion, setAccordion] = useState();
    const [otherPickup, setOtherPickup] = useState([]);
    const [otherDropOff, setOtherDropOff] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        form_to_airport.setFieldsValue({other_pickup_locations: otherPickup})
    }, [otherPickup]);

    useEffect(() => {
        form_from_airport.setFieldsValue({other_drop_off_locations: otherDropOff})
    }, [otherDropOff]);

    function disabledDate(current) {
        return current && current < moment().endOf('day');
    }

    function showConfirm(data) {
        let price = data.price - data.price * data.discount / 100;
        Modal.confirm({
            title: t(`Request's confirmation`),
            icon: <ExclamationCircleOutlined />,
            content: t(`Request's Price`
                , {price: price}),
            onOk() {
                createNewRequest(data, (res) => {
                    if (res.request) {
                        notification.success({
                            message: t(`Notification`),
                            description: `${res.message}`,
                            placement: `bottomRight`,
                            duration: 1.5,
                        });
    
                        form_from_airport.resetFields();
                        form_to_airport.resetFields();

                        history.push('/requests');
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
    };
    
    return (
        <>
            <CRow>
                <CCol xs="12" sm="6">
                    <CCard>
                        <CCardHeader id="to-airport">
                            <CButton 
                                block 
                                color="link" 
                                className="text-left m-0 p-0" 
                                onClick={() => setAccordion(accordion === 0 ? null : 0)}
                            >
                                <h5 className="m-0 p-0">{t("Create Request To Airport")}</h5>
                            </CButton>
                        </CCardHeader>
                        <CCollapse show={accordion === 0}>
                                <CCardBody>
                                    <Form
                                        form={form_to_airport}
                                        {...formItemLayout}
                                        onFinish={onFinish}
                                    >
                                        <Form.Item
                                            name="type"
                                            label="Type"
                                            initialValue={Type.TO_AIRPORT}
                                            hidden
                                        >
                                            <Input />
                                        </Form.Item>
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
                                                    form_to_airport.setFieldsValue({ pickup_location: place.formatted_address });
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
                                                                    setOtherPickup(form_to_airport.getFieldsValue().other_pickup_locations);
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
                                            label={t("Pickup Time")}
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
                                            initialValue={user.data.username}
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
                                            initialValue={user.data.phone}
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
                                        <Form.Item
                                            name="flight_no"
                                            label={t("Flight No")}
                                        >
                                            <Input />
                                        </Form.Item>
                                        <Form.Item
                                            name="note"
                                            label={t("Note")}
                                        >
                                            <TextArea />
                                        </Form.Item>
                                        <Form.Item>
                                            <Button type="primary" htmlType="submit" loading={loading}>
                                                {t("Create Request")}
                                            </Button>
                                        </Form.Item>
                                    </Form>
                                </CCardBody>
                        </CCollapse>
                    </CCard>
                </CCol>
                <CCol xs="12" sm="6">
                    <CCard>
                        <CCardHeader id="from-airport">
                            <CButton 
                                block 
                                color="link" 
                                className="text-left m-0 p-0" 
                                onClick={() => setAccordion(accordion === 1 ? null : 1)}
                            >
                                <h5 className="m-0 p-0">{t("Create Request Pickup From Airport")}</h5>
                            </CButton>
                        </CCardHeader>
                        <CCollapse show={accordion === 1}>
                            <CCardBody>
                                <Form
                                    form={form_from_airport}
                                    {...formItemLayout}
                                    onFinish={onFinish}
                                >
                                     <Form.Item
                                            name="type"
                                            label="Type"
                                            initialValue={Type.FROM_AIRPORT}
                                            hidden
                                        >
                                            <Input />
                                        </Form.Item>
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
                                                form_from_airport.setFieldsValue({ drop_off_location: place.formatted_address });
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
                                                                    message: t("Please input another location or delete this field!"),
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
                                                                setOtherDropOff(form_from_airport.getFieldsValue().other_drop_off_locations);
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
                                    <Form.Item
                                        name="pickup_time"
                                        label={t("Pickup Time")}
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
                                        initialValue={user.data.username}
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
                                        initialValue={user.data.phone}
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
                                    <Form.Item
                                        name="flight_no"
                                        label={t("Flight No")}
                                    >
                                        <Input />
                                    </Form.Item>
                                    <Form.Item
                                        name="note"
                                        label={t("Note")}
                                    >
                                        <TextArea />
                                    </Form.Item>
                                    <Form.Item>
                                        <Button type="primary" htmlType="submit" loading={loading}>
                                            {t("Create Request")}
                                        </Button>
                                    </Form.Item>
                                </Form>
                            </CCardBody>
                        </CCollapse>
                    </CCard>
                </CCol>
            </CRow>
        </>
    )
}

export default withNamespaces() (CreateRequest)