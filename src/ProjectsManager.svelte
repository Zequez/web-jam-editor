<script lang="ts">
  import { get, set } from "idb-keyval";
</script>

{#snippet ProjectBtn(name: string)}
  <div class="px-2 flex">
    <div class="pl-2">{name}</div>
    <div class="grow"></div>
    <div>[local]</div>
  </div>
{/snippet}

<div class="flex w-full h-full">
  <div class="bg-gray-600 w-60 text-white">
    <div class="font-mono text-center py3 bg-white/10">
      Ezequiel's Web Builder
    </div>
    <div class="font-mono py-3">
      <div class="">
        foo
        <div class="i-fa-cube"></div>
      </div>
      <div class="">bar [local]</div>
      <div class="">ezequiel [local]</div>
      <div class="">potato [gdrive]</div>
    </div>
    <div class="flex-cc">
      <button
        class="bg-emerald-400 uppercase tracking-1.5px font-semibold py1 px2 rounded-1 hover:bg-emerald-300 cursor-pointer"
        >New</button
      >
      <button
        class="bg-emerald-400 uppercase tracking-1.5px font-semibold py1 px2 rounded-1 hover:bg-emerald-300 cursor-pointer"
        >Open</button
      >
      <button
        class="bg-emerald-400 uppercase tracking-1.5px font-semibold py1 px2 rounded-1 hover:bg-emerald-300 cursor-pointer"
        >Sync</button
      >
    </div>
    <div class="flex-cc"></div>
  </div>
  <div></div>
</div>
