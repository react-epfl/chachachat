# ChaChat protocol

## ChaChaChat data model
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
  chats: [ Chat ], // chats/threads the user initiated or was invited to. Stored as embedded.
  phrases: [ String ], // phrases the user might exchange
  lastSeen: Date // when the user has last been seen
}

### Chat schema
{
  id: Int,
  lastAccess: Date, // last access, per user since each user has his own Chat document.
  messages: [ Message ]
}

### Message schema
{
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

