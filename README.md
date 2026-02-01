# ExpenseTracker Backend

Dit is de backend van de **ExpenseTracker** applicatie.  
De backend is gebouwd met **Node.js**, **Express** en **MongoDB** en biedt een RESTful API voor het beheren van expenses.

## Functionaliteit

De backend ondersteunt de volgende functionaliteiten:

- CRUD-operaties voor expenses (Create, Read, Update, Delete)
- Pagination op de collectie
- Correcte HTTP-statuscodes (o.a. 200, 201, 204, 400, 404, 405)
- CORS-ondersteuning
- Authenticatie via een `/login` endpoint met JWT
- Beveiligd endpoint dat alleen toegankelijk is met een geldige JWT

## Mappenstructuur
src/
├── config/
│ └── db.js # Database connectie (MongoDB)
├── models/
│ └── Expense.js # Mongoose model voor expenses
├── routes/
│ └── expense.routes.js # Alle API-routes en middleware
├── index.js # Entry point van de applicatie

### Toelichting

- **db.js**  
  Bevat de logica voor het verbinden met MongoDB via Mongoose.

- **Expense.js**  
  Definieert het datamodel voor een expense, inclusief validatie en timestamps.

- **expense.routes.js**  
  Bevat alle API-endpoints, middleware, pagination-logica en authenticatie met JWT.

- **index.js**  
  Initialiseert de Express-app, configureert CORS en middleware, verbindt met de database en start de server.

## Authenticatie

- `POST /login`  
  Verwacht een username en wachtwoord via de `Authorization` header (Basic Auth).  
  Bij correcte credentials wordt een JWT teruggegeven.

- `GET /secure`  
  Alleen toegankelijk met een geldige JWT (`Authorization: Bearer <token>`).

## API Endpoints (overzicht)

- `GET /expenses` – Haal een lijst van expenses op (met pagination)
- `GET /expenses/:id` – Haal één expense op
- `POST /expenses` – Maak een nieuwe expense aan
- `PUT /expenses/:id` – Werk een bestaande expense bij
- `DELETE /expenses/:id` – Verwijder een expense
- `POST /login` – Login en verkrijg een JWT
- `GET /secure` – Test endpoint voor JWT-authenticatie

## Installatie & starten

1. Installeer dependencies:
```bash
npm install
```
2. Maak een `.env` bestand aan:
MONGO_URI=<jouw_mongodb_uri>
JWT_SECRET=<jouw_secret>
JWT_EXPIRES_IN=1h
PORT=8001

3. Start de server 
```bash 
npm run dev
```

