import React, { useState } from 'react'
import {
  CCard,
  CCardBody,
  CCol,
  CContainer,
  CRow
} from '@coreui/react'
import {
  Form,
  Input,
  Button,
  Radio,
  message,
} from 'antd';
import { Link, useHistory } from 'react-router-dom';
import { Roles, Validate } from 'src/configs';
import { register } from 'src/services/user';
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
const tailFormItemLayout = {
  wrapperCol: {
    xs: {
      span: 24,
      offset: 0,
    },
    sm: {
      span: 16,
      offset: 8,
    },
  },
};

const Register = ({ t, location }) => {
  const [form] = Form.useForm();

  const [loading, setLoading] = useState(false)

  const history = useHistory();

  const onFinish = (values) => {
    setLoading(true);

    let data = {
      username: values.nickname,
      phone: values.phone,
      email: values.email,
      password: values.password,
      confirm_password: values.confirm,
      language: "vi",
      role: values.role,
      promo_code: values.promo_code
    };

    register(data, res => {
      setLoading(false);

      if (res.user) {
        message.success(res.message);
        history.push('/login');
      } else {
        if (res.message) {
          message.error(res.message);
        } else if (res.errors) {
          message.error(res.errors[0].msg);
        }
      }
    })
  };

  return (
    <div className="c-app c-default-layout flex-row align-items-center">
      <CContainer>
        <CRow className="justify-content-center">
          <CCol md="9" lg="7" xl="6">
            <CCard className="mx-4">
              <CCardBody className="p-4">
              <Form
                {...formItemLayout}
                form={form}
                name="register"
                onFinish={onFinish}
                scrollToFirstError
              >
                <h1 className="text-center">{t("Register")}</h1>
                <p className="text-center">{t("Register your account")}</p>
                <Form.Item
                  name="phone"
                  label={t("Phone")}
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
                      },
                    },
                  ]}
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  name="email"
                  label={t("E-mail")}
                  rules={[
                    {
                      type: 'email',
                      message: t("The input is not valid E-mail!"),
                    },
                    {
                      required: true,
                      message: t("Please input your E-mail!"),
                    },
                  ]}
                >
                  <Input />
                </Form.Item>

                <Form.Item
                  name="password"
                  label={t("Password")}
                  rules={[
                    {
                      required: true,
                      message: t('Please input your password!'),
                    },
                  ]}
                  hasFeedback
                >
                  <Input.Password />
                </Form.Item>

                <Form.Item
                  name="confirm"
                  label={t("Confirm Password")}
                  dependencies={['password']}
                  hasFeedback
                  rules={[
                    {
                      required: true,
                      message: t('Please confirm your password!'),
                    },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('password') === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(new Error(t('The two passwords that you entered do not match!')));
                      },
                    }),
                  ]}
                >
                  <Input.Password />
                </Form.Item>

                <Form.Item
                  name="nickname"
                  label={
                    <span>
                      {t("Nickname")}&nbsp;
                    </span>
                  }
                  rules={[{ required: true, message: t('Please input your nickname!'), whitespace: true }]}
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  name="promo_code"
                  label={t("Promo Code")}
                  initialValue={new URLSearchParams(location.search).get("code")}
                >
                  <Input disabled={(new URLSearchParams(location.search).get("code")) ? true : false}/>
                </Form.Item>
                <Form.Item
                  name="role"
                  label={t("Role")}
                  rules={[{ required: true, message: t('Please select your type of account!') }]}
                >
                  <Radio.Group>
                    <Radio value={Roles.AGENCY}>{Roles.AGENCY}</Radio>
                    <Radio value={Roles.HOST}>{Roles.HOST}</Radio>
                  </Radio.Group>
                </Form.Item>
                <Form.Item {...tailFormItemLayout}>
                  <Button type="primary" htmlType="submit" style={{width: '100%'}} loading={loading}>
                    {t("Register")}
                  </Button>
                  {t("Or")} <Link to="/login">{t("login now!")}</Link>
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

export default withNamespaces() (Register)
