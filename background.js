var testcase_items = new Array();
var active = false;
var empty = true;  //是否有时间触发
var tab_id = null; //当前tab_id号
var current_url = null; //当前tab的url
var currentStatus = null; //判断是否是repeating状态

console.log('init');
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {

    if (request.action == "append") {
        console.log(request.obj);
        empty = false;
        testcase_items[current_url]['actions'].push(request.obj);
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
                alert("You are now recording your test sequence.");
                tab_id = tab.id;
                current_url = tab.url;
                testcase_items[tab.url] = {
                    "tab_id": tab.id,
                    "actions": []
                };
                sendResponse({start: true});
            });
        }
    }

    if (request.action == "stop") {
        active = false;
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
            for(var i in testcase_items){
                console.log("repalying open url:" + i);
                chrome.tabs.update(tab.tab_id, {url: i}, function(tab) {
                    currentStatus = "replaying";
                    alert("Begin replay, please don't execute other tasks");
                });
                break;
            }
        });
        sendResponse({'message': 'ok'});
    }

    //获取该回放url所有的动作
    if(request.action == 'replaying'){
        if(testcase_items[sender.tab.url]){
            console.log(sender,testcase_items[sender.tab.url]['actions']);
            sendResponse({'items': testcase_items[sender.tab.url]['actions']});
        }else{
            console.log(sender.tab.url+"所对应的url的actions不存在");
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
        testcase_items[current_url] = {
            "tab_id": tab_id,
            "actions": []
        };
        sendResponse({});
    }
});