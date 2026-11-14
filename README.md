# chat-backend
One to One chat backend using Node.js, Express, MySQL and Firebase Firestore

Please test using postman below I pasted url's and run node server.js before testing
1. POST-http://localhost:5000/chat/create
payload- payload should be below format
{
    "userAId":1,
    "userBId":2
}

2. POST - http://localhost:5000/chat/1/message/send
paylaod- use other then below message
{
    "senderId": 1,
    "text": "Hello Amit!"
}

3. GET - http://localhost:5000/chat/1/messages?limit=50

4. POST - http://localhost:5000/chat/1/message/YSYyz43V1FDgncrH5Sab/read
here - message Id you can get from get method and paste in post call url before read 

payload - userId you can give 

5. POST - http://localhost:5000/chat/1/lastseen
payload - userId you have to give

6. GET - http://localhost:5000/chat/user/1/chats

-> Here first time I am using Firebase firestore so I take reference from google and done setup 
-> most of the part I developed by my own only controller methods and firebase thing i take help from ai.