const KEY="miloTrainerProV3";
let previous=JSON.parse(localStorage.getItem("miloTrainerProV2")||localStorage.getItem("miloCalm90DataV1")||"null");
let state=JSON.parse(localStorage.getItem(KEY)||"null") || previous || {};
if(!state.currentDay)state.currentDay=1;
if(!state.days)state.days={};
if(!state.repeats)state.repeats={};
let timer=null,timerSeconds=420,deferredPrompt=null;

const BADGES=[
{id:"first",icon:"🌟",name:"First Session",desc:"Complete one day at 80%+"},
{id:"week",icon:"🔥",name:"7 Day Streak",desc:"Seven days completed"},
{id:"door",icon:"🔔",name:"Door Progress",desc:"Three low-intensity door logs"},
{id:"car",icon:"🚗",name:"Silent Parking",desc:"One parking log at 0 intensity"},
{id:"dog",icon:"🐕",name:"Dog Neutral",desc:"Three dog logs intensity 0–2"},
{id:"visitor",icon:"👋",name:"Guest Calm",desc:"Visitor log intensity 0–2"},
{id:"half",icon:"🏅",name:"Halfway",desc:"Reach day 45"},
{id:"grad",icon:"🏆",name:"Graduate",desc:"Complete day 90"}
];

function day(n){if(!state.days[n])state.days[n]={checked:{},notes:"",triggers:[],dogDistance:"",doorbellResult:"",saved:false};return state.days[n];}
function save(){localStorage.setItem(KEY,JSON.stringify(state));}
function toast(msg){let t=document.getElementById("toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),1700);}
function pct(n){const p=PROGRAMME[n-1];if(!p)return 0;const d=day(n);let total=0,done=0;p.sessions.forEach((s,si)=>s.tasks.forEach((_,ti)=>{total++;if(d.checked[`${si}-${ti}`])done++;}));return total?Math.round(done/total*100):0;}
function avg(n){const logs=day(n).triggers;if(!logs.length)return null;return logs.reduce((a,b)=>a+Number(b.intensity),0)/logs.length;}
function completeDays(){let c=0;for(let i=1;i<=90;i++)if(pct(i)>=80)c++;return c;}
function streak(){let cur=0,best=0;for(let i=1;i<=90;i++){if(pct(i)>=80){cur++;best=Math.max(best,cur)}else if(i<state.currentDay){cur=0}}return best;}
function overall(){let s=0;for(let i=1;i<=90;i++)s+=pct(i);return Math.round(s/90);}
function logs(){let a=[];for(let i=1;i<=90;i++)a.push(...day(i).triggers.map(t=>({...t,day:i})));return a;}
function calm(){let values=[];for(let i=1;i<=90;i++){let x=avg(i);if(x!==null)values.push(x)}if(!values.length)return "—";let a=values.reduce((p,c)=>p+c,0)/values.length;return Math.max(0,Math.round(100-(a/5*100)));}
function unlocked(){let l=logs(),u=new Set();if(completeDays()>=1)u.add("first");if(streak()>=7)u.add("week");if(l.filter(x=>x.type==="Doorbell / knock"&&+x.intensity<=2).length>=3)u.add("door");if(l.some(x=>x.type==="Parking the car"&&+x.intensity===0))u.add("car");if(l.filter(x=>x.type==="Other dog"&&+x.intensity<=2).length>=3)u.add("dog");if(l.some(x=>x.type==="Visitor arriving"&&+x.intensity<=2))u.add("visitor");if(state.currentDay>=45)u.add("half");if(pct(90)>=80)u.add("grad");return u;}
function coach(){let p=pct(state.currentDay),a=avg(state.currentDay);if(p<50)return"Keep today tiny. One calm 5-minute win is better than pushing Milo over threshold.";if(a!==null&&a>=4)return"Milo went over threshold. Tomorrow should be easier: more distance, lower sound, shorter exposure, faster rewards.";if(a!==null&&a>=3)return"Repeat this lesson once before making it harder. You are close, but not ready to increase difficulty.";if(p>=80&&(a===null||a<=2))return"Good signal. Progress tomorrow, but only increase one thing: volume, distance, duration, or realism.";return"Reward the calm moment before barking. Calm choices are what we are building.";}
function render(){
state.currentDay=Math.max(1,Math.min(90,state.currentDay));let n=state.currentDay,p=PROGRAMME[n-1],d=day(n);
let h=new Date().getHours();document.getElementById("greeting").textContent=h<12?"Good morning, Kasper":h<18?"Good afternoon, Kasper":"Good evening, Kasper";
document.getElementById("phase").textContent=p.phase;document.getElementById("dayTitle").textContent=`Day ${n} / 90`;document.getElementById("target").textContent=p.target;
let percent=pct(n);document.getElementById("todayPercent").textContent=percent+"%";document.querySelector(".orb").style.setProperty("--p",percent+"%");
document.getElementById("streak").textContent=streak();document.getElementById("overall").textContent=overall()+"%";document.getElementById("calmScore").textContent=calm();
let u=unlocked();document.getElementById("badgeCount").textContent=u.size;document.getElementById("coachAdvice").textContent=coach();
let box=document.getElementById("sessions");box.innerHTML="";
p.sessions.forEach((s,si)=>{let div=document.createElement("div");div.className="session";div.innerHTML=`<h4>${s.title}</h4><p class="purpose">${s.purpose}</p><ol class="steps">${s.steps.map(x=>`<li>${x}</li>`).join("")}</ol>`;s.tasks.forEach((task,ti)=>{let key=`${si}-${ti}`;let lab=document.createElement("label");lab.className="task";lab.innerHTML=`<input type="checkbox" ${d.checked[key]?"checked":""}><span>${task}</span>`;lab.querySelector("input").onchange=e=>{d.checked[key]=e.target.checked;save();render();if(e.target.checked)toast("Logged for Milo")};div.appendChild(lab)});box.appendChild(div)});
document.getElementById("dailyNotes").value=d.notes||"";document.getElementById("dogDistance").value=d.dogDistance||"";document.getElementById("doorbellResult").value=d.doorbellResult||"";
let a=avg(n),advice="Progress tomorrow if today is 80%+ complete and barking stayed 0–2.";if(percent<80)advice="Repeat this day. High-end training means high success, not rushing.";if(a!==null&&a>=3)advice="Tomorrow: lower difficulty. More distance, quieter sound, shorter exposure.";if(percent>=80&&(a===null||a<3))advice="Good day. Progress tomorrow and increase only one variable.";document.getElementById("advice").textContent=advice;
let tl=document.getElementById("triggerList");tl.innerHTML="";[...d.triggers].reverse().forEach(t=>{let item=document.createElement("div");item.className="log-item";item.innerHTML=`<strong>${t.type}</strong> · intensity ${t.intensity}/5<br>${t.note||""}<br><small>${t.time}</small>`;tl.appendChild(item)});
renderBadges();renderBars();save();
}
function renderBadges(){let u=unlocked(),b=document.getElementById("badges");b.innerHTML="";BADGES.forEach(x=>{let e=document.createElement("div");e.className="badge "+(u.has(x.id)?"unlocked":"");e.innerHTML=`<strong>${x.icon} ${x.name}</strong><span>${x.desc}</span>`;b.appendChild(e)})}
function renderBars(){let areas=["Doorbell / knock","Visitor arriving","Parking the car","Other dog"],b=document.getElementById("bars");b.innerHTML="";areas.forEach(area=>{let entries=[];for(let i=1;i<=90;i++)entries.push(...day(i).triggers.filter(t=>t.type===area).map(t=>+t.intensity));let score=entries.length?Math.round(100-(entries.reduce((a,c)=>a+c,0)/entries.length)/5*100):0;let w=document.createElement("div");w.className="bar-wrap";w.innerHTML=`<div class="bar-label"><span>${area}</span><span>${entries.length?score+"% calm":"no data"}</span></div><div class="bar"><span style="width:${score}%"></span></div>`;b.appendChild(w)})}
function openSession(){let s=PROGRAMME[state.currentDay-1].sessions[0];document.getElementById("modalTitle").textContent=s.title;document.getElementById("modalPurpose").textContent=s.purpose;document.getElementById("modalSteps").innerHTML=s.steps.map(x=>`<li>${x}</li>`).join("");timerSeconds=420;updateTimer();document.getElementById("sessionModal").showModal()}
function updateTimer(){document.getElementById("timerText").textContent=`${String(Math.floor(timerSeconds/60)).padStart(2,"0")}:${String(timerSeconds%60).padStart(2,"0")}`}
document.getElementById("startSession").onclick=openSession;document.getElementById("closeModal").onclick=()=>document.getElementById("sessionModal").close();
document.getElementById("timerStart").onclick=()=>{clearInterval(timer);timer=setInterval(()=>{timerSeconds=Math.max(0,timerSeconds-1);updateTimer();if(timerSeconds===0){clearInterval(timer);toast("Timer done")}},1000)};
document.getElementById("timerReset").onclick=()=>{clearInterval(timer);timerSeconds=420;updateTimer()};
document.getElementById("completeSession").onclick=()=>{let d=day(state.currentDay),p=PROGRAMME[state.currentDay-1];p.sessions[0].tasks.forEach((_,ti)=>d.checked[`0-${ti}`]=true);save();document.getElementById("sessionModal").close();render();toast("Session complete")};
document.querySelectorAll(".quick button").forEach(b=>b.onclick=()=>{document.getElementById("triggerType").value=b.dataset.trigger;toast(b.dataset.trigger)});
document.getElementById("addTrigger").onclick=()=>{let d=day(state.currentDay);d.triggers.push({type:document.getElementById("triggerType").value,intensity:document.getElementById("intensity").value,note:document.getElementById("triggerNote").value,time:new Date().toLocaleString()});document.getElementById("triggerNote").value="";save();render();toast("Trigger logged")};
["dailyNotes","dogDistance","doorbellResult"].forEach(id=>document.getElementById(id).addEventListener("input",e=>{day(state.currentDay)[id==="dailyNotes"?"notes":id]=e.target.value;save()}));
document.getElementById("saveDay").onclick=()=>{day(state.currentDay).saved=true;save();toast("Day saved")};
document.getElementById("nextDay").onclick=()=>{state.currentDay=Math.min(90,state.currentDay+1);render();scrollTo(0,0)};
document.getElementById("prevDay").onclick=()=>{state.currentDay=Math.max(1,state.currentDay-1);render();scrollTo(0,0)};
document.getElementById("repeatDay").onclick=()=>{state.repeats[state.currentDay]=(state.repeats[state.currentDay]||0)+1;save();toast("Repeat noted")};
document.getElementById("jumpToday").onclick=()=>{let first=1;for(let i=1;i<=90;i++){if(pct(i)<80){first=i;break}}state.currentDay=first;render();scrollTo(0,0)};
document.querySelectorAll(".tabs button").forEach(b=>b.onclick=()=>{state.currentDay=+b.dataset.jump;render();scrollTo(0,0)});
document.getElementById("exportBtn").onclick=()=>{let blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="milo-trainer-pro-v3-backup.json";a.click();URL.revokeObjectURL(url)};
document.getElementById("resetBtn").onclick=()=>{if(confirm("Reset all app data on this device?")){localStorage.removeItem(KEY);location.reload()}};
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredPrompt=e;document.getElementById("installBtn").classList.remove("hidden")});
document.getElementById("installBtn").onclick=()=>{if(deferredPrompt){deferredPrompt.prompt();deferredPrompt=null}};
if("serviceWorker"in navigator)navigator.serviceWorker.register("sw.js").catch(()=>{});
render();
