const STORAGE_KEY = "daylight-tasks-v1";
const THEME_STORAGE_KEY = "daylight-theme-v1";
const CHECK_ICON = `
  <svg viewBox="0 0 16 16" aria-hidden="true">
    <path d="m3.5 8.2 3 3 6-6.2" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" />
  </svg>
`;
const DELETE_ICON = `
  <svg viewBox="0 0 16 16" aria-hidden="true">
    <path d="M3.5 4.5h9M6 4.5V3h4v1.5m-5.5 0 .6 8.1h5.8l.6-8.1M6.5 7v3.5m3-3.5v3.5" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.3" />
  </svg>
`;

const form = document.querySelector("#task-form");
const input = document.querySelector("#task-input");
const taskList = document.querySelector("#task-list");
const emptyState = document.querySelector("#empty-state");
const emptyTitle = document.querySelector("#empty-title");
const emptyCopy = document.querySelector("#empty-copy");
const taskSummary = document.querySelector("#task-summary");
const allCount = document.querySelector("#all-count");
const progressRing = document.querySelector("#progress-ring");
const progressValue = document.querySelector("#progress-value");
const progressCircle = document.querySelector(".progress-value");
const clearCompletedButton = document.querySelector("#clear-completed");
const statusMessage = document.querySelector("#status-message");
const filterButtons = document.querySelectorAll(".filter-button");
const themeToggle = document.querySelector("#theme-toggle");
const themeLabel = document.querySelector("#theme-label");

let tasks = loadTasks();
let activeFilter = "all";
let theme = loadTheme();

function loadTheme() {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) === "dark" ? "dark" : "light";
  } catch (error) {
    console.error("Could not load the saved theme:", error);
    return "light";
  }
}

function applyTheme() {
  document.documentElement.dataset.theme = theme;
  const isDark = theme === "dark";
  const nextTheme = isDark ? "light" : "dark";
  themeToggle.setAttribute("aria-label", `Switch to ${nextTheme} mode`);
  themeLabel.textContent = `${nextTheme[0].toUpperCase()}${nextTheme.slice(1)} mode`;
  document.querySelector('meta[name="theme-color"]').content =
    isDark ? "#171620" : "#f7f7fb";
}

function toggleTheme() {
  theme = theme === "light" ? "dark" : "light";
  applyTheme();

  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (error) {
    showStorageError("Your theme preference could not be saved on this device.");
    console.error("Could not save the selected theme:", error);
  }
}

function isTask(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    typeof value.id === "string" &&
    typeof value.text === "string" &&
    typeof value.completed === "boolean"
  );
}

function loadTasks() {
  try {
    const savedTasks = localStorage.getItem(STORAGE_KEY);
    if (savedTasks === null) return [];

    const parsedTasks = JSON.parse(savedTasks);
    if (!Array.isArray(parsedTasks) || !parsedTasks.every(isTask)) {
      throw new Error("Saved tasks have an unexpected format.");
    }

    return parsedTasks;
  } catch (error) {
    showStorageError("Your saved tasks could not be loaded. This list will only be available until you close this page.");
    console.error("Could not load saved tasks:", error);
    return [];
  }
}

function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (error) {
    showStorageError("Your changes could not be saved on this device.");
    console.error("Could not save tasks:", error);
  }
}

function showStorageError(message) {
  statusMessage.textContent = message;
  statusMessage.classList.add("storage-error");
}

function createTask(text) {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    text,
    completed: false,
  };
}

function getVisibleTasks() {
  if (activeFilter === "active") return tasks.filter((task) => !task.completed);
  if (activeFilter === "completed") return tasks.filter((task) => task.completed);
  return tasks;
}

function render() {
  const completedCount = tasks.filter((task) => task.completed).length;
  const remainingCount = tasks.length - completedCount;
  const completionPercent = tasks.length
    ? Math.round((completedCount / tasks.length) * 100)
    : 0;

  allCount.textContent = String(tasks.length);
  progressValue.textContent = `${completionPercent}%`;
  progressRing.setAttribute("aria-label", `${completionPercent}% complete`);
  progressCircle.style.strokeDashoffset = String(125.66 * (1 - completionPercent / 100));
  taskSummary.textContent =
    tasks.length === 0
      ? "A fresh start is waiting for you."
      : remainingCount === 0
        ? "Everything on your list is done. Nice work!"
        : `${remainingCount} ${remainingCount === 1 ? "task" : "tasks"} left to tackle`;
  clearCompletedButton.hidden = completedCount === 0;

  for (const button of filterButtons) {
    const isActive = button.dataset.filter === activeFilter;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  }

  const visibleTasks = getVisibleTasks();
  taskList.replaceChildren(...visibleTasks.map(createTaskElement));
  emptyState.hidden = visibleTasks.length > 0;

  if (tasks.length === 0) {
    emptyTitle.textContent = "Your list is clear.";
    emptyCopy.textContent = "Add a task above and make today yours.";
  } else if (activeFilter === "active" && visibleTasks.length === 0) {
    emptyTitle.textContent = "All caught up.";
    emptyCopy.textContent = "You’ve completed every task. Enjoy the breathing room.";
  } else if (activeFilter === "completed" && visibleTasks.length === 0) {
    emptyTitle.textContent = "Nothing completed yet.";
    emptyCopy.textContent = "Finished tasks will find a home here.";
  }
}

function createTaskElement(task) {
  const item = document.createElement("li");
  item.className = `task-item${task.completed ? " is-complete" : ""}`;

  const completeButton = document.createElement("button");
  completeButton.className = "complete-button";
  completeButton.type = "button";
  completeButton.setAttribute(
    "aria-label",
    `${task.completed ? "Mark as active" : "Mark as complete"}: ${task.text}`,
  );
  completeButton.setAttribute("aria-pressed", String(task.completed));
  completeButton.innerHTML = CHECK_ICON;
  completeButton.addEventListener("click", () => {
    task.completed = !task.completed;
    saveTasks();
    render();
  });

  const text = document.createElement("span");
  text.className = "task-text";
  text.textContent = task.text;

  const deleteButton = document.createElement("button");
  deleteButton.className = "delete-button";
  deleteButton.type = "button";
  deleteButton.setAttribute("aria-label", `Delete task: ${task.text}`);
  deleteButton.innerHTML = DELETE_ICON;
  deleteButton.addEventListener("click", () => {
    tasks = tasks.filter((currentTask) => currentTask.id !== task.id);
    saveTasks();
    render();
    statusMessage.textContent = `Deleted task: ${task.text}`;
  });

  item.append(completeButton, text, deleteButton);
  return item;
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text) {
    input.focus();
    return;
  }

  tasks.unshift(createTask(text));
  saveTasks();
  render();
  input.value = "";
  input.focus();
  statusMessage.textContent = `Added task: ${text}`;
});

for (const button of filterButtons) {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    render();
  });
}

clearCompletedButton.addEventListener("click", () => {
  const removedCount = tasks.filter((task) => task.completed).length;
  tasks = tasks.filter((task) => !task.completed);
  saveTasks();
  render();
  statusMessage.textContent = `Cleared ${removedCount} completed ${removedCount === 1 ? "task" : "tasks"}.`;
});

themeToggle.addEventListener("click", toggleTheme);
applyTheme();
render();
