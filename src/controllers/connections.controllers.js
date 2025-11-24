import yesId from "yes-id"
import User from '../models/user.model.js'
import Cashier from '../models/cashiers.model.js'
import Checkout from '../models/checkout.model.js'
import SystemConfig from '../models/systemConfig.model.js'
import Clock from "../models/clock.model.js"

export const connections = async (req, res) => {
    const user = req.user;
    const data = req.body;

    try {
        const systemConfig = await SystemConfig.findOne({ user: user._id })
        const myUser = await User.findOne({ _id: user._id })

        if (data.user == 'admin') {
            if (data.code == systemConfig.admi_password) {
                const token = yesId()

                myUser.admin_connections.push(token)

                await myUser.save()

                return res.json({
                    typeUser: 'admin',
                    connected: true,
                    token: token,
                    fullName: 'admin',
                    _id: user._id
                })
            } else {
                return res.status(401).json({
                    connected: false,
                    message: 'Contrasena incorrecta'
                })
            }
        } else {
            const cashier = await Cashier.findById({ _id: data.user })
            const checkout = await Checkout.findById({ _id: data.checkoutId })
            const clocks = await Clock.find({ cashier: cashier._id })

            if (cashier.id_code != data.code) {
                return res.status(401).json({
                    connected: false,
                    message: 'Codigo incorrecto'
                })
            }

            if (data.checkoutId == '') {
                return res.status(401).json({
                    connected: false,
                    message: 'Por favor seleccionar caja...'
                })
            }

            // const checkout = checkouts.find(checkout => checkout._id == data.checkout)
           
            
            if (cashier.connected) {
                return res.status(401).json({
                    connected: false,
                    message: 'Este usuario ya se encuatra conectado...'
                })
            }

            if (checkout.connected) {
                return res.status(401).json({
                    connected: false,
                    message: 'Esta caja ya esta conectada, por favor seleccionar otra caja..'
                })
            }

            const token = yesId(15)

            cashier.connected = true;
            cashier.checkout = { checkout: checkout.checkout, id: checkout._id }
            checkout.connected = true;
            checkout.cashier = `${cashier.name} ${cashier.lastName}`

            myUser.cashiers_connections.push({
                token: token, id: cashier._id
            })

            // clock in
            const datex = formatDate(data.date)
            const date = new Date(data.date)

            const isClockToday = clocks.find(clock => {
                return formatDate(clock.createdAt) == datex
            })

            // console.log(checkout);
            if (!isClockToday) {
                const newClock = new Clock();
                newClock.clockin.push(date);
                newClock.clockList.push({ clockin: date });
                newClock.cashier = cashier;
                // newClock.checkout = checkout.checkout;
                cashier.clocks = newClock;
                
                await newClock.save()
            } else {
                isClockToday.clockin.push(date)
                isClockToday.clockList.push({ clockin: date })
                // isClockToday.checkout = checkout.checkout
    
                await isClockToday.save()
            }


            await checkout.save()
            await cashier.save()
            await systemConfig.save()
            await myUser.save()

            return res.json({
                typeUser: 'user',
                connected: true,
                token: token,
                userConnected: {
                    fullName: `${cashier.name} ${cashier.lastName}`,
                    _id: cashier._id,
                },
                checkoutConnected: {
                    checkout: checkout.checkout,
                    _id: checkout._id
                }
            })
        }
    } catch (error) {
        res.status(500).json({
            message: 'La solicitud ha fallado por favor intentarlo nuevamente',
            error
        })
    }
}


export const disconnections = async (req, res) => {
    try {
        const user = req.user;
        const data = req.body;
    
        const systemConfig = await SystemConfig.findOne({ user: user._id })
        const myUser = await User.findOne({ _id: user._id })
        
        if (!systemConfig) return res.status(401).json({ message: 'Debes registrarte' })
        
        if (data.userId == user._id) {

            const index = myUser.admin_connections.indexOf(data.token)

            if(index != -1){
                myUser.admin_connections.splice(index, 1)
            }else{
                return res.json({
                    connected: false,
                    token:null,
                    message: 'Token no encontrado'
                })
            }
        
            await myUser.save()
            return res.json({
                connected: false,
                token:null,
                message: 'Admin desconectado'
            })
        } else {
                    
            await Cashier.updateOne({ _id: data.userId }, {
                $set: {
                    connected: false,
                    checkout: {checkout: '', id: ''}
                }
            })

            await Checkout.updateOne({ _id: data.checkoutId }, {
                $set: {
                    connected: false,
                    cashier: ''
                }
            })

            const token_index = myUser.cashiers_connections.findIndex(token => token.token == data.token)

            if(token_index != -1){
                myUser.cashiers_connections.splice(token_index, 1)
            }else{
                return res.json({
                    connected: false,
                    token:null,
                    message: 'Token no encontrado'
                })
            }
            await myUser.save()
            
            //checkout
            const cashier = await Cashier.findById({ _id: data.userId })
            const clocks = await Clock.find({ cashier: cashier._id })

            const datex = formatDate(data.date)
            const date = new Date(data.date)

            const isClockToday = clocks.find(clock =>{
                return formatDate(clock.createdAt) == datex
            })

            if(!isClockToday){
                return res.json({
                    connected: false,
                    token:null,
                    message: 'Usuario desconectado'
                })
            }

            isClockToday.clockout.push(date)
            const lastClock = isClockToday.clockList[isClockToday.clockList.length - 1]
            lastClock.clockout = date


            await isClockToday.save()

            return res.json({
                connected: false,
                token:null,
                message: 'Usuario desconectado'
            })
        }
    } catch (error) {
        res.status(500).json({
            message: 'La solicitud ha fallado por favor intentarlo nuevamente',
            error
        })
    }
}

export const disconnectionsByAdmin = async(req, res) => {
    const user = req.user;
    const data = req.body;

    const myUser = await User.findOne({ _id: user._id })
    const cashier = await Cashier.findById({ _id: data.userId})
    
    if (!cashier || !myUser) return res.status(401).json({ message: 'Debes registrarte' })

    try {
        await Checkout.updateOne({ _id:  cashier.checkout.id}, {
            $set: {
                connected: false,
                cashier: ''
            }
        })

        await Cashier.updateOne({ _id: data.userId }, {
            $set: {
                connected: false,
                checkout: { checkout: '', id: '' }
            }
        })


        const token_index = myUser.cashiers_connections.findIndex(token => token.id == cashier._id)

        if (token_index != -1) {
            myUser.cashiers_connections.splice(token_index, 1)
        } else {
            return res.json({
                connected: false,
                token: null,
                message: 'Token no encontrado'
            })
        }

        await myUser.save()
            
        //checkout
        const clocks = await Clock.find({ cashier: cashier._id })

        const datex = formatDate(data.date)
        const date = new Date(data.date)

        const isClockToday = clocks.find(clock => {
            return formatDate(clock.createdAt) == datex
        })

        if (!isClockToday) {
            return res.json({
                connected: false,
                token: null,
                message: 'Usuario desconectado'
            })
        }

        isClockToday.clockout.push(date)
        const lastClock = isClockToday.clockList[isClockToday.clockList.length - 1]
        lastClock.clockout = date

        await isClockToday.save()

        return res.json({
            connected: false,
            token: null,
            message: 'Usuario desconectado'
        })
    } catch (error) {
        res.status(500).json({
            message: 'La solicitud ha fallado por favor intentarlo nuevamente',
            error
        })
    }
}

export const getConnections = async(req, res) => {
    const user = req.user;
    const data = JSON.parse(req.params.data)

    try {
        const myUser = await User.findOne({ _id: user._id })
        const systemConfig = await SystemConfig.findOne({ user: user._id })
        
        if (!systemConfig) return res.status(401).json({ message: 'Debes registrarte' })
        if (!data) return res.status(401).json({ message: 'No connection yet' })

        console.log(data);
        
        if(data.admin_token != undefined){

            const admin_token = myUser.admin_connections.find(token => token == data.admin_token)

            if(admin_token){
                return res.json({
                    typeUser: 'admin',
                    token: admin_token,
                    connected: true,
                    fullName: 'admin',
                    _id: myUser._id
                })
            }else{
                return res.json({
                    typeUser: 'admin',
                    token: null,
                    connected: false,
                    fullName: 'admin',
                    _id: null
                })
            }

            
        }else if(data.clock_token){
            // console.log(data);
                        
            const token = myUser.cashiers_connections.find((token) => token.token == data.clock_token)
            
            const cashier = await Cashier.findById({_id: token.id})
            // console.log(cashier);
            const checkout = await Checkout.findById({_id: cashier.checkout.id})

            
            if(token){
                return res.json({
                    typeUser: 'user',
                    connected: true,
                    token: token.token,
                    userConnected: {
                        fullName: `${cashier.name} ${cashier.lastName}`,
                        _id: cashier._id,
                    },
                    checkoutConnected: {
                        checkout: checkout.checkout,
                        _id: checkout._id
                    }
                })
            }else{
                return res.json({
                    connected: false,
                    token: null,
                    message: 'Token no encontrado'
                })
            }
        }
    } catch (error) {
        res.status(500).json({
            message: 'La solicitud ha fallado por favor intentarlo nuevamente',
            error
        })
    }
}

export const getClocks = async (req, res) => {
    try {
        const user = req.user;
        const cashier_id = req.params.id
        
        if (!cashier_id) return res.status(401).json({ message: 'Debes registrarte' })

        const clocks = await Clock.find({ cashier: cashier_id })
        
        res.json({ clocks })
    } catch (error) {
        res.status(500).json({
            message: 'La solicitud ha fallado por favor intentarlo nuevamente',
            error
        })
    }
}


function formatDate(date) {
    return new Date(date).toLocaleDateString("en-US")
}