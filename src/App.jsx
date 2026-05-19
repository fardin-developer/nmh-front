import React, { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import UserState from './context/UserState'
import Home from './routes/Home'
import Sendotp from './routes/Authentication/Sendotp'
import Verifyotp from './routes/Authentication/Verifyotp'
import PubgGlobal from './routes/Games/PubgGlobal'
import GameProduct from './routes/Games/GameProduct'
import MobileLegends from './routes/Games/MobileLegends'
import MobileLegendsIndonesia from './routes/Games/MobileLegendsIndonesia'
import MobileLegendsRussia from './routes/Games/MobileLegendsRussia'
import COC from './routes/Games/COC'
import Genshin from './routes/Games/Genshin'
import HonkaiStarRail from './routes/Games/HonkaiStarRail'
import ClashRoyale from './routes/Games/ClashRoyale'
import Farlight84 from './routes/Games/Farlight84'
import HonorofKings from './routes/Games/HonorofKings'
import SuperSus from './routes/Games/SuperSus'
import BrawlStars from './routes/Games/BrawlStars'
import BGMI from './routes/Games/BGMI'
import Valorant from './routes/Games/Valorant'
import Notfound from './routes/Notfound'
import LayoutOutlet from './components/LayoutOutlet'
import { useDispatch } from 'react-redux'
import info from './api/info'
import Register from './routes/Authentication/Register'
import TermsConditions from './routes/TermsConditions'
import PrivacyPolicy from './routes/PrivacyPolicy'
import About from './routes/About'
import RefundPolicy from './routes/RefundPolicy'
import Profile from './routes/Profile'
import Report from './routes/Report'
import Invoice from './routes/Invoice'
import MyWallet from './routes/MyWallet'
import OrderStatus from './routes/OrderStatus'
import PaymentStatus from './routes/PaymentStatus'
import Support from './routes/Support'
import Maintenance from './components/Maintenance'
import Header from './components/Header'
import Footer from './components/Footer'
import { checkMaintenanceStatus } from './api/apiService'

export default function App() {
  const dispatch = useDispatch()
  const [isMaintenance, setIsMaintenance] = useState(false)

  useEffect(() => {
    dispatch(info())

    checkMaintenanceStatus()
      .then((data) => {
        if (data?.success && data?.status) {
          setIsMaintenance(true)
        }
      })
      .catch((err) => console.error('Maintenance check failed', err))
  }, [])

  if (isMaintenance) {
    return (
      <UserState>
        <BrowserRouter>
          <Header />
          <Maintenance />
          <Footer />
        </BrowserRouter>
      </UserState>
    )
  }

  return (
    <UserState>
      <BrowserRouter>
        <Routes>
          <Route path='/send-otp' element={<Sendotp />} />
          <Route path='/verify-otp' element={<Verifyotp />} />
          <Route path='/register' element={<Register />} />
          <Route element={<LayoutOutlet />}>
            <Route path='/' element={<Home />} />
            <Route path='/profile' element={<Profile />} />
            <Route path='/reports' element={<Report />} />
            <Route path='/invoice' element={<Invoice />} />
            <Route path='/about-us' element={<About />} />
            <Route path='/my-wallet' element={<MyWallet />} />
            <Route path='/privacy-policy' element={<PrivacyPolicy />} />
            <Route path='/terms-conditions' element={<TermsConditions />} />
            <Route path='/refund-policy' element={<RefundPolicy />} />
            <Route path='/support' element={<Support />} />
            {/* Dynamic Game Product Page */}
            <Route path='/game/:gameId' element={<GameProduct />} />
            {/* Order Status */}
            <Route path='/order-status/:orderId' element={<OrderStatus />} />
            <Route path='/order-status' element={<OrderStatus />} />
            <Route path='/payment-status' element={<PaymentStatus />} />
            {/* Games */}
            <Route path='/mobile-legends' element={<MobileLegends />} />
            <Route path='/mobile-legends-indonesia' element={<MobileLegendsIndonesia />} />
            {/* <Route path='/mobile-legends-russia' element={<MobileLegendsRussia />} /> */}
            <Route path='/bgmi' element={<BGMI />} />
            <Route path='/valorant' element={<Valorant />} />
            <Route path='/pubg-global' element={<PubgGlobal />} />
            <Route path='/genshin' element={<Genshin />} />
            <Route path='/coc' element={<COC />} />
            <Route path='/honkai-starrail' element={<HonkaiStarRail />} />
            <Route path='/clash-royale' element={<ClashRoyale />} />
            <Route path='/farlight-84' element={<Farlight84 />} />
            <Route path='/honor-of-kings' element={<HonorofKings />} />
            <Route path='/super-sus' element={<SuperSus />} />
            <Route path='/brawl-stars' element={<BrawlStars />} />
          </Route>
          <Route path='*' element={<Notfound />} />
        </Routes>
      </BrowserRouter>
    </UserState>
  )
}
