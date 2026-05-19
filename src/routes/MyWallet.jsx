import InfiniteScroll from 'react-infinite-scroll-component'
import React, { useContext, useEffect, useState } from 'react'
import BottomMenu from '../components/BottomMenu'
import UserContext from '../context/UserContext'
import { useNavigate } from 'react-router-dom'
import AsideBar from '../components/AsideBar'
import { useSelector } from 'react-redux'
import Swal from 'sweetalert2'
import moment from 'moment'
import { getWalletLedger } from '../api/apiService'

export default function MyWallet() {
  const navigate = useNavigate()
  const profileData = useSelector((state) => state.profileData)
  const context = useContext(UserContext)
  const { modal, setModal, setLoader } = context
  const [page, setPage] = useState(1)
  const [totalresult, setTotalresult] = useState(0)
  const [data, setData] = useState([])

  useEffect(() => {
    document.title = 'NMH Gaming - My Wallet'
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    try {
      setLoader(true)
      const result = await getWalletLedger(1, 10, undefined, undefined, 'all')
      setLoader(false)
      if (result.success) {
        setData(result.data?.transactions || [])
        setTotalresult(result.data?.totalCount || result.data?.totalTransactions || result.data?.transactions?.length || 0)
      } else {
        Swal.fire({
          icon: 'error',
          title: '',
          text: result.msg || result.message || 'Failed to fetch ledger',
          footer: 'Alert by the NMH Gaming team',
          confirmButtonColor: '#008ad8',
        })
      }
    } catch (error) {
      console.log(error)
      setLoader(false)
      Swal.fire({
        icon: 'error',
        title: '',
        text: 'Something went wrong, please try again later!',
        footer: 'Alert by the NMH Gaming team',
        confirmButtonColor: '#008ad8',
      })
    }
  }

  const fetchMoreHistory = async () => {
    try {
      const nextPage = page + 1
      setPage(nextPage)
      const result = await getWalletLedger(nextPage, 10, undefined, undefined, 'all')
      if (result.success) {
        const newTransactions = result.data?.transactions || []
        setData(data.concat(newTransactions))
        setTotalresult(result.data?.totalCount || result.data?.totalTransactions || data.length + newTransactions.length)
      } else {
        Swal.fire({
          icon: 'error',
          title: '',
          text: result.msg || result.message || 'Failed to fetch ledger',
          footer: 'Alert by the NMH Gaming team',
          confirmButtonColor: '#008ad8',
        })
      }
    } catch (error) {
      console.log(error)
      Swal.fire({
        icon: 'error',
        title: '',
        text: 'Something went wrong, please try again later!',
        footer: 'Alert by the NMH Gaming team',
        confirmButtonColor: '#008ad8',
      })
    }
  }

  return (
    <>
      <section className='wrapper wrapper-asidecontent'>
        <div className='container pb-md-4 pb-3'>
          <div className='row pt-md-4 pt-3'>
            <div className='col-auto d-none d-lg-block'>
              <AsideBar />
            </div>
            <div className='col'>
              <div className='row flex-column'>
                <div className='col pt-md-3 pt-1 profile-wrapper wallet'>
                  <h2 className='title'>My Wallet</h2>

                  <div className='card mt-md-4 mt-2'>
                    <div className='card-body h-100'>
                      <div className='d-flex justify-content-between align-items-center h-100'>
                        <div className='left-coindetails h-100'>
                          <h4 className='coin-title'>NMH Coins Wallet</h4>
                          <div className='d-flex align-items-center'>
                            <h4 className='coin-value me-md-2 me-1 p-0 m-0'>{(profileData?.walletBalance ?? profileData?.wallet ?? 0).toFixed(2)}</h4>
                            <div className='coin-img '>
                              <img src='/images/dos.svg' alt='coin' />
                            </div>
                          </div>
                        </div>
                        <div className='wallet-btn'>
                          <button type='button' className='rounded-pill' onClick={() => setModal({ ...modal, addMoney: true })}>
                            <svg className='icon'>
                              <use href='#icon_plus'></use>
                            </svg>
                            <span>Add Coins</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className='my-md-4 transaction-title'>Transactions</p>
                </div>

                <div className='col pt-md-3 profile-wrapper order-tabs'>
                  <div className='order-list'>
                    <div className='row row-cols-1 g-md-3 g-2'>
                      <InfiniteScroll
                        dataLength={data.length}
                        next={fetchMoreHistory}
                        hasMore={data.length !== totalresult}
                        style={{ overflow: 'hidden' }}
                        loader={
                          <div className='text-center my-2'>
                            <div class='spinner-border color-highlight' role='status' style={{ color: '#008ad8' }}></div>
                          </div>
                        }
                      >
                        {data.length === 0 ? (
                          <div className='text-center mt-4'>
                            <h5>No record found</h5>
                          </div>
                        ) : (
                          data.map((element, index) => {
                            const isCredit = element.transactionType === 'credit'
                            return (
                              <div className='col pt-3' key={index}>
                                <div className='card wallet-transaction-card'>
                                  <div className='card-body'>
                                    <div className='d-flex w-100 wallet-transaction-row'>
                                      <div className='game-img flex-shrink-0'>
                                        <img src='/images/dos.svg' alt='wallet' />
                                      </div>
                                      <div className='order-detail w-100 ms-md-3 ms-2 d-flex' style={{ minWidth: 0 }}>
                                        <div className='game-name flex-grow-1' style={{ minWidth: 0, paddingRight: '10px' }}>
                                          <p className="mb-0 fw-bold" style={{ fontSize: '14px', overflowWrap: 'anywhere', wordBreak: 'break-word' }}>{element.description ? element.description.replace(/^(Combo|Diamond) pack purchase:\s*/i, '') : 'Wallet Transaction'}</p>
                                          <p className={`small fw-bold mb-0 mt-1 text-${isCredit ? 'success' : 'danger'}`} style={{ fontSize: '11px' }}>
                                            {element.transactionType?.toUpperCase() || (element.amount > 0 ? 'CREDIT' : 'DEBIT')}
                                          </p>
                                        </div>
                                        <div className='ms-auto text-end flex-shrink-0 d-flex flex-column justify-content-between align-items-end'>
                                          <div>
                                            {(element?.status === 'success' || element?.status === 'completed') && <span className='order-complete'>Completed</span>}
                                            {(element?.status === 'failed' || element?.status === 'refunded') && <span className='order-refunded'>Failed</span>}
                                            {element?.status === 'pending' && <span className='order-processing'>Processing</span>}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                    <div className='d-flex align-items-center mt-2 border-top pt-2'>
                                      <p className='card-subtitle mb-0' style={{ fontSize: '12px', color: '#888' }}>{moment(element?.createdAt).format('DD-MM-YYYY LT')}</p>
                                      <p className={`card-ammount ms-auto mb-0 fw-bold text-${isCredit ? 'success' : 'danger'}`} style={{ fontSize: '15px' }}>
                                        {isCredit ? '+' : '-'} ₹ {element.amount?.toFixed(2)}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )
                          })
                        )}
                      </InfiniteScroll>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <BottomMenu />
        </div>
      </section>
    </>
  )
}
