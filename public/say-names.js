const currentScript = Array.from(document.getElementsByTagName('script')).slice(-1)[0];
const urlParams = new URLSearchParams(window.location.search);
const params = {};

const welcomeMessages = [
  "has joined the space",
  "arrived",
  "is here",
  "beamed in",
  "just teleported in.",
  "has glitched into the matrix!",
  "is too late",
  "has joined. Quick, Hide your avatars.",
  "just dropped in from another dimension",
  "has entered the simulation!",
  "has logged into the mainframe!",
  "is now part of our virtual mischief",
  "just crossed the digital threshold",
  "decided to join us in the simulation.",
  "just stumbled into our virtual realm. Someone hold their hand, they look lost.",
  "is wanted in several other spaces. Take cover and shoot!",
  "is here for cuddles and milk and is all out of cuddles",
  "is here to kiss snowy butt cheeks",
  ", a real human actually joined the space. Now everyone act like a human"
];

function setOrDefault(attr, defaultValue) {
  const value = currentScript.getAttribute(attr);
  params[attr] = value || (urlParams.has(attr) ? urlParams.get(attr) : defaultValue);
}

setOrDefault("four-twenty", 'false');
setOrDefault("announce-events", 'true');
if(params["four-twenty"] === "true") {
  let keepAlive;
  function connect() {
    const ws = new WebSocket('wss://calicocut.glitch.me');
    ws.onmessage = (msg) => {
      speak(msg.data);
    };
    ws.onopen = (msg) => {
      console.log("connected to 420 announcer.");
    };
    ws.onerror = (msg) => {
      console.log("error", msg);
    };
    ws.onclose = (e) => {
      console.log('Disconnected!');
      clearInterval(keepAlive);
      setTimeout(()=>connect(), 3000);
    };
    keepAlive = setInterval(()=>{ws.send("keep-alive")}, 120000)
  }
  connect();
}

async function speak(text) {
  console.log("saying:", text);
  const welcome = await fetch('https://say-something.glitch.me/say/' + text);
  const url = await welcome.text();
  let audio = new Audio("data:audio/mpeg;base64," + url);
  audio.autoplay = true;
  audio.play();
  audio.volume = 0.08;
}

function loop(interval, callback) {
  let readyToTrigger;
  const _loop = () => {
    let nowInMs = new Date().getTime();
    let timeSinceLast = nowInMs / 1000 - Math.floor( nowInMs / (interval * 1000)) * interval;
    if(timeSinceLast > interval - 1 && !readyToTrigger) {
        readyToTrigger = true;
    }
    if(timeSinceLast < 1 && readyToTrigger) {
        readyToTrigger = false;
        callback();
    }
  };
  setInterval(_loop, 800);
  _loop();
}

const now = Date.now();
window.userJoinedCallback = async user => {
  const _now = Date.now();
  if(_now - now > 10000) {
    const name = (user.name ? user.name : user.id.substr(0, 6));
    let randomWelcomeMessage = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
    const time = 1000 * 60 * 10;
    const remainder = _now % time;
    for(let i = 0; i < welcomeMessages.length; i++) {
      if(remainder / time < (i+1) / welcomeMessages.length) {
        randomWelcomeMessage = welcomeMessages[i];
        break;
      }
    }
    const message = name + " " + randomWelcomeMessage; 
    await speak(message);
  }
}
if(params["announce-events"] === "true") {
  let lastEventsId = 0;
  loop(20, async () => {
    let event = await (await fetch("https://api.sidequestvr.com/v2/events?limit=1")).json();
    if(event.length) {
      const difference = Math.abs(new Date(event[0].start_time) - new Date());
      if(difference < 60 * 1000 && lastEventsId !== event[0].events_v2_id) {
        lastEventsId = event[0].events_v2_id;
        await speak(event[0].name + ", event starting now!");
      }
    }
  })
}
