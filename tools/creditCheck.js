const axios = require('axios')

let creditCheck = async () => {
    let option = {
        headers :{
            "Authorization" : `Bearer ${process.env.API_SECRET}`
        }
    }
    let response = await axios.get("https://api.cloudconvert.com/v2/users/me", option)
    return response.data.data.credits
}

module.exports = creditCheck