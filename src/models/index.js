import * as Yup from "yup"

export const sendotpSchema = Yup.object({
    email: Yup.string().required("Please enter your email").email("Please enter a valid email address"),
})

export const verifyotpSchema = Yup.object({
    otp: Yup.string().required("Please enter your OTP").min(6, "OTP must be contains 6 character").max(6, "OTP must be contains 6 character")
})

export const updateprofileSchema = Yup.object({
    name: Yup.string().required("Please enter your name").min(4, "Name must be contains minimum 4 character"),
    email: Yup.string().required("Please enter your email").email("Please enter a valid email address"),
    password: Yup.string().required("Please enter your password").min(6, "Password must be at least 6 characters"),
})

export const addmoneySchema = Yup.object({
    amount: Yup.number().required("Please enter an amount").min(1, "Amount must be greater than or equal to 1 RS")
})

export const mobilelegendsSchema = Yup.object({
    code: Yup.string().required("Please select your game code"),
    characterId: Yup.string().required("Please enter your user id").min(1, "User id must be contains minimum 1 character"),
    serverId: Yup.string().required("Please enter your zone id").min(1, "Zone id must be contains minimum 1 character"),
    inGameName: Yup.string().required("Please enter your in game name").min(1, "In game name must be contains minimum 1 character"),
    itemId: Yup.string().required("Please select your item id"),
})

export const pubgmgSchema = Yup.object({
    code: Yup.string().required("Please select your game code"),
    characterId: Yup.string().required("Please enter your player id").min(1, "Player id must be contains minimum 1 character"),
    inGameName: Yup.string().required("Please enter your in game name").min(1, "In game name must be contains minimum 1 character"),
    itemId: Yup.string().required("Please select your item id"),
})

export const bgmiSchema = Yup.object({
    code: Yup.string().required("Please select your game code"),
    characterId: Yup.string().required("Please enter your player id").min(1, "Player id must be contains minimum 1 character"),
    itemId: Yup.string().required("Please select your item id"),
})

export const valorantSchema = Yup.object({
    code: Yup.string().required("Please select your game code"),
    characterId: Yup.string().required("Please enter your email").email("Please enter a valid email address"),
    itemId: Yup.string().required("Please select your item id"),
})


export const genshinSchema = Yup.object({
    code: Yup.string().required("Please select your game code"),
    characterId: Yup.string().required("Please enter your UID").min(1, "UID must be contains minimum 1 character"),
    serverId: Yup.string().required("Please select your server"),
    inGameName: Yup.string().required("Please enter your in game name").min(1, "In game name must be contains minimum 1 character"),
    itemId: Yup.string().required("Please select your item id"),
})

export const cocSchema = Yup.object({
    code: Yup.string().required("Please select your game code"),
    characterId: Yup.string().required("Please enter your player tag").min(1, "Player tag must be contains minimum 1 character"),
    inGameName: Yup.string().required("Please enter your in game name").min(1, "In game name must be contains minimum 1 character"),
    itemId: Yup.string().required("Please select your item id"),
})

export const honkaiSchema = Yup.object({
    code: Yup.string().required("Please select your game code"),
    characterId: Yup.string().required("Please enter your user id").min(1, "User id must be contains minimum 1 character"),
    serverId: Yup.string().required("Please select your server"),
    inGameName: Yup.string().required("Please enter your in game name").min(1, "In game name must be contains minimum 1 character"),
    itemId: Yup.string().required("Please select your item id"),
})

export const farlightSchema = Yup.object({
    code: Yup.string().required("Please select your game code"),
    characterId: Yup.string().required("Please enter your user id").min(1, "User id must be contains minimum 1 character"),
    inGameName: Yup.string().required("Please enter your in game name").min(1, "In game name must be contains minimum 1 character"),
    itemId: Yup.string().required("Please select your item id"),
})

export const honorofkingsSchema = Yup.object({
    code: Yup.string().required("Please select your game code"),
    characterId: Yup.string().required("Please enter your UID").min(1, "UID must be contains minimum 1 character"),
    inGameName: Yup.string().required("Please enter your in game name").min(1, "In game name must be contains minimum 1 character"),
    itemId: Yup.string().required("Please select your item id"),
})

export const supersusSchema = Yup.object({
    code: Yup.string().required("Please select your game code"),
    characterId: Yup.string().required("Please enter your space id").min(1, "Space id must be contains minimum 1 character"),
    inGameName: Yup.string().required("Please enter your in game name").min(1, "In game name must be contains minimum 1 character"),
    itemId: Yup.string().required("Please select your item id"),
})
