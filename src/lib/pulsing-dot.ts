import type { StyleImageInterface } from 'maplibre-gl';
import { getCssVariable } from '$lib/utils';

// This implements `StyleImageInterface`
// to draw a pulsing dot icon on the map.
export function pulsingDot(map: maplibregl.Map, size = 100, animationDuration = 1500) : StyleImageInterface {
	const context = document.createElement('canvas').getContext('2d', { willReadFrequently: true })!;

	return {
		width: size,
		height: size,
		data: new Uint8Array(size * size * 4),

		// When the layer is added to the map,
		// get the rendering context for the map canvas.
		onAdd: function () {
			const canvas = document.createElement('canvas');
			canvas.width = this.width;
			canvas.height = this.height;
		},

		// Call once before every frame where the icon will be used.
		render: function () {
			const t = (performance.now() % animationDuration) / animationDuration;

			const radius = (size / 2) * 0.3;
			const outerRadius = (size / 2) * 0.7 * t + radius;

			// Draw the outer circle.
			context.clearRect(0, 0, this.width, this.height);
			context.beginPath();
			context.arc(
				this.width / 2,
				this.height / 2,
				outerRadius,
				0,
				Math.PI * 2,
			);
			context.fillStyle = `${getCssVariable('--color-primary')}${Math.round((1 - t) / 2 * 255).toString(16).padStart(2, '0')}`;
			context.fill();

			// Draw the inner circle.
			context.beginPath();
			context.arc(
				this.width / 2,
				this.height / 2,
				radius,
				0,
				Math.PI * 2,
			);
			context.fillStyle = getCssVariable('--color-primary');
			context.strokeStyle = 'white';
			context.lineWidth = 2 + 4 * (1 - t);
			context.fill();
			context.stroke();

			// Update this image's data with data from the canvas.
			this.data = context.getImageData(
				0,
				0,
				this.width,
				this.height,
			).data;

			// Continuously repaint the map, resulting
			// in the smooth animation of the dot.
			map.triggerRepaint();

			// Return `true` to let the map know that the image was updated.
			return true;
		},
	};
}