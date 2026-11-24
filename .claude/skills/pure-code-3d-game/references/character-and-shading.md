# CharacterKit: anatomy, hybrid modeling, material and rig quality

## Distinguish 2 distinct defects
- **Cube person:** gameplay entity has exposed cuboid torso/limbs because the generator substitutes basic BoxGeometry for anatomy. Fix topology: measured body proportions, lofted profile sections, smooth union of anatomy, actual fingers/boots/face silhouette where visible.
- **Rubber/clay person:** SDF topology is continuous but the face/armor/cloth boundaries are smeared; materials have undifferentiated albedo/roughness. Fix *hard-vs-soft segmentation*: separate bevel/trim/visor/cloth panels; appropriate normals, roughness, reflection/IBL; maintain geometry joints. **v4.2: the primary fix is the SDF sculpting method in references/sdf-character-method.md — `smin` fusion (never `min` hard union), ellipsoid/tapered-tube primitives, hard-coded `LEN` proportions, solver-driven pose, shader-drawn clothing detail, and a hide-face design. A capsule-assembled body is not a fixable variant of this defect; it is a different defect (see the bans in SKILL.md).**

## Character pipeline
1. `CharacterRecipe`: stature/head/body ratios, landmarks, silhouette target, intended visual style, material groups, rig spec, animation clips and permitted LOD.
2. `Anatomy`: skeleton landmarks and dimension audit. Refer to Cold Smoke `human/src/01_params.js`, `02_skeleton.js`, `05_measure.js` for a 59-bone, tape-measured approach. Do not blindly adopt adult-human ratios for creatures/stylized designs.
3. `Organic`: lofted superellipse profiles and/or narrow-band SDF Surface Nets for natural limbs, torso and facial contours; gradient and topology validation; cache generated meshes by recipe+generator version.
4. `Hard-surface`: distinct beveled extruded helmet, face plates, jaw, seams, boots, gloves, goggles and props. Boxes may be used for hidden constraints and deliberate architecture, not as the final hero's visible arms/torso.
5. `Shading`: separate roughness/metalness by material group; procedural fabric weave, panel seams and subtle skin scattering where appropriate. Use controlled IBL/sky/environment lighting so metal does not become dark rubber. Test under flat lighting as well as cinematic lighting.
6. `Rig`: one driver skeleton per actor, IK for joints, one phase clock; post-pose grounding constraints; stable pose retargeting to presentation mesh. Do not chain damped springs across joints.
7. `Lab`: inspect at fixed front 3/4, profile, rear, close-up and action poses. Save screenshots with known viewport, seed and version; export geometry counters from *actual* generated vertex/index arrays, not hand-entered estimates.

## Numeric assertions
No NaN/Infinity vertices or matrices; valid index bounds and normals; joint weights sum ≈1; no unintended detached pieces; feet/contact under stress poses; meaningful material groups; viewport-size-specific silhouette check. A numeric vertex minimum is only a coarse complexity sanity check, not an artistic score. A 20k-poly mud blob still fails review.

## Geometry metadata contract
```json
{
  "generatedBy": "character-lab",
  "generatorCommit": "ACTUAL_SHA",
  "recipeId": "hero-01",
  "vertices": 8000,
  "triangles": 12000,
  "distinctMaterials": 4,
  "invalidVertices": 0,
  "invalidBoneWeights": 0,
  "invalidTransforms": 0,
  "bodyPrimitiveBoxes": 0
}
```
`generatedBy` text alone is **not cryptographic provenance**. CI can verify ranges and files; a human or trusted browser automation must verify the pictured character and metadata source. The v3 tool deliberately refuses to certify beauty.

## Proven source
`https://github.com/huiskylabs/cold-smoke/tree/main/human` and `https://github.com/jeffierw/crazybike/blob/main/src/06_bikemesh.js` supply implementation ideas. The standalone zero-dependency starter does not contain their generated person meshes and does not masquerade as their modeling pipeline.

## v4.2 SDF 雕刻法（取代 v4.1 面部解剖路线）

v4.1 要求用参数化体积/Loft/Bézier 扫掠逐根做眉毛、睫毛、眼睑、鼻翼、嘴唇——该路线已废止。它是“橡皮人”问题的帮凶：脸部细节越多、恐怖谷越深，而且模型一次生成根本做不到。

Cold Smoke 雪装配方见 references/sdf-character-method.md；通用 RigRecipe 和算法路由见 references/rig-motion-kit.md 与 references/algorithm-routing.md。遮面、成人比例、骨数和网格分辨率按项目选择。

单一全局 smooth-SDF 确实不足以完成美观脸部——所以 v4.2 根本不做脸。需要露脸的项目：先过“像人”验收门（references/verification-gates.md §3.4），再经用户明确批准，另立专项；即便如此，眉毛/睫毛/发束的逐根建模也只是可选项，不是默认要求。详见 references/procedural-anatomy-motion.md 与 tools/procedural-core.mjs（后者只有示范级头部/双眉，没有完整骨骼蒙皮和电影级人脸；且默认人物设计不使用它们）。
