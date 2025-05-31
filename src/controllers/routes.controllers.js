

export const getHome = async(req, res) => {
    try {
        res.json({msg: 'server working'})
    } catch (error) {
        res.status(500).json({message:'Bad request, try again', error})
    }
}