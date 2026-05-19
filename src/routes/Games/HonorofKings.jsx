import React, { useContext, useEffect, useState } from 'react'
import OrderCompleted from '../../components/OrderCompleted'
import UserContext from '../../context/UserContext'
import { honorofkingsSchema } from '../../models'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import userdetails from '../../api/userdetails'
import { Modal } from 'react-bootstrap'
import { useFormik } from 'formik'
import Swal from 'sweetalert2'

const initialValues = {
  code: '',
  characterId: '',
  inGameName: '',
  itemId: '',
}

const code = 'honor-of-kings'
export default function MobileLegendsRussia() {
  const [infomodal, setInfomodal] = useState(false)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const context = useContext(UserContext)
  const { clickLoadingBar } = context
  const infoData = useSelector((state) => state.infoData)
  const { payment } = infoData
  const img = process.env.REACT_APP_API_ROOT_URL + 'static/games/' + code + '.webp'
  const [product, setProduct] = useState(infoData.availableGames.find((element) => element.code === code))

  const [item, setItem] = useState({})
  const [info, setInfo] = useState({ type: '', msg: '' })
  const [isUserValidated, setIsUserValidated] = useState(false)
  const [loading, setLoading] = useState(false)
  const [directCheckout, setDirectCheckout] = useState(true)
  const [complated, setComplated] = useState({ is: false, data: {} })

  useEffect(() => {
    document.title = 'NMH Gaming - Checkout'

    const selectedItem = product?.itemList.find((item) => item.status) || product?.itemList[0]
    setValues({ ...values, code: product?.code, itemId: selectedItem?.id })
    setItem(selectedItem)
    // eslint-disable-next-line
  }, [])

  const handleItemClick = (value) => {
    setValues((prevValues) => ({ ...prevValues, itemId: value.id }))
    setItem(value)
  }

  const { values, setValues, errors, touched, isSubmitting, handleBlur, handleChange, handleSubmit } = useFormik({
    initialValues,
    validationSchema: honorofkingsSchema,
    onSubmit: async (values) => {
      try {
        if (payment.gateway === 'N.A') {
          Swal.fire({
            icon: 'error',
            title: '',
            text: 'Gateway down, please try again leter!',
            footer: 'Alert by the Radient Official team',
            confirmButtonColor: '#4a89dc',
          })
        } else {
          const url = directCheckout ? `${process.env.REACT_APP_API_ROOT_URL}payment/${payment.gateway + payment.url}` : `${process.env.REACT_APP_API_ROOT_URL}purchase`
          const response = await fetch(url, {
            method: 'post',
            headers: {
              'Content-Type': 'application/json',
              authToken: localStorage.getItem('authToken'),
            },
            body: directCheckout
              ? JSON.stringify({ amount: item.amount, directCheckout, purchasePayload: { ...values, paymentMethod: 'upi' } })
              : JSON.stringify({ ...values, paymentMethod: 'wallet', orderId: Math.floor(Math.random() * 90000000000) + 10000000000 }),
          })
          const result = await response.json()
          if (result.success) {
            if (directCheckout) window.location.replace(result.data.paymentLink)
            else {
              dispatch(userdetails(navigate))
              setComplated({ is: true, data: result.data })
              clickLoadingBar()
              // Swal.fire({
              //   icon: 'success',
              //   title: '',
              //   text: result.msg,
              //   footer: 'Alert by the NMH Gaming team',
              //   confirmButtonColor: '#008ad8',
              // })
              // navigate(`/invoice?type=purchase&orderId=${result.data.orderId}`)
            }
          } else {
            Swal.fire({
              icon: 'error',
              title: '',
              text: result.msg,
              footer: 'Alert by the Radient Official team',
              confirmButtonColor: '#1c26b9',
            })
          }
        }
      } catch (error) {
        console.log(error)
        Swal.fire({
          icon: 'error',
          title: '',
          text: 'Something went wrong, please try again leter!',
          footer: 'Alert by the Radient Official team',
          confirmButtonColor: '#1c26b9',
        })
      }
    },
  })

  const fetchUserInfo = async () => {
    try {
      const url = `${process.env.REACT_APP_API_ROOT_URL}info/id-check`
      setLoading(true)
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authToken: localStorage.getItem('authToken'),
        },
        body: JSON.stringify(values),
      })
      const result = await response.json()
      setLoading(false)
      if (result.success) {
        const inGameName = result.data.name
        setInfo({ type: 'success', msg: inGameName })
        setValues((prevValues) => ({ ...prevValues, inGameName }))
        setIsUserValidated(true)
      } else {
        setInfo({ type: 'danger', msg: result.msg })
        setValues({ ...values, inGameName: undefined })
        setIsUserValidated(false)
      }
    } catch (error) {
      setLoading(false)
      setInfo({ type: 'danger', msg: 'Something went wrong, please try again leter!' })
      setValues({ ...values, inGameName: undefined })
      setIsUserValidated(false)
      console.log(error)
    }
  }

  return (
    <>
      {complated.is ? (
        <OrderCompleted data={complated.data} setComplated={setComplated} />
      ) : (
        <section className='wrapper product'>
          <div className='container'>
            <div className='row pt-32px g-md-5 g-3'>
              <div className='col-lg col-lg-340 p-0'>
                <div className='game-imgbox'>
                  <img src={'images/banner/' + code + '.png'} alt='legends' />
                </div>

                <div className='game-content'>
                  <div className='pt-3 d-flex'>
                    <div className='game-smimgbox me-3'>
                      <img src={img} alt='legends' className='game-smimg' />
                    </div>
                    <div>
                      <h6 className='game-heading'>{product?.name}</h6>

                      <div className='d-flex align-items-center pt-2'>
                        <svg className='icon me-2'>
                          <use href='#icon_energy'></use>
                        </svg>
                        <span>Instant Delivery</span>
                        <svg className='icon ms-3 me-2'>
                          <use href='#icon_secure'></use>
                        </svg>
                        <span>Secure Payments</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className='col-lg content-wrapper'>
                <div className='d-flex align-items-center pb-md-3 pb-2'>
                  <h5 className='details-heading'>1. Enter Account Details</h5>
                  <button type='button' className='question-btn' onClick={() => setInfomodal(true)}>
                    <svg className='icon'>
                      <use href='#icon_question'></use>
                    </svg>
                  </button>
                </div>

                <div className='row row-cols-1 row-cols-md-2 g-md-3 g-2'>
                  <div className='col'>
                    <label htmlFor='UserId' className='form-label input-label pb-md-1 mb-md-1 p-0 m-0'>
                      UID
                    </label>
                    <input
                      type='number'
                      autoComplete='off'
                      name='characterId'
                      placeholder='Enter UID'
                      value={values.characterId}
                      onChange={(e) => {
                        setIsUserValidated(false)
                        setValues({ ...values, characterId: e.target.value, inGameName: undefined })
                        setInfo({ type: '', msg: '' })
                      }}
                      onBlur={(e) => {
                        handleBlur(e)
                        values.characterId && fetchUserInfo()
                      }}
                      id='UserId'
                      className={`form-control form-control-lg input-box ${!!errors.characterId && touched.characterId && 'is-invalid'}`}
                    />
                    {errors.characterId && touched.characterId && <div className='invalid-feedback'>{errors.characterId}</div>}
                  </div>
                </div>

                {loading && (
                  // <div className='d-flex align-items-center check-name pb-md-4 mb-md-2 pb-4'>
                  <div className='d-flex align-items-center check-name'>
                    <span className='spinner-border spinner-border-sm me-2' style={{ color: '#ffc107' }} role='status' aria-hidden='true' />
                    <span style={{ color: '#ffc107' }}>Loading...</span>
                  </div>
                )}

                {info.type === 'success' && (
                  <div className='d-flex align-items-center check-name'>
                    <svg className='icon me-2'>
                      <use href='#icon_check'></use>
                    </svg>
                    <span>{info.msg}</span>
                  </div>
                )}

                {info.type === 'danger' && (
                  <div className='d-flex align-items-center check-name'>
                    <svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='currentColor' class='icon icon-tabler icons-tabler-filled icon-tabler-xbox-x me-2'>
                      <path stroke='none' d='M0 0h24v24H0z' fill='none' />
                      <path d='M12 2c5.523 0 10 4.477 10 10s-4.477 10 -10 10s-10 -4.477 -10 -10s4.477 -10 10 -10m3.6 5.2a1 1 0 0 0 -1.4 .2l-2.2 2.933l-2.2 -2.933a1 1 0 1 0 -1.6 1.2l2.55 3.4l-2.55 3.4a1 1 0 1 0 1.6 1.2l2.2 -2.933l2.2 2.933a1 1 0 0 0 1.6 -1.2l-2.55 -3.4l2.55 -3.4a1 1 0 0 0 -.2 -1.4' />
                    </svg>
                    <span>Invalid user ID</span>
                  </div>
                )}

                <h5 className='details-heading mt-4'>2. Select a Package</h5>
                <div className='row row-cols-2 row-cols-md-3 g-md-3 g-2 pt-md-4 pt-2 pb-4'>
                  {product?.itemList
                    ?.sort((a, b) => a.bottomArrangement - b.bottomArrangement || (b.badge ? 1 : 0) - (a.badge ? 1 : 0) || a.amount - b.amount)
                    .map(
                      ({ id, logo, amount, dosOffer, title, description, badge, status }, index) =>
                        status && (
                          <div className='col' key={index}>
                            <label className='card-label' onClick={() => handleItemClick({ id, logo, amount, dosOffer, title, description, badge, status })}>
                              <input type='checkbox' checked={values.itemId === id} />
                              <div className='cl-content min-h132px'>
                                {badge && (
                                  <div className='cl-badge'>
                                    <small>{badge}</small>
                                  </div>
                                )}
                                <div className='cl-title'>
                                  <h4>{title}</h4>
                                  <span>{description}</span>
                                </div>
                                <div className='cl-icon'>
                                  <img src={`${process.env.REACT_APP_API_ROOT_URL}static/uploads/${logo}`} alt='diamond' />
                                </div>
                                <h6 className='cl-price'>₹{amount}</h6>
                              </div>
                            </label>
                          </div>
                        )
                    )}
                </div>

                <h5 className='details-heading mt-md-3 pb-md-4 pb-2'>3. Choose Payment Method</h5>

                <div className='row pb-md-4 pb-2 g-md-4 g-md-3 g-2'>
                  <div className='col-12'>
                    <label className='card-label'>
                      <input type='checkbox' checked={directCheckout === false} onChange={() => setDirectCheckout(false)} />
                      <div className='cl-content payment-card'>
                        <div className='cr-badge'>
                          <small>Get 5-10% Discount</small>
                        </div>
                        <div className='w-100 d-flex  align-items-center'>
                          <div className='left-coin'>
                            <div className='img-box'>
                              <img src='/images/dos.svg' alt='coin' />
                            </div>
                            <h3 className='coin-name'>NMH Coins</h3>
                          </div>
                          <div className='right-coin ms-auto me-1'>
                            <div className='d-flex align-items-center'>
                              <div className='img-box'>
                                <img src='/images/dos.svg' alt='coin' />
                              </div>
                              <div>
                                <h3 className='coin-value'>{(item.amount - item.dosOffer).toFixed(2)}</h3>
                              </div>
                            </div>
                            <div className='d-flex'>
                              <p className='rupee ms-auto'>(=₹{(item.amount - item.dosOffer).toFixed(2)})</p>
                            </div>
                            <div className='d-flex'>
                              <del className='old-price ms-auto'>₹{item.amount}</del>
                            </div>
                          </div>
                        </div>
                      </div>
                    </label>
                  </div>

                  <div className='col-12 mb-md-0 mb-3'>
                    <label className='card-label'>
                      <input type='checkbox' checked={directCheckout === true} onChange={() => setDirectCheckout(true)} />
                      <div className='cl-content payment-card'>
                        <div className='w-100 d-flex  align-items-center'>
                          <div className='left-upi'>
                            <div className='img-box'>
                              <img src='/images/upi.svg' alt='upi' />
                            </div>
                            <h3 className='coin-name'>UPI</h3>
                          </div>
                          <div className='right-coin ms-auto me-1'>
                            <div className='d-flex align-items-center'>
                              <div className='img-upibox'>
                                <img src='/images/gpay.svg' alt='gpay' />
                              </div>
                              <div className='img-upibox'>
                                <img src='/images/phonepe.svg' alt='phonepe' />
                              </div>
                              <div className='img-upibox'>
                                <img src='/images/paytm.svg' alt='paytm' />
                              </div>
                              <div className='img-upimore'>
                                <img src='/images/plus.svg' alt='more' />
                              </div>
                              <div>
                                <h3 className='coin-value'>₹{item.amount}</h3>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </label>
                  </div>

                  {isUserValidated && values.itemId && (
                    <div className='col-12 pay-btnbox mb-md-4'>
                      <button type='button' className='btn btn-pay w-100' disabled={!isUserValidated || !values.itemId || isSubmitting} onClick={() => (localStorage.getItem('authToken') ? handleSubmit() : navigate('/send-otp'))}>
                        {isSubmitting ? (
                          <>
                            <span className='spinner-border spinner-border-sm me-05' role='status' aria-hidden='true' />
                            &nbsp; Loading...
                          </>
                        ) : (
                          ` Proceed to pay ₹${!directCheckout && item.dosOffer > 0 ? (item.amount - item.dosOffer).toFixed(2) : item.amount}`
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      <Modal centered show={infomodal} onHide={() => setInfomodal(false)} className='detail-modal'>
        <Modal.Header closeButton className='border-0'></Modal.Header>
        <Modal.Body className='p-md-4 p-3 pt-0'>
          <div className='d-flex'></div>
          <p>
            To find your UID, click on your avatar in the top left corner of the profile section. Then, click on "Settings" at the top right corner. Under "Settings," you can find your UID. For example, 123456789. Enter 123456789 in the UID field.
          </p>
          <div className='img-details mt-md-4 mt-2'>
            <img src={'images/info/' + code + '.webp'} alt='/profile details' />
          </div>
        </Modal.Body>
      </Modal>
    </>
  )
}
