document.addEventListener("DOMContentLoaded", () => {
  const body = document.body;
  const tableBody = document.querySelector(".table__body");
  const totalPriceElement = document.querySelector(".footer-info__price");
  const searchInput = document.querySelector(".filters__search");
  const form = document.querySelector(".drawer__form");
  const submitBtn = document.querySelector(".btn--add");
  const inputs = form.querySelectorAll("input, select");
  const monthSelect = document.getElementById("month-select");
  const yearSelect = document.getElementById("year-select");

  // --- 0. ИНИЦИАЛИЗАЦИЯ (LocalStorage) ---
  let projects = JSON.parse(localStorage.getItem("projects_data")) || [];

  if (localStorage.getItem("selected_month"))
    monthSelect.value = localStorage.getItem("selected_month");
  if (localStorage.getItem("selected_year"))
    yearSelect.value = localStorage.getItem("selected_year");

  // --- 1. НАВИГАЦИЯ ---
  const toggleSidebar = () => body.classList.toggle("sidebar-is-hidden");
  const openDrawer = () => body.classList.add("drawer-open");
  const closeDrawer = () => {
    body.classList.remove("drawer-open");
    form.reset();
    inputs.forEach((i) => i.classList.remove("valid", "invalid"));
    submitBtn.disabled = true;
  };

  document
    .querySelector(".menu-toggle")
    ?.addEventListener("click", toggleSidebar);
  document
    .querySelector(".sidebar__header")
    ?.addEventListener("click", toggleSidebar);
  document
    .querySelector(".btn--primary")
    ?.addEventListener("click", openDrawer);
  document
    .querySelector(".btn--cancel")
    ?.addEventListener("click", closeDrawer);
  document.querySelector(".overlay")?.addEventListener("click", closeDrawer);

  monthSelect?.addEventListener("change", (e) =>
    localStorage.setItem("selected_month", e.target.value),
  );
  yearSelect?.addEventListener("change", (e) =>
    localStorage.setItem("selected_year", e.target.value),
  );

  // --- 2. ТАБЛИЦА ---
  const renderTable = (data = projects) => {
    localStorage.setItem("projects_data", JSON.stringify(projects));
    tableBody.innerHTML = data
      .map(
        (item, index) => `
      <tr>
        <td class="table__cell">${item.company}</td>
        <td class="table__cell">${item.name}</td>
        <td class="table__cell">$${Number(item.budget).toLocaleString()}</td>
        <td class="table__cell">0 / ${item.capacity}</td>
        <td class="table__cell">-</td>
        <td class="table__cell" style="color: #27ae60">$${(item.budget * 0.15).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
        <td class="table__cell">
          <button class="btn--del" data-index="${index}" style="background:#ff4646; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">Delete</button>
        </td>
      </tr>
    `,
      )
      .join("");
    const total = data.reduce((sum, item) => sum + item.budget * 0.15, 0);
    totalPriceElement.textContent = `$${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  };

  tableBody.addEventListener("click", (e) => {
    if (e.target.classList.contains("btn--del")) {
      projects.splice(e.target.dataset.index, 1);
      renderTable();
    }
  });

  // --- 3. ПОИСК И СОРТИРОВКА ---
  searchInput?.addEventListener("input", (e) => {
    const val = e.target.value.toLowerCase();
    render(
      projects.filter(
        (p) =>
          p.name.toLowerCase().includes(val) ||
          p.company.toLowerCase().includes(val),
      ),
    );
  });

  let currentSortKey = null;
  let isAsc = true;

  document.querySelectorAll(".table__cell--header").forEach((header, index) => {
    header.addEventListener("click", () => {
      const keys = [
        "company",
        "name",
        "budget",
        "capacity",
        "employees",
        "income",
      ];
      const key = keys[index];
      if (!key) return;

      if (currentSortKey === key) isAsc = !isAsc;
      else {
        currentSortKey = key;
        isAsc = true;
      }

      projects.sort((a, b) => {
        let vA = key === "income" ? a.budget * 0.15 : a[key];
        let vB = key === "income" ? b.budget * 0.15 : b[key];
        if (typeof vA === "string")
          return isAsc ? vA.localeCompare(vB) : vB.localeCompare(vA);
        return isAsc ? vA - vB : vB - vA;
      });
      renderTable();
    });
  });

  // --- 4. ВАЛИДАЦИЯ ---
  const validators = {
    required: (v) => v.trim() !== "",
    min3: (v) => v.trim().length >= 3,
    letters: (v) => /^[a-zA-Zа-яА-ЯёЁ\s]+$/.test(v),
    positive: (v) => parseFloat(v) > 0,
    age18: (v) => new Date().getFullYear() - new Date(v).getFullYear() >= 18,
  };

  form.addEventListener("input", (e) => {
    const i = e.target;
    const rules = i.dataset.rules?.split("|") || [];
    let err = "";
    for (const r of rules)
      if (!validators[r](i.value)) {
        err = "Invalid field";
        break;
      }

    i.classList.toggle("invalid", !!err);
    i.classList.toggle("valid", !err && i.value !== "");
    i.parentElement.querySelector(".error-message").textContent = err;
    submitBtn.disabled = !Array.from(inputs).every((inp) =>
      inp.classList.contains("valid"),
    );
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const d = new FormData(form);
    projects.push({
      company: d.get("lastName"),
      name: d.get("firstName"),
      budget: Number(d.get("salary")),
      capacity: 10,
    });
    renderTable();
    closeDrawer();
  });

  document.querySelector(".btn--secondary").onclick = () => {
    projects = [
      { company: "Apple", name: "iPhone 18", budget: 50000, capacity: 10 },
      { company: "Tesla", name: "Model S", budget: 80000, capacity: 5 },
    ];
    renderTable();
  };

  renderTable();
});

const dobDay = document.getElementById("dob-day");
const dobYear = document.getElementById("dob-year");

// Заполняем дни 1-31
dobDay.innerHTML =
  '<option value="">Day</option>' +
  Array.from(
    { length: 31 },
    (_, i) => `<option value="${i + 1}">${i + 1}</option>`,
  ).join("");

// Заполняем годы (от текущего - 18 лет до 1950)
const currentYear = new Date().getFullYear();
let yearOptions = '<option value="">Year</option>';
for (let y = currentYear - 18; y >= 1950; y--) {
  yearOptions += `<option value="${y}">${y}</option>`;
}
dobYear.innerHTML = yearOptions;

// Элементы для переключения вкладок
const menuLinks = document.querySelectorAll(".menu__link");
const pageTitle = document.getElementById("page-title");
const mainBtn = document.getElementById("main-action-btn");
const projectsPage = document.getElementById("projects-page");
const employeesPage = document.getElementById("employees-page");

menuLinks.forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();

    // Убираем активный класс у всех и добавляем нажатому
    menuLinks.forEach((l) => l.classList.remove("menu__link--active"));
    link.classList.add("menu__link--active");

    const targetPage = link.textContent.trim(); // "Projects" или "Employees"

    if (targetPage === "Employees") {
      // Показываем Employees
      pageTitle.textContent = "Employees";
      mainBtn.textContent = "+ Add Employee";
      projectsPage.style.display = "none";
      employeesPage.style.display = "block";
    } else {
      // Показываем Projects
      pageTitle.textContent = "Projects";
      mainBtn.textContent = "+ Add Project";
      projectsPage.style.display = "block";
      employeesPage.style.display = "none";
    }
  });
});
