<script lang="ts">
	import { version } from '$app/environment';
	import { safeInsets } from '$lib/state';
	import MenuPage from '../MenuPage.svelte';
	async function wait(ms:number) {
		return new Promise(resolve => setTimeout(resolve, ms));
	}
	let clicked = false;
	function click() {
		if (clicked) animate();
		else {
			clicked = true;
			setTimeout(() => clicked = false, 600);
		}
	}
	let animating = false;
	let rotatedOutside = false;
	let showingBike = false;
	let wheelsSpinning = false;
	let move = false;
	async function animate() {
		if (animating) return;
		animating = true;
		rotatedOutside = true;
		await wait(2000);
		showingBike = true;
		await wait(2000);
		wheelsSpinning = true;
		await wait(500);
		move = true;
	}
</script>

<MenuPage>
	<div class="flex flex-col p-5 relative grow" style:padding-bottom="{Math.max($safeInsets.bottom, 20)}px">
		<div class="text-3xl font-bold text-info pl-2">Sobre</div>
		<div class="flex flex-col h-full px-5 py-10 gap-10 items-center">
			<div class="flex flex-col w-full gap-3 font-medium text-info leading-tight">
				<span>Esta aplicação é uma re-implementação das funcionalidades da aplicação Gira.</span>
				<span>A aplicação não é oficial, não estando associada de modo algum à EMEL ou à Câmara Municipal de Lisboa.</span>
			</div>
			<div class="flex flex-col w-full gap-4 origin-[1.75rem_144px] relative
				transition-transform transform duration-1000
			"
				style:--tw-translate-x="{move ? 1000 : 0}px"
				style:--tw-rotate="{rotatedOutside ? move ? 0 : 90 : 0}deg"
			>
				<span class="font-bold text-info text-lg transition-opacity" on:click={click}
					on:keydown={click}
					tabindex="0"
					role="button"
					class:opacity-0={rotatedOutside}
					style="-webkit-tap-highlight-color: transparent"
				>Desenvolvido por:</span>
				<a href="https://github.com/rodrigohpalmeirim" class="flex gap-3 items-center z-10 origin-[1.75rem_1.75rem]"
					class:animate-[spin_0.1s_linear_infinite]={wheelsSpinning}>
					<img src="https://avatars.githubusercontent.com/u/34187774?s=64" alt="" class="w-14 h-14 rounded-full" />
					<div class="flex flex-col">
						<span class="font-bold text-primary">Rodrigo Palmeirim</span>
						<span class="font-semibold text-label text-xs -mt-[2px]">gira@rodlabs.dev</span>
					</div>
				</a>
				<a href="https://github.com/ttmx" class="flex gap-3 items-center z-10 origin-[1.75rem_1.75rem]"
					class:animate-[spin_0.1s_linear_infinite]={wheelsSpinning}>
					<img src="https://avatars.githubusercontent.com/u/12669467?s=64" alt="" class="w-14 h-14 rounded-full" />
					<div class="flex flex-col">
						<span class="font-bold text-primary">Tiago Teles</span>
						<span class="font-semibold text-label text-xs -mt-[2px]">gira@tteles.dev</span>
					</div>
				</a>
				<div class="absolute -left-12 top-[4.5rem]">
					<svg class="h-full w-[110px] -rotate-90 transition-opacity duration-75" width="62" height="38" viewBox="0 0 62 38" fill="none" xmlns="http://www.w3.org/2000/svg"
						class:opacity-0={!showingBike}
					>
						<path d="M11.0862 26.6841L18.6347 20.9505C15.871 17.2807 10.0799 18.3456 7.56726 18.814C13.1653 19.8331 11.0862 26.6841 11.0862 26.6841Z" fill="#79C000"/>
						<path d="M11.0862 26.6848L20.8612 26.8514C20.5211 24.2944 19.7072 22.3752 18.6347 20.9512L11.0862 26.6848Z" fill="#79C000"/>
						<path d="M28.1018 26.9753L23.685 17.1157M28.1018 26.9753L42.185 10.4097M28.1018 26.9753L20.8612 26.8519M23.685 17.1157L19.7388 8.41601M23.685 17.1157L18.6347 20.9517M42.185 10.4097L46.638 22.118L50.2583 26.6853M42.185 10.4097L40.411 5.11738L44.7192 2L37.4785 2.39874M42.185 10.4097H46.245M20.8612 26.8519L11.0862 26.6853M20.8612 26.8519C20.5211 24.2949 19.7072 22.3757 18.6347 20.9517M19.7388 8.41601H16.6254M19.7388 8.41601H24.0833M11.0862 26.6853C11.0862 26.6853 13.1653 19.8343 7.56725 18.8152M11.0862 26.6853L18.6347 20.9517M7.56725 18.8152C10.0798 18.3468 15.871 17.282 18.6347 20.9517M7.56725 18.8152H2.987" stroke="#79C000" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
					</svg>
				</div>
			</div>
			<div class="flex flex-col grow items-center justify-end">
				<a href="https://github.com/rt-evil-inc/gira-plus">
					<svg class="w-12" width="120" height="118" viewBox="0 0 120 118" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path fill-rule="evenodd" clip-rule="evenodd" d="M59.8212 0C26.7416 0 0 27.0417 0 60.4959C0 87.2376 17.1343 109.874 40.9041 117.886C43.8759 118.488 44.9645 116.584 44.9645 114.982C44.9645 113.58 44.8665 108.773 44.8665 103.764C28.2257 107.37 24.7604 96.5523 24.7604 96.5523C22.0861 89.5411 18.1237 87.7391 18.1237 87.7391C12.6771 84.0332 18.5204 84.0332 18.5204 84.0332C24.562 84.4339 27.7322 90.243 27.7322 90.243C33.0796 99.4568 41.6963 96.8534 45.1629 95.2506C45.6576 91.3443 47.2433 88.6401 48.9269 87.1381C35.6547 85.7356 21.6906 80.5276 21.6906 57.2902C21.6906 50.6798 24.0661 45.2714 27.8302 41.0652C27.2363 39.5632 25.1559 33.3522 28.4253 25.0394C28.4253 25.0394 33.4763 23.4365 44.8653 31.2491C49.7413 29.9249 54.7699 29.2512 59.8212 29.2456C64.8722 29.2456 70.0212 29.9474 74.7759 31.2491C86.1661 23.4365 91.2171 25.0394 91.2171 25.0394C94.4865 33.3522 92.4049 39.5632 91.811 41.0652C95.6743 45.2714 97.9518 50.6798 97.9518 57.2902C97.9518 80.5276 83.9878 85.6348 70.6163 87.1381C72.7959 89.0408 74.6767 92.646 74.6767 98.3555C74.6767 106.468 74.5788 112.979 74.5788 114.981C74.5788 116.584 75.6686 118.488 78.6392 117.887C102.409 109.873 119.543 87.2376 119.543 60.4959C119.641 27.0417 92.8016 0 59.8212 0Z" fill="#24292F"/>
					</svg>
				</a>
				<span class="font-semibold text-info text-xs">Projeto open-source sob a licença GPL-3.0</span>
			</div>
		</div>
		<a href="https://github.com/rt-evil-inc/gira-plus/releases" class="absolute left-5 font-semibold text-label text-xs" style:bottom="{Math.max($safeInsets.bottom, 20)}px">v{version}</a>
	</div>
</MenuPage>