import { Response, Request, NextFunction} from "express";
import { body, validationResult } from "express-validator";

import jwt from "jsonwebtoken";
export const jwtToken = "shhhhhhh";

import { User } from "../models/User";

export const isAuth = async ({ headers }: Request, res: Response, next: NextFunction) => {
    try {
        //prende la mail con cui è stato generato il token facendo il match tra 
        //il token presente nell'header e la passphrase(jwtToken)
        const tokenMail = await jwt.verify(headers.authorization!, jwtToken) as {email : string};
        //controlla se nel database è presente l'utente con quella mail e
        //assegna la mail alla variabile loggedUser
        res.locals.loggedUser = await User.findOne({email: tokenMail.email});        
        next();  
    } catch (error) {
        return res.status(401).json({message: "user not logged.."});
    }   
};

export const catchErrors = (req: Request, res: Response, next: NextFunction) => {
    //gestione errori validator
    const errors = validationResult(req); 
    //se l'array non è vuoto e quindi ci sono errori
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    };
    next();
};

export const userValidation = [
    body("name").notEmpty().withMessage("name value required"),
    body("surname").notEmpty().withMessage("surname value required"),
    body("email").isEmail().withMessage("invalid email"),
    body("password").isLength({ min: 4 }).withMessage("short password"),
];

export const credentialsValidation = [
    body("email").isEmail().notEmpty().withMessage("invalid email"),
    body("password").isString().notEmpty().withMessage("invalid password"),
];

export const eventValidation = [
    body("name").isString().notEmpty().withMessage("Invalid name value"),
    body("location").isString().notEmpty().withMessage("Invalid location value"),
    body("date").isISO8601().toDate().notEmpty().withMessage("Invalid date value"), 
    body("price").isInt().notEmpty().withMessage("Invalid price value"), 
    body("tickets").isInt().notEmpty().withMessage("Invalid quantity value"), 
    body("kind").isString().notEmpty().withMessage("Invalid kind value")
];