var     fs                  = require('fs'), 
        http                = require('http'), 
        socketio            = require('socket.io');

var PORT_SOCKETIO_SERVER    = 2337;

var server                  = http.createServer();
var io                      = socketio.listen(server);
var masters                 = [];
var viewers                 = [];
var sockets                 = [];

io.sockets.on('connection', function(socket) {
    socket.on('init', function(j) {
	console.log(j);
        sockets[socket.id] = {
            'type': 'viewer',
            'master': j.master
        };
        
        if(!viewers[j.master]){
            viewers[j.master]=[];
        }
        viewers[j.master].push(socket);
        if(!masters[j.master]){
            socket.emit('message', j.master+" ne partage pas de vidéo actuellement.");
        }
        else{
            masters[j.master]['socket'].emit('message',"Le client #"+socket.id+" vient de se connecter.");
            socket.emit('new_video',{url:masters[j.master]['video']});
            socket.emit('event_change',masters[j.master]['event']);
        }
    });
    socket.on('master_wait', function(j) {
        if(viewers[j.master]){
            viewers[j.master].forEach(function(sock){
                sock.emit('message', j.master+" rencontre quelques ralentissements.");
                socket.emit('event_change',{event:'onPause'});
            });
        }
    });
    socket.on('master_ready', function(j) {
        if(viewers[j.master]){
            viewers[j.master].forEach(function(sock){
                sock.emit('message', j.master+" reprend la vidéo.");
            });
        }
    });
    socket.on('client_wait', function(j) {
        masters[j.master]['socket'].emit('message',"Le client #"+socket.id+" rencontre quelques ralentissements.");
    });
    socket.on('client_ready', function(j) {
        masters[j.master]['socket'].emit('message',"Le client #"+socket.id+" reprend la vidéo.");
    });
    socket.on('new_video', function(j) {
        sockets[socket.id] = {
            'type': 'master',
            'master': j.master
        };
        masters[j.master] = {
            'socket': socket,
            'second': 0,
            'video':j.url
        };
        if(viewers[j.master]){
            viewers[j.master].forEach(function(sock){
                sock.emit('message', j.master+" partage une nouvelle video.");
                sock.emit('new_video',j);
            });
        }
    });
    socket.on('event_change', function(j) {
        masters[j.master]['event'] = j;
        if(viewers[j.master]){
            viewers[j.master].forEach(function(sock){
                sock.emit('event_change',j);
            });
        }
    });
    socket.on('time', function(j) {
        if (masters[j.master]) {
            masters[j.master]['second'] = j.data.position;
        }
        if(viewers[j.master]){
            viewers[j.master].forEach(function(sock){
                sock.emit('event_change',j);
            });
        }
    });
    socket.on('disconnect', function() {
        if(sockets[socket.id]){
            console.log(sockets[socket.id]);
            if(sockets[socket.id]['type'] === 'viewer'){
                if(masters[sockets[socket.id]['master']]){
                    masters[sockets[socket.id]['master']]['socket'].emit('message',"Le client #"+socket.id+" s'est déconnecté.");
                }
                delete viewers[sockets[socket.id]['master']];
            }
            else{
                if(viewers[sockets[socket.id]['master']]){
                    viewers[sockets[socket.id]['master']].forEach(function(sock){
                        sock.emit('message',sockets[socket.id]['master']+" s'est déconnecté.");
                    });
                }
                delete masters[sockets[socket.id]['master']];
            }
            delete sockets[socket.id];
        }
    });
});
server.listen(PORT_SOCKETIO_SERVER);
