"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const User_1 = __importDefault(require("../models/User"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const errorMessage = (error) => error instanceof Error ? error.message : 'Unknown error';
router.get('/me', auth_1.requireAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const authReq = req;
        const email = (_a = authReq.auth) === null || _a === void 0 ? void 0 : _a.email;
        if (!email) {
            res.status(401).json({ message: 'Missing authenticated user email' });
            return;
        }
        const user = yield User_1.default.findOne({
            where: { Email: email },
            attributes: ['UserID', 'FirstName', 'LastName', 'Email', 'Role'],
        });
        if (!user) {
            res.status(404).json({ message: `No user found for email ${email}` });
            return;
        }
        res.json(user);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching authenticated user', error: errorMessage(error) });
    }
}));
// GET all users
router.get('/', (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield User_1.default.findAll({
            attributes: ['UserID', 'FirstName', 'LastName', 'Email', 'Role']
        });
        res.json(users);
    }
    catch (error) {
        console.error('Error fetching users:', error); // Log the full error to the backend console
        res.status(500).json({ message: 'Error fetching users', error: errorMessage(error) });
    }
}));
// GET a single user by ID
router.get('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = parseInt(req.params.id, 10);
        const user = yield User_1.default.findByPk(id);
        if (user) {
            res.json(user);
        }
        else {
            res.status(404).json({ message: 'User not found' });
        }
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching user', error: errorMessage(error) });
    }
}));
// POST a new user
router.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const newUser = yield User_1.default.create(req.body);
        res.status(201).json(newUser);
    }
    catch (error) {
        res.status(500).json({ message: 'Error creating user', error: errorMessage(error) });
    }
}));
// PUT to update a user
router.put('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = parseInt(req.params.id, 10);
        const [updated] = yield User_1.default.update(req.body, {
            where: { UserID: id }
        });
        if (updated) {
            const updatedUser = yield User_1.default.findByPk(id);
            res.status(200).json(updatedUser);
        }
        else {
            res.status(404).json({ message: 'User not found' });
        }
    }
    catch (error) {
        res.status(500).json({ message: 'Error updating user', error: errorMessage(error) });
    }
}));
// DELETE a user
router.delete('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = parseInt(req.params.id, 10);
    try {
        const deleted = yield User_1.default.destroy({
            where: { UserID: id }
        });
        if (deleted) {
            res.status(204).send(); // No content
        }
        else {
            res.status(404).json({ message: 'User not found' });
        }
    }
    catch (error) {
        res.status(500).json({ message: 'Error deleting user', error: errorMessage(error) });
    }
}));
exports.default = router;
