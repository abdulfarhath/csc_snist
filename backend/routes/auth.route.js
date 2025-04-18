import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import authenticateJWT from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/register', async (req, res) => {
    try {
        const { name, username, password, email, branch, rollNo, year, tid } = req.body;

        const existingEmail = await User.findOne({ email });
        if (existingEmail) return res.status(400).json({ error: "Email already exists" });

        const existingUser = await User.findOne({ username });
        if (existingUser) return res.status(400).json({ error: "Username already taken" });

        const existingRollNo = await User.findOne({ rollNo });
        if (existingRollNo) return res.status(400).json({ error: "Roll number already exists" });

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({ 
            name, 
            username, 
            password: hashedPassword, 
            email, 
            branch, 
            rollNo, 
            year,
            tid,
            isVerified: false,
        });

        await newUser.save();

        res.status(201).json({ message: 'New member added to HTEAM' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email }).select("+password");
        if (!user) return res.status(404).json({ error: "No such user" });

        if (!user.isVerified) return res.status(403).json({ error: "User is not verified" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: "Incorrect password" });

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

        res.json({ token, user: { name: user.name, username: user.username, email: user.email, branch: user.branch, rollNo: user.rollNo, year: user.year } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get("/profile", authenticateJWT, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: "Unable to fetch user profile" });
    }
});

router.post('/adminlogin', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log(email, password);

        const adminEmail = "sundar@gmail.com";
        const adminPassword = "imthegoogleceo";

        if (email !== adminEmail || password !== adminPassword) {
            return res.status(401).json({ error: "Invalid admin credentials" });
        }

        const token = jwt.sign({ role: "admin" }, process.env.JWT_SECRET, { expiresIn: "1h" });

        res.json({ token, message: "Admin login successful" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
