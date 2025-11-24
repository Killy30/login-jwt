import Sale from "../models/sales.model.js";
import Cashier from "../models/cashiers.model.js";
import Checkout from "../models/checkout.model.js";
import Client from "../models/clients.model.js";
import { pagination } from '../functions/paginations.js'
import Store from "../models/store.model.js";
import yesId from 'yes-id'
import { formatDate } from "../functions/format.js";


export const createSale = async (req, res) => {
    const user = req.user;
    const data = req.body;

    console.log(data);
    
    
    try {
        const store = await Store.findOne({ user: user._id })
        const checkout = await Checkout.findById({ _id: data.checkout })
        const cashier = await Cashier.findById({ _id: data.cashier })

        if (!store) {
            return res.status(401).json({ message: 'Debes registrarte' })
        }
        if (!checkout) {
            return res.status(401).json({
                message: 'Debes conectarte con una caja' 
            })
        }
        if (!cashier) {
            return res.status(401).json({
                message: 'El usuario debe iniciar sesion para realizar la venta' 
            })
        }

        const sales = await Sale.find({ store: store._id})

        function getCode() {
            if (sales.some(sale => sale.code === yesId(9, '100'))) {
                return getCode()
            }
            return yesId(9, '100')
        }

        console.log(data);

        const newSale = new Sale()
        newSale.code = getCode()
        newSale.totalPrice = data.totalPrice
        newSale.subTotal = data.subTotal
        newSale.itbis = data.itbis
        newSale.pay = data.pay
        newSale.cash = data.cash
        newSale.change = data.change
        newSale.paymentMethod = data.paymentMethod
        newSale.store = store

        data.products.forEach(product => {
            let prod = {
                productCode: product.code,
                productName: product.name,
                salePrice: product.price,
                itbis: product.itbis
            }
            newSale.products.push(product)
            newSale.productsSold.push(prod)
        });

        newSale.checkout = checkout;
        newSale.cashier = cashier;
        checkout.sales.push(newSale);
        cashier.sales.push(newSale);
        
        if (data.client) {
            const client = await Client.findById({ _id: data.client });
            newSale.client = client;
            client.sales.push(newSale);
            await client.save();
        }

        store.sales.push(newSale)
        
        await store.save();
        await checkout.save();
        await cashier.save();
        await newSale.save();

        return res.json({ 
            sale: newSale,
            message: 'La venta se completo exitosamente' 
        })
    } catch (error) {
        res.status(500).json({
            message: 'La solicitud ha fallado por favor intentarlo nuevamente',
            error
        })
    }
}

export const getSales = async (req, res) => {
    try {
        const user = req.user;
        const store = await Store.findOne({ user: user._id })
        if (!store) return res.status(401).json({ message: 'Debes registrarte' })

        const sales = await Sale.find({ store: store._id })

        res.json({ sales })
    } catch (error) {
        res.status(500).json({
            message: 'La solicitud ha fallado por favor intentarlo nuevamente',
            error
        })
    }
}

export const getPaginationSales = async (req, res) => {
    const { page } = req.params;
    const user = req.user;

    try {
        if (!page) return res.status(401).json({ message: 'Debes registrarte' })
        const store = await Store.findOne({ user: user._id })
        const sales = await Sale.find({ store: store._id })
        const data = pagination(sales, 30)
        
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

export const getSale = async (req, res) => {
    try {
        const user = req.user;
        const id = req.params.id;
        if (!id) return res.status(401).json({ message: 'Debes registrarte' })

        const sale = await Sale.findById({ _id: id }).populate({
            path: 'cashier',
            select: 'name lastName'
        })

        res.json({ sale })
    } catch (error) {
        res.status(500).json({
            message: 'La solicitud ha fallado por favor intentarlo nuevamente',
            error
        })
    }
}

export const getAllTodaySales = async (req, res) => {
    try {
        const user = req.user;
        const store = await Store.findOne({ user: user._id })
        if (!store) return res.status(401).json({ message: 'Debes registrarte' })

        const sales = await Sale.find({ store: store._id }).populate({path: 'checkout', select: 'checkout'})
        const checkouts = await Checkout.find({ store: store._id }).populate({
            path: 'sales', 
            select: 'productsSold totalPrice paymentMethod createdAt'
        })

        const todaySales = sales.filter(sale => {
            return formatDate(new Date()) == formatDate(sale.createdAt)
        })

        const todaySalesInfo = {}

        const paymentMethods = Object.groupBy(todaySales, ({ paymentMethod }) => paymentMethod)
        
        const paymentMethodsQty = {
            cash: paymentMethods.efectivo?.length ?? 0,
            transfer: paymentMethods.transferencia?.length ?? 0,
            card: paymentMethods.tarjeta?.length ?? 0,
            cash_card: paymentMethods.efe_tar?.length ?? 0
        }

        const paymentMethodsTotal = {
            cash: paymentMethods.efectivo?.reduce((acc, sale) => acc = acc + parseFloat(sale.totalPrice), 0) ?? 0.00,
            transfer: paymentMethods.transferencia?.reduce((acc, sale) => acc = acc + parseFloat(sale.totalPrice), 0)  ?? 0.00,
            card: paymentMethods.tarjeta?.reduce((acc, sale) => acc = acc + parseFloat(sale.totalPrice), 0)  ?? 0.00,
        }

        const content = {};
        const headerData = {};
        const productsSold = [];

        todaySales.forEach(element => {
            element.productsSold.forEach(item => productsSold.push(item))
        })


        //checkouts 
        const checkouts_grouped = [];

        checkouts.forEach(checkout => {
            const x = {};
            const products = [];
            const checkout_today_sales = checkout.sales.filter(sale => {
                return formatDate(new Date()) == formatDate(sale.createdAt)
            })
            const cashSales = checkout_today_sales.filter(item => item.paymentMethod == 'efectivo');
            checkout_today_sales.forEach(sale => products.push(...sale.productsSold))

            x.checkout = checkout.checkout;
            x.salesQty = checkout_today_sales.length;
            x.total = checkout_today_sales.reduce((acc, sale) => acc = acc + parseFloat(sale.totalPrice), 0) ?? 0.00;
            x.cash = cashSales.reduce((acc, sale) => acc = acc + parseFloat(sale.totalPrice), 0) ?? 0.00;
            x.productsSold = products.length;
            checkouts_grouped.push(x)
        })

        headerData.salesQty = todaySales.length;
        headerData.productsSold = productsSold.length;
        headerData.totalSales = todaySales.reduce((acc, sale) => acc = acc + parseFloat(sale.totalPrice), 0) ?? 0.00;   

        content.paymentMethodsQty = paymentMethodsQty;
        content.paymentMethodsTotal = paymentMethodsTotal;

        todaySalesInfo.paymentMethods = content;
        todaySalesInfo.checkouts = checkouts_grouped;
        todaySalesInfo.headerData = headerData;

        // console.log(todaySalesInfo);
        console.log(checkouts_grouped);

        res.json({ todaySalesInfo })
    } catch (error) {
        res.status(500).json({
            message: 'La solicitud ha fallado por favor intentarlo nuevamente',
            error
        })
    }
}