const screenPath = '../../screens/';
const loginPage = 'login';
const dashboardPage = 'dashboard';

const deviceIdL = 'deviceId';
const loginLJSON = 'loginJSON';
const baseUrl = 'https://abc.com/'
const version = "Version 1.0";

// Function to load a page into the container
function loadPage(page) {
  showLoader();
  // Fetch the page content using fetch or XMLHttpRequest
  fetch(screenPath+page+'.html')
      .then(response => response.text())
      .then(data => {
          hideLoader();
          // Set the innerHTML of the container to the loaded page content
        //   removeJS();
          removeCss();

          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = 'assets/css/style.css';
          document.head.appendChild(link);

          const link2 = document.createElement('link');
          link2.rel = 'stylesheet';
          link2.href = 'assets/css/'+page+'.css';
          document.head.appendChild(link2);

          const contentDiv = document.getElementById('content');
          contentDiv.innerHTML = data;
          // document.body.innerHTML = data + ``;

          const script2 = document.createElement('script');
          script2.src = 'assets/js/'+page+'.js';
          script2.defer = true;
          document.body.appendChild(script2);
      })
      .catch(error => {
        hideLoader();
          console.error('Error loading page:', error);
      });
}

function logout(){
  localStorage.clear(); //all items
  loadPage(loginPage);
  // keycloak.logout();
}

// Initial page load (e.gs., login page)
function intiCheck(){
//  const loginStr = getLocalData(loginLJSON);
//  if(loginStr!==null && loginStr!==""){
    loadPage(dashboardPage);
//  } else{
//    logout();
//  }
}

(()=>{ intiCheck(); })();