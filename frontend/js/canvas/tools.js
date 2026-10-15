// tools.js

import {
    setBrushWidth,
    setSelectedColor,
    setSelectedTool
} from "./drawing.js";

const toolBtns = document.querySelectorAll(".tool");
const fillcolor = document.querySelector("#fill-color");
const sizeSlider = document.querySelector("#size-slider");
const colorBtns = document.querySelectorAll(".colors .option");
const colorPicker = document.querySelector("#color-picker");

toolBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
        const activeTool = document.querySelector(".option.active");

        if (activeTool) {
            activeTool.classList.remove("active");
        }

        btn.classList.add("active");
        setSelectedTool(btn.id);
    });
});

sizeSlider.addEventListener("input", () => {
    setBrushWidth(sizeSlider.value);
});

colorBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
        const selectedOption = document.querySelector(".option.selected");

        if (selectedOption) {
            selectedOption.classList.remove("selected");
        }

        btn.classList.add("selected");

        const color = window
            .getComputedStyle(btn)
            .getPropertyValue("background-color");

        setSelectedColor(color);
    });
});

colorPicker.addEventListener("input", () => {
    colorPicker.parentElement.style.background = colorPicker.value;
    setSelectedColor(colorPicker.value);
});