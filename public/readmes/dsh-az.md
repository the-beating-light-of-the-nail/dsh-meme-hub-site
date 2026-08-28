# dsh-az

# dsh-az

**Azure CLI 的 DeepSeek Harness 插件** —— 让 dsh 智能体管理 Azure 资源：查询、展示、部署、诊断。

> 独立社区项目，非官方。基于 [Azure/azure-cli](https://github.com/Azure/azure-cli)（MIT）。

## 特性

- 7 个原生工具：`az_status` / `az_subscriptions` / `az_resource_query` / `az_show` / `az_activity_log` / `az_group_create` / `az_deploy`
- 所有查询 `--output json`，模型直接读结构化数据
- 支持 Bicep 与 ARM JSON 模板部署
- 写操作（group create / deploy）显式确认
- 延续微软系主题（与 SkillOpt / winget / wsl 同系列）

## 安装

```yaml
- insert:
    - id: az
      name: './src/index.js'
      config:
        azPath: az
        subscription: <your-sub-id>
```

## 许可

MIT。
