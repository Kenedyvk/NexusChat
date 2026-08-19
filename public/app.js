const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
const socket = io();

let me = null;
let activeConversation = "c-ana";
let rooms = [];
let conversations = [];

async function api(url, options={}) {
  const response = await fetch(url, {
    headers: {"Content-Type":"application/json", ...(options.headers||{})},
    ...options
  });
  const body = await response.json().catch(()=>({}));
  if (!response.ok) throw new Error(body.error || "Falha na API");
  return body;
}

function showToast(text){
  const el=$("#toast"); el.textContent=text; el.classList.remove("hidden");
  clearTimeout(showToast.timer); showToast.timer=setTimeout(()=>el.classList.add("hidden"),2800);
}

function setView(name){
  $$(".rail-btn[data-view]").forEach(b=>b.classList.toggle("active",b.dataset.view===name));
  $$(".view").forEach(v=>v.classList.remove("active-view"));
  $("#view-"+name).classList.add("active-view");
  if(name==="admin") loadAdmin();
  if(name==="rooms") loadRooms();
}

async function loadSidebar(){
  const data=await api("/api/conversations");
  conversations=data.conversations;
  renderConversationList(conversations);
  $("#channelList").innerHTML=data.channels.map(c=>`
    <button class="channel">
      <span class="avatar">#</span>
      <span><strong>${escapeHtml(c.name)}</strong><small>${escapeHtml(c.description)}</small></span>
      <span></span>
    </button>`).join("");
}

function renderConversationList(items){
  $("#conversationList").innerHTML=items.map(c=>`
    <button class="conv ${c.id===activeConversation?"active":""}" data-id="${escapeHtml(c.id)}">
      <span class="avatar">${escapeHtml(c.initials)}</span>
      <span><strong>${escapeHtml(c.name)}</strong><small><i class="green-dot"></i>${escapeHtml(c.preview)}</small></span>
      <time>${escapeHtml(c.time)}</time>
    </button>`).join("") || "<p class='sub'>Nenhuma conversa encontrada.</p>";
  $$(".conv").forEach(btn=>btn.onclick=async()=>{
    $$(".conv").forEach(x=>x.classList.remove("active")); btn.classList.add("active");
    activeConversation=btn.dataset.id;
    updateConversationHeader();
    socket.emit("conversation:join",activeConversation);
    await loadMessages();
  });
}

function updateConversationHeader(){
  const conversation=conversations.find(item=>item.id===activeConversation);
  if(!conversation)return;
  $("#activeAvatar").textContent=conversation.initials;
  $("#activeName").textContent=conversation.name;
  $("#activeStatus").innerHTML=`<i class="green-dot"></i> ${conversation.status==="online"?"Online agora":"Ausente"}`;
}

async function loadMessages(){
  const {messages}=await api("/api/messages/"+activeConversation);
  $("#messageList").innerHTML=messages.map(renderMessage).join("") || "<div class='message-empty'>Comece esta conversa quando quiser.</div>";
  $("#messageList").scrollTop=$("#messageList").scrollHeight;
}
function renderMessage(m){
  const mine=m.fromId===me?.id;
  const initials=String(m.from||"").split(" ").map(x=>x[0]).slice(0,2).join("");
  return `<div class="msg ${mine?"mine":""}">
    ${mine?"":`<span class="avatar">${escapeHtml(initials)}</span>`}
    <div class="bubble-wrap">
      <div class="bubble">${m.file?`<div class="file-bubble"><span class="file-icon">PDF</span><span><strong>${escapeHtml(m.file.name)}</strong><small>${escapeHtml(m.file.size)}</small></span></div>`:escapeHtml(m.text||"")}</div>
      <div class="msg-meta">${escapeHtml(m.time)}${mine?" · ✓✓":""}</div>
    </div>
  </div>`;
}
function escapeHtml(v){return String(v).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}

async function loadRooms(){
  const roomData=await api("/api/rooms"); rooms=roomData;
  $("#roomCards").innerHTML=rooms.map(r=>`
    <article class="room-card">
      <div class="room-card-top"><div><h4>${escapeHtml(r.name)}</h4><p>${escapeHtml(r.floor)} · ${Number(r.capacity)} lugares</p></div>
      <span class="room-meta"><span class="status-pill ${r.status==="busy"?"busy":""}">${r.status==="busy"?"Ocupada":"Livre"}</span></span></div>
      <div class="room-meta">${r.resources.map(x=>`<span>${escapeHtml(x)}</span>`).join("")}</div>
    </article>`).join("");
  $("#roomSelect").innerHTML=rooms.map(r=>`<option value="${escapeHtml(r.id)}">${escapeHtml(r.name)}</option>`).join("");
  const {meetings}=await api("/api/meetings");
  $("#meetingList").innerHTML=meetings.map(m=>`
    <article class="meeting"><time>${escapeHtml(m.start)} — ${escapeHtml(m.end)}</time><strong>${escapeHtml(m.title)}</strong>
    <small>${escapeHtml(m.room)} · ${m.visibility==="all"?"Todos":escapeHtml(m.sector)}</small></article>`).join("") || "<p class='sub'>Nenhuma reunião visível.</p>";
}

async function loadPeople(){
  const {people}=await api("/api/people");
  const render=items=>{
    $("#peopleGrid").innerHTML=items.map(person=>`
      <article class="person-card">
        <span class="avatar">${escapeHtml(person.initials)}</span>
        <div><strong>${escapeHtml(person.name)}</strong><small>${escapeHtml(person.role)}</small><span>${escapeHtml(person.sector)}</span></div>
        <i class="presence ${person.status==="away"?"away":""}" title="${person.status==="online"?"Online":"Ausente"}"></i>
      </article>`).join("") || "<p class='sub'>Nenhuma pessoa encontrada.</p>";
  };
  render(people);
  $("#peopleSearch").oninput=e=>{
    const term=e.target.value.toLocaleLowerCase("pt-BR").trim();
    render(people.filter(person=>[person.name,person.role,person.sector].some(value=>value.toLocaleLowerCase("pt-BR").includes(term))));
  };
}

async function loadAdmin(){
  const m=await api("/api/admin/metrics");
  const cards=[
    ["Usuários online",m.usersOnline,`de ${m.usersRegistered} cadastrados`],
    ["Mensagens hoje",m.messagesToday.toLocaleString("pt-BR"),"↑ 12% vs. ontem"],
    ["Armazenamento",`${m.storageUsedGB} GB`,`de ${m.storageTotalGB} GB`],
    ["Saúde do servidor",`${m.serverHealth}%`,"Operação normal"]
  ];
  $("#metricCards").innerHTML=cards.map(c=>`<article class="metric"><label>${c[0]}</label><strong>${c[1]}</strong><small>${c[2]}</small></article>`).join("");
  const max=Math.max(...m.activity);
  $("#activityChart").innerHTML=m.activity.map(v=>`<span class="bar" style="height:${Math.round(v/max*92)+8}%"></span>`).join("");
  $("#serviceList").innerHTML=m.services.map(s=>`<div class="service"><span>${s.name}</span><span class="ok">${s.status}</span><span class="latency">${s.latency} ms</span></div>`).join("");
}

async function boot(){
  me=await api("/api/me");
  await loadSidebar();
  updateConversationHeader();
  await Promise.all([loadMessages(),loadRooms(),loadPeople()]);
  const today=new Date().toISOString().slice(0,10);
  $("#meetingDate").value=today;
  $("#meetingDate").min=today;
  socket.emit("conversation:join",activeConversation);
  try{
    const t0=performance.now(); await api("/api/health"); $("#serverLatency").textContent=Math.max(1,Math.round(performance.now()-t0));
  }catch{}
}
boot();

$$(".rail-btn[data-view]").forEach(btn=>btn.onclick=()=>setView(btn.dataset.view));

$("#messageForm").addEventListener("submit",async e=>{
  e.preventDefault(); const input=$("#messageInput"); const text=input.value.trim(); if(!text)return;
  input.value="";
  try{await api("/api/messages",{method:"POST",body:JSON.stringify({conversationId:activeConversation,text})}); await loadMessages();}
  catch(err){showToast(err.message)}
});
socket.on("chat:message",m=>{if(m.conversationId===activeConversation)loadMessages()});
socket.on("meetings:updated",()=>{if($("#view-rooms").classList.contains("active-view"))loadRooms()});

$("#newMeetingBtn").onclick=()=>$("#meetingModal").classList.remove("hidden");
$("#closeMeetingModal").onclick=$("#cancelMeeting").onclick=()=>$("#meetingModal").classList.add("hidden");
$("#meetingForm").addEventListener("submit",async e=>{
  e.preventDefault(); $("#meetingError").textContent="";
  const payload=Object.fromEntries(new FormData(e.currentTarget).entries());
  try{
    await api("/api/meetings",{method:"POST",body:JSON.stringify(payload)});
    $("#meetingModal").classList.add("hidden"); showToast("Sala reservada com sucesso."); await loadRooms();
  }catch(err){$("#meetingError").textContent=err.message}
});

$("#userMenuBtn").onclick=()=>$("#accountMenu").classList.toggle("hidden");
document.addEventListener("click",e=>{
  if(!$("#accountMenu").contains(e.target)&&!$("#userMenuBtn").contains(e.target))$("#accountMenu").classList.add("hidden");
});
document.addEventListener("keydown",e=>{
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();$("#conversationSearch").focus()}
  if(e.key==="Escape"){$("#accountMenu").classList.add("hidden");$("#meetingModal").classList.add("hidden")}
});

$("#conversationSearch").addEventListener("input",e=>{
  const term=e.target.value.toLocaleLowerCase("pt-BR").trim();
  renderConversationList(conversations.filter(conversation=>[conversation.name,conversation.preview].some(value=>value.toLocaleLowerCase("pt-BR").includes(term))));
});
