import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import AsideBar from '../components/AsideBar'
import BottomMenu from '../components/BottomMenu'

export default function Support() {
  const profileData = useSelector((state) => state.profileData)

  useEffect(() => {
    document.title = 'NMH Gaming - Help & Support'
  }, [])

  const socialLinks = [
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      description: 'Chat with our support team instantly on WhatsApp.',
      icon: '#icon_whatsapp',
      color: '#25D366',
      bgLight: '#e8f8f0',
      link: `https://wa.me/918329905444/?text=${encodeURIComponent(
        `Name: ${profileData?.name || ''}\nNumber: ${profileData?.phone || profileData?.number || ''}\n`
      )}`
    },
    {
      id: 'messenger',
      name: 'Messenger',
      description: 'Reach out to us on Facebook Messenger.',
      icon: '#icon_messenger',
      color: '#0084FF',
      bgLight: '#eef5ff',
      link: 'https://m.me/100226139631005?source=qr_link_share'
    },
    {
      id: 'email',
      name: 'Email Support',
      description: 'Send us an email regarding your queries.',
      icon: '#icon_email',
      color: '#EA4335',
      bgLight: '#fef2f2',
      link: 'mailto:admin@nmhgaming.com'
    }
  ]

  return (
    <section className='wrapper-asidecontent'>
      <div className='container pb-md-4 pb-3'>
        <div className='row pt-md-4 pt-3'>
          <div className='col-auto d-none d-lg-block'>
            <AsideBar />
          </div>
          <div className='col pt-md-3 pt-1 profile-wrapper' style={{ maxWidth: '100%', overflowX: 'hidden' }}>
            <h3 className='fw-bold mb-3' style={{ color: '#1a1a2e', fontSize: '22px' }}>Help & Support</h3>
            <p className='text-muted mb-4' style={{ fontSize: '14px' }}>Need assistance with your orders or account? Reach out to our 24/7 support team through any of the channels below.</p>

            <div className='row row-cols-1 row-cols-md-2 g-4'>
              {socialLinks.map((social) => (
                <div className='col' key={social.id}>
                  <a
                    href={social.link}
                    target="_blank"
                    rel="noreferrer"
                    className='card border-0 h-100 text-decoration-none'
                    style={{
                      borderRadius: '20px',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateY(-5px)'
                      e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)'
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.05)'
                    }}
                  >
                    <div className='card-body p-3 d-flex align-items-center gap-3'>
                      <div
                        className='flex-shrink-0 d-flex align-items-center justify-content-center'
                        style={{ width: '48px', height: '48px', borderRadius: '12px', background: social.bgLight }}
                      >
                        <svg className='icon' style={{ width: '24px', height: '24px', color: social.color, fill: social.color }}>
                          <use href={social.icon}></use>
                        </svg>
                      </div>
                      <div>
                        <h6 className='fw-bold mb-1' style={{ color: '#1a1a2e', fontSize: '15px' }}>{social.name}</h6>
                        <p className='text-muted mb-0' style={{ fontSize: '13px' }}>{social.description}</p>
                      </div>
                    </div>
                  </a>
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 rounded-4" style={{ backgroundColor: '#f8f9fa', border: '1px solid #e9ecef' }}>
              <div className="d-flex align-items-center gap-2 mb-2">
                <i className="bi bi-clock-history text-primary fs-5"></i>
                <h6 className="fw-bold mb-0" style={{ fontSize: '15px' }}>Support Hours</h6>
              </div>
              <p className="text-muted mb-0" style={{ fontSize: '13px' }}>Our customer support team is available 24/7 to assist you. Average response time is usually within 15-30 minutes during standard business hours.</p>
            </div>

          </div>
        </div>
        <BottomMenu />
      </div>
    </section>
  )
}
