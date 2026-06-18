import React, { useContext } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Offcanvas } from 'react-bootstrap'
import Addmoney from './AddMoney'
import UserContext from '../context/UserContext'
import { useSelector } from 'react-redux'

export default function Header() {
  const profileData = useSelector((state) => state.profileData)
  const navigate = useNavigate()
  const pathname = useLocation().pathname
  const context = useContext(UserContext)
  const { modal, setModal, websiteLogo } = context
  const navItems = [
    { label: 'Home', to: '/' },
    { label: 'Orders', to: '/reports?type=purchase' },
    { label: 'My Wallet', to: '/my-wallet' },
    { label: 'Profile', to: '/profile' },
    { label: 'About Us', to: '/about-us' },
    { label: 'Reseller', to: pathname, neutral: true },
  ]

  const signoutHandler = () => {
    setModal({ ...modal, sideNav: false })
    localStorage.removeItem('authToken')
    navigate('/send-otp')
  }

  const openGamesSearch = () => {
    if (pathname === '/') {
      window.dispatchEvent(new CustomEvent('dos:focus-games-search'))
      return
    }
    navigate('/?focusGamesSearch=1')
  }

  return (
    <>
      <Addmoney modal={modal} setModal={setModal} />

      <header className='site-header sticky-top'>
        <nav className='site-navbar py-3'>
          <div className='container d-flex align-items-center justify-content-between gap-3'>

            {/* LEFT SIDE: Hamburger / Back & Logo */}
            <div className='d-flex align-items-center header-brand-group'>
              {pathname === '/' ? (
                <button className='navbar-toggler comet-menu-btn me-1' type='button' onClick={() => setModal({ ...modal, sideNav: true })} aria-label='Open navigation'>
                  <span className='comet-menu-icon' aria-hidden='true'>
                    <span></span>
                  </span>
                </button>
              ) : (
                <button type='button' onClick={() => navigate(-1)} className='navbar-toggler header-back-btn me-3' aria-label='Go back' style={{ color: 'white' }}>
                  <svg className='icon' style={{ fill: 'white' }}>
                    <use href='#icon_backarrow'></use>
                  </svg>
                </button>
              )}

              <Link to='/' className='navbar-brand me-0 d-flex align-items-center'>
                <img src={websiteLogo} alt='Logo' style={{ height: '27px', objectFit: 'contain' }} />
              </Link>
            </div>

            {/* MIDDLE: Search Box (Desktop Only) */}
            <div className='d-none d-md-flex mx-auto position-relative flex-grow-1 header-search-wrap'>
              <button type='button' className='header-search-btn' onClick={openGamesSearch}>
                <svg className='icon'>
                  <use href='#icon_search'></use>
                </svg>
                <span>Search games, vouchers, diamonds...</span>
              </button>
            </div>

            {/* RIGHT SIDE: Wallet, Profile, Country */}
            <div className='d-flex align-items-center ms-auto header-actions'>
              {localStorage.getItem('authToken') ? (
                <>
                  <button type='button' className='btn-coin header-wallet-btn' onClick={() => setModal({ ...modal, addMoney: true })}>
<svg viewBox="0 0 24 24" width="32" height="32" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" fill="#FFFFFF"></circle><text x="12" y="16.5" text-anchor="middle" font-size="11" font-weight="bold" fill="#E7121B" font-family="sans-serif">₮</text></svg>                    <span className='fw mx-2 fs-6'>{Number(profileData.walletBalance ?? profileData.wallet ?? 0).toFixed(2)}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M8.5 4.5a.5.5 0 0 0-1 0v3h-3a.5.5 0 0 0 0 1h3v3a.5.5 0 0 0 1 0v-3h3a.5.5 0 0 0 0-1h-3z"/>
                    </svg>
                  </button>

                  <button
                    type='button'
                    onClick={() => navigate('/profile')}
                    className='btn header-profile-btn rounded-circle ms-2 ms-md-3 d-flex align-items-center justify-content-center p-0 overflow-hidden text-white'
                    title={profileData?.name || 'Profile'}
                    style={!profileData?.profilePicture ? { border: '1px solid rgba(255,255,255,0.3)', width: '40px', height: '40px' } : { width: '40px', height: '40px' }}
                  >
                    {profileData?.profilePicture ? (
                      <img src={profileData.profilePicture} alt='user' style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"/>
                        <path fillRule="evenodd" d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1z"/>
                      </svg>
                    )}
                  </button>
                </>
              ) : (
                <Link
                  to='/send-otp'
                  className='btn btn-login rounded-pill fw-500 d-inline-flex align-items-center justify-content-center text-center text-decoration-none'
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        </nav>

        {/* Desktop Navbar Links */}
        <div className='d-none d-lg-block header-linkbar'>
          <div className='container py-2'>
            <div className='navbar-nav flex-row d-flex justify-content-center w-100 fs-16px fw-500'>
              {navItems.map((item) => (
                item.neutral ? (
                  <Link key={`${item.label}-${item.to}`} className='nav-link header-nav-link px-3' to={item.to}>
                    {item.label}
                  </Link>
                ) : (
                  <NavLink key={`${item.label}-${item.to}`} className='nav-link header-nav-link px-3' to={item.to}>
                    {item.label}
                  </NavLink>
                )
              ))}
            </div>
          </div>
        </div>
      </header>

      <Offcanvas show={modal.sideNav} onHide={() => setModal({ ...modal, sideNav: false })} className='offcanvas offcanvas-start site-offcanvas' tabIndex='-1' id='offcanvasExample' aria-labelledby='offcanvasExampleLabel'>
        <div className='offcanvas-header'>
          <div className='offcanvas-logo'>
            <Link to='/' className='w-100'>
              <img src={websiteLogo} alt='NMH Gaming' />
            </Link>
          </div>
          <button type='button' className='btn-close' data-bs-dismiss='offcanvas' aria-label='Close' onClick={() => setModal({ ...modal, sideNav: false })}></button>
        </div>
        <div className='offcanvas-body position-relative'>
          <ul className='offcanvas-aside'>
            <li>
              <NavLink className='nav-link' to='/profile' onClick={() => setModal({ ...modal, sideNav: false })}>
                <span>
                  <svg className='icon'>
                    <use href='#icon_profile'></use>
                  </svg>
                </span>
                <strong>Profile</strong>
                <svg className='icon ms-auto'>
                  <use href='#icon_rightarrow'></use>
                </svg>
              </NavLink>
            </li>
            <li>
              <NavLink className='nav-link' to='/reports?type=purchase' onClick={() => setModal({ ...modal, sideNav: false })}>
                <span>
                  <svg className='icon'>
                    <use href='#icon_order'></use>
                  </svg>
                </span>
                <strong>Orders</strong>
                <svg className='icon ms-auto'>
                  <use href='#icon_rightarrow'></use>
                </svg>
              </NavLink>
            </li>
            <li>
              <NavLink className='nav-link' to='/my-wallet' onClick={() => setModal({ ...modal, sideNav: false })}>
                <span>
                  <svg className='icon'>
                    <use href='#icon_wallet'></use>
                  </svg>
                </span>
                <strong>My Wallet</strong>
                <svg className='icon ms-auto'>
                  <use href='#icon_rightarrow'></use>
                </svg>
              </NavLink>
            </li>
            <li>
              <NavLink className='nav-link' to='/support' onClick={() => setModal({ ...modal, sideNav: false })}>
                <span>
                  <svg className='icon'>
                    <use href='#icon_chat'></use>
                  </svg>
                </span>
                <strong>Help & Support</strong>
                <svg className='icon ms-auto'>
                  <use href='#icon_rightarrow'></use>
                </svg>
              </NavLink>
            </li>
            <li>
              <NavLink className='nav-link' to='/' onClick={() => setModal({ ...modal, sideNav: false })}>
                <span>
                  <svg className='icon'>
                    <use href='#icon_handshake'></use>
                  </svg>
                </span>
                <strong>Reseller</strong>
                <svg className='icon ms-auto'>
                  <use href='#icon_rightarrow'></use>
                </svg>
              </NavLink>
            </li>
            <li>
              <NavLink className='nav-link' to='/about-us' onClick={() => setModal({ ...modal, sideNav: false })}>
                <span>
                  <svg className='icon'>
                    <use href='#icon_info'></use>
                  </svg>
                </span>
                <strong>About Us</strong>
                <svg className='icon ms-auto'>
                  <use href='#icon_rightarrow'></use>
                </svg>
              </NavLink>
            </li>
            <li>
              <NavLink className='nav-link' to='/' onClick={() => setModal({ ...modal, sideNav: false })}>
                <span>
                  <svg className='icon'>
                    <use href='#icon_share'></use>
                  </svg>
                </span>
                <strong>Share</strong>
                <svg className='icon ms-auto'>
                  <use href='#icon_rightarrow'></use>
                </svg>
              </NavLink>
            </li>
          </ul>
          <button type='button' className='btn rounded-pill' onClick={signoutHandler}>
            <svg className='icon me-1'>
              <use href='#icon_logout'></use>
            </svg>
            Log out
          </button>
        </div>
      </Offcanvas>

    </>
  )
}
