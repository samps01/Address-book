const express = require('express');
const https = require('https');
const bodyParser = require('body-parser');
const apiai = require('apiai');
const fs = require('fs');
const apiaiApp = apiai("4234");

//function to send messages to api.ai from outside apps like facebook chat etc
function sendMessage(event) {
    let sender = event.sender.id;
    let text = event.message.text;

    let apiai = apiaiApp.textRequest(text, {
        sessionId: 'systemGeneratedValue' // use any arbitrary id
    });

    apiai.on('response', (response) => {
        // send response from api.ai to third party app
    });

    apiai.on('error', (error) => {
        console.log(error);
    });

    apiai.end();
}

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

app.all('/', (req, res, next)=>{
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    next();
});
app.post('/ai',(req,res)=>{
    let action = req.body.result.action;
    //to add contacts to the list
    if(action === 'addContact'){
        let contacts;
        if (fs.existsSync('contacts.json')) {
            contacts = JSON.parse(fs.readFileSync('contacts.json','UTF-8'));
        }
        if(!contacts){
            contacts = {};
        }
        let name = req.body.result.parameters['given-name'];
        contacts[name] = req.body.result.parameters;
        let obj = JSON.stringify(contacts,null,2);

        fs.writeFile('contacts.json',obj, function (err) {
            if (err) throw err;
            console.log('Saved!');
        });

        let msg =  `${name} has been to added to your contacts`;
        res.json({
            speech: msg,
            displayText: msg,
            source: 'addContact'
        });
    }else if(action === 'getContact'){//to get a particular contact
        let queryType = req.body.result.parameters['query-type'];
        let getContacts = JSON.parse(fs.readFileSync('contacts.json','UTF-8'));
        let resolvedResponse = '';
            let name = req.body.result.parameters['given-name'];
            let contactDetails = getContacts[name];
            for(let i =0;i<queryType.length;i++){
                if(queryType.length===1){
                    resolvedResponse = contactDetails[queryType[i]];
                } else {
                    if (i !== queryType.length - 1) {
                        resolvedResponse += `${contactDetails[queryType[i]]} and `
                    }else{
                        resolvedResponse += `${contactDetails[queryType[i]]}`;
                    }
                }
            }
            let msg = `Sure, here is what I have ${resolvedResponse}`;
            res.json({
                speech: msg,
                displayText: msg,
                source: 'getContact'
            });
        } else if(action === 'allContacts'){//to get all the contacts
            let queryType = req.body.result.parameters['query-type'];
            let getContacts = JSON.parse(fs.readFileSync('contacts.json','UTF-8'));
            let resolvedResponse = '';
            let contactListNames = Object.keys(getContacts);
            for(let i = 0;i<contactListNames.length;i++){
                if(i !== contactListNames.length-1){
                    resolvedResponse += `${contactListNames[i]}, `;
                } else{
                    resolvedResponse += ` and ${contactListNames[i]}`;
                }
            }
            let msg = `Sure, here is what I have ${resolvedResponse}`;
            res.json({
                speech: msg,
                displayText: msg,
                source: 'allContacts'
            });
    }
});

app.listen(port,()=>{
   console.log(`Server listening to port ${port}`);
});
