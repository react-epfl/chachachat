# ChaChaChat protocol

## ChaChaRoom data model
### Authentication settings

    // have a look at passports.js

### User schema

    {
      username: String, // unique, see how it is stored in passport.js
      password: Salted, hashed password,
      profile: {
      }
      achievements: [ Achievement ],
      statistics: {
        // ... are defined as virtual fields.
        nbSent: Int // number of sent messages.
      },
      rooms: [ Room ], // rooms/threads the user initiated or was invited to. Stored as embedded.
      phrases: [ String ], // phrases the user might exchange
      lastSeen: Date // when the user has last been seen
    }

### Room schema
A Room defines a room instance between two users:

    {
      id: Id,
      lastAccess: Date, // last access, per user since each user has his own Room document.
      messages: [ Message ]
    }

### Message schema

    {
      username: String,
      phrase: String,
      timestamp: Date // timestamp at which the message has been sent to determine if it is unread.
      location: {
        latitude: Number,
        longitude: Number
      }
    }

### Phrases proposed by the server
    {
      phrases: [ String ]
    }

## Websocket messages
### Register

    // have a look at passport.js, username, password

### Logging in

The client provides his username and password:

    // have a look at passport.js

The server replies with a list of messages the users has'nt received yet:

    {
      name: 'newMessages',
      args: [{
        roomId: Id,
        messages: [ Message ]
      }, ... ]
    }

### Finding nearby users
The client provides his username and location:

    {
      name: 'getNearbyUsers',
      args: [{
        username: String,
        location: {
          latitude: Number,
          longitude: Number
        }
      }];
    }

The server replies with a list of users (given as the publicly accessible attributes of users) within a server-defined range:

    {
      name: 'nearbyUsers',
      args: [{
        users: User
      }];
    }

### Getting a user's profile

The client provides the username of the user:

    {
      name: 'getUser'
      args: [{
        username: String
      }]
    }

The server replies with the publicly accessible attributes of the user:

    {
      name: 'userProfile',
      args: [{
        user: User  
      }]
    }

### Getting the description of a room:

The client provides the id of the room:

    {
      name: 'getRoom'
      args: [
      {
        roomId: Id
      }]
    }

The server replies with the attributes of the room:

    {
      name: 'roomDescription',
      args: [{
        room: Room
      }]
    }

### Initiating a room
The client provides the user he wants to room with:

    {
      name: 'createRoom',
      args: [{
        correspondent: String
      }]
    }

The server replies with the room id:

    {
      name: 'roomCreated',
      args: [{
        roomId: Id
      }]
    }

### Sending a message
The client provides his username and a message:

    {
      name: 'sendMessage'
      args: [{
        roomId: Id
        message: Message
      }]
    }

The server then pushes the message to the other client:

    {
      args: [{
        roomId: Id,
        message: Message
      }]
    }
