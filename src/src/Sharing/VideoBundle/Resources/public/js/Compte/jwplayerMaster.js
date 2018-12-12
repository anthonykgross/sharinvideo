$(function(){
    var urlVideo    = "https://www.youtube.com/watch?v=OiY3aZYJGTI";
    var socket      = io.connect("https://"+document.domain+":2337");
    var delai       = 5;
    var locked      = false;
    
    $('#btn_valid_url').on('click', function(){
        urlVideo = $('#urlVideo').val();
        socket.emit('new_video', {url: urlVideo, master: master});
        
        jwplayer("mediaplayer").setup({
            file: urlVideo,
            width: "75%",
            aspectratio: "16:9"
        });
        jwplayer("mediaplayer").onPause(function(d){
            socket.emit('event_change', {master: master, data: d, event: 'onPause'});
        });
        jwplayer("mediaplayer").onPlay(function(d){
            socket.emit('event_change', {master: master, data:{offset:jwplayer("mediaplayer").getPosition()}, event: 'onSeek'});
            if(d.oldstate === "BUFFERING" && d.newstate === "PLAYING"){
                 socket.emit('master_ready', {master: master});
             }
        });
        jwplayer("mediaplayer").onBuffer(function(d){
            socket.emit('event_change', {master: master, data: d, event: 'onBuffer'});
        });
        jwplayer("mediaplayer").onSeek(function(d){
            socket.emit('event_change', {master: master, data: d, event: 'onSeek'});
        });
        jwplayer("mediaplayer").onTime(function(d){
            socket.emit('time', {master:master, data: d, event: 'onTime', delai: delai});
        });
        jwplayer("mediaplayer").onBuffer(function(d){
             if(d.oldstate === "PLAYING" && d.newstate === "BUFFERING"){
                 socket.emit('master_wait', {master: master});
             }
        });
    });
    
    socket.on('message', function(j){
        $('#message').append($('<li/>').html(j));
    });
});