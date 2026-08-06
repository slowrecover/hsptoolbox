import { containsCrisisLanguage, translateInnerTalk } from "./core.mjs";

const $ = (selector) => document.querySelector(selector);
const input = $("#innerTalk");
const form = $("#translatorForm");
const output = $("#output");
const crisis = $("#crisis");
const privacy = $("#privacyState");
const exampleButtons = document.querySelectorAll("[data-example]");

const labels = {
  zh: ["先承认", "可以确认的事实", "这句话加上的解释", "更准确的说法", "一个很小的下一步"],
  en: ["Acknowledge first", "Observable facts", "The added interpretation", "A more accurate sentence", "One small next step"],
};

function card(label, value) {
  const section = document.createElement("section");
  section.className = "result-card";
  const heading = document.createElement("h3");
  heading.textContent = label;
  const paragraph = document.createElement("p");
  paragraph.textContent = value;
  section.append(heading, paragraph);
  return section;
}

function renderColumn(title, language, result) {
  const column = document.createElement("div");
  column.className = "result-column";
  const heading = document.createElement("h2");
  heading.textContent = title;
  column.append(heading);
  ["acknowledgement", "fact", "interpretation", "rewrite", "next"].forEach((key, index) => {
    column.append(card(labels[language][index], result[key]));
  });
  return column;
}

function render() {
  const text = input.value.trim();
  if (!text) {
    input.focus();
    return;
  }
  const result = translateInnerTalk(text);
  output.replaceChildren(
    renderColumn(result.sourceLanguage === "zh" ? "中文" : "English", result.sourceLanguage, result.primary),
    renderColumn(result.secondary.language === "zh" ? "中文" : "English", result.secondary.language, result.secondary),
  );
  output.hidden = false;
  crisis.hidden = !containsCrisisLanguage(text);
  privacy.textContent = "Processed in this browser · Not sent or saved / 仅在本浏览器处理 · 不发送、不保存";
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  render();
});

input.addEventListener("input", () => {
  privacy.textContent = "Nothing has left this page / 内容没有离开此页面";
});

exampleButtons.forEach((button) => button.addEventListener("click", () => {
  input.value = button.dataset.example;
  render();
}));
