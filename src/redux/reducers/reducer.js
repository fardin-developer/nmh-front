export const profileData = (state = {}, action) => {
    if (action.type === 'setProfileData') {
        return { ...action.payload }
    } else {
        return state
    }
}

export const infoData = (state = {}, action) => {
    if (action.type === 'setInfoData') {
        return { ...action.payload }
    } else {
        return state
    }
}