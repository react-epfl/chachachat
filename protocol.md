# ChaChaChat protocol

## ChaChaRoom data model
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
      vocabulary: [ String ], // vocabulary used by the user
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

## Authentication

Logging in happens over https, using a POST /login method. Parameters are username and password.

## Websocket messages
### Registration

    // have a look at passport.js, username, password

### Upon connection to socket.io

The server provides a list of messages the users hasn't received yet:

    {
      name: 'newMessages',
      args: [{
        roomId: RoomId,
        messages: [ Message ]
      }, ... ]
    }

### Finding users

#### By name

The client provides the name:

    {
      name: 'findUser',
      args: [{
        name: String
      }];
    }

#### By location

The client provides his location:

    {
      name: 'findNearbyUsers',
      args: [{
        loc: {
          lat: Number,
          lng: Number
        }
      }];
    }

The server replies with a list of users (given as the publicly accessible attributes of users), eventually within a server-defined range:

    {
      name: 'users',
      args: [{
        users: User
      }];
    }

### Updating a user's profile

The client provides the user profile:

    {
      name: 'updateProfile'
      args: [{
        gender: 'XXX',
        age: 'XX',
        ...
        
      }]
    }
    
The server replies with updated publicly accessible attributes of the user:

    {
      name: 'userProfile',
      args: [{
        user: User
      }]
    }
    
### Get the characterstics values 

The client simply calls getChars:

    {
      name: 'getChars'
    }
    
The server replies with a chars reply:

    {
      name: 'chars',
      args: [{
        gender: [male,female,other],
        age: [young, soso, old],
        ...
      }]
    }    

### Get a user's characterstics values 

The client simply calls getChars

    {
      name: 'getMyChars'
    }
    
### Updating a user's characterstics

The client provides the updated characteristics:

    {
      name: 'updateChars'
      args: [{
        gender: 'XXX',
        age: 'XX',
        ...
        
      }]
    }
    
The server replies to updatedChars and getChars with:

    {
      name: 'userChars',
      args: [{
        gender: 3,
        age: 4,
        ...
      }]
    }    
    

### Getting a user's profile

The client provides the username of the user:

    {
      name: 'getUser'
      args: [{
        userId: UserRef
      }]
    }

The server replies with the publicly accessible attributes of the user:

    {
      name: 'userProfile',
      args: [{
        user: User
      }]
    }
    
    
    
    

### Creating a room
The client provides the user he wants to chat with:

    {
      name: 'createRoom',
      args: [{
        correspondentsId: [ UserRef ]
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


### Get a user's phrases 

The client calls

    {
      name: 'getUserPhrases'
    }
    
The server answers with an Array of Strings

    {
      name: 'phrases'
      args: ['hello', 'I like you']
    }

The server pushes new phrases to the client

    {
      name: 'phrase'
      args: 'hello'
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
