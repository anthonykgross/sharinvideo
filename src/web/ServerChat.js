var fs = require('fs'),
    http = require('http'),
    socketio = require('socket.io');

var PORT_SOCKETIO_SERVER = 2337;

var server = http.createServer();
var io = socketio.listen(server);
io.set( 'origins', '*anthonykgross.fr*:*' )

function Socket(type, name, ioSocket) {
    this.ioSocket = ioSocket;
    this.type = type;
    this.name = name;
}

function Channel(master) {
    this.master = master;
    this.slaves = [];

    /**
     * @param socket Socket
     * @returns {Channel}
     */
    this.addSlave = function(socket) {
        this.slaves.push(socket);
        return this;
    };

    this.emitMaster = function (event, data) {
        if (this.master) {
            this.master.ioSocket.emit(event, data);
        }
    };

    this.emitSlaves= function (event, data) {
        /**
         * @var socket Socket
         */
        this.slaves.forEach(function (socket) {
            socket.ioSocket.emit(event, data);
        });
    };

    this.emitAll = function (event, data) {
        this.emitMaster(event, data);
        this.emitSlaves(event, data);
    };

    this.removeByIoSocketID = function(iosocketId) {
        if(this.master) {
            if (this.master.ioSocket.id === iosocketId) {
                delete this.master;
            }
        }

        for (var index = 0; index < this.slaves.length; index++) {
            var slave = this.slaves[index];

            if(slave.ioSocket.id === iosocketId) {
                this.slaves = this.slaves.slice(index, index);
            }
        }
    };

    /**
     * @param iosocketId
     * @returns Socket | null
     */
    this.getSocketByIOSocket = function(iosocketId) {
        var c;

        if (this.master) {
            if (iosocketId === this.master.ioSocket.id) {
                c = this.master;
            }
        }

        this.slaves.forEach((slave) => {
            if (iosocketId === slave.ioSocket.id) {
                c = slave;
            }
        });
        return c;
    };
}

var ChannelList = {
    /**
     * @var channels Channel[]
     */
    channels: [],

    /**
     * @param name
     * @param channel
     * @returns {ChannelList}
     */
    push: function (name, channel) {
        this.channels[name] = channel;
        return this;
    },

    /**
     * @param name
     * @returns Channel | null
     */
    getChannelByMasterName: function(name) {
        return this.channels[name];
    },

    /**
     * @param iosocketId
     * @returns Channel | null
     */
    getChannelByIOSocket: function(iosocketId) {
        var c;

        Object.keys(this.channels).forEach((name) => {
            var channel = this.channels[name];

            if (channel.getSocketByIOSocket(iosocketId)) {
                c = channel;
            }
        });
        return c;
    },

    /**
     * @param name
     * @returns {Channel}
     */
    createChannel: function(name) {
        var channel = ChannelList.getChannelByMasterName(name);
        if (!channel) {
            channel = new Channel();
            ChannelList.push(name, channel);
        }
        return channel;
    }
};

io.sockets.on('connection', function (socket) {
    socket.on('slave_new', function (d) {
        console.log('slave_new', d);
        var channel = ChannelList.createChannel(d.master);
        var slave = new Socket('slave', null, socket);
        channel.addSlave(slave);
        channel.emitAll('message', 'New slave connected.');
    });

    socket.on('master_new', function (d) {
        console.log('slave_new', d);
        var channel = ChannelList.createChannel(d.master);
        channel.master = new Socket('master', d.master, socket);
        channel.emitAll('message', d.master+' connected.');
    });

    socket.on('slave_wait', function (d) {
        console.log('slave_wait', d);
    });

    socket.on('master_event_change', function (d) {
        console.log('master_event_change', d);
        var channel = ChannelList.getChannelByIOSocket(socket.id);
        if (channel) {
            channel.emitSlaves('master_event_change', d);
        }
    });

    socket.on('disconnect', function (d) {
        console.log('disconnect', d);
        var channel = ChannelList.getChannelByIOSocket(socket.id);
        if (channel) {
            var sock = channel.getSocketByIOSocket(socket.id);
            var type = sock.type.charAt(0).toUpperCase()+sock.type.slice(1);

            channel.emitAll('message', type+ ' disconnected.');
            channel.removeByIoSocketID(socket.id);
        }
    });
});
server.listen(PORT_SOCKETIO_SERVER);
