// Explicit opt-in integration test. Creates and deletes only its own random test accounts.
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
const API_KEY='AIzaSyA5UWJWmxthbG-4DmcUXmAm_b-6PnTbED8';
const BASE='https://ubilsem-kds-default-rtdb.firebaseio.com/sibermuhafiz_v1';
const fixtures=[];
async function auth(action,body){const response=await fetch('https://identitytoolkit.googleapis.com/v1/accounts:'+action+'?key='+API_KEY,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const value=await response.json();if(!response.ok)throw Error('Auth operation '+action+' failed: '+value.error?.message);return value;}
async function db(path,token,method='GET',body){const response=await fetch(BASE+path+'.json'+(token?'?auth='+encodeURIComponent(token):''),{method,headers:{'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});return {status:response.status,value:await response.json()};}
try{
 for(let i=0;i<2;i++){const username='test_'+randomBytes(7).toString('hex'),password=randomBytes(24).toString('base64url');const account=await auth('signUp',{email:'sm-'+username+'@sibermuhafiz.invalid',password,returnSecureToken:true});fixtures.push({...account,username,password});}
 const [a,b]=fixtures;
 const record={profile:{name:'SiberMuhafız Testi',username:a.username,createdAt:Date.now()},progress:{version:1,tier:'explorer',alias:'Test',ranking:false},revision:0,updatedAt:Date.now()};
 assert.equal((await db('/users/'+a.localId,a.idToken,'PUT',record)).status,200);
 assert.equal((await db('/users/'+a.localId)).status,401);
 assert.equal((await db('/users/'+a.localId,b.idToken)).status,401);
 assert.equal((await db('/users/'+a.localId,b.idToken,'PUT',record)).status,401);
 assert.equal((await db('/users',a.idToken)).status,401);
 const login=await auth('signInWithPassword',{email:'sm-'+a.username+'@sibermuhafiz.invalid',password:a.password,returnSecureToken:true});
 const restored=await db('/users/'+a.localId,login.idToken);assert.equal(restored.status,200);assert.equal(restored.value.profile.name,record.profile.name);
 record.progress.completed={'explorer:password':{at:new Date().toISOString()}};record.progress.cursor={path:'detective',tier:'explorer',slide:1,phase:'lesson'};record.revision=1;
 assert.equal((await db('/users/'+a.localId,a.idToken,'PUT',record)).status,200);
 assert.equal((await db('/users/'+a.localId,a.idToken,'PUT',record)).status,401);
 const after=await db('/users/'+a.localId,login.idToken);assert.equal(after.value.progress.cursor.slide,1);assert.ok(after.value.progress.completed['explorer:password']);
 console.log('PASS: real Firebase Auth registration/login, owner read/write, anonymous denial, cross-user read/write denial, list denial, saved task cursor, revision guard.');
}finally{
 for(const fixture of fixtures){await db('/users/'+fixture.localId,fixture.idToken,'DELETE').catch(()=>{});await auth('delete',{idToken:fixture.idToken}).catch(()=>{});}
 console.log('Test accounts and their test records cleaned up.');
}

