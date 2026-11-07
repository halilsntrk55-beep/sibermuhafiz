import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
test('Firebase serialization, allowlist, bounds and rules ownership',async()=>{
 const source=await readFile(new URL('../firebase-client.js',import.meta.url),'utf8');const context=vm.createContext({console,setTimeout,clearTimeout});vm.runInContext(source+'\nglobalThis.testClient=SMFirebase;',context);const result=JSON.parse(JSON.stringify(context.testClient.sanitize({tier:'analyst',name:'not-a-progress-field',password:'never-store-me',completed:{'explorer:password':{at:'2026-10-31'},'invalid:other':{}},attempts:[{path:'password',tier:'analyst',correct:true,at:'2026-10-31',activeSeconds:999999,choice:'not-sent'}],cursor:{path:'detective',tier:'analyst',phase:'lesson',slide:1}})));
 assert.equal(result.name,undefined);assert.equal(result.password,undefined);assert.equal(result.attempts[0].choice,undefined);assert.equal(result.attempts[0].activeSeconds,86400);assert.deepEqual(Object.keys(result.completed),['explorer:password']);assert.equal(result.cursor.slide,1);assert.equal(result.version,1);
 const rules=JSON.parse(await readFile(new URL('../database.rules.fragment.json',import.meta.url),'utf8')).sibermuhafiz_v1;assert.equal(rules['.read'],false);assert.equal(rules['.write'],false);assert.match(rules.users.$uid['.read'],/auth.uid === \$uid/);assert.match(rules.users.$uid['.write'],/auth.uid === \$uid/);assert.equal(rules.users.$uid.$other['.validate'],false);
 await assert.rejects(context.testClient.api('session'),error=>error.status===503);
});

