(function (root) {
  'use strict';
  const number = (value, fallback, min, max, step=1) => {
    const n=Number(value);
    return Number.isFinite(n) ? Math.max(min,Math.min(max,Math.round(n/step)*step)) : fallback;
  };
  function clean(values={}) {
    if (!values || typeof values!=='object') values={};
    return {
      forwardSpeed:number(values.forwardSpeed,1,1,10000), flightSpeed:number(values.flightSpeed,16,1,80),
      jumpMultiplier:number(values.jumpMultiplier,4,1,20,0.5), boostSpeed:number(values.boostSpeed,300,1,10000),
      flight:values.flight===true, superJump:values.superJump!==false,
      invincible:values.invincible!==false, doubleJump:values.doubleJump!==false
    };
  }
  function create(saved,write) {
    const presets=[
      {id:'preset-cruise',name:'Cruise',values:clean({})},
      {id:'preset-flight',name:'Flight',values:clean({flight:true,forwardSpeed:5})},
      {id:'preset-jump',name:'Big jumps',values:clean({jumpMultiplier:12})},
      {id:'preset-turbo',name:'Turbo',values:clean({forwardSpeed:100})}
    ];
    const name=value=>typeof value==='string' ? value.replace(/[\u0000-\u001f\u007f]/g,'').trim().replace(/\s+/g,' ').slice(0,32) : '';
    const ids=new Set();
    let profiles=(Array.isArray(saved)?saved:[]).filter(p=>p && typeof p.id==='string' && p.id.startsWith('custom-') && name(p.name) && !ids.has(p.id) && ids.add(p.id)).slice(0,8).map(p=>({id:p.id,name:name(p.name),values:clean(p.values)}));
    const clone=p=>p?{...p,values:{...p.values}}:null;
    const persist=()=>write(profiles.map(clone));
    let sequence=0;
    return {
      all:()=>[...presets,...profiles].map(clone),custom:()=>profiles.map(clone),
      get:id=>clone([...presets,...profiles].find(p=>p.id===id)),
      save(label,values) {
        const labelName=name(label);if(!labelName)throw new Error('Enter a name for this loadout.');
        const existing=profiles.find(p=>p.name.toLocaleLowerCase()===labelName.toLocaleLowerCase());
        if(!existing && profiles.length>=8)throw new Error('You can save eight loadouts. Delete one first.');
        let id=existing?.id;
        if(!id){do{id='custom-'+Date.now().toString(36)+'-'+(++sequence);}while(profiles.some(p=>p.id===id));}
        const next={id,name:labelName,values:clean(values)};
        if(existing)profiles=profiles.map(p=>p.id===id?next:p);else profiles.push(next);
        persist();return clone(next);
      },
      remove(id) {
        const length=profiles.length;profiles=profiles.filter(p=>p.id!==id);
        if(length===profiles.length)return false;persist();return true;
      }
    };
  }
  if(typeof module==='object' && module.exports)module.exports=create;else root.__srCreateLoadouts=create;
})(globalThis);
