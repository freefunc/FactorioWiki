"""Extract curated literal recipe fields from the pinned official prototype checkout.

This is deliberately not a Lua evaluator. Unknown or dynamic ingredient fields fail
closed. Runtime mod changes are not evaluated; see README for the data boundary.
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VERSION = '2.1.20'
COMMIT = '40ec3dbe6f88a96899bbd2fefbd6800cac6c1e71'
CURATED = '''
iron-plate|铁板|materials|base|最常用的基础金属材料，由铁矿石冶炼而成。
copper-plate|铜板|materials|base|电路与电缆生产的基础金属材料。
steel-plate|钢材|materials|base|从铁板进一步冶炼，用于建筑、轨道与高级制造。
stone-brick|石砖|materials|base|石料加工产物，可用于建筑与铺设道路。
iron-gear-wheel|铁齿轮|materials|base|传送带、机械与制造设备的常用中间产物。
copper-cable|铜线|materials|base|由铜板制成，是电子电路的重要原料。
electronic-circuit|电子电路|materials|base|基础电路，广泛用于自动化生产与机器制造。
advanced-circuit|高级电路|materials|base|结合塑料与基础电路，用于高级设备和科研。
processing-unit|处理器|materials|base|需要硫酸参与制造的高级电子中间产物。
plastic-bar|塑料棒|materials|base|煤与石油气的化工产物，用于高级电路等配方。
sulfur|硫磺|materials|base|石油加工链的重要中间产物。
battery|电池|materials|base|由金属与硫酸加工，用于蓄电池和其他电力设备。
engine-unit|内燃机|materials|base|由钢材、齿轮与管道制造的机械中间产物。
electric-engine-unit|电动机|materials|base|在内燃机基础上进一步加工，需要润滑油。
transport-belt|传送带|logistics|base|基础物品运输设施，适合早期工厂物流。
fast-transport-belt|高速传送带|logistics|base|由基础传送带升级，提升运输能力。
express-transport-belt|极速传送带|logistics|base|需要润滑油的传送带升级配方。
underground-belt|地下传送带|logistics|base|让物品流穿过建筑或其他生产线下方。
splitter|分流器|logistics|base|分配与合并传送带上的物品流。
inserter|机械臂|logistics|base|在机器、容器与传送带之间搬运物品。
fast-inserter|快速机械臂|logistics|base|为吞吐需求更高的生产环节搬运物品。
long-handed-inserter|加长机械臂|logistics|base|跨越更远距离取放物品的机械臂。
pipe|管道|logistics|base|连接化工设备，输送水、蒸汽和其他流体。
pump|管道泵|logistics|base|用于控制流体流向和流体系统连接。
assembling-machine-1|组装机 1 型|production|base|用于建立自动化生产线的入门组装设备。
assembling-machine-2|组装机 2 型|production|base|更高级的组装设备，支持需要流体的制造任务。
electric-mining-drill|电力采矿机|production|base|使用电能持续开采矿床，为生产线供应原料。
stone-furnace|石炉|production|base|使用燃料进行基础冶炼的早期设备。
electric-furnace|电炉|production|base|使用电能冶炼，减少对直接燃料供应的依赖。
chemical-plant|化工厂|production|base|生产塑料、硫磺、电池等化工产物。
oil-refinery|炼油厂|production|base|将原油送入石油加工链的核心设备。
boiler|锅炉|power|base|消耗燃料加热流体，为蒸汽发电提供蒸汽。
steam-engine|蒸汽机|power|base|利用蒸汽发电，是早期供电系统的核心设备。
solar-panel|太阳能板|power|base|白天提供电力，可与蓄电池搭配使用。
accumulator|蓄电池|power|base|储存电能，在供电不足时补充电网需求。
automation-science-pack|自动化科技包|science|base|早期自动化研究使用的基础科技包。
logistic-science-pack|物流科技包|science|base|用传送带与机械臂制造，支持物流等研究。
chemical-science-pack|化工科技包|science|base|涉及石油化工与机械制造的科技包。
production-science-pack|生产科技包|science|base|面向高级生产技术的科技包。
utility-science-pack|效能科技包|science|base|使用高级电子和轻质结构等材料的科技包。
foundry|铸造厂|production|space|太空时代的冶金设备；制造配方带有地表条件。
electromagnetic-plant|电磁工厂|production|space|太空时代的电子制造设备；制造需要特定磁场条件。
biochamber|生物室|production|space|太空时代的生物加工设备；制造配方带有地表条件。
cryogenic-plant|低温工厂|production|space|太空时代的低温加工设备；制造配方带有地表条件。
turbo-transport-belt|涡轮传送带|logistics|space|太空时代新增的传送带等级，使用钨板升级。
big-mining-drill|大型采矿机|production|space|太空时代的大型采矿设备，制造需要冶金材料。
superconductor|超导体|materials|space|太空时代的电子中间产物。
supercapacitor|超级电容|materials|space|太空时代的高级电子中间产物。
'''

def table(text, start):
    depth = 0
    quoted = False
    for index in range(start, len(text)):
        char = text[index]
        if char == '"' and (index == 0 or text[index - 1] != '\\'):
            quoted = not quoted
        if quoted:
            continue
        if char == '{':
            depth += 1
        elif char == '}':
            depth -= 1
            if depth == 0:
                return text[start:index + 1]
    raise ValueError('Unclosed table')

def rows(block, field):
    match = re.search(r'\b' + field + r'\s*=\s*{', block)
    if not match:
        raise ValueError(f'Missing literal {field}')
    raw = table(block, match.end() - 1)
    parsed = []
    for item in re.findall(r'{([^{}]+)}', raw):
        name = re.search(r'\bname\s*=\s*"([^"]+)"', item)
        amount = re.search(r'\bamount\s*=\s*(\d+(?:\.\d+)?)\s*(?:,|$)', item)
        if not name or not amount or any(key in item for key in ['probability', 'amount_min', 'amount_max']):
            raise ValueError(f'Unsupported item: {item}')
        parsed.append({'id': name[1], 'amount': float(amount[1]), 'fluid': bool(re.search(r'type\s*=\s*"fluid"', item))})
    if not parsed:
        raise ValueError(f'Empty {field}')
    return parsed

def main():
    import subprocess
    source = Path(sys.argv[1])
    actual = subprocess.check_output(['git', '-C', str(source), 'rev-parse', 'HEAD'], text=True).strip()
    if actual != COMMIT:
        raise ValueError(f'Expected pinned commit {COMMIT}, got {actual}')
    records = []
    for line in CURATED.strip().splitlines():
        ident, name, category, scope, summary = line.split('|')
        path = ('base' if scope == 'base' else 'space-age') + '/prototypes/recipe.lua'
        text = (source / path).read_text()
        match = re.search(r'{\s*type\s*=\s*"recipe",\s*name\s*=\s*"' + re.escape(ident) + '"', text)
        if not match:
            raise ValueError(f'Recipe not found: {ident}')
        block = table(text, match.start())
        energy = re.search(r'energy_required\s*=\s*([\d.]+)', block)
        conditions = []
        surface = re.search(r'surface_conditions\s*=\s*{', block)
        if surface:
            for condition in re.findall(r'{([^{}]+)}', table(block, surface.end() - 1)):
                prop = re.search(r'property\s*=\s*"([^"]+)"', condition)
                minimum = re.search(r'min\s*=\s*([\d.]+)', condition)
                maximum = re.search(r'max\s*=\s*([\d.]+)', condition)
                conditions.append({'property': prop[1], 'min': float(minimum[1]) if minimum else None, 'max': float(maximum[1]) if maximum else None})
        records.append({
            'id': ident, 'name': name, 'category': category, 'scope': scope,
            'summary': summary, 'kind': 'recipe',
            'aliases': {'electronic-circuit': ['绿板'], 'advanced-circuit': ['红板'], 'processing-unit': ['蓝板'], 'automation-science-pack': ['红瓶'], 'logistic-science-pack': ['绿瓶'], 'chemical-science-pack': ['蓝瓶']}.get(ident, []),
            'ingredients': rows(block, 'ingredients'), 'results': rows(block, 'results'),
            'seconds': float(energy[1]) if energy else 0.5,
            'timeDefault': not bool(energy), 'conditions': conditions,
            'source': f'https://github.com/wube/factorio-data/blob/{COMMIT}/{path}#L{text[:match.start()].count(chr(10)) + 1}',
        })
    target = ROOT / 'src/data/recipes.json'
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps({'version': VERSION, 'commit': COMMIT, 'entries': records}, ensure_ascii=False, indent=2) + '\n')
    print(f'Imported {len(records)} recipes from {VERSION} ({COMMIT})')

if __name__ == '__main__':
    main()
