const SUPABASE_URL =
  "https://iayxqoevmkhkhhtdmrrk.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_qLhvGcHGqkaHMEj_giw1Ww_e3J_RoKR";


const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    }
  );


const loginScreen =
  document.getElementById("login-screen");

const dashboard =
  document.getElementById("dashboard");


/* ============================================================
   HELPERS
============================================================ */

function parisDay() {
  return new Date().toLocaleDateString(
    "en-CA",
    {
      timeZone: "Europe/Paris"
    }
  );
}


function formatDate(date) {

  if (!date) {
    return "—";
  }

  return new Date(date).toLocaleDateString(
    "fr-FR"
  );
}


function formatTime(date) {

  return new Date(date).toLocaleTimeString(
    "fr-FR",
    {
      hour: "2-digit",
      minute: "2-digit"
    }
  );
}


function showPage(pageName) {

  document
    .querySelectorAll(".page")
    .forEach(
      page =>
        page.classList.add("hidden")
    );

  document
    .getElementById(
      `page-${pageName}`
    )
    .classList.remove("hidden");


  document
    .querySelectorAll(".nav-button")
    .forEach(
      button =>
        button.classList.remove("active")
    );


  const activeButton =
    document.querySelector(
      `.nav-button[data-page="${pageName}"]`
    );

  if (activeButton) {
    activeButton.classList.add("active");
  }


  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });


  if (pageName === "history") {
    loadHistory();
  }

  if (pageName === "health") {
    loadHealth();
  }
}


/* ============================================================
   AUTH
============================================================ */

document
  .getElementById("login-button")
  .addEventListener(
    "click",
    async () => {

      const email =
        document
          .getElementById("login-email")
          .value
          .trim();

      const message =
        document.getElementById(
          "login-message"
        );

      if (!email) {

        message.textContent =
          "Entre ton adresse e-mail.";

        return;
      }


      message.textContent =
        "Envoi du lien...";


      const { error } =
        await supabaseClient.auth
          .signInWithOtp(
            {
              email,

              options: {
                emailRedirectTo:
                  "https://payetfabi1.github.io/keira-dashboard/"
              }
            }
          );


      message.textContent =
        error
          ? `Erreur : ${error.message}`
          : "📩 Lien envoyé. Regarde tes e-mails.";
    }
  );


document
  .getElementById("logout-button")
  .addEventListener(
    "click",
    async () => {

      await supabaseClient.auth
        .signOut();

      location.reload();
    }
  );


/* ============================================================
   NAVIGATION
============================================================ */

document
  .querySelectorAll("[data-page]")
  .forEach(
    element => {

      element.addEventListener(
        "click",
        () => {

          const page =
            element.dataset.page;

          showPage(page);
        }
      );
    }
  );


/* ============================================================
   DEVICES
============================================================ */

function setDevice(
  prefix,
  device
) {

  const status =
    document.getElementById(
      `${prefix}-status`
    );

  const dot =
    document.getElementById(
      `${prefix}-dot`
    );


  if (!device) {

    status.textContent =
      "Données indisponibles";

    dot.className =
      "dot unknown";

    return;
  }


  if (device.online) {

    status.textContent =
      `🟢 En ligne · ${device.wifi_rssi ?? "?"} dBm`;

    dot.className =
      "dot online";

  } else {

    status.textContent =
      "🔴 Hors ligne";

    dot.className =
      "dot offline";
  }


  if (prefix === "feeder") {

    document.getElementById(
      "feeder-extra"
    ).textContent =
      device.food_available
        ? "Croquettes disponibles"
        : "⚠️ Niveau de croquettes faible";

  }


  if (prefix === "fountain") {

    const parts = [];

    if (
      device.filter_days_remaining != null
    ) {
      parts.push(
        `Filtre ${device.filter_days_remaining} j`
      );
    }

    if (
      device.cleaning_days_remaining != null
    ) {
      parts.push(
        `Nettoyage ${device.cleaning_days_remaining} j`
      );
    }

    document.getElementById(
      "fountain-extra"
    ).textContent =
      parts.join(" · ");
  }
}


/* ============================================================
   HOME
============================================================ */

async function loadHome() {

  const today =
    parisDay();


  /* nourriture */

  const {
    data: feeding
  } =
    await supabaseClient
      .from("feeding_events")
      .select("*")
      .gte(
        "event_time",
        `${today}T00:00:00+00:00`
      )
      .order(
        "event_time",
        {
          ascending: true
        }
      );


  const todayFood =
    (feeding || []).filter(
      event => {

        return new Date(
          event.event_time
        )
          .toLocaleDateString(
            "en-CA",
            {
              timeZone:
                "Europe/Paris"
            }
          ) === today;
      }
    );


  const grams =
    todayFood.reduce(
      (sum, event) =>
        sum +
        Number(
          event.actual_grams || 0
        ),
      0
    );


  document.getElementById(
    "food"
  ).textContent =
    `${grams} g`;


  document.getElementById(
    "meals"
  ).textContent =
    `${todayFood.length} distribution${
      todayFood.length === 1
        ? ""
        : "s"
    }`;


  /* eau */

  const {
    data: waterRows
  } =
    await supabaseClient
      .from("water_daily")
      .select("*")
      .eq(
        "day",
        today
      )
      .limit(1);


  const water =
    waterRows?.[0];


  document.getElementById(
    "water"
  ).textContent =
    `${water?.total_ml ?? 0} ml`;


  document.getElementById(
    "drinks"
  ).textContent =
    `${water?.drink_times ?? 0} passage${
      water?.drink_times === 1
        ? ""
        : "s"
    }`;


  /* poids */

  const {
    data: weights
  } =
    await supabaseClient
      .from("weight_entries")
      .select("*")
      .order(
        "measured_at",
        {
          ascending: false
        }
      )
      .limit(1);


  if (weights?.length) {

    document.getElementById(
      "weight"
    ).textContent =
      `${weights[0].weight_kg} kg`;

    document.getElementById(
      "weight-date"
    ).textContent =
      formatDate(
        weights[0].measured_at
      );

  } else {

    document.getElementById(
      "weight"
    ).textContent =
      "À renseigner";
  }


  /* vaccins */

  const {
    data: vaccines
  } =
    await supabaseClient
      .from("vaccinations")
      .select("*")
      .order(
        "next_due_date",
        {
          ascending: true
        }
      );


  document.getElementById(
    "vaccines"
  ).textContent =
    vaccines?.length || "À renseigner";


  if (vaccines?.length) {

    const next =
      vaccines.find(
        vaccine =>
          vaccine.next_due_date
      );

    document.getElementById(
      "next-vaccine"
    ).textContent =
      next
        ? `Prochain : ${formatDate(
            next.next_due_date
          )}`
        : `${vaccines.length} enregistré(s)`;
  }


  /* devices */

  const {
    data: devices
  } =
    await supabaseClient
      .from("device_status")
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
        d.device_model === "PLAF203"
    );


  const fountain =
    devices?.find(
      d =>
        d.device_model === "PLWF105"
    );


  setDevice(
    "feeder",
    feeder
  );

  setDevice(
    "fountain",
    fountain
  );


  /* global */

  const globalStatus =
    document.getElementById(
      "global-status"
    );


  if (
    feeder?.online &&
    fountain?.online
  ) {

    globalStatus.textContent =
      "● En ligne";

    globalStatus.className =
      "status ok";

    document.getElementById(
      "health-message"
    ).textContent =
      "Tout va bien 💚";

  } else {

    globalStatus.textContent =
      "● Attention";

    globalStatus.className =
      "status ko";

    document.getElementById(
      "health-message"
    ).textContent =
      "Attention requise ⚠️";
  }


  /* maintenance */

  const maintenance = [];


  if (
    fountain?.filter_days_remaining != null
  ) {

    maintenance.push(
      `💧 Filtre fontaine : ${fountain.filter_days_remaining} jour(s)`
    );
  }


  if (
    fountain?.cleaning_days_remaining != null
  ) {

    maintenance.push(
      `🧽 Nettoyage fontaine : ${fountain.cleaning_days_remaining} jour(s)`
    );
  }


  if (
    feeder?.desiccant_days_remaining != null
  ) {

    maintenance.push(
      feeder.desiccant_days_remaining < 0
        ? "⚠️ Dessiccant feeder à remplacer"
        : `🍗 Dessiccant : ${feeder.desiccant_days_remaining} jour(s)`
    );
  }


  document.getElementById(
    "maintenance-list"
  ).innerHTML =
    maintenance.length
      ? maintenance.join("<br>")
      : "✅ Rien à prévoir";


  document.getElementById(
    "updated"
  ).textContent =
    new Date().toLocaleTimeString(
      "fr-FR",
      {
        hour: "2-digit",
        minute: "2-digit"
      }
    );
}


/* ============================================================
   HISTORY
============================================================ */

function last7Days() {

  const result = [];

  const now =
    new Date();


  for (
    let i = 6;
    i >= 0;
    i--
  ) {

    const day =
      new Date(now);

    day.setDate(
      now.getDate() - i
    );


    result.push(
      day.toLocaleDateString(
        "en-CA",
        {
          timeZone:
            "Europe/Paris"
        }
      )
    );
  }

  return result;
}


function drawBars(
  element,
  values,
  className = ""
) {

  const max =
    Math.max(
      ...values.map(v => v.value),
      1
    );


  element.innerHTML =
    values.map(
      item => {

        const height =
          Math.max(
            4,
            (item.value / max) * 95
          );


        const label =
          new Date(
            `${item.day}T12:00:00`
          )
            .toLocaleDateString(
              "fr-FR",
              {
                weekday: "short"
              }
            )
            .replace(".", "");


        return `
          <div class="bar-column">
            <div
              class="bar ${className}"
              style="height:${height}px"
              title="${item.value}"
            ></div>
            <div class="bar-label">
              ${label}
            </div>
          </div>
        `;
      }
    )
    .join("");
}


async function loadHistory() {

  const days =
    last7Days();


  const start =
    `${days[0]}T00:00:00+00:00`;


  const {
    data: feeding
  } =
    await supabaseClient
      .from("feeding_events")
      .select("*")
      .gte(
        "event_time",
        start
      )
      .order(
        "event_time",
        {
          ascending: false
        }
      );


  const foodValues =
    days.map(
      day => {

        const total =
          (feeding || [])
            .filter(
              event =>
                new Date(
                  event.event_time
                )
                  .toLocaleDateString(
                    "en-CA",
                    {
                      timeZone:
                        "Europe/Paris"
                    }
                  ) === day
            )
            .reduce(
              (sum, event) =>
                sum +
                Number(
                  event.actual_grams || 0
                ),
              0
            );


        return {
          day,
          value: total
        };
      }
    );


  drawBars(
    document.getElementById(
      "food-chart"
    ),
    foodValues
  );


  document.getElementById(
    "history-food-total"
  ).textContent =
    `${foodValues.reduce(
      (sum, day) =>
        sum + day.value,
      0
    )} g`;


  const {
    data: water
  } =
    await supabaseClient
      .from("water_daily")
      .select("*")
      .gte(
        "day",
        days[0]
      )
      .order(
        "day",
        {
          ascending: true
        }
      );


  const waterValues =
    days.map(
      day => {

        const row =
          water?.find(
            item =>
              item.day === day
          );


        return {
          day,
          value:
            Number(
              row?.total_ml || 0
            )
        };
      }
    );


  drawBars(
    document.getElementById(
      "water-chart"
    ),
    waterValues,
    "water-bar"
  );


  document.getElementById(
    "history-water-total"
  ).textContent =
    `${waterValues.reduce(
      (sum, day) =>
        sum + day.value,
      0
    )} ml`;


  const timeline =
    document.getElementById(
      "feeding-history"
    );


  timeline.innerHTML =
    (feeding || [])
      .slice(0, 15)
      .map(
        event => {

          const manual =
            event.event_type ===
            "MANUAL_FEEDING_SUCCESS";


          return `
            <div class="timeline-item">

              <div>
                <strong>
                  ${
                    manual
                      ? "🍗 Distribution manuelle"
                      : "✅ Repas programmé"
                  }
                </strong>

                <small>
                  ${formatDate(event.event_time)}
                  ·
                  ${formatTime(event.event_time)}
                </small>
              </div>

              <strong>
                ${event.actual_grams ?? 0} g
              </strong>

            </div>
          `;
        }
      )
      .join("");
}


/* ============================================================
   HEALTH
============================================================ */

async function loadHealth() {

  /* poids */

  const {
    data: weights
  } =
    await supabaseClient
      .from("weight_entries")
      .select("*")
      .order(
        "measured_at",
        {
          ascending: false
        }
      )
      .limit(10);


  document.getElementById(
    "health-current-weight"
  ).textContent =
    weights?.length
      ? `${weights[0].weight_kg} kg`
      : "Aucune mesure";


  document.getElementById(
    "weight-history"
  ).innerHTML =
    weights?.length
      ? weights
          .map(
            weight => `
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
            `
          )
          .join("")
      : `<div class="health-row">
          <span>Aucune donnée</span>
        </div>`;


  /* vaccins */

  const {
    data: vaccines
  } =
    await supabaseClient
      .from("vaccinations")
      .select("*")
      .order(
        "vaccination_date",
        {
          ascending: false
        }
      );


  document.getElementById(
    "vaccination-list"
  ).innerHTML =
    vaccines?.length
      ? vaccines
          .map(
            vaccine => `
              <div class="health-row">

                <div>
                  <strong>
                    ${vaccine.vaccine_name}
                  </strong>

                  <small>
                    ${formatDate(
                      vaccine.vaccination_date
                    )}
                  </small>
                </div>

                <small>
                  ${
                    vaccine.next_due_date
                      ? `Rappel ${formatDate(
                          vaccine.next_due_date
                        )}`
                      : ""
                  }
                </small>

              </div>
            `
          )
          .join("")
      : `<div class="health-row">
          Aucun vaccin renseigné
        </div>`;


  /* traitements */

  const {
    data: treatments
  } =
    await supabaseClient
      .from("treatments")
      .select("*")
      .order(
        "administered_at",
        {
          ascending: false
        }
      );


  document.getElementById(
    "treatment-list"
  ).innerHTML =
    treatments?.length
      ? treatments
          .map(
            treatment => `
              <div class="health-row">

                <div>
                  <strong>
                    ${treatment.treatment_type}
                  </strong>

                  <small>
                    ${treatment.product_name || ""}
                  </small>
                </div>

                <small>
                  ${formatDate(
                    treatment.administered_at
                  )}
                </small>

              </div>
            `
          )
          .join("")
      : `<div class="health-row">
          Aucun traitement renseigné
        </div>`;
}


/* ============================================================
   MODALS
============================================================ */

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
            .closest(".modal")
            .classList.add(
              "hidden"
            );
        }
      );
    }
  );


/* ============================================================
   SAVE WEIGHT
============================================================ */

document
  .getElementById(
    "save-weight"
  )
  .addEventListener(
    "click",
    async () => {

      const weight =
        parseFloat(
          document
            .getElementById(
              "weight-input"
            )
            .value
        );


      const notes =
        document
          .getElementById(
            "weight-note"
          )
          .value;


      if (!weight) {
        return;
      }


      const { error } =
        await supabaseClient
          .from(
            "weight_entries"
          )
          .insert(
            {
              weight_kg:
                weight,

              notes:
                notes || null
            }
          );


      if (error) {

        alert(
          "Erreur : " +
          error.message
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


      await loadHealth();
      await loadHome();
    }
  );


/* ============================================================
   SAVE VACCINE
============================================================ */

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


      const next =
        document
          .getElementById(
            "vaccine-next"
          )
          .value;


      if (
        !name ||
        !date
      ) {
        return;
      }


      const { error } =
        await supabaseClient
          .from(
            "vaccinations"
          )
          .insert(
            {
              vaccine_name:
                name,

              vaccination_date:
                date,

              next_due_date:
                next || null
            }
          );


      if (error) {

        alert(
          "Erreur : " +
          error.message
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


/* ============================================================
   SAVE TREATMENT
============================================================ */

document
  .getElementById(
    "save-treatment"
  )
  .addEventListener(
    "click",
    async () => {

      const type =
        document
          .getElementById(
            "treatment-type"
          )
          .value;


      const product =
        document
          .getElementById(
            "treatment-product"
          )
          .value;


      const date =
        document
          .getElementById(
            "treatment-date"
          )
          .value;


      const next =
        document
          .getElementById(
            "treatment-next"
          )
          .value;


      if (!date) {
        return;
      }


      const { error } =
        await supabaseClient
          .from(
            "treatments"
          )
          .insert(
            {
              treatment_type:
                type,

              product_name:
                product || null,

              administered_at:
                date,

              next_due_date:
                next || null
            }
          );


      if (error) {

        alert(
          "Erreur : " +
          error.message
        );

        return;
      }


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


/* ============================================================
   INIT
============================================================ */

async function initialize() {

  const {
    data: {
      session
    }
  } =
    await supabaseClient.auth
      .getSession();


  if (!session) {

    loginScreen.classList
      .remove("hidden");

    dashboard.classList
      .add("hidden");

    return;
  }


  loginScreen.classList
    .add("hidden");

  dashboard.classList
    .remove("hidden");


  try {

    await loadHome();

  } catch (error) {

    console.error(
      error
    );

    document.getElementById(
      "health-message"
    ).textContent =
      "Données indisponibles ⚠️";
  }
}


supabaseClient.auth
  .onAuthStateChange(
    () => initialize()
  );


initialize();
initialize();