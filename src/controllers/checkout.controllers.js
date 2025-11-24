import Checkout from "../models/checkout.model.js";
import Sale from "../models/sales.model.js";
import Store from "../models/store.model.js";
import yesId from "yes-id";


export const createCheckout = async (req, res) => {
    const user = req.user;

    try {
        const store = await Store.findOne({ user: user._id })
        const checkouts = await Checkout.find({ store: store._id })

        if (!checkouts){
            return res.status(401).json({
                message: 'Por favor refrescar e intentar nuevamente...' 
            })
        }

        const count = checkouts.length; 

        const newCheckout = new Checkout()
        newCheckout.checkout = count + 1;
        newCheckout.entryCode = yesId(4, `${count + 1}00`);
        newCheckout.store = store;
        store.checkouts.push(newCheckout);

        await store.save()
        await newCheckout.save()

        res.json({ message: `La caja #${count + 1} fue creado exitosamente` })
    } catch (error) {
        res.status(500).json({
            message: 'La solicitud ha fallado por favor intentarlo nuevamente',
            error
        })
    }
}

export const getCheckouts = async(req, res) =>{
    try {
        const user = req.user;

        const store = await Store.findOne({ user: user._id })
        const checkouts = await Checkout.find({ store: store._id })

        if (!checkouts){
            return res.status(401).json({
                message: 'Por favor refrescar e intentar nuevamente...' 
            }) 
        }
        
        res.json({ checkouts })
    } catch (error) {
        res.status(500).json({
            message: 'La solicitud ha fallado por favor intentarlo nuevamente',
            error
        })
    }
}

export const getCheckout = async(req, res) =>{
    try {
        const user = req.user;
        const id = req.params.id;
        
        if (!id){
            return res.status(401).json({
                message: 'Por favor refrescar e intentar nuevamente...'
            }) 
        }

        const checkout = await Checkout.findById({ _id: id })

        const checkoutSales = await Sale.find({checkout: checkout._id}).populate('cashier')

        const todaySales = checkoutSales.filter(sale => {
            const today = new Date(Date.now())
            const salesDate = new Date(sale.createdAt)
            const todayx = `${today.getDate()}/${today.getMonth()+1}/${today.getFullYear()}`
            const salesDatex = `${salesDate.getDate()}/${salesDate.getMonth()+1}/${salesDate.getFullYear()}`

            return todayx == salesDatex
        })
        
        res.json({ checkout, checkoutSales, todaySales })
    } catch (error) {
        res.status(500).json({
            message: 'La solicitud ha fallado por favor intentarlo nuevamente',
            error
        })
    }
}

