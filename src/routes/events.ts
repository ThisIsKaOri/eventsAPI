import express, { Response, Request} from "express";
import { check, body, query } from "express-validator";

import { eventValidation, catchErrors, isAuth } from "../utils/utils";
import { Event } from "../models/Event";

const router = express();

//crea un evento
router.post("/", 
eventValidation, catchErrors, isAuth,
async ({ body }: Request, res: Response) => { 
    const { loggedUser } = res.locals; //res.locals.loggedUser esce da isAuth
    //controlliamo se l'utente é validato
    if(loggedUser.verify == ""){
        //cerchiamo se l'evento é gia presente
        const findedEvent = await Event.findOne({ name: body.name, location: body.location});
        if (findedEvent) {
            return res.status(409).json({ message: "event already exist.." })
        }
        //se non esiste lo creiamo
        await Event.create ({
            name: body.name,
            location: body.location,
            date: new Date(body.date),
            price: body.price,
            tickets: body.tickets,
            kind: body.kind 
        });
        //ne prendiamo i dati
        const eventData = await Event.findOne({ name : body.name, location: body.location});
        //montiamo la risposta con i dati
        const responseEvent = {
            id: eventData?._id,
            name: eventData?.name,
            location: eventData?.location,
            date: eventData?.date,
            price: eventData?.price,
            tickets: eventData?.tickets,
            kind: eventData?.kind 
        }
        //e la ritorniamo
        return res.status(201).json(responseEvent);
    };
    return res.status(405).json({message: "user not verified.."});
});

//ottieni gli eventi
router.get("/",
query("name").optional().isString(), 
query("location").optional().isString(), 
query("date").optional().isString(),
query("price").optional().isNumeric(),
query("tickets").optional().isNumeric(),
query("kind").optional().isNumeric(),
catchErrors, 
async (req: Request, res: Response) => {
    //per questa operazione non é necessaria autenticazione
    //semplice con find senza filtro
    const events = await Event.find({...req.query});//se ci sono query filtra
    //se non ci sono documents nella collection torna un array vuoto
    if(events.length == 0){
        return res.status(404).json({message: "no events found.."})
    }
    return res.status(200).json(events);
});

//ottieni un evento
router.get("/:id", 
check("id").isString().notEmpty().withMessage("Id value not valid"), 
catchErrors, 
async ({ params }: Request, res: Response) => {    
    const id = params.id;
    const reqEvent = await Event.findById(id);
    if(!reqEvent){
        return res.status(404).json({message: "event not found"});
    } else {
        return res.status(200).json(reqEvent);
    }    
});

//ottieni i posti disponibili per un singolo evento
router.get("/:id/tickets", 
check("id").isString().notEmpty().withMessage("Id value not valid"), 
catchErrors, 
async ({ params }: Request, res: Response) => {    
    const id = params.id;
    const reqEvent = await Event.findById(id);
    if(!reqEvent){
        return res.status(404).json({message: "event not found"});
    } else {
        const availableTickets = {
            availableTickets: reqEvent.tickets 
        }
        return res.status(200).json(availableTickets);
    }    
});
//acquista i biglietti di un evento
router.put("/:id/tickets", [
    check("id").isString().notEmpty().withMessage("Id value not valid"),
    body("amount").isInt().notEmpty().withMessage("Invalid amount value"), 
],
catchErrors, isAuth,
async ({ params, body }: Request, res: Response) => {
    const { loggedUser } = res.locals; //res.locals.loggedUser esce da isAuth
    if(loggedUser.verify == ""){
        const id = params.id;
        //cerco l'evento tramite id
        let reqEvent = await Event.findById(id);
        if(!reqEvent){
            return res.status(404).json({message: "event not found"});
        }
        //se lo trovo controllo la disponibilità dei biglietti
        let availableTickets = reqEvent.tickets;
        const reqTickets = body.amount;
        if(availableTickets < reqTickets){
            return res.status(403).json({message: `only ${availableTickets} tickets available`})
        }     
        //se ce ne sono abbastanza aggiorno il numero dei biglietti
        reqEvent.tickets -= reqTickets;
        //salvo le modifiche
        await reqEvent.save();
        //e restituisco i biglietti acquistati
        return res.status(200).json({purchased: reqTickets});
    };
    return res.status(401).json({message: "user not verified.."});
});

//modifica un evento
router.put("/:id", [
    check("id").isString().notEmpty().withMessage("Id value not valid")
],
eventValidation, catchErrors, isAuth,
async ({ params, body }: Request, res: Response) => {
    const { loggedUser } = res.locals; //res.locals.loggedUser esce da isAuth
    if(loggedUser.verify == ""){
        const id = params.id;
        //cerco l'evento tramite id
        let modEvent = await Event.findById(id);
        if(!modEvent){
            return res.status(404).json({message: "event not found"});
        }
        //se lo trovo aggiorno i campi con i dati del body, i campi omessi
        //dovrebbero essere ignorati MA IN REALTA QUESTO SI FA CON PATCH
        //con PUT si è soliti modificare TUTTO      
        modEvent.name = body.name;
        modEvent.location = body.location;
        modEvent.date = new Date(body.date);
        modEvent.price = body.price,
        modEvent.tickets = body.tickets
        modEvent.kind = body.kind;
        //salvo le modifiche
        const updatedEvent = await modEvent.save();
        //restituisco l'evento moddato
        return res.status(200).json(updatedEvent);
    };
    return res.status(401).json({message: "user not verified.."});
});

//elimina un evento
router.delete("/:id", 
check("id").isString().notEmpty().withMessage("Id value not valid"),
catchErrors, isAuth, 
async ({ params }: Request, res: Response) => {
    const id = params.id;
    const { loggedUser } = res.locals; //res.locals.loggedUser esce da isAuth
    //controllo utente verificato
    if(loggedUser.verify == ""){
        //elimino l'evento
        const deletedEvent = await Event.findByIdAndDelete(id);
        //se non ritorna nulla l'evento non esiste
        if(!deletedEvent){
            return res.status(404).json({message: "event not found.."})
        }
        return res.status(200).json(deletedEvent);
    }
    return res.status(401).json({message: "user not verified.."});
});

export {router as eventsRoutes}
