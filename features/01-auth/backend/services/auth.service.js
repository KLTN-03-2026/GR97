import User from '../../models/User.js';
import bcrypt from 'bcrypt';
import jwt from '../../utils/jwt.js';

const authService = {
    register: async (userData) => {
        const { email, password } = userData;
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ email, password: hashedPassword });
        await newUser.save();
        return newUser;
    },

    login: async (email, password) => {
        const user = await User.findOne({ email });
        if (!user) {
            throw new Error('User not found');
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            throw new Error('Invalid credentials');
        }
        const token = jwt.sign({ id: user._id });
        return { user, token };
    },

    getUserById: async (id) => {
        return await User.findById(id);
    }
};

export default authService;