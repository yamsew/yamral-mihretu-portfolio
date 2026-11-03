const $=s=>document.querySelector(s);
async function api(url,options={}){const r=await fetch(url,{...options,headers:{"Content-Type":"application/json",...(options.headers||{})}});const d=await r.json();if(!r.ok)throw new Error(d.error||"Request failed");return d}
function safe(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
async function refresh(){
 const [projects,messages]=await Promise.all([api("/api/projects"),api("/api/admin/messages")]);
 $("#adminProjects").innerHTML="<h3>Current projects</h3>"+projects.map(p=>`<div class="panel" style="margin:10px 0"><b>${safe(p.title)}</b><p>${safe(p.description)}</p><button class="btn secondary" data-del-project="${p.id}">Delete</button></div>`).join("");
 $("#messages").innerHTML=messages.length?messages.map(m=>`<article class="panel" style="margin:12px 0"><b>${safe(m.name)}</b> · ${safe(m.email)}<p>${safe(m.message)}</p><small>${safe(m.created_at)}</small><br><button class="btn secondary" data-del-message="${m.id}">Delete message</button></article>`).join(""):"<p>No messages yet.</p>";
}
async function check(){try{const s=await api("/api/admin/me");if(s.authenticated){$("#loginBox").hidden=true;$("#dashboard").hidden=false;await refresh()}}catch{}}
$("#loginForm").addEventListener("submit",async e=>{e.preventDefault();const f=Object.fromEntries(new FormData(e.currentTarget));try{await api("/api/admin/login",{method:"POST",body:JSON.stringify(f)});$("#loginStatus").textContent="Signed in.";await check()}catch(err){$("#loginStatus").textContent=err.message}});
$("#projectForm").addEventListener("submit",async e=>{e.preventDefault();try{await api("/api/admin/projects",{method:"POST",body:JSON.stringify(Object.fromEntries(new FormData(e.currentTarget)))});$("#projectForm").reset();$("#projectStatus").textContent="Project added.";await refresh()}catch(err){$("#projectStatus").textContent=err.message}});
$("#dashboard").addEventListener("click",async e=>{const p=e.target.dataset.delProject,m=e.target.dataset.delMessage;try{if(p)await api("/api/admin/projects/"+p,{method:"DELETE"});if(m)await api("/api/admin/messages/"+m,{method:"DELETE"});if(p||m)await refresh()}catch(err){alert(err.message)}});
$("#logout").addEventListener("click",async()=>{await api("/api/admin/logout",{method:"POST"});location.reload()});
check();
