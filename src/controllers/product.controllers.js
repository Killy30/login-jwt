import Product from "../models/product.model.js";
import { pagination } from '../functions/paginations.js'
import Store from "../models/store.model.js";
import Category from '../models/category.model.js'
import yesId from "yes-id";

export const createProduct = async (req, res) => {
    const user = req.user;

    try {
        const store = await Store.findOne({ user: user._id })

        if (!store) return res.status(401).json({ message: 'Debes registrarte' })
        const products = await Product.find({ store: store._id })

        let data = req.body;
        let _itbis_ = data.itbis || 0.00;

        products.forEach(product => {
            if (product.code == data.code) {
                return res.status(401).json({ 
                    message: `Ya existe este codigo '${data.code}' en su lista de productos` 
                })
            }
        });

        const newProduct = new Product()
        newProduct.code = data.code;
        newProduct.name = data.name;
        newProduct.price = data.price;
        newProduct.description = data.description;
        newProduct.category = data.category;
        newProduct.itbis = _itbis_;
        newProduct.store = store;
        
        store.products.push(newProduct)

        await newProduct.save()
        await store.save()

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

        const store = await Store.findOne({ user: user._id })

        if (!store) return res.status(401).json({ message: 'Debes registrarte' })

        if (data.name.trim() == '' || data.code == '' || data.price == '') {
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

        const store = await Store.findOne({ user: user._id })
        const products = await Product.find({ store: store._id})

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
        const store = await Store.findOne({ user: user._id })
        const products = await Product.find({ store: store._id })

        if (!store) return res.status(401).json({ message: 'Debes registrarte' })
        
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
        const store = await Store.findOne({ user: user._id })
        const products = await Product.find({ store: store._id })
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
        const store = await Store.findOne({ user: user._id })
        if (!store) return res.status(401).json({ message: 'Debes registrarte' })

        const data = req.body;

        const newCategory = new Category();
        newCategory.name = data.category;
        newCategory.store = store;

        store.categorys.push(newCategory)

        await newCategory.save()
        await store.save()

        res.json({ 
            category: newCategory, 
            message: 'Nueva categoria ha sido agregada exitosamente' 
        })
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
        const store = await Store.findOne({ user: user._id })
        if (!store) return res.status(401).json({ message: 'Debes registrarte' })
        
        const categorys = await Category.find({ store: store._id })

        res.json({ categorys })
    } catch (error) {
        res.status(500).json({
            message: 'La solicitud ha fallado por favor intentarlo nuevamente',
            error
        })
    }
}

export const searchProduct = async (req, res) => {
    const user = req.user;
    const item = req.params.item.toLowerCase();

    try {
        const store = await Store.findOne({ user: user._id })
        if (!item) return res.status(401).json({ message: 'Debes registrarte' })
        
        const products = await Product.find({ store: store._id })

        const productSearched = products.filter(product => {
            let name = product.name.toLowerCase()
            let code = product.code.toString()
            let category = product.category.toLowerCase()

            return name.indexOf(item) != -1 
            || code.indexOf(item) != -1 
            || category.indexOf(item) != -1
        })

        res.json({ productSearched })
    } catch (error) {
        res.status(500).json({
            message: 'La solicitud ha fallado por favor intentarlo nuevamente',
            error
        })
    }
}
