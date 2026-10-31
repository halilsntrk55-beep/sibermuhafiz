import http from 'node:http';
import {readFile} from 'node:fs/promises';
const root=new URL('./',import.meta.url);
const files={'index.html':'text/html; charset=utf-8','app.js':'text/javascript; charset=utf-8','accounts.js':'text/javascript; charset=utf-8','firebase-client.js':'text/javascript; charset=utf-8','style.css':'text/css; charset=utf-8','shield.svg':'image/svg+xml'};
http.createServer(async(req,res)=>{const name=new URL(req.url,'http://localhost').pathname.slice(1)||'index.html';if(req.method!=='GET'||!files[name]){res.writeHead(404);res.end();return;}try{res.writeHead(200,{'Content-Type':files[name],'Cache-Control':'no-store'});res.end(await readFile(new URL(name,root)));}catch{res.writeHead(404);res.end();}}).listen(Number(process.env.PORT||4181),'127.0.0.1',()=>console.log('http://127.0.0.1:'+(process.env.PORT||4181)));

