const SUPABASE_URL =
  "https://iayxqoevmkhkhhtdmrrk.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_qLhvGcHGqkaHMEj_giw1Ww_e3J_RoKR";

const FOOD_GOAL = 30;
const FOOD_DOSES_GOAL = 3;
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

        storage:
          window.localStorage
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

function parisDay(date = new Date()) {

  return date.toLocaleDateString(
    "en-CA",
    {
      timeZone: "Europe/Paris"
    }
  );
}


function formatDate(value) {

  if (!value) {
    return "—";
  }

  return new Date(value)
    .toLocaleDateString(
      "fr-FR"
    );
}


function percent(
  value,
  goal
) {

  return Math.min(
    100,
    Math.round(
      (
        Number(value || 0)
        / goal
      ) * 100
    )
  );
}


function daysAgo(
  timestamp
) {

  if (!timestamp) {
    return null;
  }

  const now =
    Date.now();

  const diff =
    now -
    Number(timestamp);

  return Math.max(
    0,
    Math.floor(
      diff /
      86400000
    )
  );
}


function daysText(days) {

  if (days === 0) {
    return "aujourd'hui";
  }

  if (days === 1) {
    return "hier";
  }

  return `il y a ${days} jours`;
}


function wifiClass(
  rssi,
  online
) {

  if (!online) {
    return "offline";
  }

  if (rssi >= -60) {
    return "good";
  }

  if (rssi >= -72) {
    return "medium";
  }

  return "bad";
}


function wifiLabel(rssi) {

  if (rssi >= -60) {
    return "Wi-Fi excellent";
  }

  if (rssi >= -72) {
    return "Wi-Fi moyen";
  }

  return "Wi-Fi faible";
}


function showPage(pageName) {

  document
    .querySelectorAll(".page")
    .forEach(
      page =>
        page.classList.add(
          "hidden"
        )
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
      button =>
        button.classList.remove(
          "active"
        )
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
    pageName === "history"
  ) {
    loadHistory();
  }


  if (
    pageName === "health"
  ) {
    loadHealth();
  }
}


/* =========================================================
   AUTH PASSWORD
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
        !email ||
        !password
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

      initialize();
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
   NAV
========================================================= */

document
  .querySelectorAll(
    "[data-page]"
  )
  .forEach(
    element => {

      element.addEventListener(
        "click",
        () =>
          showPage(
            element.dataset.page
          )
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


  if (!device) {

    status.textContent =
      "Données indisponibles";

    wifi.className =
      "wifi offline";

    return;
  }


  if (!device.online) {

    status.textContent =
      "🔴 Hors ligne";

    wifi.className =
      "wifi offline";

    return;
  }


  status.textContent =
    "🟢 En ligne";


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


  if (
    prefix === "feeder"
  ) {

    document
      .getElementById(
        "feeder-extra"
      )
      .textContent =
        device.food_available
          ? "Croquettes disponibles"
          : "⚠️ Croquettes faibles";
  }


  if (
    prefix === "fountain"
  ) {

    const waterPercent =
      device.water_percent;


    document
      .getElementById(
        "fountain-extra"
      )
      .textContent =
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
    fountain?.raw_data || {};


  const rawFeeder =
    feeder?.raw_data || {};


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


  const desiccantRemaining =
    feeder
      ?.desiccant_days_remaining;


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
          <strong>Filtre fontaine</strong>

          <small>
            Changé ${
              daysText(filterAge)
            }
            ${
              filterAge >= 12
                ? ` · changement tous les 15 jours`
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
          <strong>Nettoyage fontaine</strong>

          <small>
            Fait ${
              daysText(cleaningAge)
            }
          </small>
        </div>

      </div>
    `);
  }


  if (
    desiccantRemaining != null
  ) {

    rows.push(`
      <div class="maintenance-row">

        <span class="maintenance-icon">
          ${
            desiccantRemaining < 0
              ? "🔴"
              : desiccantRemaining <= 3
              ? "🟠"
              : "✅"
          }
        </span>

        <div>

          <strong>
            Dessiccant
          </strong>

          <small>
            ${
              desiccantRemaining < 0
                ? "À remplacer"
                : `Encore ${desiccantRemaining} jour(s)`
            }
          </small>

        </div>

      </div>
    `);
  }


  return rows.join("");
}


/* =========================================================
   HOME
========================================================= */

async function loadHome() {

  const today =
    parisDay();


  /* FOOD */

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


  const todayFood =
    (feeding || [])
      .filter(
        e =>
          parisDay(
            new Date(
              e.event_time
            )
          ) === today
      );


  const totalFood =
    todayFood.reduce(
      (
        sum,
        event
      ) =>
        sum +
        Number(
          event.actual_grams || 0
        ),
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
        : `${FOOD_GOAL - totalFood} g restants`;


  /* WATER */

  const {
    data: waterRows
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


  const water =
    waterRows?.[0];


  const waterMl =
    Number(
      water?.total_ml || 0
    );


  const waterVisits =
    Number(
      water?.drink_times || 0
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
        : `${WATER_GOAL - waterMl} ml restants`;


  /* WEIGHT */

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
          ascending: false
        }
      )
      .limit(1);


  if (
    weights?.length
  ) {

    document
      .getElementById(
        "weight"
      )
      .textContent =
        `${weights[0].weight_kg} kg`;


    document
      .getElementById(
        "weight-date"
      )
      .textContent =
        formatDate(
          weights[0]
            .measured_at
        );
  }


  /* VACCINES */

  const {
    data: vaccines
  } =
    await supabaseClient
      .from(
        "vaccinations"
      )
      .select("*")
      .order(
        "next_due_date",
        {
          ascending: true
        }
      );


  if (
    vaccines?.length
  ) {

    document
      .getElementById(
        "vaccines"
      )
      .textContent =
        vaccines.length;


    const next =
      vaccines.find(
        v =>
          v.next_due_date
      );


    document
      .getElementById(
        "next-vaccine"
      )
      .textContent =
        next
          ? `Rappel ${formatDate(
              next.next_due_date
            )}`
          : "À jour";
  }


  /* DEVICES */

  const {
    data: devices
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


  const feeder =
    devices?.find(
      d =>
        d.device_model
        === "PLAF203"
    );


  const fountain =
    devices?.find(
      d =>
        d.device_model
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


  const allOK =
    feeder?.online &&
    fountain?.online;


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
            hour:
              "2-digit",

            minute:
              "2-digit"
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
      new Date(now);

    date.setDate(
      now.getDate() - i
    );


    days.push(
      parisDay(date)
    );
  }


  return days;
}


async function loadHistory() {

  const days =
    last7Days();


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
        days[
          days.length - 1
        ]
      );


  const container =
    document.getElementById(
      "daily-history"
    );


  container.innerHTML =
    days.map(
      (
        day,
        index
      ) => {

        const foodEvents =
          (feeding || [])
            .filter(
              e =>
                parisDay(
                  new Date(
                    e.event_time
                  )
                )
                === day
            );


        const grams =
          foodEvents.reduce(
            (
              sum,
              e
            ) =>
              sum +
              Number(
                e.actual_grams || 0
              ),
            0
          );


        const waterRow =
          water?.find(
            w =>
              w.day === day
          );


        const ml =
          Number(
            waterRow
              ?.total_ml || 0
          );


        const drinks =
          Number(
            waterRow
              ?.drink_times || 0
          );


        const foodPct =
          percent(
            grams,
            FOOD_GOAL
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
              e =>
                new Date(
                  e.event_time
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
                )
            )
            .join(" · ");


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


            <div class="history-goal">

              <div class="history-goal-header">

                <strong>
                  🍗 ${foodEvents.length}/3 doses
                </strong>

                <span>
                  ${grams}/30 g
                  ${
                    grams >= 30
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
                    ml >= 100
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

async function loadHealth() {

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
          ascending: false
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
          .slice(0,10)
          .map(
            w => `
              <div class="health-row">
                <span>
                  ${formatDate(
                    w.measured_at
                  )}
                </span>

                <strong>
                  ${w.weight_kg} kg
                </strong>
              </div>
            `
          )
          .join("")
        : "Aucune donnée";


  const {
    data: vaccines
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
      );


  document
    .getElementById(
      "vaccination-list"
    )
    .innerHTML =
      vaccines?.length
        ? vaccines
          .map(
            v => `
              <div class="health-row">

                <div>
                  <strong>
                    ${v.vaccine_name}
                  </strong>

                  <small>
                    ${formatDate(
                      v.vaccination_date
                    )}
                  </small>
                </div>

                <small>
                  ${
                    v.next_due_date
                      ? `Rappel ${formatDate(
                          v.next_due_date
                        )}`
                      : ""
                  }
                </small>

              </div>
            `
          )
          .join("")
        : "Aucun vaccin";


  const {
    data: treatments
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


  document
    .getElementById(
      "treatment-list"
    )
    .innerHTML =
      treatments?.length
        ? treatments
          .map(
            t => `
              <div class="health-row">

                <div>
                  <strong>
                    ${t.treatment_type}
                  </strong>

                  <small>
                    ${t.product_name || ""}
                  </small>
                </div>

                <small>
                  ${formatDate(
                    t.administered_at
                  )}
                </small>

              </div>
            `
          )
          .join("")
        : "Aucun traitement";
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
        () =>
          button
            .closest(".modal")
            .classList.add(
              "hidden"
            )
      );
    }
  );


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
              .value || null
        });


      document
        .getElementById(
          "weight-modal"
        )
        .classList.add(
          "hidden"
        );


      await loadHealth();
      await loadHome();
    }
  );


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
          .value;


      const date =
        document
          .getElementById(
            "vaccine-date"
          )
          .value;


      if (
        !name ||
        !date
      ) {
        return;
      }


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
            document
              .getElementById(
                "vaccine-next"
              )
              .value
              || null
        });


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


document
  .getElementById(
    "save-treatment"
  )
  .addEventListener(
    "click",
    async () => {

      const date =
        document
          .getElementById(
            "treatment-date"
          )
          .value;


      if (!date) {
        return;
      }


      await supabaseClient
        .from(
          "treatments"
        )
        .insert({

          treatment_type:
            document
              .getElementById(
                "treatment-type"
              )
              .value,

          product_name:
            document
              .getElementById(
                "treatment-product"
              )
              .value
              || null,

          administered_at:
            date,

          next_due_date:
            document
              .getElementById(
                "treatment-next"
              )
              .value
              || null
        });


      document
        .getElementById(
          "treatment-modal"
        )
        .classList.add(
          "hidden"
        );


      await loadHealth();
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


  loginScreen.classList.add(
    "hidden"
  );


  passwordScreen.classList.add(
    "hidden"
  );


  dashboard.classList.remove(
    "hidden"
  );


  await loadHome();
}


supabaseClient.auth
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