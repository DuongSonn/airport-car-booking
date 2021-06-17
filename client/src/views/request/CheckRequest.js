import React, { useEffect, useState } from 'react'
import {
    CCard,
    CCardBody,
    CCardHeader,
    CCol,
    CContainer,
    CRow
} from '@coreui/react'
import { Form, notification } from 'antd';
import { Status, Type } from 'src/configs';
import moment from 'moment';
import { getRequestDetailByCode } from 'src/services/request';
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


const CheckRequest = ({ location, t }) => {
    const [request, setRequest] = useState();
    const [contract, setContract] = useState();

    useEffect(() => {
        let code = new URLSearchParams(location.search).get("code")
        getRequestDetailByCode(code, res => {
            if (res.request) {
                setRequest(res.request);
                if (res.contract) {
                    setContract(res.contract);
                }
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
        <div className="c-app c-default-layout flex-row align-items-center">
            <CContainer>
                <CRow className="justify-content-center">
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
                                        <Form.Item
                                            name="price"
                                            label={t("Price")}
                                        >
                                            <span className="ant-form-text">
                                                {displayPrice()}
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
                            {t("Other Info")}
                            </CCardHeader>
                            <CCardBody>
                                <Form
                                    {...formItemLayout}
                                    name="contract_detail"
                                > 
                                {(request && request.payment_type === Type.PAY_IN_CASH) ? 
                                    <Form.Item
                                        label={t("Payment Method")}
                                    >
                                        <span className="ant-form-text">{t("Pay in cash")}</span>
                                    </Form.Item>
                                    : (request && request.payment_type === Type.TRANSFER_MONEY && request.payment_status === Status.PAYMENT_DONE.id) ?
                                    <Form.Item
                                        label={t("Payment Method")}
                                    >
                                        <span className="ant-form-text">{t("Payment Done")}</span>
                                    </Form.Item>
                                    : <Form.Item
                                        label="Payment's Method"
                                    >
                                        <span className="ant-form-text">{t("Payment Not Done")}</span>
                                    </Form.Item>
                                }
                                
                                    <Form.Item
                                            label={t("Hotline")}
                                        >
                                            <span className="ant-form-text">{t("Mr Hieu - 0969559556")}</span>
                                    </Form.Item>

                                {contract && contract.contract_driver.length > 0 ?
                                    <>
                                        <Form.Item
                                            label={t("Driver's Info")}
                                        >
                                            <br></br>
                                            <Form.Item
                                                label={t("Driver's Name")}
                                            >
                                                <span className="ant-form-text">
                                                    {contract.contract_driver[0].name}
                                                </span> 
                                            </Form.Item>
                                            <Form.Item
                                                label={t("Driver's Phone")}
                                            >
                                                <span className="ant-form-text">
                                                    {contract.contract_driver[0].phone}
                                                </span> 
                                            </Form.Item>
                                            <Form.Item
                                                label={t("Car's Name")}
                                            >
                                                <span className="ant-form-text">
                                                    {contract.contract_driver[0].car_name}
                                                </span> 
                                            </Form.Item>
                                            <Form.Item
                                                label={t("Car's Plate")}
                                            >
                                                <span className="ant-form-text">
                                                    {contract.contract_driver[0].car_plate}
                                                </span> 
                                            </Form.Item>
                                        </Form.Item>
                                    </>
                                    : <Form.Item
                                        label="Driver's Info"
                                    >
                                        <span className="ant-form-text">{("No Driver's Info")}</span>
                                    </Form.Item>
                                }
                                </Form> 
                            </CCardBody>
                        </CCard>
                        <CCard>
                            <CCardHeader>
                            {t("Note")}
                            </CCardHeader>
                            <CCardBody>
                                <Form
                                    name="note"
                                    layout="vertical"
                                > 
                                    <Form.Item
                                        label={<label style={{ fontWeight: "bold" }}>
                                            Nội dung chuyển khoản (dành cho thanh toán chuyển khoản)
                                        </label>}
                                    >
                                        <span className="ant-form-text">
                                            Số điện thoại đặt hàng + số hiệu chuyến bay
                                        </span>
                                    </Form.Item>
                                    <Form.Item
                                        label={<label style={{ fontWeight: "bold" }}>
                                           Hotline hỗ trợ chăm sóc khách hàng 
                                        </label>}
                                    >
                                        <span className="ant-form-text">
                                            Mr Hiếu - 0987378533
                                        </span>
                                    </Form.Item>
                                    <Form.Item
                                        label={<label style={{ fontWeight: "bold" }}>
                                            Về chuyến đưa lên sân bay
                                        </label>}
                                    >
                                        <span className="ant-form-text">
                                            Các chuyến đón khách từ 4h tới 9h sáng, hệ thống sẽ có thông tin xe muộn nhất là 20h ngày hôm trước.
                                        </span>
                                        <span className="ant-form-text">
                                            Các khoảng thời gian đón khác trong ngày, hệ thống sẽ có thông tin xe trước 30' khi đón.
                                        </span>
                                    </Form.Item>
                                    <Form.Item
                                        label={<label style={{ fontWeight: "bold" }}>
                                            Về chuyến đón tại sân bay
                                        </label>}
                                    >
                                        <span className="ant-form-text">
                                            Hệ thống sẽ dựa theo thời gian hạ cánh của máy bay và thời gian khách hàng đi lấy hành lý (nếu có) để sắp xếp xe đưa đón phù hợp nhất. 
                                        </span>
                                        <span className="ant-form-text">
                                            Khi xuống sân bay, khách hàng mở link kiểm tra đơn hàng để check thông tin lái xe đưa đón, đồng thời chú ý điện thoại để lái xe có thể liên hệ với khách hàng.
                                        </span>
                                    </Form.Item>
                                </Form> 
                            </CCardBody>
                        </CCard>
                    </CCol>
                </CRow>
            </CContainer>
        </div>
    )
}

export default withNamespaces() (CheckRequest)