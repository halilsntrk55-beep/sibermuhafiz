import http from 'node:http';
import {DatabaseSync} from 'node:sqlite';
import {randomBytes,randomUUID,scrypt as scryptCallback,timingSafeEqual,createHash} from 'node:crypto';
import {promisify} from 'node:util';
import {mkdirSync} from 'node:fs';
import {readFile} from 'node:fs/promises';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
const scrypt=promisify(scryptCallback),root=dirname(fileURLToPath(import.meta.url));
const PATH_IDS=['password','phishing','footprint','bullying','gaming','crypto','news','detective'],TIERS=['explorer','defender','analyst'];
const hash=v=>createHash('sha256').update(v).digest('hex');
const defaultProgress=()=>({version:1,tier:'explorer',alias:'',ranking:false,completed:{},attempts:[],cursor:null});
const allowedKey=k=>typeof k==='string'&&k.split(':').length===2&&TIERS.includes(k.split(':')[0])&&PATH_IDS.includes(k.split(':')[1]);
function cleanProgress(input){
  const p=defaultProgress();if(!input||typeof input!=='object')return p;
  if(TIERS.includes(input.tier))p.tier=input.tier;
  p.alias=typeof input.alias==='string'?input.alias.trim().slice(0,24):'';p.ranking=input.ranking===true;
  if(input.completed&&typeof input.completed==='object')for(const k of Object.keys(input.completed))if(allowedKey(k))p.completed[k]={at:typeof input.completed[k]?.at==='string'?input.completed[k].at.slice(0,40):new Date().toISOString()};
  if(Array.isArray(input.attempts))p.attempts=input.attempts.slice(-300).filter(a=>a&&PATH_IDS.includes(a.path)&&TIERS.includes(a.tier)&&typeof a.correct==='boolean').map(a=>({path:a.path,tier:a.tier,correct:a.correct,at:typeof a.at==='string'?a.at.slice(0,40):'',activeSeconds:Number.isFinite(a.activeSeconds)?Math.min(86400,Math.max(0,Math.round(a.activeSeconds))):0}));
  const c=input.cursor;if(c&&PATH_IDS.includes(c.path)&&TIERS.includes(c.tier)&&['lesson','challenge'].includes(c.phase))p.cursor={path:c.path,tier:c.tier,phase:c.phase,slide:Number.isInteger(c.slide)?Math.max(0,Math.min(2,c.slide)):0};
  return p;
}
async function passwordHash(password,salt){return Buffer.from(await scrypt(password,salt,64,{N:16384,r:8,p:1,maxmem:64*1024*1024})).toString('hex');}
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml'};
export function createApp({databasePath=process.env.DB_PATH||join(root,'data','sibermuhafiz.sqlite'),publicOrigin=process.env.PUBLIC_ORIGIN,production=process.env.NODE_ENV==='production'}={}){
  if(production&&(!publicOrigin||!publicOrigin.startsWith('https://')))throw Error('Production requires PUBLIC_ORIGIN=https://your-domain');
  if(databasePath!==':memory:')mkdirSync(dirname(databasePath),{recursive:true});
  const db=new DatabaseSync(databasePath);db.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;');
  db.exec(`CREATE TABLE IF NOT EXISTS students(id TEXT PRIMARY KEY,username TEXT UNIQUE NOT NULL,name TEXT NOT NULL,password_hash TEXT NOT NULL,salt TEXT NOT NULL,created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY,student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,csrf TEXT NOT NULL,expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS progress(student_id TEXT PRIMARY KEY REFERENCES students(id) ON DELETE CASCADE,payload TEXT NOT NULL,revision INTEGER NOT NULL DEFAULT 0,updated_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS auth_limits(key TEXT PRIMARY KEY,count INTEGER NOT NULL,reset_at INTEGER NOT NULL);`);
  const secure=production?'; Secure':'';const cookie=token=>`sm_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800${secure}`;
  const sessionFor=req=>{const raw=(req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith('sm_session='))?.slice(11);if(!raw||!/^[a-f0-9]{64}$/.test(raw))return null;return db.prepare('SELECT s.*,u.username,u.name FROM sessions s JOIN students u ON u.id=s.student_id WHERE s.token_hash=? AND s.expires>?').get(hash(raw),Date.now());};
  function limit(key,max=12){const now=Date.now();const row=db.prepare('SELECT count,reset_at FROM auth_limits WHERE key=?').get(key);if(!row||row.reset_at<now){db.prepare('INSERT INTO auth_limits(key,count,reset_at) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=1,reset_at=excluded.reset_at').run(key,now+15*60*1000);return true;}if(row.count>=max)return false;db.prepare('UPDATE auth_limits SET count=count+1 WHERE key=?').run(key);return true;}
  function issue(studentId,res){const token=randomBytes(32).toString('hex'),csrf=randomBytes(32).toString('hex');db.prepare('DELETE FROM sessions WHERE expires<?').run(Date.now());db.prepare('DELETE FROM auth_limits WHERE reset_at<?').run(Date.now());db.prepare('INSERT INTO sessions VALUES(?,?,?,?)').run(hash(token),studentId,csrf,Date.now()+7*86400000);res.setHeader('Set-Cookie',cookie(token));return csrf;}
  function state(studentId){const u=db.prepare('SELECT id,username,name FROM students WHERE id=?').get(studentId),p=db.prepare('SELECT payload,revision FROM progress WHERE student_id=?').get(studentId);return {account:u,progress:JSON.parse(p.payload),revision:p.revision};}
  const server=http.createServer(async(req,res)=>{
    res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('X-Frame-Options','DENY');res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");if(production)res.setHeader('Strict-Transport-Security','max-age=31536000');
    const send=(status,value)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(value));};
    let path;try{path=new URL(req.url,'http://local').pathname;}catch{send(400,{error:'Geçersiz istek.'});return;}
    if(path==='/api/health'){send(200,{ok:true,database:true});return;}
    if(!path.startsWith('/api/')){const name=path==='/'?'index.html':path.slice(1);if(req.method!=='GET'||!['index.html','app.js','accounts.js','style.css','shield.svg'].includes(name)){send(404,{error:'Bulunamadı.'});return;}try{res.writeHead(200,{'Content-Type':MIME['.'+name.split('.').at(-1)],'Cache-Control':'no-cache'});res.end(await readFile(join(root,name)));}catch{send(404,{error:'Bulunamadı.'});}return;}
    try{
      const session=sessionFor(req);
      if(req.method==='GET'&&path==='/api/session'){send(200,session?{...state(session.student_id),csrf:session.csrf}:{account:null});return;}
      if(req.method!=='POST'&&req.method!=='PUT'){send(405,{error:'Bu yöntem desteklenmiyor.'});return;}
      const origin=publicOrigin||`http://${req.headers.host}`;if(req.headers.origin!==origin){send(403,{error:'İstek kaynağı doğrulanamadı.'});return;}
      if(!req.headers['content-type']?.startsWith('application/json')){send(415,{error:'JSON gerekli.'});return;}
      let raw='';for await(const chunk of req){raw+=chunk;if(Buffer.byteLength(raw)>100000){send(413,{error:'İstek çok büyük.'});return;}}
      let body;try{body=JSON.parse(raw);}catch{send(400,{error:'Geçersiz JSON.'});return;}if(!body||typeof body!=='object'||Array.isArray(body)){send(400,{error:'Geçersiz istek.'});return;}
      if(path==='/api/register'||path==='/api/login'){
        const username=typeof body.username==='string'?body.username.toLowerCase().trim():'',password=typeof body.password==='string'?body.password:'';
        if(!limit('ip:'+hash(req.socket.remoteAddress||'unknown'),40)||!limit('user:'+hash(username),12)){send(429,{error:'Çok fazla deneme. 15 dakika sonra yeniden dene.'});return;}
        if(!/^[a-z0-9_]{3,24}$/.test(username)||password.length<12||password.length>128){send(400,{error:'Kullanıcı adı 3–24 küçük Latin harfi, rakam veya alt çizgi; parola 12–128 karakter olmalı.'});return;}
        if(path==='/api/register'){
          if(body.acknowledged!==true){send(400,{error:'Veri bilgilendirmesini okuyup onayla.'});return;}
          const name=typeof body.name==='string'?body.name.trim():'';if(name.length<2||name.length>60||/[\x00-\x1f<>]/.test(name)){send(400,{error:'Adını 2–60 karakter olarak yaz. Soyadı gerekli değil.'});return;}
          const id=randomUUID(),salt=randomBytes(24).toString('hex'),encoded=await passwordHash(password,salt);
          try{db.exec('BEGIN IMMEDIATE');db.prepare('INSERT INTO students(id,username,name,password_hash,salt,created_at) VALUES(?,?,?,?,?,?)').run(id,username,name,encoded,salt,new Date().toISOString());}catch{if(db.isTransaction)db.exec('ROLLBACK');send(409,{error:'Bu kullanıcı adı alınamıyor. Başka bir kullanıcı adı dene.'});return;}
          try{db.prepare('INSERT INTO progress VALUES(?,?,0,?)').run(id,JSON.stringify(defaultProgress()),new Date().toISOString());db.exec('COMMIT');}catch{if(db.isTransaction)db.exec('ROLLBACK');throw Error('db');}
          if(session)db.prepare('DELETE FROM sessions WHERE token_hash=?').run(session.token_hash);const csrf=issue(id,res);send(201,{...state(id),csrf});return;
        }
        const student=db.prepare('SELECT * FROM students WHERE username=?').get(username);const salt=student?.salt||'dummy-constant-salt-for-unknown-user';const candidate=await passwordHash(password,salt);const expected=student?.password_hash||'0'.repeat(128);if(!student||!timingSafeEqual(Buffer.from(candidate,'hex'),Buffer.from(expected,'hex'))){send(401,{error:'Kullanıcı adı veya parola yanlış.'});return;}
        if(session)db.prepare('DELETE FROM sessions WHERE token_hash=?').run(session.token_hash);const csrf=issue(student.id,res);send(200,{...state(student.id),csrf});return;
      }
      if(!session){send(401,{error:'Devam etmek için giriş yap.'});return;}
      if(req.headers['x-csrf-token']!==session.csrf){send(403,{error:'Oturum doğrulanamadı. Sayfayı yenile.'});return;}
      if(path==='/api/logout'){db.prepare('DELETE FROM sessions WHERE token_hash=?').run(session.token_hash);res.setHeader('Set-Cookie',`sm_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`);send(200,{ok:true});return;}
      if(path==='/api/progress'&&req.method==='PUT'){
        const existing=db.prepare('SELECT payload,revision FROM progress WHERE student_id=?').get(session.student_id);if(body.revision!==existing.revision){send(409,{error:'İlerleme başka bir sekmede değişti.',progress:JSON.parse(existing.payload),revision:existing.revision});return;}
        const clean=cleanProgress(body.progress);const old=JSON.parse(existing.payload);clean.completed={...old.completed,...clean.completed};const updated=db.prepare('UPDATE progress SET payload=?,revision=revision+1,updated_at=? WHERE student_id=? AND revision=?').run(JSON.stringify(clean),new Date().toISOString(),session.student_id,body.revision);if(!updated.changes){send(409,{error:'Yeniden eşitle.'});return;}send(200,{revision:existing.revision+1});return;
      }
      if(path==='/api/delete-account'){
        const student=db.prepare('SELECT salt,password_hash FROM students WHERE id=?').get(session.student_id);if(typeof body.password!=='string'||body.password.length>128){send(400,{error:'Parolanı yaz.'});return;}if(!limit('delete:'+session.student_id,6)){send(429,{error:'Çok fazla deneme.'});return;}const candidate=await passwordHash(body.password,student.salt);if(!timingSafeEqual(Buffer.from(candidate,'hex'),Buffer.from(student.password_hash,'hex'))){send(401,{error:'Parola yanlış.'});return;}db.prepare('DELETE FROM students WHERE id=?').run(session.student_id);res.setHeader('Set-Cookie',`sm_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`);send(200,{ok:true});return;
      }
      send(404,{error:'Bulunamadı.'});
    }catch{send(500,{error:'İşlem tamamlanamadı. Yeniden dene.'});}
  });
  server.on('close',()=>db.close());return server;
}
if(process.argv[1]===fileURLToPath(import.meta.url))createApp().listen(Number(process.env.PORT||4182),process.env.HOST||'127.0.0.1',()=>console.log('SiberMuhafız: http://127.0.0.1:'+(process.env.PORT||4182)));

