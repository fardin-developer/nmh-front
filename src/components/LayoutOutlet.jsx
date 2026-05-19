import { useDispatch, useSelector } from 'react-redux'
import { Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import React, { useContext, useEffect, useState } from 'react'
import UserContext from '../context/UserContext'
import LoadingBar from 'react-top-loading-bar'
import userdetails from '../api/userdetails'
import Loader from './Loader'
import Maintenance from './Maintenance'
import Header from './Header'
import Footer from './Footer'

export default function LayoutOutlet() {
  const pathname = useLocation().pathname
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const context = useContext(UserContext)
  const { progress, setProgress, loader, clickLoadingBar } = context
  const profileData = useSelector((state) => state.profileData)
  const infoData = useSelector((state) => state.infoData)
  const [query, setQuery] = useSearchParams()
  const authToken = query.get('authToken')
  const [dialog, setDialog] = useState({ is: false })

  const handleMessage = () => {
    if (navigator.userAgent === process.env.REACT_APP_NATIVE_USER_AGENT) {
      window.ReactNativeWebView.postMessage(
        JSON.stringify({
          event: 'appUpdate',
        })
      )
      document.addEventListener('message', function (e) {
        const userData = JSON.parse(e.data)
        const event = userData.event
        const data = userData.data
        if (event === 'appUpdate' && data < infoData.appVersion) setDialog({ ...dialog, is: true })
      })
    }
  }

  const outside = [
    '/',
    '/reports',
    '/about-us',
    '/privacy-policy',
    '/terms-conditions',
    '/refund-policy',
    '/mobile-legends',
    '/mobile-legends-indonesia',
    '/mobile-legends-russia',
    '/bgmi',
    '/valorant',
    '/pubg-global',
    '/genshin',
    '/coc',
    '/honkai-starrail',
    '/clash-royale',
    '/farlight-84',
    '/honor-of-kings',
    '/super-sus',
    '/brawl-stars',
  ]

  // Returns true if the current path is publicly accessible (no auth required)
  const isPublicPath = (path) =>
    outside.includes(path) || path.startsWith('/game/')

  useEffect(() => {
    if (localStorage.getItem('authToken')) dispatch(userdetails(navigate))
    // eslint-disable-next-line
  }, [])

  useEffect(() => infoData.appVersion && handleMessage(), [infoData.appVersion])

  useEffect(() => {
    if (authToken) localStorage.setItem('authToken', authToken)
    if (!isPublicPath(pathname) && !localStorage.getItem('authToken')) {
      navigate('/send-otp')
    }
    clickLoadingBar()
  }, [pathname])

  return localStorage.getItem('authToken') ? (
    Object.keys(profileData).length === 0 || Object.keys(infoData).length === 0 ? (
      <Loader />
    ) : profileData.register ? (
      navigate('/register', {
        replace: false,
        state: {
          number: profileData.number,
        },
      })
    ) : infoData.maintenance?.is ? (
      <Maintenance />
    ) : (
      <>
        <LoadingBar loaderSpeed={250} waitingTime={500} color='#1a87d9' height={3} progress={progress} onLoaderFinished={() => setProgress(0)} />
        {loader && <Loader />}
        <Header />
        <Outlet />
        <Footer />
      </>
    )
  ) : Object.keys(infoData).length === 0 ? (
    <Loader />
  ) : profileData.register ? (
    navigate('/register', {
      replace: false,
      state: {
        number: profileData.number,
      },
    })
  ) : infoData.maintenance?.is ? (
    <Maintenance />
  ) : (
    <>
      <LoadingBar loaderSpeed={250} waitingTime={500} color='#1a87d9' height={3} progress={progress} onLoaderFinished={() => setProgress(0)} />
      {loader && <Loader />}
      <Header />
      <Outlet />
      <Footer />
    </>
  )
}
