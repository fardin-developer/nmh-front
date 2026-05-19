import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { sendotpSchema } from '../../models'
import { useFormik } from 'formik'
import Swal from 'sweetalert2'
import { sendOtp } from '../../api/apiService'

const initialValues = {
  email: '',
}

export default function Sendotp() {
  const navigate = useNavigate()

  useEffect(() => {
    document.title = 'NMH Gaming - Send OTP'

    if (localStorage.getItem('authToken')) {
      navigate('/')
    }
  }, [])

  const { values, errors, touched, handleBlur, handleChange, handleSubmit, isSubmitting } = useFormik({
    initialValues,
    validationSchema: sendotpSchema,
    onSubmit: async (values) => {
      try {
        const email = values.email.trim()
        const result = await sendOtp(email)
        if (result.message) {
          navigate('/verify-otp', {
            replace: false,
            state: { ...values, email, preview: email },
          })
        } else {
          Swal.fire({
            icon: 'error',
            title: '',
            text: result.message || 'Failed to send OTP. Please try again.',
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

  return (
    <div className='mobile-wrapper login-only-page'>
      <section className='wrapper-login'>
        <form className='login-form' autoComplete='off' onSubmit={handleSubmit}>
          <h2 className='text-center'>Welcome!</h2>
          <h6 className='text-center'>Enter your email address</h6>

          <div>
            <input
              type='email'
              autoComplete='off'
              name='email'
              placeholder='Enter your email'
              value={values.email}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`form-control form-control-lg input-box ${!!errors.email && touched.email && 'is-invalid'}`}
            />
            {errors.email && touched.email && <div className='invalid-feedback'>{errors.email}</div>}
          </div>

          <button className='btn btn-pay w-100' type='submit' disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <span className='spinner-border spinner-border-sm me-05' role='status' aria-hidden='true' />
                &nbsp;Loading...
              </>
            ) : (
              'Send OTP'
            )}
          </button>
        </form>
      </section>
    </div>
  )
}
