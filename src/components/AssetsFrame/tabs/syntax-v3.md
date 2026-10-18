# Web Jam Syntax v3
**Agent Syntax Reference**

## 1. Pug → HTML

Web Jam uses **Pug**, an indentation-based templating language that compiles to HTML.

**Always use spaces for indentation, never tabs.**

```pug
main
  h1 Hello, world!
  p This is a paragraph.
  button(type="button") Click me
```

- Indentation defines element nesting.
- Write the tag name followed by its text content.
- Use parentheses for standard HTML attributes.
- Use `=` to output an evaluated JavaScript expression.

```pug
p= message
a(href="/about") About
```

## 2. Mixins

Pug mixins define reusable elements. Declare a mixin with `mixin` and invoke it with `+`.

```pug
mixin Greeting(name)
  p Hello, #{name}!

+Greeting("World")
```

Mixins accept parameters and contain arbitrary Pug markup.

## 3. Multiple HTML Roots

Use `html(name="page-name")` to define separate HTML page outputs.

```pug
html(name="index")
  main
    h1 Home

html(name="about")
  main
    h1 About
```

The default page is `index`. An `html()` root without a `name` attribute, or with `name=""`, generates the `index` page. Named roots generate their corresponding pages.

## 4. Atomic CSS

Web Jam uses **UnoCSS with the Tailwind CSS 4 preset and the Variant Groups transformer**.

Write atomic CSS utilities inside Web Jam's special Pug bracket syntax:

```pug
div[flex items-center gap4 p4 bg-white rounded-lg shadow]
  h1[text-8 font-bold text-gray-900] Hello
  p[text-4 text-gray-600] Welcome to Web Jam.
```

The contents of `[...]` compile into the element's `class` attribute. Conceptually:

```pug
div[flex items-center p4]
```

compiles to:

```pug
div(class=`flex items-center p4`)
```

### JavaScript interpolation

Use JavaScript template-string expressions inside atomic brackets:

```pug
div[flex p4 ${isActive ? 'bg-green-100' : 'bg-gray-100'}]
```

Expressions such as `${variable}` are evaluated as part of the generated class string. Use them for dynamic and conditional styling.

### Variant groups

Use parentheses to apply variants to multiple utilities:

```pug
div[
  bg-white
  hover:(bg-gray-100 shadow-lg)
  md:(bg-red text-40)
]
```

`hover:(...)` applies utilities on hover; `md:(...)` applies them at the medium breakpoint.

### Numeric text sizing

Prefer explicit numeric text utilities such as `text-4`, `text-6`, and `text-8` instead of `text-sm`, `text-md`, or `text-xl`.

The numeric size follows the UnoCSS preset's scale, where each unit represents `0.25rem`.

| Utility | Font size |
|---|---:|
| `text-4` | `1rem` |
| `text-6` | `1.5rem` |
| `text-8` | `2rem` |

A slash specifies the line height separately:

```pug
p[text-6/12] Example text
```

Here, `text-6/12` means a font size of `1.5rem` and a line height of `3rem` (`12 × 0.25rem`). This uses the numeric utility scale provided by the UnoCSS preset, rather than Tailwind's named font-size scale.

## 5. Flex Alignment Extension

Web Jam supports `flex-##` as a compact flex alignment utility.

The first character specifies cross-axis alignment; the second specifies main-axis alignment.

| Character | Alignment |
|---|---|
| `c` | Center |
| `e` | Flex end |
| `s` | Flex start |
| `_` | Stretch |

```pug
div[flex-cc]
  p Centered on both axes
```

Examples: `flex-sc` aligns to the cross-axis start and centers on the main axis; `flex-ce` centers on the cross axis and aligns to the main-axis end.

## 6. Spacing Shorthands

Prefer compact spacing utilities:

| Standard | Compact |
|---|---|
| `p-4` | `p4` |
| `px-4` | `px4` |
| `py-4` | `py4` |
| `m-4` | `m4` |
| `gap-4` | `gap4` |

The form `p-x-4` is also accepted as an alternative to `px-4`. Use standard UnoCSS utilities when no compact extension exists.

## 7. YAML Filter

Use `:yaml` to declare JavaScript variables from YAML. Each root key generates a corresponding destructuring declaration.

```pug
:yaml
  title: Welcome
  subtitle: Build something useful

main
  h1= title
  p= subtitle
```

Conceptually, the root keys generate declarations of the form:

```js
const { title } = ...
const { subtitle } = ...
```

Use the resulting variables throughout the Pug markup.

## 8. HTML Attributes and Syntax Order

**Critical rule: atomic brackets always come before HTML attribute parentheses.**

Correct:

```pug
div[bg-red](title="ARS")
```

Incorrect:

```pug
div(title="ARS")[bg-red]
```

Use `[...]` for atomic classes and `(...)` for standard HTML attributes. The brackets come first, even when an element has several attributes.

Prefer explicit `id` attributes only where an ID is useful, such as an anchor target, label association, or JavaScript lookup.

```pug
main(id="main-content")
  section[flex flex-col gap4 p6]
    h1[text-8 font-bold] Page title
    button[bg-gray-200 rounded-full p2](type="button" aria-label="Close")
      icon-fa-xmark
```

Avoid conventional Pug `.class` and `#id` shorthand. Prefer atomic brackets for classes and explicit attributes for IDs.

## 9. Icons

Web Jam icons are rendered using **font-based glyphs, not SVG**. Icon names are atomic utilities placed inside the brackets.

| Prefix | Style |
|---|---|
| `icon-fa-<glyph>` | Font Awesome Solid |
| `icon-far-<glyph>` | Font Awesome Regular |
| `icon-fab-<glyph>` | Font Awesome Brands |

```pug
button[flex items-center gap2]
  div[icon-fa-house]
  span Home

div[icon-far-heart]
div[icon-fab-github]
```

Replace `<glyph>` with the available glyph name in Web Jam's generated icon font.

## 10. Agent Rules

1. Write Pug with spaces for indentation, never tabs.
2. Use indentation to express element nesting.
3. Use mixins for reusable structures.
4. Use `html(name="...")` for separate page outputs; the default is `index`.
5. Put atomic CSS inside `[...]`; do not use conventional `.class` or `#id` shorthand.
6. Always put atomic brackets **before** HTML attribute parentheses.
7. Prefer compact utilities such as `p4`, `px4`, and `gap4`.
8. Prefer numeric text utilities such as `text-4`, `text-6`, and `text-8`.
9. Use `${...}` inside atomic brackets for JavaScript interpolation.
10. Use `flex-##` for common flex alignment combinations.
11. Use `:yaml` for YAML-based variable declarations.
12. Use icon utilities inside atomic brackets, such as `icon-fa-house`.
13. Prefer semantic HTML, responsive layouts, and readable source code.
14. Do not invent unsupported syntax, directives, libraries, or framework features.

## 11. Reference Documentation

- Pug: https://pugjs.org/api/getting-started.html
- UnoCSS: https://unocss.dev/
- Tailwind CSS 4: https://tailwindcss.com/docs

**Core rule:** Generate concise, readable Pug using Web Jam's atomic bracket syntax and documented extensions.