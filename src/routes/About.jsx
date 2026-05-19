import React, { useEffect } from 'react'
import BottomMenu from '../components/BottomMenu'
import ContactUs from '../components/ContactUs'

export default function About() {
  useEffect(() => {
    document.title = 'NMH Gaming - About Us'
  }, [])

  return (
    <section className='wrapper'>
      <div className='container terms-content'>
        <div className='row pt-md-4 pt-3'>
          <div className='col-12 pb-md-4 pb-md-3 pb-2 pt-3'>
            <h2 className='TermsConditions-Heading pb-md-4 pb-2'>About Us</h2>
            <p className='terms-paragraph pb-md-4 pb-3'>
              Welcome to NMH Gaming, your premier destination for top-tier digital services tailored for gamers worldwide. We specialize in delivering seamless game top-ups directly to enhance your gaming journey. With a steadfast
              commitment to excellence, we prioritize providing unparalleled customer service and lightning-fast delivery, ensuring every transaction is smooth and satisfying.
            </p>

            <p className='terms-paragraph pb-md-4 pb-2'>
              At NMH Gaming, we're constantly expanding our product offerings and refining our services to meet the evolving needs of our esteemed clientele. Whether you're looking to level up your gaming experience or seeking assistance,
              our dedicated 24/7 customer support team is always here to help. Experience the convenience and reliability of NMH Gaming today at{' '}
              <a href='#' className='link' target='_blank'>
                www.nmhgaming.com
              </a>
              . Happy shopping, and game on!
            </p>
          </div>
        </div>

        <ContactUs />
        <BottomMenu />
      </div>
    </section>
  )
}
