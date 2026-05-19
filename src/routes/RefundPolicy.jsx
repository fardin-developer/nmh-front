import React, { useEffect } from 'react'
import BottomMenu from '../components/BottomMenu'
import ContactUs from '../components/ContactUs'

export default function RefundPolicy() {
  useEffect(() => {
    document.title = 'NMH Gaming - Refund Policy'
  }, [])

  return (
    <section className='wrapper'>
      <div className='container terms-content'>
        <div className='row pt-md-4 pt-3'>
          <div className='col-12 pb-md-4 pb-md-3 pb-2 pt-3'>
            <h2 className='TermsConditions-Heading pb-md-4 pb-2'>Refund Policy</h2>

            <ul className='terms-paragraph p-0 ps-4'>
              <li className='pb-md-4 pb-2'>
                When making a purchase at NMH Gaming the customer must be aware of the refund policies for the product to be purchased. Visit the official website of the developer of the game or application and find out the conditions for
                the refund.
              </li>
              <li className='pb-md-4 pb-2'>
                Customers who wish to request a refund should contact the developer of the game or application directly. Considering that NMH Gaming has no control over the product purchased by the customer, that is, it acts as an
                intermediary, in which it informs the developer that the payment was successful, technically it cannot make refunds, as the operation exceeds its capabilities.
              </li>
              <li className='pb-md-4 pb-2'>
                If you are the direct buyer of NMH Gaming and need to make a refund, NMH Gaming can assist you by providing proof of payment, as long as the required information is sent. With it, the customer can contact the
                developer and request a refund. The receipt will not be sent to third parties.
              </li>
              <li className='pb-md-4 pb-2'>
                If your purchase is eligible for refunds, please contact support to{' '}
                <a href='#' className='link' target='_blank'>
                  admin@nmhgaming.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <ContactUs />
        <BottomMenu />
      </div>
    </section>
  )
}
