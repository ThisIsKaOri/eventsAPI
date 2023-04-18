import express, { Response, Request } from "express";
import { check } from "express-validator";

import bcrypt from "bcrypt";
export const saltRounds = 10;
import { v4 } from "uuid";
import jwt from "jsonwebtoken";
export const jwtToken = "shhhhhhh";

import { userValidation, credentialsValidation, catchErrors, isAuth } from "../utils/utils";
import { User } from "../models/User";

const router = express();

router.post("/signup",
userValidation, catchErrors,
async ({ body }: Request, res: Response) => {
    //check se email già esistente nel database 
    const registeredUser = await User.findOne({ email: body.email});
    if (registeredUser) {
        return res.status(409).json({ message: "email is just present.." })
    }
    //questo serve a registare il nuovo utente, assegnargli un UUID, un token di
    //validazione e criptare la password con BCRIPT prima di salvarla.
    await User.create ({
        name: body.name,
        surname: body.surname,
        email: body.email,
        password: await bcrypt.hash(body.password, saltRounds),
        verify: v4()
    });
    //questi sono i dati tornati in response
    const userData = await User.findOne({ email : body.email});
    const responseUser = {
        id: userData?._id,
        name: userData?.name,
        surname: userData?.surname,
        email: userData?.email

    }
    //inserisce il nuovo utente nell'array di utenti
    return res.status(201).json(responseUser);
});

router.get("/validate/:tokenVerify", 
check("tokenVerify").isString().notEmpty(),
catchErrors,
async ({ params }, res: Response) => {
    //questo serve a validare la mail, ci si deve attaccare il token UUID
    //per la validazione ("verify") e bisogna toglierlo all'utente per validarlo
    let findedUser = await User.findOne({ verify: params.tokenVerify });
    //se trova l'utente con il token cancella la proprietà verify
    if(findedUser) {
        await User.updateOne({email: findedUser.email}, {$set: {verify: ""}});
        return res.status(200).json({ message: "user validated.." });
    }
    //altrimenti il token inserito non è valido
    return res.status(400).json({message: "invalid token.."});
});

router.post("/login", 
credentialsValidation, catchErrors,
async ({ body }: Request, res: Response) => {
    //questo serve ad autenticarsi, deve ricevere email e password
    //confrontare l'hash della password generato con BCRIPT 
    //con quello salvato e restituire un token generato con JWT
    const credentials = body;
    const registeredUser = await User.findOne({ email: credentials.email });
    //se l'utente che sta tentando di loggarsi è registrato controlla la password
    if(registeredUser) {
        if(registeredUser.verify){
            return res.status(401).json({message: "email is not verified.."})
        }
        const pwdMatch = await bcrypt.compare(credentials.password, registeredUser.password as string);
        //se la password matcha gli assegna un token JWT            
        if (pwdMatch) {
            const newToken = await jwt.sign(
                {email: registeredUser.email}, 
                jwtToken, 
                {expiresIn: "24h"}
            );
            await User.updateOne({email: registeredUser.email}, { $set: { token: newToken }});
            return res.status(200).json({ message: "user logged in..", token: newToken });
        };
        return res.status(401).json({message: "invalid credentials.."});        
    }; 
    return res.status(400).json({message: "wrong data.."});
});

router.get("/me", isAuth, async (_, res: Response) => {
    const { loggedUser } = res.locals;   
    const userData = {
        id: loggedUser?._id,
        name: loggedUser?.name,
        surname: loggedUser?.surname,
        email: loggedUser?.email
    }
    return res.status(200).json(userData);    
});

export {router as authRoutes}
