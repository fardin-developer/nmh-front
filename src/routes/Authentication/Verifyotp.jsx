import { Link, useLocation, useNavigate } from 'react-router-dom'
import React, { useEffect, useRef, useState, createRef, useContext } from 'react'
import { verifyotpSchema } from '../../models'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { useFormik } from 'formik'
import Swal from 'sweetalert2'
import { verifyOtp, sendOtp } from '../../api/apiService'
import UserContext from '../../context/UserContext'

const initialValues = {
  otp: '',
}

export default function Verifyotp() {
  const [otp, setOtp] = useState(Array(6).fill(''))
  const otpInputRefs = useRef(Array(6)
    .fill(0)
    .map(() => createRef())).current

  const navigate = useNavigate()
  const location = useLocation()
  const [loading, setLoading] = useState(false)
  const authIdentifier = location?.state?.email || location?.state?.number
  const { websiteLogo } = useContext(UserContext)

  useEffect(() => {
    document.title = 'NMH Gaming - Verify'
    if (localStorage.getItem('authToken')) {
      navigate('/')
    } else if (!authIdentifier) {
      navigate('/send-otp')
    }
    // eslint-disable-next-line
  }, [])

  const { values, setValues, errors, touched, handleBlur, handleSubmit, isSubmitting } = useFormik({
    initialValues,
    validationSchema: verifyotpSchema,
    onSubmit: async (values) => {
      try {
        const result = await verifyOtp(authIdentifier, values.otp)
        if (result.requiresRegistration || result.isNewUser) {
          navigate('/register', {
            replace: false,
            state: {
              name: result.user?.name || '',
              number: result.phone || location?.state?.number,
              email: result.email || location?.state?.email,
              registrationToken: result.registrationToken,
            },
          })
        } else if (result.token) {
          localStorage.setItem('authToken', result.token)
          navigate('/')
        } else {
          Swal.fire({
            icon: 'error',
            title: '',
            text: result.message || 'Invalid OTP. Please try again.',
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

  const reSendOtp = async () => {
    try {
      setLoading(true)
      const result = await sendOtp(authIdentifier)
      setLoading(false)
      if (result.message) {
        Swal.fire({
          icon: 'success',
          title: '',
          text: result.message,
          footer: 'Alert by the NMH Gaming team',
          confirmButtonColor: '#FF0000',
        })
      } else {
        Swal.fire({
          icon: 'error',
          title: '',
          text: result.message || 'Failed to resend OTP.',
          footer: 'Alert by the NMH Gaming team',
          confirmButtonColor: '#FF0000',
        })
      }
    } catch (error) {
      setLoading(false)
      console.log(error)
      Swal.fire({
        icon: 'error',
        title: '',
        text: 'Something went wrong, please try again later!',
        footer: 'Alert by the NMH Gaming team',
        confirmButtonColor: '#FF0000',
      })
    }
  }

  const handleOtpValueChange = (otpArr) => {
    setOtp(otpArr)
    const otpValue = otpArr.join('')
    setValues({ ...values, otp: otpValue })
    if (otpValue.length === 6 && !isSubmitting) {
      handleSubmit()
    }
  }

  const handleInputChange = (e, index) => {
    const rawValue = e.target.value.replace(/\D/g, '')

    if (!rawValue) {
      const otpArr = [...otp.slice(0, index), '', ...otp.slice(index + 1)]
      handleOtpValueChange(otpArr)
      return
    }

    // Mobile OTP autofill and manual paste often provide all digits at once.
    if (rawValue.length > 1) {
      const digits = rawValue.slice(0, otpInputRefs.length - index).split('')
      const otpArr = [...otp]
      digits.forEach((digit, digitIndex) => {
        otpArr[index + digitIndex] = digit
      })
      handleOtpValueChange(otpArr)

      const nextIndex = Math.min(index + digits.length, otpInputRefs.length - 1)
      otpInputRefs[nextIndex].current.focus()
      return
    }

    const otpArr = [...otp.slice(0, index), rawValue, ...otp.slice(index + 1)]
    handleOtpValueChange(otpArr)

    if (index < otpInputRefs.length - 1) {
      otpInputRefs[index + 1].current.focus()
    }
  }

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs[index - 1].current.focus()
    }
  }

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
                <Link to={-1} className='login-back' type='button' aria-label='back navigation'>
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

        <section className='wrapper wrapper-login'>
          <form className='login-form' autoComplete='on' onSubmit={handleSubmit}>
            <h2 className='text-center'>Verify Your Account</h2>
            <h6 className='text-center'>
              Please enter the 6-digit OTP sent to <span className='fw-bold'>{location?.state?.preview}</span> to verify your account
            </h6>

            <div className='otp-input-fields'>
              {otp.map((digit, index) => (
                <input
                  key={index}
                  type='text'
                  maxLength={6}
                  inputMode='numeric'
                  pattern='[0-9]*'
                  name='otp'
                  autoComplete={index === 0 ? 'one-time-code' : 'off'}
                  value={digit}
                  onChange={(e) => handleInputChange(e, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  onBlur={handleBlur}
                  ref={otpInputRefs[index]}
                  className={`form-control ${!!errors.otp && touched.otp && 'is-invalid'}`}
                />
              ))}
            </div>

            <button type='submit' disabled={isSubmitting} className='btn btn-pay w-100'>
              {isSubmitting ? (
                <>
                  <span className='spinner-border spinner-border-sm me-05' role='status' aria-hidden='true' />
                  &nbsp;Loading...
                </>
              ) : (
                'Verify'
              )}
            </button>

            <p className='text-center'>
              {loading ? (
                'Loading...'
              ) : (
                <>
                  Didn't receive the OTP? <span onClick={reSendOtp} className='pe-auto' style={{ color: '#FF0000', cursor: 'pointer' }}>Resend</span>
                </>
              )}
            </p>
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
