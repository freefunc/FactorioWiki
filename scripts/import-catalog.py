"""Import pinned FactorioLab game exports. No hand-maintained recipe allowlist."""
import json, sys, shutil, subprocess, re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
REV='b74bcd7dd53af83c68384373932689fffe402fe8'
VERSION='2.1.20'
upstream=Path(sys.argv[1]).resolve()
assert subprocess.check_output(['git','rev-parse','HEAD'],cwd=upstream,text=True).strip()==REV, 'Unexpected source revision'
old=json.loads((ROOT/'src/data/recipes.json').read_text())
legacy={r['id']:r for r in old['entries']}
craft_machines={'assembling-machine-1','assembling-machine-2','assembling-machine-3','stone-furnace','steel-furnace','electric-furnace','oil-refinery','chemical-plant','centrifuge','foundry','electromagnetic-plant','biochamber','cryogenic-plant','recycler','crusher','rocket-silo'}
result={'version':VERSION,'commit':REV,'source':'https://github.com/factoriolab/factoriolab/tree/'+REV,'officialSource':'https://github.com/wube/factorio-data/tree/40ec3dbe6f88a96899bbd2fefbd6800cac6c1e71','datasets':{}}
for scope,code in [('base','2.1'),('space','2x1')]:
 directory=upstream/'public/data'/code
 raw=json.loads((directory/'data.json').read_text()); zh=json.loads((directory/'i18n/zh.json').read_text())
 assert all(v==VERSION for v in raw['version'].values())
 items={x['id']:{**x,'name':zh['items'].get(x['id'],x['name']),'english':x['name']} for x in raw['items'] if x['category']!='technology'}
 
 if 'landing-pad-unloading-bay' in items: items['landing-pad-unloading-bay']['name']='着陆坪卸货区'
 entries=[]
 for recipe in raw['recipes']:
  flags=recipe.get('flags',[])
  if 'technology' in flags or 'burn' in flags or not craft_machines.intersection(recipe.get('producers',[])): continue
  rid=recipe['id']; prior=legacy.get(rid,{})
  base_id=rid.removesuffix('-recycling')
  original_category=items.get(base_id,{}).get('category',recipe['category']) if 'recycling' in flags else recipe['category']
  category={'intermediate-products':'materials','other':'materials'}.get(original_category,original_category)
  title=zh['recipes'].get(rid,zh['items'].get(rid,recipe['name']))
  if 'recycling' in flags and base_id in items: title=items[base_id]['name']+'（回收）'
  title={'iron-ore-melting':'铁矿石熔炼','copper-ore-melting':'铜矿石熔炼','landing-pad-unloading-bay':'着陆坪卸货区'}.get(rid,title)
  if base_id.endswith('-science-pack'): category='science'
  if base_id in {'boiler','steam-engine','solar-panel','accumulator','nuclear-reactor','heat-pipe','heat-exchanger','steam-turbine','fusion-reactor','fusion-generator','heating-tower'}: category='power'
  def components(values):
   return [{'id':key,'amount':round(value,10),'fluid':'fluid' in items[key].get('types',[])} for key,value in values.items()]
  entries.append({'id':rid,'name':title,'english':recipe['name'],'category':category,'kind':'recipe','scope':scope,'recipeType':'recycling' if 'recycling' in flags else ('launch' if recipe.get('part') else 'craft'),'seconds':recipe['time'],'ingredients':components(recipe.get('in',{})),'results':components(recipe.get('out',{})),'producers':recipe.get('producers',[]),'locations':recipe.get('locations',[]),'icon':recipe.get('icon',rid),'aliases':prior.get('aliases',[])+([prior['name']] if prior.get('name') else []),'conditions':prior.get('conditions',[]) if prior.get('scope')==scope or prior.get('scope')=='base' else [],'source':f'https://github.com/factoriolab/factoriolab/blob/{REV}/public/data/{code}/data.json'})
 assert len({r['id'] for r in entries})==len(entries)
 result['datasets'][scope]={'entries':entries,'items':items,'icons':{i['id']:i for i in raw['icons']},'locations':{l['id']:zh.get('locations',{}).get(l['id'],l['name']) for l in raw['locations']},'mods':raw['version'],'upstreamRecipeRecords':len(raw['recipes']),'researchRecordsExcluded':sum('technology' in r.get('flags',[]) for r in raw['recipes'])}
 (ROOT/'public/assets').mkdir(exist_ok=True)
 shutil.copy2(directory/'icons.webp',ROOT/'public/assets'/f'{scope}-icons.webp')
 print(scope,len(entries),'recipes;',sum(r['recipeType']=='recycling' for r in entries),'recycling')
(ROOT/'src/data/catalog.json').write_text(json.dumps(result,ensure_ascii=False,separators=(',',':'))+'\n')
(ROOT/'public/licenses').mkdir(exist_ok=True)
shutil.copy2(upstream/'LICENSE',ROOT/'public/licenses/factoriolab.txt')
