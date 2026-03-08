This repository contains my personal blog, built on [Jekyll-Bootstrap](https://github.com/plusjade/jekyll-bootstrap) and licensed under the [MIT License](LICENSE).

## Social card images (Open Graph / Twitter)

Posts can define a custom social preview image in front matter:

```yaml
og_image: "/assets/images/example.png"
og_image_width: 1200
og_image_height: 630
og_image_alt: "Optional accessible description"
```

If omitted, the site-level `default_og_image` fallback in `_config.yml` is used.
