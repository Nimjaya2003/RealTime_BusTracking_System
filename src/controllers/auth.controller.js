

const authService = require('../services/auth.services');
 



/**
 * Register controller
 */
const register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        if(!name || !email || !password || !role) {
            return res.status(400).json({message:"All fields are required"});
        }

        await authService.registerUser(name, email, password, role);

        res.status(201).json({
            message: 'User registered successfully'
        });
    } catch (error) {
        res.status(400).json({
            message: error.message
        });
    }
};
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password required' });
        }

        const result = await authService.loginUser(email, password);

        // TEMP: Just to verify flow
        res.status(200).json({
            
            message: 'Login Successful!',
            token: result.token,
            role: result.role,
            
                
        });
    } catch (error) {
        res.status(401).json({
            
            message: error.message
        });
    }
};
module.exports = {
    register,
    login
};
