# Syntax

Web Jam combines **Pug** for writing page structure with **atomic CSS** for styling. Together, they let you build complete websites in a compact, readable format.

## Pug — Structure

Pug is a template language that compiles into HTML. Instead of writing opening and closing tags, you use indentation to express nesting.

```pug
section
  h1 Welcome!
  p A little space on the web.
  a(href="/about") Learn more
```

This creates a section containing a heading, a paragraph, and a link.

**The basics**

- Element names become HTML tags: `div`, `h1`, `p`, `a`.
- Indentation defines parent-child relationships.
- Attributes go in parentheses: `a(href="/about")`.
- Text follows the element name, separated by a space.
- IDs and classes can use familiar shorthand: `#app`, `.card`.

[Explore the Pug documentation](https://pugjs.org/language/attributes.html)

## Atomic CSS — Styling

Atomic CSS builds designs from small, single-purpose utility classes. Instead of defining a separate CSS class for every component, you combine utilities directly where you need them.

```pug
div(class="flex gap-4 p-4 rounded-xl bg-white")
  h2(class="text-xl font-bold") Hello
  p(class="text-gray-600") Welcome to Web Jam.
```

Each utility controls a particular aspect of the design: layout, spacing, colors, typography, borders, and more.

Web Jam uses utility classes compatible with its atomic CSS workflow. Tailwind CSS and UnoCSS provide useful references for understanding this approach.

- [Tailwind CSS — Utility classes](https://tailwindcss.com/docs/styling-with-utility-classes)
- [UnoCSS — Attributify mode](https://unocss.dev/presets/attributify)

## Experimental Atomic Classes Pug Extension

Web Jam is experimenting with a more compact way to write utility classes directly in Pug attributes.

Instead of putting all utilities inside a `class` string, the proposal lets you express them as individual attributes:

```pug
//- Conventional utility classes
div(class="flex items-center gap-4 p-4 text-6/12 md:(bg-white text-12)" title="Hey")

//- UnoCSS Attributify Mode
div(flex items-center gap-4 p-4 text="6/12" md="bg-white text-12" title="Hey")

//- Experimental syntax sugar
div[flex items-center gap-4 p-4 text-6/12 md:(bg-white text-12)](title="Hey)
```

**This syntax is experimental.** It is active in Web Jam, but it is not standard Pug syntax. Its exact rules and supported features may evolve as the proposal develops.

# Multiple Pages

By generating multiple root HTML elements with a `name` attribute you can indicate the compiler to generate multiple separate HTML pages outputs.

```
html
  body
    div Hello world
    a[block text-blue underline](href="about") About page

html(name="about")
  body
    div About page
    a[block text-blue underline](href=".") Go home
```

You can also do this:

```
mixin Page(name="")
  html(name=name)
    body
      block

+Page()
  div Hello world
  a[block text-blue underline](href="about") About page

+Page("about")
  div About page
  a[block text-blue underline](href=".") Go home
```