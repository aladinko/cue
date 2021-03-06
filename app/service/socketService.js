module.exports = function(server) {
    var io = require('socket.io')(server);
    var text = '';
    var countdown = 0;
    var flipState = false;
    var scrollPosition = 0;
    var scrollSpeed = 20;
    var scrollAction;
    var savedCues = {};

    io.on('connection', function(socket) {
        io.emit('options', {
            mirror: flipState
        });
        io.emit('currentContent', {
            content: text
        });
        io.emit('newContent', {
            content: text
        });
        sendCueList();
        socket.on('textBoxUpdate', function(data) {
            messageUpdate(data);
        });

        socket.on('saveCue', function(data) {
            savedCues[data.title] = data.content;
            sendCueList();
        });

        socket.on('deleteCue', function(data) {
            console.log('deleting cue', data.title);
            delete savedCues[data.title];
            sendCueList();
        });

        socket.on('setCountdown', function(data) {
            countdown = Date.now() + (data.value * 1000)
        });

        socket.on('options', function(data) {
            switch (data.action) {
                case 'flipImage':
                    flipState = !flipState;
                    io.emit('options', {
                        mirror: flipState
                    });
                    break;
                case 'scrollDown':
                    clearInterval(scrollAction);
                    startScrolling('down');
                    io.emit('scrollButton', 'down');
                    break;
                case 'scrollUp':
                    clearInterval(scrollAction);
                    startScrolling('up');
                    io.emit('scrollButton', 'up');
                    break;
                case 'scrollTop':
                    scrollPosition = 0;
                    clearInterval(scrollAction);
                    io.emit('scrollButton', 'stopped');
                    io.emit('scroll', 'top');
                    break;
                case 'stopScrolling':
                    clearInterval(scrollAction);
                    io.emit('scrollButton', 'stopped');
                    break;
                case 'scrollSpeed':
                    if (data.increase) {
                        scrollSpeed = scrollSpeed + 5;
                    } else if (scrollSpeed > 5) {
                        scrollSpeed = scrollSpeed - 5;
                    }
                    break;
            }
        });

        socket.on('disconnect', function() {
            console.log("disconnected");
        });

        setInterval(function() {
            io.emit('time', {
                currentText: getDateTime(),
                countdownText: getCountdown()
            })
        }, 100);

    });

    function messageUpdate(data) {
        text = data.content;
        io.emit('newContent', {
            content: text
        });
    }

    function startScrolling(direction) {
        io.emit('scroll', {
            position: scrollPosition + 'px',
            duration: 200
        });
        scrollAction = setInterval(function() {
            scrollPosition = (direction == 'down') ? (scrollPosition + scrollSpeed) : (scrollPosition - scrollSpeed);
            io.emit('scroll', {
                position: scrollPosition + 'px',
                duration: 200
            });
        }, 200);
    }


    function getDateTime() {
        var date = new Date();

        var hour = date.getHours();
        hour = (hour < 10 ? "0" : "") + hour;

        var min = date.getMinutes();
        min = (min < 10 ? "0" : "") + min;

        var sec = date.getSeconds();
        sec = (sec < 10 ? "0" : "") + sec;

        return hour + ":" + min + ":" + sec;
    }

    function getCountdown() {
        var now = Date.now()
        var difference = (countdown - now) / 1000;
        if (difference > 0) {
            var min = Math.floor(difference / 60);
            var sec = Math.round((difference - min * 60) * 10) / 10;
            return ((min < 10) ? '0' + min : min) + ":" + ((sec < 10) ? '0' + sec : sec);
        } else {
            return '0';
        }
    }

    function sendCueList() {
        io.emit('cueList', savedCues)
    }
}
