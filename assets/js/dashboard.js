// console.log(typeof trackerInBtn);

var trackerInBtn, trackerOutBtn, timerDom;

var preWorkedSec = 0;
var istrackeredIn = false;
var trackerTimer;

function initDashboard(){
    const versionObj = document.getElementById("version");
    versionObj.innerHTML  = version;
    trackerInBtn = document.getElementById("tracker-in");
    trackerOutBtn = document.getElementById("tracker-out");

    timerDom = document.getElementById("tiles");
    syncDataId = document.getElementById("sync-data");
    syncTimeId = document.getElementById("sync-time");


    trackerInBtn.addEventListener("click", trackeredIn);
    trackerOutBtn.addEventListener("click", trackeredOut);


    myTimer();
    const d = new Date();
    document.getElementById("datetime").innerHTML = d.toDateString() +' '+d.toLocaleTimeString();

}

function myTimer() {
//    if(istrackeredIn){ // check is user trackered-in
        preWorkedSec++;
//    }
    
    timerDom.innerHTML = convertSecondsToHMS(preWorkedSec);
}

function trackeredIn(){ /* tracker-out btn show */
    myTimer();
    trackerTimer = setInterval(myTimer, 1000);
    removeClass(trackerInBtn, "show");
    addClass(trackerInBtn, "hide");

    removeClass(trackerOutBtn, "hide");
    addClass(trackerOutBtn, "show");

    // const user1 = new User('John Doe', 'john@example.com');
    sendMsgToBackground();
    
}

function sendMsgToBackground(){
    let device_id = getLocalData(deviceIdL, false);

    let logObj = {
        device_id };

    chrome.runtime.sendMessage({
        action: "startRecording",
        details: logObj,
    });
    
}

function trackeredOut(){ /* tracker-in btn show */
    clearInterval(trackerTimer);
    myTimer();
    removeClass(trackerOutBtn, "show");
    addClass(trackerOutBtn, "hide");
    
    removeClass(trackerInBtn, "hide");
    addClass(trackerInBtn, "show");

    chrome.runtime.sendMessage({
        action: "stopRecording"
    });
}

function syncData(){
    syncTimeId.innerHTML = new Date().toLocaleString();
    chrome.runtime.sendMessage({
        action: "syncAllData"
    });
}

function opentab(){
//    chrome.tabs.create({ url: url });
}


initDashboard();