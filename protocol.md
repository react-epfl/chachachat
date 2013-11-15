# ChaChaChat protocol

## ChaChaRoom data model
### Authentication settings

Authentication happens over https, using a POST /login method. Parameters are username and password.

### User schema

    {
      username: String, // unique, see how it is stored in passport.js
      hashedPassword: String, // Salted, hashed password,
      salt: String, // password salt
      profile: {
      }
      achievements: [ Achievement ],
      statistics: {
        // ... are defined as virtual fields.
        nbSent: Int // number of sent messages.
      },
      rooms: [ RoomId ], // rooms/threads the user initiated or was invited to.
      vocabulary: [ String ], // set of words the user might exchange
      createdAt: Date, // when the user joined the chat network
      lastSeen: Date // when the user has last been seen
    }

### Room schema
A Room defines a room instance between two users:

    {
      memberships: [ { userId: UserId, lastAccess: Date } ], // references to users of this room, with their last access
      messages: [ Message ]
    }

### Message schema

    {
      author: UserId,
      vocabulary: [ String ], // the three phrases of the schema
      createdAt: Date, // timestamp at which the message has been sent to determine if it is unread.
      loc: {
        lat: Number,
        lng: Number
      },
      color: String // HTML color code
    }

### Vocabulary proposed by the server
    {
      vocabulary: [ String ]
    }

## Websocket messages
### Registration

    // have a look at passport.js, username, password

### Logging in

The client provides his username and password and the time he last checked for/received messages:

    // have a look at passport.js

The server replies with a list of messages the users hasn't received yet:

    {
      name: 'newMessages',
      args: [{
        roomId: RoomId,
        messages: [ Message ]
      }, ... ]
    }

### Finding nearby users
The client provides his location:

    {
      name: 'getNearbyUsers',
      args: [{
        loc: {
          lat: Number,
          lng: Number
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
        roomId: RoomId
      }]
    }

The server replies with the attributes of the room:

    {
      name: 'roomProfile',
      args: [{
        room: Room
      }]
    }

### Initiating a room
The client provides the user he wants to chat with:

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
        roomId: RoomId
      }]
    }

### Sending a message
The client provides a message:

    {
      name: 'sendMessage'
      args: [{
        roomId: Id
        message: Message
      }]
    }

The server then pushes the message to the other client:

    {
      name: 'newMessage'
      args: [{
        roomId: RoomId,
        message: Message
      }]
    }

After sending the message to the other client the server should confirm the message has been sent:

    {
      name: 'messageSent',
      args: [{
        roomId: RoomId,
        messageId: MessageId
      }]
    }

### In case of errors
All messages include an HTTP-like status code in case of errors, along with an error message. In case of errors, only these two fields might be present:

    {
      name: name of the query
      args: [{
        status: Integer,
        err: String
      }]
    }
