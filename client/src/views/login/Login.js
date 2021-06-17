import React, { useEffect, useState } from 'react'
import { Link, useHistory } from 'react-router-dom'
import {
  CCard,
  CCardBody,
  CCardGroup,
  CCol,
  CContainer,
  CRow
} from '@coreui/react'
import { Form, Input, Button, Checkbox, message, Radio } from 'antd';
import { PhoneOutlined, LockOutlined } from '@ant-design/icons';
import { Roles, Validate } from 'src/configs'
import { useDispatch, useSelector } from 'react-redux';
import { login } from 'src/actions/user';
import { storeUserData } from 'src/services/auth';
import i18n from 'src/services/i18n';
import { withNamespaces } from 'react-i18next';

var _ = require('lodash');

const Login = ({ t }) => {

  const dispatch = useDispatch();
  const user = useSelector(state => state.user);
  const history = useHistory();

  const [loading, setLoading] = useState(false);


  const onFinish = (values) => {
    setLoading(true);
    const loginThunk = login(values);
    dispatch(loginThunk);
  };
  
  useEffect(() => {
    setLoading(false);

    if (user.message) {
      message.error(user.message);
    } else if (!_.isEmpty(user.data)) {
      i18n.changeLanguage(user.data.language)

      storeUserData(user.data);
      if (user.data.role === Roles.AGENCY) {
        history.push('/requests/create');
      } else if (user.data.role === Roles.HOST) {
        history.push('/contracts');
      } else {
        history.push('/');
      }
    }
  }, [user]);

  return (
    <div className="c-app c-default-layout flex-row align-items-center">
      <CContainer>
        <CRow className="justify-content-center">
          <CCol md="8">
            <CCardGroup>
              <CCard className="p-4">
                <CCardBody>
                  <h1>{t("Login")}</h1>
                  <p>{t("Login to your account")}</p>
                  <Form
                    name="normal_login"
                    className="login-form"
                    initialValues={{
                      remember: true,
                    }}
                    onFinish={onFinish}
                  >
                    <Form.Item
                      name="phone"
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
                      <Input prefix={<PhoneOutlined className="site-form-item-icon" />} placeholder={t("Phone")} />
                    </Form.Item>
                    <Form.Item
                      name="password"
                      rules={[
                        {
                          required: true,
                          message: t("Please input your Password!"),
                        },
                      ]}
                    >
                      <Input
                        prefix={<LockOutlined className="site-form-item-icon" />}
                        type="password"
                        placeholder={t("Password")}
                      />
                    </Form.Item>
                    <Form.Item
                      name="role"
                    >
                       <Radio.Group>
                        <Radio value={Roles.AGENCY}>{Roles.AGENCY}</Radio>
                        <Radio value={Roles.HOST}>{Roles.HOST}</Radio>
                      </Radio.Group>
                    </Form.Item>
                    <Form.Item>
                      <Form.Item name="remember" valuePropName="checked" noStyle>
                        <Checkbox>{t("Remember me")}</Checkbox>
                      </Form.Item>

                      <Link className="login-form-forgot float-right" to="">
                        {t("Forgot password")}
                      </Link>
                    </Form.Item>

                    <Form.Item>
                      <Button type="primary" htmlType="submit" className="login-form-button" loading={loading}>
                        {t("Login")}
                      </Button>
                    </Form.Item>
                  </Form>
                </CCardBody>
              </CCard>
              <CCard className="text-white bg-primary py-5 d-md-down-none" style={{ width: '44%' }}>
                <CCardBody className="text-center">
                  <div>
                    <h2>{t("Sign up")}</h2>
                    <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut
                      labore et dolore magna aliqua.</p>
                    <Link to="/register">
                      <Button type="primary" className="mt-3" tabIndex={-1}>{t("Register Now!")}</Button>
                    </Link>
                  </div>
                </CCardBody>
              </CCard>
            </CCardGroup>
          </CCol>
        </CRow>
      </CContainer>
    </div>
  )
}

export default withNamespaces() (Login)
