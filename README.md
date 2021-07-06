# Airport Car Booking System
## Introduction:
Create a system to help people who need to book a car to the airport and help the the hosts to manage their works 
## Technolody Platform
* Backend: [ExpressJS](https://expressjs.com/)
* Frontend: [ReactJS](https://reactjs.org/), [CoreUI](https://coreui.io/react/), [Ant Design](https://ant.design/docs/react/introduce)
* Database: [MongoDB](https://www.mongodb.com/)
## How to install
Make sure you have [Nodejs](https://nodejs.org/en/download/) and npm install

Clone project:
> git clone https://github.com/DuongSonn/airport-car-booking-server.git

Open project folder: 
> cd airport-car-booking-server

Install Nodejs Package
> npm install

Create .env file
> PORT=
> DATABASE=
> ACCESS_TOKEN_SECRET=
> REFRESH_TOKEN_SECRET=
> GOOGLE_API_KEY=
> API_URL=
> CLIENT_URL=

Create a mongo collection name: duadonsanbay

## How to use
Open project folder
> cd airport-car-booking-server

Seed the database
> npm run seed

Rename the 'build' folder to 'build deploy'

Rename the 'build local' folder to 'build'

Run the server
> npm start

The server will be run on: [localhost:8080](localhost:8080)
