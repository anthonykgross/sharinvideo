$(function(){
    var urlVideo    = "//www.youtube.com/watch?v=OiY3aZYJGTI";
    var socket      = io.connect("http://"+document.domain+":2337");
    var delay       = 1;
    var player;

    $('#btn_valid_url').on('click', function(){
        urlVideo = $('#urlVideo').val();
        socket.emit('new_video', {url: urlVideo, master: master});
        onYouTubeIframeAPIReady();
    });
    
    socket.on('message', function(j){
        var date = moment().format('h:mm:ss');
        $('#message').prepend($('<li/>').html(date+' : '+j));
    });


    function onYouTubeIframeAPIReady() {
        var elm = $('#mediaplayer');

        player = new YT.Player(
            elm.attr('id'), {
                videoId: urlVideo,
                events: {
                    'onStateChange': onPlayerStateChange
                }
            }
        );
    }

    function onPlayerStateChange(event) {
        if(event.data === 1) {
            socket.emit('event_change', {master: master, data: event, seconds: player.getCurrentTime(), event: 'onPlay'});
        }

        if(event.data === 2) {
            socket.emit('event_change', {master: master, data: event, seconds: player.getCurrentTime(), event: 'onPause'});
        }

        if(event.data === 3) {
            socket.emit('event_change', {master: master, data: event, seconds: player.getCurrentTime(), event: 'onBuffer'});
        }
    }


    setInterval(function() {
        if (player) {
            socket.emit('event_change', {master: master, data: {}, seconds: player.getCurrentTime(), event: 'onTime'});
        }
    }, delay*1000);
});