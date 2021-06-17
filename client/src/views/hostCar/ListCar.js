import React, { useEffect, useState } from 'react';
import {
    CCol,
    CRow,
    CCard,
    CCardBody,
    CCardHeader
} from '@coreui/react';
import { Table, Space, Button, Modal, Form, Input, Select, notification } from 'antd';
import { useSelector } from 'react-redux';
import { createHostCar, deleteHostCar, getListCars, updateHostCar } from 'src/services/host';
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

const ListCar = ({ t }) => {
    const [form] = Form.useForm();

    const [data, setData] = useState([]);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
    });
    const [visible, setVisible] = useState(false);
    const [isUpdate, setIsUpdate] = useState(false);
    const [formTitle, setFormTitle] = useState(t("Add A New Car"));

    const carTypes = useSelector(state => state.carTypes);

    const columns = [
        {
            title: t('ID'),
            dataIndex: 'key',
        },
        {
            title: t('Car Type'),
            dataIndex: 'car_type',
            render: car_type => <>{car_type.type} Seats</>
        },
        {
            title: t('Brand'),
            dataIndex: 'brand',
            
        },
        {
            title: t('Car\'s Plate'),
            dataIndex: 'car_plate',
        },
        {
            title: t('Car\'s Name'),
            dataIndex: 'car_name',
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
                            setFormTitle(t("Host's Car Detail"));
                        }}>{t("Detail")}</Button>
                    </Space>
                </>
            )
        },
    ];

    useEffect(() => {
        getListCars(pagination, (res) => {
            if (res.host_cars) {
                let key = 1;
                res.host_cars.forEach(host_car => {
                    host_car.key = key++;
                });

                setData(res.host_cars);
                setPagination({ ...pagination, total: res.total });
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
        let inputs = {
            car_type_id: values.car_type_id,
            brand: values.brand,
            car_plate: values.car_plate,
            car_name: values.car_name,
        }
        createHostCar(inputs, res => {
            if (res.host_car) {
                getListCars(pagination, (res) => {
                    if (res.host_cars) {
                        let key = 1;
                        res.host_cars.forEach(host_car => {
                            host_car.key = key++;
                        });
            
                        setData(res.host_cars);
                        setPagination({ ...pagination, total: res.total });
                    }
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
            updateHostCar(values, res => {
                if (res.host_car) {
                    getListCars(pagination, (res) => {
                        let key = 1;
                        res.host_cars.forEach(host_car => {
                            host_car.key = key++;
                        });
            
                        setData(res.host_cars);
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
            title: t(`Delete Host's Car`),
            icon: <ExclamationCircleOutlined />,
            content: t(`You are going to delete this car? Are you sure you want to do this? You can't reverse this`),
            onOk() {
                form.validateFields().then(values => {
                    deleteHostCar(values, res => {
                        if (res.host_car) {
                            getListCars(pagination, (res) => {
                                let key = 1;
                                res.host_cars.forEach(host_car => {
                                    host_car.key = key++;
                                });
                    
                                setData(res.host_cars);
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
                    description: t(`Stop delete car`),
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
        getListCars(pagination, (res) => {
            res.host_cars.forEach(host_car => {
                host_car.key = key++;
            });

            setData(res.host_cars);
            setPagination({ ...pagination, current: pagination.current, total: res.total });
        });
    };

    const setFormData = (_id) => {
        form.resetFields();
        let carDetail = data.find(detail => detail._id === _id);
        form.setFieldsValue({
            _id: carDetail._id,
            car_type_id: carDetail.car_type_id,
            brand: carDetail.brand,
            car_plate: carDetail.car_plate,
            car_name: carDetail.car_name,
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
                                <Option value={carType._id} key={carType._id}>{carType.type}&nbsp;{t("Seats")}</Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item
                        name="brand"
                        label={t("Car's Brand")}
                        rules={[
                            {
                                required: true,
                                message: t('Please enter the car\'s brand!'),
                            },
                        ]}
                    >
                        <Input placeholder={t("Please enter the car's brand")}/>
                    </Form.Item>
                    <Form.Item 
                        name="car_plate" 
                        label={t("Car's Plate")}
                        rules={[
                            {
                                required: true,
                                message: t('Please input the car\'s plate!'),
                            },
                        ]}
                    >
                            <Input placeholder={t("Please enter the car's plate")}/>
                    </Form.Item>
                    <Form.Item 
                        name="car_name" 
                        label={t("Car's Name")}
                        rules={[
                            {
                                required: true,
                                message: t('Please enter the car\'s name!'),
                            },
                        ]}
                    >
                            <Input placeholder={t("Please enter the car's name")}/>
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
                    {t("List Host's Cars")}
                    </CCardHeader>
                    <CCardBody>
                        <Button type="primary" 
                            style={{ marginBottom: 16 }} 
                            onClick={() => {
                                setVisible(true);
                                setIsUpdate(false);
                                setFormTitle(t("Add A New Car"));
                                form.resetFields();
                            }}
                        >
                            {t("Add A New Car")}
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

export default withNamespaces() (ListCar)