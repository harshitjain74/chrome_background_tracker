// Listen for mouse click event
document.addEventListener("mousedown", function(event) {
  try{
      chrome.runtime.sendMessage({ event: "mousedown" , data:event});
  } catch(e){
      console.error('Error handling mousedown:', e);
  } 
});

// Listen for key press event
document.addEventListener("keydown", function(event) {
  try{
      chrome.runtime.sendMessage({ event: "keydown", data:event});
  } catch(e){
      console.error('Error handling keypress:', e);
  }
});