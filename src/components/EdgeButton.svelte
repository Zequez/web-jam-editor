<script lang="ts">
  type Color = "purple" | "green";
  type ClosedIcon = "i-fa-eye-slash" | "i-fa-music";
  type OpenIcon = "i-fa-eye" | "i-fa-heart";

  type Props = {
    label: string;
    closedIcon: ClosedIcon;
    openIcon: OpenIcon;
    color: Color;
    isOpen: boolean;
    onclick: () => void;
  };

  let { label, closedIcon, openIcon, color, isOpen, onclick }: Props = $props();

  const colorClasses = {
    purple: {
      background: "bg-purple-400",
      openShadow: "shadow-purple-800",
      closedShadow:
        "shadow-transparent hover:shadow-purple-800 group-hover:shadow-purple-800",
    },
    green: {
      background: "bg-green-400",
      openShadow: "shadow-green-800",
      closedShadow:
        "shadow-transparent hover:shadow-green-800 group-hover:shadow-green-800",
    },
  } as const;

  const iconClasses = {
    "i-fa-eye": {
      hover: "group-hover:i-fa-eye",
      openColor: "text-purple-400",
    },
    "i-fa-heart": {
      hover: "group-hover:i-fa-heart",
      openColor: "text-red-400",
    },
  } as const;
</script>

<button
  {onclick}
  class={[
    `
      relative z-12 flex-cc
      h-full px1.5 pt-0.5
      group peer cursor-pointer
      font-mono font-semibold text-3.1 uppercase tracking-0.5px
      text-white text-shadow-[0_1px_0_#0007]
      rounded-b-.5 shadow-[0_0.5px_0px_0.5px]
      duration-0 transition-delay-100 transition-shadow
    `,
    colorClasses[color].background,
    {
      [colorClasses[color].openShadow]: isOpen,
      [colorClasses[color].closedShadow]: !isOpen,
    },
  ]}
>
  {label}
  <div class="flex-cc relative ml1 h-full w-4 mb0.5">
    <span
      class={[
        "relative z-10 scale-130 block",
        {
          [iconClasses[openIcon].openColor]: isOpen,
          [openIcon]: isOpen,
          [closedIcon]: !isOpen,
          [iconClasses[openIcon].hover]: !isOpen,
        },
      ]}
    ></span>
    <div class="absolute inset-0 flex-cc z-9">
      <span
        class={[
          "text-black/70 group-hover:text-black/70 top-1px scale-130 block relative",
          {
            [openIcon]: isOpen,
            [closedIcon]: !isOpen,
            [iconClasses[openIcon].hover]: !isOpen,
          },
        ]}
      ></span>
    </div>
  </div>
</button>
