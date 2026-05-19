import React, { useContext, useEffect, useRef, useState } from 'react'
import AsideBar from '../components/AsideBar'
import BottomMenu from '../components/BottomMenu'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import * as Yup from "yup"
import UserContext from '../context/UserContext'
import { useFormik } from 'formik'
import Swal from 'sweetalert2'
import userdetails from '../api/userdetails'
import { updateProfile, updateProfilePicture } from '../api/apiService'

const profileNameSchema = Yup.object({
  name: Yup.string().required("Please enter your name").min(4, "Name must be contains minimum 4 character"),
})

const initialValues = {
  name: '',
}

export default function Profile() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const context = useContext(UserContext)
  const { setLoader } = context
  const profileData = useSelector((state) => state.profileData)
  const fileInputRef = useRef(null)
  const [uploadingPic, setUploadingPic] = useState(false)

  const handlePicUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setUploadingPic(true)
    try {
      const result = await updateProfilePicture(file)
      if (result.profilePicture || result.message?.includes('success')) {
        dispatch(userdetails(navigate))
        Swal.fire({
          icon: 'success',
          title: '',
          text: result.message || 'Profile picture uploaded successfully',
          confirmButtonColor: '#FF0000',
        })
      } else {
        throw new Error(result.message || 'Failed to upload image')
      }
    } catch (error) {
      console.log(error)
      Swal.fire({
        icon: 'error',
        title: '',
        text: error.message || 'Something went wrong, please try again later!',
        confirmButtonColor: '#FF0000',
      })
    } finally {
      setUploadingPic(false)
    }
  }

  const { values, setValues, errors, touched, handleBlur, handleChange, handleSubmit, isSubmitting } = useFormik({
    initialValues,
    validationSchema: profileNameSchema,
    onSubmit: async (values, action) => {
      try {
        const result = await updateProfile({ name: values.name })

        if (result.user || result.message?.includes('success')) {
          dispatch(userdetails(navigate))
          Swal.fire({
            icon: 'success',
            title: '',
            text: result.message || 'Profile updated successfully',
            footer: 'Alert by the NMH Gaming team',
            confirmButtonColor: '#FF0000',
          })
        } else {
          Swal.fire({
            icon: 'error',
            title: '',
            text: result.message || 'Failed to update profile',
            footer: 'Alert by the NMH Gaming team',
            confirmButtonColor: '#FF0000',
          })
        }
      } catch (error) {
        console.log(error)
        Swal.fire({
          icon: 'error',
          title: '',
          text: 'Something went wrong, please try again leter!',
          footer: 'Alert by the NMH Gaming team',
          confirmButtonColor: '#FF0000',
        })
      }
    },
  })

  useEffect(() => {
    document.title = 'NMH Gaming - Profile'
    if (profileData) {
      setValues({ name: profileData.name || '' })
    }
    // eslint-disable-next-line
  }, [profileData])

  return (
    <section className='wrapper-asidecontent home-app-page'>
      <div className='container'>
        <div className='row pt-md-4 pt-3'>
          <div className='col-auto d-none d-lg-block'>
            <AsideBar />
          </div>
          <div className='col pt-md-3 pt-1 profile-wrapper'>
            <h2 className='title'>Profile</h2>

            <div className="profile-pic-wrapper text-center mb-4">
              <div className="position-relative d-inline-block">
                <img
                  src={profileData?.profilePicture || '/images/user.svg'}
                  alt="Profile"
                  className="rounded-circle border"
                  style={{ width: '120px', height: '120px', objectFit: 'cover' }}
                />
                <button
                  type="button"
                  className="btn btn-primary p-0 rounded-circle position-absolute d-flex align-items-center justify-content-center"
                  style={{ bottom: '5px', right: '5px', width: '32px', height: '32px', backgroundColor: '#FF0000', border: 'none' }}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPic}
                >
                  {uploadingPic ? (
                    <span className="spinner-border spinner-border-sm text-white" role="status" aria-hidden="true"></span>
                  ) : (
                    <svg className='icon' style={{ width: '16px', height: '16px', fill: 'white' }} viewBox="0 0 16 16">
                      <path d="M10.5 8.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z" />
                      <path d="M2 4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1.172a2 2 0 0 1-1.414-.586l-.828-.828A2 2 0 0 0 9.172 2H6.828a2 2 0 0 0-1.414.586l-.828.828A2 2 0 0 1 3.172 4H2zm.5 2a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1zm9 2.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0z" />
                    </svg>
                  )}
                </button>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                className="d-none"
                accept="image/*"
                onChange={handlePicUpload}
              />
            </div>

            <form autoComplete='off' onSubmit={handleSubmit}>
              <div className='my-md-4 my-3'>
                <label htmlFor='Name' className='form-label input-label pb-md-1 mb-md-1 p-0 m-0'>
                  Name
                </label>
                <input
                  type='text'
                  autoComplete='off'
                  name='name'
                  placeholder='Your name'
                  value={values.name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`form-control form-control-lg input-box ${!!errors.name && touched.name && 'is-invalid'}`}
                  id='Name'
                />
                {errors.name && touched.name && <div className='invalid-feedback'>{errors.name}</div>}
              </div>

              <div className='mb-md-4 mb-3'>
                <label htmlFor='Email' className='form-label input-label pb-md-1 mb-md-1 p-0 m-0'>
                  Email
                </label>
                <input
                  type='email'
                  autoComplete='off'
                  name='email'
                  placeholder='Your email address'
                  value={profileData?.email || ''}
                  id='Email'
                  className='form-control form-control-lg input-box'
                  disabled
                />
              </div>

              <div className='mb-md-4 mb-3'>
                <label htmlFor='Number' className='form-label input-label pb-md-1 mb-md-1 p-0 m-0'>
                  Number
                </label>
                <input
                  type='text'
                  autoComplete='off'
                  name='number'
                  placeholder='Your mobile number'
                  value={profileData?.phone || profileData?.number || ''}
                  id='Number'
                  className='form-control form-control-lg input-box'
                  disabled
                />
              </div>

              <div className='pt-2 pb-3'>
                <button type='submit' disabled={isSubmitting} className='btn btn-pay'>
                  {isSubmitting ? (
                    <>
                      <span className='spinner-border spinner-border-sm me-05' role='status' aria-hidden='true' />
                      &nbsp; Loading...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        <BottomMenu />
      </div>
    </section>
  )
}
