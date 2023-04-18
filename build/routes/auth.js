"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = exports.jwtToken = exports.saltRounds = void 0;
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const bcrypt_1 = __importDefault(require("bcrypt"));
exports.saltRounds = 10;
const uuid_1 = require("uuid");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
exports.jwtToken = "shhhhhhh";
const utils_1 = require("../utils/utils");
const User_1 = require("../models/User");
const router = (0, express_1.default)();
exports.authRoutes = router;
router.post("/signup", utils_1.userValidation, utils_1.catchErrors, async ({ body }, res) => {
    //check se email già esistente nel database 
    const registeredUser = await User_1.User.findOne({ email: body.email });
    if (registeredUser) {
        return res.status(409).json({ message: "email is just present.." });
    }
    //questo serve a registare il nuovo utente, assegnargli un UUID, un token di
    //validazione e criptare la password con BCRIPT prima di salvarla.
    await User_1.User.create({
        name: body.name,
        surname: body.surname,
        email: body.email,
        password: await bcrypt_1.default.hash(body.password, exports.saltRounds),
        verify: (0, uuid_1.v4)()
    });
    //questi sono i dati tornati in response
    const userData = await User_1.User.findOne({ email: body.email });
    const responseUser = {
        id: userData === null || userData === void 0 ? void 0 : userData._id,
        name: userData === null || userData === void 0 ? void 0 : userData.name,
        surname: userData === null || userData === void 0 ? void 0 : userData.surname,
        email: userData === null || userData === void 0 ? void 0 : userData.email
    };
    //inserisce il nuovo utente nell'array di utenti
    return res.status(201).json(responseUser);
});
router.get("/validate/:tokenVerify", (0, express_validator_1.check)("tokenVerify").isString().notEmpty(), utils_1.catchErrors, async ({ params }, res) => {
    //questo serve a validare la mail, ci si deve attaccare il token UUID
    //per la validazione ("verify") e bisogna toglierlo all'utente per validarlo
    let findedUser = await User_1.User.findOne({ verify: params.tokenVerify });
    //se trova l'utente con il token cancella la proprietà verify
    if (findedUser) {
        await User_1.User.updateOne({ email: findedUser.email }, { $set: { verify: "" } });
        return res.status(200).json({ message: "user validated.." });
    }
    //altrimenti il token inserito non è valido
    return res.status(400).json({ message: "invalid token.." });
});
router.post("/login", utils_1.credentialsValidation, utils_1.catchErrors, async ({ body }, res) => {
    //questo serve ad autenticarsi, deve ricevere email e password
    //confrontare l'hash della password generato con BCRIPT 
    //con quello salvato e restituire un token generato con JWT
    const credentials = body;
    const registeredUser = await User_1.User.findOne({ email: credentials.email });
    //se l'utente che sta tentando di loggarsi è registrato controlla la password
    if (registeredUser) {
        if (registeredUser.verify) {
            return res.status(401).json({ message: "email is not verified.." });
        }
        const pwdMatch = await bcrypt_1.default.compare(credentials.password, registeredUser.password);
        //se la password matcha gli assegna un token JWT            
        if (pwdMatch) {
            const newToken = await jsonwebtoken_1.default.sign({ email: registeredUser.email }, exports.jwtToken, { expiresIn: "24h" });
            await User_1.User.updateOne({ email: registeredUser.email }, { $set: { token: newToken } });
            return res.status(200).json({ message: "user logged in..", token: newToken });
        }
        ;
        return res.status(401).json({ message: "invalid credentials.." });
    }
    ;
    return res.status(400).json({ message: "wrong data.." });
});
router.get("/me", utils_1.isAuth, async (_, res) => {
    const { loggedUser } = res.locals;
    const userData = {
        id: loggedUser === null || loggedUser === void 0 ? void 0 : loggedUser._id,
        name: loggedUser === null || loggedUser === void 0 ? void 0 : loggedUser.name,
        surname: loggedUser === null || loggedUser === void 0 ? void 0 : loggedUser.surname,
        email: loggedUser === null || loggedUser === void 0 ? void 0 : loggedUser.email
    };
    return res.status(200).json(userData);
});
