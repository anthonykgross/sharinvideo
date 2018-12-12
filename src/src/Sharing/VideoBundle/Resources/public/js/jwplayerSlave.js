$(function(){
    var socket = io.connect("https://"+document.domain+":2337");
    var locked      = false;
    
    socket.emit('init', {master: master});

    socket.on('message', function(j){
        $('#message').append($('<li/>').html(j));
    });
    
    socket.on('new_video', function(j){
        jwplayer("mediaplayer").setup({
            file: j.url,
            width: "75%",
            aspectratio: "16:9"
            
        });
        jwplayer("mediaplayer").onBuffer(function(d){
             if(d.oldstate === "PLAYING" && d.newstate === "BUFFERING"){
                 socket.emit('client_wait', {master: master});
             }
        });
        jwplayer("mediaplayer").onPlay(function(d){
             if(d.oldstate === "BUFFERING" && d.newstate === "PLAYING"){
                 socket.emit('client_ready', {master: master});
             }
        });
    });
    
    socket.on('event_change', function(j){
        if($("#sync").is(':checked')){
            
            if(j.event !== "undefined"){
                if(j.event==='onPlay'){
                    jwplayer("mediaplayer").play();
                }
                if(j.event==='onPause'){
                    if(jwplayer("mediaplayer").getState()==="PLAYING"){
                        jwplayer("mediaplayer").pause();
                    }
                }
                if(j.event==='onSeek'){
                    jwplayer("mediaplayer").seek(j.data.offset);
                }
                if(j.event==='onTime'){
                    delai = jwplayer("mediaplayer").getPosition()-j.data.position;
                    if((j.delai*-1) > delai || (j.delai*1) < delai){
                        if(jwplayer("mediaplayer").getState()==="PLAYING"){
                            jwplayer("mediaplayer").seek(j.data.position);
                        }
                    }
                }
            }
        }
    });
});