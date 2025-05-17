let notify, tokenetc, allsms = true, regexstr = '码|碼|code|\\d{4,}'; //正则匹配转发特定的短信,可以按需修改正则,需要转义
try {
    if (typeof $argument == 'string') { //token等使用传入参数,代码无需写死,更加灵活
        const notifyl = $argument.split('||');
        notify = notifyl[0].trim();
        tokenetc = notifyl[1].trim();
    } else {
        switch ($argument.notify) {
        case '钉钉':
            notify = '0';
            break;
        case 'Server酱':
            notify = '1';
            break;
        default:
            notify = '-1';
        }
        tokenetc = $argument.tokenetc;
        allsms = $argument.allsms;
        regexstr = $argument.regexstr;
    }
} catch {
    $notification.post($script.name, '', '参数不正确,停止运行');
}

if (tokenetc) {
    main();
}

$done();

function main() {
    let txreqbody = '',
    forward = true;
    try {
        txreqbody = $request.body;
    } catch {
        txreqbody = '{"test":"code"}';
    }
    const smso = JSON.parse(txreqbody);
    const sms = smso?.query?.message?.text ?? '获取TX转发短信失败';
    if (!allsms) {
        forward = new RegExp(regexstr).test(sms);
    }

    //使用switch语句,预留自定义通知方式,如有需要,自行参考对应的API文档编写代码
    if (forward) {
        switch (notify) {
        case '0':
            dtnotification(tokenetc, sms);
            break;
        case '1':
            serverchannoti(tokenetc, sms);
            break;
        default:
            $notification.post($script.name, '', '参数不正确,停止运行');
        }
    }
}

function postmsg(requrl, reqbody) {
    const reqparams = {
        url: requrl,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36 Edg/136.0.0.0',
            'Content-Type': 'application/json;charset=utf-8'
        },
        body: reqbody,
        timeout: 5000
    }
    $httpClient.post(reqparams);
}

function dtnotification(kwactk, sms) {
    const kwactkl = kwactk.split('.');
    const dtkeyword = kwactkl[0].trim();
    const dtwebhookurl = 'https://oapi.dingtalk.com/robot/send?access_token=' + kwactkl[1].trim();
    const reqbody = `{"msgtype":"text","text":{"content":"${dtkeyword}\n${sms}"}}`;
    postmsg(dtwebhookurl, reqbody);
}

function serverchannoti(sendkey, sms) {
    const serverchanurl = String(sendkey).startsWith('sctp')
         ? `https://${sendkey.match(/^sctp(\d+)t/)[1]}.push.ft07.com/send/${sendkey}.send`
         : `https://sctapi.ftqq.com/${sendkey}.send`;
    const reqbody = `{"title":"TX短信转发","desp":"${sms}"}`;
    postmsg(serverchanurl, reqbody);
}
