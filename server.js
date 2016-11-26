/* jshint browser: true, jquery: true, camelcase: true, indent: 2, undef: true, quotmark: single, maxlen: 80, trailing: true, curly: true, eqeqeq: true, forin: true, immed: true, latedef: true, newcap: true, nonew: true, unused: true, strict: true */

var express = require('express'),
    bodyParser = require('body-parser'),
    http = require('http'),
    mongoose = require('mongoose'),
    redis = require('redis'),
    app = express();

// set up a static file directory to use for default routing
app.use(express.static(__dirname + '/public'));

//parse application/json
app.use(bodyParser.json());

// create application/x-www-form-urlencoded parser
app.use(bodyParser.urlencoded({'extended': false}));

// create redis client and set right and wrong to default 0
var redisClient = redis.createClient();
redisClient.set('right', 0);
redisClient.set('wrong', 0);

//connect to the trivia data store in mongo
mongoose.connect('mongodb://localhost/trivia');

//schema for question
var questionSchema = mongoose.Schema({    
    'question'  : String,
    'answerId'  : Number,
    'answer'    : String
});

//question data model
var Question = mongoose.model('Question', questionSchema);

//function to get the number of question
var getCount = function (callback) {
	'use strict';
    Question.count({}, function(err, count) {
        if (err) {
            return callback(err);
        } else {            
            callback(null, count);
        }        
    });
};

//get question
app.get('/question', function(req, res) {
	'use strict';
    var randomID,
        jsonQuestion;

    getCount(function(err, count) {
        if(err) {
            console.log(err);
        } else {
            randomID = Math.floor(Math.random() * count + 1);
            //search to see if any question from DB
            Question.findOne({'answerId': randomID}, function(err, result) {
                //error of getting question
                if (err !== null) {
                    console.log('ERROR: ' + err);
                } 
                //DB contain questions
                else if (result){
                    jsonQuestion = {
                        'question'  : result.question,
                        'answerId'  : result.answerId
                    };
                    res.json(jsonQuestion);
                } else {
                    jsonQuestion = {
                        'question'  : 'No Question',
                        'answerId'  : 0
                    };
                    res.json(jsonQuestion);
                }
            });            
        }
    });    
});

// post request for create question
app.post('/question', function(req, res) {
	'use strict';
    var jsonObj,
        newQuestion;

    jsonObj = req.body;

    getCount(function(err, count) {
        if(err) {
            console.log(err);
        } else {
            //create new question
            newQuestion = new Question({
                'question'  : jsonObj.question,
                'answerId'  : count + 1,
                'answer'    : jsonObj.answer
            });

            //save new question
            newQuestion.save(function (err) {
                if (err !== null) {
                    console.log('ERROR: ' + err);
                } else {
                    console.log('the object was saved!');
                    return res.json({result: 'question saved'});
                }
            });
        }            
    });
    
});

// post request for send answer
app.post('/answer', function(req, res) {
	'use strict';
    var jsonObj,
        answerId,
        answer,
        correct;

    jsonObj = req.body;
    console.log(req.body);
    answerId = parseInt(jsonObj.answerId, 10);
    answer = jsonObj.answer;

    Question.findOne({'answerId': answerId}, function(err, result) {
        //error of getting question
        if (err !== null) {
            console.log('ERROR: ' + err);
        } 
        //find matching answerId
        else {
            if (answer === result.answer) {
                correct = true;
                redisClient.incr('right', function(err, value) {
                    if (err) {
                        console.log('ERROR: increase right. '+ err);
                    } else {
                        console.log('right: ' + value);
                    }
                });
            } else {
                correct = false;
                redisClient.incr('wrong', function(err, value) {
                    if (err) {
                        console.log('ERROR: increase wrong. '+ err);
                    } else {
                        console.log('wrong: ' + value);
                    }
                });
            }
            return res.json({correct: correct});
        }
    });  
});

// get request for score numbers
app.get('/score', function(req, res) {
	'use strict';
    var right, wrong;

    redisClient.mget(['right','wrong'], function (err, results) {
        if (err) {
            console.log('ERROR: get right. ' + err);
        } else {
            right = parseInt(results[0], 10) || 0;
            wrong = parseInt(results[1], 10) || 0;
            res.json({right: right, wrong: wrong});
        }
    });    
});

//listen on port 3000
http.createServer(app).listen(3000);

console.log('Server listening on port 3000');