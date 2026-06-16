import { setInfoData } from "../redux/actions/actions";
import { getAllGames } from "./apiService";
import Swal from "sweetalert2";

const info = () => {
    return async (dispatch) => {
        try {
            const result = await getAllGames();
            if (result.success) {
                if (result.games) {
                    const sortedGames = result.games.sort((a, b) => (a.priority ?? Infinity) - (b.priority ?? Infinity));
                    dispatch(setInfoData({ availableGames: sortedGames }));
                } else {
                    Swal.fire({
                        icon: "error",
                        title: "",
                        text: "Something went wrong, please try again later!",
                        footer: "Alert by the NMH Gaming team",
                        confirmButtonColor: "#008ad8",
                    });
                }
            } else {
                Swal.fire({
                    icon: "error",
                    title: "",
                    text: "Failed to load games. Please try again.",
                    footer: "Alert by the NMH Gaming team",
                    confirmButtonColor: "#008ad8",
                });
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

export default info;
