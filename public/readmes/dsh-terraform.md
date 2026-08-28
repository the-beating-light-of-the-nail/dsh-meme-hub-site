# dsh-terraform

# dsh-terraform

**HashiCorp Terraform 的 DeepSeek Harness 插件** —— 让 dsh 智能体管理基础设施即代码（IaC）：
plan/apply 门控、state 检查、output 查询、资源校验。

> 独立社区项目，非官方。基于 [hashicorp/terraform](https://github.com/hashicorp/terraform)（BSL-1.1/MPL-2.0）。

## 特性

- 8 个原生工具：`tf_init` / `tf_plan` / `tf_apply` / `tf_destroy` / `tf_state` / `tf_output` / `tf_show` / `tf_validate`
- 只读操作为主（plan/state/output/show/validate），安全边界清晰
- plan 的 `-detailed-exitcode` 语义（exit 2 = 有变更）在输出中标注
- 支持 plan 文件模式（`plan -out` → `apply tfplan`）——可复现、可审阅
- Schemastery 配置 + bundle patch 层

## 安装

```yaml
- insert:
    - id: terraform
      name: './src/index.js'
      config:
        terraformPath: terraform
        workdir: ./infra
```

```bash
pnpm dsh web --patch ./dsh-terraform/cordis.patch.yml
```

## 配置项

| 键 | 默认 | 说明 |
|---|---|---|
| `terraformPath` | `terraform` | terraform 路径 |
| `workdir` | — | 默认配置目录 |
| `timeoutMs` | `120000` | 单次超时 |

## 许可

MIT。
