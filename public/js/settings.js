class SettingsRenderer {
  constructor(container = "#settings") {
    this.container =
      typeof container === "string"
        ? document.querySelector(container)
        : container;

    if (!this.container) {
      throw new Error("Settings container not found.");
    }

    this.inputs = new Map();
    this.dropdownCount = 0;
    this.initialize();
  }

  async initialize() {
    await settingsReady;
    this.render();
    this.container.addEventListener("change", (e) => {
      this.handleChange(e);
    });

    this.container.addEventListener("input", (e) => {
      this.handleInput(e);
    });

    this.container.addEventListener("click", (e) => {
      this.handleClick(e);
    });

    window.addEventListener("settingsChanged", (e) => {
      this.updateSetting(e.detail.id);
      this.updateVisibility();
    });

    window.addEventListener("settingsReset", () => {
      this.refresh();
    });
  }

  render() {
    this.container.innerHTML = "";
    this.inputs.clear();
    const cards = document.createElement("div");
    cards.className = "cards";
    for (const category of settingsSchema)
      cards.appendChild(this.renderCategory(category));
    cards.appendChild(this.renderButtons());
    this.container.appendChild(cards);
    this.updateVisibility();
  }

  renderCategory(category) {
    const card = document.createElement("div");
    card.className = "card";
    const heading = document.createElement("h3");
    heading.textContent = category.name;
    card.appendChild(heading);
    for (const setting of category.settings || []) {
      if (setting.type === "subcategory") {
        card.appendChild(this.renderSubcategory(setting));
      } else {
        card.appendChild(this.renderSetting(setting));
      }
    }

    return card;
  }

  renderSubcategory(subcategory) {
    const fragment = document.createDocumentFragment();
    const dropdown = document.createElement("span");
    dropdown.className = "dropdown";
    dropdown.textContent = subcategory.name;
    const content = document.createElement("div");
    content.className = "dropdown-content";
    content.style.height = "0px";
    content.style.overflow = "hidden";
    const id = `settings-dropdown-${++this.dropdownCount}`;
    dropdown.dataset.dropdown = id;
    content.id = id;
    for (const setting of subcategory.settings || []) {
      if (setting.type === "subcategory")
        content.appendChild(this.renderSubcategory(setting));
      else content.appendChild(this.renderSetting(setting));
    }

    fragment.append(dropdown, content);
    return fragment;
  }

  toggleDropdown(dropdown) {
    const content = document.getElementById(dropdown.dataset.dropdown);
    if (!content) return;
    const open = content.dataset.open === "true";
    if (open) {
      content.style.height = `${content.scrollHeight}px`;
      requestAnimationFrame(() => {
        content.style.height = "0px";
      });

      content.dataset.open = "false";
      dropdown.classList.remove("active");
    } else {
      content.style.height = "0px";
      content.dataset.open = "true";
      requestAnimationFrame(() => {
        content.style.height = `${content.scrollHeight}px`;
      });

      dropdown.classList.add("active");
    }
  }

  renderSetting(setting) {
    const fragment = document.createDocumentFragment();
    const wrapper = document.createElement("div");
    wrapper.className = "setting";
    wrapper.dataset.settingWrapper = setting.id || "";
    const inputId = `setting-${setting.id}`;
    const label = document.createElement("label");
    label.htmlFor = inputId;
    label.textContent = setting.name;
    if (setting.description) {
      const tooltip = document.createElement("span");
      tooltip.className = "tooltip";
      tooltip.setAttribute("tip", setting.description);
      tooltip.setAttribute("aria-label", setting.description);
      tooltip.setAttribute("tabindex", "0");
      label.appendChild(tooltip);
    }

    const input = this.createInput(setting, inputId);
    input.dataset.settingId = setting.id;
    input.id = inputId;
    this.inputs.set(setting.id, input);
    if (setting.type === "boolean") {
      const check = document.createElement("span");
      check.className = "check";
      const checkboxLabel = document.createElement("label");
      checkboxLabel.htmlFor = inputId;
      check.append(input, checkboxLabel);
      wrapper.append(label, check);
    } else if (setting.type === "textarea") {
      wrapper.append(label);
      fragment.append(wrapper, input);
      return fragment;
    } else wrapper.append(label, input);
    fragment.appendChild(wrapper);
    return fragment;
  }

  createInput(setting) {
    const value = getSetting(setting.id);
    let input;
    switch (setting.type) {
      case "boolean":
        input = document.createElement("input");
        input.type = "checkbox";
        input.checked = Boolean(value);
        break;

      case "string":
        input = document.createElement("input");
        input.type = "text";
        input.value = value ?? "";
        break;

      case "number":
        input = document.createElement("input");
        input.type = "number";
        input.value = value ?? 0;
        if (setting.min !== undefined) input.min = setting.min;
        if (setting.max !== undefined) input.max = setting.max;
        if (setting.step !== undefined) input.step = setting.step;
        break;

      case "slider":
        input = document.createElement("input");
        input.type = "range";
        input.value = value ?? 0;
        if (setting.min !== undefined) input.min = setting.min;
        if (setting.max !== undefined) input.max = setting.max;
        if (setting.step !== undefined) input.step = setting.step;
        break;

      case "color":
        input = document.createElement("input");
        input.type = "color";
        input.value = value || "#000000";
        break;

      case "textarea":
        input = document.createElement("textarea");
        input.value = value ?? "";
        if (setting.placeholder) input.placeholder = setting.placeholder;
        break;

      case "dropdown":
        input = document.createElement("select");
        for (const option of setting.options || []) {
          const optionElement = document.createElement("option");
          optionElement.value = option.value;
          optionElement.textContent = option.name;
          input.appendChild(optionElement);
        }

        input.value = value ?? "";
        break;

      default:
        console.warn(`Unsupported setting type: ${setting.type}`, setting);
        return null;
    }
    return input;
  }

  handleChange(event) {
    const input = event.target;
    if (!input.dataset.settingId) return;
    if (input.disabled) return;
    const id = input.dataset.settingId;
    const setting = this.findSetting(id);
    if (!setting) return;
    let value;
    if (setting.type === "boolean") value = input.checked;
    else if (setting.type === "number" || setting.type === "slider")
      value = Number(input.value);
    else value = input.value;
    setSetting(id, value);
  }

  handleInput(event) {
    const input = event.target;
    if (!input.dataset.settingId) return;
    const setting = this.findSetting(input.dataset.settingId);
    if (!setting || setting.type !== "slider") return;
    setSetting(setting.id, Number(input.value));
  }

  findSetting(id) {
    const walk = (items) => {
      for (const item of items || []) {
        if (item.type === "subcategory") {
          const found = walk(item.settings);
          if (found) return found;
        }

        if (item.id === id) return item;
      }

      return null;
    };

    for (const category of settingsSchema) {
      const found = walk(category.settings);
      if (found) return found;
    }

    return null;
  }

  evaluateVisibility(condition) {
    if (!condition) return true;
    if (condition.setting !== undefined)
      return getSetting(condition.setting) === condition.value;
    if (Array.isArray(condition.all))
      return condition.all.every((item) => this.evaluateVisibility(item));
    if (Array.isArray(condition.any))
      return condition.any.some((item) => this.evaluateVisibility(item));
    if (condition.not) return !this.evaluateVisibility(condition.not);
    return true;
  }

  updateVisibility() {
    for (const category of settingsSchema)
      this.updateItemsVisibility(category.settings);
  }

  updateItemsVisibility(items) {
    for (const setting of items || []) {
      if (setting.type === "subcategory") {
        this.updateItemsVisibility(setting.settings);
        continue;
      }

      const wrapper = this.inputs
        .get(setting.id)
        ?.closest("[data-setting-wrapper]");

      if (!wrapper) continue;
      const isVisible = this.evaluateVisibility(setting.visibleIf);
      if (isVisible) {
        wrapper.style.display = "";
        setTimeout(() => {
          wrapper.style.height = "22.4px";
          wrapper.style.overflow = "";
          wrapper.style.opacity = "1";
        });
      } else {
        wrapper.style.height = "0px";
        wrapper.style.overflow = "hidden";
        wrapper.style.opacity = "0";
        setTimeout(() => {
          wrapper.style.display = "none";
        }, 100);
      }
    }
  }

  updateSetting(id) {
    const input = this.inputs.get(id);
    if (!input) return;
    const setting = this.findSetting(id);
    if (!setting) return;
    const value = getSetting(id);
    if (setting.type === "boolean") input.checked = Boolean(value);
    else input.value = value ?? "";
  }

  refresh() {
    for (const id of this.inputs.keys()) this.updateSetting(id);
    this.updateVisibility();
  }

  renderButtons() {
    const buttons = document.createElement("div");
    buttons.className = "buttons";
    const group = document.createElement("div");
    group.className = "group";
    const exportButton = document.createElement("button");
    exportButton.textContent = "Export";
    exportButton.dataset.action = "export";
    const importButton = document.createElement("button");
    importButton.textContent = "Import";
    importButton.dataset.action = "import";
    const resetButton = document.createElement("button");
    resetButton.textContent = "Reset";
    resetButton.dataset.action = "reset";
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".json,application/json";
    fileInput.hidden = true;
    fileInput.dataset.importFile = "true";
    group.append(exportButton, importButton);
    buttons.append(group, resetButton, fileInput);
    return buttons;
  }

  handleClick(event) {
    const dropdown = event.target.closest("[data-dropdown]");
    if (dropdown && this.container.contains(dropdown)) {
      this.toggleDropdown(dropdown);
      return;
    }

    const button = event.target.closest("[data-action]");
    if (!button) return;
    switch (button.dataset.action) {
      case "export":
        this.export();
        break;

      case "import":
        this.container.querySelector("[data-import-file]")?.click();
        break;

      case "reset":
        this.reset();
        break;
    }
  }

  export() {
    const data = {
      settings: settings,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 4)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "consurf-settings.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  async import(file) {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const imported = data.settings ?? data;

      if (
        !imported ||
        typeof imported !== "object" ||
        Array.isArray(imported)
      ) {
        throw new Error("Invalid settings format.");
      }

      for (const [id, value] of Object.entries(imported)) {
        if (!this.findSetting(id)) continue;
        setSetting(id, value);
      }

      this.refresh();
      notify("Settings imported successfully.");
    } catch (error) {
      console.error("Settings import failed:", error);
      notify("Failed to import settings.");
    }
  }

  reset() {
    if (!confirm("Are you sure you want to reset your settings?")) return;
    resetSettings();
    this.refresh();
    notify("Settings reset.");
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  await settingsReady;
  window.settingsRenderer = new SettingsRenderer("#settings");
});
