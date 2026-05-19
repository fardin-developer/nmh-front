import React, { useEffect, useState } from 'react'
import BottomMenu from './BottomMenu'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'

export default function OrderCompleted({ data, setComplated }) {
  const infoData = useSelector((state) => state.infoData)
  const navigate = useNavigate()
  const [game, setGame] = useState({})
  const [item, setItem] = useState({})

  useEffect(() => {
    if (!data) navigate(-1)
    let findResult = infoData.availableGames.find((element) => element.code == data.code)
    setGame(findResult)
    findResult = findResult?.itemList?.find((element) => element.id == data.itemId)
    setItem(findResult)
  }, [])

  return (
    <section className='wrapper wrapper-asidecontent'>
      <form className='order-completed mb-4'>
        <div className='text-center'>
          <svg className='icon'>
            <use href='#icon_fillcheck'></use>
          </svg>
          <h6 className='order-title pt-md-3 pt-2'>Order Completed</h6>
          <p className='puchase-title pt-md-3 pt-2'>Thank you for your purchase!</p>
        </div>
        <div className='pt-md-2 pt-1'>
          <div className='d-flex pb-md-2 pb-2'>
            <div className='left-title'>
              <p>Order ID</p>
            </div>
            <div className='right-title ms-auto'>
              <p>{data.orderId}</p>
            </div>
          </div>

          <div className='d-flex pb-md-2 pb-1'>
            <div className='left-title'>
              <p>Product</p>
            </div>
            <div className='right-title ms-auto'>
              <p>{game?.name}</p>
              <p>{item?.title}</p>
            </div>
          </div>

          <div className='d-flex pb-md-2 pb-2'>
            <div className='left-title'>
              <p>User ID</p>
            </div>
            <div className='right-title ms-auto'>
              <p>{data.characterId}</p>
            </div>
          </div>

          {data.serverId && (
            <div className='d-flex pb-md-2 pb-2'>
              <div className='left-title'>
                <p>Zone ID</p>
              </div>
              <div className='right-title ms-auto'>
                <p>{data.serverId}</p>
              </div>
            </div>
          )}

          <div className='d-flex pb-md-2 pb-2'>
            <div className='left-title'>
              <p>Username</p>
            </div>
            <div className='right-title ms-auto'>
              <p>{data.characterId}</p>
            </div>
          </div>

          <div className='d-flex pb-md-2 pb-2'>
            <div className='left-title'>
              <p>Payment Method</p>
            </div>
            <div className='right-title ms-auto'>
              <p>NMH Coins</p>
            </div>
          </div>

          <div className='d-flex pb-md-2 pb-2'>
            <div className='left-title'>
              <p>Total</p>
            </div>
            <div className='right-title ms-auto'>
              <p>₹ {data.amount}</p>
            </div>
          </div>
        </div>

        <div className='row row-cols-2 g-4 pt-2'>
          <div className='col'>
            <button type='button' className='btn btn-pay w-100' onClick={() => setComplated({ is: false, data: {} })}>
              Buy Again
            </button>
          </div>
          <div className='col'>
            <button type='button' className='btn btn-pay w-100' onClick={() => navigate(`/invoice?type=purchase&orderId=${data.orderId}`)}>
              View Status
            </button>
          </div>
        </div>
      </form>
      <div className='container'>
        <BottomMenu />
      </div>
    </section>
  )
}
