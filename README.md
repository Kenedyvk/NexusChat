# NexusChat

O NexusChat nasceu de uma necessidade simples: reunir, em um só lugar, as conversas e pequenas rotinas que costumam ficar espalhadas entre mensageiro, agenda e chamados de suporte.

Esta é uma base funcional para apresentação. Ela já tem interface própria, API em Fastify e comunicação em tempo real com Socket.IO. Os dados ainda são de demonstração e ficam em memória; o próximo passo é conectar autenticação e banco de dados.

## O que dá para testar

- conversas individuais e canais;
- envio de mensagens pela API;
- diretório interno de pessoas e setores;
- agendamento de salas com detecção de conflito;
- reuniões filtradas por setor;
- Central Nexus com indicadores operacionais;
- atualização em tempo real com Socket.IO;
- execução local com Node.js ou Docker.

## Tecnologias

- Node.js 24
- Fastify
- Socket.IO
- HTML, CSS e JavaScript
- Docker

## Rodando na sua máquina

Com Node.js 24:

```bash
npm install
npm start
```

Depois, abra `http://localhost:8080`.

Com Docker:

```bash
docker compose up --build
```

No Windows, o arquivo `start.bat` escolhe automaticamente entre Docker e Node.js.

## Endpoints disponíveis

| Método | Endpoint | Finalidade |
| --- | --- | --- |
| GET | `/api/health` | Estado da aplicação |
| GET | `/api/me` | Usuário da demonstração |
| GET | `/api/conversations` | Conversas e canais |
| GET | `/api/messages/:conversationId` | Histórico da conversa |
| POST | `/api/messages` | Enviar mensagem |
| GET | `/api/people` | Diretório interno |
| GET | `/api/rooms` | Salas disponíveis |
| GET | `/api/meetings` | Reuniões visíveis ao usuário |
| POST | `/api/meetings` | Criar uma reserva |
| GET | `/api/admin/metrics` | Indicadores da demonstração |

## Antes de virar produto

A demonstração não deve ser usada com dados reais. Para uma versão de produção ainda faltam banco persistente, autenticação, permissões por usuário, auditoria, armazenamento de anexos e testes automatizados.

O objetivo desta etapa é validar a experiência e deixar uma base clara para evoluir sem reconstruir o projeto a cada nova funcionalidade.
