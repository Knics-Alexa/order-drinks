'use strict';
var aws = require('aws-sdk');
var ses = new aws.SES({
  region: 'eu-west-1'
});

// need add nodemailer to package then uncomment this codes,
// use by sendEmailWithAttachment function to send email with attachment

/*
 * var nodemailer = require('nodemailer'); var transporter =
 * nodemailer.createTransport({ SES: ses });
 */

// --------------- Helpers that build all of the responses
// -----------------------


// build output and response ,
function buildSpeechletResponse(title, output, repromptText, shouldEndSession,cardImage) {
    var card = {
          type: 'Standard',
          title: 'Drink Order - '+`${title}`,
          content: `${output}`
        
      };
    return {
        outputSpeech: {
            type: 'PlainText',
            text: output,
        },
        card: card,
        reprompt: {
            outputSpeech: {
                type: 'PlainText',
                text: repromptText,
            },
        },
        directives: [
                {
                type: "Display.RenderTemplate",
                template: {
                    type: "BodyTemplate2",
                    token: "T123",
                    backButton: "VISSIBLE",
                    backgroundImage: {
                        contentDescription: "Drink Order Menu",
                        sources: [
                            {
                                url:"https://cmf-services.de/alexa/Backgroundgetrankbestellung.png"
                            }
                        ]
                    },
                    title: "Drink Order Menu",
                    textContent: {
                        primaryText: {
                            text: `${output}`,
                            type: "PlainText"
                        }
                    }
                }
            }],
        shouldEndSession,
    };
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: '2.0',
        sessionAttributes,
        response: speechletResponse,
    };
}


/*
 * most first message returned, if your don't pass extra params like
 * type,quantity,size,name...
 */          
function getWelcomeResponse(callback, next_order,session) {
    
    // list of welcome message we may have at skill start.
    // lets have random choice later from multiple welcome messages
    const lst_welcome=["What would you like me to order?"]
    
    // If we wanted to initialize the session to have some attributes we could
    // add those here.
    var sessionAttributes={}
    if(session!=undefined)
    {
     sessionAttributes = session.d || {};    
    }
    const cardTitle = 'Welcome';
    var speechOutput="";
    if (next_order)
    {
         speechOutput =  randPick(lst_welcome)
    
    }
    else{
     //speechOutput = "Welcome to your drink ordering skill. I can help you order your next batch of drinks. " + randPick(lst_welcome)
     speechOutput = "Welcome to your drink ordering skill.";
    }
    // If the user either does not reply to the welcome message or says
    // something that is not
    // understood, they will be prompted again with this text.
    const repromptText = "I do not understand that, please repeat your request. ";
    const shouldEndSession = false;

    callback(sessionAttributes,
        buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

function handleSessionEndRequest(callback) {
    const cardTitle = 'Session Ended';
    const speechOutput = 'Thank you for trying the Alexa drink ordering skill. Have a nice day!';
    // Setting this to true ends the session and exits the skill.
    const shouldEndSession = true;

    callback({}, buildSpeechletResponse(cardTitle, speechOutput, null, shouldEndSession));
}



/**
 * Sets the the session and prepares the speech to reply to the user.
 */




// --------------- Events -----------------------

/**
 * Called when the session starts.
 */
function onSessionStarted(sessionStartedRequest, session) {
    console.log(`onSessionStarted requestId=${sessionStartedRequest.requestId}, sessionId=${session.sessionId}`);
}

/**
 * Called when the user launches the skill without specifying what they want.
 */
function onLaunch(launchRequest, session, callback) {
    console.log(`onLaunch requestId=${launchRequest.requestId}, sessionId=${session.sessionId}`);

    // Dispatch to your skill's launch.
    getWelcomeResponse(callback);
}

//ask user to say drink name he want 
function getDrinkName(intent, session, callback) {
    console.log("getDrinkName")
    const drink = intent.slots.drink;
    let repromptText = '';
    const shouldEndSession = false;
    let speechOutput = '';
    
    if (drink) {
        let dname=drink.value
        speechOutput = `Alright, ${dname}. Please tell me which size of ${dname}, you want. Is it 1 Liter , 1.5 Lite or any other size?`
        session["d"]["req"]="size"
        session["d"]["drink"]= drink.value;
        repromptText = `Please tell me which size of ${dname} you want?`;
    
    } else {
        speechOutput = `I am not sure what drink you desire, please try again`;
        repromptText = `I do not understand that. Please tell me what drink do you want?`;
    }

    callback(session["d"],
         buildSpeechletResponse(intent.name, speechOutput, repromptText, shouldEndSession));
}

//ask user to say drink type he want in can , plastic.... 
function getDrinkType(intent, session, callback) {
    console.log("getDrinkType")
    const type = intent.slots.type;
    const dname=session["d"]["drink"]
    let repromptText = '';
    const shouldEndSession = false;
    let speechOutput = '';

    if(intent.name=='DrinkOrderIntent')
    {   speechOutput = `Please tell me would you like to order in can, glass or plastic bottles?`;
        repromptText = `Please tell me which type do you want? You can have a can, glass or plastic bottles.`;
        callback(session["d"],
         buildSpeechletResponse(intent.name, speechOutput, repromptText, shouldEndSession));
    }
    else if (type) {
        var dtype=type.value;
        speechOutput = `Okay, ${dname} ${dtype}. Please tell me how many ${dname} ${dtype} do you want? ` 
        session["d"]["req"]="quantity"
        session["d"]["type"]= type.value;
        repromptText = `Please tell me how many ${dname} drinks you want?`;
        callback(session["d"],
         buildSpeechletResponse("OrderQuantityIntent", speechOutput, repromptText, shouldEndSession));
    } else {
        speechOutput = `I understand that you want ${dname}, but I am not sure which type would you like me to order, tell me whether you want a can, glass or plastic bottles?`;
        repromptText = `I do not understand that, please tell me which type do you want?`;
        callback(session["d"],
         buildSpeechletResponse(intent.name, speechOutput, repromptText, shouldEndSession));
    }

    
}

// ask user to say drink size he want 1 liter, 0.22 liter...  
function getDrinkSize(intent, session, callback) {
    console.log("getDrinkSize")
    const size = intent.slots.size;
    const dname=session["d"]["drink"]
    const dtype=session["d"]["type"]
    let repromptText = '';
    const shouldEndSession = false;
    let speechOutput = '';
    if(intent.name=='DrinkOrderIntent')
    {   speechOutput = `Please tell me which size of ${dname} ${dtype} you would like to order?`;
        repromptText = `Please tell me in which size do you want me to order your drinks?`;
        callback(session["d"],
        buildSpeechletResponse("OrderSizeIntent", speechOutput, repromptText, shouldEndSession));
    }
    else if (size) {
        var dsize=size.value;
        speechOutput = `Okay, ${dsize}. Please tell me how many ${dname} ${dtype} you want to order? `
        session["d"]["req"]="quantity"
        session["d"]["size"]= size.value;
        if(checkComplete(intent,session,callback))
        {
            finalize(intent,session,callback)
        }

        repromptText = `Please tell me how many ${dname} you would like me to order?`;
         callback(session["d"],
         buildSpeechletResponse("OrderQuantityIntent", speechOutput, repromptText, shouldEndSession));
    } else {
        speechOutput = `I am not sure if this is the correct size, please tell me which size of ${dname} ${dtype} you want to order?`;
        repromptText = `Please tell me which size you want?`;
        callback(session["d"],
         buildSpeechletResponse("OrderSizeIntent", speechOutput, repromptText, shouldEndSession));
    }

   
}


function getSupportMessage(intent,session,callback){
    let speechOutput = `Do you have anything to suggest ?`;
    //session["d"]["req"]="finalize-pending"
    let repromptText = ``;
    const shouldEndSession = false;
    session["d"]["req"] = "finalize-suggestion";
    callback(session["d"],
    buildSpeechletResponse("SupportIntent", speechOutput, repromptText, shouldEndSession));
}

// ask user to say quanity of order
function getQuantity(intent, session, callback) {
    console.log("getQuantity")
    const quantity = intent.slots.quantity;
    const dname=session["d"]["drink"]
    const dtype=session["d"]["type"]
    const dsize=session["d"]["size"]
    const dquantity=session["d"]["quantity"]
    let repromptText = '';
    let shouldEndSession = false;
    let speechOutput = '';
    if(intent.name=='DrinkOrderIntent')
    {   speechOutput = `Please tell me how many ${dname} ${dtype} you want to order?`;
        repromptText = `Please tell me how many you would like me to order?`;
    callback(session["d"],
         buildSpeechletResponse("OrderQuantityIntent", speechOutput, repromptText, shouldEndSession));
         
        }
    else if (quantity) {
        let dquantity=quantity.value
        session["d"]["quantity"]= quantity.value;
        if(intent.slots.quantitytype)
        {
            if(intent.slots.quantitytype.value){
                session["d"]["quantitytype"]= intent.slots.quantitytype.value;
            }
        }
        if(checkComplete(intent,session,callback))
        {
            finalize(intent,session,callback)
        }
        else
        {
        handleNext(intent,session,callback)
        }
    } else {
        speechOutput = `I am not sure how many drinks you want to order, please tell me how many ${dname} ${dtype} you want to order?`;
        repromptText = `I do not understand that. Please tell me how many you want?`;
        callback(session["d"],
         buildSpeechletResponse("OrderQuantityIntent", speechOutput, repromptText, shouldEndSession));
    }

    
}

// check if all required session attributes filled
// except quianitytype have default value "number"
function checkComplete(intent,session,callback)
{
    if ((session["d"]["size"]) && (session["d"]["type"]) && (session["d"]["drink"]) && (session["d"]["quantity"]))
    {
        return true;
        
    }
    return false;
}

// finalize order and send email
function finalize(intent,session,callback)
{
    let shouldEndSession=true;
    let dname=session.d.drink;
    let dtype=session.d.type;
    let dsize=session.d.size;
    
    let dquantity=session.d.quantity;
    let dquantitytype=session.d.quantitytype;

    shouldEndSession = false;
    let speechOutput = `Perfect, I am going to order ${dquantity} ${dquantitytype} of ${dsize} ${dtype} of ${dname}. Thank you for using the drink ordering skill. You will receive an email for your order confirmation. Would you like to order anything else?`
    session["d"]["req"]="finalize-pending"
    let repromptText = ``;
    callback(session["d"],
     buildSpeechletResponse("OrderQuantityIntent", speechOutput, repromptText, shouldEndSession));
}

// check what we have in attributes and call what we need next
function handleNext(intent,session,callback)
{
    console.log("handleNext")
    if(checkComplete(intent,session,callback))
    {
        finalize(intent,session,callback)
    }
    
    if (!(session["d"]["size"]) && !(session["d"]["type"]) && !(session["d"]["drink"]) && !(session["d"]["quantity"]))
    {
        
        getWelcomeResponse(callback);
    }
    else if(!(session["d"]["drink"]))
    {   
        getDrinkName(intent, session, callback);
    }
    else if(!(session["d"]["type"]))
    {
        getDrinkType(intent, session, callback);
    }
    
    else if(!(session["d"]["size"]))
    {
        getDrinkSize(intent, session, callback);
    }
    else if(!(session["d"]["quantity"]))
    {
            getQuantity(intent, session, callback);
    }   
}

// check what we have in attributes and call what we need next
function handleMultiNext(intent,session,callback)
{
    console.log("handleNext")
    if(checkComplete(intent,session,callback))
    {
        finalize(intent,session,callback)
    }
    
    if (!(session["d"]["size"]) && !(session["d"]["type"]) && !(session["d"]["drink"]) && !(session["d"]["quantity"]))
    {
        
        getWelcomeResponse(callback);
    }
    else if(!(session["d"]["drink"]))
    {   
        getDrinkName(intent, session, callback);
    }
    else if(!(session["d"]["type"]))
    {
        getDrinkType(intent, session, callback);
    }
    
    else if(!(session["d"]["size"]))
    {
        
        getDrinkSize(intent, session, callback);
    }
    else if(!(session["d"]["quantity"]))
    {
            getQuantity(intent, session, callback);
    }   
}

/**
 * Called when the user specifies an intent for this skill.
 * 
 */
function onIntent(intentRequest, session, callback) {
    console.log(`onIntent requestId=${intentRequest.requestId}, sessionId=${session.sessionId}`);

    // we put all attributes in request to d param in session and on response
    // return session["d"] as attribute
    // then we have this attributes on next user request
    if(session.attributes)
    {
        session["d"]=session.attributes
    }
    const intent = intentRequest.intent;
    const intentName = intentRequest.intent.name;

    if(intentName === "SupportIntent"){

        let speechOutput = "Your message is  "+  intent.slots.message.value + `. Your request is noted with our system. You will receive an email with the order confirmation as well.`;
        const shouldEndSession = true;
        let repromptText = ``;
        session["d"]["message"] = intent.slots.message.value;
        var orders=JSON.parse(session["d"]["orders"])
        orders.push(session["d"])
        session["d"]["orders"]=JSON.stringify(orders)
        sendEmailHTML(JSON.parse(session["d"]["orders"]),session["d"]["message"]);
        callback(session["d"],
        buildSpeechletResponse("SupportIntent", speechOutput, repromptText, shouldEndSession));
    }else{
        const sattr={"drink":null, "type":null, "size":null, "quantity":null,"req":null,"quantitytype":"number" ,"orders":"[]"}
        
        if (session.d== undefined)
        {
            session.d={}
        }
        if(!intent.slots)
        {
            intent.slots={}
        }
        // update session attribute with what user send in intent slots 
        sattr["drink"]=session.d.drink || null
        if(intent.slots.drink)
        {
            sattr["drink"]=intent.slots.drink.value || session.d.drink || null
        }
        
        sattr["quantity"]=session.d.quantity || null
        if(intent.slots.quantity)
        {
            sattr["quantity"]=intent.slots.quantity.value || session.d.quantity || null
        }
        
        sattr["type"]=session.d.type || null
        if(intent.slots.type)
        {
            sattr["type"]=intent.slots.type.value || session.d.type || null
        }
        
        sattr["size"]=session.d.size || null
        if(intent.slots.size)
        {
            sattr["size"]=intent.slots.size.value || session.d.size || null
        }
        
        sattr["quantitytype"]=session.d.quantitytype || "number"
        if(intent.slots.quantitytype)
        {
            sattr["quantitytype"]=intent.slots.quantitytype.value || session.d.quantitytype || "number"
        }
        
        if(session["d"]["req"])
        {
            sattr["req"]=session.d.req || null
            
        }
        sattr["orders"]=session.d.orders || "[]"
            
        
        session["d"]=sattr
        console.log(session);
        console.log(intent.name);
        console.log(intent.slots);
        
        // check if intent DrinkOrderIntent called by alexa skill
        // handle ask next params skill need to complete order
        if (intentName === 'DrinkOrderIntent') 
        {
            handleNext(intent,session,callback)
        }else if(intentName === 'DrinkMultipleIntent'){
            handleMultiNext(intent,session,callback);
        }
        else if(intentName==="OrderSizeIntent")
        {
            session["d"]["req"]="size"
            getDrinkSize(intent, session, callback);
        }
        else if(intentName==="OrderQuantityIntent")
        {
            session["d"]["req"]="quantity"
            getQuantity(intent, session, callback);
        }
        else if (intentName === 'AMAZON.HelpIntent') {
            getWelcomeResponse(callback);
        } else if (intentName === 'AMAZON.StopIntent' || intentName === 'AMAZON.CancelIntent') {

            if(session["d"]["req"] === "finalize-pending"){
                getSupportMessage(intent,session,callback);
            }else{
                handleSessionEndRequest(callback);
            }
        }
        else if(intentName ==="AMAZON.YesIntent")
        {
            var orders=JSON.parse(session["d"]["orders"])
            orders.push(session["d"])
            session["d"]["orders"]=JSON.stringify(orders)
            session["d"]={"drink":null, "type":null, "size":null, "quantity":null,"req":null,"quantitytype":"number",orders:session["d"]["orders"]};
            getWelcomeResponse(callback,true,session)
        }
        else if(intentName ==="AMAZON.NoIntent")
        {
            if(session["d"]["req"] === "finalize-pending"){
                getSupportMessage(intent,session,callback);
            }else{
                var orders=JSON.parse(session["d"]["orders"])
                orders.push(session["d"])
                session["d"]["orders"]=JSON.stringify(orders)
                sendEmailHTML(JSON.parse(session["d"]["orders"]),session["d"]["message"]);
                handleSessionEndRequest(callback);
            }
        }
        else if(intentName ==="AMAZON.FallbackIntent")
        {
            handleNext(intent,session,callback)
        }
         else {
            throw new Error('Invalid intent');
        }
    }
    
}


/**
 * Called when the user ends the session. Is not called when the skill returns
 * shouldEndSession=true.
 */
function onSessionEnded(sessionEndedRequest, session) {
    console.log(`onSessionEnded requestId=${sessionEndedRequest.requestId}, sessionId=${session.sessionId}`);
    // Add cleanup logic here
}


// --------------- Main handler -----------------------

// Route the incoming request based on type (LaunchRequest, IntentRequest,
// etc.) The JSON body of the request is provided in the event parameter.
exports.handler = (event, context, callback) => {
    try {
        console.log(`event.session.application.applicationId=${event.session.application.applicationId}`);

        /**
         * Uncomment this if statement and populate with your skill's
         * application ID to prevent someone else from configuring a skill that
         * sends requests to this function.
         */
        /*
         * if (event.session.application.applicationId !==
         * 'amzn1.echo-sdk-ams.app.[unique-value-here]') { callback('Invalid
         * Application ID'); }
         */

        if (event.session.new) {
            onSessionStarted({ requestId: event.request.requestId }, event.session);
        }

        if (event.request.type === 'LaunchRequest') {
            onLaunch(event.request,
                event.session,
                (sessionAttributes, speechletResponse) => {
                    callback(null, buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === 'IntentRequest') {
            onIntent(event.request,
                event.session,
                (sessionAttributes, speechletResponse) => {
                    callback(null, buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === 'SessionEndedRequest') {
            onSessionEnded(event.request, event.session);
            callback();
        }
    } catch (err) {
        callback(err);
    }
};

//send html make order email using table, tr and td html tags
function sendEmailHTML(orders,message)
{
    var content="Thank you for your order. Please find the details about your order below.\n\nOrder details: \n\n"
    for(var i=0;i<orders.length;i++)
    {
        content+= "EAN: "+String(genEAN())+"\n"
                    +"Product Name: "+orders[i].drink+"\n"
                    +"Product Type: "+orders[i].type+"\n"
                    +"Product Size: "+orders[i].size+"\n"
                    +"Product Quantity: "+orders[i].quantity+"\n"
                    +"Quantity Type: "+orders[i].quantitytype+"\n";
        
    }
                    
    var contentHTML="Thank you for your order. Please find the details about your order below.<br/>Order details: <br/>"
    contentHTML+="<html><body><style>td,th{padding:15px;border-style: solid;border-width: 1px;}</style><table><tr><th>EAN</th><th>Product Name</th><th>Product Type</th><th>Product Size</th><th>Product Quantity</th><th>Quantity Type</th></tr>"
    for(var i=0;i<orders.length;i++)
    {
                    
                    contentHTML+="<tr><td> "+String(genEAN())+"</td>"
                    +"<td>"+orders[i].drink+"</td>"
                    +"<td>"+orders[i].type+"</td>"
                    +"<td>"+orders[i].size+"</td>"
                    +"<td>"+orders[i].quantity+"</td>"
                    +"<td>"+orders[i].quantitytype+"</td></tr>";
    
    }                
    contentHTML+="</table></body></html>"
    if(message != ""){
        contentHTML += "<p>User Notes: " + message + "</p>";
    }
    console.log("Send Email");
    var eParams = {
        Destination: {
            ToAddresses: ["chvkishore.20@gmail.com"]
        },
        Message: {
            Body: {
                Html: {
                    Charset: "UTF-8",
                    Data: contentHTML
                },
                Text: {
                    Charset: "UTF-8",
                    Data: content
      }
            },
            Subject: {
                Data: "New Order Submitted!!!"
            }
        },
        Source: "chvkishore.20@gmail.com"
    };

    console.log('===SENDING EMAIL===');
 
    var email = ses.sendEmail(eParams, function(err, data){
        if(err) console.log(err);
        else {
            console.log("===EMAIL SENT===");
            console.log(data);


            console.log("EMAIL CODE END");
            console.log('EMAIL: ', email);
            // context.succeed(event);

        }
    });
    
}
//send text mail
function sendEmail(orders,dquantity,dquantitytype,dsize,dtype,dname,imagepath)
{
    var content="Thank you for your order. Please find the details about your order below.\n\nOrder details: \n\n"
    for (var i=0;i<orders.length;i++)
    {
        
    }
    content+="EAN: "+String(genEAN())+"\n"
                    +"Product Name: "+dname+"\n"
                    +"Product Type: "+dtype+"\n"
                    +"Product Size: "+dsize+"\n"
                    +"Product Quantity: "+dquantity+"\n"
                    +"Quantity Type: "+dquantitytype+"\n";
                    
    console.log("Send Email");
    var eParams = {
        Destination: {
            ToAddresses: ["chvkishore.20@gmail.com"]
        },
        Message: {
            Body: {
                Text: {
                    Data: content
                }
            },
            Subject: {
                Data: "New Order Submitted!!!"
            }
        },
        Source: "chvkishore.20@gmail.com"
    };

    console.log('===SENDING EMAIL===');
    if(imagepath!=undefined)
    {
        sendEmailWithEmbedImage("chvkishore.20@gmail.com",dquantity,dquantitytype,dsize,dtype,dname,imagepath)
    }
    else{
        var email = ses.sendEmail(eParams, function(err, data){
            if(err) console.log(err);
            else {
                console.log("===EMAIL SENT===");
                console.log(data);


                console.log("EMAIL CODE END");
                console.log('EMAIL: ', email);
                // context.succeed(event);

            }
        });
    }
    
}
//send email with image attached to email
//TODO: add nodemailer to package
function sendEmailWithAttachment(email, content,attachpath)
{
   
    
    var ses_mail = "From: '' <" + email + ">\n"
    + "To: " + email + "\n"
    + "Subject: New Order Submitted!!!\n"
    + "MIME-Version: 1.0\n"
    + "Content-Type: multipart/mixed; boundary=\"NextPart\"\n\n"
    + "--NextPart\n"
    + "Content-Type: text/html; charset=us-ascii\n\n"
    + content+"\n\n"
    + "--NextPart\n"
    + "Content-Type: text/plain;\n"
    + "Content-Disposition: attachment; filename=\""+attachpath+"\"\n\n"
    + "Awesome attachment" + "\n\n"
    + "--NextPart";

    var params = {
        RawMessage: { Data: new Buffer(ses_mail) },
        Destinations: [ email ],
        Source: "'' <" + email + ">'"
    };


    ses.sendRawEmail(params, function(err, data) {
        if(err) {
        } 
        else {
        }           
    });
}

//send email with html and image embeded
//TODO: need update to use table instead of br html tag
function sendEmailWithEmbedImage(email,dquantity,dquantitytype,dsize,dtype,dname, content,urlpath)
{
    var content="Thank you for your order. Please find the details about your order below.<br/>Order details: <br/>"
                +"EAN: "+String(genEAN())+"<br/>"
                +"Product Name: "+dname+"<br/>"
                +"Product Type: "+dtype+"<br/>"
                +"Product Size: "+dsize+"<br/>"
                +"Product Quantity: "+dquantity+"<br/>"
                +"Quantity Type: "+dquantitytype+"<br/>";
    var ses_mail = "From: '' <" + email + ">\n"
    + "To: " + email + "\n"
    + "Subject: New Order Submitted!!!\n"
    + "MIME-Version: 1.0\n"
    + "Content-Type: multipart/mixed; boundary=\"NextPart\"\n\n"
    + "--NextPart\n"
    + "Content-Type: text/html; charset=us-ascii\n\n"
    + content
    +"<img src='"+urlpath+"'>"+"\n\n"
    + "--NextPart\n";
    

    var params = {
        RawMessage: { Data: new Buffer(ses_mail) },
        Destinations: [ email ],
        Source: "'' <" + email + ">'"
    };
    
    
    ses.sendRawEmail(params, function(err, data) {
        if(err) {
        } 
        else {
        }           
    });
}

//choice random from message we can have
function randPick(arr)
{
    return arr[Math.floor(Math.random() * arr.length)]; 
}

//generate random EAN like numbers
function genEAN()
{
    var min=5449000000002;
    var max=5449000900002;
    return parseInt(Math.random() * (max - min) + min);

}