import UserContext from "./UserContext"
import { useState } from "react"

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
      value={{ progress, setProgress, clickLoadingBar, loader, setLoader, alert, setAlert, modal, setModal, filteredgames, setFilteredgames }}
    >
      {props.children}
    </UserContext.Provider>
  )
}

export default UserState
