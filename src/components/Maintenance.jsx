import React from 'react'
import { useSelector } from 'react-redux'

export default function Maintenance() {
  const profileData = useSelector((state) => state.profileData)

  return (
    <div className='container py-5 mt-5'>
      <div className='row justify-content-center'>
        <div className='col-12 col-md-8 col-lg-6 text-center'>
          <div className='empty-page p-4 bg-white rounded shadow-sm border'>
            <h2 className='fw-bold mb-3' style={{ color: '#1a87d9' }}>Scheduled Maintenance</h2>
            <p className='text-muted mb-4 fs-16px lh-md'>
              We are currently performing scheduled maintenance to enhance your experience on NMH Gaming. During this time, our website and services may be temporarily unavailable. We apologize for any inconvenience and appreciate your patience.
              Please check back later.
            </p>
            <a target='_blank' rel='noreferrer' href={`https://wa.me/918329905444/?text=${encodeURIComponent(`Name: ${profileData?.name || 'User'}\nNumber: ${profileData?.number || 'N/A'}\n`)}`} className='btn btn-login rounded-pill px-4 py-2 w-100 fw-bold fs-16px'>
              Chat With Us
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
