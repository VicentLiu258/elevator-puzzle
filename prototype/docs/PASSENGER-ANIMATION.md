# 乘客走路、转身与站稳（2026-10-28）

六种原有玩偶均重新生成并导出FBX；每位玩偶保留Body以及WalkLeg_L/R、WalkArm_L/R四个可动节点。髋关节与肩关节原点由Blender生成脚本保存，继续使用Cocos Creator3.8.8，不增加外部素材或引擎依赖。原有衣服、携带物及材质保持。

Diorama使用门口路径点完成上客/下客，朝向随路径逐步转动；双腿交替摆动、手臂小幅反摆、步伐轻微起伏。步相按实际走过的距离推进；接近终点减速，抵达后转向正面、脚步收回，最后有短暂落脚缓冲。原站位、载重与收益公式不改变。

在上客动画尚未完成时点击关门，显示「乘客站稳后自动关门」。营业归零自动关门也等待站稳。动画等待仍消耗营业时间。暂停与切后台冻结脚步与路径。到站门完全打开后才开始下客，结算面板等乘客走完出口路径再显示；原有结算唯一性不变。

修改入口：art/generate_diorama.py、art/elevator-dolls.blend、六种FBX及导入meta、Diorama.ts、PrototypeUI.ts。`--no-render` 可跳过风格预览PNG渲染。

验证：Creator库内六个导入Prefab逐一检查，全部包含四个四肢节点；髋原点约(±0.14,0.44,0)，肩原点约(±0.30,0.80,0)。全工程TypeScript检查通过，18组核心回归测试通过。实际Web构建成功。桌面试玩观察到点选上客后转向、迈步，提前关门出现等待提示，随后正常送达并结算学生首趟17。

构建过程出现Creator编辑器窗口恢复配置JSON诊断（用户目录window.json），但Web构建任务成功完成，未修改用户的全局编辑器配置。实际浏览器加载无warning/error。手机真机动作与性能仍未实测。

最终步速版再次在实际构建中完成首趟：提前关门正确等待，学生安全送达后正常进入第二趟，累计17，浏览器warning/error为空。操作截图 `passenger-walking.png`；发布包由原48个文件增至72个文件，主要来自可动四肢的网格资源。

已同步原域名 https://elevator.aiboomprompt.com/ 。Vercel生产部署 `dpl_2ixEz7Jf7JSmJDp6etDTiRjRP2pb`，READY。线上逐文件SHA256校验结果保存在 `live-file-verification.json`。
