import { addmoneySchema } from '../models'
import React, { useContext, useEffect } from 'react'
import { useFormik } from 'formik'
import { Modal } from 'react-bootstrap'
import Swal from 'sweetalert2'
import UserContext from '../context/UserContext'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { addMoneyToWallet } from '../api/apiService'

export default function Addmoney({ modal, setModal }) {
  const navigate = useNavigate()
  const infoData = useSelector((state) => state.infoData)
  const context = useContext(UserContext)
  const { setLoader } = context

  const initialValues = {
    amount: '',
  }

  const { values, errors, touched, handleBlur, handleChange, handleSubmit, isSubmitting } = useFormik({
    initialValues,
    validationSchema: addmoneySchema,
    onSubmit: async (values) => {
      try {
        setLoader(true)
        setModal({ ...modal, addMoney: false })

        const redirectUrl = `${window.location.origin}/payment-status`
        const result = await addMoneyToWallet(Number(values.amount), redirectUrl)

        if (result.success && result.transaction?.paymentUrl) {
          window.location.replace(result.transaction.paymentUrl)
        } else {
          Swal.fire({
            icon: 'error',
            title: '',
            text: result.message || 'Payment initiation failed',
            footer: 'Alert by the NMH Gaming team',
            confirmButtonColor: '#008ad8',
          })
          setLoader(false)
        }
      } catch (error) {
        setLoader(false)
        console.log(error)
        Swal.fire({
          icon: 'error',
          title: '',
          text: 'Something went wrong, please try again leter!',
          footer: 'Alert by the NMH Gaming team',
          confirmButtonColor: '#008ad8',
        })
      }
    },
  })

  useEffect(() => {
    document.title = 'NMH Gaming - Add Money'
    // eslint-disable-next-line
  }, [])

  return (
    <Modal centered show={modal.addMoney} backdrop='static' keyboard={false} onHide={() => setModal({ ...modal, addMoney: false })} className='addcoin-modal'>
      <Modal.Header closeButton className='border-0 py-0'></Modal.Header>
      <form className='modal-body px-md-4 px-3 mt-0 pt-0 pb-md-4' autoComplete='off' onSubmit={handleSubmit}>
        <h5 className='text-center'>Add Coins</h5>
        <p>Note: 1 NMH Coin = MMK1</p>
        <div>
          <label htmlFor='Amount' className='form-label input-label'>
            Amount
          </label>
          <input
            type='number'
            autoComplete='off'
            name='amount'
            placeholder='Your amount'
            value={values.amount}
            onChange={handleChange}
            onBlur={handleBlur}
            id='Amount'
            className={`form-control form-control-lg input-box ${!!errors.amount && touched.amount && 'is-invalid'}`}
          />
          {errors.amount && touched.amount && <div className='invalid-feedback'>{errors.amount}</div>}
        </div>
        <button type='submit' disabled={isSubmitting} className='btn btn-pay w-100 rounded-pill py-1'>
          {isSubmitting ? (
            <>
              <span className='spinner-border spinner-border-sm me-05' role='status' aria-hidden='true' />
              Loading...
            </>
          ) : (
            'Proceed to Payment'
          )}
        </button>
      </form>
    </Modal>
  )
}
