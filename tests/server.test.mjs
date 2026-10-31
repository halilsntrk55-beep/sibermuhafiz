import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {createApp} from '../server.mjs';
test('student accounts: persistence, owner isolation, CSRF, revisions and deletion',async()=>{
 const folder=await mkdtemp(join(tmpdir(),'sibermuhafiz-test-')),databasePath=join(folder,'test.sqlite');let app,base;
 const start=async()=>{app=createApp({databasePath});await new Promise(r=>app.listen(0,'127.0.0.1',r));base='http://127.0.0.1:'+app.address().port;};
 const stop=()=>new Promise(r=>app.close(r));
 const call=async(path,method='GET',body,cookie='',csrf='')=>{const r=await fetch(base+'/api/'+path,{method,headers:{Origin:base,'Content-Type':'application/json',Cookie:cookie,'X-CSRF-Token':csrf},body:body===undefined?undefined:JSON.stringify(body)});return {status:r.status,body:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0],headers:r.headers};};
 try{await start();assert.equal((await call('session')).body.account,null);
 const a=await call('register','POST',{name:'Deneme Öğrenci',username:'test_alpha',password:'A-test-password-123',acknowledged:true});assert.equal(a.status,201);assert.match(a.headers.get('set-cookie'),/HttpOnly/);assert.match(a.headers.get('set-cookie'),/SameSite=Lax/);assert.equal(a.body.account.name,'Deneme Öğrenci');assert.equal(a.body.account.password_hash,undefined);
 const b=await call('register','POST',{name:'Deneme Öğrenci',username:'test_beta',password:'B-test-password-123',acknowledged:true});assert.equal(b.status,201);assert.notEqual(a.body.account.id,b.body.account.id);
 assert.equal((await call('register','POST',{name:'Test',username:'test_alpha',password:'A-test-password-123',acknowledged:true})).status,409);
 assert.equal((await call('login','POST',{username:'test_alpha',password:'wrong-password-123'})).status,401);
 const payload={tier:'analyst',alias:'TestKalkan',completed:{'analyst:password':{at:new Date().toISOString()}},attempts:[{path:'password',tier:'analyst',correct:true,at:new Date().toISOString(),activeSeconds:20}],cursor:{path:'detective',tier:'analyst',phase:'lesson',slide:1}};
 assert.equal((await call('progress','PUT',{revision:0,progress:payload},a.cookie)).status,403);
 const stored=await call('progress','PUT',{revision:0,progress:payload},a.cookie,a.body.csrf);assert.equal(stored.status,200);assert.equal(stored.body.revision,1);
 const other=await call('session','GET',undefined,b.cookie);assert.equal(Object.keys(other.body.progress.completed).length,0);assert.equal(other.body.progress.cursor,null);
 const stale=await call('progress','PUT',{revision:0,progress:payload},a.cookie,a.body.csrf);assert.equal(stale.status,409);assert.equal(stale.body.revision,1);
 const secondDevice=await call('login','POST',{username:'test_alpha',password:'A-test-password-123'});assert.equal(secondDevice.status,200);assert.deepEqual(secondDevice.body.progress.cursor,payload.cursor);assert.equal(secondDevice.body.progress.completed['analyst:password'].at,payload.completed['analyst:password'].at);
 const badOrigin=await fetch(base+'/api/logout',{method:'POST',headers:{Origin:'https://attacker.example','Content-Type':'application/json',Cookie:a.cookie,'X-CSRF-Token':a.body.csrf},body:'{}'});assert.equal(badOrigin.status,403);
 assert.equal((await call('progress','PUT',{revision:0,progress:payload})).status,401);
 assert.equal((await fetch(base+'/data/test.sqlite')).status,404);
 const db=new DatabaseSync(databasePath);const row=db.prepare('SELECT password_hash,salt FROM students WHERE username=?').get('test_alpha');assert.notEqual(row.password_hash,'A-test-password-123');assert.equal(row.password_hash.length,128);assert.equal(row.salt.length,48);db.close();
 await stop();await start();const restored=await call('login','POST',{username:'test_alpha',password:'A-test-password-123'});assert.equal(restored.status,200);assert.equal(restored.body.progress.cursor.slide,1);assert.equal(Object.keys(restored.body.progress.completed).length,1);
 assert.equal((await call('delete-account','POST',{password:'wrong-password-123'},restored.cookie,restored.body.csrf)).status,401);
 assert.equal((await call('delete-account','POST',{password:'A-test-password-123'},restored.cookie,restored.body.csrf)).status,200);assert.equal((await call('session','GET',undefined,secondDevice.cookie)).body.account,null);
 const verify=new DatabaseSync(databasePath);assert.equal(verify.prepare('SELECT count(*) AS n FROM progress WHERE student_id=?').get(a.body.account.id).n,0);verify.close();
 assert.equal((await call('logout','POST',{},b.cookie,b.body.csrf)).status,200);assert.equal((await call('session','GET',undefined,b.cookie)).body.account,null);
 }finally{if(app?.listening)await stop();await rm(folder,{recursive:true,force:true});}
});

