# Ionic App for Consuserco Technical Assistance Service

The complexity of cigarette handling machines demands that all equipment receives regular servicing by skilled technicians if peak performance is to be maintained.

This application is aimed at the technicians who supervise and repair the machines.

Each technician can check their own pending repair requests, see where they are on a map, and close them when they are completed.

## App Functionality:

*Currently in development*

Once logged in the app, each technician can:

- View a list of all open requests, sorted by priority
- View all open requests on a map. The color of each marker will indicate the priority of the request (red = urgent, yellow = high, green = normal, blue = low)
- Edit an open request: see location on a map, the info about where the machine is located, type of request, inital request description 
- Close an open request: including closing observations, if it is necessary to leave it pending, a backup email, and the client's signature

### Data client-server

When logging in, the server will return all pending requests to the client. All this information will be stored locally on the client
When the client closes a request, it will send the closing information to the server, as well as update the local database

## Future developments:

- Notifications: automatically synchronize requests between the client and the server
- Define routes manually selecting several requests from the map
- Automatic routes: optimization of routes based on the calculation of distances, opening hours, priority of the requests ...
