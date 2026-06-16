import React, { useContext } from 'react'
import { Link } from 'react-router-dom'

import UserContext from '../context/UserContext'

export default function Footer() {
  const { websiteLogo } = useContext(UserContext)
  return (
    <footer className='site-footer minimal-footer py-4'>
      <div className='container'>
        <div className='footer-minimal-grid'>
          <div className='footer-nav-panel'>
            <Link to='/' className='footer-logo-link'>
              <img src={websiteLogo} alt='NMH Gaming' />
            </Link>

            <div className='footer-link-group'>
              <h6>Company</h6>
              <ul>
                <li>
                  <Link className='text-white' to='/about-us'>About Us</Link>
                </li>
                <li>
                  <Link className='text-white' to='/terms-conditions'>Terms</Link>
                </li>
                <li>
                  <Link className='text-white' to='/privacy-policy'>Privacy</Link>
                </li>
                <li>
                  <Link className='text-white' to='/refund-policy'>Refund</Link>
                </li>
              </ul>
            </div>

            <div className='footer-link-group'>
              <h6>Shop</h6>
              <ul>
                <li>
                  <Link to='/'>Popular Games</Link>
                </li>
                <li>
                  <Link to='/reports?type=purchase'>Orders</Link>
                </li>
                <li>
                  <Link to='/my-wallet'>Wallet</Link>
                </li>
                <li>
                  <a href='mailto:admin@nmhgaming.com'>Support</a>
                </li>
              </ul>
            </div>


            <div className='footer-socialicon footer-social-minimal'>
              <h6>Follow</h6>
              <div>
                <a href='https://www.facebook.com/nmhgaming?mibextid=ZbWKwL' target='_blank' rel='noreferrer' className='facebook'>
                  <img src='/images/facebook.svg' alt='facebook' />
                </a>
                <a href='https://instagram.com/nmhgaming?igshid=ZGUzMzM3NWJiOQ==' target='_blank' rel='noreferrer' className='instagram'>
                  <img src='/images/instagram.svg' alt='instagram' />
                </a>
                <a href='https://www.youtube.com/@nmhOfficial_' target='_blank' rel='noreferrer' className='youtube'>
                  <img src='/images/youtube.png' alt='youtube' />
                </a>
                <a href='https://t.me/thenmhofficial' target='_blank' rel='noreferrer' className='telegram'>
                  <img src='/images/telegram.svg' alt='telegram' />
                </a>

              </div>
            </div>
          </div>
        </div>

        <div className='copyright footer-minimal-copy'>Copyright © 2024 NMH Gaming. All Rights Reserved.</div>
      </div>
    </footer>
  )
}
