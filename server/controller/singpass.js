class SingpassController {
    static check = async (req,res) => {
        try {
            res.status(200).json({
                message : 'singpass controller ready'
            })
        } catch (error) {
            throw error
        }
    }
}

module.exports = SingpassController;