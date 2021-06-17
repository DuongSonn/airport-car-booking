import { CCard, CCardBody, CCardHeader, CCol, CRow } from '@coreui/react';
import { Button, Space, Table, Tag, Modal, Form, Input, notification } from 'antd';
import { useForm } from 'antd/lib/form/Form';
import moment from 'moment';
import React, { useState, useEffect } from 'react'
import { withNamespaces } from 'react-i18next';
import { Status } from 'src/configs';
import { confirmTransaction, getRequestTransaction } from 'src/services/transaction';

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

const ListRequestTransaction = ({ t }) => {
    const [form] = useForm();

    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 100,
    });
    const [data, setData] = useState();
    const [statusFilter, setStatusFilter] = useState([]);
    const [visible, setVisible] = useState(false);
    const [confirmBtn, setConfirmBtn] = useState(false);

    const columns = [
        {
            title: t('ID'),
            dataIndex: 'key',
        },
        {
            title: t("Client's Name"),
            dataIndex: 'request_customers',
            render: request_customers => <>{request_customers.name}</>
        },
        {
            title: t("Client's Phone"),
            dataIndex: 'request_customers',
            render: request_customers => <>{request_customers.phone}</>
        },
        {
            title: t("Amount"),
            dataIndex: 'amount',
            render: amount => <>{amount.toLocaleString('it-IT', {style : 'currency', currency : 'VND'})}</>
        },
        {
            title: t("Request's Link"),
            dataIndex: 'request',
            render: request => <>
                {process.env.REACT_APP_CHECK_REQUEST_URL}{request.code}
            </>
        },
        {
            title: t("Pickup Time"),
            dataIndex: 'request',
            render: request => <>
                {moment(parseInt(request.pickup_at)).format("HH:mm DD-MM-YYYY")}
            </>
        },
        {
            title: t("Status"),
            dataIndex: 'status',
            render: status => {
                let color;
                let name;
                if (status === Status.TRANSACTION_NEW.id) {
                    color = 'green';
                    name  = Status.TRANSACTION_NEW.name;
                } else if (status === Status.TRANSACTION_ERROR.id) {
                    color = 'volcano';
                    name  = Status.TRANSACTION_ERROR.name;
                } else if (status === Status.TRANSACTION_DONE.id) {
                    color = 'yellow';
                    name  = Status.TRANSACTION_DONE.name;
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
                        <Button onClick={() => setFormData(_id)}>{t("Detail")}</Button>
                    </Space>
                    </>
                )
            }
        },
    ];

    const handleTableChange = (pagination, filters, sorter) => {
        let key = (pagination.pageSize) * (pagination.current -1) + 1;
        getRequestTransaction(pagination, filters, sorter, (res) => {
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
        setStatusFilter([
            { text: Status.TRANSACTION_NEW.name, value: Status.TRANSACTION_NEW.id },
            { text: Status.TRANSACTION_DONE.name, value: Status.TRANSACTION_DONE.id },
            { text: Status.TRANSACTION_ERROR.name, value: Status.TRANSACTION_ERROR.id },
        ]);

        getRequestTransaction(pagination, {}, {}, (res => {
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

    const setFormData = (_id) => {
        form.resetFields();
        let transactionDetail = data.find(detail => detail._id === _id);
        form.setFieldsValue({
            id: transactionDetail._id,
            client_name: transactionDetail.request_customers.name,
            client_phone: transactionDetail.request_customers.phone,
            amount: transactionDetail.amount.toLocaleString('it-IT', {style : 'currency', currency : 'VND'}),
            request_link: transactionDetail.request.code,
        });

        if (transactionDetail.status === Status.TRANSACTION_NEW.id) {
            setConfirmBtn(true);
        }
        setVisible(true);
    }

    const onConfirm = () => {
        let id  = form.getFieldValue("id");
        confirmTransaction(id, res => {
            if (res.cash_flow) {
                notification.success({
                    message: t(`Notification`),
                    description: `${t("Confirm Transaction Successfully!")}`,
                    placement: `bottomRight`,
                    duration: 1.5,
                });

                form.setFieldsValue();
                setVisible(false);
                setConfirmBtn(false);

                getRequestTransaction(pagination, {}, {}, (res => {
                    if (res.requests) {
                        let key = 1;
                        res.requests.forEach(request => {
                            request.key = key++;
                        });
        
                        setData(res.requests);
                        setPagination({ ...pagination, total: res.total });
                    }
                }));
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
                visible={visible}
                title={t("Transaction Detail")}
                footer={null}
                onCancel={() => setVisible(false)}
            >
                <Form
                    form={form}
                    {...formItemLayout}
                >
                    <Form.Item
                        name="id"
                        hidden
                    >
                        <Input disabled />
                    </Form.Item>
                    <Form.Item
                        name="client_name"
                        label={t("Client's Name")}
                    >
                        <Input disabled/>
                    </Form.Item>
                    <Form.Item
                        name="client_phone"
                        label={t("Client's Phone")}
                    >
                        <Input disabled/>
                    </Form.Item>
                    <Form.Item
                        name="amount"
                        label={t("Amount")}
                    >
                        <Input disabled/>
                    </Form.Item>
                    <Form.Item
                        name="request_link"
                        label={t("Request's Link")}
                    >
                        <Input disabled/>
                    </Form.Item>
                    {confirmBtn ? 
                        <Form.Item
                            {...tailLayout}
                        >
                            <Button type="primary" onClick={onConfirm}>
                                {t("Confirm")}
                            </Button>
                        </Form.Item>
                    : null}
                </Form>
            </Modal>
            <CCol xs="12" md="12" className="mb-4">
                <CCard>
                    <CCardHeader>
                    {t("List Requests' Transaction")}
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

export default withNamespaces() (ListRequestTransaction);