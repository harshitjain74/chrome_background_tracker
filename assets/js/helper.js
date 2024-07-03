
// Helper Functions code : Start
var request = new XMLHttpRequest();
request.withCredentials = false;
const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
const tokenKey = "access_token";
const refTokenKey = "refresh_token";

// common API request method.
async function fetchRequest(requestUrl, method, headers = {}, body = null, responseCallBack, isReturnResponse = false){
    showLoader();


    const header = {
        'timezone': timezone,
        'Content-Type': 'application/json'
    }
    if(tokenKey){
      header['Authorization'] = 'Bearer '+tokenKey;
    }

    fetch(baseUrl+requestUrl, {
        method: method,
        body: body,
        headers: { ...header, ...headers },
        credentials: 'omit' // Do not include cookies
    }).then( async response => {
      hideLoader();
      console.log("response :- "+requestUrl);
        if (response.ok) {
          if(isReturnResponse){
            var headersObj = {};
            response.headers.forEach((value, name) => {
                headersObj[name] = value;
            });
            return response.json().then(data => {return {
              "status": response.status,
              "body": data,
              "headers": headersObj
            }});
          }

          return response.text();
        } else if(response.status === 401 || response.status === 403){
            showToast('Unauthorized : Operation Failed!', true);
            logout();
            if(isReturnResponse){
              return {
                "status": false,
                "statusCode": response.status
              };
            }
            return '{"status": false, "statusCode": response.status}';
        } else {
          throw new Error('Network response was not ok.');
        }
    })
    .then(data => {
        // console.log(data);
        responseCallBack(data);
    })
    .catch(error => {
      hideLoader();
      showToast('Operation Failed: '+error, true);
        console.error('There was a problem with the fetch operation:', error);
    });
}

function registerDevice(){
  var uuid = '';
  // Check if the extension has a stored UUID
  chrome.storage.local.get('uuid', function(data) {
      if (!data.uuid) {
      var uuid = generateUUID();
      chrome.storage.local.set({ 'uuid': uuid }, function() {
          uuid = uuid;
      });
      } else {
          uuid = data.uuid;
      }
  });

  var deviceParam = {
      'uuid': uuid,
  }
  fetchRequest("register_device", 'Post', {}, JSON.stringify(deviceParam), function(data){
      const parseData = JSON.parse(data);
      if(parseData){
        const deviceId = parseData['id'];
        localStorage.setItem(deviceIdL, deviceId);
    }
  });
}

async function getToken(){
  await getData(tokenKey, function(data){
    // console.log('Retrieved data for token1:', data);
  });
  return ;
}

function removeCss(){
  var tags = document.getElementsByTagName('link');
  for (var i = tags.length; i >= 0; i--){ //search backwards within nodelist for matching elements to remove
   if (tags[i] && tags[i].getAttribute('href') != null) //&& tags[i].getAttribute('src').indexOf(filename) != -1)
    tags[i].parentNode.removeChild(tags[i]); //remove element by calling parentNode.removeChild()
  }
}

function hasClass(el, className)
{
  if (el.classList)
      return el.classList.contains(className);
  return !!el.className.match(new RegExp('(\\s|^)' + className + '(\\s|$)'));
}

function addClass(el, className)
{
  if (el.classList)
      el.classList.add(className)
  else if (!hasClass(el, className))
      el.className += " " + className;
}

function removeClass(el, className)
{
  if (el.classList)
      el.classList.remove(className)
  else if (hasClass(el, className))
  {
      var reg = new RegExp('(\\s|^)' + className + '(\\s|$)');
      el.className = el.className.replace(reg, ' ');
  }
}

function convertSecondsToHMS(seconds) {
  var hours = Math.floor(seconds / 3600);
  var minutes = Math.floor((seconds % 3600) / 60);
  var seconds = Math.floor(seconds % 60);

  var result = (hours < 10 ? "0" : "") + hours + ":" + (minutes < 10 ? "0" : "") + minutes + ":" + (seconds < 10 ? "0" : "") + seconds;

  return result;
}

// Generate a random UUID (Universal Unique Identifier)
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0,
        v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function getCurrentDate(){
  var date = new Date();
  return date.toISOString(); //"2011-12-19T15:28:46.493Z"
}

function showLoader(){
  const loader = document.getElementById('loaderOverlay');
  loader.classList.remove('hidden');
  // loader.classList.add('visible');
}

function hideLoader(){
  const loader = document.getElementById('loaderOverlay');
  // loader.classList.remove('visible');
  loader.classList.add('hidden');
}

function showElement(id){
  const loader = document.getElementById(id);
  loader.classList.remove('hidden');
  loader.classList.add('visible');
}

function hideElement(id){
  const loader = document.getElementById(id);
  loader.classList.remove('visible');
  loader.classList.add('hidden');
}

function showToast(message, isError = false) {
  const toast = document.getElementById('toast');
  toast.className = 'show';
  toast.textContent = message;
  toast.style.backgroundColor = isError ? '#e74c3c' : '#2ecc71'; // red for error, green for success

  setTimeout(() => {
    toast.className = toast.className.replace('show', '');
  }, 3000);
}

// Function to save data with dynamic key
function storeMultiData(pairs) {
  let data = {};
  for (let key in pairs) {
    if (pairs.hasOwnProperty(key)) {
      data[key] = pairs[key];
    }
  }
  chrome.storage.local.set(data, function() {
    console.log('Multiple key-value pairs saved:', data);
  });
}

async function saveData(key, value) {
  let data = {};
  data[key] = value;
  await chrome.storage.local.set(data, function() {
    // console.log(`Data saved: ${key} = ${value}`);
  });
}

// Function to retrieve data by key
async function getData(key, callback) {
  await chrome.storage.local.get(key, function(result) {
    // console.log(`Data retrieved for ${key}:`, result[key]);
    if (callback) callback(result[key]);
  });
}

function getLocalData(key, isParse = true){
  if(isParse){
    return JSON.parse(localStorage.getItem(key))
  }
  return localStorage.getItem(key);
}