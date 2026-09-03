# Moon Notes

一个简单的个人博客网站，用于练习静态网页、GitHub Pages 和 GitHub 项目配置。

## 本地预览

这个项目是纯静态页面，直接打开 `index.html` 即可预览。

也可以使用任意静态服务器，例如：

```bash
python3 -m http.server 8000
```

然后访问：

```text
http://localhost:8000
```

## GitHub Pages

仓库已包含 `.github/workflows/static.yml`。

如果在 GitHub 仓库设置里把 Pages 的 Source 配置为 GitHub Actions，推送到 `main` 或 `master` 后会自动部署。
