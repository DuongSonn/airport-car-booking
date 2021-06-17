import React, { useEffect, useState } from 'react';
import {
    CCol,
    CRow,
    CCard,
    CCardBody,
    CCardHeader
} from '@coreui/react';
import { Table, Space, Button, Modal, Form, Input, Select, notification, InputNumber } from 'antd';
import { useSelector } from 'react-redux';
import { createHostDetail, deleteHostDetail, getListDetails, updateHostDetail } from 'src/services/host';
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

const tailLayout = {
    wrapperCol: { offset: 8, span: 16 },
};

const { Option } = Select;

const ListHostDetail = ({ t }) => {
    const [form] = Form.useForm();

    const [data, setData] = useState([]);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
    });
    const [visible, setVisible] = useState(false);
    const [isUpdate, setIsUpdate] = useState(false);
    const [formTitle, setFormTitle] = useState(t("Add A New Working Province"));

    const carTypes = useSelector(state => state.carTypes);
    const provinces = useSelector(state => state.provinces);

    const columns = [
        {
            title: t('ID'),
            dataIndex: 'key',
        },
        {
            title: t('Car Type'),
            dataIndex: 'car_type',
            render: car_type => <>{car_type.type}&nbsp;{t("Seats")}</>
        },
        {
            title: t('Province'),
            dataIndex: 'province',
            render: province => <>{province.name}</>
        },
        {
            title: t('Quantity'),
            dataIndex: 'quantity',
        },
        {
            title: t('Action'),
            dataIndex: '_id',
            render: (_id) => (
                <>              
                    <Space size="middle">
                        <Button onClick={() => {
                            setFormData(_id);
                            setVisible(true);
                            setIsUpdate(true);
                            setFormTitle("Host's Working Province Detail");
                        }}>{t("Detail")}</Button>
                    </Space>
                </>
            )
        },
    ];

    useEffect(() => {
        getListDetails(pagination, (res) => {
            if (res.host_details) {
                let key = 1;
                res.host_details.forEach(host_detail => {
                    host_detail.key = key++;
                });

                setData(res.host_details);
                setPagination({ ...pagination, total: res.total });
            }
        })
    }, []);

    const onFinish = (values) => {
        let inputs = {
            car_type_id: values.car_type_id,
            province_id: values.province_id,
            quantity: values.quantity,
        }
        createHostDetail(inputs, res => {
            if (res.host_detail) {
                getListDetails(pagination, (res) => {
                    let key = 1;
                    res.host_details.forEach(host_detail => {
                        host_detail.key = key++;
                    });
        
                    setData(res.host_details);
                    setPagination({ ...pagination, total: res.total });
                });
                
                setVisible(false);

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
    };
    
    const onUpdate = () => {
        form.validateFields().then(values => {
            updateHostDetail(values, res => {
                if (res.host_detail) {
                    getListDetails(pagination, (res) => {
                        let key = 1;
                        res.host_details.forEach(host_detail => {
                            host_detail.key = key++;
                        });
            
                        setData(res.host_details);
                        setPagination({ ...pagination, total: res.total });
                    });

                    setVisible(false);

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

    const onDelete = () => {
        Modal.confirm({
            title: t(`Delete Host's Working Province`),
            icon: <ExclamationCircleOutlined />,
            content: t(`You are going to delete this province? Are you sure you want to do this? You can't reverse this`),
            onOk() {
                form.validateFields().then(values => {
                    deleteHostDetail(values, res => {
                        if (res.host_detail) {
                            getListDetails(pagination, (res) => {
                                let key = 1;
                                res.host_details.forEach(host_detail => {
                                    host_detail.key = key++;
                                });
                    
                                setData(res.host_details);
                                setPagination({ ...pagination, total: res.total });
                            });
        
                            setVisible(false);
        
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
                    description: t(`Stop delete working province`),
                    placement: `bottomRight`,
                    duration: 1.5,
                });
                setVisible(false);
            },
            centered: true,
        });
    }

    const handleTableChange = (pagination, filters, sorter) => {
        let key = (pagination.pageSize) * (pagination.current -1) + 1;
        getListDetails(pagination, (res) => {
            res.host_details.forEach(host_detail => {
                host_detail.key = key++;
            });

            setData(res.host_details);
            setPagination({ ...pagination, current: pagination.current, total: res.total });
        });
    };

    const setFormData = (_id) => {
        form.resetFields();
        let hostDetail = data.find(detail => detail._id === _id);
        form.setFieldsValue({
            _id: hostDetail._id,
            car_type_id: hostDetail.car_type_id,
            province_id: hostDetail.province_id,
            quantity: hostDetail.quantity,
        });
    }

    return (
        <CRow>
            <Modal
                centered
                visible={visible}
                title={formTitle}
                footer={null}
                onCancel={() => setVisible(false)}
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
                        name="car_type_id"
                        label={t("Car Type")}
                        rules={[
                            {
                                required: true,
                                message: t('Please select a car type!'),
                            },
                        ]}
                    >
                        <Select placeholder={t("Please select a car type")}>
                            {carTypes.map(carType => (
                                <Option value={carType._id} key={carType._id}>{carType.type}&nbsp;{("Seats")}</Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item
                        name="province_id"
                        label={t("Province")}
                        rules={[
                            {
                                required: true,
                                message: t('Please select a working province!'),
                            },
                        ]}
                    >
                        <Select placeholder={t("Please select a working province")}>
                            {provinces.map(province => (
                                <Option value={province._id} key={province._id}>{province.name}</Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item
                        name="quantity"
                        label={t("Quantity")}
                        rules={[
                            {
                                required: true,
                                message: t('Please enter the number of car!'),
                            },
                        ]}
                    >
                        <InputNumber min={0}/>
                    </Form.Item>
                    <Form.Item {...tailLayout}>
                        { isUpdate ?
                            <>
                                <Button type="primary" htmlType="button" onClick={() => onUpdate()} style={{ marginRight: '8px'}}>
                                    {t("Update")}
                                </Button>
                                <Button type="danger" htmlType="button" onClick={() => onDelete()} style={{ marginRight: '8px'}}>
                                    {t("Delete")}
                                </Button>
                            </>
                            : <Button type="primary" htmlType="submit" style={{ marginRight: '8px'}}>
                                {t("Create")}
                            </Button>
                        }
                        
                        <Button htmlType="button" onClick={() => setVisible(false)}>
                            {t("Cancel")}
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
            <CCol xs="12" md="12" className="mb-4">
                <CCard>
                    <CCardHeader>
                    {t("List Host's Working Provinces")}
                    </CCardHeader>
                    <CCardBody>
                        <Button type="primary" 
                            style={{ marginBottom: 16 }} 
                            onClick={() => {
                                setVisible(true);
                                setIsUpdate(false);
                                setFormTitle(t("Add A New Working Province"));
                                form.resetFields();
                            }}
                        >
                            {t("Add A New Working Province")}
                        </Button>
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

export default withNamespaces() (ListHostDetail)