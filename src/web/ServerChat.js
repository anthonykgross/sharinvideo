var fs = require('fs'),
    http = require('http'),
    socketio = require('socket.io');

var PORT_SOCKETIO_SERVER = 2337;

var server = http.createServer();
var io = socketio.listen(server);

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
        this.master.ioSocket.emit(event, data);
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
                this.slaves.slice(index, 1);
            }
        }
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
     * @param name
     * @returns {Boolean}
     */
    masterConnected: function(name){
        var channel = (this.getChannelByMasterName(name));
        var ok = (channel);

        if (ok) {
            ok = (channel.master);
        }
        return ok;
    },

    /**
     * @param iosocketId
     * @returns Channel | null
     */
    getChannelByIOSocket: function(iosocketId) {
        var c;

        Object.keys(this.channels).forEach((name) => {
            var channel = this.channels[name];
            var master = channel.master;

            if (master) {
                if (iosocketId === master.ioSocket.id) {
                    c = channel;
                }
            }

            channel.slaves.forEach((slave) => {
                if (iosocketId === slave.ioSocket.id) {
                    c = channel;
                }
            });
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
        var channel = ChannelList.createChannel(d.master);
        var slave = new Socket('slave', null, socket);
        channel.addSlave(slave);
        console.log(channel);
    });

    socket.on('master_new', function (d) {
        var channel = ChannelList.createChannel(d.master);
        channel.master = new Socket('master', d.master, socket);
        console.log(channel);
    });

    socket.on('slave_wait', function (d) {
        console.log(d);
    });

    socket.on('event_change', function (d) {
        console.log(d);
        var channel = ChannelList.getChannelByMasterName(d.master);
        if (channel) {
            channel.emitAll('event_change', d);
        }
    });

    socket.on('disconnect', function () {
        var channel = ChannelList.getChannelByIOSocket(socket.id);
        if (channel) {
            channel.removeByIoSocketID(socket.id);
        }
    });
});
server.listen(PORT_SOCKETIO_SERVER);
