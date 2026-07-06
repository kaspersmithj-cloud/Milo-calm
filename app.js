const KEY="miloCalm90DataV1";
let state=JSON.parse(localStorage.getItem(KEY)||"{}");
if(!state.currentDay) state.currentDay=1;
if(!state.days) state.days={};
let deferredPrompt=null;

function getDay(n){ if(!state.days[n]) state.days[n]={checked:{},notes:"",triggers:[],dogDistance:"",doorbellResult:"",saved:false}; return state.days[n];}
function save(){localStorage.setItem(KEY,JSON.stringify(state));}
function pct(n){const p=PROGRAMME[n-1]; const d=getDay(n); let total=0,done=0; p.sessions.forEach((s,si)=>s.tasks.forEach((t,ti)=>{total++; if(d.checked[`${si}-${ti}`]) done++;})); return total?Math.round(done/total*100):0;}
function avgIntensity(day){const t=getDay(day).triggers; if(!t.length) return null; return t.reduce((a,b)=>a+Number(b.intensity),0)/t.length;}
function streak(){let s=0; for(let i=1;i<=90;i++){if(pct(i)>=80)s++; else if(i<state.currentDay) s=0;} return s;}
function overall(){let sum=0; for(let i=1;i<=90;i++) sum+=pct(i); return Math.round(sum/90);}
function calmScore(){let vals=[]; for(let i=1;i<=90;i++){const a=avgIntensity(i); if(a!==null) vals.push(a);} if(!vals.length) return "—"; const avg=vals.reduce((a,b)=>a+b,0)/vals.length; return Math.max(0,Math.round(100-(avg/5*100)));}

function render(){
 const dayNo=Math.max(1,Math.min(90,state.currentDay)); state.currentDay=dayNo;
 const p=PROGRAMME[dayNo-1], d=getDay(dayNo);
 document.getElementById("phase").textContent=p.phase;
 document.getElementById("dayTitle").textContent=`Day ${p.day} · Week ${p.week}`;
 document.getElementById("target").textContent=p.target;
 const today=pct(dayNo);
 document.getElementById("todayPercent").textContent=today+"%";
 document.querySelector(".ring").style.setProperty("--p",today+"%");
 document.getElementById("streak").textContent=streak();
 document.getElementById("overall").textContent=overall()+"%";
 document.getElementById("calmScore").textContent=calmScore();

 const sessions=document.getElementById("sessions"); sessions.innerHTML="";
 p.sessions.forEach((s,si)=>{
   const div=document.createElement("div"); div.className="session";
   div.innerHTML=`<h4>${s.title}</h4><p class="purpose">${s.purpose}</p><ol class="steps">${s.steps.map(x=>`<li>${x}</li>`).join("")}</ol>`;
   s.tasks.forEach((task,ti)=>{
     const key=`${si}-${ti}`;
     const lab=document.createElement("label"); lab.className="task";
     lab.innerHTML=`<input type="checkbox" ${d.checked[key]?"checked":""}> <span>${task}</span>`;
     lab.querySelector("input").addEventListener("change",e=>{d.checked[key]=e.target.checked; save(); render();});
     div.appendChild(lab);
   });
   sessions.appendChild(div);
 });
 document.getElementById("criteria").innerHTML=p.successCriteria.map(x=>`<li>${x}</li>`).join("");
 document.getElementById("dailyNotes").value=d.notes||"";
 document.getElementById("dogDistance").value=d.dogDistance||"";
 document.getElementById("doorbellResult").value=d.doorbellResult||"";
 const a=avgIntensity(dayNo);
 let advice="Move on tomorrow if today is 80%+ complete and barking intensity stayed mostly 0–2.";
 if(today<80) advice="Repeat this day tomorrow. The goal is calm success, not rushing through 90 days.";
 if(a!==null && a>=3) advice="Make tomorrow easier: more distance, lower volume, shorter visitor/car/dog exposure.";
 if(today>=80 && (a===null || a<3)) advice="Good day. You can progress, but only increase one difficulty variable tomorrow.";
 document.getElementById("advice").textContent=advice;

 const tl=document.getElementById("triggerList"); tl.innerHTML="";
 [...d.triggers].reverse().forEach(t=>{
   const item=document.createElement("div"); item.className="log-item";
   item.innerHTML=`<strong>${t.type}</strong> · intensity ${t.intensity}/5<br>${t.note||""}<br><small>${t.time}</small>`;
   tl.appendChild(item);
 });
 renderBars();
}
function renderBars(){
 const areas=["Doorbell / knock","Visitor arriving","Parking the car","Other dog"];
 const bars=document.getElementById("bars"); bars.innerHTML="";
 areas.forEach(area=>{
   let entries=[]; for(let i=1;i<=90;i++) entries.push(...getDay(i).triggers.filter(t=>t.type===area).map(t=>Number(t.intensity)));
   let score=entries.length?Math.round(100-(entries.reduce((a,b)=>a+b,0)/entries.length)/5*100):0;
   const wrap=document.createElement("div"); wrap.className="bar-wrap";
   wrap.innerHTML=`<div class="bar-label"><span>${area}</span><span>${entries.length?score+"% calm":"no data"}</span></div><div class="bar"><span style="width:${score}%"></span></div>`;
   bars.appendChild(wrap);
 });
}
["dailyNotes","dogDistance","doorbellResult"].forEach(id=>{
 document.getElementById(id).addEventListener("input",e=>{getDay(state.currentDay)[id==="dailyNotes"?"notes":id]=e.target.value; save();});
});
document.getElementById("addTrigger").addEventListener("click",()=>{
 const d=getDay(state.currentDay);
 d.triggers.push({type:document.getElementById("triggerType").value,intensity:document.getElementById("intensity").value,note:document.getElementById("triggerNote").value,time:new Date().toLocaleString()});
 document.getElementById("triggerNote").value=""; save(); render();
});
document.getElementById("saveDay").addEventListener("click",()=>{getDay(state.currentDay).saved=true; save(); alert("Saved on this device.");});
document.getElementById("nextDay").addEventListener("click",()=>{state.currentDay=Math.min(90,state.currentDay+1); save(); render(); window.scrollTo(0,0);});
document.getElementById("prevDay").addEventListener("click",()=>{state.currentDay=Math.max(1,state.currentDay-1); save(); render(); window.scrollTo(0,0);});
document.getElementById("jumpToday").addEventListener("click",()=>{let first=1; for(let i=1;i<=90;i++){if(pct(i)<80){first=i;break;}} state.currentDay=first; save(); render(); window.scrollTo(0,0);});
document.querySelectorAll(".bottom button").forEach(b=>b.addEventListener("click",()=>{state.currentDay=Number(b.dataset.jump); save(); render(); window.scrollTo(0,0);}));
document.getElementById("resetBtn").addEventListener("click",()=>{if(confirm("Reset all Milo training data on this device?")){localStorage.removeItem(KEY); location.reload();}});
document.getElementById("exportBtn").addEventListener("click",()=>{
 const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"});
 const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download="milo-calm-90-progress.json"; a.click(); URL.revokeObjectURL(url);
});
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault(); deferredPrompt=e; document.getElementById("installBtn").classList.remove("hidden");});
document.getElementById("installBtn").addEventListener("click",async()=>{if(deferredPrompt){deferredPrompt.prompt(); deferredPrompt=null;}});
if("serviceWorker" in navigator){navigator.serviceWorker.register("sw.js").catch(()=>{});}
render();
