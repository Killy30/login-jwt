import jwt from 'jsonwebtoken'

export const authRequired = (req, res, next) => {
    const { token } = req.cookies;

    if(!token) return res.status(401).json({message: 'Usuario no autorizado'})
    
    jwt.verify(token, "secret123", (err, user) =>{
        if(err) return res.status(401).json({message: 'token invalido'})
        req.user = user.user
        next()
    })
}