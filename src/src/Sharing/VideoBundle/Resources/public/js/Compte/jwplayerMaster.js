$(function(){
    var urlVideo    = "//www.youtube.com/watch?v=OiY3aZYJGTI";
    var socket      = io.connect("http://"+document.domain+":2337");
    var delai       = 5;
    var player;

    $('#btn_valid_url').on('click', function(){
        urlVideo = $('#urlVideo').val();
        socket.emit('new_video', {url: urlVideo, master: master});
        onYouTubeIframeAPIReady();
    });
    
    socket.on('message', function(j){
        $('#message').append($('<li/>').html(j));
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
            socket.emit('event_change', {master: master, data: event, event: 'onPlay'});
        }

        if(event.data === 2) {
            socket.emit('event_change', {master: master, data: event, event: 'onPause'});
        }

        if(event.data === 3) {
            socket.emit('event_change', {master: master, data: event, event: 'onBuffer'});
        }

        if(event.data === 5) {
            socket.emit('event_change', {master: master, data: event, event: 'onSeek'});
        }
    }
});