<script lang="ts">
	export let checked = false;
</script>
<div class="flex">
	<label
		class="autoSaverSwitch relative inline-flex cursor-pointer select-none items-center"
	>
		<input
			type="checkbox"
			class="hidden"
			bind:checked={checked}
		/>
		<span
			class="slider flex h-[26px] w-[50px] items-center rounded-full bg-background-tertiary p-1 duration-200"
			class:bg-primary={checked}
		>
			<span
				class="h-[18px] w-[18px] rounded-full bg-white duration-200"
				class:translate-x-6={checked}
			></span>
		</span>
	</label>

</div>