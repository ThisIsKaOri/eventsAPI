"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventValidation = exports.credentialsValidation = exports.userValidation = exports.catchErrors = exports.isAuth = exports.jwtToken = void 0;
const express_validator_1 = require("express-validator");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
exports.jwtToken = "shhhhhhh";
const User_1 = require("../models/User");
const isAuth = async ({ headers }, res, next) => {
    try {
        //prende la mail con cui è stato generato il token facendo il match tra 
        //il token presente nell'header e la passphrase(jwtToken)
        const tokenMail = await jsonwebtoken_1.default.verify(headers.authorization, exports.jwtToken);
        //controlla se nel database è presente l'utente con quella mail e
        //assegna la mail alla variabile loggedUser
        res.locals.loggedUser = await User_1.User.findOne({ email: tokenMail.email });
        next();
    }
    catch (error) {
        return res.status(401).json({ message: "user not logged.." });
    }
};
exports.isAuth = isAuth;
const catchErrors = (req, res, next) => {
    //gestione errori validator
    const errors = (0, express_validator_1.validationResult)(req);
    //se l'array non è vuoto e quindi ci sono errori
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    ;
    next();
};
exports.catchErrors = catchErrors;
exports.userValidation = [
    (0, express_validator_1.body)("name").notEmpty().withMessage("name value required"),
    (0, express_validator_1.body)("surname").notEmpty().withMessage("surname value required"),
    (0, express_validator_1.body)("email").isEmail().withMessage("invalid email"),
    (0, express_validator_1.body)("password").isLength({ min: 4 }).withMessage("short password"),
];
exports.credentialsValidation = [
    (0, express_validator_1.body)("email").isEmail().notEmpty().withMessage("invalid email"),
    (0, express_validator_1.body)("password").isString().notEmpty().withMessage("invalid password"),
];
exports.eventValidation = [
    (0, express_validator_1.body)("name").isString().notEmpty().withMessage("Invalid name value"),
    (0, express_validator_1.body)("location").isString().notEmpty().withMessage("Invalid location value"),
    (0, express_validator_1.body)("date").isISO8601().toDate().notEmpty().withMessage("Invalid date value"),
    (0, express_validator_1.body)("price").isInt().notEmpty().withMessage("Invalid price value"),
    (0, express_validator_1.body)("tickets").isInt().notEmpty().withMessage("Invalid quantity value"),
    (0, express_validator_1.body)("kind").isString().notEmpty().withMessage("Invalid kind value")
];
