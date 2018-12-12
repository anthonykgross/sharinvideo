$(function(){
    var socket = io.connect("http://"+document.domain+":2337");
    var player;

    socket.emit('init', {master: master});

    socket.on('message', function(j){
        $('#message').append($('<li/>').html(j));
    });
    
    socket.on('new_video', function(j){
        var elm = $('#mediaplayer');

        player = new YT.Player(
            elm.attr('id'), {
                videoId: j.url
            }
        );
    });

    socket.on('event_change', function(j){
        console.log(j);
        if($("#sync").is(':checked')){

            if(j && player){
                if(j.event==='onPlay'){
                    player.playVideo();
                }
                if(j.event==='onPause'){
                    player.pauseVideo();
                }
                if(j.event==='onSeek'){
                    player.seekTo(j.data.offset);
                }
                if(j.event==='onTime'){

                }
            }
        }
    });
});