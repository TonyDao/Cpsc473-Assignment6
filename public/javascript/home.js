var socket = io.connect('http://localhost:8080');

var main = function() {
    'use strict';

    //check player enter username
    $('#loginButton').on('click', function(e) {
        e.preventDefault();
        var username = $('#username').val();
        if(username !== '') {
            //disable login-form
            $('#login-form').transition({
                animation: 'fade up',
                onComplete: function() {
                    //show trivia question game
                    $('#game-form').transition('fade down');
                    //display username on header
                    $('#game-form h2 span').html(username);
                    //send new user have connected
                    socket.emit('new user', {username: username});
                    //get score
                    socket.emit('score');
                }
            });            
        }
    });

    var answerId = 1;

    //enable tab selection
    var previousTab = $('.ui.tab.active.segment');
    $('.vertical.pointing.menu .item').tab({
        'onLoad': function(e){
            var currentTab = $('.ui.tab.active.segment');
            //hide current and show prevous to allow animate
            currentTab.hide();
            previousTab.show();

            //animate to hide prevous tab
            previousTab.transition({
                animation: 'scale',
                //show current tab
                onComplete: function() {
                    currentTab.transition('scale');
                }
            });

            //set current tab to be previous for feature animate
            previousTab = currentTab;
        }
    });

    //get next question
    $('#getQuestionButton').on('click', function() {
        //prevent form to reload page
        $('.ui.form.answer').form({
            onSuccess: function() {
                return false;
            }
        });

        //send request for new quetsion
        socket.emit('get question');
    });

    //answer button clicked
    $('#answerButton').on('click', function() {
        //answer question form valication
        $('.ui.form.answer').form({
            fields: {
                answer: {
                    identifier  : 'answer',
                    rules: [
                        {
                            type   : 'empty',
                            prompt : 'Please enter your question answer'
                        }
                    ]
                }
            }, 
            onSuccess: function(){
                var answer = $('#answer').val();
                var result;

                var jsonData = {answer: answer, answerId: answerId};
                console.log(jsonData);
                socket.emit('answer', jsonData);
                

                //remove question and answer
                $('#answer').val('');
                return false;
            }
        });
    });
    

    //create question validation
    $('.ui.form.question').form({
        fields: {
            question: {
                identifier  : 'question',
                rules: [
                    {
                        type   : 'empty',
                        prompt : 'Please enter your question'
                    }
                ]
            },
            answer: {
                identifier  : 'answer',
                rules: [
                    {
                        type   : 'empty',
                        prompt : 'Please enter your question answer'
                    }
                ]
            }
        }, 
        onSuccess: function(){
            var question = $('#createQuestion').val(),
                answer = $('#createAnswer').val();
				jsonObj = {'question': question, 'answer': answer};

            var jsonData = JSON.stringify(jsonObj);

            console.log(jsonData);
            
            $.ajax({
                url     : '/question',
                method  : 'POST',
                dataType: 'json',
                contentType: 'application/json',
                data    : jsonData,
                success : function(data) {
                    $('.ui.segment.answer h3 span').html(data.result);
                },
                error   : function() {
                    console.log('Error post answer');
                }
            });
            
            //remove question and answer
            $('#createQuestion').val('');
            $('#createAnswer').val('');
            return false;
        }
    });

    //score tab pressed
    $('.ui.vertical.pointing.menu a:nth-child(3)').on('click',function() {
        //get score
        socket.emit('score');
    });

        //update new user logined in
        socket.on('get users', function(data){
            var user;
            console.log(data);

            //remove list
            $('#usersList').empty();

            //add new users list
            for(var i=0; i<data.length; i++) {
                user = $('<div class="item">' + data[i].username + '</div>');
                $('#usersList').append(user);
            }
        });

        //update new question
        socket.on('new question', function(data) {
            console.log(data);
            if(data) {
                $('#question span').html(data.question);
                answerId = data.answerId;
            } else {
                $('#question span').html('No question on DB');
            } 
        });

        //display user answers
        socket.on('check answer', function(data) {
            console.log(data);

            var currentAnswer = $('<div class="ui segment">');

            var content = '<h3 class="ui header">' + data.answerer + ' answered: ';

            console.log(data.correct);
            if(data.correct === true) {
                content += '<span class="ui green header">Correct</span></h3>';
            } else {
                content += '<span class="ui red header">Incorrect</span></h3>';
            }
            content += '</div>';
            currentAnswer.append(content);

            $('#displayAnswer').append(currentAnswer);
            currentAnswer.hide();
            currentAnswer.fadeIn();
        });        

        //update score
        socket.on('update score', function(data){
            console.log(data);
            console.log(data.right);
            $('#right span').html(data.right);
            $('#wrong span').html(data.wrong);
        });


    
};


$(document).ready(main);