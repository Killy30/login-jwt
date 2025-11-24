import { Router } from "express";

import { authRequired } from "../config/validateToken.js";
import { 
    getHome,
    createBusiness,
    getBusinessInfo,
  
} from "../controllers/routes.controllers.js";

import { 
    connections, disconnections, getConnections, getClocks, disconnectionsByAdmin
} from "../controllers/connections.controllers.js";
import { 
    createStore, getStore 
} from "../controllers/store.controllers.js";
import { 
    createCashier, getCashiers, getCashier, getPaginationCashiers, cashierStatus,
    searchCashier
} from "../controllers/cashier.controllers.js";
import { 
    createCheckout, getCheckouts, getCheckout
} from "../controllers/checkout.controllers.js";
import { 
    createClient, getClients, getClient, getPaginationClients, searchClients
} from "../controllers/client.controllers.js";
import { 
    createProduct, updateProduct, changeProductStatus, getProduct, 
    getProducts, getPaginationProducts, getCategorys, createCategory, searchProduct
} from "../controllers/product.controllers.js";

import { 
    createSale, getSales, getSale, getPaginationSales, getAllTodaySales
} from "../controllers/sale.controllers.js";


const router = Router();

router.get('/', authRequired, getHome)

router.post('/business-config-admi-password', authRequired, createBusiness)
router.get('/get-business-info', authRequired, getBusinessInfo)

router.post('/new-category', authRequired, createCategory)
router.get('/get-categorys', authRequired, getCategorys)
router.post('/new-product', authRequired, createProduct)
router.get('/get-products', authRequired, getProducts)
router.get('/get-product/:code', authRequired, getProduct)
router.get('/get-products/pagination/:page', authRequired, getPaginationProducts)
router.get('/change-product-status/:id', authRequired, changeProductStatus)
router.put('/update-product',authRequired, updateProduct)
router.get('/search-product/:item',authRequired, searchProduct)

router.post('/new-sale', authRequired, createSale)
router.get('/get-sales', authRequired, getSales)
router.get('/get-today-sales', authRequired, getAllTodaySales)
router.get('/get-sales/page/:page', authRequired, getPaginationSales)
router.get('/sale/:id', authRequired, getSale)

router.post('/new-user', authRequired, createCashier)
router.get('/get-users', authRequired, getCashiers)
router.get('/get-user/:id', authRequired, getCashier)
router.get('/search-user/:name', authRequired, searchCashier)
router.get('/get-users/pagination/:page', authRequired, getPaginationCashiers)
router.put('/update-cashier-status/:id',authRequired, cashierStatus)

router.get('/get-clients', authRequired, getClients)
router.get('/client/:id', authRequired, getClient)
router.get('/search-client/:name', authRequired, searchClients)
router.get('/get-clients/pagination/:page', authRequired, getPaginationClients)
router.post('/new-client', authRequired, createClient)

router.get('/get-checkout/:id', authRequired, getCheckout)
router.post('/create-checkout', authRequired, createCheckout)
router.get('/get-checkouts', authRequired, getCheckouts)

router.get('/get-store', authRequired, getStore)
router.post('/create-store', authRequired, createStore)

router.get('/get-cashier-clocks/:id', authRequired, getClocks)
router.get('/get-user-connected/:data', authRequired, getConnections)
router.post('/connect-user', authRequired, connections)
router.put('/disconnect-user',authRequired, disconnections)
router.put('/disconnected-by-admin-user',authRequired, disconnectionsByAdmin)

export default router