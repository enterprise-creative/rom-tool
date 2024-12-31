import { database } from "./database.js";

const target = document.getElementById("database");
const filterForm = document.getElementById("filter");

filterForm.addEventListener("change", (event) => {
  const selectedManufacturer = filterForm.querySelector(
    'input[name="manufacturer"]:checked'
  )?.value;
  const selectedConfiguration = filterForm.querySelector(
    'input[name="configuration"]:checked'
  )?.value;

  const filtered = database.filter((item) => {
    const manufacturerMatch =
      !selectedManufacturer || item.manufacturer === selectedManufacturer;
    const configurationMatch =
      !selectedConfiguration ||
      (Array.isArray(item.configuration)
        ? item.configuration.includes(selectedConfiguration)
        : item.configuration === selectedConfiguration);

    return manufacturerMatch && configurationMatch;
  });

  clearData();
  filtered.forEach(loadData);
});

function updatePrices(form) {
  // Get the current configuration (assuming first item if no filter)
  const currentConfig = database[0];

  // Get select elements
  const displaySelect = form.querySelector("#displaySelect");
  const audioSelect = form.querySelector("#audioSelect");
  const cameraSelect = form.querySelector("#cameraSelect");
  const sourceSelect = form.querySelector("#sourceSelect");

  // Safely get prices and hours from database, defaulting to 0 if not found
  const displayOptions = getOptionDetails(
    currentConfig.displays,
    displaySelect?.value
  );
  const audioOptions = getOptionDetails(
    currentConfig.audio,
    audioSelect?.value
  );
  const cameraOptions = getOptionDetails(
    currentConfig.camera,
    cameraSelect?.value
  );
  const sourceOptions = getOptionDetails(
    currentConfig.mediaSources,
    sourceSelect?.value
  );

  // Update individual component prices
  updateComponentPrice(displaySelect, displayOptions.price);
  updateComponentPrice(audioSelect, audioOptions.price);
  updateComponentPrice(cameraSelect, cameraOptions.price);
  updateComponentPrice(sourceSelect, sourceOptions.price);

  // Calculate subtotals
  const baseHardwarePrice = currentConfig.baseprice;
  const miscPartsPrice = 75;
  const partsSubtotal =
    baseHardwarePrice +
    displayOptions.price +
    audioOptions.price +
    cameraOptions.price +
    sourceOptions.price +
    miscPartsPrice;

  // Sum up hours from base and options
  const totalHours = {
    installHours:
      currentConfig.basehours.installHours +
      displayOptions.hours.installHours +
      audioOptions.hours.installHours +
      cameraOptions.hours.installHours +
      sourceOptions.hours.installHours,

    configHours:
      currentConfig.basehours.configHours +
      displayOptions.hours.configHours +
      audioOptions.hours.configHours +
      cameraOptions.hours.configHours +
      sourceOptions.hours.configHours,

    programingHours:
      currentConfig.basehours.programingHours +
      displayOptions.hours.programingHours +
      audioOptions.hours.programingHours +
      cameraOptions.hours.programingHours +
      sourceOptions.hours.programingHours,

    managementHours:
      currentConfig.basehours.managementHours +
      displayOptions.hours.managementHours +
      audioOptions.hours.managementHours +
      cameraOptions.hours.managementHours +
      sourceOptions.hours.managementHours,
  };

  // Labor rates
  const installationRate = 100;
  const configurationRate = 150;
  const programmingRate = 150;
  const managementRate = 150;

  // Calculate labor costs using total hours
  const installationCost = totalHours.installHours * installationRate;
  const configurationCost = totalHours.configHours * configurationRate;
  const programmingCost = totalHours.programingHours * programmingRate;
  const managementCost = totalHours.managementHours * managementRate;

  const laborSubtotal =
    installationCost + configurationCost + programmingCost + managementCost;

  const projectSubtotal = partsSubtotal + laborSubtotal;
  const taxRate = 0.06;
  const tax = projectSubtotal * taxRate;
  const total = projectSubtotal + tax;

  // Update hour rows in the table
  updateHourRow(
    form,
    "Installation Hours",
    totalHours.installHours,
    installationCost
  );
  updateHourRow(
    form,
    "Configuration Hours",
    totalHours.configHours,
    configurationCost
  );
  updateHourRow(
    form,
    "Programming Hours",
    totalHours.programingHours,
    programmingCost
  );
  updateHourRow(
    form,
    "Management Hours",
    totalHours.managementHours,
    managementCost
  );

  // Update totals in the table
  updateTotalRow(form, "Parts Subtotal:", partsSubtotal);
  updateTotalRow(form, "Labor Subtotal:", laborSubtotal);
  updateTotalRow(form, "Project Subtotal:", projectSubtotal);
  updateTotalRow(form, "Tax:", tax);
  updateTotalRow(form, "ROM:", total);
}

// Helper function to get both price and hours from an option
function getOptionDetails(categoryData, value) {
  if (!categoryData || !value) {
    return {
      price: 0,
      hours: {
        installHours: 0,
        configHours: 0,
        programingHours: 0,
        managementHours: 0,
      },
    };
  }

  const option = categoryData[value];
  return {
    price: option?.price || 0,
    hours: option?.optionHours || {
      installHours: 0,
      configHours: 0,
      programingHours: 0,
      managementHours: 0,
    },
  };
}

function updateComponentPrice(selectElement, price) {
  if (!selectElement) return;
  const row = selectElement.closest("tr");
  if (!row) return;

  const priceCell = row.querySelector("td:last-child");
  if (priceCell) {
    priceCell.textContent = price ? `$${price.toFixed(2)}` : "$-";
  }
}

function updateHourRow(form, rowType, hours, cost) {
  const rows = form.querySelectorAll("tr");
  for (const row of rows) {
    const labelCell = row.querySelector("td");
    if (labelCell && labelCell.textContent.includes(rowType)) {
      labelCell.textContent = `${hours} ${rowType}`;
      const costCell = row.querySelector("td:last-child");
      if (costCell) {
        costCell.textContent = `$${cost.toFixed(2)}`;
      }
      break;
    }
  }
}

function updateTotalRow(form, rowLabel, amount) {
  const rows = form.querySelectorAll("tr");
  for (const row of rows) {
    const labelCell = row.querySelector("td");
    if (labelCell && labelCell.textContent.includes(rowLabel)) {
      const amountCell = row.querySelector("td:last-child");
      if (amountCell) {
        amountCell.textContent = `$${amount.toFixed(2)}`;
      }
      break;
    }
  }
}

function loadData(database) {
  target.insertAdjacentHTML(
    "beforeEnd",
    `<div class="flex container mx-auto lg:w-[1024px] flex-wrap justify-center shadow-lg">
      <div class="lg:w-[512px] w-full bg-slate-800 p-3">
        <img src="${
          database.imageSource
        }" alt="Product Image" class="w-full h-auto object-cover"/>
      </div>
      <form id="form" class="lg:w-[512px] w-full bg-slate-800 p-3">
        <table class="w-full overflow-hidden">
          <tbody class="divide-y divide-gray-200">
            <tr>
              <td class="px-1 py-1 w-4/5">${database.UCHardware}</td>
              <td class="px-1 py-1 w-1/5 text-right">$${database.baseprice.toFixed(
                2
              )}</td>
            </tr>
            <tr>
              <td class="px-1 py-1">
                <label for="sourceSelect">Media Sources:</label>
                <select 
                  name="sourceSelect" 
                  id="sourceSelect" 
                  class="bg-slate-800 appearance-none" 
                  onchange="updatePrices(this.form)"
                >
                  ${Object.entries(database.mediaSources)
                    .map(
                      ([value, source], index) =>
                        `<option value="${value}" ${
                          index === 0 ? "selected" : ""
                        }>${source.name}</option>`
                    )
                    .join("")}
                </select>
              </td>
              <td class="px-1 py-1 text-right">$-</td>
            </tr>
            <tr>
              <td class="px-1 py-1">
                <label for="displaySelect">Displays:</label>
                <select 
                  name="displaySelect" 
                  id="displaySelect" 
                  class="bg-slate-800 appearance-none" 
                  onchange="updatePrices(this.form)"
                >
                  ${Object.entries(database.displays)
                    .map(
                      ([value, display], index) =>
                        `<option value="${value}" ${
                          index === 0 ? "selected" : ""
                        }>${display.name}</option>`
                    )
                    .join("")}
                </select>
              </td>
              <td class="px-1 py-1 text-right">$-</td>
            </tr>
            <tr>
              <td class="px-1 py-1">
                <label for="cameraSelect">Camera Options:</label>
                <select 
                  name="cameraSelect" 
                  id="cameraSelect" 
                  class="bg-slate-800 appearance-none" 
                  onchange="updatePrices(this.form)"
                >
                  ${Object.entries(database.camera)
                    .map(
                      ([value, camera], index) =>
                        `<option value="${value}" ${
                          index === 0 ? "selected" : ""
                        }>${camera.name}</option>`
                    )
                    .join("")}
                </select>
              </td>
              <td class="px-1 py-1 text-right">$-</td>
            </tr>
            <tr>
              <td class="px-1 py-1">
                <label for="audioSelect">Audio Options:</label>
                <select 
                  name="audioSelect" 
                  id="audioSelect" 
                  class="bg-slate-800 appearance-none" 
                  onchange="updatePrices(this.form)"
                >
                  ${Object.entries(database.audio)
                    .map(
                      ([value, audio], index) =>
                        `<option value="${value}" ${
                          index === 0 ? "selected" : ""
                        }>${audio.name}</option>`
                    )
                    .join("")}
                </select>
              </td>
              <td class="px-1 py-1 text-right">$-</td>
            </tr>
            <tr>
              <td class="px-1 py-1">Misc. Parts</td>
              <td class="px-1 py-1 text-right">$75.00</td>
            </tr>
            <tr>
              <td class="px-1 py-1 text-right">Parts Subtotal:</td>
              <td class="px-1 py-1 text-right">$-</td>
            </tr>
            <tr>
              <td class="px-1 py-1">${
                database.basehours.installHours
              } Installation Hours</td>
              <td class="px-1 py-1 text-right">$-</td>
            </tr>
            <tr>
              <td class="px-1 py-1">${
                database.basehours.configHours
              } Configuration Hours</td>
              <td class="px-1 py-1 text-right">$-</td>
            </tr>
            <tr>
              <td class="px-1 py-1">${
                database.basehours.programingHours
              } Programming Hours</td>
              <td class="px-1 py-1 text-right">$-</td>
            </tr>
            <tr>
              <td class="px-1 py-1">${
                database.basehours.managementHours
              } Management Hours</td>
              <td class="px-1 py-1 text-right">$-</td>
            </tr>
            <tr>
              <td class="px-1 py-1 text-right">Labor Subtotal:</td>
              <td class="px-1 py-1 text-right">$-</td>
            </tr>
            <tr>
              <td class="px-1 py-1 text-right">Project Subtotal:</td>
              <td class="px-1 py-1 text-right">$-</td>
            </tr>
            <tr>
              <td class="px-1 py-1 text-right">Tax:</td>
              <td class="px-1 py-1 text-right">$-</td>
            </tr>
            <tr>
              <td class="px-1 py-1 text-right">ROM:</td>
              <td class="px-1 py-1 text-right">$-</td>
            </tr>
          </tbody>
        </table>
      </form>
    </div>`
  );

  // Make updatePrices available globally
  window.updatePrices = updatePrices;

  // Initialize the table with the first options selected
  const form = target.querySelector("#form");
  if (form) {
    updatePrices(form);
  }
}

function clearData() {
  while (target.firstChild) {
    target.removeChild(target.firstChild);
  }
}
