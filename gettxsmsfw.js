let notify, tokenkey, allsms = true, regexstr = '码|碼|code|\\d{4,}'; //正则匹配转发特定的短信,可以按需修改正则,需要转义
try {
    if (typeof $argument == 'string') { //token/key等使用传入参数,代码无需写死,更加灵活
        const notifyl = $argument.split('||');
        notify = notifyl[0].trim();
        tokenkey = notifyl[1].trim();
    } else {
        switch ($argument.notify) {
            case '钉钉':
                notify = '0';
                break;
            case 'Server酱':
                notify = '1';
                break;
            case '企业微信':
                notify = '2';
            default:
                notify = '-1';
        }
        tokenkey = $argument.tokenkey;
        allsms = $argument.allsms;
        regexstr = $argument.regexstr;
    }
} catch {
    $notification.post($script.name, '', '参数不正确,停止运行');
}

if (tokenkey) {
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
    const smsender = smso?.query?.sender ?? '获取发送号码失败';
    const sms = smso?.query?.message?.text ?? '获取TX转发短信失败';
    if (!allsms) {
        forward = new RegExp(regexstr, 'i').test(sms);
    }

    //使用switch语句,预留自定义通知方式,如有需要,自行参考对应的API文档编写代码
    if (forward) {
        switch (notify) {
            case '0':
                dtnotification(tokenkey, [smsender, sms]);
                break;
            case '1':
                scnotification(tokenkey, [smsender, sms]);
                break;
            case '2':
                wxnotification(tokenkey, [smsender, sms]);
            default:
                $notification.post($script.name, '', '参数不正确,停止运行');
        }
    }
}

function postmsg(requrl, reqbody) {
    const reqparams = {
        url: requrl,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0',
            'Content-Type': 'application/json;charset=utf-8'
        },
        body: reqbody,
        timeout: 5000
    }
    $httpClient.post(reqparams);
}

function dtnotification(kwactk, smsender) {
    const kwactkl = kwactk.split('.');
    const dtactk = kwactkl[1].trim();
    const dtkeyword = kwactkl[0].trim();
    const dtwebhookurl = 'https://oapi.dingtalk.com/robot/send?access_token=' + dtactk;
    const reqbody = `{"msgtype":"text","text":{"content":"${dtkeyword}\n发送号码:${smsender[0]} 短信内容:${smsender[1]}"}}`;
    postmsg(dtwebhookurl, reqbody);
}

function scnotification(sendkey, smsender) {
    const serverchanurl = String(sendkey).startsWith('sctp')
        ? `https://${sendkey.match(/^sctp(\d+)t/)[1]}.push.ft07.com/send/${sendkey}.send`
        : `https://sctapi.ftqq.com/${sendkey}.send`;
    const reqbody = `{"title":"TX短信转发","desp":"发送号码:${smsender[0]} 短信内容:${smsender[1]}"}`;
    postmsg(serverchanurl, reqbody);
}

function wxnotification(sendkey, smsender) {
    const wxwebhookurl = 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=' + sendkey;
    const reqbody = `{"msgtype":"text","text":{"content":"发送号码:${smsender[0]} 短信内容:${smsender[1]}"}}`
    postmsg(wxwebhookurl, reqbody);
}
