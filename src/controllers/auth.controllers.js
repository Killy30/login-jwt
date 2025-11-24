import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import yesId from "yes-id";

import User from "../models/user.model.js"
import SystemConfig from "../models/systemConfig.model.js";
import { createAccessToken } from "../config/jwt.js";

export const signUp = async(req, res) =>{
    const {name, email, password, lastName} = req.body;
    const adminToken = yesId()
    console.log(name);
    try {
        const userFound = await User.findOne({ email })
    
        if(userFound) return res.status(400).json({message: 'Este usuario ya existe'})

        const passwordHash = await bcrypt.hash(password, 10)

        const newUser = new User();
        const newSystemConfig = new SystemConfig();

        newUser.lastName = lastName
        newUser.name = name;
        newUser.email = email;
        newUser.password = passwordHash;

        newSystemConfig.user = newUser
        newUser.systemConfig = newSystemConfig

        newUser.admin_connections.push(adminToken)

        const user = await newUser.save()
        await newSystemConfig.save()

        const token = await createAccessToken({user})
        res.cookie('token', token)
        res.json({
            message: "user created successfully",
            _id: user._id,
            name: user.name,
            email: user.email,
            lastName: user.lastName,
            store: user.store,
            adminToken: adminToken
        })

    } catch (error) {
        res.status(500).json({message:'something failed --> ', error})
    }
}

export const login = async(req, res) =>{
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email })
        
        if(!user) return res.status(400).json({message: "Usuario no encontrado"})

        const isMatch = await bcrypt.compare(password, user.password)

        if(!isMatch) return res.status(400).json({message: "Contrasena incorrecta"})

        const token = await createAccessToken({user})
        
        res.cookie('token', token)
        res.json({
            message: "user login successfully",
            _id: user._id,
            name: user.name,
            lastName: user.lastName,
            email: user.email,
            store: user.store
        })
    } catch (error) {
        res.status(500).json({message:'something failed', error})
    }
}


export const verifyToken = async(req, res) =>{
    const { token } = req.cookies

    if(!token) return res.status(401).json({message:'No autorizado'})

    jwt.verify(token, "secret123", async(err, user) =>{
        if(err) return res.status(401).json({message: 'token invalido'})
 
        const userFound = await User.findOne({email: user.user.email})
       
        if(!userFound) return res.status(401).json({message: 'token invalido, user not found'})
        
        return res.json({
            _id: userFound._id,
            name: userFound.name,
            lastName: userFound.lastName,
            email: userFound.email,
            store: userFound.store
        })
    })
}

export const logout = (req, res) => {
    res.cookie('token', "", {
        expires: new Date(0)
    })
    return res.sendStatus(200)
}