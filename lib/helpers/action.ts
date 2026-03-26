import { Locator, expect } from "@playwright/test";

export async function setSliderValue(slider: Locator, target: number) {
  await slider.focus();
  const current = Number(await slider.getAttribute("aria-valuenow"));
  const key = target < current ? "ArrowLeft" : "ArrowRight";
  const steps = Math.abs(target - current);
  for (let i = 0; i < steps; i++) {
    await slider.press(key);
  }
  await expect(slider).toHaveAttribute("aria-valuenow", String(target));
}