import React from 'react'

export default function Loader() {
  return (
    <div className='vh-100 d-flex flex-column justify-content-center'>
      <div className='loader text-center'>
        <div class='spinner-border color-highlight' role='status' style={{ color: '#008ad8' }}></div>
      </div>
    </div>
  )
}
