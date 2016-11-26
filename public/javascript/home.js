/* jshint browser: true, jquery: true, camelcase: true, indent: 2, undef: true, quotmark: single, maxlen: 80, trailing: true, curly: true, eqeqeq: true, forin: true, immed: true, latedef: true, newcap: true, nonew: true, unused: true, strict: true */

var socket = io.connect('http://localhost:8080');

var main = function() {
    'use strict';

    //knockout viewmodel
    var vm = {
        username: ko.observable(''),
        question: ko.observable(''),
        answer: ko.observable(''),
        createQuestion: ko.observable(''),
        createAnswer: ko.observable(''),
        rightPoint: ko.observable(0),
        wrongPoint: ko.observable(0),
        playerList: ko.observableArray(),
        displayAnswer: ko.observableArray()
    };

    ko.applyBindings(vm);

    //check player enter username
    $('#loginButton').on('click', function(e) {
        e.preventDefault();

        //check if user enter username
        if(vm.username() !== '') {
            //disable login-form
            $('#login-form').transition({
                animation: 'fade up',
                onComplete: function() {
                    //show trivia question game
                    $('#game-form').transition('fade down');

                    //send new user have connected
                    socket.emit('new user', {username: vm.username()});
                    //get score
                    socket.emit('score');
                }
            });            
        }
    });

    var answerId = 0;

    //enable tab selection
    var previousTab = $('.ui.tab.active.segment');
    $('.vertical.pointing.menu .item').tab({
        'onLoad': function(){
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
        $('.ui.form.answer').submit(function(e) {
            e.preventDefault();
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
                //send answer to socket IO
                var jsonData = {answer: vm.answer(), answerId: answerId};
                socket.emit('answer', jsonData);

                //empty answer
                vm.answer('');
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
            //json data
            var jsonData = JSON.stringify({
                            'question': vm.createQuestion(),
                            'answer': vm.createAnswer()
                        });
            
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
            vm.createQuestion('');
            vm.createAnswer('');
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
        //empty player list
        vm.playerList([]);

        //display retrieved player list from socket IO
        for(var i=0; i<data.length; i++) {
            vm.playerList.push(data[i].username);
        }
    });

    //update new question
    socket.on('new question', function(data) {

        //empty last round answer
        vm.displayAnswer([]);

        if(data) {
            vm.question(data.question);
            answerId = data.answerId;
        } else {
            vm.question('No question on DB');
        } 
    });

    //display user answers
    socket.on('check answer', function(data) {
        var obj = {player: data.answerer, answer: '', class: ''};

        if(data.correct === true) {
            obj.answer = 'Correct';
            obj.class = 'ui green header';
        } else {
            obj.answer = 'Incorrect';
            obj.class = 'ui red header';
        }

        //display player answer
        vm.displayAnswer.push(obj);
    });

    //update score
    socket.on('update score', function(data){
        //display player right and wrong score
        vm.rightPoint(data.right);
        vm.wrongPoint(data.wrong);
    });
};


$(document).ready(main);