let notifyl = [];
try {
    notifyl = $argument.split('||'); //token等使用传入参数,代码无需写死,更加灵活
} catch {
    console.log('没有设置参数,停止运行');
}

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
    //forward = /码|碼|code|\d{4,}/.test(sms); //正则匹配转发特定的短信,删除该行最前面的两斜杠以开启,可以按需修改正则
	
	//使用switch语句,预留自定义转发方式,如有需要,自行参考对应的API文档编写代码
    if (forward) {
        switch (notifyl[0].trim()) {
        case '0':
            dtnotification(notifyl[1], sms);
            break;
        default:
            $notification.post('参数错误,停止运行');
        }
    }
}

if (notifyl.length > 0) {
    main();
}

$done();

function postmsg(requrl, reqbody) {
    const reqparams = {
        url: requrl,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36 Edg/136.0.0.0',
            'Content-Type': 'application/json'
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
