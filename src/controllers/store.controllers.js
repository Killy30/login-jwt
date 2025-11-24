import User from '../models/user.model.js'
import Store from '../models/store.model.js';
import SystemConfig from '../models/systemConfig.model.js'

export const createStore = async (req, res) => {
    try {
        const user = req.user;
        const data = req.body;

        const myUser = await User.findOne({ _id: user._id })
        const systemConfig = await SystemConfig.findOne({ user: user._id })
        
        if (!user) return res.status(401).json({ message: 'Debes registrarte' })
        if(user.store) {
            return res.status(401).json({ 
                message: 'Su tienda/servicio ya fue creada, por favor dirigirse a su perfil...' 
            })
        }
            
        const newStore = new Store();
        
        newStore.storeName = data.storeName;
        newStore.storeType = data.storeType;
        newStore.phoneNumber = data.phoneNumber;
        newStore.address = data.address;
        newStore.address2 = data.address2;
        newStore.user = myUser;
        myUser.store = newStore;
            
        systemConfig.admi_password = data.admi_password;
        console.log(data);
        
        await newStore.save();
        await systemConfig.save()
        await myUser.save()

        res.json({ store: newStore })
    } catch (error) {
        res.status(500).json({ 
            message: 'Algo ha fallado al crear el store', 
            error 
        })
    }
}

export const getStore = async (req, res) => {
    const user = req.user;

    try {
        if (!user) return res.status(401).json({ message: 'Debes registrarte' })

        const store = await Store.findOne({ user: user._id })

        res.json({ store })

    } catch (error) {
        res.status(500).json({
            message: 'La solicitud ha fallado por favor intentar nuevamente',
            error
        })
    }
}



