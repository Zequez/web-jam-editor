<script lang="ts">
  let {
    checked = $bindable(),
    onchange,
    onManualBuild,
  }: {
    checked: boolean;
    onchange: () => void;
    onManualBuild: () => void;
  } = $props();
</script>

<label
  class={[
    "uppercase text-shadow-[0_1px_0_#0008] text-2.5 h-4 flex-cc px1 mr2 rounded-.5",
    {
      "bg-green-400 b b-white": checked,
      "bg-gray-500 b b-white/50": !checked,
    },
  ]}
>
  <input type="checkbox" bind:checked {onchange} class="mr1" />
  <span>Auto Build</span>
</label>

<button
  class="uppercase text-2.5 bg-blue-400 h-4 flex-cc rounded-.5 px-1 b b-white/50 hover:(brightness-115) cursor-pointer"
>
  Shift+Enter
</button>
