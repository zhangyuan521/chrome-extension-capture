var testcase_items = new Array();
var active = false;
var empty = true;  //是否有时间触发
var tab_id = null; //当前tab_id号
var current_url = null; //当前tab的url
var currentStatus = null; //判断是否是repeating状态
var index = 0;

console.log('init');
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {

    if (request.action == "append") {
        if(active === true){
            console.log(request.obj);
            empty = false;
            testcase_items[index - 1]['actions'].push(request.obj);
        }
        sendResponse({});
    }

    if (request.action == "poke") {
        testcase_items[testcase_items.length - 1] = request.obj;
        sendResponse({});
    }

    if (request.action == "get_status") {
        sendResponse({'active': active, 'empty': empty});
    }

    if (request.action == "start") {
        currentStatus = null;
        if(!active) {
            active = true;
            empty = true;
            testcase_items = new Array();
            chrome.tabs.update(tab_id, {url: request.start_url}, function(tab) {
                tab_id = tab.id;
                current_url = tab.url;
                testcase_items[index] = {
                    "tab_id": tab.id,
                    "actions": [],
                    "url": tab.url
                };
                index++;
                sendResponse({start: true});
            });
        }
    }

    if (request.action == "stop") {
        active = false;
        index = 0;
        chrome.tabs.sendMessage(tab_id, {action: "stop"});
        sendResponse({});
    }

    if (request.action == "get_items") {
        console.log(sender,testcase_items[sender.tab.url]['actions']);
        sendResponse({'items': testcase_items[sender.tab.url]['actions']});
    }

    //开始回放
    if (request.action == "replay") {
        chrome.tabs.query({"active": true, "currentWindow": true}, function (tabs) {
            var tab = tabs[0];
            chrome.tabs.update(tab.tab_id, {url: testcase_items[index]['url']}, function(tab) {
                currentStatus = "replaying";
                alert("Begin replay, please don't execute other tasks");
            });
        });
        sendResponse({'message': 'ok'});
    }

    if (request.action == "reset") {
        testcase_items = new Array();
        active = false;
        empty = true;
        tab_id = null;
        current_url = null;
        currentStatus = null;
        index = 0;
        sendResponse({'message': 'ok'});
    }

    //获取该回放url所有的动作
    if(request.action == 'replaying'){
        if(index > testcase_items.length -1){
            console.log('已执行完毕,没有其他的anctions');
        }else{
            console.log(sender,testcase_items[index]['actions']);
            sendResponse({'items': testcase_items[index]['actions']});
            index++;
        }


        /*chrome.tabs.query({"active": true, "currentWindow": true}, function (tabs) {
            var siteInfo = testcase_items[0];
            var tab = tabs[0];
            /!*if(tab.url !== siteInfo.url){
                alert('your behaviour has effected this extension');
                return;
            }*!/
            console.log(tabs);
            sendResponse({'items': 123131});
        });*/
    }

    //获取当前主进程的状态
    if(request.action == 'repeatStatus'){
        sendResponse({'currentStatus': currentStatus});
    }

    //跳转后的页面初始化动作
    if(request.action == 'redirect'){
        tab_id = sender.tab.id;
        current_url = sender.tab.url;
        testcase_items[index] = {
            "tab_id": tab_id,
            "actions": [],
            "url": current_url
        };
        index ++;
        sendResponse({});
    }
});