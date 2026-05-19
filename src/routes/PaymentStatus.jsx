import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getTransactionStatus } from '../api/apiService'
import moment from 'moment'

const SuccessIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0px 4px 6px rgba(34, 197, 94, 0.3))' }}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
)

const FailedIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0px 4px 6px rgba(239, 68, 68, 0.3))' }}>
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="15" y1="9" x2="9" y2="15"></line>
    <line x1="9" y1="9" x2="15" y2="15"></line>
  </svg>
)

const PendingIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0px 4px 6px rgba(245, 158, 11, 0.3))' }}>
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12 6 12 12 16 14"></polyline>
  </svg>
)

const CopyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
  </svg>
)

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
)

export default function PaymentStatus() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  
  const clientTxnId = searchParams.get('client_txn_id')
  
  const [transaction, setTransaction] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)

  const fetchStatus = async (isRefetch = false) => {
    try {
      if (isRefetch) setRefreshing(true)
      else setLoading(true)
      
      const res = await getTransactionStatus(clientTxnId)
      if (res.success && res.data) {
        setTransaction(res.data)
      } else {
        setError(res.message || 'Failed to fetch transaction status.')
      }
    } catch (err) {
      console.error(err)
      setError('An error occurred while fetching the transaction status.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (clientTxnId) {
      fetchStatus()
    } else {
      setError('No transaction ID provided.')
      setLoading(false)
    }
  }, [clientTxnId])

  useEffect(() => {
    // Prevent user from clicking Back and returning to the payment gateway
    window.history.pushState(null, '', window.location.href)
    const handlePopState = () => {
      navigate('/', { replace: true })
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [navigate])

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <section className='d-flex justify-content-center align-items-center pb-5' style={{ minHeight: '60vh', paddingTop: '80px' }}>
        <div className='container text-center'>
          <div className='spinner-border' style={{ color: '#1e293b', width: '3rem', height: '3rem', borderWidth: '0.25em' }} role='status' />
          <p className='mt-3 fw-medium' style={{ color: '#64748b', fontSize: '15px' }}>Fetching transaction details...</p>
        </div>
      </section>
    )
  }

  if (error || !transaction) {
    return (
      <section className='d-flex justify-content-center align-items-center pb-5' style={{ minHeight: '60vh', paddingTop: '80px' }}>
        <div className='container text-center px-4'>
          <div className="mb-4 d-flex justify-content-center">
             <div style={{ background: '#fef2f2', padding: '20px', borderRadius: '50%' }}>
               <FailedIcon />
             </div>
          </div>
          <h4 className="fw-bold mb-2" style={{ color: '#1e293b' }}>Transaction Not Found</h4>
          <p className="text-muted mb-4 mx-auto" style={{ maxWidth: '400px' }}>{error}</p>
          <button className='btn px-5 py-2 fw-semibold text-white' style={{ background: '#1e293b', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }} onClick={() => navigate('/my-wallet')}>
            Go Back to Wallet
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className='wrapper pb-5' style={{ paddingTop: '60px', minHeight: '80vh', background: '#f8fafc' }}>
      <div className='container'>
         <div className='card border-0 mx-auto' style={{ maxWidth: '400px', borderRadius: '16px', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.05)' }}>
            <div className='card-body p-4 text-center'>
               
               <div className="mb-3">
                 {transaction.status === 'success' ? <SuccessIcon /> : transaction.status === 'failed' ? <FailedIcon /> : <PendingIcon />}
               </div>
               
               <h5 className="mb-1" style={{ fontWeight: 700, color: '#1e293b', letterSpacing: '-0.3px' }}>
                 {transaction.status === 'success' ? 'Payment Successful!' : transaction.status === 'failed' ? 'Payment Failed' : 'Payment Pending'}
               </h5>
               
               <p className="text-muted mb-3" style={{ fontSize: '13px' }}>
                 {transaction.status === 'success' ? 'Your wallet has been successfully recharged.' : transaction.status === 'failed' ? 'Unfortunately, your payment could not be processed.' : 'Your payment is currently being processed.'}
               </p>

               <h2 className="fw-bold mb-3" style={{ color: transaction.status === 'success' ? '#22c55e' : transaction.status === 'failed' ? '#ef4444' : '#f59e0b', letterSpacing: '-0.5px' }}>
                 ₹{transaction.amount}
               </h2>

               <div style={{ borderTop: '2px dashed #e2e8f0', margin: '20px 0' }}></div>

               <div className="text-start">
                  <div className="mb-3">
                    <p className="text-muted mb-2 ps-1" style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Transaction ID</p>
                    <div className="d-flex align-items-center justify-content-between p-2 px-3 rounded-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                       <span className="text-break" style={{ fontWeight: 600, color: '#334155', fontSize: '13px', fontFamily: 'monospace' }}>{transaction.orderId}</span>
                       <button 
                         onClick={() => handleCopy(transaction.orderId)}
                         className="btn btn-sm ms-2 flex-shrink-0" 
                         style={{ background: '#fff', border: '1px solid #cbd5e1', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '6px', transition: 'all 0.2s', padding: 0 }}
                         title="Copy Transaction ID"
                       >
                         {copied ? <CheckIcon /> : <CopyIcon />}
                       </button>
                    </div>
                  </div>

                 <div className="d-flex flex-column gap-2 mt-3">
                    {transaction.utr && (
                      <div className='d-flex justify-content-between align-items-center'>
                        <span className='text-muted' style={{ fontSize: '13px', fontWeight: 500 }}>UTR</span>
                        <span className='fw-semibold text-end text-break ms-3' style={{ color: '#334155', fontSize: '13px' }}>{transaction.utr}</span>
                      </div>
                    )}
                    {transaction.gatewayType && (
                      <div className='d-flex justify-content-between align-items-center'>
                        <span className='text-muted' style={{ fontSize: '13px', fontWeight: 500 }}>Gateway</span>
                        <span className='fw-semibold text-capitalize text-end ms-3' style={{ color: '#334155', fontSize: '13px' }}>{transaction.gatewayType}</span>
                      </div>
                    )}
                    {transaction.paymentNote && (
                      <div className='d-flex justify-content-between align-items-center'>
                        <span className='text-muted' style={{ fontSize: '13px', fontWeight: 500 }}>Note</span>
                        <span className='fw-semibold text-end text-break ms-3' style={{ color: '#334155', fontSize: '13px' }}>{transaction.paymentNote}</span>
                      </div>
                    )}
                    <div className='d-flex justify-content-between align-items-center'>
                      <span className='text-muted' style={{ fontSize: '13px', fontWeight: 500 }}>Date</span>
                      <span className='fw-semibold text-end ms-3' style={{ color: '#334155', fontSize: '13px' }}>{moment(transaction.createdAt).format('DD MMM YYYY, hh:mm A')}</span>
                    </div>
                 </div>
                 
                 {(transaction.customerName || transaction.customerEmail || transaction.customerNumber) && (
                   <>
                     <div style={{ borderTop: '1px solid #f1f5f9', margin: '16px 0' }}></div>
                     <p className="text-muted mb-2 ps-1" style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Customer Details</p>
                     <div className="d-flex flex-column gap-2">
                       {transaction.customerName && (
                         <div className='d-flex justify-content-between align-items-center'>
                           <span className='text-muted' style={{ fontSize: '13px', fontWeight: 500 }}>Name</span>
                           <span className='fw-semibold text-end ms-3' style={{ color: '#334155', fontSize: '13px' }}>{transaction.customerName}</span>
                         </div>
                       )}
                       {transaction.customerEmail && (
                         <div className='d-flex justify-content-between align-items-center'>
                           <span className='text-muted' style={{ fontSize: '13px', fontWeight: 500 }}>Email</span>
                           <span className='fw-semibold text-end text-break ms-3' style={{ color: '#334155', fontSize: '13px' }}>{transaction.customerEmail}</span>
                         </div>
                       )}
                       {transaction.customerNumber && (
                         <div className='d-flex justify-content-between align-items-center'>
                           <span className='text-muted' style={{ fontSize: '13px', fontWeight: 500 }}>Phone</span>
                           <span className='fw-semibold text-end ms-3' style={{ color: '#334155', fontSize: '13px' }}>{transaction.customerNumber}</span>
                         </div>
                       )}
                     </div>
                   </>
                 )}
               </div>

               <div className='d-flex flex-row gap-2 mt-4'>
                  <button 
                    className='btn py-2 fw-semibold w-50 text-white d-flex justify-content-center align-items-center' 
                    style={{ background: '#1e293b', fontSize: '14px', border: 'none', borderRadius: '10px', transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(30, 41, 59, 0.15)' }}
                    onClick={() => navigate('/my-wallet')}
                  >
                    Wallet
                  </button>
                  <button 
                    className='btn py-2 fw-semibold w-50 d-flex justify-content-center align-items-center' 
                    style={{ background: '#f8fafc', fontSize: '14px', color: '#475569', border: '1px solid #e2e8f0', borderRadius: '10px', transition: 'all 0.2s' }}
                    onClick={() => fetchStatus(true)}
                    disabled={refreshing}
                  >
                    {refreshing ? (
                      <>
                         <span className='spinner-border spinner-border-sm me-1' role='status' aria-hidden='true'></span>
                         Wait...
                      </>
                    ) : 'Refresh'}
                  </button>
               </div>
            </div>
         </div>
      </div>
    </section>
  )
}
