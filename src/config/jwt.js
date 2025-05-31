import jwt from "jsonwebtoken";

export function createAccessToken(payload){
    return new Promise((resolve, reject) =>{
        jwt.sign(payload, "secret123", {expiresIn: "1d"}, (err, token) => {
            if(err) reject(err);
            resolve(token)
        })
    })
}