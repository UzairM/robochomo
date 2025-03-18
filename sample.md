
<html>

<head>
  <script src="./Ohmni-standalone.js"></script>
  <script type="text/javascript" src="https://www.youtube.com/player_api" async defer></script>
  <meta charset="utf-8" />
</head>

<body onload="onLoad()">
<h3>Ohmni API test</h3>

<div style="text-align:center; padding-top: 25px">
  <iframe id="player" width="400" height="200" src="https://www.youtube.com/embed/vmDDOFXSgAs?enablejsapi=1&autoplay=1" frameborder="0" allowfullscreen></iframe>
  <br>
  <button onclick="move()">Move back</button>
  <button onclick="chineseSpeech()">Chinese Speech</button>
  <button onclick="nod()">Nod</button>
  <button onclick="praise()">Praise</button>
  <button onclick="requestBotInfo()">Get bot info</button>
</div>

<div id="bot_info" style="display: none;">
  <div>
    <span>Name: </span>
    <spand id="bot_name"></spand>
  </div>
  <div>
    <span>Bot ID: </span>
    <spand id="bot_id"></spand>
  </div>
  <div>
    <span>Version: </span>
    <spand id="bot_version"></spand>
  </div>
  <div>
    <span>Serial: </span>
    <spand id="serial"></spand>
  </div>
  <div style="width: 60%;">
    <label>Wifi info</label>
    <table class="table--wifi-info">
      <tbody>
        <tr>
          <td>SSID</td>
          <td id="wifi_ssid"></td>
        </tr>
        <tr>
          <td>BSSID</td>
          <td id="wifi_bssid"></td>
        </tr>
        <tr>
          <td>Ip Address</td>
          <td id="wifi_ip"></td>
        </tr>
        <tr>
          <td>Frequency</td>
          <td id="wifi_frequency"></td>
        </tr>
        <tr>
          <td>RSSI</td>
          <td id ="wifi_rssi"></td>
        </tr>
        <tr>
          <td>Speed</td>
          <td id ="wifi_speed"></td>
        </tr>
      </tbody>
    </table>
  </div>
  <div id="share_links"></div>
</div>
<style>
button {
  min-width: 200px;
  min-height: 200px;
}
</style>

</body>

<script>
console.log("Ohmni here:", Ohmni)
// Convenience helpers

function wait(cb, ms) {
  setTimeout(function(){ cb(); }, ms);
}

var lhue = 0;

// Set up the beat here
function upbeat() {

  Ohmni.setNeckPosition(550, 140);
  wait(function(){
    downbeat();
  }, 1000);

}

// Set up the beat here
function downbeat() {

  // Change light on every downbeat
  Ohmni.setLightColor(lhue, 230, 100);
  lhue += 20;
  if (lhue > 255) lhue -= 256;

  // Perform upbeat next
  Ohmni.setNeckPosition(350, 80);
  wait(function(){
    upbeat();
  }, 500);

}

function onLoad() {
  hideBotInfo();
}

var player = null;
function onYouTubePlayerAPIReady() {
  console.log("Player ready!");
  player = new YT.Player('player', {
    events: {
      'onReady': onPlayerReady,
      'onStateChange': onPlayerStateChange
    }
  });
}

//function onPlayerReady(event) {
//  console.log("Player is ready.");

 // Ohmni.setSpeechLanguage("zh-TW");
 // Ohmni.say("你好");

//  Ohmni.setSpeechLanguage("en-US");
//  Ohmni.say("Meo ready!", function(){

//    Ohmni.setLightColor(30,230,100);
//  });

//}
function chineseSpeech() {
  Ohmni.setSpeechLanguage("zh-TW");
  Ohmni.say("你好");
}

function onPlayerStateChange(event) {
  console.log("Player state change.");
}

// Run a phase sequence
function run_phases(phasearr, idx) {

  // Check if we have something to do
  if (idx >= phasearr.length) return;

  // Get and run the function with a callback to trigger next phase
  var self = this;
  var fn = phasearr[idx];
  fn(function(){
    setTimeout(function(){
      self.run_phases(phasearr, idx+1);
    }, 1);
  });

};

// Wait and then trigger callback
function wait(cb, time) {
  setTimeout(function() {
    cb();
  }, time);
}

function move() {
  var phases = [
    function(cb) {
      Ohmni.move(-100, 100, 2000);
      wait(cb, 2000);
    },
  ];
  run_phases(phases, 0);
}

function praise() {
  Ohmni.say("Meo is cool!", function(){
    Ohmni.say("Praise Callback");
  });
}

function requestBotInfo() {
  Ohmni.requestBotInfo();
}

function cbRequestBotInfo(data) {
  console.log('cbRequestBotInfo', data)
  showBotInfo(data);
}

function showBotInfo(data) {
  const dataObject = JSON.parse(data);

  document.querySelector("#bot_info").style.display = "block";
  document.getElementById("bot_name").innerHTML = dataObject.name;
  document.getElementById("bot_id").innerHTML = dataObject.botId;
  document.getElementById("bot_version").innerHTML = dataObject.version;
  document.getElementById("wifi_ssid").innerHTML = dataObject.wifi.ssid;
  document.getElementById("wifi_bssid").innerHTML = dataObject.wifi.bssid;
  document.getElementById("wifi_ip").innerHTML = intToIPV4(dataObject.wifi.ip);
  document.getElementById("wifi_frequency").innerHTML = dataObject.wifi.freq + " MHz";
  document.getElementById("wifi_rssi").innerHTML = dataObject.wifi.rssi + " dBm";
  document.getElementById("wifi_speed").innerHTML = dataObject.wifi.speed + " Mbps";
  document.getElementById("serial").innerHTML = dataObject.serial;

  const shareLinksNode = document.querySelector("#share_links");
  // remove all element
  while (shareLinksNode.firstChild) {
    shareLinksNode.removeChild(shareLinksNode.firstChild);
  }
  const shareLinksElements = Object.keys(dataObject.shareLinks).forEach(element => {
    const shareLink = document.createElement("p");
    const shareLinkNode = document.createTextNode(`Share link : app.ohmnilabs.com/share/${element}`);
    shareLink.appendChild(shareLinkNode);
    shareLinksNode.appendChild(shareLink);
  });
}

function hideBotInfo() {
  document.querySelector("#bot_info").style.display = "none";
}

const intToIPV4 = num => {
  const part1 = num & 255;
  const part2 = (num >> 8) & 255;
  const part3 = (num >> 16) & 255;
  const part4 = (num >> 24) & 255;
  return `${part1}.${part2}.${part3}.${part4}`;
};

function nod() {
  var phases = [
    function(cb) {
      Ohmni.say("Nodding.");
      wait(cb, 800);
    },
    function(cb) {
      Ohmni.setNeckTorqueEnabled(1);
      wait(cb, 800);
    },
    function(cb) {
      Ohmni.setNeckPosition(600, 100);
      wait(cb, 2000);
    },
    function(cb) {
      Ohmni.setNeckPosition(250, 100);
      wait(cb, 2000);
    },
    function(cb) {
      Ohmni.setNeckTorqueEnabled(0);
      wait(cb, 1);
    },
  ];
  run_phases(phases, 0);
}

/*
setTimeout(function(){
  Ohmni.setLightColor(30,230,0);
  Ohmni.setNeckTorqueEnabled(1);
  Ohmni.setNeckPosition(650, 240);

},500);

setTimeout(function(){
  upbeat();
}, 2000);
*/

</script>

</html>
