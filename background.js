var testcase_items = new Array();
var active = false;
var empty = true;
var tab_id = null;
var currentStatus = null;
console.log('init');
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action == "append") {
    console.log(request.obj);
    testcase_items[testcase_items.length] = request.obj;
    empty = false;
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
            tab_id = request.recorded_tab;
            chrome.tabs.update(tab_id, {url: request.start_url}, function(tab) {
              alert("You are now recording your test sequence.");
              chrome.tabs.sendMessage(tab_id, {action: "open", 'url': request.start_url});
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
    sendResponse({'items': testcase_items});
    }

    if (request.action == "replay") {
        chrome.tabs.query({"active": true, "currentWindow": true}, function (tabs) {
            var tab = tabs[0];
            var siteInfo = testcase_items[0];
            console.log(siteInfo);
            chrome.tabs.update(tab.tab_id, {url: siteInfo.url}, function(tab) {
                currentStatus = "replaying";
                alert("Begin replay, please don't execute other tasks");
            });
        });
        sendResponse({'message': 'ok'});
    }

    if (request.action == "replay") {
        chrome.tabs.query({"active": true, "currentWindow": true}, function (tabs) {
            var tab = tabs[0];
            var siteInfo = testcase_items[0];
            console.log(siteInfo);
            chrome.tabs.update(tab.id, {url: siteInfo.url}, function(tab) {
                currentStatus = "replaying";
                alert("Begin replay, please don't execute other tasks");
            });
        });
        sendResponse({'message': 'ok'});
    }

    if(request.action == 'replaying'){
        sendResponse({'items': testcase_items});
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

    if(request.action == 'repeatStatus'){
        sendResponse({'currentStatus': currentStatus});
    }
});