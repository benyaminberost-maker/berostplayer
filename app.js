/* =========================================================
   BEROST PLAYER
   COMPLETE APPLICATION - REBUILT FROM SCRATCH
   Supabase JS v2
========================================================= */


/* =========================================================
   SUPABASE CONFIG
========================================================= */

const SUPABASE_URL =
    "https://zgnxqtnozknlnzmslesp.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_6K374CoWAkYJK6vyKFmm2w_T7ELcNFf";


const db =
    supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


/* =========================================================
   GLOBAL STATE
========================================================= */

let currentUser = null;

let currentProfile = null;

let currentLicense = null;

let currentFolder = null;

let privateTargetUser = null;

let publicChannel = null;

let groupChannel = null;

let privateChannel = null;

let authBusy = false;

let navigationBusy = false;


/* =========================================================
   TIC TAC TOE STATE
========================================================= */

let ticBoard =
    Array(9).fill("");

let ticGameOver =
    false;

let ticBotThinking =
    false;

const ticWins = [

    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],

    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],

    [0, 4, 8],
    [2, 4, 6]

];


/* =========================================================
   BASIC HELPERS
========================================================= */

function $(id) {

    return document.getElementById(id);

}


function exists(id) {

    return !!$(id);

}


function escapeHTML(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


function escapeAttribute(value) {

    return escapeHTML(value)
        .replaceAll("\n", " ")
        .replaceAll("\r", " ");

}


function usernameEmail(username) {

    const clean =
        String(username)
            .trim()
            .toLowerCase()
            .replace(
                /[^a-z0-9_]/g,
                ""
            );

    return (
        clean +
        "@berost-player.local"
    );

}


function validUsername(username) {

    return /^[a-zA-Z0-9_]{3,24}$/.test(
        username
    );

}


function sleep(ms) {

    return new Promise(
        resolve =>
            setTimeout(
                resolve,
                ms
            )
    );

}


function toast(message) {

    const container =
        $("toastContainer");

    if (!container) {

        console.log(message);

        return;

    }


    const item =
        document.createElement("div");

    item.className =
        "toast";

    item.textContent =
        String(message ?? "");


    container.appendChild(
        item
    );


    setTimeout(
        () => {

            item.classList.add(
                "toast-hide"
            );

            setTimeout(
                () => {

                    item.remove();

                },
                300
            );

        },
        4000
    );

}


function showError(error) {

    console.error(
        "[BEROST PLAYER ERROR]",
        error
    );


    const message =
        error?.message ||
        error?.error_description ||
        error?.details ||
        "یک خطای ناشناخته رخ داد.";


    toast(
        message
    );

}


function setText(id, value) {

    const element =
        $(id);

    if (!element)
        return;

    element.textContent =
        value ?? "";

}


function setHidden(id, value) {

    const element =
        $(id);

    if (!element)
        return;

    element.hidden =
        Boolean(value);

}


function handleEnter(
    event,
    callback
) {

    if (
        event.key === "Enter" &&
        !event.shiftKey
    ) {

        event.preventDefault();

        callback();

    }

}


function normalizeCode(value) {

    return String(value ?? "")
        .trim()
        .toUpperCase();

}


function safeFileName(name) {

    return String(name ?? "file")
        .replace(
            /[^a-zA-Z0-9._-]/g,
            "_"
        )
        .slice(
            0,
            180
        );

}


function randomId() {

    if (
        window.crypto &&
        typeof window.crypto.randomUUID ===
            "function"
    ) {

        return window.crypto.randomUUID();

    }


    return (
        Date.now().toString(36) +
        "-" +
        Math.random()
            .toString(36)
            .slice(2)
    );

}


/* =========================================================
   ERROR / ASYNC SAFETY
========================================================= */

async function safeCall(
    callback,
    fallback = null
) {

    try {

        return await callback();

    } catch (error) {

        console.error(
            error
        );

        showError(
            error
        );

        return fallback;

    }

}


async function withTimeout(
    promise,
    milliseconds,
    timeoutMessage =
        "درخواست بیش از حد طول کشید."
) {

    let timer = null;

    const timeout =
        new Promise(
            (_, reject) => {

                timer =
                    setTimeout(
                        () => {

                            reject(
                                new Error(
                                    timeoutMessage
                                )
                            );

                        },
                        milliseconds
                    );

            }
        );


    try {

        return await Promise.race(
            [
                promise,
                timeout
            ]
        );

    } finally {

        if (timer) {

            clearTimeout(
                timer
            );

        }

    }

}


/* =========================================================
   AUTH UI
========================================================= */

function showLogin() {

    if ($("loginBox"))
        $("loginBox").hidden = false;

    if ($("registerBox"))
        $("registerBox").hidden = true;

}


function showRegister() {

    if ($("loginBox"))
        $("loginBox").hidden = true;

    if ($("registerBox"))
        $("registerBox").hidden = false;

}


function showAuth() {

    if ($("authPage"))
        $("authPage").hidden = false;

    if ($("appPage"))
        $("appPage").hidden = true;

}


function showApp() {

    if ($("authPage"))
        $("authPage").hidden = true;

    if ($("appPage"))
        $("appPage").hidden = false;

}


/* =========================================================
   REGISTER
========================================================= */

async function register() {

    if (authBusy)
        return;


    authBusy = true;


    try {

        const username =
            $("registerUsername")
                ?.value
                ?.trim()
                || "";


        const password =
            $("registerPassword")
                ?.value
                || "";


        const password2 =
            $("registerPassword2")
                ?.value
                || "";


        if (!validUsername(username)) {

            toast(
                "نام کاربری باید ۳ تا ۲۴ کاراکتر انگلیسی، عدد یا _ باشد."
            );

            return;

        }


        if (password.length < 6) {

            toast(
                "رمز عبور باید حداقل ۶ کاراکتر باشد."
            );

            return;

        }


        if (password !== password2) {

            toast(
                "رمزهای عبور یکسان نیستند."
            );

            return;

        }


        const email =
            usernameEmail(
                username
            );


        const {
            data,
            error
        } =
            await db.auth.signUp({

                email,

                password,

                options: {

                    data: {

                        username

                    }

                }

            });


        if (error) {

            showError(
                error
            );

            return;

        }


        if (!data?.session) {

            toast(
                "حساب ساخته شد. اگر Confirm email روشن است، آن را در Supabase خاموش کن."
            );

            showLogin();

            return;

        }


        currentUser =
            data.user;


        await ensureProfile();

        await finishLogin();

    } finally {

        authBusy = false;

    }

}


/* =========================================================
   LOGIN
========================================================= */

async function login() {

    if (authBusy)
        return;


    authBusy = true;


    try {

        const username =
            $("loginUsername")
                ?.value
                ?.trim()
                || "";


        const password =
            $("loginPassword")
                ?.value
                || "";


        if (!validUsername(username)) {

            toast(
                "نام کاربری نامعتبر است."
            );

            return;

        }


        if (!password) {

            toast(
                "رمز عبور را وارد کن."
            );

            return;

        }


        const {
            data,
            error
        } =
            await db.auth.signInWithPassword({

                email:
                    usernameEmail(
                        username
                    ),

                password

            });


        if (error) {

            showError(
                error
            );

            return;

        }


        currentUser =
            data.user;


        await ensureProfile();

        await finishLogin();

    } finally {

        authBusy = false;

    }

}


/* =========================================================
   PROFILE
========================================================= */

async function ensureProfile() {

    if (!currentUser)
        return null;


    const {
        data,
        error
    } =
        await db
            .from("profiles")
            .select("*")
            .eq(
                "id",
                currentUser.id
            )
            .maybeSingle();


    if (error) {

        showError(
            error
        );

        return null;

    }


    if (data) {

        currentProfile =
            data;

        return data;

    }


    const username =
        currentUser
            ?.user_metadata
            ?.username
        ||
        "user_" +
        currentUser.id
            .slice(
                0,
                8
            );


    const {
        data: created,
        error: createError
    } =
        await db
            .from("profiles")
            .insert({

                id:
                    currentUser.id,

                username,

                display_name:
                    username

            })
            .select("*")
            .single();


    if (createError) {

        /*
         * Usually the database trigger already created
         * the profile. Therefore try reading it again.
         */

        const {
            data: retry
        } =
            await db
                .from("profiles")
                .select("*")
                .eq(
                    "id",
                    currentUser.id
                )
                .maybeSingle();


        if (retry) {

            currentProfile =
                retry;

            return retry;

        }


        showError(
            createError
        );

        return null;

    }


    currentProfile =
        created;


    return created;

}


/* =========================================================
   FINISH LOGIN
========================================================= */

async function finishLogin() {

    if (!currentUser)
        return;


    if (!currentProfile) {

        await ensureProfile();

    }


    setText(
        "currentUsername",
        currentProfile?.display_name ||
        currentProfile?.username ||
        "کاربر"
    );


    showApp();


    await goHome();

}


/* =========================================================
   SESSION
========================================================= */

async function loadSession() {

    try {

        const {
            data,
            error
        } =
            await db.auth.getSession();


        if (error) {

            showError(
                error
            );

            showAuth();

            return;

        }


        if (!data?.session) {

            showAuth();

            return;

        }


        currentUser =
            data.session.user;


        await ensureProfile();


        await finishLogin();

    } catch (error) {

        showError(
            error
        );

        showAuth();

    }

}


/* =========================================================
   LOGOUT
========================================================= */

async function logout() {

    await cleanupRealtime();


    const {
        error
    } =
        await db.auth.signOut();


    if (error) {

        showError(
            error
        );

        return;

    }


    currentUser =
        null;

    currentProfile =
        null;

    currentLicense =
        null;

    currentFolder =
        null;

    privateTargetUser =
        null;


    showAuth();

}


/* =========================================================
   NAVIGATION
========================================================= */

function hideAllPages() {

    if ($("homePage"))
        $("homePage").hidden = true;

    if ($("licensePage"))
        $("licensePage").hidden = true;

    if ($("playerPage"))
        $("playerPage").hidden = true;

    if ($("entertainmentPage"))
        $("entertainmentPage").hidden = true;

}


async function goHome() {

    if (navigationBusy)
        return;


    navigationBusy = true;


    try {

        hideAllPages();


        if ($("homePage"))
            $("homePage").hidden = false;


        if (currentUser) {

            await loadLicenses();

            await loadPublicChat();

            await loadAdminPanel();

        }

    } catch (error) {

        showError(
            error
        );

    } finally {

        navigationBusy = false;

    }

}


async function goMyLicenses() {

    hideAllPages();


    if ($("homePage"))
        $("homePage").hidden = false;


    await loadLicenses();

}


function goEntertainment() {

    hideAllPages();


    if ($("entertainmentPage"))
        $("entertainmentPage").hidden = false;


    resetTicTacToe();

}


/* =========================================================
   ADMIN
========================================================= */

async function isAdmin() {

    if (!currentUser)
        return false;


    const {
        data,
        error
    } =
        await db.rpc(
            "is_super_admin"
        );


    if (error) {

        console.error(
            "is_super_admin:",
            error
        );

        return false;

    }


    return data === true;

}


/* =========================================================
   ADMIN PANEL
========================================================= */

async function loadAdminPanel() {

    if (!$("adminSection"))
        return;


    const admin =
        await isAdmin();


    $("adminSection").hidden =
        !admin;


    if (!admin)
        return;


    await loadAdminLinks();

}


async function clearAllChats() {

    const admin =
        await isAdmin();


    if (!admin) {

        toast(
            "دسترسی ندارید."
        );

        return;

    }


    const confirmed =
        window.confirm(
            "تمام پیام‌های عمومی، گروه‌ها و پیوی‌ها پاک شوند؟"
        );


    if (!confirmed)
        return;


    const {
        error
    } =
        await db.rpc(
            "admin_clear_chats"
        );


    if (error) {

        showError(
            error
        );

        return;

    }


    toast(
        "حافظه چت‌ها پاک شد."
    );


    await loadPublicChat();


    if (currentLicense) {

        await loadGroupMessages();

        await loadPrivateMessages();

    }

}


/* =========================================================
   LICENSE CODE EXTRACTION
========================================================= */

function extractLicenseCode(input) {

    let value =
        String(input ?? "")
            .trim();


    if (!value)
        return "";


    /*
     * Direct code:
     * 2B2R
     */

    if (
        !value.startsWith("http://") &&
        !value.startsWith("https://")
    ) {

        return normalizeCode(
            value
        );

    }


    try {

        const url =
            new URL(value);


        const queryNames = [

            "license",
            "code",
            "license_code"

        ];


        for (
            const name
            of queryNames
        ) {

            const code =
                url.searchParams.get(
                    name
                );


            if (code) {

                return normalizeCode(
                    code
                );

            }

        }


        const hash =
            url.hash
                .replace(
                    /^#/,
                    ""
                )
                .trim();


        if (hash) {

            const hashParams =
                new URLSearchParams(
                    hash
                );


            for (
                const name
                of queryNames
            ) {

                const code =
                    hashParams.get(
                        name
                    );


                if (code) {

                    return normalizeCode(
                        code
                    );

                }

            }


            if (
                !hash.includes("=")
            ) {

                return normalizeCode(
                    hash
                );

            }

        }


        const parts =
            url.pathname
                .split("/")
                .filter(Boolean);


        if (parts.length) {

            return normalizeCode(
                parts[
                    parts.length - 1
                ]
            );

        }

    } catch {

        /*
         * If URL parsing fails,
         * use the raw value.
         */

    }


    return normalizeCode(
        value
    );

}


/* =========================================================
   LICENSES
========================================================= */

async function loadLicenses() {

    const box =
        $("licensesGrid");


    if (!box)
        return;


    box.innerHTML = `

        <div class="license-card">

            ⏳ در حال بارگذاری لایسنس‌ها...

        </div>

    `;


    if (!currentUser) {

        box.innerHTML = `

            <div class="license-card">

                برای دیدن لایسنس‌ها وارد حساب شو.

            </div>

        `;

        return;

    }


    try {

        const {
            data: memberships,
            error:
                membershipError
        } =
            await withTimeout(

                db
                    .from("license_members")
                    .select("license_id")
                    .eq(
                        "user_id",
                        currentUser.id
                    ),

                15000,

                "بارگذاری عضویت‌ها طول کشید."

            );


        if (membershipError) {

            showError(
                membershipError
            );

            box.innerHTML = `

                <div class="license-card">

                    ❌ خطا در بارگذاری لایسنس‌ها.

                </div>

            `;

            return;

        }


        if (
            !memberships ||
            memberships.length === 0
        ) {

            box.innerHTML = `

                <div class="license-card">

                    🎓 هنوز هیچ لایسنسی نداری.

                    <br><br>

                    یک لایسنس بساز یا با کد وارد یکی شو.

                </div>

            `;

            return;

        }


        const ids =
            memberships
                .map(
                    item =>
                        item.license_id
                )
                .filter(Boolean);


        if (!ids.length) {

            box.innerHTML = `

                <div class="license-card">

                    هنوز هیچ لایسنسی نداری.

                </div>

            `;

            return;

        }


        const {
            data: licenses,
            error
        } =
            await withTimeout(

                db
                    .from("licenses")
                    .select("*")
                    .in(
                        "id",
                        ids
                    )
                    .eq(
                        "is_active",
                        true
                    )
                    .order(
                        "created_at",
                        {
                            ascending:
                                false
                        }
                    ),

                15000,

                "بارگذاری لایسنس‌ها طول کشید."

            );


        if (error) {

            showError(
                error
            );

            return;

        }


        if (
            !licenses ||
            licenses.length === 0
        ) {

            box.innerHTML = `

                <div class="license-card">

                    هیچ لایسنس فعالی پیدا نشد.

                </div>

            `;

            return;

        }


        box.innerHTML =
            licenses
                .map(
                    license => {

                        const owner =
                            license.owner_id ===
                            currentUser.id;


                        return `

                            <button
                                type="button"
                                class="license-card"
                                onclick="
                                    openLicense(
                                        '${escapeAttribute(
                                            license.id
                                        )}'
                                    )
                                "
                            >

                                <h3>
                                    ${escapeHTML(
                                        license.name
                                    )}
                                </h3>


                                <p>
                                    ${escapeHTML(
                                        license.description ||
                                        ""
                                    )}
                                </p>


                                <span
                                    class="${
                                        owner
                                        ?
                                        "license-owner"
                                        :
                                        "license-member"
                                    }"
                                >

                                    ${
                                        owner
                                        ?
                                        "👑 مالک"
                                        :
                                        "👤 عضو"
                                    }

                                </span>


                                <br><br>


                                <small>

                                    🔑 کد:

                                    ${escapeHTML(
                                        license.code
                                    )}

                                </small>

                            </button>

                        `;

                    }
                )
                .join("");

    } catch (error) {

        showError(
            error
        );

        box.innerHTML = `

            <div class="license-card">

                ❌ بارگذاری لایسنس ناموفق بود.

            </div>

        `;

    }

}


/* =========================================================
   CREATE LICENSE MODAL
========================================================= */

function openCreateLicenseModal() {

    openModal(`

        <div class="modal-title">

            <h2>
                🎓 ساخت لایسنس جدید
            </h2>

        </div>


        <p>

            بعد از ساخت، خودت به‌صورت خودکار
            عضو و مالک لایسنس می‌شوی.

        </p>


        <input
            id="newLicenseName"
            type="text"
            placeholder="نام لایسنس"
            maxlength="120"
        >


        <input
            id="newLicenseCode"
            type="text"
            placeholder="کد مثلاً 2B2R"
            maxlength="80"
        >


        <textarea
            id="newLicenseDescription"
            placeholder="توضیحات لایسنس"
            maxlength="1000"
        ></textarea>


        <button
            type="button"
            class="modal-submit"
            onclick="createLicense()"
        >

            ساخت لایسنس

        </button>

    `);

}


async function createLicense() {

    if (!currentUser) {

        toast(
            "ابتدا وارد حساب شو."
        );

        return;

    }


    const name =
        $("newLicenseName")
            ?.value
            ?.trim()
            || "";


    const code =
        normalizeCode(
            $("newLicenseCode")
                ?.value
                || ""
        );


    const description =
        $("newLicenseDescription")
            ?.value
            ?.trim()
            || "";


    if (!name) {

        toast(
            "نام لایسنس را وارد کن."
        );

        return;

    }


    if (code.length < 3) {

        toast(
            "کد لایسنس حداقل ۳ کاراکتر باشد."
        );

        return;

    }


    const {
        data,
        error
    } =
        await db.rpc(
            "create_license",
            {

                p_code:
                    code,

                p_name:
                    name,

                p_description:
                    description

            }
        );


    if (error) {

        showError(
            error
        );

        return;

    }


    closeModal();


    toast(
        "✅ لایسنس با موفقیت ساخته شد."
    );


    await loadLicenses();


    const licenseId =
        data?.id ||
        data?.[0]?.id;


    if (licenseId) {

        await openLicense(
            licenseId
        );

    }

}


/* =========================================================
   JOIN LICENSE
========================================================= */

async function joinLicense() {

    if (!currentUser) {

        toast(
            "ابتدا وارد حساب شو."
        );

        return;

    }


    const raw =
        $("licenseInput")
            ?.value
            ?.trim()
            || "";


    const code =
        extractLicenseCode(
            raw
        );


    if (!code) {

        toast(
            "کد یا لینک لایسنس را وارد کن."
        );

        return;

    }


    /*
     * Prefer RPC if available.
     * It automatically inserts the user into
     * license_members and access history.
     */

    const {
        data: rpcLicense,
        error: rpcError
    } =
        await db.rpc(
            "join_license",
            {
                p_code:
                    code
            }
        );


    if (!rpcError) {

        $("licenseInput").value = "";


        toast(
            "✅ با موفقیت وارد لایسنس شدی."
        );


        await loadLicenses();


        const licenseId =
            rpcLicense?.id ||
            rpcLicense?.[0]?.id;


        if (licenseId) {

            await openLicense(
                licenseId
            );

        }


        return;

    }


    /*
     * Compatibility fallback for databases
     * that do not yet have join_license RPC.
     */

    console.warn(
        "join_license RPC failed; using fallback:",
        rpcError
    );


    const {
        data: license,
        error
    } =
        await db
            .from("licenses")
            .select("*")
            .eq(
                "code",
                code
            )
            .eq(
                "is_active",
                true
            )
            .maybeSingle();


    if (error) {

        showError(
            error
        );

        return;

    }


    if (!license) {

        toast(
            "❌ لایسنس پیدا نشد."
        );

        return;

    }


    const {
        error: joinError
    } =
        await db
            .from("license_members")
            .upsert(

                {

                    license_id:
                        license.id,

                    user_id:
                        currentUser.id

                },

                {

                    onConflict:
                        "license_id,user_id"

                }

            );


    if (joinError) {

        showError(
            joinError
        );

        return;

    }


    await db
        .from("license_access_history")
        .insert({

            license_id:
                license.id,

            user_id:
                currentUser.id

        });


    $("licenseInput").value = "";


    toast(
        "✅ با موفقیت وارد لایسنس شدی."
    );


    await loadLicenses();


    await openLicense(
        license.id
    );

}


/* =========================================================
   OPEN LICENSE
========================================================= */

async function openLicense(id) {

    if (!id)
        return;


    await cleanupLicenseRealtime();


    const {
        data: license,
        error
    } =
        await withTimeout(

            db
                .from("licenses")
                .select("*")
                .eq(
                    "id",
                    id
                )
                .single(),

            15000,

            "باز کردن لایسنس طول کشید."

        );


    if (error) {

        showError(
            error
        );

        return;

    }


    if (!license) {

        toast(
            "لایسنس پیدا نشد."
        );

        return;

    }


    currentLicense =
        license;


    currentFolder =
        null;


    privateTargetUser =
        null;


    hideAllPages();


    if ($("licensePage"))
        $("licensePage").hidden = false;


    setText(
        "licenseName",
        license.name
    );


    setText(
        "licenseDescription",
        license.description ||
        ""
    );


    setText(
        "licenseCode",
        license.code
    );


    const owner =
        license.owner_id ===
        currentUser.id;


    setHidden(
        "manageTab",
        !owner
    );


    setHidden(
        "addShortButton",
        !owner
    );


    /*
     * Some HTML layouts use an "add video" button.
     */

    setHidden(
        "addVideoButton",
        !owner
    );


    setHidden(
        "addFolderButton",
        !owner
    );


    await openLicenseTab(
        "videos"
    );


    await subscribeGroup();

    await subscribePrivate();

}


/* =========================================================
   LICENSE TABS
========================================================= */

async function openLicenseTab(tab) {

    const tabs = {

        videos:
            $("videosTab"),

        shorts:
            $("shortsTab"),

        group:
            $("groupTab"),

        private:
            $("privateTab"),

        members:
            $("membersTab"),

        manage:
            $("manageTabContent")

    };


    Object.values(
        tabs
    )
        .filter(Boolean)
        .forEach(
            element => {

                element.hidden =
                    true;

            }
        );


    if (!tabs[tab])
        return;


    tabs[tab].hidden =
        false;


    if (tab === "videos") {

        currentFolder =
            currentFolder ||
            null;

        await loadFolders();

    }


    if (tab === "shorts") {

        await loadShorts();

    }


    if (tab === "group") {

        await loadGroupMessages();

    }


    if (tab === "private") {

        await loadPrivateMessages();

    }


    if (tab === "members") {

        await loadMembers();

    }


    if (tab === "manage") {

        await loadManageTree();

    }

}


/* =========================================================
   FOLDERS
========================================================= */

async function loadFolders() {

    if (!currentLicense)
        return;


    const foldersBox =
        $("foldersGrid");


    const videosBox =
        $("videosGrid");


    if (!foldersBox ||
        !videosBox)
        return;


    foldersBox.innerHTML = `

        <div class="folder-card">

            ⏳ در حال بارگذاری پوشه‌ها...

        </div>

    `;


    videosBox.innerHTML = "";


    try {

        let folderQuery =
            db
                .from("license_folders")
                .select("*")
                .eq(
                    "license_id",
                    currentLicense.id
                )
                .order(
                    "sort_order",
                    {
                        ascending:
                            true
                    }
                )
                .order(
                    "name",
                    {
                        ascending:
                            true
                    }
                );


        if (currentFolder) {

            folderQuery =
                folderQuery.eq(
                    "parent_id",
                    currentFolder.id
                );


            setHidden(
                "parentFolderButton",
                false
            );


            setText(
                "folderTitle",
                "📁 " +
                currentFolder.name
            );

        } else {

            folderQuery =
                folderQuery.is(
                    "parent_id",
                    null
                );


            setHidden(
                "parentFolderButton",
                true
            );


            setText(
                "folderTitle",
                "📚 پوشه اصلی"
            );

        }


        const {
            data: folders,
            error
        } =
            await withTimeout(
                folderQuery,
                15000,
                "بارگذاری پوشه‌ها طول کشید."
            );


        if (error) {

            showError(
                error
            );

            foldersBox.innerHTML = "";

            return;

        }


        if (
            !folders ||
            folders.length === 0
        ) {

            foldersBox.innerHTML = "";

        } else {

            foldersBox.innerHTML =
                folders
                    .map(
                        folder => `

                            <button
                                type="button"
                                class="folder-card"
                                onclick="
                                    openFolder(
                                        '${escapeAttribute(
                                            folder.id
                                        )}'
                                    )
                                "
                            >

                                <span class="folder-icon">
                                    📁
                                </span>


                                <strong>
                                    ${escapeHTML(
                                        folder.name
                                    )}
                                </strong>

                            </button>

                        `
                    )
                    .join("");

        }


        await loadVideos();

    } catch (error) {

        showError(
            error
        );

        foldersBox.innerHTML = "";

    }

}


/* =========================================================
   OPEN FOLDER
========================================================= */

async function openFolder(id) {

    if (!id)
        return;


    const {
        data,
        error
    } =
        await db
            .from("license_folders")
            .select("*")
            .eq(
                "id",
                id
            )
            .eq(
                "license_id",
                currentLicense.id
            )
            .single();


    if (error) {

        showError(
            error
        );

        return;

    }


    currentFolder =
        data;


    await loadFolders();

}


/* =========================================================
   PARENT FOLDER
========================================================= */

async function goParentFolder() {

    if (!currentFolder) {

        return;

    }


    if (!currentFolder.parent_id) {

        currentFolder =
            null;

        await loadFolders();

        return;

    }


    const {
        data,
        error
    } =
        await db
            .from("license_folders")
            .select("*")
            .eq(
                "id",
                currentFolder.parent_id
            )
            .single();


    if (error) {

        showError(
            error
        );

        return;

    }


    currentFolder =
        data;


    await loadFolders();

}


/* =========================================================
   VIDEOS
========================================================= */

async function loadVideos() {

    if (!currentLicense)
        return;


    const box =
        $("videosGrid");


    if (!box)
        return;


    box.innerHTML = `

        <div class="license-card">

            ⏳ در حال بارگذاری ویدیوها...

        </div>

    `;


    try {

        let query =
            db
                .from("videos")
                .select("*")
                .eq(
                    "license_id",
                    currentLicense.id
                )
                .order(
                    "sort_order",
                    {
                        ascending:
                            true
                    }
                )
                .order(
                    "created_at",
                    {
                        ascending:
                            true
                    }
                );


        if (currentFolder) {

            query =
                query.eq(
                    "folder_id",
                    currentFolder.id
                );

        } else {

            query =
                query.is(
                    "folder_id",
                    null
                );

        }


        const {
            data,
            error
        } =
            await withTimeout(
                query,
                15000,
                "بارگذاری ویدیوها طول کشید."
            );


        if (error) {

            showError(
                error
            );

            box.innerHTML = `

                <div class="license-card">

                    ❌ خطا در بارگذاری ویدیوها.

                </div>

            `;

            return;

        }


        if (
            !data ||
            data.length === 0
        ) {

            box.innerHTML = `

                <div class="license-card">

                    🎬

                    <br><br>

                    در این پوشه هنوز ویدیویی وجود ندارد.

                </div>

            `;

            return;

        }


        box.innerHTML =
            data
                .map(
                    video => `

                        <button
                            type="button"
                            class="video-card"
                            onclick="
                                playVideo(
                                    '${escapeAttribute(
                                        video.id
                                    )}'
                                )
                            "
                        >

                            <div class="video-placeholder">

                                ▶

                            </div>


                            <div class="video-card-body">

                                <h3>
                                    ${escapeHTML(
                                        video.title
                                    )}
                                </h3>


                                <p>
                                    ${escapeHTML(
                                        video.description ||
                                        ""
                                    )}
                                </p>

                            </div>

                        </button>

                    `
                )
                .join("");

    } catch (error) {

        showError(
            error
        );

        box.innerHTML = `

            <div class="license-card">

                ❌ بارگذاری ویدیو ناموفق بود.

            </div>

        `;

    }

}


/* =========================================================
   OPEN VIDEO MODAL
========================================================= */

function openVideoModal() {

    if (
        !currentLicense ||
        currentLicense.owner_id !==
            currentUser.id
    ) {

        toast(
            "فقط مالک لایسنس می‌تواند ویدیو اضافه کند."
        );

        return;

    }


    openModal(`

        <h2>
            🎬 افزودن ویدیو
        </h2>


        <p>

            ${
                currentFolder
                ?
                "پوشه فعلی: " +
                escapeHTML(
                    currentFolder.name
                )
                :
                "ویدیو در پوشه اصلی قرار می‌گیرد."
            }

        </p>


        <input
            id="videoTitleInput"
            type="text"
            placeholder="نام ویدیو"
            maxlength="200"
        >


        <textarea
            id="videoDescriptionInput"
            placeholder="توضیحات ویدیو"
            maxlength="2000"
        ></textarea>


        <input
            id="videoFileInput"
            type="file"
            accept="video/*"
        >


        <button
            type="button"
            class="modal-submit"
            onclick="uploadVideo()"
        >

            آپلود ویدیو

        </button>

    `);

}


/* =========================================================
   UPLOAD VIDEO
========================================================= */

async function uploadVideo() {

    if (
        !currentLicense ||
        !currentUser
    ) {

        toast(
            "لایسنس معتبر نیست."
        );

        return;

    }


    if (
        currentLicense.owner_id !==
        currentUser.id
    ) {

        toast(
            "فقط مالک اجازه آپلود دارد."
        );

        return;

    }


    const title =
        $("videoTitleInput")
            ?.value
            ?.trim()
            || "";


    const description =
        $("videoDescriptionInput")
            ?.value
            ?.trim()
            || "";


    const file =
        $("videoFileInput")
            ?.files
            ?.item(0);


    if (!title) {

        toast(
            "نام ویدیو را وارد کن."
        );

        return;

    }


    if (!file) {

        toast(
            "فایل ویدیو را انتخاب کن."
        );

        return;

    }


    const safeName =
        safeFileName(
            file.name
        );


    const path =
        currentLicense.id +
        "/" +
        randomId() +
        "-" +
        safeName;


    toast(
        "⏳ در حال آپلود ویدیو..."
    );


    const {
        error:
            uploadError
    } =
        await db.storage
            .from(
                "license-videos"
            )
            .upload(
                path,
                file,
                {

                    upsert:
                        false,

                    contentType:
                        file.type ||
                        "video/mp4"

                }
            );


    if (uploadError) {

        showError(
            uploadError
        );

        return;

    }


    /*
     * First try the secure RPC.
     */

    const {
        data: rpcData,
        error: rpcError
    } =
        await db.rpc(
            "create_video",
            {

                p_license_id:
                    currentLicense.id,

                p_folder_id:
                    currentFolder?.id ||
                    null,

                p_title:
                    title,

                p_description:
                    description,

                p_storage_path:
                    path

            }
        );


    if (!rpcError) {

        closeModal();


        toast(
            "✅ ویدیو با موفقیت اضافه شد."
        );


        await loadFolders();

        return;

    }


    /*
     * Compatibility fallback.
     */

    console.warn(
        "create_video RPC unavailable:",
        rpcError
    );


    const {
        error:
            databaseError
    } =
        await db
            .from("videos")
            .insert({

                license_id:
                    currentLicense.id,

                folder_id:
                    currentFolder?.id ||
                    null,

                title,

                description,

                storage_path:
                    path,

                sort_order:
                    0

            });


    if (databaseError) {

        await db.storage
            .from(
                "license-videos"
            )
            .remove([
                path
            ]);


        showError(
            databaseError
        );

        return;

    }


    closeModal();


    toast(
        "✅ ویدیو با موفقیت اضافه شد."
    );


    await loadFolders();

}


/* =========================================================
   PLAY VIDEO
========================================================= */

async function playVideo(id) {

    if (!currentLicense) {

        toast(
            "لایسنس باز نیست."
        );

        return;

    }


    const player =
        $("videoPlayer");


    if (!player) {

        toast(
            "پلیر در HTML پیدا نشد."
        );

        return;

    }


    /*
     * Explicit loading state.
     */

    const oldTitle =
        $("playerVideoTitle")
            ?.textContent
            || "";


    setText(
        "playerVideoTitle",
        "⏳ در حال آماده‌سازی..."
    );


    setText(
        "playerLicenseName",
        currentLicense.name
    );


    try {

        const {
            data: video,
            error
        } =
            await withTimeout(

                db
                    .from("videos")
                    .select("*")
                    .eq(
                        "id",
                        id
                    )
                    .eq(
                        "license_id",
                        currentLicense.id
                    )
                    .single(),

                15000,

                "دریافت اطلاعات ویدیو طول کشید."

            );


        if (error) {

            showError(
                error
            );

            setText(
                "playerVideoTitle",
                oldTitle
            );

            return;

        }


        if (!video?.storage_path) {

            toast(
                "مسیر فایل ویدیو وجود ندارد."
            );

            return;

        }


        toast(
            "⏳ در حال ساخت لینک امن ویدیو..."
        );


        const {
            data: signed,
            error:
                signedError
        } =
            await withTimeout(

                db.storage
                    .from(
                        "license-videos"
                    )
                    .createSignedUrl(
                        video.storage_path,
                        3600
                    ),

                15000,

                "ساخت لینک ویدیو طول کشید."

            );


        if (
            signedError ||
            !signed?.signedUrl
        ) {

            showError(
                signedError ||
                new Error(
                    "Signed URL ساخته نشد."
                )
            );

            return;

        }


        player.pause();


        /*
         * Completely reset the player.
         */

        player.removeAttribute(
            "src"
        );


        player.load();


        player.src =
            signed.signedUrl;


        player.preload =
            "metadata";


        setText(
            "playerVideoTitle",
            video.title
        );


        setText(
            "playerLicenseName",
            currentLicense.name
        );


        /*
         * Show player only after the URL
         * has been successfully generated.
         */

        if ($("licensePage"))
            $("licensePage").hidden = true;

        if ($("playerPage"))
            $("playerPage").hidden = false;


        /*
         * Do not await play().
         * Browser autoplay policies may block it.
         */

        player.load();


    } catch (error) {

        showError(
            error
        );

    }

}


/* =========================================================
   PLAY SHORT
========================================================= */

async function playShort(id) {

    if (!currentLicense)
        return;


    const player =
        $("videoPlayer");


    if (!player) {

        toast(
            "پلیر پیدا نشد."
        );

        return;

    }


    try {

        const {
            data: short,
            error
        } =
            await db
                .from("short_videos")
                .select("*")
                .eq(
                    "id",
                    id
                )
                .eq(
                    "license_id",
                    currentLicense.id
                )
                .single();


        if (error) {

            showError(
                error
            );

            return;

        }


        if (!short?.storage_path) {

            toast(
                "مسیر Short وجود ندارد."
            );

            return;

        }


        toast(
            "⏳ در حال آماده‌سازی Short..."
        );


        const {
            data: signed,
            error:
                signedError
        } =
            await db.storage
                .from(
                    "license-shorts"
                )
                .createSignedUrl(
                    short.storage_path,
                    3600
                );


        if (
            signedError ||
            !signed?.signedUrl
        ) {

            showError(
                signedError ||
                new Error(
                    "Signed URL ساخته نشد."
                )
            );

            return;

        }


        player.pause();

        player.removeAttribute(
            "src"
        );

        player.load();

        player.src =
            signed.signedUrl;


        setText(
            "playerVideoTitle",
            short.title
        );


        setText(
            "playerLicenseName",
            currentLicense.name
        );


        if ($("licensePage"))
            $("licensePage").hidden = true;

        if ($("playerPage"))
            $("playerPage").hidden = false;


        player.load();

    } catch (error) {

        showError(
            error
        );

    }

}


/* =========================================================
   CLOSE PLAYER
========================================================= */

function closePlayer() {

    const player =
        $("videoPlayer");


    if (player) {

        player.pause();

        player.removeAttribute(
            "src"
        );

        player.load();

    }


    if ($("playerPage"))
        $("playerPage").hidden = true;


    if ($("licensePage"))
        $("licensePage").hidden = false;

}


/* =========================================================
   CREATE FOLDER MODAL
========================================================= */

function openFolderModal() {

    if (
        !currentLicense ||
        currentLicense.owner_id !==
            currentUser.id
    ) {

        toast(
            "فقط مالک می‌تواند پوشه بسازد."
        );

        return;

    }


    openModal(`

        <h2>
            📁 ساخت پوشه
        </h2>


        <p>

            ${
                currentFolder
                ?
                "داخل: " +
                escapeHTML(
                    currentFolder.name
                )
                :
                "در پوشه اصلی"
            }

        </p>


        <input
            id="folderNameInput"
            type="text"
            placeholder="مثلاً فصل اول"
            maxlength="150"
        >


        <button
            type="button"
            class="modal-submit"
            onclick="createFolder()"
        >

            ساخت پوشه

        </button>

    `);

}


/* =========================================================
   CREATE FOLDER
========================================================= */

async function createFolder() {

    if (
        !currentLicense ||
        currentLicense.owner_id !==
            currentUser.id
    ) {

        toast(
            "دسترسی ندارید."
        );

        return;

    }


    const name =
        $("folderNameInput")
            ?.value
            ?.trim()
            || "";


    if (!name) {

        toast(
            "نام پوشه را وارد کن."
        );

        return;

    }


    /*
     * Try RPC first.
     */

    const {
        error:
            rpcError
    } =
        await db.rpc(
            "create_license_folder",
            {

                p_license_id:
                    currentLicense.id,

                p_parent_id:
                    currentFolder?.id ||
                    null,

                p_name:
                    name

            }
        );


    if (rpcError) {

        console.warn(
            "create_license_folder RPC unavailable:",
            rpcError
        );


        const {
            error
        } =
            await db
                .from("license_folders")
                .insert({

                    license_id:
                        currentLicense.id,

                    parent_id:
                        currentFolder?.id ||
                        null,

                    name,

                    sort_order:
                        0

                });


        if (error) {

            showError(
                error
            );

            return;

        }

    }


    closeModal();


    toast(
        "✅ پوشه ساخته شد."
    );


    await loadFolders();

    await loadManageTree();

}


/* =========================================================
   MANAGEMENT TREE
========================================================= */

async function loadManageTree() {

    if (!currentLicense)
        return;


    const box =
        $("manageTree");


    if (!box)
        return;


    box.innerHTML = `

        <div class="tree-item">

            ⏳ در حال ساخت ساختار...

        </div>

    `;


    try {

        const {
            data: folders,
            error:
                folderError
        } =
            await db
                .from("license_folders")
                .select("*")
                .eq(
                    "license_id",
                    currentLicense.id
                )
                .order(
                    "name",
                    {
                        ascending:
                            true
                    }
                );


        if (folderError) {

            showError(
                folderError
            );

            return;

        }


        const {
            data: videos,
            error:
                videoError
        } =
            await db
                .from("videos")
                .select("*")
                .eq(
                    "license_id",
                    currentLicense.id
                )
                .order(
                    "created_at",
                    {
                        ascending:
                            true
                    }
                );


        if (videoError) {

            showError(
                videoError
            );

            return;

        }


        let html = `

            <div class="tree-item">

                📚 پوشه اصلی

            </div>

        `;


        (folders || [])
            .filter(
                folder =>
                    !folder.parent_id
            )
            .forEach(
                folder => {

                    html +=
                        renderTreeFolder(
                            folder,
                            folders || [],
                            videos || [],
                            1
                        );

                }
            );


        (videos || [])
            .filter(
                video =>
                    !video.folder_id
            )
            .forEach(
                video => {

                    html += `

                        <div
                            class="tree-item"
                            style="
                                margin-right:20px
                            "
                        >

                            🎬

                            ${escapeHTML(
                                video.title
                            )}

                        </div>

                    `;

                }
            );


        box.innerHTML =
            html;

    } catch (error) {

        showError(
            error
        );

    }

}


/* =========================================================
   RENDER MANAGEMENT TREE
========================================================= */

function renderTreeFolder(
    folder,
    folders,
    videos,
    level
) {

    let html = `

        <div
            class="tree-item"
            style="
                margin-right:${level * 20}px
            "
        >

            📁

            <strong>

                ${escapeHTML(
                    folder.name
                )}

            </strong>

        </div>

    `;


    videos
        .filter(
            video =>
                video.folder_id ===
                folder.id
        )
        .forEach(
            video => {

                html += `

                    <div
                        class="tree-item"
                        style="
                            margin-right:${(level + 1) * 20}px
                        "
                    >

                        🎬

                        ${escapeHTML(
                            video.title
                        )}

                    </div>

                `;

            }
        );


    folders
        .filter(
            child =>
                child.parent_id ===
                folder.id
        )
        .forEach(
            child => {

                html +=
                    renderTreeFolder(
                        child,
                        folders,
                        videos,
                        level + 1
                    );

            }
        );


    return html;

}


/* =========================================================
   SHORTS
========================================================= */

async function loadShorts() {

    if (!currentLicense)
        return;


    const box =
        $("shortsGrid");


    if (!box)
        return;


    box.innerHTML = `

        <div class="license-card">

            ⏳ در حال بارگذاری Shorts...

        </div>

    `;


    try {

        const {
            data,
            error
        } =
            await db
                .from("short_videos")
                .select("*")
                .eq(
                    "license_id",
                    currentLicense.id
                )
                .order(
                    "sort_order",
                    {
                        ascending:
                            true
                    }
                )
                .order(
                    "created_at",
                    {
                        ascending:
                            false
                    }
                );


        if (error) {

            showError(
                error
            );

            return;

        }


        if (
            !data ||
            data.length === 0
        ) {

            box.innerHTML = `

                <div class="license-card">

                    📱 هنوز Short ساخته نشده.

                </div>

            `;

            return;

        }


        const cards = [];


        for (
            const short
            of data
        ) {

            let thumbnailUrl =
                null;


            if (
                short.thumbnail_path
            ) {

                const {
                    data: thumb
                } =
                    await db.storage
                        .from(
                            "license-shorts"
                        )
                        .createSignedUrl(
                            short.thumbnail_path,
                            3600
                        );


                thumbnailUrl =
                    thumb?.signedUrl ||
                    null;

            }


            cards.push(`

                <button
                    type="button"
                    class="short-card"
                    onclick="
                        playShort(
                            '${escapeAttribute(
                                short.id
                            )}'
                        )
                    "
                >

                    ${
                        thumbnailUrl
                        ?

                        `

                            <img
                                class="short-thumb"
                                src="${escapeAttribute(
                                    thumbnailUrl
                                )}"
                                alt=""
                            >

                        `

                        :

                        `

                            <div
                                class="short-fallback"
                            >

                                📱

                            </div>

                        `
                    }


                    <div class="short-card-body">

                        <strong>

                            ${escapeHTML(
                                short.title
                            )}

                        </strong>

                    </div>

                </button>

            `);

        }


        box.innerHTML =
            cards.join("");

    } catch (error) {

        showError(
            error
        );

        box.innerHTML = `

            <div class="license-card">

                ❌ بارگذاری Shorts ناموفق بود.

            </div>

        `;

    }

}


/* =========================================================
   OPEN SHORT MODAL
========================================================= */

function openShortModal() {

    if (
        !currentLicense ||
        currentLicense.owner_id !==
            currentUser.id
    ) {

        toast(
            "فقط مالک لایسنس می‌تواند Short اضافه کند."
        );

        return;

    }


    openModal(`

        <h2>
            📱 افزودن Short
        </h2>


        <input
            id="shortTitleInput"
            type="text"
            placeholder="عنوان Short"
            maxlength="200"
        >


        <textarea
            id="shortDescriptionInput"
            placeholder="توضیحات"
            maxlength="2000"
        ></textarea>


        <label>
            فایل ویدیو
        </label>


        <input
            id="shortVideoInput"
            type="file"
            accept="video/*"
        >


        <label>
            تصویر Thumbnail
        </label>


        <input
            id="shortThumbInput"
            type="file"
            accept="image/*"
        >


        <button
            type="button"
            class="modal-submit"
            onclick="uploadShort()"
        >

            آپلود Short

        </button>

    `);

}


/* =========================================================
   UPLOAD SHORT
========================================================= */

async function uploadShort() {

    if (
        !currentLicense ||
        currentLicense.owner_id !==
            currentUser.id
    ) {

        toast(
            "دسترسی ندارید."
        );

        return;

    }


    const title =
        $("shortTitleInput")
            ?.value
            ?.trim()
            || "";


    const description =
        $("shortDescriptionInput")
            ?.value
            ?.trim()
            || "";


    const video =
        $("shortVideoInput")
            ?.files
            ?.item(0);


    const thumbnail =
        $("shortThumbInput")
            ?.files
            ?.item(0);


    if (!title) {

        toast(
            "عنوان را وارد کن."
        );

        return;

    }


    if (!video) {

        toast(
            "ویدیوی Short را انتخاب کن."
        );

        return;

    }


    const safeVideoName =
        safeFileName(
            video.name
        );


    const videoPath =
        currentLicense.id +
        "/" +
        randomId() +
        "-" +
        safeVideoName;


    toast(
        "⏳ در حال آپلود Short..."
    );


    const {
        error:
            videoError
    } =
        await db.storage
            .from(
                "license-shorts"
            )
            .upload(
                videoPath,
                video,
                {

                    upsert:
                        false,

                    contentType:
                        video.type ||
                        "video/mp4"

                }
            );


    if (videoError) {

        showError(
            videoError
        );

        return;

    }


    let thumbnailPath =
        null;


    if (thumbnail) {

        const safeThumbName =
            safeFileName(
                thumbnail.name
            );


        thumbnailPath =
            currentLicense.id +
            "/thumb-" +
            randomId() +
            "-" +
            safeThumbName;


        const {
            error:
                thumbError
        } =
            await db.storage
                .from(
                    "license-shorts"
                )
                .upload(
                    thumbnailPath,
                    thumbnail,
                    {

                        upsert:
                            false,

                        contentType:
                            thumbnail.type ||
                            "image/jpeg"

                    }
                );


        if (thumbError) {

            await db.storage
                .from(
                    "license-shorts"
                )
                .remove([
                    videoPath
                ]);


            showError(
                thumbError
            );

            return;

        }

    }


    /*
     * Try secure RPC first.
     */

    const {
        error:
            rpcError
    } =
        await db.rpc(
            "create_short_video",
            {

                p_license_id:
                    currentLicense.id,

                p_title:
                    title,

                p_description:
                    description,

                p_storage_path:
                    videoPath,

                p_thumbnail_path:
                    thumbnailPath

            }
        );


    if (rpcError) {

        console.warn(
            "create_short_video RPC unavailable:",
            rpcError
        );


        const {
            error:
                databaseError
        } =
            await db
                .from("short_videos")
                .insert({

                    license_id:
                        currentLicense.id,

                    title,

                    description,

                    storage_path:
                        videoPath,

                    thumbnail_path:
                        thumbnailPath,

                    sort_order:
                        0

                });


        if (databaseError) {

            await db.storage
                .from(
                    "license-shorts"
                )
                .remove([
                    videoPath
                ]);


            if (thumbnailPath) {

                await db.storage
                    .from(
                        "license-shorts"
                    )
                    .remove([
                        thumbnailPath
                    ]);

            }


            showError(
                databaseError
            );

            return;

        }

    }


    closeModal();


    toast(
        "✅ Short با موفقیت اضافه شد."
    );


    await loadShorts();

}


/* =========================================================
   MEMBERS
========================================================= */

async function loadMembers() {

    if (!currentLicense)
        return;


    const box =
        $("membersGrid");


    if (!box)
        return;


    box.innerHTML = `

        <div class="member-card">

            ⏳ در حال بارگذاری اعضا...

        </div>

    `;


    try {

        const {
            data,
            error
        } =
            await db
                .from("license_members")
                .select(`
                    user_id,
                    joined_at,
                    profiles(
                        username,
                        display_name,
                        avatar_url
                    )
                `)
                .eq(
                    "license_id",
                    currentLicense.id
                )
                .order(
                    "joined_at",
                    {
                        ascending:
                            true
                    }
                );


        if (error) {

            showError(
                error
            );

            return;

        }


        if (
            !data ||
            data.length === 0
        ) {

            box.innerHTML = `

                <div class="member-card">

                    هنوز عضوی وجود ندارد.

                </div>

            `;

            return;

        }


        box.innerHTML =
            data
                .map(
                    member => {

                        const profile =
                            member.profiles;


                        const username =
                            profile?.username ||
                            "کاربر";


                        const displayName =
                            profile?.display_name ||
                            username;


                        const isOwner =
                            member.user_id ===
                            currentLicense.owner_id;


                        return `

                            <div class="member-card">

                                <div class="avatar">

                                    ${escapeHTML(
                                        username
                                            .charAt(0)
                                            .toUpperCase()
                                    )}

                                </div>


                                <div>

                                    <div class="member-name">

                                        ${escapeHTML(
                                            displayName
                                        )}

                                        ${
                                            isOwner
                                            ?
                                            " 👑"
                                            :
                                            ""
                                        }

                                    </div>


                                    <div class="member-username">

                                        @${escapeHTML(
                                            username
                                        )}

                                    </div>

                                </div>

                            </div>

                        `;

                    }
                )
                .join("");

    } catch (error) {

        showError(
            error
        );

    }

}


/* =========================================================
   PRIVATE CHAT TARGET
========================================================= */

async function preparePrivateTarget() {

    if (!currentLicense ||
        !currentUser)
        return null;


    const ownerId =
        currentLicense.owner_id;


    /*
     * Normal member:
     * target = owner.
     */

    if (
        currentUser.id !==
        ownerId
    ) {

        privateTargetUser =
            ownerId;


        const {
            data
        } =
            await db
                .from("profiles")
                .select(
                    "username,display_name"
                )
                .eq(
                    "id",
                    ownerId
                )
                .maybeSingle();


        setText(
            "privateTargetName",
            data?.display_name ||
            data?.username ||
            "مالک لایسنس"
        );


        return ownerId;

    }


    /*
     * Owner:
     * choose a member.
     */

    const {
        data: members,
        error
    } =
        await db
            .from("license_members")
            .select(`
                user_id,
                profiles(
                    username,
                    display_name
                )
            `)
            .eq(
                "license_id",
                currentLicense.id
            )
            .neq(
                "user_id",
                currentUser.id
            )
            .order(
                "joined_at",
                {
                    ascending:
                        true
                }
            );


    if (error) {

        showError(
            error
        );

        return null;

    }


    /*
     * If no member exists.
     */

    if (
        !members ||
        members.length === 0
    ) {

        privateTargetUser =
            null;


        setText(
            "privateTargetName",
            "هنوز عضوی برای پیوی وجود ندارد"
        );


        return null;

    }


    /*
     * Preserve currently selected member
     * if they are still a member.
     */

    const existing =
        members.find(
            member =>
                member.user_id ===
                privateTargetUser
        );


    if (!existing) {

        privateTargetUser =
            members[0].user_id;

    }


    setText(
        "privateTargetName",
        existing?.profiles?.display_name ||
        existing?.profiles?.username ||
        members[0]?.profiles?.display_name ||
        members[0]?.profiles?.username ||
        "عضو"
    );


    renderPrivateTargetSelector(
        members
    );


    return privateTargetUser;

}


/* =========================================================
   PRIVATE TARGET SELECTOR
========================================================= */

function renderPrivateTargetSelector(
    members
) {

    const container =
        $("privateTargetSelector");


    if (!container)
        return;


    if (
        !currentLicense ||
        currentLicense.owner_id !==
            currentUser.id
    ) {

        container.innerHTML =
            "";

        return;

    }


    container.innerHTML = `

        <select
            id="privateTargetSelect"
            onchange="changePrivateTarget(this.value)"
        >

            ${
                members
                    .map(
                        member => `

                            <option
                                value="${escapeAttribute(
                                    member.user_id
                                )}"
                                ${
                                    member.user_id ===
                                    privateTargetUser
                                    ?
                                    "selected"
                                    :
                                    ""
                                }
                            >

                                ${escapeHTML(
                                    member.profiles?.display_name ||
                                    member.profiles?.username ||
                                    "عضو"
                                )}

                                @${escapeHTML(
                                    member.profiles?.username ||
                                    "user"
                                )}

                            </option>

                        `
                    )
                    .join("")
            }

        </select>

    `;

}


/* =========================================================
   CHANGE PRIVATE TARGET
========================================================= */

async function changePrivateTarget(
    userId
) {

    if (!currentLicense)
        return;


    if (
        currentLicense.owner_id !==
        currentUser.id
    ) {

        return;

    }


    privateTargetUser =
        userId ||
        null;


    await loadPrivateMessages();

}


/* =========================================================
   PUBLIC CHAT
========================================================= */

async function loadPublicChat() {

    const box =
        $("publicMessages");


    if (!box ||
        !currentUser)
        return;


    box.innerHTML = `

        <div class="license-card">

            ⏳ در حال بارگذاری چت عمومی...

        </div>

    `;


    try {

        const {
            data,
            error
        } =
            await db
                .from(
                    "public_chat_messages"
                )
                .select(`
                    id,
                    user_id,
                    content,
                    created_at,
                    profiles(
                        username,
                        display_name
                    )
                `)
                .order(
                    "created_at",
                    {
                        ascending:
                            true
                    }
                )
                .limit(150);


        if (error) {

            showError(
                error
            );

            return;

        }


        const messages =
            await attachFilesToMessages(
                "public",
                data || []
            );


        renderMessages(
            box,
            messages
        );


        await subscribePublic();

    } catch (error) {

        showError(
            error
        );

    }

}


/* =========================================================
   SEND PUBLIC MESSAGE
========================================================= */

async function sendPublicMessage() {

    if (!currentUser)
        return;


    const text =
        $("publicText")
            ?.value
            ?.trim()
            || "";


    const file =
        $("publicFile")
            ?.files
            ?.item(0);


    if (
        !text &&
        !file
    )
        return;


    const {
        data,
        error
    } =
        await db
            .from(
                "public_chat_messages"
            )
            .insert({

                user_id:
                    currentUser.id,

                content:
                    text ||
                    ""

            })
            .select("*")
            .single();


    if (error) {

        showError(
            error
        );

        return;

    }


    if (file) {

        await uploadChatFile(
            "public",
            data.id,
            file
        );

    }


    if ($("publicText"))
        $("publicText").value = "";


    if ($("publicFile"))
        $("publicFile").value = "";


    await loadPublicChat();

}


/* =========================================================
   GROUP CHAT
========================================================= */

async function loadGroupMessages() {

    if (!currentLicense)
        return;


    const box =
        $("groupMessages");


    if (!box)
        return;


    box.innerHTML = `

        <div class="license-card">

            ⏳ در حال بارگذاری گروه...

        </div>

    `;


    try {

        const {
            data,
            error
        } =
            await db
                .from(
                    "license_group_messages"
                )
                .select(`
                    id,
                    license_id,
                    user_id,
                    content,
                    created_at,
                    profiles(
                        username,
                        display_name
                    )
                `)
                .eq(
                    "license_id",
                    currentLicense.id
                )
                .order(
                    "created_at",
                    {
                        ascending:
                            true
                    }
                )
                .limit(200);


        if (error) {

            showError(
                error
            );

            return;

        }


        const messages =
            await attachFilesToMessages(
                "group",
                data || []
            );


        renderMessages(
            box,
            messages
        );

    } catch (error) {

        showError(
            error
        );

    }

}


/* =========================================================
   SEND GROUP MESSAGE
========================================================= */

async function sendGroupMessage() {

    if (
        !currentUser ||
        !currentLicense
    )
        return;


    const text =
        $("groupText")
            ?.value
            ?.trim()
            || "";


    const file =
        $("groupFile")
            ?.files
            ?.item(0);


    if (
        !text &&
        !file
    )
        return;


    const {
        data,
        error
    } =
        await db
            .from(
                "license_group_messages"
            )
            .insert({

                license_id:
                    currentLicense.id,

                user_id:
                    currentUser.id,

                content:
                    text ||
                    ""

            })
            .select("*")
            .single();


    if (error) {

        showError(
            error
        );

        return;

    }


    if (file) {

        await uploadChatFile(
            "group",
            data.id,
            file
        );

    }


    if ($("groupText"))
        $("groupText").value = "";


    if ($("groupFile"))
        $("groupFile").value = "";


    await loadGroupMessages();

}


/* =========================================================
   PRIVATE CHAT
   IMPORTANT:
   NO malformed .or() filter is used here.
========================================================= */

async function loadPrivateMessages() {

    if (
        !currentLicense ||
        !currentUser
    )
        return;


    const box =
        $("privateMessages");


    if (!box)
        return;


    box.innerHTML = `

        <div class="license-card">

            ⏳ در حال بارگذاری پیوی...

        </div>

    `;


    try {

        await preparePrivateTarget();


        if (!privateTargetUser) {

            box.innerHTML = `

                <div class="license-card">

                    هنوز کاربری برای گفتگوی خصوصی وجود ندارد.

                </div>

            `;

            return;

        }


        const me =
            currentUser.id;


        const target =
            privateTargetUser;


        /*
         * QUERY 1
         * me -> target
         */

        const firstQuery =
            await db
                .from(
                    "private_messages"
                )
                .select(`
                    id,
                    license_id,
                    sender_id,
                    receiver_id,
                    content,
                    created_at,
                    profiles:sender_id(
                        username,
                        display_name
                    )
                `)
                .eq(
                    "license_id",
                    currentLicense.id
                )
                .eq(
                    "sender_id",
                    me
                )
                .eq(
                    "receiver_id",
                    target
                );


        if (firstQuery.error) {

            showError(
                firstQuery.error
            );

            return;

        }


        /*
         * QUERY 2
         * target -> me
         */

        const secondQuery =
            await db
                .from(
                    "private_messages"
                )
                .select(`
                    id,
                    license_id,
                    sender_id,
                    receiver_id,
                    content,
                    created_at,
                    profiles:sender_id(
                        username,
                        display_name
                    )
                `)
                .eq(
                    "license_id",
                    currentLicense.id
                )
                .eq(
                    "sender_id",
                    target
                )
                .eq(
                    "receiver_id",
                    me
                );


        if (secondQuery.error) {

            showError(
                secondQuery.error
            );

            return;

        }


        /*
         * Merge both result sets.
         */

        const messages = [

            ...(firstQuery.data || []),

            ...(secondQuery.data || [])

        ];


        messages.sort(
            (
                a,
                b
            ) => {

                return (
                    new Date(
                        a.created_at
                    ).getTime()
                    -
                    new Date(
                        b.created_at
                    ).getTime()
                );

            }
        );


        const withFiles =
            await attachFilesToMessages(
                "private",
                messages
            );


        renderMessages(
            box,
            withFiles
        );

    } catch (error) {

        showError(
            error
        );

    }

}


/* =========================================================
   SEND PRIVATE MESSAGE
========================================================= */

async function sendPrivateMessage() {

    if (
        !currentUser ||
        !currentLicense
    )
        return;


    await preparePrivateTarget();


    if (!privateTargetUser) {

        toast(
            "گیرنده مشخص نیست."
        );

        return;

    }


    const text =
        $("privateText")
            ?.value
            ?.trim()
            || "";


    const file =
        $("privateFile")
            ?.files
            ?.item(0);


    if (
        !text &&
        !file
    )
        return;


    const {
        data,
        error
    } =
        await db
            .from(
                "private_messages"
            )
            .insert({

                license_id:
                    currentLicense.id,

                sender_id:
                    currentUser.id,

                receiver_id:
                    privateTargetUser,

                content:
                    text ||
                    ""

            })
            .select("*")
            .single();


    if (error) {

        showError(
            error
        );

        return;

    }


    if (file) {

        await uploadChatFile(
            "private",
            data.id,
            file
        );

    }


    if ($("privateText"))
        $("privateText").value = "";


    if ($("privateFile"))
        $("privateFile").value = "";


    await loadPrivateMessages();

}


/* =========================================================
   CHAT FILE UPLOAD
========================================================= */

async function uploadChatFile(
    type,
    messageId,
    file
) {

    if (
        !type ||
        !messageId ||
        !file
    )
        return null;


    const safeName =
        safeFileName(
            file.name
        );


    /*
     * Storage path:
     *
     * public/<uuid>-file
     * group/<uuid>-file
     * private/<uuid>-file
     *
     * This keeps paths simple and avoids
     * malformed nested filters.
     */

    const path =
        type +
        "/" +
        messageId +
        "-" +
        randomId() +
        "-" +
        safeName;


    const {
        error:
            uploadError
    } =
        await db.storage
            .from(
                "chat-files"
            )
            .upload(
                path,
                file,
                {

                    upsert:
                        false,

                    contentType:
                        file.type ||
                        "application/octet-stream"

                }
            );


    if (uploadError) {

        showError(
            uploadError
        );

        return null;

    }


    const {
        data,
        error
    } =
        await db
            .from(
                "message_attachments"
            )
            .insert({

                message_type:
                    type,

                message_id:
                    messageId,

                uploader_id:
                    currentUser.id,

                storage_path:
                    path,

                file_name:
                    file.name,

                mime_type:
                    file.type ||
                    "application/octet-stream",

                file_size:
                    file.size

            })
            .select("*")
            .single();


    if (error) {

        /*
         * Remove uploaded file if DB row failed.
         */

        await db.storage
            .from(
                "chat-files"
            )
            .remove([
                path
            ]);


        showError(
            error
        );

        return null;

    }


    return data;

}


/* =========================================================
   ATTACH FILES TO MESSAGES
========================================================= */

async function attachFilesToMessages(
    type,
    messages
) {

    if (
        !messages ||
        messages.length === 0
    ) {

        return messages || [];

    }


    const ids =
        messages
            .map(
                message =>
                    message.id
            )
            .filter(Boolean);


    if (!ids.length)
        return messages;


    const {
        data: files,
        error
    } =
        await db
            .from(
                "message_attachments"
            )
            .select("*")
            .eq(
                "message_type",
                type
            )
            .in(
                "message_id",
                ids
            );


    if (error) {

        console.error(
            "Attachment query error:",
            error
        );

        return messages;

    }


    return messages.map(
        message => {

            return {

                ...message,

                attachments:
                    (files || [])
                        .filter(
                            file =>
                                file.message_id ===
                                message.id
                        )

            };

        }
    );

}


/* =========================================================
   OPEN CHAT FILE
========================================================= */

async function openChatFile(
    path
) {

    if (!path) {

        toast(
            "مسیر فایل وجود ندارد."
        );

        return;

    }


    try {

        const {
            data,
            error
        } =
            await db.storage
                .from(
                    "chat-files"
                )
                .createSignedUrl(
                    path,
                    600
                );


        if (error) {

            showError(
                error
            );

            return;

        }


        if (
            !data?.signedUrl
        ) {

            toast(
                "لینک فایل ساخته نشد."
            );

            return;

        }


        window.open(
            data.signedUrl,
            "_blank",
            "noopener,noreferrer"
        );

    } catch (error) {

        showError(
            error
        );

    }

}


/* =========================================================
   RENDER CHAT MESSAGES
========================================================= */

function renderMessages(
    box,
    messages
) {

    if (!box)
        return;


    if (
        !messages ||
        messages.length === 0
    ) {

        box.innerHTML = `

            <div class="license-card">

                هنوز پیامی ارسال نشده.

            </div>

        `;

        return;

    }


    box.innerHTML =
        messages
            .map(
                message => {

                    const mine =
                        message.user_id ===
                            currentUser.id
                        ||
                        message.sender_id ===
                            currentUser.id;


                    const profile =
                        message.profiles;


                    const username =
                        profile?.display_name ||
                        profile?.username ||
                        "کاربر";


                    const files =
                        message.attachments ||
                        [];


                    const time =
                        formatDate(
                            message.created_at
                        );


                    return `

                        <div
                            class="
                                message
                                ${
                                    mine
                                    ?
                                    "mine"
                                    :
                                    ""
                                }
                            "
                        >

                            <div class="message-user">

                                ${escapeHTML(
                                    username
                                )}

                            </div>


                            ${
                                message.content
                                ?

                                `

                                    <div class="message-text">

                                        ${escapeHTML(
                                            message.content
                                        )}

                                    </div>

                                `

                                :

                                ""

                            }


                            ${
                                files
                                    .map(
                                        file => `

                                            <button
                                                type="button"
                                                class="message-file"
                                                onclick="
                                                    openChatFile(
                                                        '${escapeAttribute(
                                                            file.storage_path
                                                        )}'
                                                    )
                                                "
                                            >

                                                📎

                                                ${escapeHTML(
                                                    file.file_name
                                                )}

                                            </button>

                                        `
                                    )
                                    .join("")
                            }


                            <div class="message-time">

                                ${escapeHTML(
                                    time
                                )}

                            </div>

                        </div>

                    `;

                }
            )
            .join("");


    box.scrollTop =
        box.scrollHeight;

}


/* =========================================================
   DATE FORMAT
========================================================= */

function formatDate(
    value
) {

    if (!value)
        return "";


    try {

        return new Intl.DateTimeFormat(
            "fa-IR",
            {

                year:
                    "numeric",

                month:
                    "short",

                day:
                    "numeric",

                hour:
                    "2-digit",

                minute:
                    "2-digit"

            }
        )
            .format(
                new Date(
                    value
                )
            );

    } catch {

        return "";

    }

}


/* =========================================================
   HOME ADMIN LINKS
========================================================= */

async function loadAdminLinks() {

    const box =
        $("adminLinks");


    if (!box)
        return;


    const {
        data,
        error
    } =
        await db
            .from("home_links")
            .select("*")
            .eq(
                "is_active",
                true
            )
            .order(
                "sort_order",
                {
                    ascending:
                        true
                }
            )
            .order(
                "created_at",
                {
                    ascending:
                        false
                }
            );


    if (error) {

        showError(
            error
        );

        return;

    }


    if (
        !data ||
        data.length === 0
    ) {

        box.innerHTML = `

            <div class="license-card">

                هنوز لینکی اضافه نشده.

            </div>

        `;

        return;

    }


    box.innerHTML =
        data
            .map(
                link => {

                    const image =
                        link.image_path;


                    return `

                        <div
                            class="home-link"
                            role="button"
                            tabindex="0"
                            onclick="
                                openHomeLink(
                                    '${escapeAttribute(
                                        link.target_url
                                    )}'
                                )
                            "
                            onkeydown="
                                if(event.key === 'Enter')
                                    openHomeLink(
                                        '${escapeAttribute(
                                            link.target_url
                                        )}'
                                    )
                            "
                        >

                            ${
                                image

                                ?

                                `

                                    <img
                                        src="${escapeAttribute(
                                            image
                                        )}"
                                        alt=""
                                    >

                                `

                                :

                                `

                                    <div
                                        style="
                                            height:160px;
                                            display:grid;
                                            place-items:center;
                                            font-size:45px;
                                        "
                                    >

                                        🔗

                                    </div>

                                `
                            }


                            <div class="home-link-content">

                                <strong>

                                    ${escapeHTML(
                                        link.title
                                    )}

                                </strong>


                                <p>

                                    ${escapeHTML(
                                        link.description ||
                                        ""
                                    )}

                                </p>

                            </div>

                        </div>

                    `;

                }
            )
            .join("");

}


/* =========================================================
   OPEN HOME LINK
========================================================= */

function openHomeLink(
    url
) {

    if (!url)
        return;


    try {

        const parsed =
            new URL(
                url
            );


        if (
            parsed.protocol !==
                "http:" &&
            parsed.protocol !==
                "https:"
        ) {

            toast(
                "لینک معتبر نیست."
            );

            return;

        }


        window.open(
            parsed.href,
            "_blank",
            "noopener,noreferrer"
        );

    } catch {

        toast(
            "لینک معتبر نیست."
        );

    }

}


/* =========================================================
   OPEN HOME LINK MODAL
========================================================= */

function openHomeLinkModal() {

    openModal(`

        <h2>
            ➕ لینک ویژه
        </h2>


        <input
            id="homeTitleInput"
            type="text"
            placeholder="عنوان"
            maxlength="200"
        >


        <input
            id="homeDescriptionInput"
            type="text"
            placeholder="توضیحات"
            maxlength="500"
        >


        <input
            id="homeUrlInput"
            type="url"
            placeholder="https://example.com"
        >


        <label>
            تصویر
        </label>


        <input
            id="homeImageInput"
            type="file"
            accept="image/*"
        >


        <button
            type="button"
            class="modal-submit"
            onclick="createHomeLink()"
        >

            انتشار

        </button>

    `);

}


/* =========================================================
   CREATE HOME LINK
========================================================= */

async function createHomeLink() {

    const admin =
        await isAdmin();


    if (!admin) {

        toast(
            "دسترسی ندارید."
        );

        return;

    }


    const title =
        $("homeTitleInput")
            ?.value
            ?.trim()
            || "";


    const description =
        $("homeDescriptionInput")
            ?.value
            ?.trim()
            || "";


    const url =
        $("homeUrlInput")
            ?.value
            ?.trim()
            || "";


    const image =
        $("homeImageInput")
            ?.files
            ?.item(0);


    if (!title ||
        !url) {

        toast(
            "عنوان و لینک لازم است."
        );

        return;

    }


    let parsedUrl;


    try {

        parsedUrl =
            new URL(
                url
            );

    } catch {

        toast(
            "لینک معتبر نیست."
        );

        return;

    }


    if (
        parsedUrl.protocol !==
            "http:" &&
        parsedUrl.protocol !==
            "https:"
    ) {

        toast(
            "فقط لینک http یا https مجاز است."
        );

        return;

    }


    let imagePath =
        null;


    if (image) {

        const safeName =
            safeFileName(
                image.name
            );


        imagePath =
            "home/" +
            randomId() +
            "-" +
            safeName;


        const {
            error
        } =
            await db.storage
                .from(
                    "home-images"
                )
                .upload(
                    imagePath,
                    image,
                    {

                        upsert:
                            false,

                        contentType:
                            image.type ||
                            "image/jpeg"

                    }
                );


        if (error) {

            showError(
                error
            );

            return;

        }

    }


    let publicImageUrl =
        null;


    if (imagePath) {

        const {
            data
        } =
            db.storage
                .from(
                    "home-images"
                )
                .getPublicUrl(
                    imagePath
                );


        publicImageUrl =
            data?.publicUrl ||
            null;

    }


    const {
        error
    } =
        await db
            .from("home_links")
            .insert({

                title,

                description,

                target_url:
                    parsedUrl.href,

                image_path:
                    publicImageUrl,

                sort_order:
                    0,

                is_active:
                    true

            });


    if (error) {

        if (imagePath) {

            await db.storage
                .from(
                    "home-images"
                )
                .remove([
                    imagePath
                ]);

        }


        showError(
            error
        );

        return;

    }


    closeModal();


    toast(
        "✅ لینک ویژه اضافه شد."
    );


    await loadAdminLinks();

}


/* =========================================================
   REALTIME - PUBLIC
========================================================= */

async function subscribePublic() {

    if (publicChannel) {

        try {

            await db.removeChannel(
                publicChannel
            );

        } catch {

        }


        publicChannel =
            null;

    }


    publicChannel =
        db
            .channel(
                "berost-public-chat-" +
                randomId()
            )
            .on(
                "postgres_changes",
                {

                    event:
                        "*",

                    schema:
                        "public",

                    table:
                        "public_chat_messages"

                },
                async () => {

                    await loadPublicChatWithoutSubscribe();

                }
            )
            .subscribe();

}


/* =========================================================
   PUBLIC CHAT WITHOUT RE-SUBSCRIBE
========================================================= */

async function loadPublicChatWithoutSubscribe() {

    const box =
        $("publicMessages");


    if (!box)
        return;


    const {
        data,
        error
    } =
        await db
            .from(
                "public_chat_messages"
            )
            .select(`
                id,
                user_id,
                content,
                created_at,
                profiles(
                    username,
                    display_name
                )
            `)
            .order(
                "created_at",
                {
                    ascending:
                        true
                }
            )
            .limit(150);


    if (error) {

        console.error(
            error
        );

        return;

    }


    const messages =
        await attachFilesToMessages(
            "public",
            data || []
        );


    renderMessages(
        box,
        messages
    );

}


/* =========================================================
   REALTIME - GROUP
========================================================= */

async function subscribeGroup() {

    if (!currentLicense)
        return;


    if (groupChannel) {

        try {

            await db.removeChannel(
                groupChannel
            );

        } catch {

        }


        groupChannel =
            null;

    }


    groupChannel =
        db
            .channel(
                "berost-group-" +
                currentLicense.id +
                "-" +
                randomId()
            )
            .on(
                "postgres_changes",
                {

                    event:
                        "*",

                    schema:
                        "public",

                    table:
                        "license_group_messages",

                    filter:
                        "license_id=eq." +
                        currentLicense.id

                },
                async () => {

                    await loadGroupMessages();

                }
            )
            .subscribe();

}


/* =========================================================
   REALTIME - PRIVATE
========================================================= */

async function subscribePrivate() {

    if (!currentLicense)
        return;


    if (privateChannel) {

        try {

            await db.removeChannel(
                privateChannel
            );

        } catch {

        }


        privateChannel =
            null;

    }


    privateChannel =
        db
            .channel(
                "berost-private-" +
                currentLicense.id +
                "-" +
                randomId()
            )
            .on(
                "postgres_changes",
                {

                    event:
                        "*",

                    schema:
                        "public",

                    table:
                        "private_messages",

                    filter:
                        "license_id=eq." +
                        currentLicense.id

                },
                async () => {

                    await loadPrivateMessages();

                }
            )
            .subscribe();

}


/* =========================================================
   CLEAN LICENSE REALTIME
========================================================= */

async function cleanupLicenseRealtime() {

    if (groupChannel) {

        try {

            await db.removeChannel(
                groupChannel
            );

        } catch {

        }


        groupChannel =
            null;

    }


    if (privateChannel) {

        try {

            await db.removeChannel(
                privateChannel
            );

        } catch {

        }


        privateChannel =
            null;

    }

}


/* =========================================================
   CLEAN ALL REALTIME
========================================================= */

async function cleanupRealtime() {

    if (publicChannel) {

        try {

            await db.removeChannel(
                publicChannel
            );

        } catch {

        }


        publicChannel =
            null;

    }


    await cleanupLicenseRealtime();

}


/* =========================================================
   MODAL
========================================================= */

function openModal(
    html
) {

    if (!$("modal"))
        return;


    if ($("modalBody")) {

        $("modalBody")
            .innerHTML =
                html;

    }


    $("modal")
        .hidden =
            false;


    setTimeout(
        () => {

            const firstInput =
                $("modalBody")
                    ?.querySelector(
                        "input, textarea, select"
                    );


            if (firstInput) {

                firstInput.focus();

            }

        },
        50
    );

}


function closeModal() {

    if (!$("modal"))
        return;


    $("modal")
        .hidden =
            true;


    if ($("modalBody")) {

        $("modalBody")
            .innerHTML =
                "";

    }

}


/* =========================================================
   TIC TAC TOE
========================================================= */

function renderTicTacToe() {

    document
        .querySelectorAll(
            ".tic-board button"
        )
        .forEach(
            button => {

                const index =
                    Number(
                        button.dataset.index
                    );


                button.textContent =
                    ticBoard[index] ||
                    "";

            }
        );

}


function resetTicTacToe() {

    ticBoard =
        Array(9).fill("");

    ticGameOver =
        false;

    ticBotThinking =
        false;


    setText(
        "ticStatus",
        "نوبت شما"
    );


    renderTicTacToe();

}


function ticWinner(
    board,
    player
) {

    return ticWins.some(
        line =>
            line.every(
                index =>
                    board[index] ===
                    player
            )
    );

}


/* =========================================================
   PERFECT MINIMAX BOT
========================================================= */

function ticMinimax(
    board,
    depth,
    maximizing
) {

    if (
        ticWinner(
            board,
            "O"
        )
    ) {

        return 10 - depth;

    }


    if (
        ticWinner(
            board,
            "X"
        )
    ) {

        return depth - 10;

    }


    if (
        !board.includes("")
    ) {

        return 0;

    }


    if (maximizing) {

        let best =
            -Infinity;


        for (
            let i = 0;
            i < 9;
            i++
        ) {

            if (
                board[i] === ""
            ) {

                board[i] =
                    "O";


                best =
                    Math.max(
                        best,
                        ticMinimax(
                            board,
                            depth + 1,
                            false
                        )
                    );


                board[i] =
                    "";

            }

        }


        return best;

    }


    let best =
        Infinity;


    for (
        let i = 0;
        i < 9;
        i++
    ) {

        if (
            board[i] === ""
        ) {

            board[i] =
                "X";


            best =
                Math.min(
                    best,
                    ticMinimax(
                        board,
                        depth + 1,
                        true
                    )
                );


            board[i] =
                "";

        }

    }


    return best;

}


/* =========================================================
   BOT MOVE
========================================================= */

function ticBotMove() {

    if (
        ticGameOver ||
        ticBotThinking
    )
        return;


    ticBotThinking =
        true;


    let bestScore =
        -Infinity;


    let bestMove =
        -1;


    for (
        let i = 0;
        i < 9;
        i++
    ) {

        if (
            ticBoard[i] === ""
        ) {

            ticBoard[i] =
                "O";


            const score =
                ticMinimax(
                    ticBoard,
                    0,
                    false
                );


            ticBoard[i] =
                "";


            if (
                score >
                bestScore
            ) {

                bestScore =
                    score;

                bestMove =
                    i;

            }

        }

    }


    if (
        bestMove >= 0
    ) {

        ticBoard[
            bestMove
        ] =
            "O";

    }


    renderTicTacToe();


    if (
        ticWinner(
            ticBoard,
            "O"
        )
    ) {

        setText(
            "ticStatus",
            "🤖 ربات برد."
        );


        ticGameOver =
            true;

        ticBotThinking =
            false;

        return;

    }


    if (
        !ticBoard.includes("")
    ) {

        setText(
            "ticStatus",
            "مساوی شد."
        );


        ticGameOver =
            true;

        ticBotThinking =
            false;

        return;

    }


    setText(
        "ticStatus",
        "نوبت شما"
    );


    ticBotThinking =
        false;

}


/* =========================================================
   TIC TAC TOE CLICK HANDLER
========================================================= */

document.addEventListener(
    "click",
    event => {

        const cell =
            event.target.closest(
                ".tic-board button"
            );


        if (!cell)
            return;


        const index =
            Number(
                cell.dataset.index
            );


        if (
            Number.isNaN(index)
        )
            return;


        if (
            ticGameOver ||
            ticBotThinking ||
            ticBoard[index]
        ) {

            return;

        }


        ticBoard[index] =
            "X";


        renderTicTacToe();


        if (
            ticWinner(
                ticBoard,
                "X"
            )
        ) {

            setText(
                "ticStatus",
                "🎉 شما بردید!"
            );


            ticGameOver =
                true;

            return;

        }


        if (
            !ticBoard.includes("")
        ) {

            setText(
                "ticStatus",
                "مساوی شد."
            );


            ticGameOver =
                true;

            return;

        }


        setText(
            "ticStatus",
            "🤖 ربات در حال فکر کردن..."
        );


        setTimeout(
            ticBotMove,
            250
        );

    }
);


/* =========================================================
   MODAL CLICK OUTSIDE
========================================================= */

document.addEventListener(
    "click",
    event => {

        const modal =
            $("modal");


        if (!modal)
            return;


        if (
            event.target ===
            modal
        ) {

            closeModal();

        }

    }
);


/* =========================================================
   ESCAPE CLOSE MODAL
========================================================= */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key ===
            "Escape"
        ) {

            if (
                $("modal") &&
                !$("modal").hidden
            ) {

                closeModal();

            }

        }

    }
);


/* =========================================================
   AUTH STATE CHANGE
========================================================= */

db.auth.onAuthStateChange(
    async (
        event,
        session
    ) => {

        /*
         * Avoid running a second complete
         * navigation during INITIAL_SESSION
         * while loadSession() is already doing it.
         */

        if (session) {

            currentUser =
                session.user;


            /*
             * Defer database calls outside the
             * auth callback to avoid Supabase
             * auth lock issues.
             */

            setTimeout(
                async () => {

                    try {

                        await ensureProfile();


                        if (
                            currentProfile
                        ) {

                            setText(
                                "currentUsername",
                                currentProfile.display_name ||
                                currentProfile.username ||
                                "کاربر"
                            );

                        }


                        showApp();

                    } catch (error) {

                        showError(
                            error
                        );

                    }

                },
                0
            );

        } else {

            currentUser =
                null;

            currentProfile =
                null;

            currentLicense =
                null;

            currentFolder =
                null;

            privateTargetUser =
                null;


            await cleanupRealtime();


            showAuth();

        }

    }
);


/* =========================================================
   DOM READY
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        /*
         * Make sure auth screen exists.
         */

        if (
            $("authPage") &&
            $("appPage")
        ) {

            showAuth();

        }


        /*
         * Close modal if there is a close button.
         */

        const modalClose =
            document.querySelector(
                "[data-close-modal]"
            );


        if (modalClose) {

            modalClose.addEventListener(
                "click",
                closeModal
            );

        }


        /*
         * Initial session.
         */

        await loadSession();


        /*
         * Initialize game.
         */

        resetTicTacToe();

    }
);


/* =========================================================
   OPTIONAL GLOBAL FUNCTIONS
   HTML onclick can access these because
   they are declared at top level.
========================================================= */

window.showLogin =
    showLogin;

window.showRegister =
    showRegister;

window.register =
    register;

window.login =
    login;

window.logout =
    logout;

window.goHome =
    goHome;

window.goMyLicenses =
    goMyLicenses;

window.goEntertainment =
    goEntertainment;

window.joinLicense =
    joinLicense;

window.openCreateLicenseModal =
    openCreateLicenseModal;

window.createLicense =
    createLicense;

window.openLicense =
    openLicense;

window.openLicenseTab =
    openLicenseTab;

window.openFolder =
    openFolder;

window.goParentFolder =
    goParentFolder;

window.openVideoModal =
    openVideoModal;

window.uploadVideo =
    uploadVideo;

window.playVideo =
    playVideo;

window.closePlayer =
    closePlayer;

window.openFolderModal =
    openFolderModal;

window.createFolder =
    createFolder;

window.openShortModal =
    openShortModal;

window.uploadShort =
    uploadShort;

window.playShort =
    playShort;

window.sendPublicMessage =
    sendPublicMessage;

window.sendGroupMessage =
    sendGroupMessage;

window.sendPrivateMessage =
    sendPrivateMessage;

window.openChatFile =
    openChatFile;

window.openHomeLinkModal =
    openHomeLinkModal;

window.createHomeLink =
    createHomeLink;

window.openHomeLink =
    openHomeLink;

window.clearAllChats =
    clearAllChats;

window.closeModal =
    closeModal;

window.resetTicTacToe =
    resetTicTacToe;

window.changePrivateTarget =
    changePrivateTarget;


/* =========================================================
   END OF BEROST PLAYER
========================================================= */