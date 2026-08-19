import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import { Server as SocketIOServer } from "socket.io";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = Fastify({ logger: true });
await app.register(fastifyStatic, {
  root: join(__dirname, "../public"),
  prefix: "/"
});

const io = new SocketIOServer(app.server);

const isoDate = new Date().toISOString().slice(0, 10);
const allowedSectors = new Set(["Tecnologia", "Recursos Humanos", "Financeiro", "Geral"]);
const allowedVisibility = new Set(["sector", "all"]);

const currentUser = {
  id: "u-001",
  name: "Kenedy Vinicius",
  initials: "KV",
  sector: "Tecnologia",
  role: "Administrador",
  status: "online"
};

const conversations = [
  { id:"c-ana", name:"Ana Souza", initials:"AS", status:"online", preview:"Perfeito, vou validar agora.", time:"14:32", unread:2 },
  { id:"c-carlos", name:"Carlos Mendes", initials:"CM", status:"online", preview:"O servidor ficou estável.", time:"13:18", unread:0 },
  { id:"c-juliana", name:"Juliana Lima", initials:"JL", status:"away", preview:"Enviei o documento em PDF.", time:"11:45", unread:0 },
  { id:"c-marcos", name:"Marcos Rocha", initials:"MR", status:"online", preview:"Pode deixar comigo.", time:"Ontem", unread:0 }
];

const people = [
  { id:"u-ana", name:"Ana Souza", initials:"AS", sector:"Tecnologia", role:"Analista de Sistemas", status:"online" },
  { id:"u-carlos", name:"Carlos Mendes", initials:"CM", sector:"Tecnologia", role:"Infraestrutura", status:"online" },
  { id:"u-juliana", name:"Juliana Lima", initials:"JL", sector:"Financeiro", role:"Analista Administrativa", status:"away" },
  { id:"u-marcos", name:"Marcos Rocha", initials:"MR", sector:"Recursos Humanos", role:"Assistente de Pessoas", status:"online" }
];

const channels = [
  { id:"ch-geral", name:"Geral", description:"Comunicados e avisos" },
  { id:"ch-tecnologia", name:"Tecnologia", description:"Infraestrutura e sistemas" },
  { id:"ch-projetos", name:"Projetos", description:"Projetos em andamento" }
];

let messages = [
  { id:"m1", conversationId:"c-ana", from:"Ana Souza", fromId:"u-ana", text:"Bom dia! Você conseguiu revisar o fluxo novo?", time:"14:26" },
  { id:"m2", conversationId:"c-ana", from:"Kenedy Vinicius", fromId:"u-001", text:"Consegui sim. A ideia é centralizar tudo aqui e reduzir a dependência de ferramentas antigas.", time:"14:28" },
  { id:"m3", conversationId:"c-ana", from:"Ana Souza", fromId:"u-ana", file:{name:"planejamento_2026.pdf", size:"2,4 MB"}, time:"14:30" },
  { id:"m4", conversationId:"c-ana", from:"Ana Souza", fromId:"u-ana", text:"Perfeito, vou validar agora. Se ficar assim na apresentação vai ficar muito mais claro.", time:"14:32" },
  { id:"m5", conversationId:"c-carlos", from:"Carlos Mendes", fromId:"u-carlos", text:"O servidor ficou estável depois do último ajuste. Vou acompanhar os indicadores.", time:"13:18" },
  { id:"m6", conversationId:"c-juliana", from:"Juliana Lima", fromId:"u-juliana", text:"Enviei o documento em PDF para você revisar quando puder.", time:"11:45" },
  { id:"m7", conversationId:"c-marcos", from:"Marcos Rocha", fromId:"u-marcos", text:"Pode deixar comigo. Atualizo o chamado assim que terminar.", time:"Ontem" }
];

const rooms = [
  { id:"r-alpha", name:"Sala Alpha", floor:"1º andar", capacity:8, resources:["TV","Videoconferência"], status:"available" },
  { id:"r-estrategica", name:"Sala Estratégica", floor:"2º andar", capacity:14, resources:["TV 75","Videoconferência","Quadro"], status:"busy" },
  { id:"r-briefing", name:"Sala de Briefing", floor:"Térreo", capacity:20, resources:["Projetor","Áudio"], status:"available" }
];

let meetings = [
  { id:"mt-1", title:"Reunião - Projeto Alfa", roomId:"r-alpha", room:"Sala Alpha", date:isoDate, start:"09:30", end:"10:30", sector:"Tecnologia", visibility:"sector", owner:"Kenedy Vinicius" },
  { id:"mt-2", title:"Planejamento Estratégico", roomId:"r-estrategica", room:"Sala Estratégica", date:isoDate, start:"14:00", end:"15:00", sector:"Tecnologia", visibility:"sector", owner:"Ana Souza" },
  { id:"mt-3", title:"Entrevistas internas", roomId:"r-briefing", room:"Sala de Briefing", date:isoDate, start:"11:00", end:"12:00", sector:"Recursos Humanos", visibility:"sector", owner:"RH" },
  { id:"mt-4", title:"Alinhamento institucional", roomId:"r-briefing", room:"Sala de Briefing", date:isoDate, start:"16:30", end:"17:00", sector:"Geral", visibility:"all", owner:"Administração" }
];

const isMeetingVisible = (meeting, user) =>
  meeting.visibility === "all" ||
  meeting.sector === user.sector ||
  meeting.invitedUserIds?.includes(user.id);

app.get("/api/health", async () => ({
  status: "ok",
  service: "SEFA Nexus API",
  uptimeSeconds: Math.floor(process.uptime()),
  timestamp: new Date().toISOString()
}));

app.get("/api/me", async () => currentUser);
app.get("/api/conversations", async () => ({ conversations, channels }));
app.get("/api/people", async () => ({ people }));
app.get("/api/messages/:conversationId", async (request) => ({
  messages: messages.filter(m => m.conversationId === request.params.conversationId)
}));

app.post("/api/messages", async (request, reply) => {
  const { conversationId, text } = request.body ?? {};
  if (!conversations.some(conversation => conversation.id === conversationId) || typeof text !== "string" || !text.trim()) {
    return reply.code(400).send({ error:"Escolha uma conversa e escreva uma mensagem." });
  }
  if (text.trim().length > 2000) return reply.code(400).send({ error:"A mensagem deve ter no máximo 2.000 caracteres." });

  const message = {
    id: `m-${Date.now()}`,
    conversationId,
    from: currentUser.name,
    fromId: currentUser.id,
    text: text.trim(),
    time: new Date().toLocaleTimeString("pt-BR", { hour:"2-digit", minute:"2-digit" })
  };
  messages.push(message);
  io.to(conversationId).emit("chat:message", message);
  return reply.code(201).send(message);
});

app.get("/api/rooms", async () => rooms);

app.get("/api/meetings", async () => ({
  meetings: meetings.filter(m => isMeetingVisible(m, currentUser))
}));

app.post("/api/meetings", async (request, reply) => {
  const { title, roomId, date, start, end, sector, visibility = "sector" } = request.body ?? {};
  const room = rooms.find(r => r.id === roomId);
  const validDate = /^\d{4}-\d{2}-\d{2}$/.test(date ?? "");
  const validTime = value => /^([01]\d|2[0-3]):[0-5]\d$/.test(value ?? "");
  if (typeof title !== "string" || !title.trim() || title.trim().length > 100 || !room || !validDate || !validTime(start) || !validTime(end) || !allowedSectors.has(sector) || !allowedVisibility.has(visibility)) {
    return reply.code(400).send({ error:"Preencha título, sala, data, horários e setor." });
  }
  if (start >= end) return reply.code(400).send({ error:"O horário final deve ser posterior ao inicial." });

  const conflict = meetings.some(m =>
    m.roomId === roomId && m.date === date && start < m.end && end > m.start
  );
  if (conflict) return reply.code(409).send({ error:"Esta sala já está reservada nesse intervalo." });

  const meeting = {
    id:`mt-${Date.now()}`, title:title.trim(), roomId, room:room.name, date, start, end,
    sector, visibility, owner:currentUser.name
  };
  meetings.push(meeting);
  io.emit("meetings:updated");
  return reply.code(201).send(meeting);
});

app.get("/api/admin/metrics", async () => ({
  usersOnline: 117,
  usersRegistered: 150,
  messagesToday: 3842,
  storageUsedGB: 18.6,
  storageTotalGB: 100,
  serverHealth: 99.98,
  activity: [18,31,26,48,39,56,66,52,70,61,44,55],
  services: [
    { name:"API", status:"Operacional", latency:18 },
    { name:"WebSocket", status:"Operacional", latency:12 },
    { name:"Storage", status:"Operacional", latency:22 }
  ]
}));

io.on("connection", socket => {
  socket.on("conversation:join", id => socket.join(id));
  socket.emit("presence:ready", { online: true });
});

app.get("/", async (_, reply) => reply.sendFile("index.html"));

const port = Number(process.env.PORT || 8080);
const host = process.env.HOST || "0.0.0.0";
await app.listen({ port, host });
