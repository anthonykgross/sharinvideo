$(function(){
    var socket = io.connect("http://"+document.domain+":2337");
    var delay = 1;
    var player;

    socket.emit('init', {master: master});

    socket.on('message', function(j){
        $('#message').prepend($('<li/>').html(j));
    });
    
    socket.on('new_video', function(j){
        var elm = $('#mediaplayer');

        player = new YT.Player(
            elm.attr('id'), {
                videoId: j.url,
                events: {
                    'onStateChange': onPlayerStateChange
                }
            }
        );
    });

    function onPlayerStateChange(event) {
        if(event.data === 2) {
            socket.emit('client_wait', {master: master});
        }

        if(event.data === 3) {
            socket.emit('client_wait', {master: master});
        }
    }

    socket.on('event_change', function(j){
        if($("#sync").is(':checked')){

            if(j && player){
                if(j.event==='onPlay'){
                    player.playVideo();
                }
                if(j.event==='onPause'){
                    player.pauseVideo();
                }
                if(j.event==='onBuffer'){
                    player.seekTo(j.seconds);
                    player.playVideo();
                }
                if(j.event==='onTime'){
                    var currentTime = player.getCurrentTime();

                    if(currentTime < j.seconds-(delay/2) || currentTime > j.seconds+(delay/2)) {
                        player.seekTo(j.seconds);
                    }
                }
            }
        }
    });
});