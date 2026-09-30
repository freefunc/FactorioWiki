const root = 'https://github.com/wube/factorio-data/blob/40ec3dbe6f88a96899bbd2fefbd6800cac6c1e71/';
export default [
  {
    id: 'belt-throughput', name: '传送带吞吐量', category: 'mechanics', scope: 'base', kind: 'guide',
    aliases: ['黄带', '红带', '蓝带', '运输速度'],
    summary: '从原型速度理解基础、高速与极速传送带的运输能力。',
    sections: [
      { title: '三个基础等级', text: '2.1.20 原型定义中的速度分别为 0.03125、0.0625、0.09375 格／tick。按每秒 60 tick、每格每条侧道 4 个未堆叠物品计算，整条传送带的理论吞吐量分别为 15、30、45 个／秒。', table: [['传送带', '单侧 / 秒', '双侧 / 秒'], ['传送带', '7.5', '15'], ['高速传送带', '15', '30'], ['极速传送带', '22.5', '45']] },
      { title: '计算适用范围', text: '这里指未堆叠物品、两侧满载、持续运行时的理论输送量。实际产线可能受供料间隔、机械臂、分流器设置和下游堵塞影响。太空时代的物品堆叠需要单独计算。' },
    ], source: root + 'base/prototypes/entity/transport-belts.lua#L180', related: ['transport-belt', 'fast-transport-belt', 'express-transport-belt'],
  },
  {
    id: 'quality-levels', name: '品质等级', category: 'mechanics', scope: 'space', kind: 'guide',
    aliases: ['quality', '传奇', '史诗'], summary: '查看品质原型等级，以及品质对不同属性的影响。',
    sections: [
      { title: '品质等级并非等距', text: '品质模组定义了优秀、精良、史诗和传奇四种更高品质；其内部 level 分别为 1、2、3、5。传奇并不是 level 4。普通品质作为基础等级。', table: [['品质', '内部 level'], ['优秀（Uncommon）', '1'], ['精良（Rare）', '2'], ['史诗（Epic）', '3'], ['传奇（Legendary）', '5']] },
      { title: '按属性查阅，不套用一个百分比', text: '不同属性使用不同的品质规则。例如 2.1.20 的传奇品质原型将货运车厢容量倍率设为 2.5、机车功率倍率设为 2.0、铁路车辆最大速度倍率设为 1.15。不能把一个属性的倍率直接套在所有设备上。此功能来自品质模组，包含在太空时代扩展中。' },
    ], source: root + 'quality/prototypes/quality.lua', related: [],
  },
  {
    id: 'recipe-time', name: '配方时间与制造速度', category: 'mechanics', scope: 'base', kind: 'guide',
    aliases: ['产能', '速度', 'energy_required', 'crafting speed'], summary: '分清配方基础耗时、机器制造速度与最终产出。',
    sections: [
      { title: '配方里的秒数代表什么', text: '配方的 energy_required 表示基础制造时间，单位为秒；它不是机器的耗电量。未显式填写该字段时，RecipePrototype 的默认值为 0.5 秒。本 Wiki 对这类配方注明“原型默认值”。' },
      { title: '换算实际产出', text: '在持续运行且不考虑产能加成时：单次制造时间 = 配方基础耗时 ÷ 有效制造速度；每秒产出 = 每次产量 × 有效制造速度 ÷ 配方基础耗时。例如铁齿轮基础耗时为 0.5 秒，每次产出 1 个；有效制造速度为 1 时，理论产出为每秒 2 个。供电、原料、输出阻塞和插件会影响实际表现。' },
      { title: '当前配方的计算边界', text: '本 Wiki 展示官方原型中的单次投入与产出，不叠加品质、产能、插件、科技增益或第三方模组。查询太空时代建筑时，还应检查配方的地表条件。' },
    ], source: 'https://lua-api.factorio.com/2.1.20/prototypes/RecipePrototype.html#energy_required', related: ['iron-gear-wheel', 'assembling-machine-1', 'assembling-machine-2'],
  },
  {
    id: 'surface-conditions', name: '地表制造条件', category: 'mechanics', scope: 'space', kind: 'guide',
    aliases: ['星球', '压力', '磁场', 'Vulcanus', 'Fulgora'], summary: '理解太空时代配方中的压力与磁场限制。',
    sections: [
      { title: '材料齐全不一定能制造', text: '部分配方有 surface_conditions，只有当前地表满足条件时才能制造。例如铸造厂配方要求 pressure 恰好为 4000；电磁工厂配方要求 magnetic-field 至少为 99。这些条件描述制造配方的限制，不应直接解释成建筑只能在该地表使用。' },
      { title: '查阅原型条件', text: '本 Wiki 将这些条件显示在配方详情中，并保留官方属性名以便核对。条件数值来自固定的 2.1.20 数据快照；第三方模组可以修改它们。' },
    ], source: root + 'space-age/prototypes/recipe.lua#L1372', related: ['foundry', 'electromagnetic-plant', 'biochamber', 'cryogenic-plant'],
  },
];
