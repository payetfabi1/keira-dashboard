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

const loginButton =
  document.getElementById("login-button");

const logoutButton =
  document.getElementById("logout-button");

const loginMessage =
  document.getElementById("login-message");


async function sendMagicLink() {

  const email =
    document.getElementById("login-email")
      .value
      .trim();

  if (!email) {
    loginMessage.textContent =
      "Entre ton adresse e-mail.";
    return;
  }

  loginButton.disabled = true;
  loginMessage.textContent =
    "Envoi du lien...";

  const { error } =
    await supabaseClient.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo:
          "https://payetfabi1.github.io/keira-dashboard/"
      }
    });

  if (error) {
    loginMessage.textContent =
      "Erreur : " + error.message;
  } else {
    loginMessage.textContent =
      "📩 Lien envoyé. Regarde tes e-mails.";
  }

  loginButton.disabled = false;
}


loginButton.addEventListener(
  "click",
  sendMagicLink
);


logoutButton.addEventListener(
  "click",
  async () => {
    await supabaseClient.auth.signOut();
    location.reload();
  }
);


function localParisDay() {
  return new Date().toLocaleDateString(
    "en-CA",
    {
      timeZone: "Europe/Paris"
    }
  );
}


function parisDayRangeUTC() {

  const day = localParisDay();

  const start =
    new Date(`${day}T00:00:00+02:00`);

  const end =
    new Date(start);

  end.setDate(
    end.getDate() + 1
  );

  return {
    start: start.toISOString(),
    end: end.toISOString()
  };
}


function setDeviceState(
  elementId,
  device
) {

  const element =
    document.getElementById(
      elementId
    );

  if (!device) {
    element.textContent =
      "Données indisponibles";
    return;
  }

  if (!device.online) {
    element.textContent =
      "🔴 Hors ligne";
    return;
  }

  element.textContent =
    `🟢 En ligne · ${device.wifi_rssi ?? "?"} dBm`;
}


async function loadDashboard() {

  document.querySelector(
    ".hero h2"
  ).textContent =
    "Chargement...";


  // ==========================================
  // NOURRITURE DU JOUR
  // ==========================================

  const {
    start,
    end
  } = parisDayRangeUTC();


  const {
    data: feeding,
    error: feedingError
  } =
    await supabaseClient
      .from("feeding_events")
      .select(
        "event_time,event_type,actual_portions,actual_grams,source,success"
      )
      .gte(
        "event_time",
        start
      )
      .lt(
        "event_time",
        end
      )
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


  if (feedingError) {
    throw feedingError;
  }


  const totalFood =
    (feeding || []).reduce(
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
    `${Math.round(totalFood)} g`;


  document.getElementById(
    "meals"
  ).textContent =
    `${feeding.length} distribution${
      feeding.length > 1 ? "s" : ""
    }`;


  // ==========================================
  // EAU
  // ==========================================

  const today =
    localParisDay();


  const {
    data: waterRows,
    error: waterError
  } =
    await supabaseClient
      .from("water_daily")
      .select(
        "total_ml,drink_times,remaining_ml,tank_capacity_ml,updated_at"
      )
      .eq(
        "day",
        today
      )
      .limit(1);


  if (waterError) {
    throw waterError;
  }


  const water =
    waterRows?.[0];


  if (water) {

    document.getElementById(
      "water"
    ).textContent =
      `${water.total_ml ?? 0} ml`;


    document.getElementById(
      "drinks"
    ).textContent =
      `${water.drink_times ?? 0} passage${
        water.drink_times === 1
          ? ""
          : "s"
      }`;
  }


  // ==========================================
  // POIDS
  // ==========================================

  const {
    data: weights,
    error: weightError
  } =
    await supabaseClient
      .from("weight_entries")
      .select(
        "weight_kg,measured_at"
      )
      .order(
        "measured_at",
        {
          ascending: false
        }
      )
      .limit(1);


  if (weightError) {
    throw weightError;
  }


  if (weights?.length) {

    document.getElementById(
      "weight"
    ).textContent =
      `${weights[0].weight_kg} kg`;

  } else {

    document.getElementById(
      "weight"
    ).textContent =
      "À renseigner";
  }


  // ==========================================
  // VACCINS
  // ==========================================

  const {
    data: vaccines,
    error: vaccinesError
  } =
    await supabaseClient
      .from("vaccinations")
      .select(
        "id,next_due_date"
      );


  if (vaccinesError) {
    throw vaccinesError;
  }


  document.getElementById(
    "vaccines"
  ).textContent =
    vaccines?.length
      ? vaccines.length
      : "À renseigner";


  // ==========================================
  // APPAREILS
  // ==========================================

  const {
    data: devices,
    error: devicesError
  } =
    await supabaseClient
      .from("device_status")
      .select(
        "device_model,online,wifi_rssi,water_percent,filter_days_remaining,cleaning_days_remaining,desiccant_days_remaining,measured_at"
      )
      .order(
        "measured_at",
        {
          ascending: false
        }
      )
      .limit(20);


  if (devicesError) {
    throw devicesError;
  }


  const feeder =
    devices?.find(
      device =>
        device.device_model ===
        "PLAF203"
    );


  const fountain =
    devices?.find(
      device =>
        device.device_model ===
        "PLWF105"
    );


  setDeviceState(
    "feeder-status",
    feeder
  );


  setDeviceState(
    "fountain-status",
    fountain
  );


  // ==========================================
  // ETAT GENERAL
  // ==========================================

  const everythingOK =
    feeder?.online !== false &&
    fountain?.online !== false;


  document.querySelector(
    ".hero h2"
  ).textContent =
    everythingOK
      ? "Tout va bien 💚"
      : "Attention requise ⚠️";


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


async function initialize() {

  const {
    data: {
      session
    }
  } =
    await supabaseClient.auth.getSession();


  if (!session) {

    loginScreen.style.display =
      "block";

    dashboard.style.display =
      "none";

    return;
  }


  loginScreen.style.display =
    "none";

  dashboard.style.display =
    "block";


  try {

    await loadDashboard();

  } catch (error) {

    console.error(
      "Keira Dashboard:",
      error
    );

    document.querySelector(
      ".hero h2"
    ).textContent =
      "Données indisponibles ⚠️";
  }
}


supabaseClient.auth
  .onAuthStateChange(
    () => {
      initialize();
    }
  );


initialize();