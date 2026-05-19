import React from 'react'
import { useSelector } from 'react-redux'

export default function ContactUs() {
  const profileData = useSelector((state) => state.profileData)

  return (
    <div className='row pt-md-4 pt-3' id='#contact-us'>
      <div className='col-12 pb-md-4 pb-md-3 pb-2 pt-3'>
        <h2 className='ContactUs-Heading'>Contact Us</h2>
      </div>
      <div className='col-12 col-md-6 social-card d-flex justify-content-between'>
        <div className='card'>
          <div className='card-body d-flex align-items-center justify-content-center'>
            <div>
              <div className='d-flex justify-content-center'>
                <img className='whatsapp' src='/images/whatsapp.png' alt='whatsapp' />
              </div>
              <h5 className='card-title text-center'>Whatsapp</h5>
              <a target='_blank' href={`https://wa.me/918329905444/?text=${encodeURIComponent(`Name: ${profileData.name}\nNumber: ${profileData.number}\n`)}`} className='stretched-link'></a>
            </div>
          </div>
        </div>

        <div className='card'>
          <div className='card-body d-flex align-items-center justify-content-center'>
            <div>
              <div className='d-flex justify-content-center'>
                <img className='whatsapp' src='/images/messenger.png' alt='messenger' />
              </div>
              <h5 className='card-title text-center'>Messenger</h5>
              <a href='https://m.me/100226139631005?source=qr_link_share' target='_blank' className='stretched-link'></a>
            </div>
          </div>
        </div>

        <div className='card'>
          <div className='card-body d-flex align-items-center justify-content-center'>
            <div>
              <div className='d-flex justify-content-center'>
                <img className='email' src='/images/mail.png' alt='mail' />
              </div>
              <h5 className='card-title text-center'>Email</h5>
              <a href='mailto:admin@nmhgaming.com' className='stretched-link'></a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
