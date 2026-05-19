import React, { useContext, useEffect, useState } from 'react'
import AsideBar from '../components/AsideBar'
import { Tab, Tabs, Modal } from 'react-bootstrap'
import BottomMenu from '../components/BottomMenu'
import { useSelector } from 'react-redux'
import { useNavigate, useSearchParams } from 'react-router-dom'
import UserContext from '../context/UserContext'
import Swal from 'sweetalert2'
import moment from 'moment'
import { getTransactionHistory, getOrderHistory, getWalletLedger, getOrderStatus } from '../api/apiService'
import { jsPDF } from 'jspdf'
import { useInvoiceDownloader } from '../hooks/useInvoiceDownloader'

export default function Report() {
  const infoData = useSelector((state) => state.infoData)
  const profileData = useSelector((state) => state.profileData)
  const { downloadingInvoice, downloadPurchaseInvoice } = useInvoiceDownloader()
  const [downloadingPaymentInvoice, setDownloadingPaymentInvoice] = useState(false)
  const [section, setSection] = useState('all')
  const navigate = useNavigate()
  const context = useContext(UserContext)
  const { setLoader } = context
  const [query, setQuery] = useSearchParams()
  const type = query.get('type')
  const [store, setStore] = useState([])
  const [data, setData] = useState([])
  const isLoggedIn = !!localStorage.getItem('authToken')

  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [isFetching, setIsFetching] = useState(false)

  const parseDescription = (desc) => {
    if (!desc) return null;
    try {
      return JSON.parse(desc);
    } catch (e) {
      return null;
    }
  }

  // Purchase invoice is handled by the shared useInvoiceDownloader hook

  const downloadPaymentInvoice = async () => {
    if (!selectedOrder) return
    setDownloadingPaymentInvoice(true)
    try {
      const pmDisplay = selectedOrder.gatewayType || '-'
      const isSuccess = selectedOrder.status === 'completed' || selectedOrder.status === 'success'
      const orderStatus = isSuccess ? 'SUCCESS' : selectedOrder.status.toUpperCase()

      const doc = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'portrait' })
      const W = doc.internal.pageSize.getWidth()
      const margin = 40
      const contentW = W - margin * 2
      let y = margin

      // Helper: draw a horizontal line
      const hline = (yPos, color = [220, 230, 240]) => {
        doc.setDrawColor(...color)
        doc.setLineWidth(0.5)
        doc.line(margin, yPos, W - margin, yPos)
      }

      // Helper: section header band
      const sectionHeader = (text, yPos) => {
        doc.setFillColor(240, 244, 248)
        doc.roundedRect(margin, yPos, contentW, 22, 3, 3, 'F')
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(10)
        doc.setTextColor(26, 26, 46)
        doc.text(text, margin + 8, yPos + 15)
        return yPos + 30
      }

      // Helper: key-value row
      const kvRow = (key, value, yPos, valColor = null) => {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9)
        doc.setTextColor(108, 117, 125)
        doc.text(key, margin + 4, yPos)
        doc.setFont('helvetica', 'bold')
        if (valColor) doc.setTextColor(...valColor)
        else doc.setTextColor(26, 26, 46)
        const valText = String(value || '-')
        const valW = doc.getTextWidth(valText)
        doc.text(valText, W - margin - valW - 4, yPos)
        hline(yPos + 5)
        return yPos + 20
      }

      // ── HEADER ──────────────────────────────────────────────────────────
      doc.setFillColor(0, 138, 216)
      doc.rect(0, 0, W, 6, 'F')

      y += 14
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(22)
      doc.setTextColor(0, 138, 216)
      doc.text('NMH Gaming', W / 2, y, { align: 'center' })
      y += 16
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(108, 117, 125)
      doc.text('Payment Receipt', W / 2, y, { align: 'center' })
      y += 6
      hline(y, [0, 138, 216])
      y += 18

      // ── TRANSACTION INFO ────────────────────────────────────────────────
      y = sectionHeader('Transaction Info', y)
      y = kvRow('Transaction ID:', selectedOrder.orderId, y)
      y = kvRow('Date:', moment(selectedOrder.createdAt).format('DD MMM YYYY, hh:mm a'), y)
      y = kvRow('Payment Method:', pmDisplay, y)
      y = kvRow('Status:', orderStatus, y, isSuccess ? [16, 185, 129] : [239, 68, 68])
      y += 8

      // ── CUSTOMER DETAILS ────────────────────────────────────────────────
      y = sectionHeader('Customer Details', y)
      y = kvRow('Name:', selectedOrder.customerName || profileData?.name || profileData?.userName || '-', y)
      y = kvRow('Mobile:', String(selectedOrder.customerNumber || profileData?.phone || profileData?.number || '-'), y)
      y = kvRow('Email:', selectedOrder.customerEmail || profileData?.email || '-', y)
      y += 8

      // ── PAYMENT DETAILS ─────────────────────────────────────────────────
      y = sectionHeader('Payment Details', y)
      y = kvRow('Description:', selectedOrder.paymentNote || 'Wallet recharge', y)
      const gatewayTxnId = selectedOrder.txnId || selectedOrder.gatewayResponse?.txnId || selectedOrder.gatewayOrderId || selectedOrder.gatewayId
      if (gatewayTxnId) {
        y = kvRow('Gateway Transaction ID:', gatewayTxnId, y)
      }
      const utrNumber = selectedOrder.utr || selectedOrder.gatewayResponse?.utr
      if (utrNumber) {
        y = kvRow('UTR Number:', utrNumber, y)
      }
      y = kvRow('Amount Paid:', `Rs. ${selectedOrder.amount}`, y)
      y += 14

      // ── TERMS & CONDITIONS ──────────────────────────────────────────────
      hline(y)
      y += 14
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(26, 26, 46)
      doc.text('Terms & Conditions (Wallet Top-Up):', margin, y)
      y += 12

      const terms = [
        ['1. Nature of Transaction:', 'This transaction is for a digital wallet top-up. No physical goods are involved.'],
        ['2. Instant Credit:', 'Wallet balance is credited instantly upon successful payment and is considered completed once reflected in the wallet.'],
        ['3. Non-Refundable:', 'Wallet credits are non-refundable once successfully credited, except in case of failed or duplicate transactions.'],
        ['4. Authorization:', 'The customer confirms that they are the authorized owner of the payment account used for this transaction.'],
        ['5. Dispute Verification:', 'Transaction records and wallet logs may be used for verification in case of any payment-related query or dispute, as per applicable payment-provider policies.'],
      ]

      terms.forEach(([title, body]) => {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(7.5)
        doc.setTextColor(26, 26, 46)
        doc.text(title, margin, y)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(108, 117, 125)
        const lines = doc.splitTextToSize(body, contentW - 4)
        doc.text(lines, margin, y + 10)
        y += 10 + lines.length * 9 + 4
      })

      // ── FOOTER ──────────────────────────────────────────────────────────
      doc.setFillColor(0, 138, 216)
      doc.rect(0, doc.internal.pageSize.getHeight() - 4, W, 4, 'F')
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7)
      doc.setTextColor(150, 150, 160)
      doc.text('nmhgaming.com  |  support@nmhgaming.com', W / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' })

      doc.save(`Payment-${selectedOrder.orderId}.pdf`)
    } catch (err) {
      console.log(err)
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'Failed to generate payment receipt. Please try again later.',
        confirmButtonColor: '#008ad8',
      })
    } finally {
      setDownloadingPaymentInvoice(false)
    }
  }

  const getGameImage = (gameName) => {
    if (!gameName) return null;
    const name = gameName.toLowerCase();

    if (name.includes('mobile legends') && name.includes('indonesia')) return 'https://api.cptopup.in/uploads/image-1769540257953-620571877.webp';
    if (name.includes('mobile legends') && name.includes('singapore')) return 'https://game.cptopup.in/uploads/image-1757426347991-426165844.jpg';
    if (name.includes('mobile legends') || name.includes('mlbb') || name.includes('ml ')) return 'https://api.zorotopup.com/uploads/image-1757515107864-46985124.webp';
    if (name.includes('bgmi') || name.includes('battlegrounds mobile india')) return 'https://api.zorotopup.com/uploads/image-1757584191077-241650172.jpg';
    if (name.includes('genshin')) return 'https://api.zorotopup.com/uploads/image-1757583367559-94180045.webp';
    if (name.includes('honor of kings')) return 'https://api.zorotopup.com/uploads/image-1757584585792-528434994.webp';
    if (name.includes('wuthering waves')) return 'https://api.zorotopup.com/uploads/image-1757585752443-820275730.png';
    if (name.includes('magic chess')) return 'https://api.zorotopup.com/uploads/image-1757587713962-254587837.jpg';
    if (name.includes('honkai') && name.includes('star')) return 'https://api.zorotopup.com/uploads/image-1757588002585-683820673.webp';
    if (name.includes('zenless zone zero')) return 'https://api.zorotopup.com/uploads/image-1757588214696-480281488.webp';
    if (name.includes('marvel rivals')) return 'https://api.zorotopup.com/uploads/image-1758447058194-523414500.png';
    if (name.includes('pubg') || name.includes('battlegrounds')) return 'https://api.zorotopup.com/uploads/image-1759577358697-875223616.jpg';
    if (name.includes('super sus')) return 'https://api.nmhgaming.com/uploads/image-1776274337916-638994619.png';
    if (name.includes('marvel duel')) return 'https://api.nmhgaming.com/uploads/image-1776275742486-872687983.png';

    if (name.includes('brawl stars') || name.includes('brawl-stars')) return '/images/banner/brawl-stars.png';
    if (name.includes('clash royale')) return '/images/banner/clash-royale.png';
    if (name.includes('clash of clans') || name.includes('coc')) return '/images/banner/coc.png';
    if (name.includes('farlight')) return '/images/banner/farlight-84.png';
    if (name.includes('valorant')) return '/images/banner/valorant.png';

    return null;
  }

  let tabsToRender = []
  if (type === 'purchase') {
    tabsToRender = [
      { eventKey: 'all', title: 'All ' },
      { eventKey: 'pending', title: 'Processing' },
      { eventKey: 'success', title: 'Completed' },
      { eventKey: 'failed', title: 'Failed' },
    ]
  } else if (type === 'payment') {
    tabsToRender = [
      { eventKey: 'all', title: 'All' },
      { eventKey: 'pending', title: 'Processing' },
      { eventKey: 'success', title: 'Completed' },
      { eventKey: 'failed', title: 'Failed' },
    ]
  } else {
    tabsToRender = [
      { eventKey: 'all', title: 'Records' },
    ]
  }

  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [startDate, setStartDate] = useState(moment().subtract(30, 'days').format('YYYY-MM-DD'))
  const [endDate, setEndDate] = useState(moment().format('YYYY-MM-DD'))

  useEffect(() => {
    document.title = 'NMH Gaming - Reports'

    if (!isLoggedIn) return
    if (type !== 'payment' && type !== 'purchase' && type !== 'ledger') {
      navigate('/')
    } else {
      setPage(1)
      if (section !== 'all') {
        setSection('all')
      } else {
        fetchHistory('all')
      }
    }
    // eslint-disable-next-line
  }, [type])

  useEffect(() => {
    if (!isLoggedIn) return
    fetchHistory(section)
    // eslint-disable-next-line
  }, [section, page, limit, startDate, endDate])

  const fetchHistory = async (status) => {
    try {
      setData([])
      setIsFetching(true)

      const isoStartDate = startDate ? moment(startDate).startOf('day').toISOString() : undefined;
      const isoEndDate = endDate ? moment(endDate).endOf('day').toISOString() : undefined;

      let result;

      let fetchStatus = status;
      // In transactions (payment), all failed ones are basically pending ones > 15m.
      // So when the user clicks 'Failed' tab, we must query 'pending' from backend.
      if (type === 'payment' && status === 'failed') {
        fetchStatus = 'pending';
      }

      if (type === 'payment') {
        result = await getTransactionHistory(page, limit, isoStartDate, isoEndDate, fetchStatus)
      } else if (type === 'purchase') {
        result = await getOrderHistory(page, limit, isoStartDate, isoEndDate, status)
      } else if (type === 'ledger') {
        result = await getWalletLedger(page, limit, isoStartDate, isoEndDate, status)
      }

      setIsFetching(false)
      if (result?.success) {
        let list = []
        if (type === 'payment') {
          let cutoffReached = false;
          list = (result.transactions || []).map(item => {
            if (item.status === 'pending') {
              // Transactions are sorted newest first. Once we hit one older than 15 mins,
              // all subsequent pending transactions are definitively older than 15 mins.
              if (cutoffReached) return { ...item, status: 'failed' };

              if (item.createdAt && moment().diff(moment(item.createdAt), 'minutes') > 15) {
                cutoffReached = true;
                return { ...item, status: 'failed' };
              }
            }
            return item;
          });

          // Do not show expired/failed pending transactions in the Processing tab
          if (section === 'pending') {
            list = list.filter(item => item.status === 'pending');
          } else if (section === 'failed') {
            // Because we fetched 'pending' to find 'failed' ones, we must filter out the non-failed ones
            list = list.filter(item => item.status === 'failed');
          }
        } else if (type === 'purchase') {
          list = result.orders || []
        } else if (type === 'ledger') {
          list = result.data?.transactions || []
        }

        setStore(list)
        setData(list)
      } else if (result) {
        Swal.fire({
          icon: 'error',
          title: '',
          text: result.msg || 'Failed to fetch data',
          footer: 'Alert by the NMH Gaming team',
          confirmButtonColor: '#008ad8',
        })
      }
    } catch (error) {
      console.log(error)
      setIsFetching(false)
      Swal.fire({
        icon: 'error',
        title: '',
        text: 'Something went wrong, please try again leter!',
        footer: 'Alert by the NMH Gaming team',
        confirmButtonColor: '#008ad8',
      })
    }
  }


  if (!isLoggedIn) {
    return (
      <section className='wrapper-asidecontent home-app-page'>
        <div className='container pb-md-4 pb-3'>
          <div className='row pt-md-4 pt-3'>
            <div className='col-auto d-none d-lg-block'>
              <AsideBar />
            </div>
            <div className='col pt-md-3 pt-1 profile-wrapper'>
              <div className='d-flex flex-column align-items-center justify-content-center text-center' style={{ minHeight: '60vh' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, #FF0000 0%, #a00000 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', boxShadow: '0 8px 24px rgba(255,0,0,0.3)' }}>
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" fill="white" />
                    <path d="M12 14C7.58172 14 4 17.5817 4 22H20C20 17.5817 16.4183 14 12 14Z" fill="white" />
                  </svg>
                </div>
                <h3 className='fw-bold mb-2' style={{ color: '#fff' }}>Login Required</h3>
                <p className='mb-4' style={{ color: 'rgba(255,255,255,0.6)', maxWidth: '300px', lineHeight: '1.6', fontSize: '15px' }}>
                  To see your order history, please login to your account.
                </p>
                <button
                  className='btn rounded-pill px-5 py-2 fw-bold'
                  style={{ background: '#FF0000', border: 'none', color: '#fff', fontSize: '16px', boxShadow: '0 4px 16px rgba(255,0,0,0.35)' }}
                  onClick={() => navigate('/send-otp')}
                >
                  Login
                </button>
              </div>
            </div>
          </div>
          <BottomMenu />
        </div>
      </section>
    )
  }

  return (
    <section className='wrapper-asidecontent home-app-page'>
      <div className='container pb-md-4 pb-3'>
        <div className='row pt-md-4 pt-3'>
          <div className='col-auto d-none d-lg-block'>
            <AsideBar />
          </div>
          <div className='col pt-md-3 pt-1 profile-wrapper' style={{ maxWidth: '100%', overflowX: 'hidden' }}>
            <div className='order-list'>
              <h1 className='fw-bold mb-4' style={{ color: '#fff' }}>Orders</h1>

              {/* Main Tabs */}
              <div className='d-flex align-items-center mb-4 p-1' style={{ backgroundColor: '#242730', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', width: '100%' }}>
                <button
                  className='btn flex-fill fw-bold'
                  style={type === 'purchase' ? { backgroundColor: 'rgba(255,0,0,0.18)', borderRadius: '10px', color: '#FF0000', border: '1px solid rgba(255,0,0,0.4)', transition: 'all 0.3s' } : { border: 'none', backgroundColor: 'transparent', color: 'rgba(255,255,255,0.55)', transition: 'all 0.3s', borderRadius: '10px' }}
                  onClick={() => navigate('?type=purchase')}
                >
                  Purchase
                </button>
                <button
                  className='btn flex-fill fw-bold'
                  style={type === 'payment' ? { backgroundColor: 'rgba(255,0,0,0.18)', borderRadius: '10px', color: '#FF0000', border: '1px solid rgba(255,0,0,0.4)', transition: 'all 0.3s' } : { border: 'none', backgroundColor: 'transparent', color: 'rgba(255,255,255,0.55)', transition: 'all 0.3s', borderRadius: '10px' }}
                  onClick={() => navigate('?type=payment')}
                >
                  Payment
                </button>
                <button
                  className='btn flex-fill fw-bold'
                  style={type === 'ledger' ? { backgroundColor: 'rgba(255,0,0,0.18)', borderRadius: '10px', color: '#FF0000', border: '1px solid rgba(255,0,0,0.4)', transition: 'all 0.3s' } : { border: 'none', backgroundColor: 'transparent', color: 'rgba(255,255,255,0.55)', transition: 'all 0.3s', borderRadius: '10px' }}
                  onClick={() => navigate('?type=ledger')}
                >
                  Ledger
                </button>
              </div>

              {/* Date Filters */}
              <div className='row mb-4 g-3'>
                <div className='col-6'>
                  <label className='form-label mb-2' style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)' }}>From Date</label>
                  <input
                    type='date'
                    className='form-control border-0'
                    style={{ borderRadius: '12px', padding: '12px 16px', fontSize: '14px', backgroundColor: '#242730', color: '#fff', border: '1px solid rgba(255,255,255,0.08) !important', height: '48px', colorScheme: 'dark' }}
                    value={startDate}
                    onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                  />
                </div>
                <div className='col-6'>
                  <label className='form-label mb-2' style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)' }}>To Date</label>
                  <input
                    type='date'
                    className='form-control border-0'
                    style={{ borderRadius: '12px', padding: '12px 16px', fontSize: '14px', backgroundColor: '#242730', color: '#fff', border: '1px solid rgba(255,255,255,0.08) !important', height: '48px', colorScheme: 'dark' }}
                    value={endDate}
                    onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                  />
                </div>
              </div>

              {/* Sub Tabs */}
              {type !== 'ledger' && (
                <div className='d-flex gap-2 overflow-auto hide-scrollbar mb-4 pb-1'>
                  {tabsToRender.map(({ eventKey, title }, index) => (
                    <button
                      key={index}
                      type='button'
                      className='btn btn-sm rounded-pill px-3 py-1 fw-bold'
                      style={{
                        backgroundColor: section === eventKey ? 'rgba(255,0,0,0.18)' : '#242730',
                        border: section === eventKey ? '1px solid rgba(255,0,0,0.4)' : '1px solid rgba(255,255,255,0.08)',
                        color: section === eventKey ? '#FF0000' : 'rgba(255,255,255,0.55)',
                        whiteSpace: 'nowrap',
                      }}
                      onClick={() => { setSection(eventKey); setPage(1); }}
                    >
                      {title}
                    </button>
                  ))}
                </div>
              )}

              {/* List */}
              <div className='row row-cols-1 g-3'>
                {isFetching ? (
                  [1, 2, 3, 4, 5].map((i) => (
                    <div className='col' key={`skeleton-${i}`}>
                      <div className='card border-0 mb-2 placeholder-glow' style={{ borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                        <div className='card-body p-3'>
                          <div className='d-flex align-items-center gap-3'>
                            <div className='flex-shrink-0'>
                              <div className='placeholder bg-secondary' style={{ width: '52px', height: '52px', borderRadius: '14px', opacity: 0.15 }}></div>
                            </div>
                            <div className='flex-grow-1'>
                              <div className='placeholder col-7 mb-2 bg-secondary' style={{ height: '16px', borderRadius: '4px', opacity: 0.15, display: 'block' }}></div>
                              <div className='placeholder col-4 mb-2 bg-secondary' style={{ height: '12px', borderRadius: '4px', opacity: 0.15, display: 'block' }}></div>
                              <div className='placeholder col-3 bg-secondary' style={{ height: '11px', borderRadius: '4px', opacity: 0.15, display: 'block' }}></div>
                            </div>
                            <div className='text-end flex-shrink-0 d-flex flex-column align-items-end'>
                              <div className='placeholder mb-2 bg-secondary' style={{ width: '50px', height: '16px', borderRadius: '4px', opacity: 0.15 }}></div>
                              <div className='placeholder bg-secondary' style={{ width: '65px', height: '22px', borderRadius: '12px', opacity: 0.15 }}></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : data.length === 0 ? (
                  <div className='col text-center mt-4'>
                    <div className="mb-3">
                      <i className="bi bi-inbox" style={{ fontSize: '48px', color: 'rgba(255,255,255,0.3)' }}></i>
                    </div>
                    <h5 style={{ color: 'rgba(255,255,255,0.5)' }}>No record found</h5>
                  </div>
                ) : (
                  data.map((element, index) => {
                    if (type === 'purchase') {
                      const game = infoData.availableGames?.find((ele) => ele.code === element.code)
                      const gameName = element.gameName || game?.name || 'Game Topup'
                      let itemTitle = element.items?.[0]?.itemName || game?.itemList?.find((ele) => ele.id === element.itemId)?.title || 'Item Pack'
                      if (itemTitle.includes('-')) {
                        itemTitle = itemTitle.split('-')[0].trim()
                      }

                      const gameImg = element.gameImage || getGameImage(gameName)

                      return (
                        <div className='col' key={index}>
                          <div onClick={() => { setSelectedOrder({ ...element, _parsedGameName: gameName, _parsedItemTitle: itemTitle, _type: 'purchase' }); setShowOrderModal(true); }} className='card border-0 mb-2' style={{ borderRadius: '16px', cursor: 'pointer', background: '#242730', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <div className='card-body p-3'>
                              <div className='d-flex align-items-center gap-3'>
                                <div className='flex-shrink-0' style={{ width: '52px', height: '52px', borderRadius: '14px', overflow: 'hidden', background: '#1a1c23' }}>
                                  {gameImg ? (
                                    <img src={gameImg} alt={gameName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  ) : (
                                    <div className='w-100 h-100 d-flex align-items-center justify-content-center' style={{ fontSize: '22px' }}>🎮</div>
                                  )}
                                </div>
                                <div className='flex-grow-1' style={{ minWidth: 0 }}>
                                  <h6 className="mb-1 fw-bold text-truncate" style={{ color: '#fff', fontSize: '14px' }}>{itemTitle || gameName}</h6>
                                  <div className="text-truncate" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>{gameName}</div>
                                  <div className="mt-1 d-flex align-items-center" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap' }}>
                                    <i className="bi bi-clock me-1" style={{ fontSize: '10px' }}></i>
                                    {moment(element?.createdAt).format('DD MMM, hh:mm A')}
                                  </div>
                                </div>
                                <div className='text-end flex-shrink-0 d-flex flex-column align-items-end'>
                                  <h6 className="mb-1 fw-bold" style={{ color: '#fff', fontSize: '15px' }}>₹ {element.amount?.toFixed(2)}</h6>
                                  {(element?.status === 'success' || element?.status === 'completed') && (
                                    <span className='badge rounded-pill' style={{ backgroundColor: 'rgba(16,185,129,0.18)', color: '#10b981', padding: '6px 12px', fontSize: '10px', fontWeight: '700' }}>SUCCESS</span>
                                  )}
                                  {(element?.status === 'failed' || element?.status === 'refunded') && (
                                    <div className='d-flex flex-column gap-1 align-items-end'>
                                      <span className='badge rounded-pill' style={{ backgroundColor: 'rgba(239,68,68,0.18)', color: '#ef4444', padding: '6px 12px', fontSize: '10px', fontWeight: '700' }}>{element?.status === 'refunded' ? 'REFUNDED' : 'FAILED'}</span>
                                      {element?.status === 'failed' && (
                                        <span className='badge rounded-pill' style={{ backgroundColor: 'rgba(16,163,74,0.18)', color: '#16a34a', padding: '6px 12px', fontSize: '10px', fontWeight: '700' }}>REFUNDED</span>
                                      )}
                                    </div>
                                  )}
                                  {element?.status === 'pending' && (
                                    <span className='badge rounded-pill' style={{ backgroundColor: 'rgba(255,0,0,0.18)', color: '#FF0000', padding: '6px 12px', fontSize: '10px', fontWeight: '700' }}>PROCESSING</span>
                                  )}
                                  {element?.status === 'initiated' && (
                                    <span className='badge rounded-pill' style={{ backgroundColor: 'rgba(217,119,6,0.18)', color: '#d97706', padding: '6px 12px', fontSize: '10px', fontWeight: '700' }}>INITIATED</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    }

                    if (type === 'payment') {
                      return (
                        <div className='col' key={index}>
                          <div onClick={() => { setSelectedOrder({ ...element, _type: 'payment' }); setShowOrderModal(true); }} className='card border-0 mb-2' style={{ borderRadius: '16px', cursor: 'pointer', background: '#242730', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <div className='card-body p-4'>
                              <div className='d-flex justify-content-between align-items-center'>
                                <div className='pe-3 flex-grow-1' style={{ minWidth: 0 }}>
                                  <h6 className="mb-1 fw-bold text-truncate" style={{ color: '#fff', fontSize: '15px', lineHeight: '1.4' }}>{element.paymentNote || 'Transaction'}</h6>
                                  <div className="text-truncate" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>ID: {element.orderId}</div>
                                  <div className="mt-1 d-flex align-items-center" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap' }}>
                                    <i className="bi bi-clock me-1" style={{ fontSize: '10px' }}></i>
                                    {moment(element?.createdAt).format('DD MMM, hh:mm A')}
                                  </div>
                                </div>
                                <div className='text-end flex-shrink-0 d-flex flex-column align-items-end'>
                                  <h6 className="mb-2 fw-bold" style={{ color: '#fff', fontSize: '16px' }}>₹ {element.amount?.toFixed(2)}</h6>
                                  {(element?.status === 'success' || element?.status === 'completed') && (
                                    <span className='badge rounded-pill' style={{ backgroundColor: 'rgba(16,185,129,0.18)', color: '#10b981', padding: '6px 12px', fontSize: '10px', fontWeight: '700' }}>SUCCESS</span>
                                  )}
                                  {(element?.status === 'failed' || element?.status === 'refunded') && (
                                    <span className='badge rounded-pill' style={{ backgroundColor: 'rgba(239,68,68,0.18)', color: '#ef4444', padding: '6px 12px', fontSize: '10px', fontWeight: '700' }}>{element?.status === 'refunded' ? 'REFUNDED' : 'FAILED'}</span>
                                  )}
                                  {element?.status === 'pending' && (
                                    <span className='badge rounded-pill' style={{ backgroundColor: 'rgba(255,0,0,0.18)', color: '#FF0000', padding: '6px 12px', fontSize: '10px', fontWeight: '700' }}>PROCESSING</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    }

                    if (type === 'ledger') {
                      const isCredit = element.transactionType === 'credit'
                      return (
                        <div className='col' key={index}>
                          <div className='card border-0 mb-2' style={{ borderRadius: '16px', background: '#242730', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <div className='card-body p-4'>
                              <div className='d-flex justify-content-between align-items-center'>
                                <div className='pe-3 flex-grow-1' style={{ minWidth: 0 }}>
                                  <h6 className="mb-1 fw-bold text-truncate" style={{ color: '#fff', fontSize: '14px', lineHeight: '1.4' }}>{element.description ? element.description.replace(/^(Combo|Diamond) pack purchase:\s*/i, '') : ''}</h6>
                                  <div className="mt-1 d-flex align-items-center" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap' }}>
                                    <i className="bi bi-clock me-1" style={{ fontSize: '10px' }}></i>
                                    {moment(element?.createdAt).format('DD MMM, hh:mm A')}
                                  </div>
                                </div>
                                <div className='text-end flex-shrink-0 d-flex flex-column align-items-end'>
                                  <h6 className={`mb-2 fw-bold`} style={{ fontSize: '16px', color: isCredit ? '#10b981' : '#ef4444' }}>{isCredit ? '+' : '-'} ₹ {element.amount?.toFixed(2)}</h6>
                                  <span className='badge rounded-pill' style={{ backgroundColor: isCredit ? 'rgba(16,185,129,0.18)' : 'rgba(239,68,68,0.18)', color: isCredit ? '#10b981' : '#ef4444', padding: '6px 12px', fontSize: '10px', fontWeight: '700' }}>{element.transactionType?.toUpperCase()}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    }

                    return null
                  })
                )}
              </div>

              {/* Pagination controls */}
              {data.length > 0 && (
                <div className="d-flex justify-content-between align-items-center mt-4 mb-2">
                  <button className="btn btn-sm rounded-pill px-4" disabled={page <= 1} onClick={() => setPage(page - 1)} style={{ fontWeight: '600', background: '#242730', color: '#fff', border: '1px solid rgba(255,255,255,0.08)' }}>Previous</button>
                  <span className="small fw-bold" style={{ color: 'rgba(255,255,255,0.6)' }}>Page {page}</span>
                  <button className="btn btn-sm rounded-pill px-4" disabled={data.length < limit} onClick={() => setPage(page + 1)} style={{ fontWeight: '600', background: '#242730', color: '#fff', border: '1px solid rgba(255,255,255,0.08)' }}>Next</button>
                </div>
              )}
            </div>
          </div>
        </div>

        <BottomMenu />
      </div>

      {/* Order Details Modal */}
      <Modal show={showOrderModal} onHide={() => setShowOrderModal(false)} centered className="border-0 home-app-page">
        <Modal.Header closeButton className="border-0 pb-0" style={{ background: '#20232b' }}>
          <Modal.Title className="fw-bold" style={{ color: '#fff', fontSize: '20px' }}>Order Details</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-3 pb-4 px-4" style={{ background: '#20232b' }}>
          {selectedOrder && (
            <div className="d-flex flex-column gap-3">
              <div className="text-center mb-2">
                <h2 className="fw-bold mb-2" style={{ color: '#fff' }}>₹ {selectedOrder.amount?.toFixed(2)}</h2>
                {(selectedOrder.status === 'success' || selectedOrder.status === 'completed') && (
                  <span className='badge rounded-pill' style={{ backgroundColor: 'rgba(16,185,129,0.18)', color: '#10b981', padding: '6px 12px', fontSize: '12px', fontWeight: '700' }}>SUCCESS</span>
                )}
                {(selectedOrder.status === 'failed' || selectedOrder.status === 'refunded') && (
                  <div className='d-flex gap-2 justify-content-center flex-wrap'>
                    <span className='badge rounded-pill' style={{ backgroundColor: 'rgba(239,68,68,0.18)', color: '#ef4444', padding: '6px 12px', fontSize: '12px', fontWeight: '700' }}>{selectedOrder.status === 'refunded' ? 'REFUNDED' : 'FAILED'}</span>
                    {selectedOrder.status === 'failed' && selectedOrder._type === 'purchase' && (
                      <span className='badge rounded-pill' style={{ backgroundColor: 'rgba(16,163,74,0.18)', color: '#16a34a', padding: '6px 12px', fontSize: '12px', fontWeight: '700' }}>REFUNDED</span>
                    )}
                  </div>
                )}
                {selectedOrder.status === 'pending' && (
                  <span className='badge rounded-pill' style={{ backgroundColor: 'rgba(255,0,0,0.18)', color: '#FF0000', padding: '6px 12px', fontSize: '12px', fontWeight: '700' }}>PROCESSING</span>
                )}
                {selectedOrder.status === 'initiated' && (
                  <span className='badge rounded-pill' style={{ backgroundColor: 'rgba(217,119,6,0.18)', color: '#d97706', padding: '6px 12px', fontSize: '12px', fontWeight: '700' }}>INITIATED</span>
                )}
              </div>

              <div className="p-3 rounded-4" style={{ background: '#2d3039', border: '1px solid rgba(255,255,255,0.08)' }}>
                {selectedOrder._type === 'purchase' && (
                  <>
                    <div className="d-flex justify-content-between mb-2">
                      <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', fontWeight: '600' }}>Game</span>
                      <span className="fw-bold text-end" style={{ color: '#fff', fontSize: '14px' }}>{selectedOrder._parsedGameName}</span>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', fontWeight: '600' }}>Item</span>
                      <span className="fw-bold text-end" style={{ color: '#fff', fontSize: '14px' }}>{selectedOrder._parsedItemTitle}</span>
                    </div>
                    {(() => {
                      const desc = parseDescription(selectedOrder.description);
                      return desc ? (
                        <>
                          {desc.playerId && (
                            <div className="d-flex justify-content-between mb-2">
                              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', fontWeight: '600' }}>Player ID</span>
                              <span className="fw-bold text-end" style={{ color: '#fff', fontSize: '14px' }}>{desc.playerId}</span>
                            </div>
                          )}
                          {desc.server && (
                            <div className="d-flex justify-content-between mb-2">
                              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', fontWeight: '600' }}>Server / Zone</span>
                              <span className="fw-bold text-end" style={{ color: '#fff', fontSize: '14px' }}>{desc.server}</span>
                            </div>
                          )}
                        </>
                      ) : null;
                    })()}
                  </>
                )}
                {selectedOrder._type === 'payment' && (
                  <div className="d-flex justify-content-between mb-2">
                    <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', fontWeight: '600' }}>Note</span>
                    <span className="fw-bold text-end" style={{ color: '#fff', fontSize: '14px' }}>{selectedOrder.paymentNote || 'Transaction'}</span>
                  </div>
                )}
                <div className="d-flex justify-content-between mb-2">
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', fontWeight: '600' }}>Order ID</span>
                  <span className="fw-bold text-end" style={{ color: '#fff', fontSize: '14px', wordBreak: 'break-all', maxWidth: '60%' }}>{selectedOrder.orderId}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', fontWeight: '600' }}>Status</span>
                  <span className="fw-bold text-end text-capitalize" style={{ color: '#fff', fontSize: '14px' }}>{selectedOrder.status}</span>
                </div>
                {selectedOrder.paymentMethod && (
                  <div className="d-flex justify-content-between mb-2">
                    <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', fontWeight: '600' }}>Payment Method</span>
                    <span className="fw-bold text-end text-capitalize" style={{ color: '#fff', fontSize: '14px' }}>{selectedOrder.paymentMethod}</span>
                  </div>
                )}
                <div className="d-flex justify-content-between">
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', fontWeight: '600' }}>Date</span>
                  <span className="fw-bold text-end" style={{ color: '#fff', fontSize: '14px' }}>{moment(selectedOrder.createdAt).format('DD MMM YYYY, hh:mm A')}</span>
                </div>
              </div>

              {selectedOrder._type === 'purchase' && (
                <div className="d-flex flex-column gap-3 mt-1">
                  <button
                    className="btn fw-bold w-100 py-2 d-flex align-items-center justify-content-center gap-2"
                    style={{ borderRadius: '14px', border: 'none', color: '#fff', background: '#FF0000', fontSize: '15px', boxShadow: '0 4px 16px rgba(255,0,0,0.25)', height: '48px' }}
                    onClick={() => downloadPurchaseInvoice(selectedOrder, profileData)}
                    disabled={downloadingInvoice}
                  >
                    {downloadingInvoice ? (
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    ) : (
                      <i className="bi bi-file-earmark-pdf fs-5"></i>
                    )}
                    {downloadingInvoice ? 'Generating...' : 'Download Invoice'}
                  </button>

                  <div className="p-3 rounded-4" style={{ background: '#2d3039', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="fw-bold mb-1" style={{ color: '#fff', fontSize: '14px' }}>Have any complaint?</h6>
                        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', marginBottom: 0 }}>Report issues with this order</p>
                      </div>
                      <a
                        href={`https://wa.me/918329905444/?text=${encodeURIComponent(`Hi, I need help with my order.\nName: ${profileData?.name || profileData?.userName || '-'}\nPhone: ${profileData?.phone || profileData?.number || '-'}\nOrder ID: ${selectedOrder.orderId}\nGame: ${selectedOrder._parsedGameName}\nAmount: Rs. ${selectedOrder.amount}\nPlease check this.`)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn d-flex align-items-center gap-2"
                        style={{ borderRadius: '10px', fontSize: '13px', fontWeight: '600', padding: '8px 16px', background: '#25D366', color: 'white', border: 'none' }}
                      >
                        <i className="bi bi-whatsapp"></i> Help
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {selectedOrder._type === 'payment' && (
                <div className="d-flex flex-column gap-3 mt-1">
                  <button
                    className="btn fw-bold w-100 py-2 d-flex align-items-center justify-content-center gap-2"
                    style={{ borderRadius: '14px', border: 'none', color: '#fff', background: '#FF0000', fontSize: '15px', boxShadow: '0 4px 16px rgba(255,0,0,0.25)', height: '48px' }}
                    onClick={downloadPaymentInvoice}
                    disabled={downloadingPaymentInvoice}
                  >
                    {downloadingPaymentInvoice ? (
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    ) : (
                      <i className="bi bi-file-earmark-pdf fs-5"></i>
                    )}
                    {downloadingPaymentInvoice ? 'Generating...' : 'Download Invoice'}
                  </button>

                  <div className="p-3 rounded-4" style={{ background: '#2d3039', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="fw-bold mb-1" style={{ color: '#fff', fontSize: '14px' }}>Have any complaint?</h6>
                        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', marginBottom: 0 }}>Report issues with this transaction</p>
                      </div>
                      <a
                        href={`https://wa.me/918329905444/?text=${encodeURIComponent(`Hi, I need help with my transaction.\nName: ${profileData?.name || profileData?.userName || '-'}\nPhone: ${profileData?.phone || profileData?.number || '-'}\nTransaction ID: ${selectedOrder.orderId}\nNote: ${selectedOrder.paymentNote || 'Transaction'}\nAmount: Rs. ${selectedOrder.amount}\nPlease check this.`)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn d-flex align-items-center gap-2"
                        style={{ borderRadius: '10px', fontSize: '13px', fontWeight: '600', padding: '8px 16px', background: '#25D366', color: 'white', border: 'none' }}
                      >
                        <i className="bi bi-whatsapp"></i> Help
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </Modal.Body>
      </Modal>
    </section>
  )
}
