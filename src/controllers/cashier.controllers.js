import Cashier from "../models/cashiers.model.js";
import { pagination } from '../functions/paginations.js'
import Store from "../models/store.model.js";
import yesId from "yes-id";
import User from "../models/user.model.js";


export const getCashiers = async (req, res) => {
    try {
        const user = req.user;
        if (!user) return res.status(401).json({ message: 'Debes registrarte' })

        const store = await Store.findOne({ user: user._id })
        const cashiers = await Cashier.find({ store: store._id })
        const cashiersActive = cashiers.filter(cashier => cashier.status == true)

        res.json({ cashiers, cashiersActive })

    } catch (error) {
        res.status(500).json({
            message: 'La solicitud ha fallado por favor intentarlo nuevamente',
            error
        }) 
    }
}

export const getPaginationCashiers = async (req, res) => {
    const { page } = req.params;
    const user = req.user;

    try {
        if (!page) return res.status(401).json({ message: 'Debes registrarte' })

        const store = await Store.findOne({ user: user._id })
        const cashiers = await Cashier.find({ store: store._id })
        const data = pagination(cashiers, 30)
        
        res.json({
            currentPageList: data.listSplit[page-1],
            pages: data.page,
            len: data.len,
        })
    } catch (error) {
        res.status(500).json({
            message: 'La solicitud ha fallado por favor intentarlo nuevamente',
            error
        })
    }
}

export const getCashier = async (req, res) => {
    try {
        const user = req.user;
        const id = req.params.id;
        
        if (!id) return res.status(401).json({ message: 'Debes registrarte' })

        const cashier = await Cashier.findById({ _id: id})

        res.json({ cashier })
    } catch (error) {
        res.status(500).json({
            message: 'La solicitud ha fallado por favor intentarlo nuevamente',
            error
        }) 
    }
}

export const searchCashier = async (req, res) => {
    try {
        const user = req.user;
        const name = req.params.name.toLowerCase();
        
        if (!name) return res.status(401).json({ message: 'Debes registrarte' })

        const store = await Store.findOne({ user: user._id })
        const cashiers = await Cashier.find({ store: store._id})

        const cashierSearched = cashiers.filter(cashier => {
            let namex = cashier.name.toLowerCase()
            let lastName = cashier.lastName.toLowerCase()
            let id_code = cashier.id_code.toString()
            let id_document = cashier.id_document.toLowerCase()

            return namex.indexOf(name) != -1 
            || id_code.indexOf(name) != -1 
            || lastName.indexOf(name) != -1
            || id_document.indexOf(name) != -1
        })

        res.json({ cashierSearched })
    } catch (error) {
        res.status(500).json({
            message: 'La solicitud ha fallado por favor intentarlo nuevamente',
            error
        }) 
    }
}

export const createCashier = async (req, res) => {
    const user = req.user

    try {
        let data = req.body

        if (!user) return res.status(401).json({ message: 'Debes registrarte' })
            
        const store = await Store.findOne({ user: user._id })
        const cashiers = await Cashier.find({ store: store._id })

        function getCodeId() {
            if (cashiers.some(cashier => cashier.id_code === yesId(5))) {
                return getCodeId()
            }
            return yesId(5)
        }

        const newCashier = new Cashier()
        newCashier.name = data.name;
        newCashier.lastName = data.lastName;
        newCashier.id_document = data.id_document;
        newCashier.phoneNumber = data.phoneNumber;
        newCashier.address = data.address;
        newCashier.email = data.email;
        newCashier.id_code = getCodeId();
        newCashier.store = store;
        store.cashiers.push(newCashier)

        console.log(data);
        
        await store.save()
        await newCashier.save()

        return res.json({
            cashier: newCashier,
            message: 'Usuario creado exitosamente'
        })
    } catch (error) {
        res.status(500).json({
            message: 'La solicitud ha fallado por favor intentarlo nuevamente',
            error
        })
    }
}

export const cashierStatus = async (req, res) => {
    const user = req.user;
    const id = req.params.id;

    try {

        if (!id){
            return res.status(401).json({
                message: 'Por favor refrescar e intentar nuevamente...' 
            })
        }
        const store = await Store.findOne({ user: user._id })
        const cashier = await Cashier.findById({ _id: id })


        if (cashier.status) {
            cashier.status = false
            await cashier.save()
            return res.json({
                message: 'El estado fue actualizado exitosamente.' 
            })
        }

        if (!cashier.status) {
            cashier.status = true
            await cashier.save()
            return res.json({
                message: 'El estado fue actualizado exitosamente.' 
            })
        }
    } catch (error) {
        res.status(500).json({
            message: 'La solicitud ha fallado por favor intentarlo nuevamente.',
            error
        })
    }
}