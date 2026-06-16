// ─────────────────────────────────────────────
//  API Service — NMH Gaming
//  Base URL: https://api.onetopup.in/api/v1
// ─────────────────────────────────────────────

const BASE_URL = 'https://api.nmhgaming.com/api/v1'

/** Shared JSON headers (no auth) */
const jsonHeaders = { 'Content-Type': 'application/json' }

/** Shared JSON headers WITH auth token */
const authHeaders = () => {
  const token = localStorage.getItem('authToken') || ''
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }
}

// ─── Helper ───────────────────────────────────

/**
 * Generic fetch wrapper.
 * @param {string} endpoint  - path after BASE_URL, e.g. '/user/send-otp'
 * @param {'GET'|'POST'|'PUT'|'PATCH'|'DELETE'} method
 * @param {object|null} body
 * @param {boolean} withAuth - attach authToken header
 * @returns {Promise<any>}   - parsed JSON response
 */
const request = async (endpoint, method = 'GET', body = null, withAuth = false, signal = undefined) => {
  const options = {
    method,
    headers: withAuth ? authHeaders() : jsonHeaders,
  }
  if (body) options.body = JSON.stringify(body)
  if (signal) options.signal = signal

  const response = await fetch(`${BASE_URL}${endpoint}`, options)
  return response.json()
}

// ─── Authentication ───────────────────────────

const authIdentifierPayload = (identifier) => {
  const value = String(identifier || '').trim()
  return value.includes('@') ? { email: value } : { phone: value }
}

/**
 * Send OTP to an email address or phone number.
 * @param {string} identifier - email address or national phone number
 */
export const sendOtp = (identifier) =>
  request('/user/send-otp', 'POST', authIdentifierPayload(identifier))

/**
 * Verify OTP entered by the user.
 * @param {string} identifier
 * @param {string} otp  - 6-digit OTP string
 */
export const verifyOtp = (identifier, otp) =>
  request('/user/verify-otp', 'POST', { ...authIdentifierPayload(identifier), otp })

/**
 * Complete registration for a new user.
 * @param {{ phone: string, name: string, email: string, password: string }} data
 */
export const completeRegistration = (data) =>
  request('/user/complete-registration', 'POST', data)

// ─── User & Banners ───────────────────────────

/**
 * Fetch current user details
 * @returns {Promise<any>}
 */
export const getUserDetails = () =>
  request('/user/me', 'GET', null, true)

/**
 * Fetch public banners
 * @returns {Promise<any>}
 */
export const getPublicBanners = () =>
  request('/banners/public/banners', 'GET')

/**
 * Update User Profile
 * @param {object} data - { name: "New Name" }
 * @returns {Promise<any>}
 */
export const updateProfile = (data) =>
  request('/user/profile', 'PUT', data, true)

/**
 * Upload Profile Picture
 * @param {File} file
 * @returns {Promise<any>}
 */
export const updateProfilePicture = async (file) => {
  const token = localStorage.getItem('authToken') || ''
  const formData = new FormData()
  formData.append('image', file)

  const response = await fetch(`${BASE_URL}/user/profile-picture`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: formData
  })
  return response.json()
}

// ─── Games ────────────────────────────────────

/**
 * Fetch all available games.
 * @returns {Promise<{ success: boolean, games: Array }>}
 */
export const getAllGames = () =>
  request('/games/get-all', 'GET')

/**
 * Fetch diamond packs for a specific game.
 * @param {string} gameId - MongoDB _id of the game
 * @returns {Promise<{ success: boolean, diamondPacks: Array, gameData: object }>}
 */
export const getDiamondPacks = (gameId) =>
  request(`/games/${gameId}/diamond-packs`, 'GET')

/**
 * Validate player ID and optional server ID
 * @param {string} game - the ogcode (e.g., 'MOBILE_LEGENDS_PRO')
 * @param {string} gameId - MongoDB _id of the game
 * @param {string} playerId
 * @param {string} server
 * @returns {Promise<{ valid: boolean, name?: string, server?: string, msg?: string }>}
 */
export const validatePlayerId = (game, gameId, playerId, server = '', signal = undefined) => {
  const hasToken = typeof window !== 'undefined' ? !!localStorage.getItem('authToken') : false;
  return request('/games/validate-user', 'POST', { game, gameId, playerId, server }, hasToken, signal);
}

/**
 * Fetch validation history of a specific game for the logged-in user.
 * @param {string} gameId - MongoDB _id of the game
 * @returns {Promise<{ success: boolean, validationHistory: Array, count: number }>}
 */
export const getValidationHistory = (gameId) =>
  request(`/games/${gameId}/validation-history`, 'GET', null, true)

// ─── Orders ───────────────────────────────────

/**
 * Create a diamond pack order using Wallet Balance
 * @param {string} diamondPackId
 * @param {string} playerId
 * @param {string} server
 * @param {number} quantity
 */
export const createWalletOrder = (diamondPackId, playerId, server, quantity = 1) =>
  request('/order/diamond-pack', 'POST', { diamondPackId, playerId, server, quantity }, true)

/**
 * Create a diamond pack order using UPI
 * @param {string} diamondPackId
 * @param {string} playerId
 * @param {string} server
 * @param {number} quantity
 * @param {string} redirectUrl
 */
export const createUpiOrder = (diamondPackId, playerId, server, quantity = 1, redirectUrl) =>
  request('/order/diamond-pack-upi', 'POST', { diamondPackId, playerId, server, quantity, redirectUrl }, true)

/**
 * Create a diamond pack order using a payment gateway (wavepay / yomabank)
 * @param {string} diamondPackId
 * @param {string} playerId
 * @param {string} server
 * @param {number} quantity
 * @param {'wavepay'|'yomabank'} gateway
 * @param {string} redirectUrl
 */
export const createGatewayOrder = (diamondPackId, playerId, server, quantity = 1, gateway, redirectUrl) =>
  request('/order/diamond-pack-gateway', 'POST', { diamondPackId, playerId, server, quantity, gateway, redirectUrl }, true)

/**
 * Check Order Status (UPI)
 * @param {string} orderId
 */
export const getOrderStatus = (orderId) =>
  request(`/order/order-status?orderId=${orderId}`, 'GET', null, true)

/**
 * Fetch a single transaction record by orderId.
 * Looks up in the user's recent transaction history and returns the matching entry.
 * Used to retrieve UTR / gateway txnId for UPI purchase orders.
 * @param {string} orderId - the purchase order ID (e.g. ORD-xxx)
 * @returns {Promise<object|null>} - matching transaction object or null
 */
export const getTransactionByOrderId = async (orderId) => {
  // Fetch a reasonable window — most users won't have >100 transactions per session
  const result = await request('/transaction/history?page=1&limit=100', 'GET', null, true)
  if (!result?.success) return null
  const txns = result.transactions || []
  return txns.find((t) => t.orderId === orderId) || null
}

// ─── Reports ──────────────────────────────────

/**
 * Add money to Wallet
 * @param {number} amount
 * @param {string} redirectUrl
 */
export const addMoneyToWallet = (amount, redirectUrl) =>
  request('/wallet/add', 'POST', { amount, redirectUrl }, true)

/**
 * Check Transaction Status
 * @param {string} clientTxnId
 */
export const getTransactionStatus = (clientTxnId) =>
  request(`/transaction/status?client_txn_id=${clientTxnId}`, 'GET', null, true)

// ─── Reports ──────────────────────────────────

/**
 * Fetch Transaction History
 * @param {number} page
 * @param {number} limit
 * @param {string} startDate
 * @param {string} endDate
 * @param {string} status
 */
export const getTransactionHistory = (page = 1, limit = 10, startDate, endDate, status) => {
  let url = `/transaction/history?page=${page}&limit=${limit}`
  if (startDate) url += `&startDate=${encodeURIComponent(startDate)}`
  if (endDate) url += `&endDate=${encodeURIComponent(endDate)}`
  if (status && status !== 'all') url += `&status=${encodeURIComponent(status)}`
  return request(url, 'GET', null, true)
}

/**
 * Fetch Order History
 * @param {number} page
 * @param {number} limit
 * @param {string} startDate
 * @param {string} endDate
 * @param {string} status
 */
export const getOrderHistory = (page = 1, limit = 10, startDate, endDate, status) => {
  let url = `/order/history?page=${page}&limit=${limit}`
  if (startDate) url += `&startDate=${encodeURIComponent(startDate)}`
  if (endDate) url += `&endDate=${encodeURIComponent(endDate)}`
  if (status && status !== 'all') {
    let mappedStatus = status;
    if (status === 'success') mappedStatus = 'completed';
    url += `&status=${encodeURIComponent(mappedStatus)}`
  }
  return request(url, 'GET', null, true)
}

/**
 * Fetch Wallet Ledger
 * @param {number} page
 * @param {number} limit
 * @param {string} startDate
 * @param {string} endDate
 * @param {string} status
 */
export const getWalletLedger = (page = 1, limit = 10, startDate, endDate, status) => {
  let url = `/wallet/ledger?page=${page}&limit=${limit}`
  if (startDate) url += `&startDate=${encodeURIComponent(startDate)}`
  if (endDate) url += `&endDate=${encodeURIComponent(endDate)}`
  if (status && status !== 'all') url += `&status=${encodeURIComponent(status)}`
  return request(url, 'GET', null, true)
}

/**
 * Check maintenance status
 * @returns {Promise<any>}
 */
export const checkMaintenanceStatus = () => request('/maintenance/status', 'GET')
