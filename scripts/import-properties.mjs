/** Conservative extraction of literal properties from pinned official prototypes.
 * Does not execute Lua or guess values produced by unsupported function calls.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import luaparse from 'luaparse';
const root = path.resolve(import.meta.dirname, '..');
const upstream = path.resolve(process.argv[2] || '/tmp/factorio-official');
const revision = '40ec3dbe6f88a96899bbd2fefbd6800cac6c1e71';
if (execFileSync('git', ['rev-parse', 'HEAD'], { cwd: upstream, encoding: 'utf8' }).trim() !== revision) throw Error('Unexpected official source revision');
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'src/data/catalog.json')));
const origin = `https://github.com/wube/factorio-data/blob/${revision}/`;
const itemTypes = new Set(['item','gun','ammo','armor','capsule','repair-tool','rail-planner','item-with-entity-data','item-with-inventory','module','fluid']);
function literal(n) {
  if (!n) return undefined;
  if (['NumericLiteral','BooleanLiteral','StringLiteral'].includes(n.type)) return n.value;
  if (n.type === 'UnaryExpression' && n.operator === '-') { const v = literal(n.argument); return typeof v === 'number' ? -v : undefined; }
  if (n.type === 'BinaryExpression') {
    const a = literal(n.left), b = literal(n.right);
    if (typeof a === 'number' && typeof b === 'number') return ({ '+':()=>a+b, '-':()=>a-b, '*':()=>a*b, '/':()=>a/b, '^':()=>a**b })[n.operator]?.();
  }
  if (n.type === 'TableConstructorExpression') {
    const array = n.fields.every(f => f.type === 'TableValue');
    const out = array ? [] : {};
    n.fields.forEach((f,i) => {const v = literal(f.value); if (v !== undefined) out[array ? i : (f.key?.name || literal(f.key) || i)] = v;});
    return out;
  }
}
function walk(n, fn) {
  if (!n || typeof n !== 'object') return;
  fn(n);
  for (const [k,v] of Object.entries(n)) if (k !== 'loc') {
    if (Array.isArray(v)) v.forEach(x=>walk(x,fn)); else if (v && typeof v === 'object') walk(v,fn);
  }
}
function files(dir) { return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(dir,e.name)):e.name.endsWith('.lua')?[path.join(dir,e.name)]:[]); }
function load(mods) {
  const records = new Map(), updates = [];
  for (const mod of mods) for (const file of files(path.join(upstream,mod)).sort()) {
    const relative = path.relative(upstream,file);
    const ast = luaparse.parse(fs.readFileSync(file,'utf8'),{locations:true,encodingMode:'x-user-defined',luaVersion:'5.3'});
    if (relative.endsWith('base-data-updates.lua')) for (const stmt of ast.body) {
      if (stmt.type === 'AssignmentStatement') stmt.variables.forEach((variable,i) => {
        function access(n) {
          if(n?.type==='Identifier') return [n.name];
          if(n?.type==='MemberExpression') return [...(access(n.base)||[]),n.identifier.name];
          if(n?.type==='IndexExpression') return [...(access(n.base)||[]),literal(n.index)];
        }
        const keys=access(variable), v=literal(stmt.init[i]);
        if(keys?.[0]==='data' && keys[1]==='raw' && keys.length===5 && v!==undefined) updates.push({keys,v,source:origin+relative+'#L'+stmt.loc.start.line});
      });
    }
    walk(ast,n=> {
      if (n.type !== 'TableConstructorExpression') return;
      const typeField=n.fields.find(f=>f.key?.name==='type'), nameField=n.fields.find(f=>f.key?.name==='name');
      if (!typeField || !nameField) return;
      const type=literal(typeField.value), name=literal(nameField.value);
      if (typeof type !== 'string' || typeof name !== 'string') return;
      const p=literal(n);
      if (!['stack_size','max_health','action','attack_parameters','inventory_size','default_temperature','shape','energy_source','width'].some(k => p[k] !== undefined)) return;
      // Recipes and graphics share names with items; keep prototype types separate.
      records.set(`${type}:${name}`,{...p,source:origin+relative+'#L'+n.loc.start.line});
    });
    // Laser beam is constructed by make_laser_beam; extract its literal damage action.
    if (relative === 'base/prototypes/entity/beams.lua') walk(ast,n=> {
      if (n.type !== 'TableConstructorExpression' || !n.fields.some(f=>f.key?.name==='damage_interval')) return;
      const p=literal(n);
      if(p.type==='beam' && p.action && p.damage_interval===20 && !n.fields.some(f=>f.key?.name==='name')) records.set('beam:laser-beam',{...p,name:'laser-beam',source:origin+relative+'#L'+n.loc.start.line});
    });
  }
  for(const {keys,v,source} of updates) {
    const p=records.get(keys[2]+':'+keys[3]);
    if(p){p[keys[4]]=v; if(['max_health','inventory_size','trash_inventory_size','logistic_trash_inventory_size','crafting_speed','attack_parameters'].includes(keys[4])) p.overrideSource=source;}
  }
  return records;
}
const damageNames = {physical:'物理',fire:'火焰',laser:'激光',explosion:'爆炸',acid:'酸液',electric:'电击',poison:'毒素',impact:'撞击'};
function damageEffects(action, records, seen=new Set(), context={}) {
  if (!action || typeof action !== 'object') return [];
  if (Array.isArray(action)) return action.flatMap(x=>damageEffects(x,records,seen,context));
  const ctx={...context};
  if (action.type==='area' && action.target_entities!==false) ctx.radius=action.radius;
  if (action.type==='line') ctx.line=true;
  if (action.repeat_count) ctx.count=(ctx.count||1)*action.repeat_count;
  if (action.type==='cluster' || action.cluster_count) return [];
  let result=[];
  if (action.type==='damage' && typeof action.damage?.amount==='number' && action.damage.amount>0) result.push({amount:action.damage.amount,type:damageNames[action.damage.type]||action.damage.type,...ctx});
  for (const type of ['projectile','beam','artillery-projectile']) {
    const id=action[type==='artillery-projectile'?'projectile':type];
    const key=type+':'+id, p=records.get(key);
    if (p && !seen.has(key)) {
      const next=new Set(seen);next.add(key);
      result.push(...damageEffects(p.action,records,next,{...ctx,source:p.source}));
      result.push(...damageEffects(p.final_action,records,next,{...ctx,source:p.source}));
    }
  }
  for (const key of ['action','action_delivery','target_effects','final_action']) result.push(...damageEffects(action[key],records,seen,ctx));
  return result;
}
const fields = [
 ['max_shield_value','护盾容量',''],['power','发电功率',''],['max_health','生命值',''],['inventory_size','储物容量',' 格'],['trash_inventory_size','回收栏',' 格'],['logistic_trash_inventory_size','回收栏',' 格'],
 ['crafting_speed','制造速度',''],['mining_speed','采矿速度',''],['resource_searching_radius','采矿半径',' 格'],
 ['module_slots','插件槽',' 个'],['energy_usage','工作能耗',''],['energy_consumption','能量消耗',''],
 ['production','最大发电功率',''],['max_power_output','最大输出功率',''],['pumping_speed','泵送速率',' 单位／秒',60],
 ['max_distance','地下连接距离',' 格'],['maximum_wire_distance','电线连接距离',' 格'],
 ['supply_area_distance','供电半径',' 格'],['logistics_radius','物流覆盖半径',' 格'],['construction_radius','建造覆盖半径',' 格'],
 ['robot_slots_count','机器人槽',' 格'],['material_slots_count','修理包槽',' 格'],
 ['inventory_size_bonus','角色背包加成',' 格'],['fuel_acceleration_multiplier','燃料加速倍率',' ×'],['fuel_top_speed_multiplier','燃料极速倍率',' ×'],['durability','耐久度',''],['magazine_size','每份弹药发数',' 发'],
];
const output={version:'2.1.20',revision,source:origin,method:'Literal official prototypes; normal quality, no research bonuses. Unsupported computed fields are omitted.',datasets:{}};
for (const [scope,mods] of [['base',['base']],['space',['base','elevated-rails','quality','recycler','space-age']]]) {
  const records=load(mods), ds=catalog.datasets[scope], result={};
  for (const item of Object.values(ds.items)) {
    const ip=[...itemTypes].map(t=>records.get(t+':'+item.id) || (t==='fluid' ? records.get('fluid:'+item.id.replace(/-(165|500)$/,'')) : undefined)).find(Boolean);
    const entityName=ip?.place_result;
    const entity=entityName ? [...records.values()].find(p=>p.name===entityName && p.max_health!==undefined && !itemTypes.has(p.type)) : undefined;
    const equipment=ip?.place_as_equipment_result ? [...records.values()].find(p=>p.name===ip.place_as_equipment_result && p.type.endsWith('-equipment')) : undefined;
    const p=entity||equipment||ip;
    const rows=[],sources=new Set([catalog.source]);
    const add=(label,value,unit='')=> {if(value!==undefined && value!==null) rows.push({label,value,unit});};
    const isFluid=item.types.includes('fluid');
    add('物品类型',isFluid?'流体':({gun:'武器',ammo:'弹药',armor:'护甲',capsule:'胶囊／投掷物',module:'插件', 'repair-tool':'修理工具'}[ip?.type] || (entity?'可放置物品':'物品')));
    if(item.stack!==undefined) add('物品堆叠上限',item.stack,' 个／格');
    if(scope==='space' && item.rocketCapacity!==undefined) add('火箭运载上限',item.rocketCapacity,' 个／次');
    if(isFluid) {add('存储方式','管道、储液罐或液罐车厢');const temp=item.english.match(/\(([-\d.]+)°C\)/);if(temp)add('收录温度',Number(temp[1]),' °C');}
    const commonCount=rows.length;
    if(item.fuel) add(item.fuel.types.includes('fluid-heat')?'可用热量':'燃料热值',item.fuel.value,isFluid?' MJ／单位':' MJ');
    if(item.module) for(const [key,label] of [['speed','速度效果'],['consumption','能耗效果'],['productivity','产能效果'],['pollution','污染效果'],['quality','品质概率加成']]) {
      const v=item.module[key]; if(typeof v==='number') add(label,(v>0?'+':'')+Number((v*100).toFixed(4)),key==='quality'?' 个百分点':'%');
    }
    if(item.wagon) add(item.wagon.capacityType==='stacks'?'车厢货物容量':'车厢流体容量',item.wagon.capacity,item.wagon.capacityType==='stacks'?' 格':' 单位');
    if(ip?.equipment_grid) {
      const grid=records.get('equipment-grid:'+ip.equipment_grid);
      if(grid?.width && grid?.height){add('装备网格',`${grid.width} × ${grid.height}`,' 格');sources.add(grid.source);}
    }
    if(equipment?.shape?.width && equipment?.shape?.height) add('装备占格',`${equipment.shape.width} × ${equipment.shape.height}`,' 格');
    if(isFluid && p) {
      if(!item.english.match(/\(([-\d.]+)°C\)/)) add('默认温度',p.default_temperature,' °C');
      add('温度上限',p.max_temperature,' °C');add('比热容',p.heat_capacity,'／°C');
    }
    if(p) {
      sources.add(p.source); if(p.overrideSource) sources.add(p.overrideSource);
      for(const [key,label,unit,factor=1] of fields) if(p[key]!==undefined && ['string','number'].includes(typeof p[key])) add(key==='inventory_size' && p.type.includes('turret') ? '弹药槽' : label,typeof p[key]==='number'?p[key]*factor:p[key],unit);
      if(p.type==='storage-tank') add('流体容量',p.fluid_box?.volume,' 单位');
      for(const [key,label] of [['buffer_capacity','储能容量'],['input_flow_limit','最大充电功率'],['output_flow_limit','最大放电功率'],['drain','待机能耗']]) add(label,p.energy_source?.[key]);
      if(p.type==='container'||p.type==='logistic-container') add('占地',p.selection_box?.length===2 ? `${p.selection_box[1][0]-p.selection_box[0][0]} × ${p.selection_box[1][1]-p.selection_box[0][1]}` : undefined,' 格');
    }
    // FactorioLab already exports verified normal-quality machine and belt values.
    if(item.machine) {
      for(const [key,label,unit] of [['speed','制造／作业速度',''],['modules','插件槽',' 个'],['usage','工作能耗',' kW'],['drain','待机能耗',' kW']]) {
        if(!(key==='speed' && (p?.crafting_speed!==undefined || p?.mining_speed!==undefined)) && !rows.some(r=>r.label===label) && item.machine[key]!==undefined) add(label,item.machine[key],unit);
      }
      if(item.machine.size) add('占地',item.machine.size.join(' × '),' 格');
      sources.add(catalog.source);
    }
    if(item.belt){ add('传送吞吐量',item.belt.speed,' 个／秒');sources.add(catalog.source); }
    const attack=p?.attack_parameters || (item.category==='combat' ? ip?.capsule_action?.attack_parameters : null);
    let combat;
    if(attack) {
      add('射程',attack.range,' 格');add('最小射程',attack.min_range,' 格');
      if(typeof attack.cooldown==='number' && attack.cooldown>0) add('基础射速',60/attack.cooldown,' 次／秒');
      if(attack.damage_modifier!==undefined) add('伤害倍率',attack.damage_modifier,' ×');
      const categories=attack.ammo_categories || [attack.ammo_category].filter(Boolean);
      const ammo=attack.ammo_type ? [] : Object.keys(ds.items).filter(id=>categories.includes(records.get('ammo:'+id)?.ammo_category));
      combat={ammo,modifier:attack.damage_modifier??1,damage:damageEffects(attack.ammo_type,records)};
    }
    if(ip?.type==='ammo') {
      combat={ammo:[],modifier:1,damage:ip.name==='atomic-bomb' ? [] : damageEffects(ip.ammo_type,records)};
      if(ip.ammo_type?.range_modifier!==undefined) add('弹药射程倍率',ip.ammo_type.range_modifier,' ×');
      if(ip.ammo_type?.cooldown_modifier!==undefined) add('射击间隔倍率',ip.ammo_type.cooldown_modifier,' ×');
    }
    if(combat) for(const d of combat.damage) if(d.source) sources.add(d.source);
    if(rows.length || combat || p?.resistances) result[item.id]={rows,hasSpecificProperties:rows.length>commonCount || !!combat || !!p?.resistances,sources:[...sources],...(combat?{combat}:{}),...(p?.resistances?{resistances:p.resistances}: {})};
  }
  output.datasets[scope]=result;
  console.log(scope,Object.keys(result).length,'property cards');
}
fs.writeFileSync(path.join(root,'src/data/properties.json'),JSON.stringify(output,null,2)+'\n');
