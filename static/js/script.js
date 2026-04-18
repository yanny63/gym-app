const langs_btn = document.querySelector(".langs-btn")
const lang_options = document.querySelector(".langs")

function langs_open() {
    lang_options.classList.remove('not-visible')
}
function langs_close() {
    lang_options.classList.add('not-visible')
}


langs_btn.addEventListener("mouseover", langs_open)

langs_btn.addEventListener("mouseleave", () => {
    if (!lang_options.matches(":hover") && !langs_btn.matches(":hover")) {
        langs_close()
    }
})
lang_options.addEventListener("mouseleave", () => {
    if (!langs_btn.matches(":hover") && !lang_options.matches(":hover")) {
        langs_close()
    }
})
