const KEY="miloTrainerProV2";
let old=JSON.parse(localStorage.getItem("miloCalm90DataV1")||"null");
let state=JSON.parse(localStorage.getItem(KEY)||"null") || old || {};
if(!state.currentDay) state.currentDay=1;
if(!state.days) state.days={};
if(!state.repeats) state.repeats={};
let selectedQuickTrigger="Doorbell / knock";
let timer=null,timerSeconds=7*60,deferredPrompt=null;

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

function d(n){if(!state.days[n])state.days[n]={checked:{},notes:"",triggers:[],dogDistance:"",doorbellResult:"",saved:false};return state.days[n];}
function save(){localStorage.setItem(KEY,JSON.stringify(state));}
function toast(msg){const t=document.getElementById("toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),1800);}
function pct(n){const p=PROGRAMME[n-1]; if(!p) return 0; const day=d(n); let total=0,done=0; p.sessions.forEach((s,si)=>s.tasks.forEach((_,ti)=>{total++; if(day.checked[`${si}-${ti}`])done++;})); return total?Math.round(done/total*100):0;}
function avgIntensity(n){const logs=d(n).triggers;if(!logs.length)return null;return logs.reduce((a,b)=>a+Number(b.intensity),0)/logs.length;}
function completedDays(){let c=0;for(let i=1;i<=90;i++)if(pct(i)>=80)c++;return c;}
function streak(){let s=0,best=0;for(let i=1;i<=90;i++){if(pct(i)>=80){s++;best=Math.max(best,s)}else if(i<state.currentDay)s=0;}return best;}
function overall(){return Math.round(Array.from({length:90},(_,i)=>pct(i+1)).reduce((a,b)=>a+b,0)/90);}
function calmScore(){let vals=[];for(let i=1;i<=90;i++){let a=avgIntensity(i);if(a!==null)vals.push(a)}if(!vals.length)return "—";let avg=vals.reduce((a,b)=>a+b,0)/vals.length;return Math.max(0,Math.round(100-(avg/5*100)));}
function allLogs(){let arr=[];for(let i=1;i<=90;i++) arr.push(...d(i).triggers.map(x=>({...x,day:i}))); return arr;}
function unlocked(){
 const logs=allLogs(), set=new Set();
 if(completedDays()>=1)set.add("first");
 if(streak()>=7)set.add("week");
 if(logs.filter(x=>x.type==="Doorbell / knock"&&Number(x.intensity)<=2).length>=3)set.add("door");
 if(logs.some(x=>x.type==="Parking the car"&&Number(x.intensity)===0))set.add("car");
 if(logs.filter(x=>x.type==="Other dog"&&Number(x.intensity)<=2).length>=3)set.add("dog");
 if(logs.some(x=>x.type==="Visitor arriving"&&Number(x.intensity)<=2))set.add("visitor");
 if(state.currentDay>=45)set.add("half");
 if(pct(90)>=80)set.add("grad");
 return set;
}
function coach(){
 const n=state.currentDay, p=pct(n), a=avgIntensity(n), logs=d(n).triggers;
 if(p<50) return "Keep it tiny today. One clean 5-minute session beats a long messy one.";
 if(a!==null && a>=4) return "Milo went over threshold. Tomorrow should be easier: more distance, lower volume, shorter exposure, and faster rewards.";
 if(a!==null && a>=3) return "Borderline day. Repeat this lesson once more before increasing difficulty.";
 if(p>=80 && (a===null || a<=2)) return "Good training signal. Progress tomorrow, but only increase one thing: volume, distance, duration, or realism.";
 if(logs.length===0 && p>=80) return "Training done, but add a trigger note if anything happened in real life. That makes the progress graphs useful.";
 return "You’re building emotional regulation. Reward the quiet moment before barking, not just the silence after.";
}
function render(){
 const n=Math.max(1,Math.min(90,state.currentDay)); state.currentDay=n; const p=PROGRAMME[n-1], day=d(n);
 document.getElementById("greeting").textContent = new Date().getHours()<12 ? "Good morning, Kasper" : new Date().getHours()<18 ? "Good afternoon, Kasper" : "Good evening, Kasper";
 document.getElementById("phase").textContent=p.phase;
 document.getElementById("dayTitle").textContent=`Day ${p.day} / 90`;
 document.getElementById("target").textContent=p.target;
 let percent=pct(n); document.getElementById("todayPercent").textContent=percent+"%"; document.querySelector(".progress-orb").style.setProperty("--p",percent+"%");
 document.getElementById("streak").textContent=streak();
 document.getElementById("overall").textContent=overall()+"%";
 document.getElementById("calmScore").textContent=calmScore();
 document.getElementById("coachAdvice").textContent=coach();
 const u=unlocked(); document.getElementById("badgeCount").textContent=u.size;
 const sessions=document.getElementById("sessions"); sessions.innerHTML="";
 p.sessions.forEach((s,si)=>{
  const div=document.createElement("div"); div.className="session";
  div.innerHTML=`<h4>${s.title}</h4><p class="purpose">${s.purpose}</p><ol class="steps">${s.steps.map(x=>`<li>${x}</li>`).join("")}</ol>`;
  s.tasks.forEach((task,ti)=>{
   const key=`${si}-${ti}`; const lab=document.createElement("label"); lab.className="task";
   lab.innerHTML=`<input type="checkbox" ${day.checked[key]?"checked":""}> <span>${task}</span>`;
   lab.querySelector("input").addEventListener("change",e=>{day.checked[key]=e.target.checked; save(); render(); if(e.target.checked) toast("Nice. Logged for Milo.");});
   div.appendChild(lab);
  });
  sessions.appendChild(div);
 });
 document.getElementById("dailyNotes").value=day.notes||"";
 document.getElementById("dogDistance").value=day.dogDistance||"";
 document.getElementById("doorbellResult").value=day.doorbellResult||"";
 let advice="Progress tomorrow if today is 80%+ complete and barking stayed 0–2.";
 const a=avgIntensity(n);
 if(percent<80) advice="Repeat this day. Top-tier training means high success, not rushing.";
 if(a!==null&&a>=3) advice="Tomorrow: lower difficulty. More distance, quieter sound, shorter visitor/car/dog exposure.";
 if(percent>=80&&(a===null||a<3)) advice="Good day. Progress tomorrow and increase only one variable.";
 document.getElementById("advice").textContent=advice;
 const tl=document.getElementById("triggerList"); tl.innerHTML="";
 [...day.triggers].reverse().forEach(t=>{const item=document.createElement("div"); item.className="log-item"; item.innerHTML=`<strong>${t.type}</strong> · intensity ${t.intensity}/5<br>${t.note||""}<br><small>${t.time}</small>`; tl.appendChild(item);});
 renderBadges(); renderBars(); save();
}
function renderBadges(){const got=unlocked(), b=document.getElementById("badges"); b.innerHTML=""; BADGES.forEach(x=>{const div=document.createElement("div"); div.className="badge "+(got.has(x.id)?"unlocked":""); div.innerHTML=`<strong>${x.icon} ${x.name}</strong><span>${x.desc}</span>`; b.appendChild(div);});}
function renderBars(){const areas=["Doorbell / knock","Visitor arriving","Parking the car","Other dog"]; const bars=document.getElementById("bars"); bars.innerHTML=""; areas.forEach(area=>{let entries=[];for(let i=1;i<=90;i++)entries.push(...d(i).triggers.filter(t=>t.type===area).map(t=>Number(t.intensity)));let score=entries.length?Math.round(100-(entries.reduce((a,b)=>a+b,0)/entries.length)/5*100):0;let wrap=document.createElement("div");wrap.className="bar-wrap";wrap.innerHTML=`<div class="bar-label"><span>${area}</span><span>${entries.length?score+"% calm":"no data"}</span></div><div class="bar"><span style="width:${score}%"></span></div>`;bars.appendChild(wrap);});}
function openSession(){const p=PROGRAMME[state.currentDay-1]; const s=p.sessions[0]; document.getElementById("modalTitle").textContent=s.title; document.getElementById("modalPurpose").textContent=s.purpose; document.getElementById("modalSteps").innerHTML=s.steps.map(x=>`<li>${x}</li>`).join(""); timerSeconds=7*60; updateTimer(); document.getElementById("sessionModal").showModal();}
function updateTimer(){let m=String(Math.floor(timerSeconds/60)).padStart(2,"0"), sec=String(timerSeconds%60).padStart(2,"0");document.getElementById("timerText").textContent=`${m}:${sec}`;}
document.getElementById("startSession").onclick=openSession;
document.getElementById("closeModal").onclick=()=>document.getElementById("sessionModal").close();
document.getElementById("timerStart").onclick=()=>{clearInterval(timer);timer=setInterval(()=>{timerSeconds=Math.max(0,timerSeconds-1);updateTimer();if(timerSeconds===0){clearInterval(timer);toast("Session timer done.");}},1000);}
document.getElementById("timerReset").onclick=()=>{clearInterval(timer);timerSeconds=7*60;updateTimer();}
document.getElementById("completeSession").onclick=()=>{const day=d(state.currentDay); const p=PROGRAMME[state.currentDay-1]; p.sessions[0].tasks.forEach((_,ti)=>day.checked[`0-${ti}`]=true); save(); document.getElementById("sessionModal").close(); render(); toast("First session complete.");}
document.querySelectorAll(".quick-grid button").forEach(b=>b.onclick=()=>{selectedQuickTrigger=b.dataset.trigger;document.getElementById("triggerType").value=selectedQuickTrigger;toast(selectedQuickTrigger+" selected");});
document.getElementById("addTrigger").onclick=()=>{const day=d(state.currentDay);day.triggers.push({type:document.getElementById("triggerType").value,intensity:document.getElementById("intensity").value,note:document.getElementById("triggerNote").value,time:new Date().toLocaleString()});document.getElementById("triggerNote").value="";save();render();toast("Trigger logged.");}
["dailyNotes","dogDistance","doorbellResult"].forEach(id=>document.getElementById(id).addEventListener("input",e=>{d(state.currentDay)[id==="dailyNotes"?"notes":id]=e.target.value;save();}));
document.getElementById("saveDay").onclick=()=>{d(state.currentDay).saved=true;save();toast("Day saved.");}
document.getElementById("nextDay").onclick=()=>{state.currentDay=Math.min(90,state.currentDay+1);render();scrollTo(0,0);}
document.getElementById("prevDay").onclick=()=>{state.currentDay=Math.max(1,state.currentDay-1);render();scrollTo(0,0);}
document.getElementById("repeatDay").onclick=()=>{state.repeats[state.currentDay]=(state.repeats[state.currentDay]||0)+1;toast("Repeat noted. Stay at this day tomorrow.");}
document.getElementById("jumpToday").onclick=()=>{let first=1;for(let i=1;i<=90;i++){if(pct(i)<80){first=i;break;}}state.currentDay=first;render();scrollTo(0,0);}
document.querySelectorAll(".tabbar button").forEach(b=>b.onclick=()=>{state.currentDay=Number(b.dataset.jump);render();scrollTo(0,0);});
document.getElementById("resetBtn").onclick=()=>{if(confirm("Reset all Milo Trainer Pro data on this device?")){localStorage.removeItem(KEY);location.reload();}}
document.getElementById("exportBtn").onclick=()=>{const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="milo-trainer-pro-backup.json";a.click();URL.revokeObjectURL(url);}
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredPrompt=e;document.getElementById("installBtn").classList.remove("hidden");});
document.getElementById("installBtn").onclick=async()=>{if(deferredPrompt){deferredPrompt.prompt();deferredPrompt=null;}};
if("serviceWorker"in navigator){navigator.serviceWorker.register("sw.js").catch(()=>{});}
render();
