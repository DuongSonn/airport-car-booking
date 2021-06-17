import { CCard, CCardBody, CCardHeader, CCol, CRow } from '@coreui/react';
import { Button, Space, Table, Tag, Modal, Form, Input, notification } from 'antd';
import { useForm } from 'antd/lib/form/Form';
import React, { useState, useEffect } from 'react'
import { withNamespaces } from 'react-i18next';
import { Status, Type } from 'src/configs';
import { confirmTransaction, getDriverTransaction } from 'src/services/transaction';

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

const ListDriverTransaction = ({ t }) => {
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
            title: t("Driver's Name"),
            dataIndex: 'type',
            render: (type, transaction) => {
                if (type === Type.DRIVER_WITHDRAW) {
                    return (
                        <>{transaction.sender.username}</>
                    )
                } else if (type === Type.DRIVER_RECHARGE) {
                    return (
                        <>{transaction.receiver.username}</>
                    )
                }
            }
        },
        {
            title: t("Driver's Phone"),
            dataIndex: 'type',
            render: (type, transaction) => {
                if (type === Type.DRIVER_WITHDRAW) {
                    return (
                        <>{transaction.sender.phone}</>
                    )
                } else if (type === Type.DRIVER_RECHARGE) {
                    return (
                        <>{transaction.receiver.phone}</>
                    )
                }
            }
        },
        {
            title: t("Amount"),
            dataIndex: 'type',
            render: (type, transaction) => {
                if (type === Type.DRIVER_WITHDRAW) {
                    return (
                        <>-{transaction.amount.toLocaleString('it-IT', {style : 'currency', currency : 'VND'})}</>
                    )
                } else if (type === Type.DRIVER_RECHARGE) {
                    return (
                        <>{transaction.amount.toLocaleString('it-IT', {style : 'currency', currency : 'VND'})}</>
                    )
                }
            } 
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
        getDriverTransaction(pagination, filters, sorter, (res) => {
            if (res.transactions) {
                res.transactions.forEach(transaction => {
                    transaction.key = key++;
                });
    
                setData(res.transactions);
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

        getDriverTransaction(pagination, {}, {}, (res => {
            if (res.transactions) {
                let key = 1;
                res.transactions.forEach(transaction => {
                    transaction.key = key++;
                });

                setData(res.transactions);
                setPagination({ ...pagination, total: res.total });
            }
        }));
    }, [])

    const setFormData = (_id) => {
        form.resetFields();
        let transactionDetail = data.find(detail => detail._id === _id);
        if (transactionDetail.type === Type.DRIVER_WITHDRAW) {
            form.setFieldsValue({
                id: transactionDetail._id,
                driver_name: transactionDetail.sender.username,
                driver_phone: transactionDetail.sender.phone,
                amount: (-transactionDetail.amount).toLocaleString('it-IT', {style : 'currency', currency : 'VND'}),
            });   
        } else if (transactionDetail.type === Type.DRIVER_RECHARGE) {
            form.setFieldsValue({
                id: transactionDetail._id,
                driver_name: transactionDetail.receiver.username,
                driver_phone: transactionDetail.receiver.phone,
                amount: transactionDetail.amount.toLocaleString('it-IT', {style : 'currency', currency : 'VND'}),
            });  
        }

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

                getDriverTransaction(pagination, {}, {}, (res => {
                    if (res.transactions) {
                        let key = 1;
                        res.transactions.forEach(transaction => {
                            transaction.key = key++;
                        });
        
                        setData(res.transactions);
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
                        name="driver_name"
                        label={t("Driver's Name")}
                    >
                        <Input disabled/>
                    </Form.Item>
                    <Form.Item
                        name="driver_phone"
                        label={t("Driver's Phone")}
                    >
                        <Input disabled/>
                    </Form.Item>
                    <Form.Item
                        name="amount"
                        label={t("Amount")}
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
                    {t("List Drivers' Transaction")}
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

export default withNamespaces() (ListDriverTransaction)