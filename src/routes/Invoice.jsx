import React, { useContext, useEffect, useState } from 'react'
import AsideBar from '../components/AsideBar'
import BottomMenu from '../components/BottomMenu'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Loader from '../components/Loader'
import Swal from 'sweetalert2'
import moment from 'moment'
import { useSelector } from 'react-redux'
import UserContext from '../context/UserContext'

export default function Invoice() {
  const infoData = useSelector((state) => state.infoData)
  const context = useContext(UserContext)
  const { modal, setModal } = context
  const navigate = useNavigate()
  const [query, setQuery] = useSearchParams()
  let type = query.get('type')
  if (!type) type = 'payment'
  const orderId = query.get('orderId')
  const [invoice, setInvoice] = useState({})
  const [loading, setLoading] = useState(false)
  const [game, setGame] = useState({})
  const [item, setItem] = useState({})

  function Headername() {
    return type.charAt(0).toUpperCase() + type.slice(1)
  }

  const getInvoice = async () => {
    try {
      const url = `${process.env.REACT_APP_API_ROOT_URL}${type}/status`
      setLoading(true)
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authToken: localStorage.getItem('authToken'),
        },
        body: JSON.stringify({ type, orderId }),
      })
      const result = await response.json()
      setLoading(false)
      if (result.success) {
        setInvoice(result.data)
        if (type === 'purchase') {
          let findResult = infoData.availableGames.find((element) => element.code == result.data.code)
          setGame(findResult)
          findResult = findResult.itemList?.find((element) => element.id == result.data.itemId)
          setItem(findResult)
        }
      } else {
        Swal.fire({
          icon: 'error',
          title: '',
          text: result.msg,
          footer: 'Alert by the NMH Gaming team',
          confirmButtonColor: '#008ad8',
        }).then(() => navigate('/'))
      }
    } catch (error) {
      console.log(error)
      setLoading(false)
      Swal.fire({
        icon: 'error',
        title: '',
        text: 'Something went wrong, please try again leter!',
        footer: 'Alert by the NMH Gaming team',
        confirmButtonColor: '#008ad8',
      })
    }
  }

  useEffect(() => {
    document.title = 'NMH Gaming - Invoice'
    if (!localStorage.getItem('authToken')) {
      navigate('/send-otp')
    } else if (!orderId || (type !== 'payment' && type !== 'withdraw' && type !== 'purchase')) {
      navigate('/')
    } else {
      getInvoice()
    }
    // eslint-disable-next-line
  }, [])

  return (
    <>
      {loading && <Loader />}
      {Object.keys(invoice).length !== 0 && (
        <section className='wrapper wrapper-asidecontent'>
          <div className='container'>
            <div className='row pt-md-4 pt-3'>
              <div className='col-auto d-none d-lg-block'>
                <AsideBar />
              </div>
              <div className='col pt-md-3 pt-1 profile-wrapper'>
                {type === 'payment' && (
                  <div className='details'>
                    <h2 className='title'>Order Details</h2>

                    <div className='order-detailcard mt-md-3 mt-2'>
                      <div className='d-flex mb-2'>
                        <div className='gameImg'>
                          <img src='/images/coin.svg' alt='coin' />
                        </div>
                        <div className='ms-md-3 ms-2 gameName'>
                          <p>NMH Coins</p>
                          <p>{invoice?.amount} Coins</p>
                        </div>
                      </div>

                      <div className='d-flex py-1 start-br'>
                        <div className='left-order'>Status</div>

                        {invoice?.status === 'success' && <div className='right-order ms-auto status'>Completed</div>}
                        {invoice?.status === 'failed' && (
                          <div className='right-order ms-auto status' style={{ color: '#DF4545' }}>
                            Failed
                          </div>
                        )}
                        {invoice?.status === 'pending' && (
                          <div className='right-order ms-auto status' style={{ color: '#1a87d9' }}>
                            Processing
                          </div>
                        )}
                      </div>

                      <div className='d-flex py-1 start-br'>
                        <div className='left-order'>Order ID</div>
                        <div className='right-order ms-auto'>{invoice?.orderId}</div>
                      </div>

                      <div className='d-flex py-1 start-br'>
                        <div className='left-order'>Order Time</div>
                        <div className='right-order ms-auto'>{moment(invoice?.createdAt).format('DD-MM-YYYY LT')}</div>
                      </div>

                      <div className='d-flex py-1 mid-br'>
                        <div className='left-order'>Username</div>
                        <div className='right-order ms-auto'>{invoice?.userName}</div>
                      </div>

                      <div className='d-flex py-1 mid-br'>
                        <div className='left-order'>Country</div>
                        <div className='right-order ms-auto'>India</div>
                      </div>

                      <div className='d-flex py-1 last-br'>
                        <div className='left-order'>Total</div>
                        <div className='right-order ms-auto'>₹ {invoice?.amount}</div>
                      </div>
                    </div>

                    <div className='mt-md-4 mt-3 order-detailbtn'>
                      <button type='button' className='btn btn-pay' onClick={() => setModal({ ...modal, addMoney: true })}>
                        Pay Again
                      </button>
                    </div>
                  </div>
                )}
                {type === 'withdraw' && (
                  <div className='custom-container'>
                    <div className='receive-money-box'>
                      <div className='receive-money-header'>
                        <div className='receive-money-img'>
                          <svg
                            xmlns='http://www.w3.org/2000/svg'
                            width='24'
                            height='24'
                            viewBox='0 0 24 24'
                            fill='none'
                            stroke='currentColor'
                            stroke-width='2'
                            stroke-linecap='round'
                            stroke-linejoin='round'
                            class='icon icon-tabler icons-tabler-outline icon-tabler-arrow-up'
                          >
                            <path stroke='none' d='M0 0h24v24H0z' fill='none' />
                            <path d='M12 5l0 14' />
                            <path d='M18 11l-6 -6' />
                            <path d='M6 11l6 -6' />
                          </svg>
                        </div>
                        <h2>{Headername()}</h2>
                      </div>
                      <div className='receive-money-details'>
                        <ul className='details-list'>
                          <li>
                            <h3 className='fw-normal dark-text'>Status</h3>
                            {invoice?.status === 'success' && <h3 className='fw-normal text-success'>Success</h3>}
                            {invoice?.status === 'failed' && <h3 className='fw-normal text-danger'>Failed</h3>}
                            {invoice?.status === 'pending' && <h3 className='fw-normal text-warning'>Pending</h3>}
                          </li>
                          <li>
                            <h3 className='fw-normal dark-text'>User Name</h3>
                            <h3 className='fw-normal light-text'>{invoice?.userName}</h3>
                          </li>
                          <li>
                            <h3 className='fw-normal dark-text'>Bank Name</h3>
                            <h3 className='fw-normal light-text'>{invoice?.bankId?.bankName}</h3>
                          </li>
                          <li>
                            <h3 className='fw-normal dark-text'>Account Number</h3>
                            <h3 className='fw-normal light-text'>{invoice?.bankId?.accountNumber}</h3>
                          </li>
                          <li>
                            <h3 className='fw-normal dark-text'>Order Id</h3>
                            <h3 className='fw-normal light-text'>{invoice?.orderId}</h3>
                          </li>
                          <li>
                            <h3 className='fw-normal dark-text'>Amount</h3>
                            <h3 className='fw-normal light-text'>{invoice?.amount}</h3>
                          </li>
                          <li>
                            <h3 className='fw-normal dark-text'>UTR</h3>
                            <h3 className='fw-normal light-text'>{invoice?.utr}</h3>
                          </li>
                          <li>
                            <h3 className='fw-normal dark-text'>Issued</h3>
                            <h3 className='fw-normal light-text'>{moment(invoice?.createdAt).format('DD-MM-YYYY LT')}</h3>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
                {type === 'purchase' && (
                  <div className='details'>
                    <h2 className='title'>Order Details</h2>

                    <div className='order-detailcard mt-md-3 mt-2'>
                      <div className='d-flex mb-2'>
                        <div className='gameImg'>
                          <img src={process.env.REACT_APP_API_ROOT_URL + 'static/games/' + invoice.code + '.webp'} alt='game' />
                        </div>
                        <div className='ms-md-3 ms-2 gameName'>
                          <p>{game.name}</p>
                          <p>{item?.title}</p>
                        </div>
                      </div>

                      <div className='d-flex py-1 mid-br'>
                        <div className='left-order'>Status</div>

                        {invoice?.status === 'success' && <div className='right-order ms-auto status'>Completed</div>}
                        {invoice?.status === 'failed' && (
                          <div className='right-order ms-auto status' style={{ color: '#DF4545' }}>
                            Refunded
                          </div>
                        )}
                        {invoice?.status === 'pending' && (
                          <div className='right-order ms-auto status' style={{ color: '#1a87d9' }}>
                            Processing
                          </div>
                        )}
                      </div>

                      <div className='d-flex py-1 mid-br'>
                        <div className='left-order'>Order ID</div>
                        <div className='right-order ms-auto'>{invoice?.orderId}</div>
                      </div>

                      <div className='d-flex py-1 mid-br'>
                        <div className='left-order'>Order Time</div>
                        <div className='right-order ms-auto'>{moment(invoice?.createdAt).format('DD-MM-YYYY LT')}</div>
                      </div>

                      <div className='d-flex py-1 mid-br'>
                        <div className='left-order'>User ID</div>
                        <div className='right-order ms-auto'>{invoice?.characterId}</div>
                      </div>

                      {invoice?.serverId && (
                        <div className='d-flex py-1 mid-br'>
                          <div className='left-order'>Zone ID</div>
                          <div className='right-order ms-auto'>{invoice?.serverId}</div>
                        </div>
                      )}

                      <div className='d-flex py-1 mid-br'>
                        <div className='left-order'>Username</div>
                        <div className='right-order ms-auto'>{invoice?.inGameName}</div>
                      </div>

                      <div className='d-flex py-1 mid-br'>
                        <div className='left-order'>Payment Method</div>
                        <div className='right-order ms-auto'>{invoice?.paymentMethod === 'upi' ? 'UPI' : 'NMH Coins'}</div>
                      </div>

                      <div className='d-flex py-1 last-br'>
                        <div className='left-order'>Total</div>
                        <div className='right-order ms-auto'>₹ {invoice?.amount}</div>
                      </div>
                    </div>

                    <div className='mt-md-4 mt-3 order-detailbtn'>
                      <button type='button' className='btn btn-pay' onClick={() => navigate('/' + invoice?.code)}>
                        Buy Again
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <BottomMenu />
          </div>
        </section>
      )}
    </>
  )
}
