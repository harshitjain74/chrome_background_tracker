let trackList = {};
let track_id;
let idle_time = 0, active_time = 0;
let mousedownCount = 0, keydownCount = 0;
let active_timer, idle_timer;
let track_timer, every_seconds_timer;
let sync_timer, track_time = 60;
let isLocked = false, isRecording = false;

const getDefaultObj = async (image_blob=null, tabUrl='', tabTitle='', eventType='STANDARD') => {
    
    mousedownCount = 0, keydownCount = 0;
    idle_time = 0, active_time = 0;
    const start_time = Math.floor(Date.now() / 1000);
    if(eventType!=='STANDARD'){
      startActiveTimer();
    }
    
    return {
        title: tabTitle, 
        url: tabUrl,
        image_data: image_blob, 
        start_time: start_time, 
        end_time: null, 
        active_time: active_time, 
        idle_time: idle_time, 
        duration: 0, 
        keystroke: keydownCount,
        mouse_click: mousedownCount,
    };
}

// Listen for start/stop Recording message from dashboard.js
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === "startRecording") {
//        storedDetails = request.details;
        initSetup();
    } else if(request.action === "stopRecording"){
        stopRecording();
    } else if(request.action === "syncAllData"){
        syncAllData();
    } else if (request.event === "mousedown") {
      mousedownCount+= 1;
    } else if (request.event === "keydown") {
      keydownCount+= 1;
    }
});

// Listen for changes in window focus
chrome.windows.onFocusChanged.addListener((windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
      console.log("No window is focused.");
      // The window is in the background
  } else {
      console.log(" clear timer idle_auto_po_timer.");
    console.log(" window is focused now.");
      chrome.tabs.query({active: true, windowId: windowId}, (tabs) => {
          if (tabs.length > 0 && tabs[0].active) {
              console.log("Tab is in the foreground.");
              // Do something when the tab is in the foreground
          } else {
              console.log("Tab is in the background.");
              // Do something when the tab is in the background
          }
      });
  }
});

const initSetup = () => {
    if(isRecording){
      return;
    }

    chrome.idle.setDetectionInterval(15);

    sync_timer = setInterval(syncAllData, (track_time+100)*1000); // *1000

    startRecording();
}

const startRecording = () => {
    isRecording = true;
    createNewSession();
    track_timer = setInterval(createNewSession, track_time*1000); // *1000
    
    chrome.tabs.onActivated.addListener(handleTabActivation);
    chrome.tabs.onUpdated.addListener(handleTabUpdation);
    chrome.idle.onStateChanged.addListener(handleIdleState);
}

const pauseRecording = async () => {
    chrome.tabs.onActivated.removeListener(handleTabActivation);
    chrome.tabs.onUpdated.removeListener(handleTabUpdation);
    clearInterval(track_timer);
    clearActiveIdleTimer();
    let trackLastLog;
    if(track_id!==undefined){
      console.log("old track_id: ", track_id);
      trackLastLog = await endCurrentSession(track_id);
      track_id = undefined;
    }
}

const stopRecording = () => {
    chrome.tabs.onActivated.removeListener(handleTabActivation);
    chrome.tabs.onUpdated.removeListener(handleTabUpdation);
    clearInterval(sync_timer);
    clearInterval(track_timer);
    clearActiveIdleTimer();
    track_id = undefined;
    isRecording = false;
}

const createNewSession = async () => {
  let trackLastLog;
  if(track_id!==undefined){
    console.log("old track_id: ", track_id);
    trackLastLog = await endCurrentSession(track_id);
  }
  
  track_id = await generateUUID();
  console.log("track_id", track_id);
  trackList[track_id] = [];
  const trackObj = await getDefaultObj();

  const base64Data = await getImageData();
  trackObj['image_data'] = base64Data;

  trackList[track_id].push(trackObj);
  // console.log("trackLastLog: ", trackLastLog);
  if(trackLastLog!==undefined){
    getCurrentTab(trackLastLog);
    // const lastLog = await getDefaultObj(null, trackLastLog['url'], trackLastLog['title'], 'APP_LOG');
    // trackList[track_id].push(lastLog);
    console.log("current Tab", );
  } 
}

const endCurrentTrack = async (trackId) => {
  let trackLastLog;
  if (trackId in trackList) {
    // const last_track_id = trackId;
    const slLength = trackList[trackId].length;
    trackLastLog = await updateEndEPoch(trackList[trackId][slLength-1]);
    trackList[trackId][slLength-1] = trackLastLog;

    const trackObjFirst = await updateTrackEndEPoch(trackList[trackId]);
    trackList[trackId][0] = trackObjFirst;
    
    // syncDataToServer(last_track_id);
  }
   console.log("endCurrentTrack", trackList);
  return trackLastLog;
}

const getImageData = async () => {
  try{
    const base64String = await chrome.tabs.captureVisibleTab(null, { format: "png" });
    const base64Data = base64String.replace(/^data:image\/(png|jpg|jpeg);base64,/, '');
    // trackObj['image_data'] = base64Data;
    return base64Data;
  } catch(e) {
      console.error("Permission Error : ", e);
      return null;
  }
}

const getCurrentTab = (trackLastLog) => {
  chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
    const tab = tabs[0];
    if (tab) {
      console.log('Current Tab URL:', tab.url);
      updateTabInfoList(tab.id, tab.url, tab.title);
    } else if(trackLastLog!==undefined){
      updateTabInfoList('', trackLastLog['url'], trackLastLog['title']);
    } else{
      console.log("Current Tab URL: else");
    }
  });
}

const handleTabActivation = (activeInfo) => {
    // console.log("handleTabActivation");
    chrome.tabs.get(activeInfo.tabId, tab => {
      updateTabInfoList(tab.id, tab.url, tab.title);
    });
}

const handleTabUpdation = (tabId, changeInfo, tab) => {
    // console.log("handleTabUpdation", changeInfo);
    updateTabInfoList(tabId, tab.url, tab.title);
}

const handleIdleState = (newState) => {
    console.log("handle Idle State :", newState);
    if(newState === "locked"){
      isLocked = true;
      pauseRecording();
    } else {
      if(isLocked) {
        isLocked = false;
        startRecording();
      } 
        if(newState === "active"){
          startActiveTimer();
        }
        if(newState === "idle"){
          startIdleTimer();
        }
    }
}

const startActiveTimer = () => {
  // console.log("startActiveTimer : active_time = "+active_time+" : idle_time = "+idle_time);
  clearInterval(idle_timer);
  active_timer = setInterval(() => {
    active_time += 1;
  }, 1000); // *1000
}

const startIdleTimer = () => {
  
  clearInterval(active_timer);
  idle_timer = setInterval(() => {
    idle_time += 1;
  }, 1000); // *1000
}

const clearActiveIdleTimer = () => {
  active_time = 0; idle_time = 0;
  mousedownCount = 0, keydownCount = 0;

  clearInterval(active_timer);
  clearInterval(idle_timer);
}

// Function to update the tab information list
async function updateTabInfoList (tabId, tabUrl, tabTitle)  {

  if(tabUrl===undefined || tabUrl ===''){
    console.log("return due to tabUrl undefined or empty");
    return ;
  }

  if(tabTitle===undefined || tabTitle ===''){
    console.log("return due to tabTitle undefined or empty");
    return ;
  }


  if (track_id in trackList) {
    const logList = trackList[track_id];
    const logListLength = logList.length;

    if(logListLength!==undefined && logListLength > 1){
      const lastIndex = logListLength-1;
      const lastLog = logList[lastIndex];

      if(lastLog['title'] !== tabTitle && lastLog['url'] !== tabUrl){
        const lastLogObj = await updateEndEPoch(lastLog);
        const appLogObj = await getDefaultObj(null, tabUrl, tabTitle);
        trackList[track_id][lastIndex] = lastLogObj;
        trackList[track_id].push(appLogObj);
      }
    } else {
      const appLogObj = await getDefaultObj(null, tabUrl, tabTitle);
      trackList[track_id].push(appLogObj);
    }
    // console.log("trackList", trackList);
  } else {
    console.error("Track Id not found in Track List", track_id);
  }
}

const updateEndEPoch = async (lastLogObj) => {
  if(lastLogObj!==undefined){
    const current_time_epoch = Math.floor(Date.now() / 1000);
    const duration = current_time_epoch - lastLogObj['start_time'];
    lastLogObj['end_time'] = current_time_epoch;
    lastLogObj['active_time'] = duration - idle_time;
    lastLogObj['idle_time'] = idle_time;
    lastLogObj['duration'] = duration;

    lastLogObj['keypress'] = keydownCount;
    lastLogObj['mouse_click'] = mousedownCount;

    // console.log("duration", duration);
    // console.log("active_time", active_time);
    // console.log("idle_time", idle_time);
    // console.log("duration : ", idle_time+active_time);
    clearActiveIdleTimer();
  }
  return lastLogObj;
}

const updateTrackEndEPoch = async (trackObj) => {
  const current_time_epoch =  Math.floor(Date.now() / 1000);
  const lastLogObj = trackObj[0];
  const duration = current_time_epoch - lastLogObj['start_time'];
  let total_idle = 0, total_active =0, total_mouse =0, total_keypress =0;
  trackObj.forEach(element => {
    total_idle += element['idle_time'];
    total_active += element['active_time'];
    total_mouse += element['mouse_click'];
    total_keypress += element['keypress'];
  });
  lastLogObj['end_time'] = current_time_epoch;
  lastLogObj['active_time'] = total_active; // duration - total_idle;
  lastLogObj['idle_time'] = duration - total_active;
  lastLogObj['duration'] = duration;
  lastLogObj['keypress'] = total_keypress;
  lastLogObj['mouse_click'] = total_mouse;
  if(lastLogObj['image_data'] === null || lastLogObj['image_data'] === 'undefined'){
    const base64Data = await getImageData();
    lastLogObj['image_data'] = base64Data;
  }

  console.log("keyPress : mouseclick Count = "+mousedownCount+" : keypressCount = "+keydownCount);
  console.log("Track End : ", trackList);
  
  return lastLogObj;
}

const syncAllData = async (lastTrackId) => {
  // if(lastTrackId in trackList) {
  //   await endCurrentTrack(lastTrackId);
  // }
  
  console.log("syncAllData call");
  const track_ids = Object.keys(trackList); // Get array of trackList ids
    for (const track_id of track_ids) {
      if(trackList[track_id][0]['end_time']!==null){
          await syncDataToServer(track_id);
      } else{
        console.log("failed to sync track_id: "+track_id+" = ", trackList);
      }
    }
}

const syncDataToServer = async (trackId) => {


  if(trackId in trackList){
    const trackObj = trackList[trackId];
    console.log("sync Data To Server trackObj", trackObj);
//            delete trackList[trackId];
  }
}

const idleAutotrackerOut = async () => {
  console.log("idle_auto_po_timer :  idleAutotrackerOut called");
}

// Generate a random UUID (Universal Unique Identifier)
const generateUUID = async () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0,
        v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}