import { useState } from 'react'
import { jsPDF } from 'jspdf'
import moment from 'moment'
import Swal from 'sweetalert2'
import { getOrderStatus, getTransactionByOrderId } from '../api/apiService'

/**
 * useInvoiceDownloader
 *
 * Reusable hook that generates and downloads a PDF purchase invoice.
 *
 * Usage:
 *   const { downloadingInvoice, downloadPurchaseInvoice } = useInvoiceDownloader()
 *
 * Call:
 *   downloadPurchaseInvoice(orderObj, profileData)
 *
 * For UPI orders the hook also fetches the matching transaction record from
 * /transaction/history to retrieve the UTR number and gateway txnId.
 */
export function useInvoiceDownloader() {
  const [downloadingInvoice, setDownloadingInvoice] = useState(false)

  /**
   * Resolve the best UTR / gateway txnId available for an order.
   * Priority:
   *   1. order-status response (freshOrder.utr / freshOrder.txnId if present)
   *   2. matching transaction record from /transaction/history
   * Returns { utr, gatewayTxnId } — either or both may be null.
   */
  const resolveUtrForOrder = async (orderId, freshOrder) => {
    // Already on the order object (wallet orders sometimes have it)
    if (freshOrder.utr) {
      return { utr: freshOrder.utr, gatewayTxnId: freshOrder.txnId || null }
    }

    // For UPI orders: look up the matching transaction record
    if (freshOrder.paymentMethod === 'upi' || freshOrder.paymentMethod === 'gateway') {
      try {
        const txn = await getTransactionByOrderId(orderId)
        if (txn) {
          const utr =
            txn.utr ||
            txn.gatewayResponse?.utr ||
            null

          const gatewayTxnId =
            txn.txnId ||
            txn.gatewayResponse?.txnId ||
            txn.gatewayOrderId ||
            null

          return { utr, gatewayTxnId }
        }
      } catch (_) {
        // Non-fatal — invoice still generates without UTR
      }
    }

    return { utr: null, gatewayTxnId: null }
  }

  /**
   * @param {Object} order       - Minimal order object (needs at least orderId)
   * @param {Object} profileData - Current user profile from Redux store
   */
  const downloadPurchaseInvoice = async (order, profileData) => {
    if (!order?.orderId) return
    setDownloadingInvoice(true)

    try {
      // ── 1. Fetch fresh order details ─────────────────────────────────────
      const result = await getOrderStatus(order.orderId)
      if (!result.success) throw new Error('Failed to fetch order details')
      const freshOrder = result.order || result

      // ── 2. Resolve UTR (runs in parallel-friendly fashion after order fetch)
      const { utr, gatewayTxnId } = await resolveUtrForOrder(order.orderId, freshOrder)

      // ── 3. Derive display values ──────────────────────────────────────────
      const itemTitleFull =
        freshOrder.items?.[0]?.itemName ||
        order._parsedItemTitle ||
        order.itemTitle ||
        'Item Pack'
      const itemTitle = itemTitleFull.includes('-')
        ? itemTitleFull.split('-')[0].trim()
        : itemTitleFull

      let desc = {}
      try {
        desc = JSON.parse(freshOrder.description || order.description || '{}')
      } catch (_) { }

      const characterId = desc?.playerId || '-'
      const serverId = desc?.server || '-'
      const paymentMethod = freshOrder.paymentMethod || order.paymentMethod || 'Wallet'
      const pmDisplay = paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1)
      const isSuccess = freshOrder.status === 'completed' || freshOrder.status === 'success'
      const orderStatus = isSuccess
        ? 'Delivered & Completed'
        : freshOrder.status.charAt(0).toUpperCase() + freshOrder.status.slice(1)
      const gameName =
        order._parsedGameName || order.gameName || freshOrder.gameName || 'Game Topup'

      // ── 4. jsPDF setup ────────────────────────────────────────────────────
      const doc = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'portrait' })
      const W = doc.internal.pageSize.getWidth()   // 595.28 pt
      const margin = 40
      const contentW = W - margin * 2
      let y = margin

      // Helper: horizontal rule
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

      // Helper: key-value row (right-aligned value)
      const kvRow = (key, value, yPos, valColor = null) => {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9)
        doc.setTextColor(108, 117, 125)
        doc.text(key, margin + 4, yPos)
        doc.setFont('helvetica', 'bold')
        if (valColor) doc.setTextColor(...valColor)
        else doc.setTextColor(26, 26, 46)
        const valText = String(value ?? '-')
        const valW = doc.getTextWidth(valText)
        doc.text(valText, W - margin - valW - 4, yPos)
        hline(yPos + 5)
        return yPos + 20
      }

      // ── 5. PDF: Header ────────────────────────────────────────────────────
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
      doc.text('Official Purchase Invoice', W / 2, y, { align: 'center' })
      y += 6
      hline(y, [0, 138, 216])
      y += 18

      // ── 6. PDF: Transaction Info ──────────────────────────────────────────
      y = sectionHeader('Transaction Info', y)
      y = kvRow('Invoice No:', order.orderId, y)
      y = kvRow(
        'Date & Time:',
        moment(freshOrder.createdAt || order.createdAt).format('DD MMMM YYYY [at] hh:mm a'),
        y,
      )
      y = kvRow('Payment Method:', pmDisplay, y)

      // Show UTR when present (UPI orders)
      if (utr) {
        y = kvRow('UPI Reference (UTR):', utr, y)
      }
      // Show gateway txnId when present
      if (gatewayTxnId) {
        y = kvRow('Gateway Txn ID:', gatewayTxnId, y)
      }
      y += 8

      // ── 7. PDF: Customer Details ──────────────────────────────────────────
      y = sectionHeader('Customer Details', y)
      y = kvRow('Customer Name:', profileData?.name || profileData?.userName || '-', y)
      y = kvRow('Registered Email:', profileData?.email || '-', y)
      y = kvRow(
        'Registered Phone:',
        String(profileData?.phone || profileData?.number || '-'),
        y,
      )
      y = kvRow('Character ID:', String(characterId), y)
      y = kvRow('Server ID:', String(serverId), y)
      y += 8

      // ── 8. PDF: Order Details ─────────────────────────────────────────────
      y = sectionHeader('Order Details', y)
      y = kvRow('Game Name:', gameName, y)
      y = kvRow('Product:', itemTitle, y)
      y = kvRow('Total Amount:', `Rs. ${freshOrder.amount || order.amount}`, y)
      y = kvRow('Status:', orderStatus, y, isSuccess ? [16, 185, 129] : [239, 68, 68])
      y += 14

      // ── 9. PDF: Terms & Conditions ────────────────────────────────────────
      hline(y)
      y += 14
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(26, 26, 46)
      doc.text('Terms & Conditions:', margin, y)
      y += 12

      const terms = [
        [
          'Nature of Goods:',
          'This is a digital product (Virtual Currency). By purchasing, the customer acknowledges that no physical shipment is required.',
        ],
        [
          'Instant Delivery:',
          'The service is rendered instantly upon successful payment. Once the digital assets are credited to the Character ID and/or Server ID listed above, the order is marked as Final and Delivered.',
        ],
        [
          'Non-Refundable Policy:',
          'Due to the nature of digital gaming assets, all transactions are strictly non-refundable and non-returnable once processed.',
        ],
        [
          'Authorization Statement:',
          'By completing this transaction, the customer confirms they are the authorized owner of the payment account and have voluntarily initiated this purchase for the specified Game ID.',
        ],
        [
          'Dispute Waiver:',
          'The customer agrees that any attempt to dispute a successfully delivered order through a bank or payment aggregator may constitute a violation of our service terms.',
        ],
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

      // ── 10. PDF: Footer ───────────────────────────────────────────────────
      const pageH = doc.internal.pageSize.getHeight()
      doc.setFillColor(0, 138, 216)
      doc.rect(0, pageH - 4, W, 4, 'F')
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7)
      doc.setTextColor(150, 150, 160)
      doc.text(
        'nmhgaming.com  |  support@nmhgaming.com',
        W / 2,
        pageH - 10,
        { align: 'center' },
      )

      // ── 11. Save ──────────────────────────────────────────────────────────
      doc.save(`Invoice-${order.orderId}.pdf`)

    } catch (err) {
      console.error('[useInvoiceDownloader]', err)
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'Failed to generate invoice. Please try again later.',
        confirmButtonColor: '#008ad8',
      })
    } finally {
      setDownloadingInvoice(false)
    }
  }

  return { downloadingInvoice, downloadPurchaseInvoice }
}
