const savedLang = localStorage.getItem("lang")
const browserLang = navigator.language.split("-")[0]

i18next.use(i18nextHttpBackend).init({
    lng: savedLang || browserLang,
    debug: false,
    ns: ["common", "home", 'register', 'login', 'timer', 'calculator'],
    defaultNS: "common",
    backend: {
        loadPath: "/static/langs/{{lng}}/{{ns}}.json"
    },
    fallbackLng: "en"
}, 
function() {
    updateContent()
})

function updateContent() {
    document.querySelectorAll("[data-i18n]").forEach(e => {
        const key = e.getAttribute("data-i18n")
        e.textContent = i18next.t(key)
    })
    document.querySelectorAll("[data-i18n-placeholder]").forEach(e => {
        const key = e.getAttribute("data-i18n-placeholder")
        e.placeholder = i18next.t(key)
    })
}

function changeLanguage(lang) {
    localStorage.setItem("lang", lang)
    i18next.changeLanguage(lang, () => {
        updateContent()
    })
}