import { useEffect, useState, useRef } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'

export default function AsideBar() {
  const navigate = useNavigate()
  const [openModal, setOpenModal] = useState()
  const modalRef = useRef(null)
  const path = useLocation()
  const [modelopen, setModelopen] = useState(false)

  const moreLink = (env, id) => {
    if (!env.target.matches('.active')) {
      document.querySelectorAll('.nav-toggle').forEach((e) => {
        e.classList.remove('active')
      })
      document.querySelectorAll('.navmore-link').forEach((e) => {
        e.classList.remove('active')
      })
      env.target.classList.add('active')
      document.getElementById(id).classList.add('active')
    } else {
      env.target.classList.remove('active')
      document.getElementById(id).classList.remove('active')
    }
  }
  const menuToggle = () => {
    document.body.classList.toggle('shrink-menu')
  }

  const signoutHandler = () => {
    localStorage.removeItem('authToken')
    navigate('/send-otp')
  }

  return (
    <>
      <aside className='flex flex-col justify-between' id='asideBar'>
        <div>
          <div className='relative'>
            <ul>
              <li>
                <NavLink className='nav-link' to='/profile'>
                  <svg className='icon'>
                    <use href='#icon_profile'></use>
                  </svg>
                  <strong>Profile</strong>
                </NavLink>
              </li>
              <li>
                <NavLink className='nav-link' to='/reports?type=purchase'>
                  <svg className='icon'>
                    <use href='#icon_order'></use>
                  </svg>
                  <strong>Orders</strong>
                </NavLink>
              </li>
              <li>
                <NavLink className='nav-link' to='/my-wallet'>
                  <svg className='icon'>
                    <use href='#icon_wallet'></use>
                  </svg>
                  <strong>My Wallet</strong>
                </NavLink>
              </li>
              <li>
                <NavLink className='nav-link' to='/send-otp' onClick={signoutHandler}>
                  <svg className='icon'>
                    <use href='#icon_logout'></use>
                  </svg>
                  <strong>Log out</strong>
                </NavLink>
              </li>
            </ul>
          </div>
        </div>
      </aside>
    </>
  )
}
