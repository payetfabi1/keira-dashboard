const SUPABASE_URL =
  "https://iayxqoevmkhkhhtdmrrk.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_qLhvGcHGqkaHMEj_giw1Ww_e3J_RoKR";


const FOOD_GOAL = 30;
const FOOD_DOSES_GOAL = 3;

const WET_FOOD_GOAL = 50;
const WET_FOOD_TIME = 19;

const WATER_GOAL = 100;


const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: window.localStorage
      }
    }
  );


const loginScreen =
  document.getElementById(
    "login-screen"
  );

const passwordScreen =
  document.getElementById(
    "password-screen"
  );

const dashboard =
  document.getElementById(
    "dashboard"
  );


/* =========================================================
   HELPERS
========================================================= */

function parisDay(
  date = new Date()
) {

  return date.toLocaleDateString(
    "en-CA",
    {
      timeZone:
        "Europe/Paris"
    }
  );
}


function formatDate(
  value
) {

  if (!value) {
    return "—";
  }

  return new Date(
    value
  ).toLocaleDateString(
    "fr-FR"
  );
}


function percent(
  value,
  goal
) {

  return Math.min(
    100,
    Math.max(
      0,
      Math.round(
        (
          Number(
            value || 0
          )
          / goal
        )
        * 100
      )
    )
  );
}


function daysAgo(
  timestamp
) {

  if (!timestamp) {
    return null;
  }


  const numericTimestamp =
    Number(timestamp);


  if (
    Number.isNaN(
      numericTimestamp
    )
  ) {
    return null;
  }


  const diff =
    Date.now()
    - numericTimestamp;


  return Math.max(
    0,
    Math.floor(
      diff
      / 86400000
    )
  );
}


function daysText(
  days
) {

  if (days === 0) {
    return "aujourd'hui";
  }


  if (days === 1) {
    return "hier";
  }


  return `il y a ${days} jours`;
}


function showPage(
  pageName
) {

  document
    .querySelectorAll(
      ".page"
    )
    .forEach(
      page => {
        page.classList.add(
          "hidden"
        );
      }
    );


  document
    .getElementById(
      `page-${pageName}`
    )
    .classList.remove(
      "hidden"
    );


  document
    .querySelectorAll(
      ".nav-button"
    )
    .forEach(
      button => {
        button.classList.remove(
          "active"
        );
      }
    );


  const button =
    document.querySelector(
      `.nav-button[data-page="${pageName}"]`
    );


  if (button) {
    button.classList.add(
      "active"
    );
  }


  window.scrollTo(
    0,
    0
  );


  if (
    pageName ===
    "history"
  ) {

    loadHistory();
  }


  if (
    pageName ===
    "health"
  ) {

    loadHealth();
  }
}


/* =========================================================
   AUTH
========================================================= */

document
  .getElementById(
    "login-button"
  )
  .addEventListener(
    "click",
    async () => {

      const email =
        document
          .getElementById(
            "login-email"
          )
          .value
          .trim();


      const password =
        document
          .getElementById(
            "login-password"
          )
          .value;


      const message =
        document.getElementById(
          "login-message"
        );


      if (
        !email
        || !password
      ) {

        message.textContent =
          "Renseigne ton email et ton mot de passe.";

        return;
      }


      message.textContent =
        "Connexion...";


      const {
        error
      } =
        await supabaseClient
          .auth
          .signInWithPassword({
            email,
            password
          });


      if (error) {

        message.textContent =
          "Connexion impossible : "
          + error.message;

        return;
      }


      message.textContent =
        "";

      await initialize();
    }
  );


document
  .getElementById(
    "forgot-password"
  )
  .addEventListener(
    "click",
    async () => {

      const email =
        document
          .getElementById(
            "login-email"
          )
          .value
          .trim();


      const message =
        document.getElementById(
          "login-message"
        );


      if (!email) {

        message.textContent =
          "Entre d'abord ton adresse email.";

        return;
      }


      const {
        error
      } =
        await supabaseClient
          .auth
          .resetPasswordForEmail(
            email,
            {
              redirectTo:
                "https://payetfabi1.github.io/keira-dashboard/"
            }
          );


      message.textContent =
        error
          ? error.message
          : "📩 Email envoyé. Clique sur le lien pour définir ton mot de passe.";
    }
  );


document
  .getElementById(
    "save-password"
  )
  .addEventListener(
    "click",
    async () => {

      const password =
        document
          .getElementById(
            "new-password"
          )
          .value;


      const message =
        document.getElementById(
          "password-message"
        );


      if (
        password.length < 8
      ) {

        message.textContent =
          "Utilise au moins 8 caractères.";

        return;
      }


      const {
        error
      } =
        await supabaseClient
          .auth
          .updateUser({
            password
          });


      if (error) {

        message.textContent =
          error.message;

        return;
      }


      message.textContent =
        "✅ Mot de passe enregistré.";


      setTimeout(
        () => {
          initialize();
        },
        800
      );
    }
  );


document
  .getElementById(
    "logout-button"
  )
  .addEventListener(
    "click",
    async () => {

      await supabaseClient
        .auth
        .signOut();

      location.reload();
    }
  );


/* =========================================================
   NAVIGATION
========================================================= */

document
  .querySelectorAll(
    "[data-page]"
  )
  .forEach(
    element => {

      element.addEventListener(
        "click",
        () => {

          showPage(
            element.dataset.page
          );
        }
      );
    }
  );


/* =========================================================
   GOAL UI
========================================================= */

function updateGoal(
  prefix,
  value,
  goal
) {

  const p =
    percent(
      value,
      goal
    );


  document
    .getElementById(
      `${prefix}-progress`
    )
    .style
    .width =
      `${p}%`;


  document
    .getElementById(
      `${prefix}-percent`
    )
    .textContent =
      `${p} %`;


  return p;
}


/* =========================================================
   DEVICE UI
========================================================= */

function setDevice(
  prefix,
  device
) {

  const status =
    document.getElementById(
      `${prefix}-status`
    );

  const wifi =
    document.getElementById(
      `${prefix}-wifi`
    );

  const extra =
    document.getElementById(
      `${prefix}-extra`
    );


  if (!device) {

    if (status) {
      status.textContent =
        "Données indisponibles";
    }

    if (wifi) {
      wifi.className =
        "wifi offline";
    }

    return;
  }


  if (!device.online) {

    if (status) {
      status.textContent =
        "Hors ligne";
    }

    if (wifi) {
      wifi.className =
        "wifi offline";
    }

    return;
  }


  if (status) {
    status.textContent =
      "En ligne";
  }


  /*
   * Compatibilité avec l'ancien affichage Wi-Fi.
   * Si l'élément n'existe plus dans le HTML,
   * on ne fait simplement rien.
   */
  if (wifi) {

    wifi.className =
      "wifi "
      + wifiClass(
        device.wifi_rssi,
        device.online
      );

    wifi.title =
      wifiLabel(
        device.wifi_rssi
      );
  }


  if (
    prefix === "feeder"
    &&
    extra
  ) {

    extra.textContent =
      device.food_available
        ? "Croquettes disponibles"
        : "⚠️ Croquettes faibles";
  }


  if (
    prefix === "fountain"
    &&
    extra
  ) {

    const waterPercent =
      device.water_percent;

    extra.textContent =
      waterPercent != null
        ? `Niveau d'eau : ${waterPercent}%`
        : "Fontaine opérationnelle";
  }
}


/* =========================================================
   MAINTENANCE
========================================================= */

function maintenanceHTML(
  feeder,
  fountain
) {

  const rawFountain =
    fountain?.raw_data
    || {};


  const rawFeeder =
    feeder?.raw_data
    || {};


  const filterAge =
    daysAgo(
      rawFountain
        .filterStartWorkingTime
    );


  const cleaningAge =
    daysAgo(
      rawFountain
        .machineCleaningTime
    );


  const feederFilterAge =
    daysAgo(
      rawFeeder
        .changeDesiccantTime
    );


  const rows = [];


  if (
    filterAge != null
  ) {

    rows.push(`
      <div class="maintenance-row">

        <span class="maintenance-icon">
          ${
            filterAge < 12
              ? "✅"
              : filterAge < 15
              ? "🟠"
              : "🔴"
          }
        </span>

        <div>

          <strong>
            Filtre fontaine
          </strong>

          <small>
            Changé ${daysText(filterAge)}
            ${
              filterAge >= 12
              && filterAge < 15
                ? " · à changer bientôt"
                : ""
            }

            ${
              filterAge >= 15
                ? " · à changer"
                : ""
            }
          </small>

        </div>

      </div>
    `);
  }


  if (
    cleaningAge != null
  ) {

    rows.push(`
      <div class="maintenance-row">

        <span class="maintenance-icon">
          ${
            cleaningAge < 12
              ? "✅"
              : cleaningAge < 15
              ? "🟠"
              : "🔴"
          }
        </span>

        <div>

          <strong>
            Nettoyage fontaine
          </strong>

          <small>
            Fait ${daysText(cleaningAge)}
            ${
              cleaningAge >= 12
              && cleaningAge < 15
                ? " · à refaire bientôt"
                : ""
            }

            ${
              cleaningAge >= 15
                ? " · à refaire"
                : ""
            }
          </small>

        </div>

      </div>
    `);
  }


  if (
    feederFilterAge != null
  ) {

    rows.push(`
      <div class="maintenance-row">

        <span class="maintenance-icon">
          ${
            feederFilterAge < 12
              ? "✅"
              : feederFilterAge < 15
              ? "🟠"
              : "🔴"
          }
        </span>

        <div>

          <strong>
            Filtre croquettes
          </strong>

          <small>
            Changé ${daysText(feederFilterAge)}

            ${
              feederFilterAge >= 12
              && feederFilterAge < 15
                ? " · à changer bientôt"
                : ""
            }

            ${
              feederFilterAge >= 15
                ? " · à changer"
                : ""
            }
          </small>

        </div>

      </div>
    `);
  }


  return rows.length
    ? rows.join("")
    : "✅ Rien à prévoir";
}


/* =========================================================
   HOME
========================================================= */

async function loadHome() {

  const today =
    parisDay();


  /* =======================================================
     CROQUETTES
  ======================================================= */

  const {
    data: feeding,
    error: feedingError
  } =
    await supabaseClient
      .from(
        "feeding_events"
      )
      .select("*")
      .eq(
        "success",
        true
      )
      .order(
        "event_time",
        {
          ascending: true
        }
      );


  if (
    feedingError
  ) {

    console.error(
      "feeding_events:",
      feedingError
    );
  }


  const todayFood =
    (feeding || [])
      .filter(
        event => {

          return parisDay(
            new Date(
              event.event_time
            )
          ) === today;
        }
      );


  const totalFood =
    todayFood.reduce(
      (
        sum,
        event
      ) => {

        return (
          sum
          + Number(
            event.actual_grams
            || 0
          )
        );
      },
      0
    );


  document
    .getElementById(
      "food-current"
    )
    .textContent =
      `${totalFood} g`;


  document
    .getElementById(
      "food-doses"
    )
    .textContent =
      `${todayFood.length} / ${FOOD_DOSES_GOAL} doses`;


  updateGoal(
    "food",
    totalFood,
    FOOD_GOAL
  );


  document
    .getElementById(
      "food-goal-state"
    )
    .textContent =
      totalFood >= FOOD_GOAL
        ? "✅ Objectif atteint"
        : `${Math.max(
            0,
            FOOD_GOAL
            - totalFood
          )} g restants`;


  /* =======================================================
     PATEE
  ======================================================= */

  const {
    data: wetFoodRows,
    error: wetFoodError
  } =
    await supabaseClient
      .from(
        "wet_food_entries"
      )
      .select("*")
      .eq(
        "day",
        today
      )
      .order(
        "given_at",
        {
          ascending: false
        }
      )
      .limit(1);


  if (
    wetFoodError
  ) {

    console.error(
      "wet_food_entries:",
      wetFoodError
    );
  }


  const wetFood =
    wetFoodRows?.[0];


  const wetFoodGrams =
    Number(
      wetFood?.grams
      || 0
    );


  document
    .getElementById(
      "wet-food-current"
    )
    .textContent =
      `${wetFoodGrams} g`;


  updateGoal(
    "wet-food",
    wetFoodGrams,
    WET_FOOD_GOAL
  );


  const wetButton =
    document.getElementById(
      "confirm-wet-food"
    );


  const wetState =
    document.getElementById(
      "wet-food-state"
    );


  const wetTime =
    document.getElementById(
      "wet-food-time"
    );


  if (
    wetFood
  ) {

    const givenAt =
      new Date(
        wetFood.given_at
      );


    const timeText =
      givenAt
        .toLocaleTimeString(
          "fr-FR",
          {
            hour: "2-digit",
            minute: "2-digit",
            timeZone:
              "Europe/Paris"
          }
        );


    wetState.textContent =
      "✅ Objectif atteint";


    wetTime.textContent =
      `Donnée à ${timeText}`;


    wetButton.textContent =
      "✅ Pâtée donnée";


    wetButton.disabled =
      true;


    wetButton.className =
      "wet-food-button done";

  } else {

    const parisHour =
      Number(
        new Intl
          .DateTimeFormat(
            "fr-FR",
            {
              timeZone:
                "Europe/Paris",

              hour:
                "2-digit",

              hour12:
                false
            }
          )
          .format(
            new Date()
          )
      );


    wetState.textContent =
      parisHour >= WET_FOOD_TIME
        ? "🥫 À donner"
        : "Prévue à 19:00";


    wetTime.textContent =
      "";


    wetButton.disabled =
      false;


    wetButton.textContent =
      "🥫 Pâtée donnée · 50 g";


    wetButton.className =
      parisHour >= WET_FOOD_TIME
        ? "wet-food-button due"
        : "wet-food-button";
  }


  /* =======================================================
     EAU
  ======================================================= */

  const {
    data: waterRows,
    error: waterError
  } =
    await supabaseClient
      .from(
        "water_daily"
      )
      .select("*")
      .eq(
        "day",
        today
      )
      .limit(1);


  if (
    waterError
  ) {

    console.error(
      "water_daily:",
      waterError
    );
  }


  const water =
    waterRows?.[0];


  const waterMl =
    Number(
      water?.total_ml
      || 0
    );


  const waterVisits =
    Number(
      water?.drink_times
      || 0
    );


  document
    .getElementById(
      "water-current"
    )
    .textContent =
      `${waterMl} ml`;


  document
    .getElementById(
      "water-visits"
    )
    .textContent =
      `${waterVisits} prise${
        waterVisits === 1
          ? ""
          : "s"
      }`;


  updateGoal(
    "water",
    waterMl,
    WATER_GOAL
  );


  document
    .getElementById(
      "water-goal-state"
    )
    .textContent =
      waterMl >= WATER_GOAL
        ? "✅ Objectif atteint"
        : `${Math.max(
            0,
            WATER_GOAL
            - waterMl
          )} ml restants`;





/* =======================================================
   DERNIÈRE MESURE
======================================================= */

const latestWeight =
  weights?.length
    ? weights[
        weights.length - 1
      ]
    : null;


document
  .getElementById(
    "health-current-weight"
  )
  .textContent =
    latestWeight
      ? `Dernier poids : ${Number(
          latestWeight.weight_kg
        ).toLocaleString(
          "fr-FR"
        )} kg`
      : "Aucune mesure";


/* =======================================================
   GRAPHIQUE
======================================================= */

const chartCanvas =
  document.getElementById(
    "weight-chart"
  );


if (
  chartCanvas
  &&
  weights?.length
) {

  /*
   * Détruit l'ancien graphique
   * si loadHealth() est rappelé.
   */

  if (
    window.keiraWeightChart
  ) {

    window
      .keiraWeightChart
      .destroy();
  }


  const labels =
    weights.map(
      weight =>
        new Date(
          `${weight.measured_at}T12:00:00`
        )
          .toLocaleDateString(
            "fr-FR",
            {
              day:
                "2-digit",

              month:
                "2-digit",

              year:
                "2-digit",
            }
          )
    );


  const values =
    weights.map(
      weight =>
        Number(
          weight.weight_kg
        )
    );


  window.keiraWeightChart =
    new Chart(
      chartCanvas,
      {

        type:
          "line",

        data: {

          labels,

          datasets: [
            {
              label:
                "Poids",

              data:
                values,

              borderWidth:
                3,

              pointRadius:
                5,

              pointHoverRadius:
                7,

              tension:
                0.32,

              fill:
                true,
            }
          ]
        },


        options: {

          responsive:
            true,

          maintainAspectRatio:
            false,

          plugins: {

            legend: {
              display:
                false
            },

            tooltip: {

              callbacks: {

                label:
                  context =>
                    `${context.parsed.y.toLocaleString(
                      "fr-FR"
                    )} kg`
              }
            }
          },


          interaction: {

            mode:
              "index",

            intersect:
              false
          },


          scales: {

            x: {

              grid: {
                display:
                  false
              },

              ticks: {

                maxRotation:
                  0,

                autoSkip:
                  true,

                maxTicksLimit:
                  5
              }
            },


            y: {

              suggestedMin:
                5.8,

              suggestedMax:
                7.0,

              ticks: {

                callback:
                  value =>
                    `${Number(
                      value
                    ).toLocaleString(
                      "fr-FR"
                    )}`
              }
            }
          }
        }
      }
    );
}


/* =======================================================
   VARIATION TOTALE
======================================================= */

const weightSummary =
  document.getElementById(
    "weight-summary"
  );


if (
  weightSummary
  &&
  weights?.length >= 2
) {

  const first =
    Number(
      weights[0]
        .weight_kg
    );


  const last =
    Number(
      latestWeight
        .weight_kg
    );


  const difference =
    Number(
      (
        last - first
      )
        .toFixed(2)
    );


  const sign =
    difference > 0
      ? "+"
      : "";


  weightSummary.innerHTML =
    `
      <strong>
        ${
          difference < 0
            ? "↘️"
            : difference > 0
            ? "↗️"
            : "➡️"
        }

        Variation totale :
        ${sign}${difference.toLocaleString(
          "fr-FR"
        )} kg
      </strong>

      <small>
        Du
        ${formatDate(
          weights[0]
            .measured_at
        )}
        au
        ${formatDate(
          latestWeight
            .measured_at
        )}
      </small>
    `;
}


/* =======================================================
   HISTORIQUE
======================================================= */

const weightHistory =
  document.getElementById(
    "weight-history"
  );


if (
  weightHistory
) {

  weightHistory.innerHTML =
    weights?.length

      ? [...weights]
        .reverse()
        .map(
          (
            weight,
            index,
            reversedWeights
          ) => {

            const current =
              Number(
                weight.weight_kg
              );


            /*
             * Dans la liste inversée,
             * la mesure précédente
             * se trouve à index + 1.
             */

            const previous =
              reversedWeights[
                index + 1
              ];


            let variationHTML =
              `<span class="weight-delta neutral">—</span>`;


            if (
              previous
            ) {

              const previousValue =
                Number(
                  previous.weight_kg
                );


              const difference =
                Number(
                  (
                    current
                    - previousValue
                  )
                    .toFixed(2)
                );


              const sign =
                difference > 0
                  ? "+"
                  : "";


              const className =
                difference < 0
                  ? "down"
                  : difference > 0
                  ? "up"
                  : "neutral";


              variationHTML =
                `
                  <span
                    class="weight-delta ${className}"
                  >
                    ${
                      difference < 0
                        ? "↓"
                        : difference > 0
                        ? "↑"
                        : "→"
                    }

                    ${sign}${difference.toLocaleString(
                      "fr-FR"
                    )} kg
                  </span>
                `;
            }


            return `
              <div class="weight-history-row">

                <span>
                  ${formatDate(
                    weight.measured_at
                  )}
                </span>

                <strong>
                  ${current.toLocaleString(
                    "fr-FR"
                  )} kg
                </strong>

                ${variationHTML}

              </div>
            `;
          }
        )
        .join("")

      : `
        <div class="health-row">
          Aucune mesure
        </div>
      `;

  setupHistoryToggle(
  weightHistory,
  ".weight-history-row",
  3
);
  
}


  /* =======================================================
     SUIVI SANTÉ - ACCUEIL
  ======================================================= */
  
  const {
    data: homeVaccines,
    error: homeVaccinesError
  } =
    await supabaseClient
      .from(
        "vaccinations"
      )
      .select("*")
      .order(
        "vaccination_date",
        {
          ascending: false
        }
      )
      .limit(1);
  
  
  if (
    homeVaccinesError
  ) {
    console.error(
      "home vaccinations:",
      homeVaccinesError
    );
  }
  
  
  const {
    data: homeTreatments,
    error: homeTreatmentsError
  } =
    await supabaseClient
      .from(
        "treatments"
      )
      .select("*")
      .order(
        "administered_at",
        {
          ascending: false
        }
      );
  
  
  if (
    homeTreatmentsError
  ) {
    console.error(
      "home treatments:",
      homeTreatmentsError
    );
  }
  
  
  const homeLatestVaccine =
    homeVaccines?.[0];
  
  
  const homeLatestDewormer =
    homeTreatments
      ?.find(
        treatment =>
          treatment
            .treatment_type
          === "Vermifuge"
      );
  
  
  const homeLatestAntiparasitic =
    homeTreatments
      ?.find(
        treatment =>
          treatment
            .treatment_type
          === "Antiparasitaire"
      );
  
  
  const homeVaccineStatus =
    healthDueStatus(
      homeLatestVaccine
        ?.next_due_date
    );
  
  
  const homeDewormerStatus =
    healthDueStatus(
      homeLatestDewormer
        ?.next_due_date
    );
  
  
  const homeAntiparasiticStatus =
    healthDueStatus(
      homeLatestAntiparasitic
        ?.next_due_date
    );
  
  
  function homeHealthRow(
    icon,
    title,
    status,
    dueDate
  ) {
  
    return `
      <div
        class="home-health-row ${status.className}"
      >
  
        <div class="home-health-icon">
          ${icon}
        </div>
  
  
        <div class="home-health-main">
  
          <strong>
            ${title}
          </strong>
  
          <small>
            ${
              dueDate
                ? `Échéance ${formatDate(
                    dueDate
                  )}`
                : "Échéance non renseignée"
            }
          </small>
  
        </div>
  
  
        <div class="home-health-status">
  
          <strong>
            ${status.icon}
          </strong>
  
          <small>
            ${status.label}
          </small>
  
        </div>
  
      </div>
    `;
  }
  
  
  const homeHealthAlerts =
    document.getElementById(
      "home-health-alerts"
    );
  
  
  if (
    homeHealthAlerts
  ) {
  
    homeHealthAlerts.innerHTML =
      homeHealthRow(
        "💉",
        "Vaccins",
        homeVaccineStatus,
        homeLatestVaccine
          ?.next_due_date
      )
  
      +
  
      homeHealthRow(
        "💊",
        "Vermifuge",
        homeDewormerStatus,
        homeLatestDewormer
          ?.next_due_date
      )
  
      +
  
      homeHealthRow(
        "🦟",
        "Antiparasitaire",
        homeAntiparasiticStatus,
        homeLatestAntiparasitic
          ?.next_due_date
      );
  }
  
  
  /* =======================================================
     DEVICES
  ======================================================= */

  const {
    data: devices,
    error: devicesError
  } =
    await supabaseClient
      .from(
        "device_status"
      )
      .select("*")
      .order(
        "measured_at",
        {
          ascending: false
        }
      )
      .limit(20);


  if (
    devicesError
  ) {

    console.error(
      "device_status:",
      devicesError
    );
  }


  const feeder =
    devices?.find(
      device =>
        device.device_model
        === "PLAF203"
    );


  const fountain =
    devices?.find(
      device =>
        device.device_model
        === "PLWF105"
    );


  setDevice(
    "feeder",
    feeder
  );


  setDevice(
    "fountain",
    fountain
  );


  document
    .getElementById(
      "maintenance-list"
    )
    .innerHTML =
      maintenanceHTML(
        feeder,
        fountain
      );


  /* =======================================================
     GLOBAL STATE
  ======================================================= */

  const allOK =
    Boolean(
      feeder?.online
      && fountain?.online
    );


  const global =
    document.getElementById(
      "global-status"
    );


  global.textContent =
    allOK
      ? "● En ligne"
      : "● Attention";


  global.className =
    allOK
      ? "status ok"
      : "status ko";


  document
    .getElementById(
      "health-message"
    )
    .textContent =
      allOK
        ? "Tout va bien 💚"
        : "Attention requise ⚠️";


  document
    .getElementById(
      "updated"
    )
    .textContent =
      new Date()
        .toLocaleTimeString(
          "fr-FR",
          {
            hour: "2-digit",
            minute: "2-digit"
          }
        );
}


/* =========================================================
   HISTORY
========================================================= */

function last7Days() {

  const days = [];

  const now =
    new Date();


  for (
    let i = 0;
    i < 7;
    i++
  ) {

    const date =
      new Date(
        now
      );


    date.setDate(
      now.getDate()
      - i
    );


    days.push(
      parisDay(
        date
      )
    );
  }


  return days;
}


async function loadHistory() {

  const days =
    last7Days();


  const oldestDay =
    days[
      days.length - 1
    ];


  const {
    data: feeding
  } =
    await supabaseClient
      .from(
        "feeding_events"
      )
      .select("*")
      .eq(
        "success",
        true
      )
      .order(
        "event_time",
        {
          ascending: true
        }
      );


  const {
    data: water
  } =
    await supabaseClient
      .from(
        "water_daily"
      )
      .select("*")
      .gte(
        "day",
        oldestDay
      );


  const {
    data: wetFood
  } =
    await supabaseClient
      .from(
        "wet_food_entries"
      )
      .select("*")
      .gte(
        "day",
        oldestDay
      )
      .order(
        "day",
        {
          ascending: false
        }
      );


  const container =
    document.getElementById(
      "daily-history"
    );


  container.innerHTML =
    days
      .map(
        (
          day,
          index
        ) => {

          const foodEvents =
            (feeding || [])
              .filter(
                event => {

                  return (
                    parisDay(
                      new Date(
                        event.event_time
                      )
                    )
                    === day
                  );
                }
              );


          const grams =
            foodEvents
              .reduce(
                (
                  sum,
                  event
                ) => {

                  return (
                    sum
                    + Number(
                      event.actual_grams
                      || 0
                    )
                  );
                },
                0
              );


          const waterRow =
            water?.find(
              item =>
                item.day === day
            );


          const ml =
            Number(
              waterRow
                ?.total_ml
              || 0
            );


          const drinks =
            Number(
              waterRow
                ?.drink_times
              || 0
            );


          const wetFoodRow =
            wetFood?.find(
              item =>
                item.day === day
            );


          const wetGrams =
            Number(
              wetFoodRow
                ?.grams
              || 0
            );


          const foodPct =
            percent(
              grams,
              FOOD_GOAL
            );


          const wetPct =
            percent(
              wetGrams,
              WET_FOOD_GOAL
            );


          const waterPct =
            percent(
              ml,
              WATER_GOAL
            );


          const label =
            index === 0
              ? "Aujourd'hui"

              : index === 1
              ? "Hier"

              : new Date(
                  `${day}T12:00:00`
                )
                .toLocaleDateString(
                  "fr-FR",
                  {
                    weekday:
                      "long",

                    day:
                      "numeric",

                    month:
                      "short"
                  }
                );


          const mealTimes =
            foodEvents
              .map(
                event => {

                  const time =
                    new Date(
                      event.event_time
                    )
                    .toLocaleTimeString(
                      "fr-FR",
                      {
                        hour:
                          "2-digit",

                        minute:
                          "2-digit",

                        timeZone:
                          "Europe/Paris"
                      }
                    );


                  const manual =
                    event.event_type
                    ===
                    "MANUAL_FEEDING_SUCCESS";


                  return manual
                    ? `${time} manuel`
                    : `${time} ✅`;
                }
              )
              .join(" · ");


          let wetGivenTime =
            "";


          if (
            wetFoodRow?.given_at
          ) {

            wetGivenTime =
              new Date(
                wetFoodRow.given_at
              )
              .toLocaleTimeString(
                "fr-FR",
                {
                  hour:
                    "2-digit",

                  minute:
                    "2-digit",

                  timeZone:
                    "Europe/Paris"
                }
              );
          }


          return `
            <article class="day-card">

              <div class="day-title">

                <strong>
                  ${label}
                </strong>

                <small>
                  ${day}
                </small>

              </div>


              <!-- CROQUETTES -->

              <div class="history-goal">

                <div class="history-goal-header">

                  <strong>
                    🍗 ${foodEvents.length}/3 doses
                  </strong>

                  <span>
                    ${grams}/30 g
                    ${
                      grams >= FOOD_GOAL
                        ? "✅"
                        : ""
                    }
                  </span>

                </div>


                <div class="history-progress">

                  <div
                    style="width:${foodPct}%"
                  ></div>

                </div>


                <div class="meal-times">

                  ${
                    mealTimes
                    || "Aucune distribution"
                  }

                </div>

              </div>


              <!-- PATEE -->

              <div class="history-goal">

                <div class="history-goal-header">

                  <strong>
                    🥫 Pâtée
                  </strong>

                  <span>
                    ${wetGrams}/50 g
                    ${
                      wetGrams >=
                      WET_FOOD_GOAL
                        ? "✅"
                        : ""
                    }
                  </span>

                </div>


                <div
                  class="history-progress wet-food"
                >

                  <div
                    style="width:${wetPct}%"
                  ></div>

                </div>


                <div
                  class="wet-food-history-state"
                >

                  ${
                    wetFoodRow

                      ? `Donnée à ${wetGivenTime}`

                      : index === 0

                      ? "Prévue à 19:00"

                      : "Non enregistrée"
                  }

                </div>

              </div>


              <!-- WATER -->

              <div class="history-goal">

                <div class="history-goal-header">

                  <strong>
                    💧 ${drinks} prise${
                      drinks === 1
                        ? ""
                        : "s"
                    }
                  </strong>

                  <span>
                    ${ml}/100 ml
                    ${
                      ml >= WATER_GOAL
                        ? "✅"
                        : ""
                    }
                  </span>

                </div>


                <div
                  class="history-progress water"
                >

                  <div
                    style="width:${waterPct}%"
                  ></div>

                </div>

              </div>

            </article>
          `;
        }
      )
      .join("");
}


/* =========================================================
   HEALTH
========================================================= */

function healthDueStatus(
  dateValue
) {

  if (!dateValue) {

    return {
      icon: "⚪",
      label: "Échéance à définir",
      className: "health-due-neutral",
      days: null,
    };
  }


  const today =
    new Date(
      `${parisDay()}T12:00:00`
    );


  const dueDate =
    new Date(
      `${dateValue}T12:00:00`
    );


  const diffDays =
    Math.ceil(
      (
        dueDate.getTime()
        - today.getTime()
      )
      / 86400000
    );


  if (
    diffDays < 0
  ) {

    return {
      icon: "🔴",
      label:
        `En retard de ${Math.abs(diffDays)} jour${
          Math.abs(diffDays) === 1
            ? ""
            : "s"
        }`,
      className:
        "health-due-late",
      days:
        diffDays,
    };
  }


  if (
    diffDays === 0
  ) {

    return {
      icon: "🔴",
      label:
        "À faire aujourd'hui",
      className:
        "health-due-late",
      days:
        0,
    };
  }


  if (
    diffDays <= 30
  ) {

    return {
      icon: "🟠",
      label:
        `Dans ${diffDays} jour${
          diffDays === 1
            ? ""
            : "s"
        }`,
      className:
        "health-due-soon",
      days:
        diffDays,
    };
  }


  return {
    icon: "🟢",
    label:
      `Dans ${diffDays} jours`,
    className:
      "health-due-ok",
    days:
      diffDays,
  };
}


/* =========================================================
   HISTORIQUE - VOIR PLUS / RÉDUIRE
========================================================= */

function setupHistoryToggle(
  container,
  rowSelector,
  limit = 3
) {

  if (!container) {
    return;
  }


  const rows =
    Array.from(
      container.querySelectorAll(
        rowSelector
      )
    );


  if (
    rows.length <= limit
  ) {
    return;
  }


  rows.forEach(
    (
      row,
      index
    ) => {

      if (
        index >= limit
      ) {

        row.classList.add(
          "history-row-hidden"
        );
      }
    }
  );


  const button =
    document.createElement(
      "button"
    );


  button.className =
    "history-toggle-button";


  button.innerHTML =
    `
      <span>
        Voir tout
      </span>

      <span class="history-toggle-chevron">
        ↓
      </span>
    `;


  let expanded =
    false;


  button.addEventListener(
    "click",
    () => {

      expanded =
        !expanded;


      rows.forEach(
        (
          row,
          index
        ) => {

          if (
            index < limit
          ) {
            return;
          }


          row.classList.toggle(
            "history-row-hidden",
            !expanded
          );
        }
      );


      button.innerHTML =
        expanded

          ? `
              <span>
                Réduire
              </span>

              <span class="history-toggle-chevron">
                ↑
              </span>
            `

          : `
              <span>
                Voir tout
              </span>

              <span class="history-toggle-chevron">
                ↓
              </span>
            `;
    }
  );


  container.appendChild(
    button
  );
}

async function loadHealth() {

  /* =======================================================
     POIDS
  ======================================================= */

  const {
    data: weights
  } =
    await supabaseClient
      .from(
        "weight_entries"
      )
      .select("*")
      .order(
        "measured_at",
        {
          ascending:
            false
        }
      );


  document
    .getElementById(
      "health-current-weight"
    )
    .textContent =
      weights?.length
        ? `${weights[0].weight_kg} kg`
        : "Aucune mesure";


  document
    .getElementById(
      "weight-history"
    )
    .innerHTML =
      weights?.length

        ? weights
          .slice(
            0,
            10
          )
          .map(
            weight => {

              return `
                <div class="health-row">

                  <span>
                    ${formatDate(
                      weight.measured_at
                    )}
                  </span>

                  <strong>
                    ${weight.weight_kg} kg
                  </strong>

                </div>
              `;
            }
          )
          .join("")

        : `
          <div class="health-row">
            Aucune donnée
          </div>
        `;


  /* =======================================================
     VACCINS
  ======================================================= */

  const {
    data: vaccines,
    error: vaccinesError
  } =
    await supabaseClient
      .from(
        "vaccinations"
      )
      .select("*")
      .order(
        "vaccination_date",
        {
          ascending:
            false
        }
      );


  if (
    vaccinesError
  ) {

    console.error(
      "vaccinations:",
      vaccinesError
    );
  }


  const latestVaccine =
    vaccines?.[0];


  const vaccineStatus =
    healthDueStatus(
      latestVaccine
        ?.next_due_date
    );


  document
    .getElementById(
      "vaccination-list"
    )
    .innerHTML =
      vaccines?.length

        ? `

          <div
            class="health-due-card ${vaccineStatus.className}"
          >

            <div class="health-due-icon">
              ${vaccineStatus.icon}
            </div>

            <div class="health-due-main">

              <strong>
                Vaccins
              </strong>

              <span>
                ${vaccineStatus.label}
              </span>

              ${
                latestVaccine
                  ?.next_due_date

                  ? `
                    <small>
                      Prochain rappel :
                      ${formatDate(
                        latestVaccine.next_due_date
                      )}
                    </small>
                  `

                  : `
                    <small>
                      Aucun prochain rappel renseigné
                    </small>
                  `
              }

            </div>

          </div>


          <div class="health-history-title">
            Historique
          </div>


          ${
            vaccines
              .map(
                vaccine => {

                  const status =
                    healthDueStatus(
                      vaccine.next_due_date
                    );


                  return `
                    <div class="health-row">

                      <div>

                        <strong>
                          💉 ${vaccine.vaccine_name}
                        </strong>

                        <small>
                          Vacciné le
                          ${formatDate(
                            vaccine.vaccination_date
                          )}
                        </small>

                      </div>


                      <div class="health-row-right">

                        ${
                          vaccine.next_due_date

                            ? `
                              <small>
                                Rappel
                                ${formatDate(
                                  vaccine.next_due_date
                                )}
                              </small>
                            `

                            : `
                              <small>
                                Pas de rappel renseigné
                              </small>
                            `
                        }

                      </div>

                    </div>
                  `;
                }
              )
              .join("")
          }
        `

        : `
          <div class="health-row">
            Aucun vaccin
          </div>
        `;


  /* =======================================================
     TRAITEMENTS
  ======================================================= */

  const {
    data: treatments,
    error: treatmentsError
  } =
    await supabaseClient
      .from(
        "treatments"
      )
      .select("*")
      .order(
        "administered_at",
        {
          ascending:
            false
        }
      );


  if (
    treatmentsError
  ) {

    console.error(
      "treatments:",
      treatmentsError
    );
  }


  const latestDewormer =
    treatments
      ?.find(
        treatment =>
          treatment
            .treatment_type
          === "Vermifuge"
      );


  const latestAntiparasitic =
    treatments
      ?.find(
        treatment =>
          treatment
            .treatment_type
          === "Antiparasitaire"
      );


  const dewormerStatus =
    healthDueStatus(
      latestDewormer
        ?.next_due_date
    );


  const antiparasiticStatus =
    healthDueStatus(
      latestAntiparasitic
        ?.next_due_date
    );


  document
    .getElementById(
      "treatment-list"
    )
    .innerHTML =
      `

        <!-- VERMIFUGE -->

        <div
          class="health-due-card ${dewormerStatus.className}"
        >

          <div class="health-due-icon">
            ${dewormerStatus.icon}
          </div>

          <div class="health-due-main">

            <strong>
              💊 Vermifuge
            </strong>

            <span>
              ${dewormerStatus.label}
            </span>

            ${
              latestDewormer

                ? `
                  <small>
                    Dernier :
                    ${
                      latestDewormer
                        .product_name
                        || "Vermifuge"
                    }
                    ·
                    ${formatDate(
                      latestDewormer
                        .administered_at
                    )}
                  </small>
                `

                : `
                  <small>
                    Aucun vermifuge enregistré
                  </small>
                `
            }


            ${
              latestDewormer
                ?.next_due_date

                ? `
                  <small>
                    Prochaine échéance :
                    ${formatDate(
                      latestDewormer
                        .next_due_date
                    )}
                  </small>
                `

                : ""
            }

          </div>

        </div>


        <!-- ANTIPARASITAIRE -->

        <div
          class="health-due-card ${antiparasiticStatus.className}"
        >

          <div class="health-due-icon">
            ${antiparasiticStatus.icon}
          </div>

          <div class="health-due-main">

            <strong>
              🦟 Antiparasitaire
            </strong>

            <span>
              ${antiparasiticStatus.label}
            </span>

            ${
              latestAntiparasitic

                ? `
                  <small>
                    Dernier :
                    ${
                      latestAntiparasitic
                        .product_name
                        || "Antiparasitaire"
                    }
                    ·
                    ${formatDate(
                      latestAntiparasitic
                        .administered_at
                    )}
                  </small>
                `

                : `
                  <small>
                    Aucun antiparasitaire enregistré
                  </small>
                `
            }

          </div>

        </div>


        <div class="health-history-title">
          Historique
        </div>


        ${
          treatments?.length

            ? treatments
              .map(
                treatment => {

                  return `
                    <div class="health-row">

                      <div>

                        <strong>
                          ${
                            treatment
                              .treatment_type
                            === "Vermifuge"
                              ? "💊"
                              : treatment
                                  .treatment_type
                                === "Antiparasitaire"
                              ? "🦟"
                              : "💉"
                          }

                          ${treatment.treatment_type}
                        </strong>

                        <small>
                          ${
                            treatment.product_name
                            || ""
                          }
                        </small>

                      </div>


                      <div class="health-row-right">

                        <strong>
                          ${formatDate(
                            treatment
                              .administered_at
                          )}
                        </strong>

                        ${
                          treatment
                            .next_due_date

                            ? `
                              <small>
                                Échéance
                                ${formatDate(
                                  treatment
                                    .next_due_date
                                )}
                              </small>
                            `

                            : ""
                        }

                      </div>

                    </div>
                  `;
                }
              )
              .join("")

            : `
              <div class="health-row">
                Aucun traitement
              </div>
            `
        }
      `;
}


/* =========================================================
   MODALS
========================================================= */

document
  .querySelectorAll(
    "[data-modal]"
  )
  .forEach(
    button => {

      button.addEventListener(
        "click",
        () => {

          document
            .getElementById(
              button.dataset.modal
            )
            .classList.remove(
              "hidden"
            );
        }
      );
    }
  );


document
  .querySelectorAll(
    ".cancel-button"
  )
  .forEach(
    button => {

      button.addEventListener(
        "click",
        () => {

          button
            .closest(
              ".modal"
            )
            .classList.add(
              "hidden"
            );
        }
      );
    }
  );


/* =========================================================
   SAVE WEIGHT
========================================================= */

document
  .getElementById(
    "save-weight"
  )
  .addEventListener(
    "click",
    async () => {

      const value =
        parseFloat(
          document
            .getElementById(
              "weight-input"
            )
            .value
        );


      if (!value) {
        return;
      }


      const {
        error
      } =
        await supabaseClient
          .from(
            "weight_entries"
          )
          .insert({
            weight_kg:
              value,

            notes:
              document
                .getElementById(
                  "weight-note"
                )
                .value
              || null
          });


      if (
        error
      ) {

        alert(
          "Erreur : "
          + error.message
        );

        return;
      }


      document
        .getElementById(
          "weight-modal"
        )
        .classList.add(
          "hidden"
        );


      document
        .getElementById(
          "weight-input"
        )
        .value =
          "";


      document
        .getElementById(
          "weight-note"
        )
        .value =
          "";


      await loadHealth();
      await loadHome();
    }
  );


/* =========================================================
   SAVE VACCINE
========================================================= */

document
  .getElementById(
    "save-vaccine"
  )
  .addEventListener(
    "click",
    async () => {

      const name =
        document
          .getElementById(
            "vaccine-name"
          )
          .value
          .trim();


      const date =
        document
          .getElementById(
            "vaccine-date"
          )
          .value;


      const next =
        document
          .getElementById(
            "vaccine-next"
          )
          .value;


      if (
        !name
        || !date
      ) {
        return;
      }


      const {
        error
      } =
        await supabaseClient
          .from(
            "vaccinations"
          )
          .insert({
            vaccine_name:
              name,

            vaccination_date:
              date,

            next_due_date:
              next
              || null
          });


      if (
        error
      ) {

        alert(
          "Erreur : "
          + error.message
        );

        return;
      }


      document
        .getElementById(
          "vaccine-modal"
        )
        .classList.add(
          "hidden"
        );


      await loadHealth();
      await loadHome();
    }
  );

/* =========================================================
   TREATMENT AUTO DUE DATE
========================================================= */

function calculateTreatmentDueDate() {

  const treatmentType =
    document
      .getElementById(
        "treatment-type"
      )
      .value;


  const administeredAt =
    document
      .getElementById(
        "treatment-date"
      )
      .value;


  const nextInput =
    document
      .getElementById(
        "treatment-next"
      );


  if (
    !administeredAt
    ||
    !nextInput
  ) {

    return;
  }


  function addMonthsSafe(
    dateString,
    months
  ) {

    const [
      year,
      month,
      day
    ] =
      dateString
        .split("-")
        .map(Number);


    const targetMonthIndex =
      (
        month - 1
        + months
      );


    const targetYear =
      year
      + Math.floor(
        targetMonthIndex / 12
      );


    const targetMonth =
      (
        (
          targetMonthIndex % 12
        )
        + 12
      )
      % 12;


    const lastDayOfTargetMonth =
      new Date(
        targetYear,
        targetMonth + 1,
        0
      )
        .getDate();


    const targetDay =
      Math.min(
        day,
        lastDayOfTargetMonth
      );


    return [
      targetYear,
      String(
        targetMonth + 1
      )
        .padStart(
          2,
          "0"
        ),
      String(
        targetDay
      )
        .padStart(
          2,
          "0"
        ),
    ]
      .join("-");
  }


  if (
    treatmentType ===
    "Vermifuge"
  ) {

    nextInput.value =
      addMonthsSafe(
        administeredAt,
        6
      );

    nextInput.readOnly =
      true;

    return;
  }


  if (
    treatmentType ===
    "Antiparasitaire"
  ) {

    nextInput.value =
      addMonthsSafe(
        administeredAt,
        12
      );

    nextInput.readOnly =
      true;

    return;
  }


  /*
   * Médicament / Autre :
   * saisie manuelle autorisée.
   */
  nextInput.readOnly =
    false;
}


const treatmentTypeInput =
  document.getElementById(
    "treatment-type"
  );

const treatmentDateInput =
  document.getElementById(
    "treatment-date"
  );


treatmentTypeInput
  ?.addEventListener(
    "change",
    calculateTreatmentDueDate
  );


treatmentDateInput
  ?.addEventListener(
    "change",
    calculateTreatmentDueDate
  );


treatmentDateInput
  ?.addEventListener(
    "input",
    calculateTreatmentDueDate
  );

/* =========================================================
   SAVE TREATMENT
========================================================= */

document
  .getElementById(
    "save-treatment"
  )
  .addEventListener(
    "click",
    async () => {

      const treatmentType =
        document
          .getElementById(
            "treatment-type"
          )
          .value;


      const productName =
        document
          .getElementById(
            "treatment-product"
          )
          .value
          .trim();


      const administeredAt =
        document
          .getElementById(
            "treatment-date"
          )
          .value;


      if (!administeredAt) {
        return;
      }


      /* =====================================================
         CALCUL AUTOMATIQUE DE L'ÉCHÉANCE
      ===================================================== */

      let nextDueDate =
        null;


      function addMonthsSafe(
        dateString,
        months
      ) {

        const [
          year,
          month,
          day
        ] =
          dateString
            .split("-")
            .map(Number);


        const targetMonthIndex =
          (
            month - 1
            + months
          );


        const targetYear =
          year
          + Math.floor(
            targetMonthIndex / 12
          );


        const targetMonth =
          (
            (
              targetMonthIndex % 12
            )
            + 12
          )
          % 12;


        /*
         * Dernier jour du mois cible.
         */
        const lastDayOfTargetMonth =
          new Date(
            targetYear,
            targetMonth + 1,
            0
          )
            .getDate();


        /*
         * Si on part du 31 août et qu'on ajoute 6 mois,
         * on obtient le 28/29 février, pas début mars.
         */
        const targetDay =
          Math.min(
            day,
            lastDayOfTargetMonth
          );


        return [
          targetYear,
          String(
            targetMonth + 1
          )
            .padStart(
              2,
              "0"
            ),
          String(
            targetDay
          )
            .padStart(
              2,
              "0"
            ),
        ]
          .join("-");
      }


      if (
        treatmentType ===
        "Vermifuge"
      ) {

        /*
         * Vermifuge :
         * prochaine échéance dans 6 mois.
         */
        nextDueDate =
          addMonthsSafe(
            administeredAt,
            6
          );
      }


      if (
        treatmentType ===
        "Antiparasitaire"
      ) {

        /*
         * Antiparasitaire :
         * prochaine échéance dans 12 mois.
         */
        nextDueDate =
          addMonthsSafe(
            administeredAt,
            12
          );
      }


      /*
       * Pour Médicament / Autre :
       * on garde éventuellement la date saisie
       * manuellement dans le formulaire.
       */
      if (
        treatmentType !==
          "Vermifuge"
        &&
        treatmentType !==
          "Antiparasitaire"
      ) {

        nextDueDate =
          document
            .getElementById(
              "treatment-next"
            )
            .value
          || null;
      }


      /* =====================================================
         ENREGISTREMENT SUPABASE
      ===================================================== */

      const {
        error
      } =
        await supabaseClient
          .from(
            "treatments"
          )
          .insert({

            treatment_type:
              treatmentType,

            product_name:
              productName
              || null,

            administered_at:
              administeredAt,

            next_due_date:
              nextDueDate,
          });


      if (
        error
      ) {

        alert(
          "Erreur : "
          + error.message
        );

        return;
      }


      /* =====================================================
         FERMETURE + RESET DU FORMULAIRE
      ===================================================== */

      document
        .getElementById(
          "treatment-modal"
        )
        .classList.add(
          "hidden"
        );


      document
        .getElementById(
          "treatment-product"
        )
        .value =
          "";


      document
        .getElementById(
          "treatment-date"
        )
        .value =
          "";


      document
        .getElementById(
          "treatment-next"
        )
        .value =
          "";


      await loadHealth();
      await loadHome();
    }
  );

/* =========================================================
   WET FOOD BUTTON
========================================================= */

document
  .getElementById(
    "confirm-wet-food"
  )
  .addEventListener(
    "click",
    async () => {

      const button =
        document.getElementById(
          "confirm-wet-food"
        );


      if (
        button.disabled
      ) {
        return;
      }


      button.disabled =
        true;


      button.textContent =
        "Enregistrement...";


      const today =
        parisDay();


      /*
       * Vérification applicative
       * avant insertion.
       */

      const {
        data: existing,
        error: checkError
      } =
        await supabaseClient
          .from(
            "wet_food_entries"
          )
          .select(
            "id,given_at,grams"
          )
          .eq(
            "day",
            today
          )
          .limit(1);


      if (
        checkError
      ) {

        console.error(
          checkError
        );


        alert(
          "Impossible de vérifier la pâtée."
        );


        button.disabled =
          false;


        button.textContent =
          "🥫 Pâtée donnée · 50 g";


        return;
      }


      /*
       * Déjà enregistrée aujourd'hui :
       * aucun doublon.
       */

      if (
        existing?.length
      ) {

        await loadHome();

        return;
      }


      const {
        error
      } =
        await supabaseClient
          .from(
            "wet_food_entries"
          )
          .insert({

            day:
              today,

            grams:
              WET_FOOD_GOAL
          });


      if (
        error
      ) {

        /*
         * L'index UNIQUE(day)
         * constitue le deuxième
         * garde-fou anti doublon.
         */

        console.error(
          error
        );


        await loadHome();

        return;
      }


      await loadHome();
    }
  );


/* =========================================================
   INIT
========================================================= */

async function initialize() {

  const {
    data: {
      session
    }
  } =
    await supabaseClient
      .auth
      .getSession();


  if (!session) {

    dashboard.classList.add(
      "hidden"
    );


    passwordScreen
      .classList.add(
        "hidden"
      );


    loginScreen
      .classList.remove(
        "hidden"
      );


    return;
  }


  loginScreen
    .classList.add(
      "hidden"
    );


  passwordScreen
    .classList.add(
      "hidden"
    );


  dashboard
    .classList.remove(
      "hidden"
    );


  try {

    await loadHome();

  } catch (
    error
  ) {

    console.error(
      "Keira Dashboard:",
      error
    );


    document
      .getElementById(
        "health-message"
      )
      .textContent =
        "Données indisponibles ⚠️";
  }
}


/* =========================================================
   AUTH EVENTS
========================================================= */

supabaseClient
  .auth
  .onAuthStateChange(
    (
      event,
      session
    ) => {

      if (
        event ===
        "PASSWORD_RECOVERY"
      ) {

        loginScreen
          .classList.add(
            "hidden"
          );


        dashboard
          .classList.add(
            "hidden"
          );


        passwordScreen
          .classList.remove(
            "hidden"
          );


        return;
      }


      if (
        event ===
        "SIGNED_IN"
      ) {

        initialize();
      }
    }
  );


initialize();

// =========================================================
// AUTO REFRESH DASHBOARD
// =========================================================

setInterval(
  async () => {

    const {
      data: {
        session
      }
    } =
      await supabaseClient
        .auth
        .getSession();


    if (!session) {
      return;
    }


    console.log(
      "🔄 Actualisation automatique Keira"
    );


    await loadHome();


    const historyPage =
      document.getElementById(
        "page-history"
      );


    if (
      historyPage &&
      !historyPage.classList.contains(
        "hidden"
      )
    ) {

      await loadHistory();
    }

  },

  60 * 1000
);


// =========================================================
// FEEDER ACTION SHEET
// =========================================================

const feederCard =
  document.getElementById(
    "feeder-card"
  );

const feederActionsModal =
  document.getElementById(
    "feeder-actions-modal"
  );

const closeFeederActions =
  document.getElementById(
    "close-feeder-actions"
  );


if (
  feederCard &&
  feederActionsModal
) {

  feederCard.addEventListener(
    "click",
    () => {

      feederActionsModal
        .classList.remove(
          "hidden"
        );
    }
  );
}


if (
  closeFeederActions &&
  feederActionsModal
) {

  closeFeederActions.addEventListener(
    "click",
    () => {

      feederActionsModal
        .classList.add(
          "hidden"
        );
    }
  );
}


/*
 * Clic sur le fond sombre
 * = fermeture.
 */
if (
  feederActionsModal
) {

  feederActionsModal.addEventListener(
    "click",
    event => {

      if (
        event.target
        === feederActionsModal
      ) {

        feederActionsModal
          .classList.add(
            "hidden"
          );
      }
    }
  );
}

const openFeederCamera =
  document.getElementById(
    "open-feeder-camera"
  );

if (openFeederCamera) {

  openFeederCamera.addEventListener(
    "click",
    () => {

      feederActionsModal
        ?.classList.add(
          "hidden"
        );

      window.location.href =
        "com.designlibro.petlibro://";
    }
  );
}


const resetFeederFilterButton =
  document.getElementById(
    "reset-feeder-filter"
  );

if (
  resetFeederFilterButton
) {

  resetFeederFilterButton
    .addEventListener(
      "click",
      async () => {

        const confirmed =
          window.confirm(
            "Tu confirmes avoir changé le filtre croquettes aujourd’hui ?"
          );

        if (!confirmed) {
          return;
        }


        resetFeederFilterButton.disabled =
          true;

        resetFeederFilterButton
          .querySelector("strong")
          .textContent =
            "Mise à jour...";


        try {

          const {
            data: {
              session
            }
          } =
            await supabaseClient
              .auth
              .getSession();


          if (!session) {
            throw new Error(
              "Session expirée"
            );
          }


          const response =
            await fetch(
              "https://iayxqoevmkhkhhtdmrrk.supabase.co/functions/v1/keira-device-actions",
              {
                method:
                  "POST",

                headers: {
                  "Content-Type":
                    "application/json",

                  "Authorization":
                    `Bearer ${session.access_token}`,
                },

                body:
                  JSON.stringify({
                    action:
                      "reset_feeder_filter",
                  }),
              }
            );


          const result =
            await response.json();


          if (
            !response.ok
            || !result.ok
          ) {
            throw new Error(
              result.error
              || "Erreur inconnue"
            );
          }


          alert(
            "✅ Filtre croquettes remis à zéro"
          );


          feederActionsModal
            ?.classList.add(
              "hidden"
            );


          /*
           * Le vrai état PETLIBRO sera repris
           * automatiquement au prochain sync.
           */
          await loadHome();

        } catch (
          error
        ) {

          alert(
            "⚠️ Impossible de mettre à jour le filtre : "
            + error.message
          );

        } finally {

          resetFeederFilterButton.disabled =
            false;


          resetFeederFilterButton
            .querySelector("strong")
            .textContent =
              "Filtre changé";
        }
      }
    );
}

const feedNowButton =
  document.getElementById(
    "feed-now-button"
  );

if (
  feedNowButton
) {

  feedNowButton.addEventListener(
    "click",
    async () => {

      const confirmed =
        window.confirm(
          "Distribuer 10 g de croquettes maintenant ?"
        );

      if (!confirmed) {
        return;
      }


      feedNowButton.disabled =
        true;

      const title =
        feedNowButton.querySelector(
          "strong"
        );

      const oldText =
        title?.textContent
        || "Distribuer 10 g";

      if (title) {
        title.textContent =
          "Distribution...";
      }


      try {

        const {
          data: {
            session
          }
        } =
          await supabaseClient
            .auth
            .getSession();


        if (!session) {

          throw new Error(
            "Session expirée"
          );
        }


        const response =
          await fetch(
            "https://iayxqoevmkhkhhtdmrrk.supabase.co/functions/v1/keira-device-actions",
            {
              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json",

                "Authorization":
                  `Bearer ${session.access_token}`,
              },

              body:
                JSON.stringify({
                  action:
                    "feed_10g",
                }),
            }
          );


        const result =
          await response.json();


        if (
          !response.ok
          ||
          !result.ok
        ) {

          throw new Error(
            result.error
            || "Erreur inconnue"
          );
        }


        alert(
          "✅ Distribution de 10 g demandée"
        );


        feederActionsModal
          ?.classList.add(
            "hidden"
          );


        /*
         * Le prochain sync Supabase
         * récupérera le workRecord PETLIBRO.
         */
        setTimeout(
          () => {
            loadHome();
          },
          6000
        );

      } catch (
        error
      ) {

        alert(
          "⚠️ Distribution impossible : "
          + error.message
        );

      } finally {

        feedNowButton.disabled =
          false;

        if (title) {
          title.textContent =
            oldText;
        }
      }
    }
  );
}


// =========================================================
// FOUNTAIN ACTION SHEET
// =========================================================

const fountainCard =
  document.getElementById(
    "fountain-card"
  );

const fountainActionsModal =
  document.getElementById(
    "fountain-actions-modal"
  );

const closeFountainActions =
  document.getElementById(
    "close-fountain-actions"
  );


if (
  fountainCard &&
  fountainActionsModal
) {

  fountainCard.addEventListener(
    "click",
    () => {

      fountainActionsModal
        .classList.remove(
          "hidden"
        );
    }
  );
}


if (
  closeFountainActions &&
  fountainActionsModal
) {

  closeFountainActions.addEventListener(
    "click",
    () => {

      fountainActionsModal
        .classList.add(
          "hidden"
        );
    }
  );
}


/*
 * Clic sur le fond sombre
 * = fermeture.
 */
if (
  fountainActionsModal
) {

  fountainActionsModal.addEventListener(
    "click",
    event => {

      if (
        event.target
        === fountainActionsModal
      ) {

        fountainActionsModal
          .classList.add(
            "hidden"
          );
      }
    }
  );
}

const resetFountainCleaningButton =
  document.getElementById(
    "reset-fountain-cleaning"
  );

const resetFountainFilterButton =
  document.getElementById(
    "reset-fountain-filter"
  );


async function callDeviceAction(
  action
) {

  const {
    data: {
      session
    }
  } =
    await supabaseClient
      .auth
      .getSession();


  if (!session) {
    throw new Error(
      "Session expirée"
    );
  }


  const response =
    await fetch(
      "https://iayxqoevmkhkhhtdmrrk.supabase.co/functions/v1/keira-device-actions",
      {
        method:
          "POST",

        headers: {
          "Content-Type":
            "application/json",

          "Authorization":
            `Bearer ${session.access_token}`,
        },

        body:
          JSON.stringify({
            action
          }),
      }
    );


  const result =
    await response.json();


  if (
    !response.ok
    ||
    !result.ok
  ) {

    throw new Error(
      result.error
      || "Erreur inconnue"
    );
  }


  return result;
}


/* =========================================================
   NETTOYAGE FONTAINE
========================================================= */

if (
  resetFountainCleaningButton
) {

  resetFountainCleaningButton
    .addEventListener(
      "click",
      async () => {

        const confirmed =
          window.confirm(
            "Tu confirmes avoir nettoyé la fontaine aujourd’hui ?"
          );


        if (!confirmed) {
          return;
        }


        const title =
          resetFountainCleaningButton
            .querySelector(
              "strong"
            );


        const oldText =
          title?.textContent
          || "Nettoyage effectué";


        resetFountainCleaningButton.disabled =
          true;


        if (title) {
          title.textContent =
            "Mise à jour...";
        }


        try {

          await callDeviceAction(
            "reset_fountain_cleaning"
          );


          alert(
            "✅ Nettoyage fontaine enregistré"
          );


          fountainActionsModal
            ?.classList.add(
              "hidden"
            );


          setTimeout(
            () => {
              loadHome();
            },
            5000
          );

        } catch (
          error
        ) {

          alert(
            "⚠️ Impossible de remettre le nettoyage à zéro : "
            + error.message
          );

        } finally {

          resetFountainCleaningButton.disabled =
            false;


          if (title) {
            title.textContent =
              oldText;
          }
        }
      }
    );
}


/* =========================================================
   FILTRE FONTAINE
========================================================= */

if (
  resetFountainFilterButton
) {

  resetFountainFilterButton
    .addEventListener(
      "click",
      async () => {

        const confirmed =
          window.confirm(
            "Tu confirmes avoir changé le filtre de la fontaine aujourd’hui ?"
          );


        if (!confirmed) {
          return;
        }


        const title =
          resetFountainFilterButton
            .querySelector(
              "strong"
            );


        const oldText =
          title?.textContent
          || "Filtre changé";


        resetFountainFilterButton.disabled =
          true;


        if (title) {
          title.textContent =
            "Mise à jour...";
        }


        try {

          await callDeviceAction(
            "reset_fountain_filter"
          );


          alert(
            "✅ Filtre fontaine remis à zéro"
          );


          fountainActionsModal
            ?.classList.add(
              "hidden"
            );


          setTimeout(
            () => {
              loadHome();
            },
            5000
          );

        } catch (
          error
        ) {

          alert(
            "⚠️ Impossible de remettre le filtre à zéro : "
            + error.message
          );

        } finally {

          resetFountainFilterButton.disabled =
            false;


          if (title) {
            title.textContent =
              oldText;
          }
        }
      }
    );
}
