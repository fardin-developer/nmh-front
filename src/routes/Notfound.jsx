import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'

export default function Notfound() {
  useEffect(() => {
    document.title = 'NMH Gaming - 404 Not Found'
    window.location.replace('/')
    // eslint-disable-next-line
  }, [])

  return (
    <>
      <header className='section-t-space'>
        <div className='custom-container'>
          <div className='header-panel'>
            <Link to={-1} className='back-btn'>
              <i className='fa-solid fa-arrow-left icon'></i>
            </Link>
            <h2>404 Page</h2>
          </div>
        </div>
      </header>

      <section className='section-b-space'>
        <div className='custom-container'>
          <div className='empty-page'>
            <img className='img-fluid' src='assets/images/404.png' alt='404' />
            <h2 className='dark-text fw-semibold mt-3'>Oops !</h2>
            <h3 className='d-block fw-normal light-text text-center mt-2'>Page not found!</h3>
          </div>
        </div>
      </section>
    </>
  )
}
