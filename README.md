# .NET 8 with React, TypeScript, Redux, and Docker starter
Coded with ❤️ and ☕ by [Owen Bick](https://github.com/bick).

## Features
- .NET 8 Web API.
- EF Core for ORM.
- Docker and Docker Compose for simplicity.
- React on Node v20.
- TypeScript and Redux with examples.
- Set up to run with Microsoft SQL server but can be modified to use any other DB.
- Responsive design using Material-UI.

## App Functionality
I added some basic functionality to give an example of how you'd interact with the API using React, Redux, and TypeScript.
- Search organizations by name or EIN.
- View organization details in an accordion style.
- Fetch IRS Publication 78 data and save to a database.
- Maintain search history.
- Delete search history items.
- State management using Redux.
- Delete all data from database (testing purposes only).

## Installation 
To set this project up, make sure you have Docker running and simply run:
```
docker-compose up
```

To rebuild the docker container, simply run: 
```
docker-compose up --build
```
