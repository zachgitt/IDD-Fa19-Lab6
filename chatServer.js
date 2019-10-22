/*
chatServer.js
Author: David Goedicke (da.goedicke@gmail.com)
Closley based on work from Nikolas Martelaro (nmartelaro@gmail.com) as well as Captain Anonymous (https://codepen.io/anon/pen/PEVYXz) who forked of an original work by Ian Tairea (https://codepen.io/mrtairea/pen/yJapwv)
*/

var express = require('express'); // web server application
var app = express(); // webapp
var http = require('http').Server(app); // connects http library to server
var io = require('socket.io')(http); // connect websocket library to server
var serverPort = 8000;


//---------------------- WEBAPP SERVER SETUP ---------------------------------//
// use express to create the simple webapp
app.use(express.static('public')); // find pages in public directory

// start the server and say what port it is on
http.listen(serverPort, function() {
  console.log('listening on *:%s', serverPort);
});
//----------------------------------------------------------------------------//


//---------------------- WEBSOCKET COMMUNICATION -----------------------------//
// this is the websocket event handler and say if someone connects
// as long as someone is connected, listen for messages
io.on('connect', function(socket) {
  console.log('a new user connected');
  var questionNum = 0; // keep count of question, used for IF condition.
  socket.on('loaded', function() { // we wait until the client has loaded and contacted us that it is ready to go.

    socket.emit('answer', "Hello I am J-oliday, a chat bot to help you find the dates for Jewish Holidays."); //We start with the introduction;
    setTimeout(timedQuestion, 5000, socket, "Would you like to know the date of the next Jewish Holiday?"); // Wait a moment and respond with a question.

  });
  socket.on('message', (data) => { // If we get a new message from the client we process it;
    console.log(data);
    questionNum = bot(data, socket, questionNum); // run the bot function with the new message
  });
  socket.on('disconnect', function() { // This function  gets called when the browser window gets closed
    console.log('user disconnected');
  });
});

function stringify_date(d) {
  var result = '' + d;
  return result.substring(0,10);
}

//--------------------------CHAT BOT FUNCTION-------------------------------//
function bot(data, socket, questionNum) {
  var input = data; // This is generally really terrible from a security point of view ToDo avoid code injection
  var answer;
  var question;
  var waitTime;
  var complete = false;

  var holidays = new Map([
    ['purim', new Date(2019, 2, 21)],
    ['passover', new Date(2019, 3, 20)],
    ['shavuot', new Date(2019, 5, 09)],
    ['rosh hashana', new Date(2019, 8, 30)],
    ['yom kippur', new Date(2019, 9, 09)],
    ['hannukah', new Date(2019, 11, 23)]
  ]);

  /// These are the main statments that make up the conversation.
  if (questionNum == 0) {
    if (input.toLowerCase() === 'yes' || input.toLowerCase() === 1) {
      var today = new Date(); 
      var next_name = 'Name';
      var next_date = Infinity;
      for (var [name, date] of holidays) {
        if (today <= date) {
          next_name = name;
	  next_date = date;
	}
      }
      answer = 'The next Jewish Holiday is ' + next_name + ' on ' + stringify_date(date);
      waitTime = 3000;
      question = 'I can also find the date of a holiday that you specify:';
    }
    else if (input.toLowerCase() === 'no' || input.toLowerCase() == 0) {
	answer = 'Not a problem!';      
	waitTime = 3000;
	question = 'Which holiday would you like to know about?';
    }
    else {
      question = 'Would you like to know the date of the next jewish holiday?';
      answer = 'Please answer either yes or no.'
      questionNum--;
      waitTime = 3000;
    }
  }
  else if (questionNum == 1) {
    if (holidays.has(input.toLowerCase())) {
      var name = input.toLowerCase();
      answer = name + ' is on ' + stringify_date(holidays.get(name));  
      waitTime = 3000;
      question = 'Did you enjoy?';
    } else {
      question = 'Which holiday would you like to know about?';
      var str = '';
      for (var [name, date] of holidays) {
        str += name + ', ';
      }
      str = str.slice(0, str.length-2); // remove last comma 
      answer = 'Please specify from one of the following holidays ' + str;
      questionNum--;
      waitTime = 5000; 
    }
  } else {
    answer = 'Thanks for stopping by!'; // output response
    waitTime = 0;
    question = '';
  }
//	  
//    answer = 'Hello ' + input + ' :-)'; // output response
//    waitTime = 5000;
//    question = 'How old are you?'; // load next question
//  } else if (questionNum == 1) {
//    answer = 'Really, ' + input + ' years old? So that means you were born in: ' + (2018 - parseInt(input)); // output response
//    waitTime = 5000;
//    question = 'Where do you live?'; // load next question
//  } else if (questionNum == 2) {
//    answer = 'Cool! I have never been to ' + input + '.';
//    waitTime = 5000;
//    question = 'Whats your favorite color?'; // load next question
//  } else if (questionNum == 3) {
//    answer = 'Ok, ' + input + ' it is.';
//    socket.emit('changeBG', input.toLowerCase());
//    waitTime = 5000;
//    question = 'Can you still read the font?'; // load next question
//  } else if (questionNum == 4) {
//    if (input.toLowerCase() === 'yes' || input === 1) {
//      answer = 'Perfect!';
//      waitTime = 5000;
//      question = 'Whats your favorite place?';
//    } else if (input.toLowerCase() === 'no' || input === 0) {
//      socket.emit('changeFont', 'white'); /// we really should look up the inverse of what we said befor.
//      answer = ''
//      question = 'How about now?';
//      waitTime = 0;
//      questionNum--; // Here we go back in the question number this can end up in a loop
//    } else {
//      question = 'Can you still read the font?'; // load next question
//      answer = 'I did not understand you. Could you please answer "yes" or "no"?'
//      questionNum--;
//      waitTime = 5000;
//    }
//    // load next question
//  } 


  /// We take the changed data and distribute it across the required objects.
  socket.emit('answer', answer);
  setTimeout(timedQuestion, waitTime, socket, question);
  return (questionNum + 1);
}

function timedQuestion(socket, question) {
  if (question != '') {
    socket.emit('question', question);
  } else {
    //console.log('No Question send!');
  }

}
//----------------------------------------------------------------------------//
