const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const create = fs.existsSync(__dirname+'/loadouts.js') ? require('./loadouts.js') : () => { throw new Error('Loadouts are not implemented'); };
test('named loadouts retain choices and can be updated without duplicating them', () => {
  let saved;
  const store=create([],list=>saved=list);
  const first=store.save('  My flight  ',{flight:true,forwardSpeed:12,jumpMultiplier:7.5,doubleJump:false,boostSpeed:180});
  assert.equal(first.name,'My flight');
  assert.equal(store.get(first.id).values.forwardSpeed,12);
  const second=store.save('my flight',{flight:false,forwardSpeed:45});
  assert.equal(second.id,first.id);
  assert.equal(saved.length,1);
  assert.equal(create(saved,()=>{}).get(first.id).values.forwardSpeed,45);
});
test('invalid stored loadouts cannot introduce invalid or out-of-range movement values', () => {
  const store=create([{id:'custom-old',name:'Bad data',values:{forwardSpeed:90000,flightSpeed:-5,jumpMultiplier:Infinity,boostSpeed:NaN,flight:'yes'}}],()=>{});
  assert.deepEqual(store.get('custom-old').values,{forwardSpeed:10000,flightSpeed:1,jumpMultiplier:4,boostSpeed:300,flight:false,superJump:true,invincible:true,doubleJump:true});
});
test('deleting a custom loadout persists while built-ins cannot be deleted', () => {
  let saved=[];const store=create([],list=>saved=list);
  const custom=store.save('Weekend',{forwardSpeed:10});
  assert.equal(store.remove(custom.id),true);assert.equal(saved.length,0);
  assert.equal(store.remove('preset-flight'),false);
  assert.equal(store.get('preset-flight').values.flight,true);
});
test('empty names are rejected and profile count stays bounded', () => {
  const store=create([],()=>{});
  assert.throws(()=>store.save('   ',{}),/name/i);
  for(let i=0;i<8;i++)store.save('Ride '+i,{});
  assert.throws(()=>store.save('Too many',{}),/eight/i);
  assert.equal(store.custom().length,8);
});

test('saved loadouts preserve 1000x forward and boost speeds across reloads', () => {
  let saved;
  const store=create([],list=>saved=list);
  const entry=store.save('Maximum',{forwardSpeed:1000,boostSpeed:1000});
  const reloaded=create(saved,()=>{}).get(entry.id);
  assert.equal(reloaded.values.forwardSpeed,1000);
  assert.equal(reloaded.values.boostSpeed,1000);
});

test('loadouts preserve 10000x travel and boost speeds', () => {
  let saved; const store=create([],list=>saved=list);
  const entry=store.save('Extreme',{forwardSpeed:10000,boostSpeed:10000});
  const loaded=create(saved,()=>{}).get(entry.id);
  assert.equal(loaded.values.forwardSpeed,10000);
  assert.equal(loaded.values.boostSpeed,10000);
});
