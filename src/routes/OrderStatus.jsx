import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { getOrderStatus } from '../api/apiService'

export default function OrderStatus() {
  const { orderId: orderIdParam } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  // The payment gateway appends its query params (?client_txn_id=...&txn_id=...) directly
  // after our hash fragment, producing a hash like:
  //   #returnGameId=<id>?client_txn_id=<orderId>&txn_id=connectedgw
  // We normalise this by replacing the embedded ? inside the hash with & so all
  // key=value pairs can be parsed by URLSearchParams correctly.
  const rawHash = window.location.hash.replace(/^#/, '')          // strip leading #
  const normalisedHash = rawHash.replace('?', '&')                // fix embedded ? → &
  const hashParams = new URLSearchParams(normalisedHash)

  const returnGameIdFromQuery =
    searchParams.get('returnGameId') ||
    searchParams.get('gameId') ||
    hashParams.get('returnGameId') ||
    hashParams.get('gameId')

  const orderId =
    orderIdParam ||
    searchParams.get('orderId') ||
    searchParams.get('order_id') ||
    searchParams.get('client_txn_id') ||
    searchParams.get('orderid') ||
    hashParams.get('client_txn_id') ||   // gateway appends this into the hash
    hashParams.get('orderId')

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)

  const fetchStatus = async (isRefetch = false, isSilent = false) => {
    try {
      if (!isSilent) {
        if (isRefetch) setRefreshing(true)
        else setLoading(true)
      }

      const res = await getOrderStatus(orderId)
      if (res.success && res.order) {
        setOrder(res.order)
        return res.order
      } else {
        if (!isSilent) setError(res.message || 'Failed to fetch order status.')
      }
    } catch (err) {
      console.error(err)
      if (!isSilent) setError('An error occurred while fetching the order status.')
    } finally {
      if (!isSilent) {
        setLoading(false)
        setRefreshing(false)
      } else {
        setLoading(false)
      }
    }
    return undefined
  }

  useEffect(() => {
    let isMounted = true;
    let timeoutId = null;

    const startPolling = async () => {
      if (!orderId) {
        setError('No order ID provided.')
        setLoading(false)
        return;
      }

      const orderData = await fetchStatus(false, false)
      if (!isMounted) return;

      if (orderData && (orderData.status === 'processing' || orderData.status === 'pending')) {
        let pollCount5s = 0;
        let pollCount10s = 0;

        const pollLoop = async () => {
          if (!isMounted) return;

          if (pollCount5s < 16) {
            await new Promise(r => { timeoutId = setTimeout(r, 5000) });
            pollCount5s++;
          } else if (pollCount10s < 6) {
            await new Promise(r => { timeoutId = setTimeout(r, 10000) });
            pollCount10s++;
          } else {
            return;
          }

          if (!isMounted) return;

          const newOrderData = await fetchStatus(true, true);
          if (!isMounted) return;

          if (!newOrderData || newOrderData.status === 'processing' || newOrderData.status === 'pending') {
            pollLoop();
          }
        };

        pollLoop();
      }
    };

    startPolling();

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [orderId])

  useEffect(() => {
    // Prevent user from clicking Back and returning to the payment gateway
    window.history.pushState(null, '', window.location.href)
    const handlePopState = () => {
      navigate('/', { replace: true })
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [navigate])

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const d = new Date(dateString)
    const day = d.getDate().toString().padStart(2, '0')
    const month = d.toLocaleString('en-US', { month: 'short' })
    const time = d.toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
    return `${day} ${month}, ${time}`
  }

  if (loading) {
    return (
      <section className='wrapper pb-5' style={{ paddingTop: '50px', minHeight: '100vh' }}>
        <div className='container text-center'>
          <div className='spinner-border' style={{ color: '#008ad8', width: '3rem', height: '3rem' }} role='status' />
          <p className='mt-3 text-muted' style={{ fontWeight: 500 }}>Loading order details...</p>
        </div>
      </section>
    )
  }

  if (error || !order) {
    return (
      <section className='wrapper pb-5' style={{ paddingTop: '100px', minHeight: '100vh' }}>
        <div className='container text-center'>
          <div style={{
            width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(231,76,60,0.1)', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem'
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#e74c3c" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </div>
          <h4 style={{ color: '#e74c3c', fontWeight: 700 }}>Error</h4>
          <p className='text-muted'>{error}</p>
          <button className='btn btn-pay mt-3 px-4 py-2' style={{ backgroundColor: '#008ad8', color: '#fff', borderRadius: '8px', fontWeight: 600 }} onClick={() => navigate('/')}>Go Back Home</button>
        </div>
      </section>
    )
  }

  // extract playerId and server from description if present
  let descriptionObj = {}
  try {
    if (order.description) {
      if (typeof order.description === 'string' && order.description.startsWith('{')) {
        descriptionObj = JSON.parse(order.description)
      }
    }
  } catch (e) {
    console.error('Failed to parse description JSON', e)
  }

  const rawProductName = order.items?.[0]?.itemName || 'Product Item'
  const productName = rawProductName.split(' - ')[0]
  const isCompleted = order.status === 'completed'
  const isFailed = order.status === 'failed'
  const orderGameId = order?.gameId || order?.game?._id || order?.items?.[0]?.gameId
  const orderMappedGameId = orderId ? localStorage.getItem(`orderGameMap:${orderId}`) : null
  const fallbackGameId = localStorage.getItem('lastGameProductId')
  const resolvedGameId = returnGameIdFromQuery || orderGameId || orderMappedGameId || fallbackGameId
  const continueShoppingPath = resolvedGameId ? `/game/${resolvedGameId}` : '/'

  const handleContinueShopping = () => {
    if (resolvedGameId) {
      localStorage.setItem('lastGameProductId', resolvedGameId)
    }
    navigate(continueShoppingPath)
  }

  return (
    <section className='wrapper pb-5' style={{ marginTop: '30px', minHeight: '100vh' }}>
      <div className='container d-flex flex-column align-items-center'>

        {/* Icon and Title */}
        <div className='text-center mb-4'>
          {isCompleted && (
            <div style={{
              width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(0,138,216,0.1)', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem'
            }}>
              <div style={{
                width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#008ad8', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,138,216,0.3)'
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
            </div>
          )}
          {isFailed && (
            <div style={{
              width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(231,76,60,0.1)', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem'
            }}>
              <div style={{
                width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#e74c3c', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(231, 76, 60, 0.3)'
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </div>
            </div>
          )}
          {!isCompleted && !isFailed && (
            <div style={{
              width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(243,156,18,0.1)', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem'
            }}>
              <div style={{
                width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#f39c12', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(243, 156, 18, 0.3)'
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
              </div>
            </div>
          )}

          <h2 style={{ fontWeight: 800, marginBottom: '0.4rem', fontSize: '28px' }}>
            {isCompleted ? 'Order Completed' : isFailed ? 'Order Failed' : 'Order Pending'}
          </h2>
          <p className='text-muted' style={{ fontSize: '15px', fontWeight: 500 }}>
            {isCompleted ? 'Thank you for your purchase!' : isFailed ? 'Your payment could not be processed.' : 'Your order is currently being processed.'}
          </p>
        </div>

        {/* Receipt Card */}
        <div className='card border-0' style={{
          width: '100%', maxWidth: '440px', borderRadius: '16px', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', padding: '2rem'
        }}>
          <div className='d-flex justify-content-between align-items-start mb-4'>
            <div style={{ paddingRight: '1rem' }}>
              <p className='text-muted mb-1' style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>Receipt</p>
              <h5 style={{ fontWeight: 700, lineHeight: '1.4', margin: 0, fontSize: '18px' }}>
                {productName} {order.items?.length > 1 && `+ ${order.items.length - 1} more`}
              </h5>
            </div>
            <div style={{
              background: isCompleted ? 'rgba(0,138,216,0.1)' : isFailed ? 'rgba(231,76,60,0.1)' : 'rgba(243,156,18,0.1)',
              color: isCompleted ? '#008ad8' : isFailed ? '#e74c3c' : '#f39c12',
              padding: '6px 14px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px'
            }}>
              {isCompleted ? 'Paid' : order.status}
            </div>
          </div>

          {/* Grid */}
          <div className='row gy-4 mb-4'>
            <div className='col-6'>
              <p className='text-muted mb-1' style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Order ID</p>
              <p className='mb-0' style={{ fontWeight: 600, fontSize: '13.5px' }}>#{orderId}</p>
            </div>
            <div className='col-6 text-end'>
              <p className='text-muted mb-1' style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Date</p>
              <p className='mb-0' style={{ fontWeight: 600, fontSize: '13.5px' }}>{formatDate(order.createdAt)}</p>
            </div>

            <div className='col-12 my-1'>
              <hr style={{ borderStyle: 'solid', borderColor: 'rgba(128,128,128,0.2)', margin: '0' }} />
            </div>

            <div className='col-6'>
              <p className='text-muted mb-1' style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Player ID</p>
              <p className='mb-0' style={{ fontWeight: 600, fontSize: '13.5px' }}>{descriptionObj.playerId || 'N/A'}</p>
            </div>
            <div className='col-6 text-end'>
              <p className='text-muted mb-1' style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Server</p>
              <p className='mb-0' style={{ fontWeight: 600, fontSize: '13.5px' }}>{descriptionObj.server || 'N/A'}</p>
            </div>
            <div className='col-6'>
              <p className='text-muted mb-1' style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Country</p>
              <p className='mb-0' style={{ fontWeight: 600, fontSize: '13.5px' }}>{order.country || 'India'}</p>
            </div>
            <div className='col-6 text-end'>
              <p className='text-muted mb-1' style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Payment Method</p>
              <p className='mb-0' style={{ fontWeight: 600, fontSize: '13.5px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                <span style={{ color: '#008ad8', fontSize: '14px', lineHeight: 1 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                    <line x1="1" y1="10" x2="23" y2="10"></line>
                  </svg>
                </span>
                {order.paymentMethod || 'NMH Coins'}
              </p>
            </div>
          </div>

          {/* Total Amount Box */}
          <div style={{
            background: 'rgba(128,128,128,0.08)', borderRadius: '12px', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem'
          }}>
            <span style={{ fontWeight: 700, fontSize: '15px' }}>Total Amount</span>
            <span style={{ fontWeight: 800, color: '#008ad8', fontSize: '20px' }}>MMK{order.amount || '0.00'}</span>
          </div>

        </div>

        {/* Actions */}
        <div className='d-flex flex-column flex-sm-row gap-3 justify-content-center mt-4' style={{ width: '100%', maxWidth: '440px' }}>
          <button
            className='btn btn-pay btn-outline px-4 py-2'
            style={{
              flex: 1,
              backgroundColor: 'transparent',
              color: '#008ad8',
              border: '2px solid rgba(0,138,216,0.2)',
              borderRadius: '10px',
              fontWeight: 600,
              padding: '12px 0'
            }}
            onClick={() => fetchStatus(true, false)}
            disabled={refreshing}
          >
            {refreshing ? (
              <span className='d-flex align-items-center justify-content-center'>
                <span className='spinner-border spinner-border-sm me-2' role='status' aria-hidden='true'></span>
                Refreshing...
              </span>
            ) : 'Refresh Status'}
          </button>
          <button
            className='btn btn-pay px-4 py-2'
            style={{
              flex: 1,
              backgroundColor: '#008ad8',
              color: '#fff',
              border: '2px solid #008ad8',
              borderRadius: '10px',
              fontWeight: 600,
              padding: '12px 0'
            }}
            onClick={handleContinueShopping}
          >
            Continue Shopping
          </button>
        </div>

      </div>
    </section>
  )
}
