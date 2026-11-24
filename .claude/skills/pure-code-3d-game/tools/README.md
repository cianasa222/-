# GameKit 4.0 开发工具

通用入口参考 references/general-contract.md，init 默认为通用契约。下列原有资产实验室与架构脚手架属于 web3d 专项，新建时显式传 --profile web3d。

## Web 3D tools

- `gamekit.mjs`: initialize a **headless** module composition starter; enforce contracts, task path allowlists, basic code-only policy, and format-level release evidence requirements. Node >=20. `check` DOES NOT attest to visual quality.
- `character-lab.html`: independent WebGL2 character inspection tool. Choose a JSON file with `positions: number[]`, `indices: number[]`, optional `normals`, `materialIds`, `poses: {name: number[]}` and metadata. Capture front/side/rear/action views in a trusted browser and manually inspect. The exporter cannot validate a skeleton it has not loaded; it emits -1 in missing rig fields so the release gate fails.
- `../tests/test_gate.mjs`: deterministic positive and negative gate tests. Run `node --test tests/test_gate.mjs` from the Skill directory.

The Character Lab's JavaScript has been syntax checked, but a functioning WebGL2 context was unavailable in this authoring environment. Run it in a real WebGL2-capable browser before treating screenshots as proof.

3.1 新增 quality-contract.mjs 和 quality-example.json。复制 gamekit.mjs 时将这两个文件放在同一目录。碰撞、人体、特效与真实目标合同见 references/calibration.md；证据字段与旧项目迁移见 references/verification-gates.md。所有套件测试用 node --test tests/*.mjs。计算受影响节点的指纹用 node tools/gamekit.mjs keys . stages.json。stages.json 例：
```json
[{"id":"mesh","files":["game/actor.mjs","gamekit.json"],"deps":[],"toolchain":"node-24.22.3"}]
```

3.2 工具：light-rig.mjs 提供方向光正交矩阵与 GLSL 阴影查询，lighting-lab.html 通过 WebGL2 演示深度和着色两遍渲染。可从技能目录执行 python3 -m http.server 并打开 /tools/lighting-lab.html。分发 ZIP 的 Lighting-Lab.html 另包含同一演示的独立单文件版。参阅 references/lighting-and-shadows.md。

3.3：wardrobe.mjs 包含衣件截面网格和棉布、丝缎、薄区皮肤、眼镜薄透射着色函数；material-lab.html 可在同一服务器下比较四个材质样片。ZIP 内的 Material-Lab.html 已内联依赖。使用的光学近似与目标设备的验收方式详见 references/character-surfaces.md。

## v4.1 ProceduralCore and Strict Gate
新增 tools/procedural-core.mjs、tools/procedural-gate.mjs、tools/procedural-README.md，自动化测试 tests/test_procedural_core.mjs 和 tests/test_procedural_gate.mjs（新增 19/19 PASS）。使用 node --test tests/test_procedural_core.mjs tests/test_procedural_gate.mjs，并在需要严格世界的项目运行 node tools/procedural-gate.mjs <project-dir>；可复现算法不等于实际 GPU/人物质量验收。
