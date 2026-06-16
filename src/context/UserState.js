import UserContext from "./UserContext"
import { useState, useEffect } from "react"

const UserState = (props) => {
  const [filteredgames, setFilteredgames] = useState([])
  const [progress, setProgress] = useState(0)
  const [loader, setLoader] = useState(false)
  const [alert, setAlert] = useState({ is: false, type: '', msg: '' })
  const [modal, setModal] = useState({
    sideNav: false,
    addMoney: false,
    countrySection: true
  })
  // Initialize state from localStorage if available, otherwise use default
  const [websiteLogo, setWebsiteLogo] = useState(() => {
    return localStorage.getItem('websiteLogo') || '/images/logo.png';
  })

  useEffect(() => {
    fetch('https://api.nmhgaming.com/api/v1/admin/public/settings/logo')
      .then(res => res.json())
      .then(data => {
        if(data?.success && data?.data?.logoUrl) {
          const newLogo = data.data.logoUrl;
          setWebsiteLogo(newLogo);
          localStorage.setItem('websiteLogo', newLogo); // Cache for next reload
        }
      })
      .catch(err => console.error("Error fetching logo:", err));
  }, [])

  const clickLoadingBar = () => {
    setModal({
      sideNav: false,
      addMoney: false,
      countrySection: true
    })
    setProgress(30)
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant'
    })
    setTimeout(() => {
      setProgress(100)
    }, 60)
    setTimeout(() => {
      setProgress(200)
    }, 100)
  }

  return (
    <UserContext.Provider
      value={{ progress, setProgress, clickLoadingBar, loader, setLoader, alert, setAlert, modal, setModal, filteredgames, setFilteredgames, websiteLogo }}
    >
      {props.children}
    </UserContext.Provider>
  )
}

export default UserState
