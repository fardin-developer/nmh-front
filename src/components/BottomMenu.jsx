import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { Link, useLocation, useNavigate } from 'react-router-dom'

export default function BottomMenu() {
  const pathname = useLocation().pathname
  const navigate = useNavigate()
  const profileData = useSelector((state) => state.profileData)
  const [showBounce, setShowBounce] = useState(false)
  const openGamesSearch = () => {
    setShowBounce(false)
    if (pathname === '/') {
      window.dispatchEvent(new CustomEvent('dos:focus-games-search'))
      return
    }
    navigate('/?focusGamesSearch=1')
  }

  return (
    <>
      <nav className='mobile-footer app-bottom-nav' aria-label='Mobile navigation'>
        <Link to='/' className={`btn border-0 ft-btn ${pathname === '/' ? 'active' : ''}`} onClick={() => setShowBounce(false)} aria-label='Home'>
          <span className='ft-icon-wrap'>
            <svg className='icon'>
              <use href='#icon_home'></use>
            </svg>
          </span>
          <p>Home</p>
        </Link>
        <button type='button' className='btn border-0 ft-btn' onClick={openGamesSearch} aria-label='Search games'>
          <span className='ft-icon-wrap'>
            <svg className='icon'>
              <use href='#icon_ft-search'></use>
            </svg>
          </span>
          <p>Search</p>
        </button>
        <Link to='/reports?type=purchase' className={`btn border-0 ft-btn ${pathname.startsWith('/reports') ? 'active' : ''}`} onClick={() => setShowBounce(false)} aria-label='Orders'>
          <span className='ft-icon-wrap'>
            <svg className='icon'>
              <use href='#icon_order'></use>
            </svg>
          </span>
          <p>Orders</p>
        </Link>
        <button type='button' className={`btn border-0 ft-btn ${showBounce ? 'active' : ''}`} onClick={() => setShowBounce(!showBounce)} aria-label='Support options' aria-expanded={showBounce}>
          <span className='ft-icon-wrap'>
            <svg className='icon'>
              <use href='#icon_chat'></use>
            </svg>
          </span>
          <p>Support</p>
        </button>
      </nav>

      {showBounce && (
        <div className='bounce support-bubble-panel'>
          <a href={`https://wa.me/918329905444/?text=${encodeURIComponent(`Name: ${profileData.name}\nNumber: ${profileData.number}\n`)}`} className='float float-whatsapp bouncel' target='_blank' rel='noreferrer' aria-label='WhatsApp support'>
            <svg className='icon'>
              <use href='#icon_whatsapp'></use>
            </svg>
          </a>

          <a href='https://m.me/100226139631005?source=qr_link_share' className='float float-messenger bouncel' target='_blank' rel='noreferrer' aria-label='Messenger support'>
            <svg className='icon'>
              <use href='#icon_messenger'></use>
            </svg>
          </a>

          <a href='mailto:admin@nmhgaming.com' className='float float-email bouncel' aria-label='Email support'>
            <svg className='icon'>
              <use href='#icon_email'></use>
            </svg>
          </a>
        </div>
      )}
    </>
  )
}
