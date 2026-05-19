import { setProfileData } from "../redux/actions/actions";
import Swal from "sweetalert2";
import { getUserDetails } from "./apiService";

const userdetails = (navigate) => {
  return async (dispatch) => {
    try {
      const result = await getUserDetails();
      // The /me endpoint returns the user object directly (not wrapped in result.data)
      if (result._id) {
        dispatch(setProfileData(result));
        if (navigator.userAgent === process.env.REACT_APP_NATIVE_USER_AGENT) {
          window.ReactNativeWebView.postMessage(
            JSON.stringify({
              event: "userInfo",
              data: result,
            })
          );
        }
      } else {
        localStorage.removeItem("authToken");
        if (navigate) navigate("/");
      }
    } catch (error) {
      console.log(error);
      Swal.fire({
        icon: "error",
        title: "",
        text: "Something went wrong, please try again later!",
        footer: "Alert by the NMH Gaming team",
        confirmButtonColor: "#008ad8",
      });
    }
  };
};

export default userdetails;
