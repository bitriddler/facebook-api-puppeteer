## Installation
```
git clone https://github.com/bitriddler/messenger-cli
cd messenger-cli
npm install
```

## Quick Start
1. Install `messenger-cli`
2. Copy `.env-sample` to `.env` and set
    - `FB_EMAIL` your login email
    - `FB_PASSWORD` your login password
    - `NICK_NAMES` comma separated nick names you go with in chats. This will be used to render "Me:" instead of your chat name.
3. Run `npm start` to start the server
5. Open another terminal and go to the `messenger-cli` directory to have access to the following commands:

#### Show visible users
Show a list of the last ~20 users you have chatted with.
```
npm run cli -- --command=visible-users
```

### Start a chat with a user
This will show you a list of visible users then ask you to enter either the user id or the number of the user in the list
```
npm run cli -- --command=start-session
```

### Get current chat messages
This will return the visible messages with the current user
```
npm run cli -- --command=get-session
```

### Send a message to the current chat
This will send a message to the current chat
```
npm run cli -- --command=send-session "your message goes here"
```


## Usual scenario goes like this
- Start chat with a user
- Send a message
- Get chat messages
```
npm run cli -- --command=start-session
# When prompted, enter user id or number of user in the list
npm run cli -- --command=send-message "your message"
npm run cli -- --command=get-session
...
```

## Commands are too long?
Copy and paste this in your terminal

```
alias fv="npm run cli -- --command=visible-users"
alias fss="npm run cli -- --command=start-session"
alias fs="npm run cli -- --command=send-session"
alias fg="npm run cli -- --command=get-session"
```

Now you can run the above scenario as follows:
```
fss
# When prompted, enter user id or number of user in the list
fs your message in here
fg
...
```

## Limitations
I created this repository just for fun and there are a lot of limitations you have to know:
- Only a few emojis will render, the rest will just show :unkown_emoji:
- Images or any other attachments are ignored
- 
