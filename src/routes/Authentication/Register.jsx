import React, { useEffect, useState, useContext } from 'react'
import 'react-phone-number-input/style.css'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import * as Yup from 'yup'
import { useFormik } from 'formik'
import Swal from 'sweetalert2'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { completeRegistration } from '../../api/apiService'
import UserContext from '../../context/UserContext'

export default function Register() {
  const navigate = useNavigate()
  const location = useLocation()
  const [checked, setChecked] = useState(true)
  const [modal, setModal] = useState({ terms: false })

  const isPhoneVerified = !!location?.state?.number
  const isEmailVerified = !!location?.state?.email
  const { websiteLogo } = useContext(UserContext)

  const initialValues = {
    phone: location?.state?.number || '',
    name: location?.state?.name || '',
    email: location?.state?.email || '',
    password: '',
    registrationToken: location?.state?.registrationToken || '',
  }

  const validationSchema = Yup.object({
    name: Yup.string()
      .required('Please enter your name')
      .min(4, 'Name must be contains minimum 4 character'),
    email: isPhoneVerified
      ? Yup.string()
        .required('Please enter your email')
        .email('Please enter a valid email address')
      : Yup.string().email('Please enter a valid email address'),
    phone: isEmailVerified
      ? Yup.string().required('Please enter your mobile number')
      : Yup.string(),
    password: Yup.string()
      .required('Please enter your password')
      .min(6, 'Password must be at least 6 characters'),
  })

  const { values, errors, touched, handleBlur, handleChange, handleSubmit, isSubmitting } = useFormik({
    initialValues,
    validationSchema,
    onSubmit: async (values) => {
      try {
        const result = await completeRegistration(values)
        if (result.token) {
          localStorage.setItem('authToken', result.token)
          navigate('/')
        } else {
          Swal.fire({
            icon: 'error',
            title: '',
            text: result.message || 'Registration failed',
            footer: 'Alert by the NMH Gaming team',
            confirmButtonColor: '#FF0000',
          })
        }
      } catch (error) {
        console.log(error)
        Swal.fire({
          icon: 'error',
          title: '',
          text: 'Something went wrong, please try again later!',
          footer: 'Alert by the NMH Gaming team',
          confirmButtonColor: '#FF0000',
        })
      }
    },
  })

  useEffect(() => {
    document.title = 'NMH Gaming - Register'
    if (!location?.state?.number && !location?.state?.email) {
      navigate('/send-otp')
    }
  }, [])

  return (
    <>
      <div className='mainheaderFooter'>
        <Header />
      </div>
      <div className='mobile-wrapper'>
        <div className='nav-mobile'>
          <div className='container'>
            <div className='row'>
              <div className='col-12 d-flex align-items-center'>
                <Link to='/' className='login-back' type='button' aria-label='back navigation'>
                  <svg className='icon'>
                    <use href='#icon_backarrow'></use>
                  </svg>
                </Link>

                <Link to='/' className='mobile-logo mx-auto'>
                  <img src={websiteLogo} />
                </Link>
              </div>
            </div>
          </div>
        </div>

        <section className='wrapper-login'>
          <form className='login-form register' autoComplete='off' onSubmit={handleSubmit}>
            <h2 className='text-center'>Create Your Account</h2>

            <div className='pb-3'>
              <label htmlFor='Name' className='form-label input-label pb-md-1 mb-md-1 p-0 m-0'>
                Name
              </label>
              <input
                type='text'
                autoComplete='off'
                name='name'
                placeholder='Enter Your Name'
                value={values.name}
                onChange={handleChange}
                onBlur={handleBlur}
                id='Name'
                className={`form-control form-control-lg input-box ${!!errors.name && touched.name && 'is-invalid'}`}
              />
              {errors.name && touched.name && <div className='invalid-feedback'>{errors.name}</div>}
            </div>

            {isPhoneVerified && (
              <div className='pb-3'>
                <label htmlFor='Email' className='form-label input-label pb-md-1 mb-md-1 p-0 m-0'>
                  Email
                </label>
                <input
                  type='email'
                  autoComplete='off'
                  name='email'
                  placeholder='Enter Your Email'
                  value={values.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  id='Email'
                  className={`form-control form-control-lg input-box ${!!errors.email && touched.email && 'is-invalid'}`}
                />
                {errors.email && touched.email && <div className='invalid-feedback'>{errors.email}</div>}
              </div>
            )}

            {isEmailVerified && (
              <div className='pb-3'>
                <label htmlFor='Phone' className='form-label input-label pb-md-1 mb-md-1 p-0 m-0'>
                  Phone Number
                </label>
                <input
                  type='tel'
                  autoComplete='off'
                  name='phone'
                  placeholder='Enter Your Phone Number'
                  value={values.phone}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  id='Phone'
                  className={`form-control form-control-lg input-box ${!!errors.phone && touched.phone && 'is-invalid'}`}
                />
                {errors.phone && touched.phone && <div className='invalid-feedback'>{errors.phone}</div>}
              </div>
            )}

            <div className='pb-3'>
              <label htmlFor='Password' className='form-label input-label pb-md-1 mb-md-1 p-0 m-0'>
                Password
              </label>
              <input
                type='password'
                autoComplete='off'
                name='password'
                placeholder='Enter Your Password'
                value={values.password}
                onChange={handleChange}
                onBlur={handleBlur}
                id='Password'
                className={`form-control form-control-lg input-box ${!!errors.password && touched.password && 'is-invalid'}`}
              />
              {errors.password && touched.password && <div className='invalid-feedback'>{errors.password}</div>}
            </div>

            <div className='text-center condition'>
              By clicking “Create account”, you agree to our <Link to='/register'>Terms and Conditions</Link> and <Link to='/register'>Refund Policy</Link>.
            </div>

            <button className='btn btn-pay w-100' type='submit' disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <span className='spinner-border spinner-border-sm me-05' role='status' aria-hidden='true' />
                  Loading...
                </>
              ) : (
                'Create account'
              )}
            </button>
          </form>
        </section>

        <div className='footer-mobile'>
          <div className='container'>
            <div className='row'>
              <div className='col-12'>
                <div className='d-flex align-items-center justify-content-between terms-row'>
                  <Link to='/terms-conditions'>Terms and Conditions</Link>
                  <Link to='/privacy-policy'>Privacy Policy</Link>
                  <Link to='/refund-policy'>Refund Policy</Link>
                </div>

                <div className='d-flex align-items-center justify-content-center copy-right'>
                  Copyright © 2024 <Link to='/'>&nbsp; NMH Gaming</Link>. All Rights Reserved.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className='mainheaderFooter'>
        <Footer />
      </div>
    </>
  )
}
