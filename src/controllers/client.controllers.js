import Client from "../models/clients.model.js";
import Sale from "../models/sales.model.js";
import { pagination } from '../functions/paginations.js'
import Store from "../models/store.model.js";
import yesId from "yes-id";

export const createClient = async (req, res) => {
    const user = req.user;

    try {
        const data = req.body;

        const store = await Store.findOne({ user: user._id })
        const clients = await Client.find({ store: store._id })
        
        if (!store){
            return res.status(401).json({
                message: 'Por favor refrescar e intentar nuevamente...' 
            })
        }

        function getCodeId() {
            let x = store.storeName[0].toUpperCase()
            
            if (clients.some(client => client.id_client === yesId(7, `P${x}-`))) {
                return getCodeId()
            }

            return yesId(7, `P${x}-`)
        }
        console.log(data);
        
        const newClient = new Client();
        newClient.name = data.name;
        newClient.lastName = data.lastName;
        newClient.phoneNumber = data.phoneNumber;
        newClient.id_document = data.id_document;
        newClient.email = data.email;
        newClient.id_client = getCodeId();
        newClient.address = data.address;
        newClient.store = store;
        
        store.clients.push(newClient)

        await store.save()
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

        const store = await Store.findOne({ user: user._id })
        const clients = await Client.find({ store: store._id })

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

        const store = await Store.findOne({ user: user._id })
        const clients = await Client.find({ store: store._id })
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

export const searchClients = async (req, res) => {
    const user = req.user;
    const name = req.params.name.toLowerCase();

    try {
        if (!name) return res.status(401).json({ message: 'Debes registrarte' })

        const store = await Store.findOne({ user: user._id })
        const clients = await Client.find({ store: store._id })
        
        const clientsSearched = clients.filter(client => {
            let namex = client.name.toLowerCase()
            let lastName = client.lastName.toLowerCase()
            let id_client = client.id_client.toLowerCase()
            let id_document = client.id_document.toLowerCase()
            let phoneNumber = client.phoneNumber.toString()

            return namex.indexOf(name) !== -1 
            || lastName.indexOf(name) !== -1
            || id_client.indexOf(name) !== -1 
            || id_document.indexOf(name) !== -1
            || phoneNumber.indexOf(name) !== -1
        })

        res.json({ clientsSearched })
    } catch (error) {
        res.status(500).json({
            message: 'La solicitud ha fallado por favor intentarlo nuevamente',
            error
        })
    }
}



