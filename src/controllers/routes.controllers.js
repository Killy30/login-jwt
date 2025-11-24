import User from '../models/user.model.js'
import Product from '../models/product.model.js'
import Sale from '../models/sales.model.js'
import Cashier from '../models/cashiers.model.js'
import Checkout from '../models/checkout.model.js'
import Client from '../models/clients.model.js'
import SystemConfig from '../models/systemConfig.model.js'
import Category from '../models/category.model.js'
import UserCheckin from '../models/userCheckin.model.js'

import { pagination } from '../functions/paginations.js'

import yesId from 'yes-id'


export const getHome = async (req, res) => {
    try {
        res.json({ msg: 'server working' })
    } catch (error) {
        res.status(500).json({ message: 'Bad request, try again', error })
    }
}

export const createBusiness = async (req, res) => {
    try {
        const user = req.user;
        const data = req.body;

        console.log(req.body);
        const systemConfig = await SystemConfig.findOne({ user: user._id })
        if (!systemConfig) return res.status(401).json({ message: 'Debes registrarte' })

        systemConfig.business_name = data.business_name;
        systemConfig.business_address = data.business_address;
        systemConfig.business_address2 = data.business_address2;
        systemConfig.business_number = data.business_number;
        systemConfig.business_type = data.business_type;

        systemConfig.admi_password = data.admi_password;

        await systemConfig.save()
        res.json({ systemConfig })
    } catch (error) {
        res.status(500).json({ message: 'Fala al crear el business', error })
    }
}

export const getBusinessInfo = async (req, res) => {
    try {
        const user = req.user;
        const systemConfig = await SystemConfig.findOne({ user: user._id })
        const systemx = await SystemConfig.find()
        if (!systemConfig) return res.status(401).json({ message: 'Debes registrarte' })

        res.json({ systemConfig })
    } catch (error) {
        res.status(500).json({
            message: 'La solicitud ha fallado por favor intentarlo nuevamente',
            error
        })
    }
}

export const connectUser = async (req, res) => {
    try {
        const user = req.user;
        const data = req.body;

        const systemConfig = await SystemConfig.findOne({ user: user._id })
        if (!systemConfig) return res.status(401).json({ message: 'Debes registrarte' })
        
        if (data.user == 'admin') {

            if (data.code == systemConfig.admi_password) {

                systemConfig.connections.adminConnected = true;

                await systemConfig.save()
                return res.json({
                    connected: true,
                    user: systemConfig._id,
                    typeUser: 'admin',
                    userConnected: systemConfig
                })
            } else {
                return res.status(401).json({
                    connected: false,
                    message: 'Codigo de admin incorrecto'
                })
            }
        } else {
            const cashier = await Cashier.findById({ _id: data.user })
            const checkouts = await Checkout.find({ systemConfig: user.systemConfig })
            const checks = await UserCheckin.find({ cashier: cashier._id })

            if(cashier.id_code != data.code) {
                return res.status(401).json({
                    connected: false,
                    message: 'Codigo incorrecto'
                })
            }

            if(data.checkout == '') {
                return res.status(401).json({
                    connected: false,
                    message: 'Por favor seleccionar caja...'
                })
            }

            const checkout = checkouts.find(checkout => checkout.checkout == data.checkout)
            
            if(checkout.online) {
                return res.status(401).json({
                    connected: false,
                    message: 'Esta caja ya esta conectada, por favor seleccionar otra caja..'
                })
            }

            cashier.online = true;
            cashier.checkout = {checkout: checkout.checkout, id: checkout._id}
            checkout.online = true;
            checkout.cashier = `${cashier.name} ${cashier.lastName}`

            systemConfig.connections.listConnections.push(cashier._id)

            //checkin
            
            
            const datex = new Date(data.date)
            const todayx = `${datex.getMonth()}-${datex.getDate()}-${datex.getFullYear()}`

            const isCheckToday = checks.find(check =>{
                const date = new Date(check.createdAt)
                const today = `${date.getMonth()}-${date.getDate()}-${date.getFullYear()}`

                return today == todayx
            })

            if(!isCheckToday){
                const newCheck = new UserCheckin()
                newCheck.checkin.push(datex);
                newCheck.checkList.push({checkin: datex});
                newCheck.cashier = cashier;
                cashier.checkins = newCheck;

                await newCheck.save()
            }else{
                isCheckToday.checkin.push(datex)
                isCheckToday.checkList.push({checkin: datex})
                
                await isCheckToday.save()
            }
            
            await checkout.save()
            await cashier.save()
            await systemConfig.save()
            return res.json({
                connected: true,
                user: cashier._id,
                typeUser: 'user',
                userConnected: cashier,
                checkout: checkout._id,
                checkoutConnected: checkout
            })
        }

    } catch (error) {
        res.status(500).json({
            message: 'La solicitud ha fallado por favor intentarlo nuevamente',
            error
        })
    }
}

export const disconnectionUser = async (req, res) => {
    try {
        const user = req.user;
        const data = req.body;

        const systemConfig = await SystemConfig.findOne({ user: user._id })
        if (!systemConfig) return res.status(401).json({ message: 'Debes registrarte' })
        
        if (data.userId == systemConfig._id) {

            await SystemConfig.updateOne({ _id: systemConfig._id }, {
                $set: {
                    connections: {adminConnected: false}
                }
            })
        
            return res.json({
                connected: false,
                message: 'Admin desconectado'
            })
        } else {
                    
            await Cashier.updateOne({ _id: data.userId }, {
                $set: {
                    online: false,
                    checkout: {checkout: '', id: ''}
                }
            })

            await Checkout.updateOne({ _id: data.checkoutId }, {
                $set: {
                    online: false,
                    cashier: ''
                }
            })

            const index = systemConfig.connections.listConnections.indexOf(data.userId)
            systemConfig.connections.listConnections.splice(index, 1)
            
            //checkout
            const cashier = await Cashier.findById({ _id: data.userId })
            const checks = await UserCheckin.find({ cashier: cashier._id })

            const datex = new Date(data.date)
            const todayx = `${datex.getMonth()}-${datex.getDate()}-${datex.getFullYear()}`

            const isCheckToday = checks.find(check =>{
                const date = new Date(check.createdAt)
                const today = `${date.getMonth()}-${date.getDate()}-${date.getFullYear()}`

                return today == todayx
            })

            if(!isCheckToday){
                const newCheck = new UserCheckin()
                newCheck.checkout.push(datex);
                newCheck.checkList.push({checkout: datex});
                newCheck.cashier = cashier;
                cashier.checkins = newCheck;

                await newCheck.save()
            }else{
                isCheckToday.checkout.push(datex)
                isCheckToday.checkList.push({checkout: datex})
                
                await isCheckToday.save()
            }

            await systemConfig.save()
            return res.json({
                connected: false,
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

export const getCheckins = async (req, res) => {
    try {
        const user = req.user;
        const cashier_id = req.params.id
        const xx = yesId()
        
        if (!cashier_id) return res.status(401).json({ message: 'Debes registrarte' })

        console.log(xx);
    
        const checkinList = await UserCheckin.find({ cashier: cashier_id })
        
        res.json({ checkinList })
    } catch (error) {
        res.status(500).json({
            message: 'La solicitud ha fallado por favor intentarlo nuevamente',
            error
        })
    }
}

export const getUserConnected = async(req, res) => {
    const user = req.user;
    const data = JSON.parse(req.params.data)

    try {
        const systemConfig = await SystemConfig.findOne({ user: user._id })
        if (!systemConfig) return res.status(401).json({ message: 'Debes registrarte' })

        if(data.typeUser == 'admin'){
            return res.json({
                typeUser: 'admin',
                adminPermissions: systemConfig.connections.adminConnected,
                isMatched: data.userConnected == systemConfig._id,
                userConnected: systemConfig
            })
        }else if(data.typeUser == 'user'){
            if(systemConfig.connections.listConnections.includes(data.checkout)){

            }
            const cashiers = await Cashier.find({systemConfig: systemConfig._id})
            const checkout = await Checkout.findById({_id: data.checkout})

            const cashier = cashiers.find(cashier => cashier._id == data.userConnected)

            const cashierConnected = systemConfig.connections.listConnections.includes(cashier._id)

            return res.json({
                typeUser: 'user',
                userPermissions: cashierConnected,
                userConnected: cashier,
                checkoutConnected: checkout,
                isMatched: cashier._id == data.userConnected
            })
        }
    } catch (error) {
        res.status(500).json({
            message: 'La solicitud ha fallado por favor intentarlo nuevamente',
            error
        })
    }
}

export const createProduct = async (req, res) => {
    const user = req.user;

    try {
        const systemConfig = await SystemConfig.findOne({ user: user._id });
        if (!systemConfig) return res.status(401).json({ message: 'Debes registrarte' })
        const products = await Product.find({ systemConfig: systemConfig._id })

        let data = req.body;
        let _itbis_ = data.itbis || 0.00;

        products.forEach(product => {
            if (product.code == data.code) {
                return res.status(401).json({ message: `Ya existe este codigo '${data.code}' en la DB` })
            }
        });

        const newProduct = new Product()
        newProduct.code = data.code
        newProduct.name = data.name
        newProduct.price = data.price
        newProduct.description = data.description
        newProduct.category = data.category
        newProduct.itbis = _itbis_
        newProduct.systemConfig = systemConfig
        systemConfig.products.push(newProduct)

        await newProduct.save()
        await systemConfig.save()

        res.json({
            product: newProduct,
            message: 'El producto fue creado exitosamente'
        })
    } catch (error) {
        res.status(500).json({
            message: 'La solicitud ha fallado por favor intentarlo nuevamente',
            error
        })
    }
}

export const updateProduct = async (req, res) => {
    try {
        const user = req.user
        let data = req.body
        let _itbis_ = data.itbis || 0.00

        const systemConfig = await SystemConfig.findOne({ user: user._id });
        if (!systemConfig) return res.status(401).json({ message: 'Debes registrarte' })

        if (data.name.trim() == '' || data.code == '' || data.price == '') {
            console.log('siiii');
            return res.status(401).json({ message: 'Debes llenar todos los campos requeridos' })
        }

        await Product.updateOne({ _id: data.product_id }, {
            $set: {
                code: data.code,
                name: data.name,
                price: data.price,
                description: data.description,
                category: data.category,
                itbis: _itbis_
            }
        })

        return res.json({
            message: 'El producto fue actualizado correctamente'
        })
    } catch (error) {
        res.status(500).json({
            message: 'La solicitud ha fallado por favor intentarlo nuevamente',
            error
        })
    }
}

export const changeProductStatus = async (req, res) => {
    let id = req.params.id

    try {
        let product = await Product.findById({ _id: id })

        if (product.status) {
            product.status = false
        } else {
            product.status = true
        }

        await product.save()
        
        return res.json({ 
            message: "El estado del producto fue actualizado"
        })
    } catch (error) {
        res.status(500).json({
            message: "La solicitud ha fallado por favor intentarlo nuevamente",
            error
        })
    }
}

export const getProduct = async (req, res) => {
    const code = req.params.code
    const user = req.user;
    try {
        if (!user || !code) {
            return res.status(401).json({ message: 'Debes registrarte' })
        }
        const products = await Product.find({ systemConfig: user.systemConfig })

        const product = products.find(product => product.code == code)
        
        return res.json({ 
            product
        })
    } catch (error) {
        res.status(500).json({
            message: "La solicitud ha fallado por favor intentarlo nuevamente",
            error
        })
    }
}

export const getProducts = async (req, res) => {
    try {
        const user = req.user;
        const products = await Product.find({ systemConfig: user.systemConfig })
        if (!products) return res.status(401).json({ message: 'Debes registrarte' })
        
        const productsActive = products.filter(product => product.status == true)
        
        res.json({ products, productsActive })
    } catch (error) {
        res.status(500).json({
            message: 'La solicitud ha fallado por favor intentarlo nuevamente',
            error
        })
    }
}

export const getPaginationProducts = async (req, res) => {
    const { page } = req.params;
    const user = req.user;

    try {
        if (!page) return res.status(401).json({ message: 'Debes registrarte' })
        const products = await Product.find({ systemConfig: user.systemConfig })
        const data = pagination(products, 30)
        
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

export const createCategory = async (req, res) => {
    const user = req.user;

    try {
        const systemConfig = await SystemConfig.findOne({ user: user._id })
        if (!systemConfig) return res.status(401).json({ message: 'Debes registrarte' })

        const data = req.body;

        const newCategory = new Category;
        newCategory.name = data.category;
        newCategory.systemConfig = systemConfig;

        systemConfig.categorys.push(newCategory)

        await newCategory.save()
        await systemConfig.save()
        res.json({ category: newCategory, message: 'Nueva categoria ha sido agregada exitosamente' })
    } catch (error) {
        res.status(500).json({
            message: 'La solicitud ha fallado por favor intentarlo nuevamente',
            error
        })
    }
}

export const getCategorys = async (req, res) => {
    const user = req.user;

    try {
        const categorys = await Category.find({ systemConfig: user.systemConfig })

        if (!categorys) return res.status(401).json({ message: 'Debes registrarte' })

        res.json({ categorys })
    } catch (error) {
        res.status(500).json({
            message: 'La solicitud ha fallado por favor intentarlo nuevamente',
            error
        })
    }
}

export const createSale = async (req, res) => {
    const user = req.user;
    const data = req.body;
    console.log(data);
    
    try {
        const systemConfig = await SystemConfig.findOne({ user: user._id })
        const checkout = await Checkout.findById({ _id: data.checkout })
        const cashier = await Cashier.findById({ _id: data.cashier })

        if (!systemConfig) {
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

        const sales = await Sale.find({ systemConfig: systemConfig._id})

        function getCode() {
            if (sales.some(sale => sale.code === yesId(9, '100'))) {
                return getCode()
            }
            return yesId(9, '100')
        }

        const newSale = new Sale()
        newSale.code = getCode()
        newSale.totalPrice = data.totalPrice
        newSale.subTotal = data.subTotal
        newSale.itbis = data.itbis
        newSale.pay = data.pay
        newSale.cash = data.cash
        newSale.change = data.change
        newSale.paymentMethod = data.paymentMethod
        newSale.systemConfig = systemConfig

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
        
        await systemConfig.save();
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
        const sales = await Sale.find({ systemConfig: user.systemConfig })
        if (!sales) return res.status(401).json({ message: 'Debes registrarte' })
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
        const sales = await Sale.find({ systemConfig: user.systemConfig })
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

export const getCashiers = async (req, res) => {
    try {
        const user = req.user;
        const cashiers = await Cashier.find({ systemConfig: user.systemConfig })
        if (!cashiers) return res.status(401).json({ message: 'Debes registrarte' })

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
        const cashiers = await Cashier.find({ systemConfig: user.systemConfig })
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

export const createCashier = async (req, res) => {
    const user = req.user

    try {
        let data = req.body

        const systemConfig = await SystemConfig.findOne({ user: user._id })
        if (!systemConfig) return res.status(401).json({ message: 'Debes registrarte' })

        const cashiers = await Cashier.find({ systemConfig: user.systemConfig })

        function getCodeId() {
            if (cashiers.some(cashier => cashier.id_code === yesId(5))) {
                return getCodeId()
            }
            return yesId(5)
        }

        const newCashier = new Cashier()
        newCashier.name = data.name
        newCashier.lastName = data.lastName
        newCashier.id_document = data.id_document
        newCashier.tel = data.tel
        newCashier.email = data.email
        newCashier.id_code = getCodeId()
        newCashier.systemConfig = systemConfig
        systemConfig.cashiers.push(newCashier)

        await systemConfig.save()
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

        const systemConfig = await SystemConfig.findOne({ user: user._id })
        const cashier = await Cashier.findById({ _id: id })

        if (!systemConfig || !cashier){
            return res.status(401).json({
                message: 'Por favor refrescar e intentar nuevamente...' 
            })
        }

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

// export const createCheckout

export const createClient = async (req, res) => {
    const user = req.user;

    try {
        const data = req.body

        const clients = await Client.find({ systemConfig: user.systemConfig })
        const systemConfig = await SystemConfig.findOne({ user: user._id })
        
        if (!user){
            return res.status(401).json({
                message: 'Por favor refrescar e intentar nuevamente...' 
            })
        }

        function getCodeId() {
            let x = systemConfig.business_name[0].toUpperCase()

            if (clients.some(client => client.id_client === yesId(8, `P${x}-`))) {
                return getCodeId()
            }
            return yesId(8, `P${x}-`)
        }

        const newClient = new Client()
        newClient.name = data.name;
        newClient.lastName = data.lastName;
        newClient.tel = data.tel;
        newClient.id_document = data.id_document;
        newClient.email = data.email;
        newClient.id_client = data.id_client || getCodeId()
        newClient.systemConfig = systemConfig

        systemConfig.clients.push(newClient)

        await systemConfig.save()
        await newClient.save()

        res.json({message: 'El cliente fue creado exitosamente'})
    } catch (error) {
        res.status(500).json({
            message: 'La solicitud ha fallado por favor intentarlo nuevamente.',
            error
        })
    }
}

export const getClients = async (req, res) => {
    try {
        const user = req.user;
        const clients = await Client.find({ systemConfig: user.systemConfig })
        if (!clients){
            return res.status(401).json({
                message: 'Por favor refrescar e intentar nuevamente...' 
            }) 
        }
        
        res.json({ clients })
    } catch (error) {
        res.status(500).json({
            message: 'La solicitud ha fallado por favor intentarlo nuevamente',
            error
        })
    }
}

export const getClient = async (req, res) => {
    try {
        const user = req.user;
        const id = req.params.id;
        
        if (!id){
            return res.status(401).json({
                message: 'Por favor refrescar e intentar nuevamente...' 
            }) 
        }

        const client = await Client.findById({ _id: id })
        const clientPurchases = await Sale.find({ client: id })

        res.json({ client, clientPurchases})
    } catch (error) {
        res.status(500).json({
            message: 'La solicitud ha fallado por favor intentarlo nuevamente',
            error
        })
    }
}

export const getPaginationClients = async (req, res) => {
    const { page } = req.params;
    const user = req.user;

    try {
        if (!page) return res.status(401).json({ message: 'Debes registrarte' })
        const clients = await Client.find({ systemConfig: user.systemConfig })
        const data = pagination(clients, 30)
        
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

export const createCheckout = async (req, res) => {
    const user = req.user;

    try {

        const checkouts = await Checkout.find({ systemConfig: user.systemConfig })
        const systemConfig = await SystemConfig.findOne({ user: user._id })

        if (!systemConfig){
            return res.status(401).json({
                message: 'Por favor refrescar e intentar nuevamente...' 
            })
        }

        const count = checkouts.length; 

        const newCheckout = new Checkout()
        newCheckout.checkout = count + 1;
        newCheckout.entryCode = yesId(4, `${count + 1}00`)
        newCheckout.systemConfig = systemConfig
        systemConfig.checkouts.push(newCheckout)

        await systemConfig.save()
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
        const checkouts = await Checkout.find({ systemConfig: user.systemConfig })
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