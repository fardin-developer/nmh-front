import React, { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Modal } from 'react-bootstrap'
import Swal from 'sweetalert2'
import { useSelector } from 'react-redux'
import { getDiamondPacks, validatePlayerId, createWalletOrder, createGatewayOrder, getValidationHistory, getOrderStatus } from '../../api/apiService'
import { useInvoiceDownloader } from '../../hooks/useInvoiceDownloader'

export default function GameProduct() {
  const { gameId } = useParams()
  const navigate = useNavigate()
  const isLoggedIn = !!localStorage.getItem('authToken')

  const [gameData, setGameData] = useState(null)
  const [diamondPacks, setDiamondPacks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [selectedPack, setSelectedPack] = useState(null)
  const [playerId, setPlayerId] = useState('')
  const [server, setServer] = useState('')
  const [infomodal, setInfomodal] = useState(false)
  const [activeCategory, setActiveCategory] = useState('All')
  const [isValidating, setIsValidating] = useState(false)
  const [validatedPlayer, setValidatedPlayer] = useState(null)
  const [isValidatingPlayer, setIsValidatingPlayer] = useState(false)
  const [validationMsg, setValidationMsg] = useState('')
  const [validationHistory, setValidationHistory] = useState([])
  const [directCheckout, setDirectCheckout] = useState(true)
  const [selectedGateway, setSelectedGateway] = useState('') // 'wavepay' | 'yomabank' | '' (wallet)
  const [historyModal, setHistoryModal] = useState(false)
  const [checkoutSheetOpen, setCheckoutSheetOpen] = useState(false)
  const [successOrderData, setSuccessOrderData] = useState(null)
  const profileData = useSelector((state) => state.profileData)
  const { downloadingInvoice, downloadPurchaseInvoice } = useInvoiceDownloader()
  const skipValidationRef = useRef(false)

  // Polling order status for Wallet Orders
  useEffect(() => {
    const orderId = successOrderData?.orderId || successOrderData?.order?._id
    const currentStatus = successOrderData?.order?.status?.toLowerCase()

    // Only start polling if we have an order and it's processing
    if (!orderId || (currentStatus !== 'processing' && currentStatus !== 'pending')) {
      return
    }

    let pollCount = 0
    let timeoutId = null
    let isMounted = true

    const checkStatus = async () => {
      if (!isMounted) return

      try {
        const res = await getOrderStatus(orderId)
        if (res.success && res.order) {
          setSuccessOrderData(prev => {
            if (!prev) return prev
            // Update order details
            return {
              ...prev,
              order: {
                ...prev.order,
                ...res.order
              }
            }
          })

          const newStatus = res.order.status?.toLowerCase()
          if (newStatus !== 'processing' && newStatus !== 'pending') {
            return // Stop polling if status is no longer processing
          }
        }
      } catch (err) {
        console.error('Failed to fetch order status', err)
      }

      pollCount++
      if (pollCount < 12 && isMounted) {
        // First 6 times: 5s, next 6 times: 10s
        const delay = pollCount < 6 ? 5000 : 10000
        timeoutId = setTimeout(checkStatus, delay)
      }
    }

    timeoutId = setTimeout(checkStatus, 5000)

    return () => {
      isMounted = false
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [successOrderData?.orderId, successOrderData?.order?._id])

  useEffect(() => {
    const fetchDiamondPacks = async () => {
      try {
        setLoading(true)
        const result = await getDiamondPacks(gameId)
        if (result.success) {
          setGameData(result.gameData)
          const activePacks = result.diamondPacks.filter((p) => p.status === 'active')
          setDiamondPacks(activePacks)
          document.title = `NMH Gaming - ${result.gameData?.name || 'Game'}`
        } else {
          setError('Failed to load diamond packs.')
        }
      } catch (err) {
        console.error(err)
        setError('Something went wrong. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    if (gameId) fetchDiamondPacks()
  }, [gameId])

  useEffect(() => {
    if (isLoggedIn && gameId) {
      const fetchHistory = async () => {
        try {
          const res = await getValidationHistory(gameId)
          if (res.success && res.validationHistory?.length > 0) {
            const sorted = [...res.validationHistory].sort(
              (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
            )
            setValidationHistory(sorted)

            // Auto-fill the latest one
            const latest = sorted[0]
            skipValidationRef.current = false
            setPlayerId(String(latest.playerId || '').replace(/[^0-9]/g, ''))
            setServer(latest.server || '')
            setValidationMsg('')
            setValidatedPlayer(null)
          }
        } catch (e) {
          console.error('Failed to fetch validation history', e)
        }
      }
      fetchHistory()
    }
  }, [isLoggedIn, gameId])

  const hasPlayerIdField = gameData?.validationFields?.includes('playerId')
  const hasServerField = gameData?.validationFields?.includes('server')
  const regionList = gameData?.regionList
  const hasRegionList = Array.isArray(regionList) && regionList.length > 0

  const resolveServerLabel = (value) => {
    if (!value) return ''
    if (!hasRegionList) return value
    const match = regionList.find((r) => r.code === value)
    return match?.name || value
  }
  // cashback is discount
  // directCheckout = true means gateway payment (wavepay/yomabank), false = wallet
  const payableAmount = selectedPack
    ? (!directCheckout && selectedPack.cashback > 0
      ? Math.max(0, selectedPack.amount - selectedPack.cashback)
      : selectedPack.amount)
    : 0
  const canCheckout = !(isValidatingPlayer || isValidating) && (directCheckout ? !!selectedGateway : true)

  useEffect(() => {
    if (!gameData) return

    if (hasPlayerIdField && !playerId.trim()) {
      setValidatedPlayer(null)
      setValidationMsg('')
      return
    }
    if (hasServerField && !server.trim()) {
      setValidatedPlayer(null)
      setValidationMsg('')
      return
    }

    if (skipValidationRef.current) {
      return
    }

    const abortController = new AbortController()
    const signal = abortController.signal

    const validate = async () => {
      setIsValidatingPlayer(true)
      setValidationMsg('')
      setValidatedPlayer(null)

      try {
        const gameCode = gameData?.ogcode || gameData?.name
        const result = await validatePlayerId(gameCode, gameId, playerId, server, signal)

        if (signal.aborted) return

        if (result.valid) {
          setValidatedPlayer({ ...result, _pid: playerId, _srv: server })
        } else {
          setValidationMsg(result.msg || 'Invalid Player Details')
        }
        setIsValidatingPlayer(false)
      } catch (err) {
        if (err.name === 'AbortError' || signal.aborted) return

        setValidationMsg('Error validating player details')
        setIsValidatingPlayer(false)
      }
    }

    const timeout = setTimeout(() => {
      validate()
    }, 600)

    return () => {
      clearTimeout(timeout)
      abortController.abort()
    }
  }, [playerId, server, hasPlayerIdField, hasServerField, gameData, gameId])

  const handleProceed = async () => {
    if (!selectedPack) {
      Swal.fire({ icon: 'warning', title: '', text: 'Please select a package.', confirmButtonColor: '#FF0000' })
      return
    }
    if (hasPlayerIdField && !playerId.trim()) {
      Swal.fire({ icon: 'warning', title: '', text: 'Please enter your Player ID.', confirmButtonColor: '#FF0000' })
      return
    }
    if (hasServerField && !server.trim()) {
      Swal.fire({
        icon: 'warning',
        title: '',
        text: hasRegionList ? 'Please select your server / region.' : 'Please enter your Server/Zone ID.',
        confirmButtonColor: '#FF0000',
      })
      return
    }

    // Validate player ID and confirm
    if (hasPlayerIdField) {
      if (isValidatingPlayer) {
        Swal.fire({ icon: 'info', title: '', text: 'Validating player details, please wait...', confirmButtonColor: '#FF0000' })
        return
      }

      let result = validatedPlayer
      // If validation result is missing or doesn't match current input, re-validate
      if (!result || result._pid !== playerId || result._srv !== server) {
        setIsValidating(true)
        try {
          const gameCode = gameData?.ogcode || gameData?.name
          result = await validatePlayerId(gameCode, gameId, playerId, server)

          if (!result.valid) {
            Swal.fire({
              icon: 'error',
              title: 'Invalid Player',
              text: result.msg || 'Player ID or Server could not be validated.',
              confirmButtonColor: '#FF0000'
            })
            setIsValidating(false)
            return
          }
        } catch (err) {
          Swal.fire({ icon: 'error', title: 'Error', text: 'Something went wrong during player validation.', confirmButtonColor: '#FF0000' })
          setIsValidating(false)
          return
        }
        setIsValidating(false)
      }

    }

    if (!localStorage.getItem('authToken')) {
      navigate('/send-otp')
      return
    }

    if (!directCheckout) {
      setIsValidating(true)
      try {
        const orderRes = await createWalletOrder(selectedPack._id, playerId, server, 1)
        if (orderRes.success) {
          setCheckoutSheetOpen(false)
          setSuccessOrderData(orderRes)
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Order Failed',
            text: orderRes.message || 'Payment failed.',
            confirmButtonColor: '#e74c3c'
          })
        }
      } catch (err) {
        Swal.fire({ icon: 'error', title: 'Error', text: 'Something went wrong during payment.', confirmButtonColor: '#e74c3c' })
      }
      setIsValidating(false)
    } else {
      // Gateway payment (wavepay / yomabank)
      if (!selectedGateway) {
        Swal.fire({ icon: 'warning', title: '', text: 'Please choose a payment gateway.', confirmButtonColor: '#FF0000' })
        return
      }
      setIsValidating(true)
      try {
        const redirectUrl = `${window.location.origin}/order-status#returnGameId=${encodeURIComponent(gameId)}`
        const orderRes = await createGatewayOrder(selectedPack._id, playerId, server, 1, selectedGateway, redirectUrl)
        if (orderRes.success && orderRes.transaction?.paymentUrl) {
          const createdOrderId =
            orderRes?.orderId ||
            orderRes?.order?._id ||
            orderRes?.transaction?.orderId ||
            orderRes?.transaction?.order_id ||
            orderRes?.transaction?.client_txn_id

          if (gameId) {
            localStorage.setItem('lastGameProductId', gameId)
          }
          if (gameId && createdOrderId) {
            localStorage.setItem(`orderGameMap:${createdOrderId}`, gameId)
          }
          window.location.href = orderRes.transaction.paymentUrl
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Payment Failed',
            text: orderRes.message || 'Failed to initialize payment.',
            confirmButtonColor: '#e74c3c'
          })
        }
      } catch (err) {
        Swal.fire({ icon: 'error', title: 'Error', text: 'Something went wrong during payment initialization.', confirmButtonColor: '#e74c3c' })
      }
      setIsValidating(false)
    }
  }

  if (loading) {
    return (
      <section className='wrapper product home-app-page' style={{ minHeight: '80vh' }}>
        <div className='container'>
          <div className='row g-md-5 g-3'>
            {/* Left Column Skeleton */}
            <div className='col-lg col-lg-340 p-0'>
              <div className='game-imgbox placeholder-glow'>
                <div className='placeholder w-100 h-100 bg-secondary' style={{ borderRadius: '8px', opacity: 0.2 }}></div>
              </div>

              <div className='game-content'>
                <div className='mt-3 d-flex placeholder-glow'>
                  <div className='game-smimgbox me-md-3 me-2 border-0' style={{ background: 'transparent' }}>
                    <div className='placeholder w-100 h-100 bg-secondary' style={{ borderRadius: '8px', opacity: 0.2 }}></div>
                  </div>
                  <div className='w-100 pt-1'>
                    <div className='placeholder col-8 mb-2 bg-secondary' style={{ height: '20px', borderRadius: '4px', opacity: 0.2 }}></div>
                    <div className='d-flex mt-2 align-items-center'>
                      <div className='placeholder col-10 bg-secondary' style={{ height: '14px', borderRadius: '4px', opacity: 0.2 }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column Skeleton */}
            <div className='col-lg content-wrapper placeholder-glow'>
              <div className='d-flex align-items-center justify-content-between pb-md-3 pb-2'>
                <div className='placeholder col-4 bg-secondary' style={{ height: '24px', borderRadius: '4px', opacity: 0.2 }}></div>
                <div className='placeholder bg-secondary' style={{ width: '24px', height: '24px', borderRadius: '50%', opacity: 0.2 }}></div>
              </div>

              <div className='row row-cols-1 row-cols-md-2 g-md-3 g-2 mb-4'>
                <div className='col'>
                  <div className='placeholder col-3 mb-2 bg-secondary' style={{ height: '16px', borderRadius: '4px', opacity: 0.2 }}></div>
                  <div className='placeholder w-100 bg-secondary' style={{ height: '56px', borderRadius: '8px', opacity: 0.15, border: '2px solid #c3d6e4' }}></div>
                </div>
                <div className='col'>
                  <div className='placeholder col-4 mb-2 bg-secondary' style={{ height: '16px', borderRadius: '4px', opacity: 0.2 }}></div>
                  <div className='placeholder w-100 bg-secondary' style={{ height: '56px', borderRadius: '8px', opacity: 0.15, border: '2px solid #c3d6e4' }}></div>
                </div>
              </div>

              <div className='placeholder col-3 mt-4 mb-3 bg-secondary' style={{ height: '24px', borderRadius: '4px', opacity: 0.2 }}></div>

              <div className='d-flex flex-wrap gap-2 mb-3'>
                {[1, 2, 3].map((i) => (
                  <div key={i} className='placeholder bg-secondary' style={{ width: '60px', height: '28px', borderRadius: '20px', opacity: 0.2 }}></div>
                ))}
              </div>

              <div className='row row-cols-2 row-cols-md-3 g-md-3 g-2 pt-md-2 pb-4'>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div className='col' key={i}>
                    <div className='card-label' style={{ cursor: 'default' }}>
                      <div className='cl-content min-h132px w-100 position-relative' style={{ background: '#fff', border: '2px solid #eaecf0' }}>
                        <div className='cl-title w-100'>
                          <div className='placeholder col-9 mb-2 bg-secondary' style={{ height: '16px', borderRadius: '4px', opacity: 0.15 }}></div>
                          <br />
                          <div className='placeholder col-6 bg-secondary' style={{ height: '12px', borderRadius: '4px', opacity: 0.15 }}></div>
                        </div>
                        <div className='cl-icon position-absolute' style={{ right: '15px', top: '50%', transform: 'translateY(-50%)' }}>
                          <div className='placeholder bg-secondary' style={{ width: '48px', height: '48px', borderRadius: '50%', opacity: 0.15 }}></div>
                        </div>
                        <div className='cl-price mt-4'>
                          <div className='placeholder col-5 bg-secondary' style={{ height: '18px', borderRadius: '4px', opacity: 0.15 }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className='product'>
        <div className='container'>
          <div className='d-flex justify-content-center align-items-center' style={{ minHeight: '60vh' }}>
            <div className='text-center'>
              <p style={{ color: '#e74c3c' }}>{error}</p>
              <button className='btn btn-pay mt-3' onClick={() => navigate('/')}>Go Back Home</button>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <>
      <section className='wrapper product home-app-page' style={{}}>
        <div className='container'>
          <div className='row g-md-5 g-3'>
            {/* Left Column: Game Info */}
            <div className='col-lg col-lg-340 p-0'>
              <div className='game-imgbox'>
                {(() => {
                  const name = gameData?.name || ''
                  const nameLower = name.toLowerCase()
                  let localBanner = null

                  if (nameLower.startsWith('mlbb') || nameLower.startsWith('mobile legend')) {
                    localBanner = '/images/banner/mobile-legends.png'
                  } else if (nameLower.startsWith('bgmi')) {
                    localBanner = '/images/banner/bgmi.png'
                  } else if (nameLower.startsWith('valorant')) {
                    localBanner = '/images/banner/valorant.png'
                  } else if (nameLower.startsWith('pubg global')) {
                    localBanner = '/images/banner/pubg-global.png'
                  } else if (nameLower.startsWith('genshin')) {
                    localBanner = '/images/banner/genshin.png'
                  } else if (nameLower.startsWith('clash of clans')) {
                    localBanner = '/images/banner/coc.png'
                  } else if (nameLower.startsWith('honkai')) {
                    localBanner = '/images/banner/honkai-starrail.png'
                  } else if (nameLower.startsWith('clash royale')) {
                    localBanner = '/images/banner/clash-royale.png'
                  } else if (nameLower.startsWith('farlight')) {
                    localBanner = '/images/banner/farlight-84.png'
                  } else if (nameLower.startsWith('honor of kings')) {
                    localBanner = '/images/banner/honor-of-kings.png'
                  } else if (nameLower.startsWith('super sus')) {
                    localBanner = '/images/banner/super-sus.png'
                  } else if (nameLower.startsWith('brawl stars')) {
                    localBanner = '/images/banner/brawl-stars.png'
                  } else if (nameLower.startsWith('dos')) {
                    localBanner = '/images/banner/dos.png'
                  }

                  return <img src={localBanner || gameData?.coverImage || gameData?.image} alt={name || 'game'} />
                })()}
              </div>

              <div className='game-content'>
                <div className='mt-3 d-flex'>
                  <div className='game-smimgbox me-md-3 me-2'>
                    <img src={gameData?.image} alt={gameData?.name || 'game'} className='game-smimg' />
                  </div>
                  <div>
                    <h6 className='game-heading'>{gameData?.name}</h6>

                    <div className='d-flex align-items-center pt-md-2'>
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
              {(hasPlayerIdField || hasServerField) && (
                <>
                  <div className='d-flex align-items-center justify-content-between pb-md-3 pb-2 gap-2'>
                    <div className='d-flex align-items-center min-w-0'>
                      <h5 className='details-heading m-0'>1. Enter Account Details</h5>
                      <button type='button' className='question-btn flex-shrink-0' onClick={() => setInfomodal(true)}>
                        <svg className='icon'>
                          <use href='#icon_question'></use>
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className='row row-cols-1 row-cols-md-2 g-md-3 g-2'>
                    {hasPlayerIdField && (
                      <div className='col'>
                        <label htmlFor='playerId' className='form-label input-label pb-md-1 mb-md-1 p-0 m-0'>
                          Player ID
                        </label>
                        <div className="position-relative">
                          <input
                            type='tel'
                            inputMode='numeric'
                            pattern='[0-9]*'
                            autoComplete='off'
                            name='playerId'
                            id='playerId'
                            placeholder='Enter Player ID'
                            value={playerId}
                            onChange={(e) => {
                              const numericOnly = e.target.value.replace(/[^0-9]/g, '')
                              skipValidationRef.current = false
                              setPlayerId(numericOnly)
                            }}
                            className={`form-control form-control-lg input-box`}
                            style={{ paddingRight: validationHistory.length > 0 ? '45px' : '15px' }}
                          />
                          {validationHistory.length >= 0 && (
                            <button
                              type='button'
                              className='btn position-absolute'
                              onClick={() => setHistoryModal(true)}
                              style={{
                                right: '5px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                padding: '5px',
                                background: 'transparent',
                                border: 'none',
                                color: '#FF0000',
                                display: 'flex',
                                alignItems: 'center'
                              }}
                              title="Select from History"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-clock-history" viewBox="0 0 16 16">
                                <path d="M8.515 1.019A7 7 0 0 0 8 1V0a8 8 0 0 1 .589.022zm2.004.45a7 7 0 0 0-.985-.299l.219-.976q.576.129 1.126.342zm1.37.71a7 7 0 0 0-.439-.27l.493-.87a8 8 0 0 1 .979.654l-.615.789a7 7 0 0 0-.418-.302zm1.834 1.79a7 7 0 0 0-.653-.796l.724-.69q.406.429.747.91zm.744 1.352a7 7 0 0 0-.214-.468l.893-.45a8 8 0 0 1 .45 1.088l-.95.313a7 7 0 0 0-.179-.483m.53 2.507a7 7 0 0 0-.1-1.025l.985-.17q.1.58.116 1.17zm-.131 1.538q.05-.254.081-.51l.993.123a8 8 0 0 1-.23 1.155l-.964-.267q.069-.247.12-.501m-.952 2.379q.276-.436.486-.908l.914.405q-.24.54-.555 1.038zm-.964 1.205q.183-.183.35-.378l.758.653a8 8 0 0 1-.401.432z" />
                                <path d="M8 1a7 7 0 1 0 4.95 11.95l.707.707A8.001 8.001 0 1 1 8 0z" />
                                <path d="M7.5 3a.5.5 0 0 1 .5.5v5.21l3.248 1.856a.5.5 0 0 1-.496.868l-3.5-2A.5.5 0 0 1 7 9V3.5a.5.5 0 0 1 .5-.5" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                    {hasServerField && hasRegionList && (
                      <div className='col'>
                        <label htmlFor='serverId' className='form-label input-label pb-md-1 mb-md-1 p-0 m-0'>
                          Server / Region
                        </label>
                        <select
                          name='serverId'
                          id='serverId'
                          value={server}
                          onChange={(e) => {
                            skipValidationRef.current = false
                            setServer(e.target.value)
                          }}
                          className='form-control form-control-lg input-box'
                        >
                          <option value=''>Select server / region</option>
                          {regionList.map((r) => (
                            <option key={r.code} value={r.code}>
                              {r.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    {hasServerField && !hasRegionList && (
                      <div className='col'>
                        <label htmlFor='serverId' className='form-label input-label pb-md-1 mb-md-1 p-0 m-0'>
                          Server / Zone ID
                        </label>
                        <input
                          type='tel'
                          inputMode='numeric'
                          pattern='[0-9]*'
                          autoComplete='off'
                          name='serverId'
                          id='serverId'
                          placeholder='Enter Server / Zone ID'
                          value={server}
                          onChange={(e) => {
                            const numericOnly = e.target.value.replace(/[^0-9]/g, '')
                            skipValidationRef.current = false
                            setServer(numericOnly)
                          }}
                          className={`form-control form-control-lg input-box`}
                        />
                      </div>
                    )}
                  </div>

                  {isValidatingPlayer && (
                    <div className='d-flex align-items-center check-name'>
                      <span className='spinner-border spinner-border-sm me-2' style={{ color: '#ffc107' }} role='status' aria-hidden='true' />
                      <span style={{ color: '#ffc107' }}>Validating player details...</span>
                    </div>
                  )}

                  {validatedPlayer && (
                    <div className='d-flex align-items-center check-name'>
                      <svg className='icon me-1'>
                        <use href='#icon_check'></use>
                      </svg>
                      <span>
                        {validatedPlayer.name} {validatedPlayer.server && `(${validatedPlayer.server})`}
                      </span>
                    </div>
                  )}

                  {validationMsg && (
                    <div className='d-flex align-items-center check-name'>
                      <svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='currentColor' className='icon icon-tabler icons-tabler-filled icon-tabler-xbox-x me-2'>
                        <path stroke='none' d='M0 0h24v24H0z' fill='none' />
                        <path d='M12 2c5.523 0 10 4.477 10 10s-4.477 10 -10 10s-10 -4.477 -10 -10s4.477 -10 10 -10m3.6 5.2a1 1 0 0 0 -1.4 .2l-2.2 2.933l-2.2 -2.933a1 1 0 1 0 -1.6 1.2l2.55 3.4l-2.55 3.4a1 1 0 1 0 1.6 1.2l2.2 -2.933l2.2 2.933a1 1 0 0 0 1.6 -1.2l-2.55 -3.4l2.55 -3.4a1 1 0 0 0 -.2 -1.4' />
                      </svg>
                      <span>{validationMsg}</span>
                    </div>
                  )}

                </>
              )}

              <h5 className='details-heading mt-4'>{hasPlayerIdField || hasServerField ? '2.' : '1.'} Select a Package</h5>

              {(() => {
                const categories = [...new Set(diamondPacks.map((p) => p.category).filter(Boolean))]
                const filtered = activeCategory === 'All' ? diamondPacks : diamondPacks.filter((p) => p.category === activeCategory)
                return (
                  <>
                    {categories.length > 1 && (
                      <div className='d-flex flex-wrap gap-2 mt-2 mb-3'>
                        {['All', ...categories].map((cat) => (
                          <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            style={{
                              padding: '4px 14px',
                              borderRadius: '20px',
                              border: activeCategory === cat ? '1.5px solid #FF0000' : '1.5px solid #333',
                              background: activeCategory === cat ? 'rgba(255,0,0,0.15)' : 'transparent',
                              color: activeCategory === cat ? '#FF0000' : '#aaa',
                              fontSize: '12px',
                              cursor: 'pointer',
                              fontWeight: activeCategory === cat ? 600 : 400,
                              transition: 'all 0.2s',
                            }}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    )}

                    <div className='row row-cols-2 row-cols-md-3 g-md-3 g-2 pt-md-4 pt-2 pb-4'>
                      {filtered.map((pack) => (
                        <div className='col' key={pack._id}>
                          <label
                            className='card-label'
                            onClick={() => {
                              setSelectedPack(pack)
                              setCheckoutSheetOpen(true)
                            }}
                          >
                            <input type='checkbox' readOnly checked={selectedPack?._id === pack._id} />
                            <div className='cl-content min-h132px'>
                              {pack.category === '2x First recharge bonus' && (
                                <div className='cl-badge'>
                                  <small>Double first time</small>
                                </div>
                              )}
                              <div className='cl-title'>
                                <h4>{pack.description}</h4>
                                <span>{pack.subDescription || ''}</span>
                              </div>
                              <div className='cl-icon'>
                                <img src={pack.logo} alt={pack.description} style={{ maxWidth: '48px', maxHeight: '48px', objectFit: 'contain' }} />
                              </div>
                              <h6 className='cl-price'>MMK{pack.amount}</h6>
                            </div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </>
                )
              })()}
            </div>
          </div>
        </div>
      </section>

      <Modal
        show={checkoutSheetOpen && !!selectedPack}
        onHide={() => setCheckoutSheetOpen(false)}
        className='gp-checkout-sheet-modal'
        contentClassName='home-app-page'
        animation={false}
        keyboard
      >
        <Modal.Body className='gp-sheet-body'>
          <div className='gp-sheet-handle' />
          <div className='gp-sheet-head'>
            <h5>Complete Purchase</h5>
            <button type='button' className='gp-sheet-close' aria-label='Close payment sheet' onClick={() => setCheckoutSheetOpen(false)}>
              &times;
            </button>
          </div>

          <div className='gp-sheet-product-card'>
            <div className='gp-sheet-product-label'>Selected Product</div>
            <h6>{selectedPack?.description}</h6>
            {selectedPack?.subDescription && <p>{selectedPack.subDescription}</p>}
            <div className='gp-sheet-price-row'>
              <span>Amount</span>
              <strong>MMK{selectedPack?.amount}</strong>
            </div>
            {!directCheckout && selectedPack?.cashback > 0 && (
              <div className='gp-sheet-price-row gp-sheet-saving'>
                <span>You Pay</span>
                <strong>MMK{payableAmount}</strong>
              </div>
            )}
          </div>

          {(hasPlayerIdField || hasServerField) && (
            <div className='gp-sheet-player-card'>
              <div className='gp-sheet-player-title'>Player Details</div>
              {hasPlayerIdField && (
                <div className='gp-sheet-player-row'>
                  <span>Player ID</span>
                  <strong>{playerId?.trim() || 'Not entered'}</strong>
                </div>
              )}
              <div className='gp-sheet-player-row'>
                <span>Player Name</span>
                <strong>{validatedPlayer?.name || 'Not validated yet'}</strong>
              </div>
              {hasServerField && (
                <div className='gp-sheet-player-row'>
                  <span>Server</span>
                  <strong>{resolveServerLabel(server?.trim()) || 'Not entered'}</strong>
                </div>
              )}
            </div>
          )}

          <div className='gp-sheet-payment'>
            <div className='gp-sheet-player-title'>Choose Payment Method</div>

            {/* NMH Coins (Wallet) */}
            <button
              type='button'
              className={`gp-sheet-method ${!directCheckout ? 'is-active' : ''}`}
              onClick={() => { setDirectCheckout(false); setSelectedGateway('') }}
            >
              <div className='gp-sheet-method-left'>
                <img src='/images/dos.svg' alt='wallet' />
                <div>
                  <h6>NMH Coins</h6>
                  {/* cashback is discount */}
                  <p>Extra savings with discount</p>
                </div>
              </div>
              <div className='gp-sheet-method-right'>
                <strong>MMK{selectedPack?.cashback ? Math.max(0, selectedPack.amount - selectedPack.cashback) : selectedPack?.amount}</strong>
                {selectedPack?.cashback > 0 && <small>Save MMK{selectedPack.cashback}</small>}
              </div>
            </button>

            {/* Wavepay Gateway */}
            <button
              type='button'
              className={`gp-sheet-method ${directCheckout && selectedGateway === 'wavepay' ? 'is-active' : ''}`}
              onClick={() => { setDirectCheckout(true); setSelectedGateway('wavepay') }}
            >
              <div className='gp-sheet-method-left'>
                <div className='gp-sheet-gateway-icon gp-gateway-wavepay'>W</div>
                <div>
                  <h6>Wavepay</h6>
                  <p>Pay via Wavepay mobile wallet</p>
                </div>
              </div>
              <div className='gp-sheet-method-right'>
                <strong>MMK{selectedPack?.amount}</strong>
              </div>
            </button>

            {/* Yoma Bank Gateway */}
            <button
              type='button'
              className={`gp-sheet-method ${directCheckout && selectedGateway === 'yomabank' ? 'is-active' : ''}`}
              onClick={() => { setDirectCheckout(true); setSelectedGateway('yomabank') }}
            >
              <div className='gp-sheet-method-left'>
                <div className='gp-sheet-gateway-icon gp-gateway-yoma'>Y</div>
                <div>
                  <h6>Yoma Bank</h6>
                  <p>Pay via Yoma Bank transfer</p>
                </div>
              </div>
              <div className='gp-sheet-method-right'>
                <strong>MMK{selectedPack?.amount}</strong>
              </div>
            </button>
          </div>

          <div className='gp-sheet-footer'>
            {!isLoggedIn ? (
              <button
                type='button'
                className='btn gp-sheet-login-btn'
                onClick={() => navigate('/send-otp')}
              >
                Login to Continue
              </button>
            ) : (
              <button
                type='button'
                className='btn gp-sheet-pay-btn'
                disabled={!canCheckout}
                onClick={handleProceed}
              >
                {isValidating ? (
                  <>
                    <span className='spinner-border spinner-border-sm me-2' role='status' aria-hidden='true'></span>
                    Processing...
                  </>
                ) : (
                  directCheckout
                    ? (selectedGateway ? `Pay MMK${payableAmount} via ${selectedGateway === 'wavepay' ? 'Wavepay' : 'Yoma Bank'}` : 'Select a Payment Gateway')
                    : `Pay MMK${payableAmount} with NMH Coins`
                )}
              </button>
            )}
          </div>
        </Modal.Body>
      </Modal>

      <Modal centered show={infomodal} onHide={() => setInfomodal(false)} className='detail-modal' contentClassName='home-app-page'>
        <Modal.Header closeButton className='border-0'></Modal.Header>
        <Modal.Body className='p-md-4 p-3 pt-0'>
          <p className='mb-0'>
            To find your User ID, click on the profile menu in the top left corner of the game&apos;s main menu. The ID will be listed as, for example, 123456789(12345). Enter 123456789 in the User ID field and 12345 in the Zone ID field.
          </p>
          <img
            src='/images/info/mobile-legends.svg'
            alt='Where to find User ID and Zone ID in Mobile Legends'
            className='w-100 mt-3 rounded'
          />
        </Modal.Body>
      </Modal>

      <Modal centered show={historyModal} onHide={() => setHistoryModal(false)} className='detail-modal' contentClassName='home-app-page'>
        <Modal.Header closeButton className='border-0 pb-0'>
          <Modal.Title style={{ fontSize: '20px', color: '#fff', fontWeight: 700, letterSpacing: '0.5px' }}>
            <div className="d-flex align-items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="#FF0000" className="bi bi-clock-history me-2" viewBox="0 0 16 16">
                <path d="M8.515 1.019A7 7 0 0 0 8 1V0a8 8 0 0 1 .589.022zm2.004.45a7 7 0 0 0-.985-.299l.219-.976q.576.129 1.126.342zm1.37.71a7 7 0 0 0-.439-.27l.493-.87a8 8 0 0 1 .979.654l-.615.789a7 7 0 0 0-.418-.302zm1.834 1.79a7 7 0 0 0-.653-.796l.724-.69q.406.429.747.91zm.744 1.352a7 7 0 0 0-.214-.468l.893-.45a8 8 0 0 1 .45 1.088l-.95.313a7 7 0 0 0-.179-.483m.53 2.507a7 7 0 0 0-.1-1.025l.985-.17q.1.58.116 1.17zm-.131 1.538q.05-.254.081-.51l.993.123a8 8 0 0 1-.23 1.155l-.964-.267q.069-.247.12-.501m-.952 2.379q.276-.436.486-.908l.914.405q-.24.54-.555 1.038zm-.964 1.205q.183-.183.35-.378l.758.653a8 8 0 0 1-.401.432z" />
                <path d="M8 1a7 7 0 1 0 4.95 11.95l.707.707A8.001 8.001 0 1 1 8 0z" />
                <path d="M7.5 3a.5.5 0 0 1 .5.5v5.21l3.248 1.856a.5.5 0 0 1-.496.868l-3.5-2A.5.5 0 0 1 7 9V3.5a.5.5 0 0 1 .5-.5" />
              </svg>
              Recent Accounts
            </div>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className='p-md-4 p-3 pt-3'>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', marginBottom: '16px' }}>Select an account from your recent purchases to auto-fill the details.</p>
          <div className='d-flex flex-column gap-2'>
            {validationHistory.map((item) => (
              <div
                key={item._id}
                onClick={() => {
                  const newPlayerId = String(item.playerId || '').replace(/[^0-9]/g, '')
                  const newServer = item.server || ''

                  if (playerId === newPlayerId && (!hasServerField || server === newServer)) {
                    setHistoryModal(false)
                    return
                  }

                  skipValidationRef.current = false
                  setPlayerId(newPlayerId)
                  if (hasServerField) setServer(newServer)
                  setValidationMsg('')
                  setValidatedPlayer(null)
                  setHistoryModal(false)
                }}
                style={{
                  background: '#242730',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '12px',
                  padding: '10px 12px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 6px 15px rgba(255, 0, 0, 0.1)'
                  e.currentTarget.style.border = '1px solid rgba(255, 0, 0, 0.3)'
                  e.currentTarget.style.background = 'rgba(255,0,0,0.18)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.03)'
                  e.currentTarget.style.border = '1px solid rgba(255,255,255,0.08)'
                  e.currentTarget.style.background = '#242730'
                }}
              >
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'rgba(255, 0, 0, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  color: '#FF0000'
                }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" className="bi bi-person-fill" viewBox="0 0 16 16">
                    <path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H3zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
                  </svg>
                </div>
                <div className="flex-grow-1">
                  <div style={{ fontWeight: 600, color: '#fff', fontSize: '14px', letterSpacing: '0.2px', marginBottom: '2px' }}>{item.playerName}</div>
                  <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <span style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', whiteSpace: 'nowrap' }}>ID: {item.playerId}</span>
                    {item.server && <span style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', whiteSpace: 'nowrap' }}>Server: {resolveServerLabel(item.server)}</span>}
                  </div>
                </div>
                <div style={{ color: '#FF0000', opacity: 0.8 }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" className="bi bi-arrow-right-circle-fill" viewBox="0 0 16 16">
                    <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0zM4.5 7.5a.5.5 0 0 0 0 1h5.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3a.5.5 0 0 0 0-.708l-3-3a.5.5 0 1 0-.708.708L10.293 7.5H4.5z" />
                  </svg>
                </div>
              </div>
            ))}
          </div>

          <div className='d-flex gap-2 mt-4 pt-3' style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <button
              type="button"
              className='btn flex-grow-1'
              onClick={() => setHistoryModal(false)}
              style={{
                background: '#242730',
                color: 'rgba(255,255,255,0.8)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px',
                padding: '8px 16px',
                fontWeight: 500,
                fontSize: '14px',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#242730'; }}
            >
              Cancel
            </button>
            <button
              type="button"
              className='btn flex-grow-1'
              onClick={() => {
                skipValidationRef.current = false
                setPlayerId('')
                if (hasServerField) setServer('')
                setValidationMsg('')
                setValidatedPlayer(null)
                setHistoryModal(false)
              }}
              style={{
                background: '#FF0000',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                fontWeight: 500,
                fontSize: '14px',
                boxShadow: '0 2px 6px rgba(255, 0, 0, 0.2)',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#007bb5'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#FF0000'}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" className="bi bi-pencil-square" viewBox="0 0 16 16">
                <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z" />
                <path fillRule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5v11z" />
              </svg>
              Enter Manually
            </button>
          </div>
        </Modal.Body>
      </Modal>

      <Modal centered show={!!successOrderData} onHide={() => setSuccessOrderData(null)} backdrop="static" keyboard={false} contentClassName='home-app-page'>
        <Modal.Body className="p-4 text-center position-relative">
          <button
            type="button"
            className="btn-close position-absolute top-0 end-0 m-3"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='%23dc3545'%3e%3cpath d='M.293.293a1 1 0 0 1 1.414 0L8 6.586 14.293.293a1 1 0 1 1 1.414 1.414L9.414 8l6.293 6.293a1 1 0 0 1-1.414 1.414L8 9.414l-6.293 6.293a1 1 0 0 1-1.414-1.414L6.586 8 .293 1.707a1 1 0 0 1 0-1.414z'/%3e%3c/svg%3e")`,
              opacity: 1
            }}
            onClick={() => setSuccessOrderData(null)}
          ></button>

          {(() => {
            const status = successOrderData?.order?.status?.toLowerCase() || 'processing'
            if (status === 'failed' || status === 'refunded') {
              return (
                <>
                  <div className="mx-auto mb-3 mt-2" style={{ width: '64px', height: '64px', backgroundColor: '#f8d7da', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="10" fill="#dc3545" />
                      <path d="M15 9L9 15M9 9L15 15" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <h3 className="fw-bold mb-2" style={{ color: '#1a1a2e' }}>Order Failed!</h3>
                  <p className="text-muted mb-4">Your order could not be processed.</p>
                </>
              )
            } else if (status === 'completed' || status === 'success') {
              return (
                <>
                  <div className="mx-auto mb-3 mt-2" style={{ width: '64px', height: '64px', backgroundColor: '#d4edda', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="10" fill="#28a745" />
                      <path d="M8 12.5L10.5 15L16 9" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <h3 className="fw-bold mb-2" style={{ color: '#1a1a2e' }}>Order Completed!</h3>
                  <p className="text-muted mb-4">Your order has been completed successfully.</p>
                </>
              )
            } else {
              return (
                <>
                  <div className="mx-auto mb-3 mt-2" style={{ width: '64px', height: '64px', backgroundColor: '#cce5ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="10" fill="#2f80ed" />
                      <path d="M8 12.5L10.5 15L16 9" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <h3 className="fw-bold mb-2" style={{ color: '#1a1a2e' }}>Order Successful!</h3>
                  <p className="text-muted mb-4">Your order is being processed.</p>
                </>
              )
            }
          })()}

          <div className="text-start p-3 mb-4" style={{ border: '1px solid #eef0f2', borderRadius: '12px', fontSize: '14px', backgroundColor: '#fafbfc' }}>
            <div className="d-flex justify-content-between mb-3">
              <span className="text-muted">Order ID:</span>
              <span className="fw-medium text-end" style={{ wordBreak: 'break-all', maxWidth: '60%', color: '#333' }}>
                {successOrderData?.order?._id || successOrderData?.orderId}
              </span>
            </div>

            {(() => {
              const status = successOrderData?.order?.status?.toLowerCase() || 'processing'
              let bgColor = '#cce5ff'
              let textColor = '#0056b3'
              if (status === 'completed' || status === 'success') {
                bgColor = '#d4edda'
                textColor = '#155724'
              } else if (status === 'failed' || status === 'refunded') {
                bgColor = '#f8d7da'
                textColor = '#721c24'
              }
              return (
                <div className="d-flex justify-content-between mb-3 align-items-center">
                  <span className="text-muted">Status:</span>
                  <span className="badge" style={{ backgroundColor: bgColor, color: textColor, padding: '6px 12px', borderRadius: '20px', fontWeight: '500' }}>
                    <span className="text-capitalize">{status}</span>
                  </span>
                </div>
              )
            })()}

            {successOrderData?.order?.items?.[0]?.itemName && (
              <div className="d-flex justify-content-between mb-3">
                <span className="text-muted">Item:</span>
                <span className="fw-medium text-end" style={{ wordBreak: 'break-all', maxWidth: '60%', color: '#333' }}>
                  {successOrderData.order.items[0].itemName.includes('-')
                    ? successOrderData.order.items[0].itemName.split('-')[0].trim()
                    : successOrderData.order.items[0].itemName}
                </span>
              </div>
            )}

            {(() => {
              let parsedDesc = {}
              try {
                if (successOrderData?.order?.description) {
                  parsedDesc = JSON.parse(successOrderData.order.description)
                }
              } catch (e) { }
              return (
                <>
                  <div className="d-flex justify-content-between mb-3">
                    <span className="text-muted">Character ID:</span>
                    <span className="fw-medium" style={{ color: '#333' }}>{parsedDesc.playerId || playerId}</span>
                  </div>
                  {hasServerField && (
                    <div className="d-flex justify-content-between mb-3">
                      <span className="text-muted">Server ID:</span>
                      <span className="fw-medium" style={{ color: '#333' }}>
                        {resolveServerLabel((parsedDesc.server || server || '').trim()) || '—'}
                      </span>
                    </div>
                  )}
                </>
              )
            })()}
            <div className="d-flex justify-content-between">
              <span className="text-muted">Amount:</span>
              <span className="fw-bold" style={{ color: '#FF0000', fontSize: '16px' }}>MMK{successOrderData?.order?.amount}</span>
            </div>
          </div>

          <div className="d-flex gap-2 mb-3">
            <button
              className="btn flex-grow-1 d-flex align-items-center justify-content-center gap-2"
              style={{ backgroundColor: '#2f80ed', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 0', opacity: downloadingInvoice ? 0.7 : 1 }}
              disabled={downloadingInvoice}
              onClick={() => {
                const orderForInvoice = {
                  orderId: successOrderData?.orderId,
                  amount: successOrderData?.order?.amount,
                  description: successOrderData?.order?.description,
                  paymentMethod: successOrderData?.order?.paymentMethod,
                  createdAt: successOrderData?.order?.createdAt,
                  gameName: gameData?.name,
                  _parsedGameName: gameData?.name,
                  _parsedItemTitle: successOrderData?.order?.items?.[0]?.itemName
                    ? successOrderData.order.items[0].itemName.includes('-')
                      ? successOrderData.order.items[0].itemName.split('-')[0].trim()
                      : successOrderData.order.items[0].itemName
                    : null,
                }
                downloadPurchaseInvoice(orderForInvoice, profileData)
              }}
            >
              {downloadingInvoice ? (
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14 11V14H2V11H0V14C0 15.1 0.9 16 2 16H14C15.1 16 16 15.1 16 14V11H14ZM13 7L11.59 5.59L9 8.17V0H7V8.17L4.41 5.59L3 7L8 12L13 7Z" fill="currentColor" />
                </svg>
              )}
              <span style={{ fontSize: '13px', fontWeight: '500' }}>
                {downloadingInvoice ? 'Generating...' : 'Download Invoice'}
              </span>
            </button>
            <button
              className="btn flex-grow-1 d-flex align-items-center justify-content-center gap-2"
              style={{ backgroundColor: '#4285f4', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 0' }}
              onClick={() => navigate('/reports?type=purchase')}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 2H6C4.9 2 4.01 2.9 4.01 4L4 16C4 17.1 4.89 18 5.99 18H18C19.1 18 20 17.1 20 16V8L14 2ZM13 3.5L18.5 9H13V3.5ZM6 16V4H12V10H18V16H6Z" fill="currentColor" />
              </svg>
              <span style={{ fontSize: '13px', fontWeight: '500' }}>Order History</span>
            </button>
          </div>

          <button
            className="btn w-100"
            style={{ backgroundColor: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: '8px', padding: '10px', fontSize: '14px', fontWeight: '500', color: '#495057' }}
            onClick={() => setSuccessOrderData(null)}
          >
            Continue Shopping
          </button>
        </Modal.Body>
      </Modal>
    </>
  )
}
